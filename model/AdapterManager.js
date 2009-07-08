/**
 * Manages registration and retrieval of MVC Model adapters
 * @class ExtMVC.model.AdapterManager
 */
ExtMVC.model.AdapterManager = {
  /**
   * @property adapters
   * @type Object
   * Key/Value pairs of registered names and the relevant Adapter objects
   */
  adapters: {},
  
  /**
   * Registers an adapter for use with MVC Models.  
   * @param {String} name String name for this Adapter (e.g. 'REST')
   * @param {Function} object A reference to the Adapter object itself
   */
  register: function(name, constructor) {
    this.adapters[name] = constructor;
  },
  
  /**
   * Retrieves the requested adapter by key name
   * @param {String} name The name of the adapter to fine (e.g. 'REST')
   * @return {Object/Null} The Adapter object, if found
   */
  find: function(name, config) {
    return this.adapters[name];
  }
};