/**
 * @class ExtMVC.Model.plugin.adapter.RESTAdapter
 * @extends ExtMVC.Model.plugin.adapter.Abstract
 * An adapter which hooks into a RESTful server side API for its data storage
 */
ExtMVC.Model.plugin.adapter.RESTAdapter = Ext.extend(ExtMVC.Model.plugin.adapter.Abstract, {
  
  /**
   * @property createMethod
   * @type String
   * The HTTP verb to use when creating a new instance (defaults to 'POST')
   */
  createMethod: 'POST',
  
  /**
   * @property readMethod
   * @type String
   * The HTTP verb to use when reading data from the server (e.g. in find requests). Defaults to 'GET'
   */
  readMethod: 'GET',

  /**
   * @property updateMethod
   * @type String
   * The HTTP verb to use when updating an existing instance (defaults to 'PUT')
   */
  updateMethod: 'PUT',
  
  /**
   * @property destroyMethod
   * @type String
   * The HTTP verb to use when destroying an instance (defaults to 'DELETE')
   */
  destroyMethod: 'DELETE',
  
  /**
   * @property proxyType
   * @type Function
   * The type of Data Proxy to use (defaults to Ext.data.HttpProxy)
   */
  proxyType: Ext.data.HttpProxy,
  
  /**
   * Performs the actual save request.  Uses POST for new records, PUT when updating existing ones
   */
  doSave: function(instance, options) {
    if (typeof instance == 'undefined') throw new Error('No instance provided to REST Adapter save');
    options = options || {};
    
    Ext.Ajax.request(
      Ext.applyIf(options, {
        url:    this.instanceUrl(instance),
        method: instance.newRecord() ? this.createMethod : this.updateMethod,
        params: this.buildPostData(instance)
      })
    );
  },
  
  /**
   * Performs the actual find request.
   * @param {Object} conditions An object containing find conditions. If a primaryKey is set this will be used
   * to build the url for that particular instance, otherwise the collection url will be used
   * @param {Object} options Callbacks (use callback, success and failure)
   */
  doFind: function(conditions, options, constructor) {
    conditions = conditions || {}; options = options || {};
      
    //if primary key is given, perform a single search
    var single = (conditions.primaryKey !== undefined),
        url    = this.findUrl(conditions, constructor);
    
    Ext.applyIf(options, {
      conditions: conditions,
      scope     : this
    });
    
    var findMethod = single ? this.doSingleFind : this.doCollectionFind;
    return findMethod.call(this, url, options, constructor);
  },
  
  /**
   * Performs an HTTP DELETE request using Ext.Ajax.request
   * @param {ExtMVC.Model.Base} instance The model instance to destroy
   * @param {Object} options Options object passed to Ext.Ajax.request
   * @return {Number} The Ajax transaction ID
   */
  doDestroy: function(instance, options) {
    if (typeof instance == 'undefined') throw new Error('No instance provided to REST Adapter destroy');
    
    return Ext.Ajax.request(
      Ext.applyIf(options || {}, {
        method: this.destroyMethod,
        url:    this.instanceUrl(instance)
      })
    );
  },
  
  /**
   * Loads a single instance of a model via an Ext.Ajax.request
   * @param {String} url The url to load from
   * @param {Object} options Options passed to Ext.Ajax.request
   * @param {Function} constructor The constructor function used to instantiate the model instance
   * @return {Number} The transaction ID of the Ext.Ajax.request
   */
  doSingleFind: function(url, options, constructor) {
    //store references to user callbacks as we need to overwrite them in the request
    var optionsCallback = options.callback, 
        successCallback = options.success, 
        failureCallback = options.failure;
    
    delete options.callback; delete options.success; delete options.failure;
    
    //need to make a local reference here as scope inside the Ext.data.Request block may not be 'this'
    var decodeFunction = this.decodeSingleLoadResponse;
    
    //helper function to cut down repetition in Ajax request callback
    var callIf = function(callback, args) {
      if (typeof callback == 'function') callback.apply(options.scope, args);
    };
     
    Ext.Ajax.request(
      Ext.apply(options, {
        callback: function(opts, success, response) {
          if (success === true) {
            var instance = new constructor(decodeFunction(response.responseText, constructor));

            callIf(successCallback, [instance, opts, response]);
          } else callIf(failureCallback, arguments);

          //call the generic callback passed into options
          callIf(optionsCallback, arguments);
        }
      }, this.buildProxyConfig(url))
    );
  },
  
  /**
   * @property storeConfig
   * @type Object
   * Default properties assigned to the Ext.data.Store used in find requests
   */
  storeConfig: {
    autoLoad  : true,
    remoteSort: false
  },
  
  /**
   * Specialised find for dealing with collections. Returns an Ext.data.Store
   * @param {String} url The url to load the collection from
   * @param {Object} options Options passed to the Store constructor
   * @param {Function} constructor The constructor function used to instantiate the model instance
   * @return {Ext.data.Store} A Store with the appropriate configuration to load this collection
   */
  doCollectionFind: function(url, options, constructor) {
    Ext.applyIf(options, this.storeConfig);
    
    return new Ext.data.Store(
      Ext.applyIf(options, {
        reader    : constructor.prototype.getReader(),
        proxy     : new this.proxyType(this.buildProxyConfig(url))
      })
    );
  },
  
  /**
   * Calculates the unique REST URL for a given model instance
   * @param {ExtMVC.Model.Base} instance The model instance
   * @return {String} The url associated with this instance
   */
  instanceUrl: function(instance) {
    if (instance.newRecord()) {
      return String.format("/{0}", instance.tableName);
    } else {
      return String.format("/{0}/{1}", instance.tableName, instance.get(instance.primaryKey));
    }
  },
  
  /**
   * Calculates the REST URL for a given model collection. By default this just returns / followed by the table name
   * @param {Function} constructor The model constructor function
   */
  collectionUrl: function(constructor) {
    return String.format("/{0}", constructor.prototype.tableName);
  },
  
  /**
   * Returns configuration data to be used by the DataProxy when loading records. Override to provide your own config
   * @param {String} url The url the proxy should use. This is typically calculated elsewhere so must be provided
   * @return {Object} Configuration for the proxy
   */
  buildProxyConfig: function(url) {
    return {
      url:    url,
      method: this.readMethod
    };
  },
  
  /**
   * Creates a params object suitable for sending as POST data to the server
   * @param {ExtMVC.Model.Base} instance The models instance to build post data for
   * @return {Object} Params object to send to the server
   */
  buildPostData: function(instance) {
    var data   = {},
        prefix = instance.modelName.underscore();
    
    for (key in instance.data) {
      data[prefix + '[' + key + ']'] = instance.data[key];
    }
    
    return data;
  },
  
  /**
   * Decodes response text received from the server as the result of requesting data for a single record.
   * By default this expects the data to be in the form {"model_name": {"key": "value", "key2", "value 2"}}
   * and would return an object like {"key": "value", "key2", "value 2"}
   * @param {String} responseText The raw response text
   * @param {Function} constructor The constructor used to construct model instances.  Useful for access to the prototype
   * @return {Object} Decoded data suitable for use in a model constructor
   */
  decodeSingleLoadResponse: function(responseText, constructor) {
    var tname = constructor.prototype.tableName;
    return Ext.decode(responseText)[tname];
  },
  
  //private
  findUrl: function(conditions, constructor) {
    if (typeof(conditions) == 'object' && conditions.primaryKey) {
      //find by ID
      var instance = new constructor({});
      instance.set(instance.primaryKey, conditions.primaryKey);
      delete conditions.primaryKey;
      
      return this.instanceUrl(instance);
    } else {
      //find by conditions
      return this.collectionUrl(constructor);
    }
  }
});


