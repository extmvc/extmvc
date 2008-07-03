/**
 * Ext.ux.MVC.model.Base
 * Abstract base class providing convenience methods for most types of data models
 * Aims to emulate much of the functionality of Rails' ActiveRecord
 * Usage: create a new model type like this:
 * 
<pre><code>
  Page = new Ext.ux.MVC.model.Base('page')
</code></pre>
 * Model will try to guess sensible default values for properties such as humanized names, etc
 * See JSDocs for full reference.  Default properties can be overridden like this:
<pre><code>
 AdvertisingCategory = new Ext.ux.MVC.model.Base('advertising_category', {
    controller_name:   'AdvertisingCategoriesController',
    human_plural_name: 'Advertising Categories',
    url_name:          'advertising_categories'
  });
</code></pre>
 *
 */

Ext.ux.MVC.model.Base = function(model_name, config) {
  
  /**
   * guess at best string names for the variations on the model name.  e.g. for a model with
   * model_name = 'advert_group':
   * underscore_name = 'advert_group'
   * url_name = 'advert_groups'
   * human_singular_name = 'Advert Group'
   * human_plural_name = 'Advert Groups'
   */
  Ext.apply(this, config, {
    model_name          : model_name,
    underscore_name     : model_name,
    url_name            : this.urlize_name(model_name),
    human_singular_name : this.singularize_human_name(model_name),
    human_plural_name   : this.pluralize_human_name(model_name),
    controller_name     : this.controller_name(model_name),
    class_name          : this.classify_name(model_name),
    foreign_key_name    : model_name + "_id",
    url_namespace       : '/admin',
    url_extension       : '.ext_json'
  });
};

