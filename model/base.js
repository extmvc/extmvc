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
    underscore_name     : model_name,
    url_name            : this.urlize_name(model_name),
    human_singular_name : this.singularize_human_name(model_name),
    human_plural_name   : this.pluralize_human_name(model_name),
    controller_name     : this.controller_name(model_name),
    class_name          : this.classify_name(model_name),
    foreign_key_name    : model_name + "_id"
  });
};

Ext.ux.MVC.model.Base.prototype = {

  singleUrl : function(record) {
    return '/admin/' + this.url_name + '/' + record.data.id + '.ext_json';
  },
  
  collectionUrl : function(config) {
    return '/admin/' + this.url_name + '.ext_json';
  },
  
  treeUrl: function(config) {
    return '/admin/' + this.url_name + '/tree.ext_json';
  },
  
  treeReorderUrl: function(record) {
    return '/admin/' + this.url_name + '/reorder/' + record.data.id + '.ext_json';
  },
  
  singleStore : function(id, storeConfig) {
    if (storeConfig === undefined) {storeConfig = {};};
    
    return new Ext.data.Store(
      Ext.applyIf(storeConfig, {
        url: this.singleUrl(id),
        reader: this.readerName()
      })
    );
  },
  
  collectionStore : function(config) {
    options = Ext.apply({}, config, {
      proxy: new Ext.data.HttpProxy({
        url: this.collectionUrl(config),
        method: 'get',
        params: {start: 0, limit: 25}
      }),
      reader: this.readerName(),
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
      reader: this.readerName(),
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
  
  readerName : function() {
    return eval(this.class_name + 'Reader');
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