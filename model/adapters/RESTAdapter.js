/**
 * @class ExtMVC.model.plugin.adapter.RESTAdapter
 * @extends ExtMVC.model.plugin.adapter.Abstract
 * An adapter which hooks into a RESTful server side API for its data storage. This is the recommended
 * adapter to use on MVC applications.
 * <h2>Usage</h2>
 * Say we have a User model defined:
<pre><code>
  ExtMVC.model.define("User", {
    fields: [{name: 'id', type: 'int'}, {name: 'name', type: 'string'}]
  });
  var user = new User({id: 1, name: 'Saul Tigh'});
</code></pre>
 * If this model uses the REST Adapter, the following methods are made available to it. Each fires the AJAX request
 * indicated in the comment next to it:
<pre><code>
  user.destroy(); //DELETE /users/1
  user.save(); //PUT /users/1 with {id: 1, name: 'Saul Tigh'} as the request payload
  user.update({name: 'Bill Adama'})l //PUT /users/1/ with {id: 1, name: 'Bill Adama'} as the request payload
</code></pre>
 * In addition, the following methods are made available to the User class object:
 <pre><code>
User.destroy(10); //DELETE /users/1

User.find(10, {
  success: function(instance) {
    console.log("Asyncronously loaded User 10 from /users/10 using GET")
  },
  failure: function() {
    console.log('Called if user 10 could not be found');
  }
}); //GET /users/10

User.create({name: 'Gaius Baltar'}, {
  success: function(instance) {
    console.log('Gaius was created');
  },
  failure: function(errors) {
    console.log('Called if Gaius could not be created');
    console.log(errors);
  }
}); //POST /users

User.build({name: 'Felix Gaeta'}); //same as new User({name: 'Felix Gaeta'});
</code></pre>
 */
ExtMVC.model.plugin.adapter.RESTAdapter = Ext.extend(ExtMVC.model.plugin.adapter.Abstract, {
  
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
    
    var successFn = options.success || Ext.emptyFn,
        failureFn = options.failure || Ext.emptyFn;
        
    delete options.success; delete options.failure;
    
    Ext.Ajax.request(
      Ext.apply({
        url    : this.instanceUrl(instance),
        method : instance.newRecord() ? this.createMethod : this.updateMethod,
        params : this.buildPostData(instance),
        
        success: function(instance, userCallback, scope) {
          scope = scope || this;
          
          return function(response, options) {
            var jsonPath = instance.modelName.underscore(),
                jsonData = Ext.decode(response.responseText)[jsonPath];
            
            for (var key in jsonData) {
              instance.set(key, jsonData[key]);
            }
            
            userCallback.call(this, instance);
          };
        }(instance, successFn, options.scope)
      }, options)
    );
  },
  
  /**
   * Callback for save AJAX request. By default this reads server response data and populates the instance
   * if the request was successful, adds errors if not
   * @private
   */
  afterSave: function() {
    
  },
  
  /**
   * Performs the actual find request.
   * @private
   * @param {Object} conditions An object containing find conditions. If a primaryKey is set this will be used
   * to build the url for that particular instance, otherwise the collection url will be used
   * @param {Object} options Callbacks (use callback, success and failure)
   */
  doFind: function(conditions, options, constructor) {
    conditions = conditions || {}; options = options || {};
      
    //if primary key is given, perform a single search
    var single = (conditions.primaryKey !== undefined),
        url    = options.url || this.findUrl(conditions, constructor);
    
    Ext.applyIf(options, {
      conditions: conditions,
      scope     : this
    });
    
    var findMethod = single ? this.doSingleFind : this.doCollectionFind;
    return findMethod.call(this, url, options, constructor);
  },
  
  /**
   * Performs an HTTP DELETE request using Ext.Ajax.request
   * @private
   * @param {ExtMVC.model.Base} instance The model instance to destroy
   * @param {Object} options Options object passed to Ext.Ajax.request
   * @return {Number} The Ajax transaction ID
   */
  doDestroy: function(instance, options, constructor) {
    var options = options || {};
    
    if (typeof instance == 'undefined') throw new Error('No instance provided to REST Adapter destroy');
    
    if (!(instance instanceof Ext.data.Record)) {
      var id = parseInt(instance, 10);
      
      instance = new constructor();
      instance.set(constructor.prototype.primaryKey, id);
    }
    
    //if we were passed a success function, save it here so that we can call it with the instance later
    var successFn = options.success || Ext.emptyFn;
    delete options.success;
    
    return Ext.Ajax.request(
      Ext.applyIf(options, {
        method: this.destroyMethod,
        url:    this.instanceUrl(instance),
        success: function() {
          successFn.call(options.scope || this, instance);
        }
      })
    );
  },
  
  /**
   * Loads a single instance of a model via an Ext.Ajax.request
   * @private
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
   * @private
   * @param {String} url The url to load the collection from
   * @param {Object} options Options passed to the Store constructor
   * @param {Function} constructor The constructor function used to instantiate the model instance
   * @return {Ext.data.Store} A Store with the appropriate configuration to load this collection
   */
  doCollectionFind: function(url, options, constructor) {
    Ext.applyIf(options, this.storeConfig);
    
    if (options.conditions != undefined) {
      Ext.applyIf(options, {
        baseParams: options.conditions
      });
    }
    
    return new Ext.data.Store(
      Ext.applyIf(options, {
        reader    : constructor.prototype.getReader(),
        proxy     : new this.proxyType(this.buildProxyConfig(url))
      })
    );
  },
  
  /**
   * Calculates the unique REST URL for a given model instance
   * @param {ExtMVC.model.Base} instance The model instance
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
   * @param {ExtMVC.model.Base} instance The models instance to build post data for
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