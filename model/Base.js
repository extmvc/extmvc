/**
 * A set of properties and functions which are applied to all ExtMVC.Models when they are defined
 */
ExtMVC.Model.Base = {
  
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
  }
};