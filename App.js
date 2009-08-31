/**
 * @class ExtMVC.App
 * @extends Ext.util.Observable
 * @cfg {Boolean} usesHistory True to automatically create required DOM elements for Ext.History,
 * sets up a listener on Ext.History's change event to fire this.onHistoryChange. False by default
 */
ExtMVC.App = Ext.extend(Ext.util.Observable, {
  /**
   * @constructor
   * Sets up the Application - adds events, sets up namespaces, optionally sets up history.
   * Fires the 'before-launch' event before initializing router, viewport and history.
   * Calls this.launch() once everything else is set up (override the 'launch' method to provide your own logic).
   * Fires the 'launched' event after calling this.launch()
   */
  constructor: function(config) {
    ExtMVC.App.superclass.constructor.apply(this, arguments);
    
    //apply configuration object and set up namespaces
    Ext.apply(this, config || {});
    window[this.name] = this;
    
    this.initializeNamespaces();
    
    // Ext.onReady(this.onReady, this);
    
    this.on('launched', function() {
      /**
       * TODO: This used to reside in initializeHistory but this.launch() needs to be
       * called before this dispatches so it is temporarily here... ugly though
       */
      if (this.usesHistory) {
        if (this.dispatchHistoryOnLoad === true) {
          Ext.History.init(function(history) {
            var hash   = document.location.hash.replace("#", "");
            var params = this.router.recognise(hash);
            
            if (params) {this.dispatch(params);}
          }, this);
        } else {
          Ext.History.init();
        }
      }      
    }, this);
  },
  
  /**
   * @private
   * Called when Ext.onReady fires
   */
  onReady: function() {    
    if (this.fireEvent('before-launch', this)) {
      this.initializeRouter();
      // this.initializeViewport();
      this.initializeEvents();

      if (this.usesHistory === true) this.initializeHistory();     

      this.launch();
    }
  },
    
  /**
   * @property name
   * @type String
   * The application's name.  This is used when creating namespaces for models, views and controllers,
   * and automatically set up as a global variable reference to this application. Read only.
   */
  name: 'MyApp',
    
  /**
   * @property usesHistory
   * @type Boolean
   * True to automatically create required DOM elements for Ext.History,
   * sets up a listener on Ext.History's change event to fire this.onHistoryChange. 
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
   * Called when the application is booted up. Override this to provide your own startup logic (defaults to Ext.emptyFn)
   */
  launch: function() {
    this.fireEvent('launched', this);
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
   * @param {Object} scope The scope in which to fire the event (defaults to the controller)
   * @param {Array} args An array of arguments which are passed to the controller action.
   */
  dispatch: function dispatch(dispatchConfig, scope, args) {
    var dispatchConfig = dispatchConfig || {};
    Ext.applyIf(dispatchConfig, {
      action: 'index'
    });
    
    this.params = dispatchConfig;
    
    var c = ExtMVC.getController(dispatchConfig.controller);
    if (c != undefined) {
      var action = c[dispatchConfig.action];
      
      if (typeof action == "function") action.apply(scope || c, args || []);
      else throw new Error(String.format("Action '{0}' not found on Controller '{1}'", dispatchConfig.action, dispatchConfig.controller));
    }
  },
  
  /**
   * Sets up a Router instance.  This is called automatically before onLaunch()
   * Add routes using this.router.connect
   */
  initializeRouter: function() {
    if (this.router == undefined) {
      this.router = new ExtMVC.router.Router();
      ExtMVC.router.Router.defineRoutes(this.router);
    }
  },
  
  /**
   * Uses Ext.namespace to create packages view controllers, models and views
   * E.g. if name = 'Blog' or this.name = 'Blog', this is the same as:
   * Ext.ns('Blog', 'Blog.controllers', 'Blog.models', 'Blog.views')
   */
  initializeNamespaces: function initializeNamespaces(name) {
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
  initializeHistory: function initializeHistory() {
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
    
    Ext.History.on('change', this.onHistoryChange, this);
  },
  
  /**
   * Takes a history token (anything after the # in the url), consults the router and dispatches
   * to the appropriate controller and action if a match was found
   * @param {String} token The url token (e.g. the token would be cont/act/id for a url like mydomain.com/#cont/act/id)
   */
  onHistoryChange: function onHistoryChange(token) {
    var match = this.router.recognise(token);
    
    if (match) {
      this.dispatch(match, null, [{url: token}]);
    };
  },
  
  /**
   * Sets up events emitted by the Application
   */
  initializeEvents: function initializeEvents() {
    this.addEvents(
      /**
       * @event before-launch
       * Fires before this application launches
       * @param {ExtMVC.App} this The application about to be launched
       */
      'before-launch',

      /**
       * @event launched
       * Fires once the application has been launched
       * @param {ExtMVC.App} this The application which has been launched
       */
      'launched'
    );
  }
});

ExtMVC.App.define = function(config) {
  ExtMVC.app = new ExtMVC.App(config);
};