/**
 * Data adapter to map Kohive models to the various Kohive urls
 * @class ExtMVC.model.KohiveAdapter
 * @ignore
 */
ExtMVC.model.KohiveAdapter = {
  
  instanceMethods: {
    /**
     * Saves this record.  Performs validations first unless you pass false as the single argument
     */
    save: function(options) {
      // Get the options success and failure methods so we
      // can call them later on
      var optionsSuccess = options.success || function(){};
      var optionsFailure = options.failure || function(){};
      
      /**
       * Success method which is called when the Ajax request comes back with no problems.
       * We must check if there are any validation errors
       * @param {Object} response Response object returned
       */
      var success = function(response){
        // Get the value of the success attribute so we can check if it has errors or not
        // We must get the responseXML as DomQuery needs it to work
        var isValid = Ext.DomQuery.selectNode('createHive', response.responseXML).getAttribute('success');
        
        // Now lets check if it has errors
        if(isValid == 'false'){
          // Get the validation message and return it
          var validationMsg = Ext.DomQuery.selectValue('createHive > message', response.responseXML);
          
          // Call the original failure method and pass the validation message to it
          optionsFailure(validationMsg);
          
          return;
        }
        
        // Call the original success function
        optionsSuccess();
      };
      
      /**
       * Failure method which is called when the Ajax request fails
       * @param {Object} response Returned response
       */
      var failure = function(response){
        console.log('Failure');
      };
      
      // Overwrite old success and failure methods
      options.success = success;
      options.failure = failure;
      
      // Ajax request
      Ext.Ajax.request(
        Ext.applyIf(options || {}, {
          url:     this.url(),
          method:  'post',
          params:  ExtMVC.model.namespaceFields(this.data, this.modelName)
        })  
      );
    }
  },
  
  classMethods: {
    /**
     * Deletes a specified object
     * @param {Number} id The ID of the hive you want to delete/destroy
     */
    destroy: function(id) {
      if(!id){
        return;
      }
      
      // Method which is called when the ajax request succeeds
      var requestSuccess = function(response){
        console.log('success');
      };
      // Method which is called when the ajax request fails
      var requestFailure = function(response){
        console.log('failure');
      };
      
      return Ext.Ajax.request({
        url:     this.singleDataUrl(id),
        method:  'post',
        params:  {
          _method: 'DELETE'
        },
        success: requestSuccess,
        failure: requestFailure
      });
    },
    
    /**
     * Returns an Ext.data.Store or a instantiation of a Model subclass, depending on the argument
     * @param {number/object} args The numerical ID of the object to find, or an object which is passed as params to the Ext.data.Store
     * @param {object} storeOptions Config object passed directly to the Ext.data.Store which is returned
     * @return {Ext.data.Store} An Ext.data.Store instance with the relevant store options and query options
     */
    find: function(args, storeOptions) {        
      //if we're given a number here we are just finding by ID,
      //which will just return an instantiation of that object
      if (typeof args == 'number' || typeof args == 'string') {
        return this.findById(args);
      } else {
        return new Ext.data.Store(
          Ext.applyIf(storeOptions || {}, {
            autoLoad:   args || true,
            remoteSort: true,
            url:        this.collectionDataUrl(),
            reader:     this.getReader()
          })
        );
      };
    },
    
    /**
     * Finds all objects of this model.  Convenience method for this.find with an empty first argument
     * @param {object} storeOptions Config object passed directly to the Ext.data.Store which is returned
     * @return {Ext.data.Store} An Ext.data.Store instance with the relevant store options
     */
    findAll: function(storeOptions) {
      return this.find({}, storeOptions);
    },
    
    /**
     * Finds the model by its ID.  Returns an ExtMVC.model subclass instantiation
     * @param {Number} id The ID of the model to find
     */
    findById: function(id, options) {
      var options = Ext.applyIf(options || {}, {
        loadSuccess: Ext.emptyFn,
        loadFailure: Ext.emptyFn,
        scope:       this
      });
      
      var reader      = this.getReader();
      var constructor = this;
      
      //build params variable from condition options.  Params should always be a string here
      //as we're dealing in GET requests only for a find
      var params = options.params || '';
      if (options.conditions && options.conditions[0]) {
        for (var i=0; i < options.conditions.length; i++) {
          //set = as the default comparator
          var cond = Ext.apply({ comparator: '=' }, options.conditions[i]);
          
          params += String.format("{0}{1}{2}", cond['key'], cond['comparator'], cond['value']);
        };
        
        delete options.conditions;
      };
      
      
      return Ext.Ajax.request(
        Ext.applyIf(options || {}, {
          method: 'GET',
          url:    this.singleDataUrl(id),
          scope:  this,
          params: params,
          success: function(response, opts) {
            var m = reader.read(response);
            if (m && m.records[0]) {
              //FIXME: this is not great... we're instantiating two objects here, and both
              //basically do the same job.  Would be better to instantiate the model object
              //directly rather than as the result of the getReader().read method
              options.loadSuccess.call(options.scope, new constructor(m.records[0].data));
            } else {
              options.loadFailure.call(options.scope, response);
            };
          },
          failure: function(response, opts) {
            options.loadFailure.call(options.scope, response);
          }
        })
      );
    },
    
    /**
     * Extension appended to the end of all generated urls (e.g. '.js').  Defaults to blank
     */
    urlExtension: '',
    
    /**
     * Default url namespace prepended to all generated urls (e.g. '/admin').  Defaults to blank
     */
    urlNamespace: '',
    
    /**
     * URL to retrieve a JSON representation of this model from
     */
    singleDataUrl : function(id) {
      return this.namespacedUrl(String.format("{0}/{1}", this.urlName, id));
    },

    /**
     * URL to retrieve a JSON representation of the collection of this model from
     * This would typically return the first page of results (see {@link #collectionStore})
     */
    collectionDataUrl : function() {
      return this.namespacedUrl(this.urlName);
    },

    /**
     * URL to retrieve a tree representation of this model from (in JSON format)
     * This is used when populating most of the trees in ExtMVC, though
     * only applies to models which can be representated as trees
     */
    treeUrl: function() {
      return this.namespacedUrl(String.format("{0}/tree", this.urlName));
    },

    /**
     * URL to post details of a drag/drop reorder operation to.  When reordering a tree
     * for a given model, this url is called immediately after the drag event with the
     * new configuration
     * TODO: Provide more info/an example here
     */
    treeReorderUrl: function() {
      return this.namespacedUrl(String.format("{0}/reorder/{1}", this.urlName, this.data.id));
    },

    /**
     * Provides a namespaced url for a generic url segment.  Wraps the segment in this.urlNamespace and this.urlExtension
     * @param {String} url The url to wrap
     * @returns {String} The namespaced URL
     */
    namespacedUrl: function(url) {
      return(String.format("{0}/{1}{2}", this.urlNamespace, url, this.urlExtension));
    } 
  },
  
  initAdapter: Ext.emptyFn
};

ExtMVC.model.registerAdapter('kohive', ExtMVC.model.KohiveAdapter);