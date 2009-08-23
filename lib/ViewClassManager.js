/**
 * @class ExtMVC.lib.ViewClassManager
 * @extends ExtMVC.lib.ClassManager
 * Customised class manager for views, which take namespace as well as name
 */
ExtMVC.lib.ViewClassManager = Ext.extend(ExtMVC.lib.ClassManager, {
  autoDefine: false,
  
  /**
   * Register works slightly differently for views because we use a namespace too,
   * so convert it here first
   */
  register: function(namespace, name, config) {
    var viewName = this.buildName(namespace, name);
    
    this.registeredClasses[viewName] = config;
  },
  
  getRegistered: function(namespace, name) {
    return this.registeredClasses[this.buildName(namespace, name)];
  },
  
  getConstructor: function(namespace, name) {
    var viewName = this.buildName(namespace, name);
    
    ExtMVC.lib.ViewClassManager.superclass.getConstructor.call(this, viewName);
  },
  
  /**
   * Because views are named by namespace and name, we need to turn these 2 names into 1
   * to be able to register them, which is what this function does
   * @param {String} namespace The view namespace
   * @param {String} name The view name
   * @return {String} The composited view name (defaults to "{namespace}-{name}")
   */
  buildName: function(namespace, name) {
    return String.format("{0}-{1}", namespace, name);
  }
});