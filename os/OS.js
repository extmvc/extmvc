/**
 * @class ExtMVC.OS
 * @extends ExtMVC.Controller
 * Specialised ExtMVC.Controller intended to create and manage generic Operating System
 * components (e.g. not elements specific to a single Application within the OS)
 * When an OS is instantiated, ExtMVC.OS.getOS() is defined and returns the OS instance
 */
ExtMVC.OS = function(config) {
  ExtMVC.OS.superclass.constructor.call(this, config);
  
  this.addEvents(
    /**
     * @event beforelaunch
     * Fires before this application launches
     * @param {ExtMVC.Application} this The application about to be launched
     */
    'beforelaunch',
    
    /**
     * @event launch
     * Fires after the application has been launched
     * @param {ExtMVC.Application} this The application which has been launched
     */
    'launch'
  );
  
  this.initialiseNamespaces();
  
  var os = this;
  ExtMVC.OS.getOS = function() {return os;};
};
Ext.extend(ExtMVC.OS, ExtMVC.Controller, {
  /**
   * Registers a controller for use with this OS.  The controller is instantiated lazily
   * when needed, through the use of this.getController('MyController')
   * @param {String} controllerName A string name for this controller, used as a key to reference this controller with this.getController
   * @param {Function} controllerClass A reference to the controller class, which is later instantiated lazily
   */
  registerController: function(controllerName, controllerClass) {
    this.controllers[controllerName] = controllerClass;
  },

  /**
   * Returns a controller instance for the given controller name.
   * Instantiates the controller first if it has not yet been instantiated.
   * @param {String} controllerName The registered name of the controller to get
   * @return {Object} The controller instance, or null if not found
   */
  getController: function(controllerName) {
    var c = this.controllers[controllerName];
    if (c) {
      //instantiate the controller first, if required
      if (typeof c === 'function') {
        this.controllers[controllerName] = new this.controllers[controllerName]();
      };
      return this.controllers[controllerName];
    } else {
      return null;
    };
  },
  
  /**
   * @property controllers
   * When this.registerController('application', MyApp.ApplicationController) is called,
   * the ApplicationController class is registered here under the 'application' key.
   * When this.getController('application') is called, it checks here to see if the 
   * controller has been instantiated yet.  If it has, it is returned.  If not it is
   * instantiated, then returned.
   */
  controllers: {},
  
  /**
   * Launches this application
   */
  launch: function() {
    if (this.fireEvent('beforelaunch', this)) {
      this.initializeRouter();
      this.initializeViewport();
      
      if (this.usesHistory) { this.initialiseHistory(); }      
      
      this.onLaunch();
      this.fireEvent('launch', this);
    };
  },
  
  /**
   * @property usesHistory
   * @type Boolean
   * True to automatically create required DOM elements for Ext.History,
   * sets up a listener on Ext.History's change event to fire this.handleHistoryChange. 
   * False by default
   */
  usesHistory: false,
  
  /**
   * @prop dispatchHistoryOnLoad
   * @type Boolean
   * If usesHistory is true and dispatchHistoryOnLoad is also true, the OS will attempt to match
   * any string currently after the # in the url and dispatch to it
   */
  dispatchHistoryOnLoad: true,
  
  /**
   * @property viewportBuilder
   * @type String
   * The type of viewport to construct (can be any registered with ExtMVC.ViewportBuilderManager)
   */
  viewportBuilder: 'leftmenu',
  
  /**
   * Config object which is passed made available to the ViewportBuilder
   */
  viewportBuilderConfig: {},
  
  /**
   * Called just before onLaunch.  Runs the ExtMVC.ViewportBuilder
   * specified in this.viewportBuilder.
   * Override this to create your own viewport instead of using a builder
   */
  initializeViewport: function() {
    var builder = ExtMVC.ViewportBuilderManager.find(this.viewportBuilder);
    if (builder) {
      builder.build(this);
    };
  },
  
  /**
   * @property params
   * @type Object
   * An object containing the most current parameters (usually decoded from a url using this.router)
   * e.g. {controller: 'index', action: 'welcome', id: 10}
   */
  params: {},
  
  /**
   * Dispatches a request to a registered controller. 
   * @param {Object} dispatchConfig A config object which should look something like this:
   * {controller: 'MyController', action: 'index'}, where 'MyController' is the key for a controller
   * which has been registered to the controller.  If action is not specified, it defaults to 'index'
   * @param {Object} scope The scope in which to fire the event (defaults to the OS)
   * @param {Array} args An array of arguments which are passed to the controller action.
   */
  dispatch: function(dispatchConfig, scope, args) {
    var dispatchConfig = dispatchConfig || {};
    Ext.applyIf(dispatchConfig, {
      action: 'index'
    });
    
    this.params = dispatchConfig;
    
    var c;
    if (c = this.getController(dispatchConfig.controller)) {
      c.fireAction(dispatchConfig.action, scope || c, args || []);
    };
  },
  
  /**
   * Override this to perform custom processing between the beforelaunch and
   * launch events
   */
  onLaunch: Ext.emptyFn,
  
  /**
   * Sets up a Router instance.  This is called automatically before onLaunch()
   * Add routes using this.router.connect
   */
  initializeRouter: function() {
    if (this.router == undefined) {
      this.router = new ExtMVC.router.Router();
      ExtMVC.Router.defineRoutes(this.router);
    }
  },
  
  /**
   * @property name
   * @type String
   * The name to namespace this application under (e.g. 'MyApp').  If set,  the appropriate subnamespaces are created automatically
   */
  name: undefined,
  
  /**
   * Uses Ext.namespace to create packages view controllers, models and views
   * E.g. if name = 'Blog' or this.name = 'Blog', this is the same as:
   * Ext.ns('Blog', 'Blog.controllers', 'Blog.models', 'Blog.views')
   */
  initialiseNamespaces: function(name) {
    var name = name || this.name;
    if (name) {
      Ext.ns(name, name + '.controllers', name + '.models', name + '.views');
    };
  },
  
  /**
   * Creates the necessary DOM elements required for Ext.History to manage state
   * Sets up listeners on Ext.History's change event to fire the dispatch() action in the normal way.
   * This is not called automatically as not all applications will need it
   */
  initialiseHistory: function() {
    this.historyForm = Ext.getBody().createChild({
      tag:    'form',
      action: '#',
      cls:    'x-hidden',
      id:     'history-form',
      children: [
        {
          tag: 'div',
          children: [
            {
              tag:  'input',
              id:   'x-history-field',
              type: 'hidden'
            },
            {
              tag: 'iframe',
              id:  'x-history-frame'
            }
          ]
        }
      ]
    });
    
    //initialize History management.  Fire a dispatch event if a hash url is present and startup
    //dispatch is requested
    if (this.dispatchHistoryOnLoad) {
      Ext.History.init(function(history) {
        var hash   = document.location.hash.replace("#", "");
        var params = this.router.recognise(hash);
        if (params) {this.dispatch(params);}
      }, this);
    } else {
      Ext.History.init();
    }
    
    Ext.History.on('change', this.handleHistoryChange, this);
  },
  
  /**
   * Takes a history token (anything after the # in the url), consults the router and dispatches
   * to the appropriate controller and action if a match was found
   * @param {String} token The url token (e.g. the token would be cont/act/id for a url like mydomain.com/#cont/act/id)
   */
  handleHistoryChange: function(token) {
    var match = this.router.recognise(token);
    
    if (match) {
      this.dispatch(match, null, [{url: token}]);
    };
  },
  
  /**
   * Simple convenience function to change the document title whenever this view is displayed
   * @param {Ext.Component} view The view (Ext.Panel subclass normally) to listen to show/activate events on
   * @param {String} title The string to change the document title to (defaults to view.initialConfig.title)
   */
  setsTitle: function(view, title) {
    var title = title || view.title || view.initialConfig ? view.initialConfig.title : null;
    if (title) {
      view.on('show',     function() {document.title = title;});
      view.on('activate', function() {document.title = title;});
    };
  }
});

Ext.reg('os', ExtMVC.OS);

// ExtMVC.getOS = ExtMVC.OS.getOS();