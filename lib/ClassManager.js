ExtMVC.lib.ClassManager = Ext.extend(Ext.util.Observable, {
  /**
   * @property autoDefine
   * @type Boolean
   * If true, the ClassManager will attempt to define classes immediately via this.define (defaults to true)
   */
  autoDefine: true,
  
  constructor: function constructor(config) {
    config = config || {};
          
    Ext.applyIf(config, {    
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
      constructors: {}
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
      'class-defined'
    );
    
    // this.on({
    //   scope             : this,
    //   'class-registered': this.afterRegister,
    //   'class-defined'   : this.afterDefine
    // });
  },
  
  /**
   * Registers a config object or class constructor to a given class name
   * @param {String} name The name to register this class under
   * @param {Object/Function} config Either a config object or a constructor function
   */
  register: function register(name, config) {
    this.registeredClasses[name] = config;
    
    this.fireEvent('class-registered', name, config);
    
    if (this.autoDefine === true) this.define(name);
  },
  
  /**
   * Returns the config object for a given class name. Only really useful privately
   * @param {String} name The name of the class
   * @return {Object} The config object for this class
   */
  getRegistered: function getRegistered(name) {
    return this.registeredClasses[name];
  },
  
  /**
   * Defines the given class name by using Ext.extend to declare it. The result of Ext.extend
   * is then stored in this.constructors, and the constructor can then be retrieved with this.getConstructor(name)
   * @param {String} name The name of the class to define
   * @return {Function} The newly defined class constructor
   */
  define: function define(name) {
    console.log('defining');
    console.log(name);
    
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
  getConstructor: function getConstructor(name) {
    return this.constructors[name] || this.define(name);
  }
});

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



