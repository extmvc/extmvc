/**
 * @class ExtMVC.model.plugin.adapter.MemoryAdapter
 * @extends ExtMVC.model.plugin.adapter.Abstract
 * Provides a very basic storage system where model data get stored to an object in memory
 */
ExtMVC.model.plugin.adapter.MemoryAdapter = Ext.extend(ExtMVC.model.plugin.adapter.Abstract, {
  
  /**
   * @property store
   * @type Object
   * A simple object that models get saved to
   */
  store: {},
  
  primaryKeys: {},
    
  /**
   * Performs the actual save request.  Uses POST for new records, PUT when updating existing ones
   */
  doSave: function(instance, options) {
    if (typeof instance == 'undefined') throw new Error('No instance provided to REST Adapter save');
    options = options || {};
    
    //if this model doesn't have a primary key yet, give it one now and mark it as saved
    var id = instance.get(instance.primaryKey);
    if (typeof id == 'undefined') {
      id = this.primaryKeyFor(instance);
      instance.set(instance.primaryKey, id);
    }
    
    //put the model data into its store
    this.store[instance.tableName] = this.store[instance.tableName] || {};
    this.store[instance.tableName][id.toString()] = instance.data;
  },
  
  /**
   * Performs the actual find request.
   * @param {Object} conditions An object containing find conditions. If a primaryKey is set this will be used
   * to build the url for that particular instance, otherwise the collection url will be used
   * @param {Object} options Callbacks (use callback, success and failure)
   */
  doFind: function(conditions, options, constructor) {
    conditions = conditions || {}; options = options || {};
    
    //helper function to cut down repetition in Ajax request callback
    var callIf = function(callback, args) {
      if (typeof callback == 'function') callback.apply(options.scope, args);
    };
    
    var modelStore = this.store[constructor.prototype.tableName] || {};
    
    if (typeof conditions.primaryKey == 'undefined') {
      //return everything
      var records = [];
      
      for (primaryKey in modelStore) {
        records.push((modelStore[primaryKey]));
      }
      
      console.log(records);
      
      return new Ext.data.Store({
        autoLoad: true,
        data: {'rows': records},
        // proxy: new Ext.data.MemoryProxy({'rows': records}),
        fields: constructor.prototype.fields.items,
        reader: new Ext.data.JsonReader({root: 'rows'}, constructor)
      });
      
    } else {
      var data = modelStore[conditions.primaryKey.toString()];
      
      if (typeof data == 'undefined') {
        callIf(options.failure);
      } else {
        callIf(options.success, [new constructor(data)]);
      }
    }
  },
  
  doDestroy: function(instance, options) {
    if (typeof instance == 'undefined') throw new Error('No instance provided to REST Adapter save');
    options = options || {};
    
    Ext.Ajax.request(
      Ext.applyIf(options, {
        method: this.destroyMethod,
        url:    this.instanceUrl(instance)
      })
    );
  },
  
  /**
   * Returns the next available primary key for a model instance
   * @param {ExtMVC.model.Base} instance The model instance
   * @return {Number} The primary key to use for this instance
   */
  primaryKeyFor: function(instance) {
    this.primaryKeys[instance.tableName] = this.primaryKeys[instance.tableName] || 1;
    
    return this.primaryKeys[instance.tableName] ++;
  }
});