Ext.namespace('Model');

var Model = {
  singleUrl : function(id) {
    return '/admin/' + (this.plural_name || (this.model_name + 's')) + '/' + id + '.ext_json';
  },
  
  collectionUrl : function() {
    return '/admin/paginate_' + (this.plural_name || (this.model_name + 's')) + '.ext_json';
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
    return eval(this.model_name + 'Reader');
  },
  
  titleize : function() {
    return this.model_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  },
  
  titleized_plural_name : function() {
    return this.plural_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  }
};