Ext.ux.MVC.model.Base.prototype = {
  
  /**
   * Returns the passed url wrapped in the model's namespace and url extension
   * @return {String} Passed url string wrapped in model's namespace and url extension
   */
  namespacedUrl : function(url) {
    return(String.format("{0}/{1}{2}", this.url_namespace, url, this.url_extension));
  },

  /**
   * URL to retrieve a JSON representation of this model from
   */
  singleUrl : function(record) {
    return this.namespacedUrl(String.format("{0}/{1}", this.url_name, record.data.id));
  },
  
  /**
   * URL to retrieve a JSON representation of the collection of this model from
   * This would typically return the first page of results (see {@link #collectionStore})
   */
  collectionUrl : function(config) {
    return this.namespacedUrl(this.url_name);
  },
  
  /**
   * URL to retrieve a tree representation of this model from (in JSON format)
   * This is used when populating most of the trees in Ext.ux.MVC, though
   * only applies to models which can be representated as trees
   */
  treeUrl: function(config) {
    return this.namespacedUrl(String.format("{0}/tree", this.url_name));
  },
  
  /**
   * URL to post details of a drag/drop reorder operation to.  When reordering a tree
   * for a given model, this url is called immediately after the drag event with the
   * new configuration
   * TODO: Provide more info/an example here
   */
  treeReorderUrl: function(record) {
    return this.namespacedUrl(String.format("{0}/reorder/{1}", this.url_name, record.data.id));
  },
  
  /**
   * Returns an Ext.data.Store which is configured to load from the {@link #singleUrl} method
   * Returned Store is also configured with this model's reader
   * @cfg {Number} id Unique ID of the model - will be used to build the resource URL
   * @cfg {Object} storeConfig Additional configuration options which are passed to the Store
   * @return {Ext.data.Store} A store configured to load the record
   */
  singleStore : function(id, storeConfig) {
    if (storeConfig === undefined) {storeConfig = {};};
    
    return new Ext.data.Store(
      Ext.applyIf(storeConfig, {
        url: this.singleUrl(id),
        reader: this.getReader()
      })
    );
  },
  
  /**
   * Returns an Ext.data.Record for this model
   * This is just created from this.fields and cached to this.record.
   * You can override the default by just setting this.record = YourRecord
   * @return {Ext.data.Record} A record set up with this.fields
   */
  getRecord: function() {
    if (!this.record) {
      this.record = Ext.data.Record.create(this.fields);
    };
    return this.record;
  },
  
  /**
   * Returns an Ext.data.Reader for this model
   * This is generated from the fields config passed in when creating the model
   * Reader is generated once then cached in this.reader.  You can override the default
   * reader by setting this.reader = YourReader
   * @return {Ext.data.Reader} A reader based on this.fields passed when defining the model
   */
  getReader : function() {
    if (!this.reader) {
      this.reader = new Ext.data.JsonReader({root: this.url_name, totalProperty: 'results'}, this.getRecord());
    };
    return this.reader;
  },
  
  collectionStore : function(config) {
    options = Ext.apply({}, config, {
      proxy: new Ext.data.HttpProxy({
        url: this.collectionUrl(config),
        method: 'get',
        params: {start: 0, limit: 25}
      }),
      reader: this.getReader(),
      remoteSort: true
    });
    
    store = new Ext.data.Store(options);
    
    // override the default store.load function to load data through GET rather than POST
    store.load = function(options){
      options = options || {};
      if(this.fireEvent("beforeload", this, options) !== false){
          this.storeOptions(options);
          
          var p = Ext.apply(options.params || {}, this.baseParams);
          if(this.sortInfo && this.remoteSort){
            var pn = this.paramNames;
            p[pn["sort"]] = this.sortInfo.field;
            p[pn["dir"]] = this.sortInfo.direction;
          }
          
          // set the proxy's url with the correct parameters
          this.proxy.conn.url = this.proxy.conn.url.split("?")[0] + "?" + Ext.urlEncode(p);
          
          this.proxy.load(p, this.reader, this.loadRecords, this, options);
          return true;
      } else {
        return false;
      }
    };
    
    return store;
  },
  
  collectionGroupStore : function(config) {
    options = Ext.apply({}, config, {
      proxy: new Ext.data.HttpProxy({
        url: this.collectionUrl(config),
        method: 'get',
        params: {start: 0, limit: 25}
      }),
      reader: this.getReader(),
      remoteSort: true
    });
    
    store = new Ext.data.GroupingStore(options);
    
    // override the default store.load function to load data through GET rather than POST
    store.load = function(options){
      options = options || {};
      if(this.fireEvent("beforeload", this, options) !== false){
          this.storeOptions(options);
          
          var p = Ext.apply(options.params || {}, this.baseParams);
          if(this.sortInfo && this.remoteSort){
            var pn = this.paramNames;
            p[pn["sort"]] = this.sortInfo.field;
            p[pn["dir"]]  = this.sortInfo.direction;
          }
          
          // set the proxy's url with the correct parameters
          this.proxy.conn.url = this.proxy.conn.url.split("?")[0] + "?" + Ext.urlEncode(p);
          
          this.proxy.load(p, this.reader, this.loadRecords, this, options);
          return true;
      } else {
        return false;
      }
    };
    
    return store;
  },
  
  loadFormWithId : function(id, form, storeLoadConfig, storeConfig) {
    var store = this.singleStore({data: {id: id}}, storeConfig);
    store.on('load', function(s, records, options) {
      var record = records[0];
      form.form.loadRecord(record);
    });
    
    store.load(storeLoadConfig);
    
    return store;
  },
  
  loadFormWithRecord : function(rec, form, storeLoadConfig) {
    if (storeLoadConfig === undefined) {storeLoadConfig = {};};
    
    var store = this.singleStore(rec);
    store.on('load', function(s, records, options) {
      var record = records[0];
      form.form.loadRecord(record);
    });
    
    store.load(storeLoadConfig);
    
    return store;
  },
  
  loadFormWithSingletonRecord: function(form, storeLoadConfig) {
    var store = this.singleStore();
    store.on('load', function(s, records, options) {
      var record = records[0];
      form.form.loadRecord(record);
    });
    
    store.load(storeLoadConfig);
    
    return store;
  },
  
  //eek how horrid!
  newRecord: function() {
    return eval("new " + this.class_name + "Record");
  },
    
  singularize_human_name : function(name) {
    return name.replace(/_/g, " ").replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  },
  
  pluralize_human_name : function(name) {
    return (name + 's').replace(/_/g, " ").replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  },
  
  urlize_name : function(name) {
    return name + 's';
  },
  
  controller_name : function(name) {
    return this.pluralize_human_name(name).replace(/ /g, "")  + "Controller";
  },
  
  classify_name : function(name) {
    return this.singularize_human_name(name).replace(/ /g, "");
  }
};