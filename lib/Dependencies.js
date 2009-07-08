/**
 * @class ExtMVC.lib.Dependencies
 * @extends Ext.util.Observable
 * Very simply dependency management class
 */
ExtMVC.lib.Dependencies = Ext.extend(Ext.util.Observable, {

  constructor: function() {
    
    /**
     * @property dependencies
     * @type Object
     * An object of model creation configurations awaiting definition because their dependency model(s) have not yet
     * been defined. e.g. {'User': [{name: 'SuperUser', config: someConfigObject}, {name: 'AdminUser', config: anotherCfgObj}]}
     * signifies that SuperUser and AdminUser should be defined as soon as User has been defined
     */
    this.dependencies = {};    
    
    ExtMVC.lib.Dependencies.superclass.constructor.apply(this, arguments);
  },
  
  /**
   * Returns an array of any Model subclasses waiting for this model to be defined
   * @param {String} dependencyName The dependency model name to check against
   * @return {Array} An array of items dependent on this item being defined (e.g. [{name: 'MyModel', config: someObject}])
   */
  get: function(dependencyName) {
    return this.dependencies[dependencyName] || [];
  },
  
  /**
   * Adds a model definition to the dependencies object if it is waiting for another model to be defined first
   * @param {String} dependencyName The name of another model which must be created before this one
   * @param {String} dependentName The name of the new model to be defined after its dependency
   * @param {Object} config The new model's config object, as sent to ExtMVC.model.define
   */
  add: function(dependencyName, dependentName, config) {
    var arr = this.dependencies[dependencyName] || [];
    
    arr.push({name: dependentName, config: config});
    
    this.dependencies[dependencyName] = arr;
  }
});
