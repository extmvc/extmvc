/**
 * @class ExtMVC.model.Base
 * A set of properties and functions which are applied to all ExtMVC.models when they are defined
 */
ExtMVC.model.Base = function() {};

ExtMVC.model.Base.prototype = {
  
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
    var id = this.get(this.primaryKey);
    return typeof id == 'undefined' || id == '';
  },
  
  /**
   * Returns a unique string for a model instance, suitable for use as a key in a cache (e.g. ExtMVC.model.Cache).
   * new User({id: 123}).MVCModelId(); //'user-123'
   * @return {String} The unique key for this model object
   */
  MVCModelId: function() {
    return String.format("{0}-{1}", this.tableName, this.get(this.primaryKey));
  },
  
  /**
   * Returns a JsonReader suitable for use decoding generic JSON data from a server response
   * Override this to provide your own Reader
   */
  getReader: function() {
    if (!this.reader) {
      this.reader = new Ext.data.JsonReader({
        totalProperty: "results",
        root:          this.tableName
      }, this.constructor);
    }
    
    return this.reader;
  },
  
  /**
   * @property initialize
   * @type Function
   * Function which is called whenever a model object is instantiated.  Override this with your own callback if needed
   */
  initialize: Ext.emptyFn
};


/**
 * @ignore
 * Add the above Base methods and properties to the Ext.data.Record prototype. This means all Record instances
 * will have MVC models methods, even if not instantiated by an MVC-defined model constructor
 */
Ext.apply(Ext.data.Record.prototype, new ExtMVC.model.Base());