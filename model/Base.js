/**
 * @class Ext.Model.Base
 * A set of properties and functions which are applied to all ExtMVC.Models when they are defined
 */
ExtMVC.Model.Base = function() { 
  //any code in here will be run only once - when Base gets added to Record's prototype
  //this will NOT be run every time a Model is defined or instantiated
};
 
ExtMVC.Model.Base.prototype = {
  
  /**
   * @property primaryKey
   * @type String
   * The name of the field assumed to be the primary key (defaults to 'id')
   */
  primaryKey: 'id',
  
  /**
   * Returns true if this model's primaryKey has not yet been set (i.e. it has not been saved yet)
   * @return {Boolean} True if this model's primaryKey has not yet been set
   */
  newRecord: function() {
    return typeof(this.data[this.primaryKey]) == 'undefined';
  },
  
  /**
   * Returns a unique string for a model instance, suitable for use as a key in a cache (e.g. ExtMVC.Model.Cache).
   * new User({id: 123}).MVCModelId(); //'user-123'
   * @return {String} The unique key for this model object
   */
  MVCModelId: function() {
    return String.format("{0}-{1}", this.tableName, this.get(this.primaryKey));
  },
  
  /**
   * @property initialize
   * @type Function
   * Function which is called whenever a model object is instantiated.  Override this with your own callback if needed
   */
  initialize: Ext.emptyFn
};


/**
 * Add the above Base methods and properties to the Ext.data.Record prototype. This means all Record instances
 * will have MVC models methods, even if not instantiated by an MVC-defined model constructor
 */
Ext.apply(Ext.data.Record.prototype, new ExtMVC.Model.Base());