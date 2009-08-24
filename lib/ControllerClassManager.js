/**
 * @class ExtMVC.lib.ControllerClassManager
 * @extends ExtMVC.lib.ClassManager
 * Customised class manager for managing Controllers
 */
ExtMVC.lib.ControllerClassManager = Ext.extend(ExtMVC.lib.ClassManager, {
  constructor: function(config) {
    config = config || {};
          
    Ext.applyIf(config, {
      /**
       * @property instances
       * @type Object
       * {name: instance} mapping of any classes which have been instantiated with this manager
       * This is only really used for controllers, where there is only ever one instance at a time
       */
      instances: {},
      
      /**
       * @property autoInstantiate
       * @type Boolean
       * If true, the ClassManager will attempt to instantiate controllers immediately after they are defined (defaults to true)
       */
      autoInstantiate: true
    });
    
    ExtMVC.lib.ControllerClassManager.superclass.constructor.call(this, config);
    
    this.addEvents(
      /**
       * @event class-instantiated
       * Fires when a class in this manager has been instantiated by the manager. This is mostly 
       * useful when using autoInstantiate, e.g. for classes for which there should only be one instance
       * @param {String} name The name of the class that was instantiated
       * @param {Object} instance The instance that was just created
       */
      'class-instantiated'
    );
  },
  
  define: function(name) {
    var overrides  = this.getRegistered(name);
    
    if (overrides == undefined) {
      throw new Ext.Error(String.format("The {0} controller could not be found", name));
    }
    
    //set 'application' as the default controller to inherit from
    var superclass = name == "controller" ? Ext.util.Observable : this.getConstructor(overrides.extend || "application");
    
    //extend the parent object and register the constructor
    var klass = Ext.extend(superclass, overrides);
    this.constructors[name] = klass;
    
    if (this.autoInstantiate === true) this.instantiate(name);
    
    this.fireEvent('class-defined', name, klass);
    
    return klass;
  },
  
  /**
   * Instantiates the given class name, with an optional config object (usually the config is not needed)
   * 
   */
  instantiate: function(name, config) {
    //get the controller instance that has already been created
    var instance = this.instances[name];
    
    //if the instance isn't defined yet, instantiate it now and cache it
    if (instance == undefined) {
      instance = new (this.getConstructor(name))(config);
      instance.name = name;
      // instance.superclass = 
      
      this.instances[name] = instance;
      
      this.fireEvent('class-instantiated', name, instance);
    }
    
    return instance;    
  },
  
  /**
   * Only really useful for controllers, this returns the canonical instance for a given
   * class name (e.g. getInstance('funds') would return the Funds Controller, instaniating first if required)
   * @param {String} name The name of the class to instantiate
   * @return {Object} The canonical instance of this class
   */
  getInstance: function(name) {
    return this.instances[name] || this.instantiate(name);
  }
});

ExtMVC.registerClassManager('controller', new ExtMVC.lib.ControllerClassManager());