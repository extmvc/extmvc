Ext.namespace('Model');

var Model = {
  
  init : function(config) {
    
    // guess at best string names for the variations on the model name.  e.g. for a model with
    // model_name = 'advert_group':
    // underscore_name = 'advert_group'
    // url_name = 'advert_groups'
    // human_singular_name = 'Advert Group'
    // human_plural_name = 'Advert Groups'
    Ext.apply(this, config, {
      underscore_name     : this.model_name,
      url_name            : this.urlize_name(this.model_name),
      human_singular_name : this.singularize_human_name(this.model_name),
      human_plural_name   : this.pluralize_human_name(this.model_name),
      controller_name     : this.controller_name(this.model_name),
      class_name          : this.classify_name(this.model_name)
    });
  },
  
  singleUrl : function(id) {
    return '/admin/' + this.url_name + '/' + id + '.ext_json';
  },
  
  collectionUrl : function() {
    return '/admin/paginate_' + this.url_name + '.ext_json';
  },
  
  singleStore : function(id) {
    return new Ext.data.Store({
      url: this.singleUrl(id),
      reader: this.readerName()
    });
  },
  
  collectionStore : function(config) {
    options = Ext.apply({}, config, {
      url: this.collectionUrl(),
      reader: this.readerName(),
      remoteSort: true
    });
    
    return new Ext.data.Store(options);
  },
  
  loadFormWithId : function(id, form) {
    var store = this.singleStore(id);
    store.on('load', function(s, records, options) {
      var record = records[0];
      form.form.loadRecord(record);
    });
    
    store.load();
    
    return store;
  },
  
  readerName : function() {
    return eval(this.class_name + 'Reader');
  },
  
  singularize_human_name : function(name) {
    return name.replace("_", " ").replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  },
  
  pluralize_human_name : function(name) {
    return (name + 's').replace("_", " ").replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  },
  
  underscore_name : function(name) {
    return name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  },
  
  urlize_name : function(name) {
    return name + 's';
  },
  
  controller_name : function(name) {
    return this.pluralize_human_name(name).replace(" ", "")  + "Controller";
  },
  
  classify_name : function(name) {
    return this.singularize_human_name(name).replace(" ", "");
  }
};