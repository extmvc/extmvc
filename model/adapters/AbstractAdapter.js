Ext.ux.MVC.Model.Adapter.Abstract = {
  initialize: function(model) {
    
  },
  
  classMethods: {
    find: function(options) {
      
    },
    
    findById: function(id, options) {
      return this.findByField('id', id, options);
    },
    
    findByField: function(fieldName, matcher, options) {
      
    },
    
    findAll: function(options) {
      
    }
  },
  
  instanceMethods: {
    save:    Ext.emptyFn,
    
    reload:  Ext.emptyFn,
    
    destroy: Ext.emptyFn
  }
};

/**
 * Methods adding url data mapping
 */
Ext.ux.MVC.Model.AbstractAdapter = {
  /**
   * Set up the model for use with Active Resource.  Add various url-related properties to the model
   */
  initAdapter: function() {
    Ext.applyIf(this, {
      urlNamespace: '/admin',
      urlExtension: '.ext_json',
      urlName:      Ext.ux.MVC.Model.urlizeName(this.modelName)
    });
  },
  
  /**
   * Saves this record.  Performs validations first unless you pass false as the single argument
   */
  save: function(performValidations) {
    var performValidations = performValidations || true;
    
    console.log("saving model");
  },
  
  destroy: function(config) {
    var config = config || {};
    
    console.log("destroying model");
  },
  
  /**
   * Loads this record with data from the given ID
   * @param {Number} id The unique ID of the record to load the record data with
   * @param {Boolean} asynchronous False to load the record synchronously (defaults to true)
   */
  load: function(id, asynchronous) {
    var asynchronous = asynchronous || true;
    
    console.log("loading model");
  },
  
  /**
   * URL to retrieve a JSON representation of this model from
   */
  singleDataUrl : function(record_or_id) {
    return this.namespacedUrl(String.format("{0}/{1}", this.urlName, this.data.id));
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
   * This is used when populating most of the trees in Ext.ux.MVC, though
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
};

// Ext.ux.MVC.Model.registerAdapter('REST', Ext.ux.MVC.Model.AbstractAdapter);