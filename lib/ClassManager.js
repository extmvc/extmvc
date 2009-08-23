ExtMVC.lib.ClassManager = Ext.extend(Ext.util.Observable, {
  constructor: function(config) {
    config = config || {};
          
    Ext.applyIf(config, {
      /**
       * @property autoDefine
       * @type Boolean
       * If true, the ClassManager will attempt to define classes immediately via this.define (defaults to true)
       */
      autoDefine: true,
      
      /**
       * @property autoInstantiate
       * @type Boolean
       * If true, the ClassManager will attempt to instantiate classes immediately after they are defined (defaults to false)
       */
      autoInstantiate: false,
      
      /**
       * @property registeredClasses
       * @type Object
       * {name: config} mapping of all registered classes
       */
      registeredClasses: {},
      
      /**
       * @property constructors
       * @type Object
       * {name: Function} mapping of all registered classes to their constructor functions
       */
      constructors: {},
      
      /**
       * @property instances
       * @type Object
       * {name: instance} mapping of any classes which have been instantiated with this manager
       * This is only really used for controllers, where there is only ever one instance at a time
       */
      instances: {}
    });
    
    Ext.apply(this, config);
    
    this.addEvents(
      /**
       * @event class-registered
       * Fires when a class has been registered to this package
       * @param {String} name The name of the class
       * @param {Object} config The class config object
       */
      'class-registered',
      
      /**
       * @event class-defined
       * Fires after a class has been registered and then defined using Ext.extend
       * @param {String} name The name of the class
       * @param {Function} constructor The class constructor
       */
      'class-defined',
      
      /**
       * @event class-instantiated
       * Fires when a class in this manager has been instantiated by the manager. This is mostly 
       * useful when using autoInstantiate, e.g. for classes for which there should only be one instance
       * @param {String} name The name of the class that was instantiated
       * @param {Object} instance The instance that was just created
       */
      'class-instantiated'
    );
    
    this.on({
      scope             : this,
      'class-registered': this.afterRegister,
      'class-defined'   : this.afterDefine
    });
  },
  
  /**
   * Registers a config object or class constructor to a given class name
   * @param {String} name The name to register this class under
   * @param {Object/Function} config Either a config object or a constructor function
   */
  register: function(name, config) {
    this.registeredClasses[name] = config;
    
    this.fireEvent('class-registered', name, config);
  },
  
  /**
   * Returns the config object for a given class name. Only really useful privately
   * @param {String} name The name of the class
   * @return {Object} The config object for this class
   */
  getRegistered: function(name) {
    return this.registeredClasses[name];
  },
  
  /**
   * Defines the given class name by using Ext.extend to declare it. The result of Ext.extend
   * is then stored in this.constructors, and the constructor can then be retrieved with this.getConstructor(name)
   * @param {String} name The name of the class to define
   * @return {Function} The newly defined class constructor
   */
  define: function(name) {
    var overrides = this.getRegistered(name);
    
    //extend the parent object and register the constructor
    var klass = Ext.extend(this.getConstructor(overrides.extend), overrides);
    this.constructors[name] = klass;
    
    this.fireEvent('class-defined', name, klass);
    
    return klass;
  },
  
  /**
   * Returns the constructor function for a registered class name. If the constructor
   * itself hasn't been defined yet, it is defined first using this.define(), then returned
   * @param {String} name The name of the class to return the constructor for
   * @return {Function} The constructor function
   */
  getConstructor: function(name) {
    return this.constructors[name] || this.define(name);
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
// 
// Ext.apply(ExtMVC, {
//   /**
//    * Registers a model class with Ext MVC
//    * @param {String} name The name to give this model
//    * @param {Object} config Model definition configuration
//    */
//   registerModel: function(name, config) {
//     this.registerClass('model', arguments);
//   },
//   
//   /**
//    * Registers a controller class with Ext MVC
//    * @param {String} name The name to give this controller
//    * @param {Object} config Controller definition configuration
//    */
//   registerController: function(name, config) {
//     this.registerClass('controller', arguments);
//   },
//   
//   /**
//    * Registers a view class with Ext MVC.
//    * @param {String} namesapce The namespace to add this view to
//    * @param {String} name The name to give this view
//    * @param {Object} config View definition configuration
//    */
//   registerView: function(namespace, name, config) {
//     this.registerClass('view', arguments);
//   },
//   
//   /**
//    * Abstraction for registering views, models and controllers
//    * @param {String} managerName The name of the class manager to register with
//    * @param {Array} args The args to pass to the manager's register method
//    */
//   registerClass: function(managerName, args) {
//     var manager = this.getClassManager(managerName);
//     
//     manager.register.apply(manager, args);
//   },
//   
//   /**
//    * @property classManagers
//    * @type Object
//    * {name: classManager} mappings used by this.getClassManager and this.registerClassManager
//    */
//   classManagers: {},
//   
//   /**
//    * @private
//    * Sets up model, view and controller class managers
//    */
//   initializeClassManagers: function() {
//     this.registerClassManager('model',      new ExtMVC.lib.ModelClassManager());
//     this.registerClassManager('view',       new ExtMVC.lib.ViewClassManager());
//     this.registerClassManager('controller', new ExtMVC.lib.ControllerClassManager());
//   },
//   
//   /**
//    * Returns the class manager for the given name
//    * @param {String} name The name of the manager (model, view or controller)
//    * @return {ExtMVC.lib.ClassManager} The class manager instance
//    */
//   getClassManager: function(name) {
//     return this.classManagers[name];
//   },
//   
//   /**
//    * Registers a class manager instance under a given name
//    * @param {String} name The name of the class manager
//    * @param {ExtMVC.lib.ClassManager} manager The ClassManager instance to register
//    */
//   registerClassManager: function(name, manager) {
//     this.classManagers[name] = manager;
//   },
//   
//   /**
//    * Returns the canonical controller instance for the given controller name
//    * @return {ExtMVC.Controller} The controller instance
//    */
//   getController: function(name) {
//     return this.controllerManager.getInstance(name);
//   },
//   
//   /**
//    * Returns the constructor for a given model name
//    * @param {String} name The name of the model
//    * @return {Function} The model constructor
//    */
//   getModel: function(name) {
//     return this.getClassManager('model').getConstructor(name);
//   },
//   
//   /**
//    * Instantiates a model of the given name with the data supplied
//    * @param {String} modelName The name of the model to instantiate
//    * @param {Object} data Data object to instantiate the instance with
//    * @return {ExtMVC.Model} The new model instance
//    */
//   buildModel: function(modelName, data) {
//     return new (this.getModel(modelName))(data);
//   },
//   
//   /**
//    * Returns the constructor for a given view namespace/name combination
//    * @param {String} namespace The view namespace to look in
//    * @param {String} name The name of the view within the view namespace
//    * @return {Function} The view constructor
//    */
//   getView: function(namespace) {
//     return this.getClassManager('view').getConstructor(namespace, name);
//   },
//   
//   /**
//    * Loads packaged classes from a given url, calling a callback when they have been registered. Sample return:
//   <pre>
//   {
//     controllers: [
//       {
//         name: 'comments',
//         superclass: 'crud',
//         config: {
//           index: function() {
//             this.render('index', {
//               title: "Loaded on demand!"
//             });
//           }
//         }
//       }
//     ],
//     views: [
//       {
//         name: 'new',
//         namespace: 'comments',
//         config: {
//           xtype: 'scaffoldnew',
//           title: "New Comment"
//         }
//       }
//     ],
//     models: [
//       {
//         name  : 'Comment',
//         config: {
//           fields: [
//             {name: 'id',      type: 'int'},
//             {name: 'title',   type: 'string'},
//             {name: 'message', type: 'string'}
//           ]
//         }
//       }
//     ]
//   }
//   </pre>
//    * @param {String} url The url to retrieve the package from
//    * @param {Function} callback Optional callback function, called after the package has been read and registered
//    * @param {Object} scope The scope to execute the callback function in
//    */
//   loadOnDemand: function(url, callback, scope) {
//     Ext.Ajax.request({
//       url     : url,
//       scope   : scope    || this,
//       success: function(response) {
//         var pkg = Ext.decode(response.responseText);
// 
//         Ext.each(pkg.controllers || [], function(config) {
//           this.registerController(config.name, config);
//         }, this);
// 
//         Ext.each(pkg.models || [], function(config) {
//           this.registerModel(config.name, config);
//         }, this);
// 
//         Ext.each(pkg.views || [], function(config) {
//           this.registerView(config.namespace, config.name, config);
//         }, this);
// 
//         if (Ext.isFunction(callback)) callback.call(scope, pkg);
//       }
//     });
//   }
// });


/**
 * Ideal syntax after these changes:
 */

// ExtMVC.registerView('index', 'index', {
//   xtype: "panel",
//   title: "Welcome to Ext MVC",
//   html : "This is a test"
// });
// 
// Ext.registerController("index", {
//   index: function() {
//     this.render("index", {
//       title: "Different Title"
//     });
//   },
//   
//   //this would actually be here by default
//   welcome: function() {
//     this.render("index");
//   },
//   
//   //if we give the function a name, we can accept alternative render format:
//   //all MVC Crud controller methods can be made like this
//   search: function search() {
//     this.render({
//       //options for new MyApp.views.index.search
//     });
//   },
//   
//   create: function(data) {
//     var newUser = ExtMVC.buildModel("SuperUser", data);
//     
//     newUser.save({
//       success: function(user) {
//         
//       },
//       failure: function(user) {
//         
//       }
//     });
//     
//     //or how about
//     ExtMVC.createModel("SuperUser", data, {
//       success: function(user) {
//         
//       },
//       failure: function(user) {
//         
//       }
//     });
//   },
//   
//   update: function(user, changes) {
//     user.update(changes, {
//       success: function(user) {
//         
//       },
//       failure: function(user) {
//         
//       }
//     });
//   }
// });
// 
// ExtMVC.registerController("someSubController", {
//   extend: "index",
//   
//   index: function() {
//     this.superclass.index.call(this);
//   }
// });
// 
// 
// ExtMVC.registerModel("SuperUser", {
//   extend: "User",
//   fields: [
//     {name: 'id', type: 'int'}
//   ]
// });