// Ext.ns('ExtMVC.Model.Adapter');
// 
// (function() {
//   var A = ExtMVC.Model.Adapter;
//   
//   A.REST = {
//     initialize: function(model) {
//       // console.log('initialising REST adapter');
//       
//       A.Abstract.initialize(model);
//     },
//     
//     classMethods: {
//       /**
//        * Generic find method, accepts many forms:
//        * find(10, opts)      // equivalent to findById(10, opts)
//        * find('all', opts)   // equivalent to findAll(opts)
//        * find('first', opts) // equivalent to findById(1, opts)
//        */
//       find: function(what, options) {
//         var id;
//         if (id = parseInt(what, 10)) {
//           return this.findById(id, options);
//         };
//         
//         switch(what) {
//           case 'first': return this.findById(1, options);
//           default     : return this.findAll(options);
//         }
//       },
//       
//       /**
//        * Shortcut for findByField('id', 1, {})
//        */
//       findById: function(id, options) {
//         // return this.findByField('id', id, options);
//         var options = options || {};
//         
//         // TODO
//         // Old code before below fix
//         // Ext.applyIf(options, {
//         //   url: this.singleDataUrl(id)
//         // });
//         
//         // This needs to be done as url is set as 'null' in
//         // crudcontroller.js line 133.
//         // this is temp n00b hack which teh master can fix. can't use apply either.
//         if (options.url == null) {
//           options.url = this.singleDataUrl(id);
//         };
//         
//         return this.performFindRequest(options);
//       },
//           
//       /**
//        * Performs a custom find on a given field and value pair.  e.g.:
//        * User.findByField('email', 'adama@bsg.net') creates the following request:
//        * GET /users?email=adama@bsg.net
//        * And creates an array of User objects based on the server's response
//        * @param {String} fieldName The name of the field to search on
//        * @param {String/Number} matcher The field value to search for
//        * @param {Object} options An object which should contain at least a success function, which will
//        * be passed an array of instantiated model objects
//        */
//       findByField: function(fieldName, matcher, options) {
//         var fieldName = fieldName || 'id';
//         var options   = options || {};
//         
//         options.conditions = options.conditions || [];
//         options.conditions.push({key: fieldName, value: matcher, comparator: '='});
//                 
//         return this.performFindRequest(options);
//       },
//       
//       findAll: function(options) {
//         var options = options || {};
//         
//         var url = options.url ? this.namespacedUrl(options.url) : this.collectionDataUrl();
//         
//         var proxyOpts = {};
//         Ext.apply(proxyOpts, this.proxyConfig, {
//           url:    url,
//           method: "GET"
//         });
//         
//         return new Ext.data.Store(
//           Ext.applyIf(options, {
//             autoLoad:   true,
//             remoteSort: false,
//             proxy:      new this.proxyType(proxyOpts),
//             reader:     this.getReader()
//           })
//         );
//       },
//       
//       /**
//        * Private, internal methods below here.  Not expected to be useful by anything else but
//        * are left public for now just in case
//        */
//        
//       /**
//        * Underlying function which handles all find requests.  Private
//        */
//       performFindRequest: function(options) {
//         var options = options || {};
//         Ext.applyIf(options, {
//           scope:   this,
//           url:     this.collectionDataUrl(),
//           method:  'GET',
//           success: Ext.emptyFn,
//           failure: Ext.emptyFn
//         });
//         
//         //keep a handle on user-defined callbacks
//         var callbacks = {
//           successFn: options.success,
//           failureFn: options.failure
//         };
//         
//         // FIXME fix scope issue
//         // For some reason the scope isnt correct on this?
//         // cant figure out why. scope is set on the applyIf block so it should work..
//         var scope = this;
//         
//         options.success = function(response, opts) {
//           scope.parseSingleLoadResponse(response, opts, callbacks);
//         };
//         
//         /**
//          * Build params variable from condition options.  Params should always be a string here
//          * as we're dealing in GET requests only for a find
//          */
//         var params = options.params || '';
//         if (options.conditions && options.conditions[0]) {
//           for (var i=0; i < options.conditions.length; i++) {
//             var cond = options.conditions[i];
//             params += String.format("{0}{1}{2}", cond['key'], (cond['comparator'] || '='), cond['value']);
//           };
//           
//           delete options.conditions;
//         };
//         options.params = params;
// 
//         return Ext.Ajax.request(options);
//       },
//       
//       /**
//        * @property urlExtension
//        * @type String
//        * Extension appended to the end of all generated urls (e.g. '.js').  Defaults to blank
//        */
//       urlExtension: '',
// 
//       /**
//        * @property urlNamespace
//        * @type String
//        * Default url namespace prepended to all generated urls (e.g. '/admin').  Defaults to blank
//        */
//       urlNamespace: '',
//       
//       /**
//        * @property port
//        * @type Number
//        * The web server port to contact (defaults to 80).  Requires host to be set also
//        */
//       port: 80,
//       
//       /**
//        * @property host
//        * @type String
//        * The hostname of the server to contact (defaults to an empty string)
//        */
//       host: "",
//       
//       /**
//        * @property proxyType
//        * @type Function
//        * A reference to the DataProxy implementation to use for this model (Defaults to Ext.data.HttpProxy)
//        */
//       proxyType: Ext.data.HttpProxy,
//       
//       /**
//        * @property proxyConfig
//        * @type Object
//        * Config to pass to the DataProxy when it is created (e.g. use this to set callbackParam on ScriptTagProxy, or similar)
//        */
//       proxyConfig: {},
//       
//       /**
//        * Called as the 'success' method to any single find operation (e.g. findById).
//        * The default implementation will parse the response into a model instance and then fire your own success of failure
//        * functions as provided to findById.  You can override this if you need to do anything different here, for example
//        * if you are loading via a script tag proxy with a callback containing the response
//        * @param {String} response The raw text of the response
//        * @param {Object} options The options that were passed to the Ext.Ajax.request
//        * @param {Object} callbacks An object containing a success function and a failure function, which should be called as appropriate
//        */
//       parseSingleLoadResponse: function(response, options, callbacks) {
//         var m = this.getReader().read(response);
//         if (m && m.records[0]) {
//           m.records[0].newRecord = false;
//           callbacks.successFn.call(options.scope, m.records[0]);
//         } else {
//           callbacks.failureFn.call(options.scope, response);
//         };
//       },
//       
//       /**
//        * URL to retrieve a JSON representation of this model from
//        */
//       singleDataUrl : function(id) {
//         return this.namespacedUrl(String.format("{0}/{1}", this.urlName, id));
//       },
//   
//       /**
//        * URL to retrieve a JSON representation of the collection of this model from
//        * This would typically return the first page of results (see {@link #collectionStore})
//        */
//       collectionDataUrl : function() {
//         return this.namespacedUrl(this.urlName);
//       },
//   
//       /**
//        * URL to retrieve a tree representation of this model from (in JSON format)
//        * This is used when populating most of the trees in ExtMVC, though
//        * only applies to models which can be representated as trees
//        */
//       treeUrl: function() {
//         return this.namespacedUrl(String.format("{0}/tree", this.urlName));
//       },
//   
//       /**
//        * URL to post details of a drag/drop reorder operation to.  When reordering a tree
//        * for a given model, this url is called immediately after the drag event with the
//        * new configuration
//        * TODO: Provide more info/an example here
//        */
//       treeReorderUrl: function() {
//         return this.namespacedUrl(String.format("{0}/reorder/{1}", this.urlName, this.data.id));
//       },
//   
//       /**
//        * Provides a namespaced url for a generic url segment.  Wraps the segment in this.urlNamespace and this.urlExtension
//        * @param {String} url The url to wrap
//        * @returns {String} The namespaced URL
//        */
//       namespacedUrl: function(url) {
//         url = url.replace(/^\//, ""); //remove any leading slashes
//         return(String.format("{0}{1}/{2}{3}", this.hostName(), this.urlNamespace, url, this.urlExtension));
//       },
//       
//       /**
//        * Builds the hostname if host and optionally port are set
//        * @return {String} The host name including port, if different from port 80
//        */
//       hostName: function() {
//         var p = this.port == 80 ? '' : this.port.toString();
//         
//         if (this.host == "") {
//           return "";
//         } else {
//           return this.port == 80 ? this.host : String.format("{0}:{1}", this.host, this.port);
//         };
//       }
//     },
//     
//     instanceMethods: {
//       /**
//        * Saves this model instance to the server.
//        * @param {Object} options An object passed through to Ext.Ajax.request.  The success option is a special case,
//        * and is called with the newly instantiated model instead of the usual (response, options) signature
//        */
//       save: function(options) {
//         var options = options || {};
//         
//         if (options.performValidations === true) {
//           //TODO: tie in validations here
//         };
//         
//         //keep a reference to this record for use in the success and failure functions below
//         var record = this;
//         
//         //set a _method param to fake a PUT request (used by Rails)
//         var params = options.params || this.namespaceFields();
//         if (!this.newRecord) { params["_method"] = 'put'; }
//         delete options.params;
//         
//         //if the user passes success and/or failure functions, keep a reference to them to allow us to do some pre-processing
//         var userSuccessFunction = options.success || Ext.emptyFn;
//         var userFailureFunction = options.failure || Ext.emptyFn;
//         delete options.success; delete options.failure;
//         
//         //function to call if Ext.Ajax.request is successful
//         options.success = function(response) {
//           //definitely not a new record any more
//           record.newRecord = false;
//           
//           userSuccessFunction.call(options.scope || record, record, response);
//         };
//         
//         //function to call if Ext.Ajax.request fails
//         options.failure = function(response) {
//           //parse any errors sent back from the server
//           record.readErrors(response.responseText);
//           
//           userFailureFunction.call(options.scope || record, record, response);
//         };
//         
//         //do this here as the scope in the block below is not always going to be 'this'
//         var url = this.url();
//         
//         Ext.applyIf(options, {
//           // url:     url, url == null sometimes so this doesnt work
//           method:  'POST',
//           params:  params
//         });
//         
//         //fix for the above
//         if (options.url == null) {
//           options.url = url;
//         };
//         
//         Ext.Ajax.request(options);
//       },
//       
//       /**
//        * Updates the model instance and saves it.  Use setValues({... new attrs ...}) to change attributes without saving
//        * @param {Object} updatedAttributes An object with any updated attributes to apply to this instance
//        * @param {Object} saveOptions An object with save options, such as url, callback, success, failure etc.  Passed straight through to save()
//        */
//       update: function(updatedAttributes, saveOptions) {
//         updatedAttributes = updatedAttributes || {};
//         saveOptions = saveOptions || {};
//         
//         this.setValues(updatedAttributes);
//         this.save(saveOptions);
//       },
//       
//       reload: function() {
//         console.log('reloading');
//       },
//       
//       destroy: function(options) {
//         var options = options || {};
//         
//         Ext.Ajax.request(
//           Ext.applyIf(options, {
//             url:    this.url(),
//             method: 'post',
//             params: "_method=delete"
//           })
//         );
//       },
//       
//       /**
//        * Namespaces fields within the modelName string, taking into account mappings.  For example, a model like:
//        * 
//        * modelName: 'user',
//        * fields: [
//        *   {name: 'first_name', type: 'string'},
//        *   {name: 'last_name',  type: 'string', mapping: 'last'}
//        * ]
//        * 
//        * Will be decoded to an object like:
//        * 
//        * {
//        *   'user[first_name]': //whatever is in this.data.first_name
//        *   'user[last]':       //whatever is in this.data.last_name
//        * }
//        *
//        * Note especially that the mapping is used in the key where present.  This is to ensure that mappings work both
//        * ways, so in the example above the server is sending a key called last, which we convert into last_name.  When we
//        * send data back to the server, we convert last_name back to last.
//        */
//       namespaceFields: function() {
//         var fields    = this.fields;
//         var namespace = this.modelName;
//         
//         var nsfields = {};
//         
//         for (var i=0; i < fields.length; i++) {
//           var item = fields.items[i];
//           
//           //don't send virtual fields back to the server
//           if (item.virtual) {continue;}
//           
//           nsfields[String.format("{0}[{1}]", namespace.toLowerCase(), item.mapping || item.name)] = this.data[item.name];
//         };
//         
//         //not sure why we ever needed this... 
//         // for (f in fields) {
//         //   nsfields[String.format("{0}[{1}]", namespace.toLowerCase(), this.data[f.name])] = fields.items[f];
//         // }
//         
//         return nsfields;
//       }
//     }
//   };
// })();
// 
// ExtMVC.Model.AdapterManager.register('REST', ExtMVC.Model.Adapter.REST);