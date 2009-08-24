/**
 * @class ExtMVC.lib.ModelClassManager
 * @extends ExtMVC.lib.ClassManager
 * Specialised class manager for managing models
 */
ExtMVC.lib.ModelClassManager = Ext.extend(ExtMVC.lib.ClassManager, {
  //usual model definition stuff to go here
  define: function(name) {
    var overrides = this.getRegistered(name);
    
    return this.constructors[name] = ExtMVC.model.define(name, overrides);
  }
});

ExtMVC.registerClassManager('model', new ExtMVC.lib.ModelClassManager());