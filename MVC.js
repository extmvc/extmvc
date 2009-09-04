/**
 * @class ExtMVC
 * ExtMVC 
 * @singleton
 */
ExtMVC = Ext.extend(Ext.util.Observable, {
  version: "0.7a",
  
  constructor: function() {
    ExtMVC.superclass.constructor.apply(this, arguments);
    
    /**
     * @property dispatcher
     * @type Ext.lib.Dispatcher
     * The dispatcher object which finds the right controller and action when ExtMVC.dispatch is called
     */
    // this.dispatcher = new Ext.lib.Dispatcher({
    //   
    // });
  },
  
  dispatch: function() {
    var dispatcher = this.dispatcher;
    
    return dispatcher.dispatch.apply(dispatcher, arguments);
  },
  
  /**
   * Sets the Ext.Application instance currently in use. This is currently required :/
   * @param {Ext.Application} app The application currently in use
   */
  setApplication: function(app) {
    this.app = app;
    this.name = app.name;
    
    ExtMVC.model.modelNamespace = window[app.name].models;
  },
  
  fields: {
    
  },
  
  registerFields: function(name, fields) {
    this.fields[name] = fields;
  },
  
  getFields: function(name) {
    return this.fields[name];
  },
  
  
  
  /**
   * Registers a model class with Ext MVC
   * @param {String} name The name to give this model
   * @param {Object} config Model definition configuration
   */
  registerModel: function(name, config) {
    this.registerClass('model', arguments);
  },
  
  /**
   * Registers a controller class with Ext MVC
   * @param {String} name The name to give this controller
   * @param {Object} config Controller definition configuration
   */
  registerController: function(name, config) {
    this.registerClass('controller', arguments);
  },
  
  /**
   * Registers a view class with Ext MVC.
   * @param {String} namesapce The namespace to add this view to
   * @param {String} name The name to give this view
   * @param {Object} config View definition configuration
   */
  registerView: function(namespace, name, config) {
    this.registerClass('view', arguments);
  },
  
  /**
   * Abstraction for registering views, models and controllers
   * @param {String} managerName The name of the class manager to register with
   * @param {Array} args The args to pass to the manager's register method
   */
  registerClass: function(managerName, args) {
    var manager = this.getClassManager(managerName);
    
    manager.register.apply(manager, args);
  },
  
  /**
   * @property classManagers
   * @type Object
   * {name: classManager} mappings used by this.getClassManager and this.registerClassManager
   */
  classManagers: {},
  
  /**
   * @private
   * Sets up model, view and controller class managers
   */
  initializeClassManagers: function() {
    this.registerClassManager('model',      new ExtMVC.lib.ModelClassManager());
    this.registerClassManager('view',       new ExtMVC.lib.ViewClassManager());
    this.registerClassManager('controller', new ExtMVC.lib.ControllerClassManager());
  },
  
  /**
   * Returns the class manager for the given name
   * @param {String} name The name of the manager (model, view or controller)
   * @return {ExtMVC.lib.ClassManager} The class manager instance
   */
  getClassManager: function(name) {
    return this.classManagers[name];
  },
  
  /**
   * Registers a class manager instance under a given name
   * @param {String} name The name of the class manager
   * @param {ExtMVC.lib.ClassManager} manager The ClassManager instance to register
   */
  registerClassManager: function(name, manager) {
    this.classManagers[name] = manager;
  },
  
  /**
   * Returns the canonical controller instance for the given controller name
   * @return {ExtMVC.Controller} The controller instance
   */
  getController: function(name) {
    return this.getClassManager('controller').getInstance(name);
  },
  
  /**
   * Returns the constructor for a given model name
   * @param {String} name The name of the model
   * @return {Function} The model constructor
   */
  getModel: function(name) {
    return this.getClassManager('model').getConstructor(name);
  },
  
  /**
   * Instantiates a model of the given name with the data supplied
   * @param {String} modelName The name of the model to instantiate
   * @param {Object} data Data object to instantiate the instance with
   * @return {ExtMVC.Model} The new model instance
   */
  buildModel: function(modelName, data) {
    return new (this.getModel(modelName))(data);
  },
  
  /**
   * Returns the constructor for a given view namespace/name combination
   * @param {String} namespace The view namespace to look in
   * @param {String} name The name of the view within the view namespace
   * @return {Function} The view constructor
   */
  getView: function getView(namespace, name) {
    return this.getClassManager('view').getConstructor(namespace, name);
  },
  
  /**
   * Returns a new view instance for the given namespace/name combo, using the supplied config
   * @param {String} namespace The namespace to find the view from
   * @param {String} name The view name
   * @param {Object} config Optional config object
   * @return {Ext.Component} The new view instance
   */
  buildView: function buildView(namespace, name, config) {
    var constructor = this.getView(namespace, name);
    
    return new (constructor)(config);
  },
  
  /**
   * Loads packaged classes from a given url, calling a callback when they have been registered. Sample return:
  <pre>
  {
    controllers: [
      {
        name: 'comments',
        superclass: 'crud',
        config: {
          index: function() {
            this.render('index', {
              title: "Loaded on demand!"
            });
          }
        }
      }
    ],
    views: [
      {
        name: 'new',
        namespace: 'comments',
        config: {
          xtype: 'scaffoldnew',
          title: "New Comment"
        }
      }
    ],
    models: [
      {
        name  : 'Comment',
        config: {
          fields: [
            {name: 'id',      type: 'int'},
            {name: 'title',   type: 'string'},
            {name: 'message', type: 'string'}
          ]
        }
      }
    ]
  }
  </pre>
   * @param {String} url The url to retrieve the package from
   * @param {Function} callback Optional callback function, called after the package has been read and registered
   * @param {Object} scope The scope to execute the callback function in
   */
  loadOnDemand: function(url, callback, scope) {
    Ext.Ajax.request({
      url     : url,
      scope   : scope    || this,
      success: function(response) {
        var pkg = Ext.decode(response.responseText);

        Ext.each(pkg.controllers || [], function(config) {
          this.registerController(config.name, config);
        }, this);

        Ext.each(pkg.models || [], function(config) {
          this.registerModel(config.name, config);
        }, this);

        Ext.each(pkg.views || [], function(config) {
          this.registerView(config.namespace, config.name, config);
        }, this);

        if (Ext.isFunction(callback)) callback.call(scope, pkg);
      }
    });
  }
});

ExtMVC = new ExtMVC();

// ExtMVC.initializeClassManagers();

Ext.onReady(function() {
  /**
   * @property dispatcher
   * @type Ext.lib.Dispatcher
   * The dispatcher object which finds the right controller and action when ExtMVC.dispatch is called
   */
  ExtMVC.dispatcher = new ExtMVC.lib.Dispatcher();
});

Ext.ns('ExtMVC.router', 'ExtMVC.plugin', 'ExtMVC.controller', 'ExtMVC.view', 'ExtMVC.view.scaffold', 'ExtMVC.lib', 'ExtMVC.test');