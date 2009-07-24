/**
 * @class ExtMVC
 * ExtMVC 
 * @singleton
 */
ExtMVC = Ext.extend(Ext.util.Observable, {
  version: "0.6b1",
  
  constructor: function() {
    ExtMVC.superclass.constructor.apply(this, arguments);
    
    this.addEvents(
      /**
       * @event environment-changed
       * Fired whenever the environment is changed
       * @param {String} name The name of the new environment
       * @param {Object} config The configuration of the new environment
       */
      'environment-changed'
    );
    
    /**
     * Set up aliases
     */
    this.getEnvSettings = this.getCurrentEnvironmentSettings;
  },
  
  /**
   * Sets up Ext MVC with application-specific configuration. Internally, this creates a new
   * Ext.App instance and assigns it to the 'name' property inside the config object you pass in.
   * If not present, this defaults to 'MyApp'.  The config object is passed straight into ExtMVC.App's
   * constructor, so any of ExtMVC.App's configuration options can be set this way. Sample usage:
   * ExtMVC.setup({
   *   name: 'MyApp',
   *   usesHistory: true
   * });
   * This sets up an ExtMVC.App instance in the global variable MyApp, which is
   * the only global variable your application should need.
   * It automatically sets up namespaces for models, views and controllers, e.g.:
   * MyApp.models, MyApp.views, MyApp.controllers
   *
   * @param {Object} config Application configuration
   */
  setup: function(config) {
    this.app = new ExtMVC.App(config);
    this.name = this.app.name;
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
      }
      return this.controllers[controllerName];
    } else {
      return null;
    }
  },
  
  /**
   * @property currentEnvironment
   * @type String
   * The current code environment (defaults to production).  Read-only - use setCurrentEnvironment to change
   */
  currentEnvironment: 'production',
  
  /**
   * Used internally to manage environment variables... user addEnvironmentSettings and 
   * getEnvironmentSettings to change
   */
  environments: {'production': {}},
  
  /**
   * Sets the MVC environment to the specified name.  Usually one of 'production' or 'development'
   * Ignored if the environment has not yet been defined
   * @param {String} name The name of the environment to set.
   */
  setCurrentEnvironment: function(name) {
    if (this.getEnvironmentSettings(name)) {
      this.currentEnvironment = name;
      this.fireEvent('environment-changed', name, this.getEnvironmentSettings(name));
    }
  },
  
  /**
   * Returns the name of the current environment
   * @return {String} The name of the current environment
   */
  getCurrentEnvironment: function() {
    return ExtMVC.currentEnvironment;
  },
  
  /**
   * Returns settings for the current environment (aliased as getEnvSettings)
   * @return {Object} The settings for the current environment
   */
  getCurrentEnvironmentSettings: function() {
    return this.getEnvironmentSettings(this.getCurrentEnvironment());
  },
  
  /**
   * Adds settings for a given environment name
   * @param {String} name The name of the environment to add settings for
   * @param {Object} config The settings object to apply to this environment
   */
  addEnvironmentSettings: function(name, config) {
    ExtMVC.environments[name] = ExtMVC.environments[name] || {};
    Ext.apply(ExtMVC.environments[name], config);
  },
  
  /**
   * Retrieves all settings for a given environment (defaults to the current environment)
   * @param {String} name The name of the environment to get settings from
   * @return {Object} The settings object for the given environment, or null if not found
   */
  getEnvironmentSettings: function(name) {
    name = name || ExtMVC.environment;
    return ExtMVC.environments[name];
  }
});

ExtMVC = new ExtMVC();

Ext.ns('ExtMVC.router', 'ExtMVC.plugin', 'ExtMVC.controller', 'ExtMVC.view', 'ExtMVC.view.scaffold', 'ExtMVC.lib');

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
    
    Ext.onReady(function() {
      if (this.fireEvent('before-launch', this)) {
        this.initializeRouter();
        // this.initializeViewport();
        this.initializeEvents();

        if (this.usesHistory === true) this.initializeHistory();     

        this.launch();
        this.fireEvent('launched', this);
        
        /**
         * TODO: This used to reside in initializeHistory but this.launch() needs to be
         * called before this dispatches so it is temporarily here... ugly though
         */
        if (this.usesHistory && this.dispatchHistoryOnLoad) {
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
  launch: Ext.emptyFn,
  
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
  dispatch: function(dispatchConfig, scope, args) {
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
  initializeNamespaces: function(name) {
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
  initializeHistory: function() {
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
  onHistoryChange: function(token) {
    var match = this.router.recognise(token);
    
    if (match) {
      this.dispatch(match, null, [{url: token}]);
    };
  },
  
  /**
   * Sets up events emitted by the Application
   */
  initializeEvents: function() {
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

/*
 * Adapted from http://snippets.dzone.com/posts/show/3205
 */

ExtMVC.Inflector = {
  /*
   * The order of all these lists has been reversed from the way 
   * ActiveSupport had them to keep the correct priority.
   */
  Inflections: {
    plural: [
      [(/(quiz)$/i),               "$1zes"  ],
      [(/^(ox)$/i),                "$1en"   ],
      [(/([m|l])ouse$/i),          "$1ice"  ],
      [(/(matr|vert|ind)ix|ex$/i), "$1ices" ],
      [(/(x|ch|ss|sh)$/i),         "$1es"   ],
      [(/([^aeiouy]|qu)y$/i),      "$1ies"  ],
      [(/(hive)$/i),               "$1s"    ],
      [(/(?:([^f])fe|([lr])f)$/i), "$1$2ves"],
      [(/sis$/i),                  "ses"    ],
      [(/([ti])um$/i),             "$1a"    ],
      [(/(buffal|tomat)o$/i),      "$1oes"  ],
      [(/(bu)s$/i),                "$1ses"  ],
      [(/(alias|status)$/i),       "$1es"   ],
      [(/(octop|vir)us$/i),        "$1i"    ],
      [(/(ax|test)is$/i),          "$1es"   ],
      [(/s$/i),                    "s"      ],
      [(/$/),                      "s"      ]
    ],
    singular: [
      [(/(quiz)zes$/i),                                                    "$1"     ],
      [(/(matr)ices$/i),                                                   "$1ix"   ],
      [(/(vert|ind)ices$/i),                                               "$1ex"   ],
      [(/^(ox)en/i),                                                       "$1"     ],
      [(/(alias|status)es$/i),                                             "$1"     ],
      [(/(octop|vir)i$/i),                                                 "$1us"   ],
      [(/(cris|ax|test)es$/i),                                             "$1is"   ],
      [(/(shoe)s$/i),                                                      "$1"     ],
      [(/(o)es$/i),                                                        "$1"     ],
      [(/(bus)es$/i),                                                      "$1"     ],
      [(/([m|l])ice$/i),                                                   "$1ouse" ],
      [(/(x|ch|ss|sh)es$/i),                                               "$1"     ],
      [(/(m)ovies$/i),                                                     "$1ovie" ],
      [(/(s)eries$/i),                                                     "$1eries"],
      [(/([^aeiouy]|qu)ies$/i),                                            "$1y"    ],
      [(/([lr])ves$/i),                                                    "$1f"    ],
      [(/(tive)s$/i),                                                      "$1"     ],
      [(/(hive)s$/i),                                                      "$1"     ],
      [(/([^f])ves$/i),                                                    "$1fe"   ],
      [(/(^analy)ses$/i),                                                  "$1sis"  ],
      [(/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/i), "$1$2sis"],
      [(/([ti])a$/i),                                                      "$1um"   ],
      [(/(n)ews$/i),                                                       "$1ews"  ],
      [(/s$/i),                                                            ""       ]
    ],
    irregular: [
      ['move',   'moves'   ],
      ['sex',    'sexes'   ],
      ['child',  'children'],
      ['man',    'men'     ],
      ['person', 'people'  ]
    ],
    uncountable: [
      "sheep",
      "fish",
      "series",
      "species",
      "money",
      "rice",
      "information",
      "equipment"
    ]
  },
  
  ordinalize: function(number) {
    if (11 <= parseInt(number, 10) % 100 && parseInt(number, 10) % 100 <= 13) {
      return number + "th";
    } else {
      switch (parseInt(number, 10) % 10) {
        case  1: return number + "st";
        case  2: return number + "nd";
        case  3: return number + "rd";
        default: return number + "th";
      }
    }
  },
  
  pluralize: function(word) {
    var unusual = ExtMVC.Inflector.uncountableOrIrregular(word);
    if (unusual) { return unusual; }
    
    for (var i = 0; i < ExtMVC.Inflector.Inflections.plural.length; i++) {
      var regex          = ExtMVC.Inflector.Inflections.plural[i][0];
      var replace_string = ExtMVC.Inflector.Inflections.plural[i][1];
      if (regex.test(word)) {
        return word.replace(regex, replace_string);
      }
    }
    
    //return the word if it is already pluralized
    return word;
  },
  
  singularize: function(word) {
    var unusual = ExtMVC.Inflector.uncountableOrIrregular(word);
    if (unusual) { return unusual; }
    
    for (var i = 0; i < ExtMVC.Inflector.Inflections.singular.length; i++) {
      var regex          = ExtMVC.Inflector.Inflections.singular[i][0];
      var replace_string = ExtMVC.Inflector.Inflections.singular[i][1];
      
      if (regex.test(word)) {
        return word.replace(regex, replace_string);
      }
    }
    
    //return the word if it is already singularized
    return word;
  },
  
  uncountableOrIrregular: function(word) {
    for (var i = 0; i < ExtMVC.Inflector.Inflections.uncountable.length; i++) {
      var uncountable = ExtMVC.Inflector.Inflections.uncountable[i];
      if (word.toLowerCase == uncountable) {
        return uncountable;
      }
    }
    for (var i = 0; i < ExtMVC.Inflector.Inflections.irregular.length; i++) {
      var singular = ExtMVC.Inflector.Inflections.irregular[i][0];
      var plural   = ExtMVC.Inflector.Inflections.irregular[i][1];
      if ((word.toLowerCase == singular) || (word == plural)) {
        return plural;
      }
    }
    
    return false;
  }
};

/**
 * @class Array
 * Extensions to the array class
 */

/**
 * Turns an array into a sentence, joined by a specified connector - e.g.:
 * ['Adama', 'Tigh', 'Roslin'].toSentence(); //'Adama, Tigh and Roslin'
 * ['Adama', 'Tigh', 'Roslin'].toSentence('or'); //'Adama, Tigh or Roslin'
 * @param {String} connector The string to use to connect the last two words. Usually 'and' or 'or', defaults to 'and'
 */
Array.prototype.toSentence = function(connector) {
  connector = connector || 'and';
  
  var sentence = "";
  if (this.length <= 1) { 
    sentence = this[0];
  } else {
    //we'll join all but the last error with commas
    var firstErrors = this.slice(0, this.length - 1);
    
    //add the last error, with the connector string
    sentence = String.format("{0} {1} {2}", firstErrors.join(", "), connector, this[this.length - 1]);
  }
  return sentence;
};

/**
 * @class String
 * Extensions to the String class
 **/

/**
 * Capitalizes a string (e.g. ("some test sentence").capitalize() == "Some test sentence")
 * @return {String} The capitalized String
 */
String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.substr(1).toLowerCase();
};

/**
 * Puts the string in Title Case (e.g. ("some test sentence").titleize() == "Some Test Sentence")
 * @return {String} The titleized String
 */
String.prototype.titleize = function() {
  return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

/**
 * Takes any string and de-underscores and uppercases it
 * e.g. long_underscored_string => LongUnderscoredString
 */
String.prototype.camelize = function() {
  return this.replace(/_/g, " ").titleize().replace(/ /g, "");
};

/**
 * Underscores a string (e.g. (("SomeCamelizedString").underscore() == 'some_camelized_string', 
 *                             ("some normal string").underscore()  == 'some_normal_string')
 * @return {String} The underscored string
 */
String.prototype.underscore = function() {
  return this.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/ /g, "_").replace(/^_/, '');
};

/**
 * Uses the Inflector to singularize itself (e.g. ("cats").singularize() == 'cat')
 * @return {String} The singularized version of this string
 */
String.prototype.singularize = function() {
  return ExtMVC.Inflector.singularize(this);
};

/**
 * Uses the Inflector to pluralize itself (e.g. ("cat").pluralize() == 'cats')
 * @return {String} The pluralized version of this string
 */
String.prototype.pluralize = function() {
  return ExtMVC.Inflector.pluralize(this);
};

/**
 * Attempts to humanize a name by replacing underscores with spaces. Mainly useful for Ext.Model.Base
 * @return {String} The humanized string
 */
String.prototype.humanize = function() {
  return this.underscore().replace(/_/g, " ");
};

/**
 * Replaces instances of the strings &, >, < and " with their escaped versions
 * @return {String} The escaped version of the original text
 */
String.prototype.escapeHTML = function () {                                       
  return this.replace(/&/g,'&amp;').replace(/>/g,'&gt;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
};

/**
 * Converts this string into a currency, prepended with the given currency symbol
 * @param {String} symbol The currency symbol to use (defaults to $)
 */
String.prototype.toCurrency = function(symbol) {
  if (typeof(symbol) == 'undefined') {var symbol = '$';}
  
  var beforeDecimal = this.split(".")[0],
      afterDecimal  = this.split(".")[1];
  
  var segmentCount      = Math.floor(beforeDecimal.length / 3);
  var firstSegmentWidth = beforeDecimal.length % 3,
      pointerPosition   = firstSegmentWidth;
  
  var segments = firstSegmentWidth == 0 ? [] : [beforeDecimal.substr(0, firstSegmentWidth)];
  
  for (var i=0; i < segmentCount; i++) {
    segments.push(beforeDecimal.substr(firstSegmentWidth + (i * 3), 3));
  };
  
  beforeDecimal = symbol + segments.join(",");
  
  return afterDecimal ? String.format("{0}.{1}", beforeDecimal, afterDecimal) : beforeDecimal;
};

/**
 * @class ExtMVC.router.Router
 * @extends Object
 * TODO: [DOCS] Give a good description of the Router
 */
ExtMVC.router.Router = function() {};

ExtMVC.router.Router.prototype = {
  
  /**
   * @property mappings
   * @type Array
   * Readonly. Maintains the collection of defined routes
   */
  mappings: [],
  
  /**
   * @property namedRoutes
   * @type Object
   * Readonly. Maintains the collection of named routes
   */
  namedRoutes: {},
  
  /**
   * Adds a new route to the collection.  Routes are given priority in the order they are added
   * @param {String} re The regular expression-style string to match (e.g. ":controller/:action/:id")
   * @param {Object} additional_params Any additional options which will be returned along with the match elements if the route matches
   * @return {ExtMVC.router.Route} The newly created route object
   */
  connect: function(re, additional_params) {
    var route = new ExtMVC.router.Route(re, additional_params);
    this.mappings.push(route);
    
    return route;
  },
  
  /**
   * Defines a named route.  This is the same as using connect, but with the option to specify the route by name.  e.g.:
   * this.name('myRoute', 'my/custom/route/:id', {controller: 'myController', action: 'myAction'});
   * this.urlFor('myRoute', {id: 100}); //returns 'my/custom/route/100'
   * @param {String} routeName The string name to give this route
   * @param {String} re The regular expression-style string to match (e.g. ":controller/:action/:id")
   * @param {Object} additional_params Any additional options which will be returned along with the match elements if the route matches
   */
  name: function(routeName, re, additional_params) {
    this.namedRoutes[routeName] = this.connect(re, additional_params);
  },
  
  /**
   * Same as calling connect("", options) - connects the empty route string to a controller/action pair
   * @params {Object} options An object containing at least a controller and optionally an action (which is otherwise defaulted to index)
   */
  root: function(options) {
    var options = options || {};
    this.connect("", Ext.applyIf(options, { action: 'index' }));
  },
  
  /**
   * Adds specific index, new, show and edit routes for this resource. e.g.:
   * resources('videos') is equivalent to:
   * name('videos_path',     'videos',          {controller: 'videos', action: 'index'});
   * name('new_video_path',  'videos/new',      {controller: 'videos', action: 'new'  });
   * name('video_path',      'videos/:id',      {controller: 'videos', action: 'show' });
   * name('edit_video_path', 'videos/:id/edit', {controller: 'videos', action: 'edit' });
   *
   * You can pass a second parameter which is an options object, e.g.:
   * resources('videos', {controller: 'myController', myKey: 'myValue'}) sets up the following:
   * name('videos_path',     'videos',          {controller: 'myController', myKey: 'myValue', action: 'index'});
   * name('new_video_path',  'videos/new',      {controller: 'myController', myKey: 'myValue', action: 'new'  });
   * name('video_path',      'videos/:id',      {controller: 'myController', myKey: 'myValue', action: 'show' });
   * name('edit_video_path', 'videos/:id/edit', {controller: 'myController', myKey: 'myValue', action: 'edit' });
   * 
   * Also accepts a series of arguments - resources('videos', 'bookmarks', 'messages')
   * is the same as calling resources with each
   *
   * Finally, this format is also accepted:
   * resources('videos', 'bookmarks', 'messages', {controller: 'myController', myKey: 'myValue'})
   * Which is equivalent to calling resources with each of the three strings in turn, each with the
   * final argument passed as options
   */
  resources: function(resource_name, options) {
    //if we have been passed a bunch of strings, call resources with each
    if (arguments[1] && typeof(arguments[1]) == 'string') {
      var lastArg = arguments[arguments.length - 1];
      
      var opts = (typeof(lastArg) == 'object') ? lastArg : {};
      
      for (var i=0; i < arguments.length; i++) {
        //don't call with the last argument if it is an object as this is a generic settings object
        if (!(lastArg === arguments[i] && typeof(lastArg) == 'object')) {
          this.resources(arguments[i], opts);
        };
      };
      
      return;
    };
    
    //work out the named route names for index, show, new and edit actions
    var indexName = String.format("{0}_path",      resource_name.pluralize()  );
    var newName   = String.format("new_{0}_path",  resource_name.singularize());
    var showName  = String.format("{0}_path",      resource_name.singularize());
    var editName  = String.format("edit_{0}_path", resource_name.singularize());
    
    //add named routes for index, new, edit and show
    this.name(indexName, resource_name,               Ext.apply({}, {controller: resource_name, action: 'index'}));
    this.name(newName,   resource_name + '/new',      Ext.apply({}, {controller: resource_name, action: 'new'  }));
    this.name(showName,  resource_name + '/:id',      Ext.apply({}, {controller: resource_name, action: 'show', conditions: {':id': "[0-9]+"}}));
    this.name(editName,  resource_name + '/:id/edit', Ext.apply({}, {controller: resource_name, action: 'edit', conditions: {':id': "[0-9]+"}}));
  },
  
  /**
   * Given a hash containing at route segment options (e.g. {controller: 'index', action: 'welcome'}),
   * attempts to generate a url and redirect to it using Ext.History.add.
   * All arguments are passed through to this.urlFor()
   * @param {Object} options An object containing url segment options (such as controller and action)
   * @return {Boolean} True if a url was generated and redirected to
   */
  redirectTo: function() {
    var url = this.urlFor.apply(this, arguments);
    if (url) {
      Ext.History.add(url);
      return true;
    } else return false;
  },
  
  /**
   * Constructs and returns a config object for a Ext.History based link to a given url spec.  This does not create
   * an Ext.Component, only a shortcut to its config.  This is intended for use in quickly generating menu items
   * @param {Object} urlOptions A standard url generation object, e.g. {controller: 'index', action: 'welcome'}
   * @param {Object} linkOptions Options for the link itself, e.g. {text: 'My Link Text'}
   * @return {Object} a constructed config object for the given parameters
   */
  linkTo: function(urlOptions, linkOptions) {
    var linkOptions = linkOptions || {};
    
    var url = this.urlFor(urlOptions);
    if (url) {
      return Ext.applyIf(linkOptions, {
        url:     url,
        cls:     [urlOptions.controller, urlOptions.action, urlOptions.id].join("-").replace("--", "-").replace(/-$/, ""),
        text:    this.constructDefaultLinkToName(urlOptions, linkOptions),
        handler: function() {Ext.History.add(url);}
      });
    } else throw new Error("No match for that url specification");
  },
  
  /**
   * Attempts to create good link name for a given object containing action and controller.  Override with your own 
   * function to create custom link names for your app
   * @param {Object} urlOptions An object containing at least controller and action properties
   * @param {Object} linkOptions An object of arbitrary options for the link, initially passed to linkTo.  Not used
   * in default implementation but could be useful when overriding this method
   * @return {String} The best-guess link name for the given params.
   */
  constructDefaultLinkToName: function(urlOptions, linkOptions) {
    if (!urlOptions || !urlOptions.controller || !urlOptions.action) {return "";}
    var linkOptions = linkOptions || {};
    
    Ext.applyIf(linkOptions, {
      singularName: urlOptions.controller.singularize()
    });
    
    var actionName = urlOptions.action.titleize();
    if (actionName == 'Index') {
      return "Show " + urlOptions.controller.titleize();
    } else {
      return actionName + " " + linkOptions.singularName.titleize();
    }
  },
  
  /**
   * @params {String} url The url to be matched by the Router.  Router will match against
   * all connected matchers in the order they were connected and return an object created
   * by parsing the url with the first matching matcher as defined using the connect() method
   * @returns {Object} Object of all matches to this url
   */
  recognise: function(url) {
    for (var i=0; i < this.mappings.length; i++) {
      var m = this.mappings[i];
      var match = m.matchesFor(url);
      if (match) { return match; }
    };
    
    return false;
  },
  
  /**
   * Takes an object of url generation options such as controller and action.  Returns a generated url.
   * For a url to be generated, all of these options must match the requirements of at least one route definition
   * @param {Object/String} options An object containing url options, or a named route string.
   * @param {Object} namedRouteOptions If using a named route, this object is passed as additional parameters.  e.g:
   * this.name('myRoute', 'my/custom/route/:id', {controller: 'myController', action: 'myAction'});
   * this.urlFor('myRoute', {id: 100}); //returns 'my/custom/route/100'
   * this.urlFor('myRoute', 100);       //returns 'my/custom/route/100' - number argument assumed to be an ID
   * this.urlFor('myRoute', modelObj);  //returns 'my/custom/route/100' if modelObj is a model object where modelObj.data.id = 100
   * @return {String} The generated url, or false if there was no match
   */
  urlFor: function(options, namedRouteOptions) {
    var route;
    
    //named route
    if (typeof(options) == 'string') {
      if (route = this.namedRoutes[options]) {
        var namedRouteOptions = namedRouteOptions || {};
        
        //normalise named route options in case we're passed an integer
        if (typeof(namedRouteOptions) == 'number') {
          namedRouteOptions = {id: namedRouteOptions};
        };
        
        //normalise named route options in case we're passed a model instance
        if (namedRouteOptions.data && namedRouteOptions.data.id) {
          namedRouteOptions = {id: namedRouteOptions.data.id};
        };
        
        return route.urlForNamed(namedRouteOptions);
      };
    } 
    //non-named route
    else {
      for (var i=0; i < this.mappings.length; i++) {
        route = this.mappings[i]; var u = route.urlFor(options);
        if (u) { return u; }
      };
    };
    
    //there were no matches so return false
    return false;
  },
  
  //experimental...
  withOptions: function(options, routes) {
    var options = options || {};
    
    var defaultScope = this;
    var optionScope  = {};
    
    optionScope.prototype = this;
    Ext.apply(optionScope, {
      connect: function(re, additional_params) {
        var additional_params = additional_params || {};
        Ext.applyIf(additional_params, options);
        
        defaultScope.connect.call(defaultScope, re, additional_params);
      },
      
      name: function(routeName, re, additional_params) {
        var additional_params = additional_params || {};
        Ext.applyIf(additional_params, options);
        
        defaultScope.name.call(defaultScope, routeName, re, additional_params);
      }
    });
    
    routes.call(this, optionScope);
  }
};

/**
 * Basic default routes.  Redefine this method inside config/routes.js
 */
ExtMVC.router.Router.defineRoutes = function(map) {
  map.connect(":controller/:action");
  map.connect(":controller/:action/:id");
};

/**
 * @class ExtMVC.router.Route
 * @extends Object
 * TODO: [DOCS] Rewrite this horrible nonsense
 */
ExtMVC.router.Route = function(mappingString, options) {
  this.mappingString = mappingString;
  this.options       = options || {};
  
  //The regular expression we use to match a segment of a route mapping
  //this will recognise segments starting with a colon,
  //e.g. on 'namespace/:controller/:action', :controller and :action will be recognised
  this.paramMatchingRegex = new RegExp(/:([0-9A-Za-z\_]*)/g);
  
  /**
   * Converts a route string into an array of symbols starting with a colon. e.g.
   * ":controller/:action/:id" => [':controller', ':action', ':id']
   */
  this.paramsInMatchString = this.mappingString.match(this.paramMatchingRegex) || [];
  this.paramsInStringWithOptions = [];
  
  /**1
   * Store and remove any route conditions specified
   */
  this.conditions = this.options.conditions || {};
  if (this.options.conditions) { delete this.options.conditions; }
  
  for (var i=0; i < this.paramsInMatchString.length; i++) {
    this.paramsInStringWithOptions.push(this.paramsInMatchString[i]);
  };
  
  for (var o in options) {
    this.paramsInStringWithOptions.push(":" + o);
  }
  
  this.matcherRegex = this.convertToUsableRegex(mappingString);
};

ExtMVC.router.Route.prototype = {
  /**
   * @param {url} The url we want to match against this route to see if it matches
   * @return {boolean} Returns true if this route matches the url
   */
  recognises: function(url) {
    return this.matcherRegex.test(url);
  },
  
  /**
   * @param {url} The url we want to provide matches for
   * @return {Object} Object of all matches for this url, as well as additional params as defined in the route
   */
  matchesFor: function(url) {
    if (!this.recognises(url)) {return false;};
    
    var parameters = {};
    
    var keys   = this.paramsInMatchString;
    var values = url.match(this.matcherRegex);
    values.shift(); //first value is the entire match so reject
    
    for (var i = keys.length - 1; i >= 0; i--){
      parameters[keys[i].replace(":", "")] = values[i];
    };
    
    //add any additional parameter options specified in the route definition
    for (option in this.options) {
      parameters[option] = this.options[option];
    }
    
    return parameters;
  },
  
  urlForNamed: function(options) {
    var options = options || {};
    
    return this.urlFor(Ext.applyIf(options, this.options));
  },
  
  /**
   * Attempts to build a url with this route, swapping the placeholders with properties of the options hash
   */
  urlFor: function(options) {
    var url = this.mappingString;
    
    for (var o in options) {
      //values in options must match this.options - e.g. this.options.action must be the same as options.action
      if (options[o] && this.options[o] && options[o] != this.options[o]) { return false; }
    }
    
    
    //TODO: Tidy this up.  All of it

    var paramsInOptions = [];
    for (var o in options) {
      paramsInOptions.push(":" + o);
    }
    
    paramsInOptions = paramsInOptions.sort();
    var paramsInStringWithOptions = this.paramsInStringWithOptions.sort();
    
    //make sure that all match elements in the url string are included.  If not, return false
    if (paramsInStringWithOptions.length != paramsInOptions.length) { return false; }
    for (var i=0; i < paramsInOptions.length; i++) {
      if (paramsInOptions[i] != paramsInStringWithOptions[i]) {
        return false;
      }
    };
    
    for (var o in options) {
      url = url.replace(":" + o, options[o]);
    }
    
    return url;
  },
  
  /**
   * Private: For a given string, replaces all substrings starting with a colon into
   * a regex string that can match a url segment. 
   * e.g. :controller/:action => '^([a-zA-Z0-9\_]+)/([a-zA-Z0-9\_]+)$'
   * If any conditions have been specified on this route, their regular expressions are used instead:
   * :controller/:action/:id => '^([a-zA-Z0-9\_]+)/([a-zA-Z0-9\_]+)/([0-9]+)$'
   * if conditions was set to {":id" =>/[0-9]+]/}
   * @param {String} regex_string The string we want to turn into a matchable regex
   * @return {String} The replaced string
   */
  convertToUsableRegex: function(regex_string) {
    var p = this.paramsInMatchString;
    
    for (var i = p.length - 1; i >= 0; i--){
      var cond = this.conditions[p[i]];
      var matcher = String.format("({0})", cond || "[a-zA-Z0-9\_,]+");
      
      regex_string = regex_string.replace(new RegExp(p[i]), matcher);
    };
    
    //we want to match the whole string, so include the anchors
    return new RegExp("^" + regex_string + "$");
  }
};

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

/**
 * @class ExtMVC.controller.Controller
 * @extends Ext.util.Observable
 * <h1>Controllers in Ext MVC</h1>
 * <p>Controllers are the glue that stick applications together. They listen to events emitted by the UI as the user
 * clicks interface elements, and take actions as appropriate. The relevant action may be to create or save a model
 * instance, to render another view, to perform AJAX requests, or any other action.</p>
 * 
 * <p>Controllers should be kept skinny as far as possible - receive an event, then hand any processing off to the 
 * appropriate model. This ensures we can keep the code as DRY as possible and makes refactoring easier.</p>
 * 
 * <h2>Example Controller</h2>
 * Here is a simple example controller which renders a couple of views and listens to events:
<pre><code>
//simple controller which manages the Page model within our application
MyApp.controllers.PagesController = Ext.extend(ExtMVC.controller.Controller, {
  name: 'pages',

  //renders the 'Index' template and sets up listeners
  index: function() {
    this.render('Index', {
      listeners: {
        scope   : this,
        'edit'  : this.edit,
        'delete': this.destroy
      }
    });
  },

  //renders the 'Edit' template (let's say it's a FormPanel), and loads the instance
  edit: function(instance) {
    this.render('Edit', {
      listeners: {
        scope  : this,
        save   : this.update,
        cancel : function() {
          alert("You cancelled the update!");
        }
      }
    }).loadRecord(instance);
  },

  //when the 'delete' event is fired by our 'Index' template (see the index action), this method is called.
  //In this fictional example, we assume that the templates 'delete' event was called with the single argument
  //of the Page instance the user wishes to destroy
  destroy: function(instance) {
    instance.destroy({
      success: function() {
        alert("The Page was deleted");
        //at this point we might render another page for the user to look at
      },
      failure: function() {
        alert('Curses! The Page could not be deleted');
      }
    });
  },

  //when the 'save' event is fired by our 'Edit' template, this method is called.
  //Again, we assume that our template fired the event with the Page instance, and also an object with updates
  update: function(instance, updates) {
    //this applies the updates to the model instance and saves
    instance.update(updates, {
      success: function(updatedInstance) {
        alert('Success! It saved');
        //at this point we might render another page for the user to look at
      },
      failure: function(updatedInstance) {
        alert('Darn it. Did not save');

        //here we're firing the controller's update-failed event, which the view can pick up on
        //The view can simply listen to our Pages controller and add errors from this instance to the form
        //using form.markInvalid(instance.errors.forForm())
        this.fireEvent('update-failed', instance);
      };
    });
  },

   //Sets up events emitted by this controller. Controllers are expected to fire events, so this method is called
   //automatically when a controller is instantiated. Don't forget to call super here
  initEvents: function() {
    this.addEvents(
      //this event will be fired when the controller can't update a Page instance
      'update-failed'
    );

    MyApp.controllers.PagesController.superclass.initEvents.apply(this, arguments);
  }
})
</code></pre>
 * Note that many of the methods above are provided by the {@link ExtMVC.controller.CrudController CrudController}
 * 
 * <h2>Rendering Views</h2>
 * Each controller can automatically render view classes inside its views package. In the Pages controller above the
 * views package is MyApp.views.pages - the application itself is called MyApp, and the 'pages' segment comes from the
 * controller's 'name' property
 * <br />
 * <br />
 * In the example above, the line: <pre><code>this.render('Edit', {})</code></pre> will automatically find the
 * MyApp.views.pages.Edit class, with the second argument to this.render being a config argument passed to the view's constructor.
 * 
 * <br />
 * <h4>Rendering strategies</h4>
 * Not all applications will render views in the same way
 */
ExtMVC.controller.Controller = Ext.extend(Ext.util.Observable, {
  
  /**
   * @property name
   * @type String
   * The string name for this controller. Used to automatically register the controller with ExtMVC,
   * and to include all views under the view package of the same name.  For example, if your application is
   * called MyApp and the controller name is users, all views in the MyApp.views.users namespace will be 
   * registered automatically for use with this.render().
   */
  name: null,
  
  onExtended: function() {
    if (this.name != null) {
      this.viewsPackage = Ext.ns(String.format("{0}.views.{1}", ExtMVC.name, this.name));
      
      ExtMVC.registerController(this.name, this.constructor);
    }
  },
  
  constructor: function(config) {
    ExtMVC.controller.Controller.superclass.constructor.apply(this, arguments);
    
    Ext.apply(this, config || {});
    
    this.initEvents();
    this.initListeners();
  },
  
  /**
   * Sets up events emitted by this controller. This defaults to an empty function and is
   * called automatically when the controller is constructed so can simply be overridden
   */
  initEvents: function() {},
  
  /**
   * Sets up events this controller listens to, and the actions the controller should take
   * when each event is received.  This defaults to an empty function and is called when
   * the controller is constructed so can simply be overridden
   */
  initListeners: function() {},
  
  /**
   * Shows the user a notification message. Usually used to inform user of a successful save, deletion, etc
   * This is an empty function which you must implement yourself
   * @param {String} notice The string notice to display
   */
  showNotice: function(notice) {},
  
  /**
   * Returns the view class registered for the given view name, or null
   * @param {String} viewName The name registered for this view with this controller
   * @return {Function/null} The view class (or null if not present)
   */
  getViewClass: function(viewName) {
    return this.viewsPackage[viewName];
  },
  
  /**
   * @property addTo
   * @type Ext.Container
   * The container to add views to using the 'add' renderMethod.  Usually set to an Ext.TabPanel instance or similar
   */
  addTo: null,
  
  /**
   * Renders a given view name in the way set up by the controller.  For this to work you must have passed a 
   * 'name' property when creating the controller, which is automatically used to find the view namespace for
   * this controller.  For example, in an application called MyApp, and a controller with a name of 'users',
   * the view namespace would be MyApp.views.users, and render('Index') would search for a class called
   * MyApp.views.users.Index and instantiate it with the passed config.
   * An error is thrown if the view could not be found.
   * @param {String} viewName The name of the view class within the view namespace used by this controller
   * @param {Object} config Configuration options passed through to the view class' constructor
   * @return {Ext.Component} The view object that was just created
   */
  render: function(viewName, config) {
    var viewC = this.getViewClass(viewName);
    
    if (typeof viewC == "function") {
      var view = new viewC(config);
      if (this.addTo) this.renderViaAddTo(view);
      
      return view;
    } else {
      throw new Error(String.format("View '{0}' not found", viewName));
    }
  },
  
  /**
   * Adds the given component to this application's main container.  This is usually a TabPanel
   * or similar, and must be assigned to the controllers addTo property.  By default,
   * this method removes any other items from the container first, then adds the new component
   * and calls doLayout
   * @param {Ext.Component} component The component to add to the controller's container
   */
  renderViaAddTo: function(component) {
    if (this.addTo != undefined) {
      this.addTo.removeAll();
      this.addTo.doLayout();        
      
      this.addTo.add(component);
      this.addTo.doLayout();
    }
  }
});

Ext.reg('controller', ExtMVC.controller.Controller); 

/**
 * @class ExtMVC.controller.CrudController
 * @extends ExtMVC.controller.Controller
 * <h1>CRUD Controller</h1>
 * <p>The CRUD Controller is an extension of Controller which provides the generic CRUD actions (Create, Read, Update and Delete).
 * Although CRUD Controller provides sensible default options for most cases, it is also highly extensible. Here's an example for
 * managing CRUD operations on a fictional 'Page' model in our app. Note that the name and model are the only required properties
 * for a CRUD controller with default behaviour:</p>
<pre><code>
MyApp.controllers.PagesController = Ext.extend(ExtMVC.controller.CrudController, {
  //the name of the controller (see {@link ExtMVC.controller.Controller})
  name : 'pages',
  
  //The model that this controller will be providing CRUD services for
  model: MyApp.models.Page,
  
  //override the default behaviour that occurs when the 'create' action was successfully completed
  onCreateSuccess: function(instance) {
    alert('new Page successfully created!');
  },
  
  //override the listeners that are attached to the Index view. The Index view is usually an instance of
  //{@link ExtMVC.view.scaffold.Index} or a subclass of it.
  getIndexViewListeners: function() {
    return {
      scope : this,
      'edit': function(instance) {
        alert('inside the Index view (usually a scaffold grid), the user wants to edit an instance');
      }
    };
  },
  
  //provide our own implementation for destroy
  destroy: function(instance) {
    alert('user wants to destroy an instance');
  }
});
</code></pre>
 * 
 * <p>The 3 CRUD Controller methods that take action are create, update and destroy<p>
 * <p>The 3 CRUD Controller methods that render views are index, new and edit</p>
 * <p>By default, CRUD Controllers render the scaffolding views, which provide sensible default views.
 * The index action renders a {@link ExtMVC.view.scaffold.Index Scaffold Grid}, edit renders a 
 * {@link ExtMVC.view.scaffold.Edit Scaffold Edit Form} and new renders a {@link ExtMVC.view.scaffold.New Scaffold New Form}</p>
 * <p>To make CRUD controller render a customised view instead of the scaffold, simply define the relevant view and ensure it is
 * available within your code. For example, if you want to show a customised Ext.Panel instead of the Scaffold Grid on index,
 * simply define:</p>
<pre><code>
MyApp.views.pages.Index = Ext.extend(Ext.Panel, {
  title: 'My Specialised Index view - replaces the scaffold grid'
});
</code></pre>
 * <p>The same applies with Edit and New classes within the appropriate views namespace. See more on view namespaces in
 * {@link ExtMVC.controller.Controller Controller}.</p>
 */
ExtMVC.controller.CrudController = Ext.extend(ExtMVC.controller.Controller, {
  /**
   * @property model
   * @type Function/Null
   * Defaults to null.  If set to a reference to an ExtMVC.model subclass, renderView will attempt to dynamically
   * scaffold any missing views, if the corresponding view is defined in the ExtMVC.view.scaffold package
   */
  model: null,

  /**
   * Attempts to create a new instance of this controller's associated model
   * @param {Object} data A fields object (e.g. {title: 'My instance'})
   */
  create: function(data, form) {
    var instance = new this.model(data);

    instance.save({
      scope:   this,
      success: this.onCreateSuccess,
      failure: this.onCreateFailure
    });
  },
  
  /**
   * Attempts to find (read) a single model instance by ID
   * @param {Number} id The Id of the instance to read
   */
  read: function(id) {
    this.model.findById(id, {
      scope: this,
      success: function(instance) {
        this.fireEvent('read', instance);
      },
      failure: function() {
        this.fireEvent('read-failed', id);
      }
    });
  },
  
  /**
   * Attempts to update an existing instance with new values.  If the update was successful the controller fires
   * the 'update' event and then shows a default notice to the user (this.showUpdatedNotice()) and calls this.index().
   * To cancel this default behaviour, return false from any listener on the 'update' event.
   * @param {ExtMVC.model.Base} instance The existing instance object
   * @param {Object} updates An object containing updates to apply to the instance
   */
  update: function(instance, updates) {
    for (var key in updates) {
      instance.set(key, updates[key]);
    }
    
    instance.save({
      scope:   this,
      success: function(instance) {
        this.onUpdateSuccess(instance, updates);
      },
      failure: function() {
        this.onUpdateFailure(instance, updates);
      }
    });
  },
  
  /**
   * Attempts to delete0 an existing instance
   * @param {Mixed} instance The ExtMVC.model.Base subclass instance to delete.  Will also accept a string/number ID
   */
  destroy: function(instance) {
    if (instance.destroy == undefined) {
      //if we're passed an ID instead of an instance
      this.model.destroy(parseInt(instance, 10));
    } else {
      instance.destroy({
        scope:   this,
        success: this.onDestroySuccess,
        failure: this.onDestroyFailure
      });
    }
  },
  
  /**
   * Renders the custom Index view if present, otherwise falls back to the default scaffold grid
   */
  index: function() {
    var index = this.render('Index', {
      model       : this.model,
      controller  : this,
      listeners   : this.getIndexViewListeners(),
      viewsPackage: this.viewsPackage
    });
    
    this.fireEvent('index');
    
    return index;
  },
  
  /**
   * Renders the custom New view if present, otherwise falls back to the default scaffold New form
   */
  build: function() {
    return this.render('New', {
      model       : this.model,
      controller  : this,
      listeners   : this.getBuildViewListeners(),
      viewsPackage: this.viewsPackage
    });
  },

  /**
   * Renders the custom Edit view if present, otherwise falls back to the default scaffold Edit form
   * @param {Mixed} instance The model instance to edit. If not given an ExtMVC.model.Base
   * instance, a findById() will be called on this controller's associated model
   */
  edit: function(instance) {
    if (instance instanceof Ext.data.Record) {
      var editView = this.render('Edit', {
        model       : this.model,
        controller  : this,
        listeners   : this.getEditViewListeners(),
        viewsPackage: this.viewsPackage,
        id          : String.format("{0}_edit_{1}", this.name, instance.get(instance.primaryKey))
      });
      
      editView.loadRecord(instance);
      
      this.onEdit(editView, instance);
      this.fireEvent('edit', instance);
      
      return editView;
    } else {
      var id = instance;
      
      this.model.find(parseInt(id, 10), {
        scope  : this,
        success: function(instance) {
          this.edit(instance);
        }
      });
    }
  },
  
  /**
   * Returns a listeners object passed to the Index view when rendered inside the index action. This contains 
   * default listeners, but can be overridden in subclasses to provide custom behaviour
   * @return {Object} The listeners object
   */
  getIndexViewListeners: function() {
    return {
      scope   : this,
      'delete': this.destroy,
      'new'   : this.build,
      'edit'  : this.edit
    };
  },
  
  /**
   * Returns a listeners object passed to the Edit view when rendered inside the edit action. This contains 
   * default listeners, but can be overridden in subclasses to provide custom behaviour
   * @return {Object} The listeners object
   */
  getEditViewListeners: function() {
    return {
      scope : this,
      cancel: this.index,
      save  : this.update
    };
  },
  
  /**
   * Returns a listeners object passed to the New view when rendered inside the build action. This contains 
   * default listeners, but can be overridden in subclasses to provide custom behaviour
   * @return {Object} The listeners object
   */
  getBuildViewListeners: function() {
    return {
      scope : this,
      cancel: this.index,
      save  : this.create
    };
  },
  
  /**
   * Called when an instance has been successfully created.  This just calls this.showNotice
   * with a default message for this model. Overwrite to provide your own implementation
   */
  showCreatedNotice: function() {
    this.showNotice(String.format("{0} successfully created", this.model.prototype.singularHumanName));
  },
  
  /**
   * Called when an instance has been successfully updated.  This just calls this.showNotice
   * with a default message for this model. Overwrite to provide your own implementation
   */
  showUpdatedNotice: function() {
    this.showNotice(String.format("{0} successfully updated", this.model.prototype.singularHumanName));    
  },
  
  /**
   * Called when an instance has been successfully destroyed.  This just calls this.showNotice
   * with a default message for this model. Overwrite to provide your own implementation
   */
  showDestroyedNotice: function() {
    this.showNotice(String.format("{0} successfully deleted", this.model.prototype.singularHumanName));    
  },
  
  /**
   * Called after a successful update. By default this calls showUpdatedNotice and then this.index()
   * @param {ExtMVC.model.Base} instance The newly updated instance
   * @param {Object} updates The updates that were made
   */
  onCreateSuccess: function(instance) {
    if(this.fireEvent('create', instance) !== false) {
      this.showCreatedNotice();
      this.index();
    }
  },
  
  /**
   * Called after an unsuccessful update. By default this simply fires the 'update-failed' event
   * @param {ExtMVC.model.Base} instance The instance that could not be updated
   * @param {Object} updates The updates that were attempted to be made
   */
  onCreateFailure: function(instance) {
    this.fireEvent('create-failed', instance);
  },
  
  /**
   * Called after a successful update. By default this calls showUpdatedNotice and then this.index()
   * @param {ExtMVC.model.Base} instance The newly updated instance
   * @param {Object} updates The updates that were made
   */
  onUpdateSuccess: function(instance, updates) {
    if (this.fireEvent('update', instance, updates) !== false) {
      this.showUpdatedNotice();
      this.index();          
    }
  },
  
  /**
   * Called after an unsuccessful update. By default this simply fires the 'update-failed' event
   * @param {ExtMVC.model.Base} instance The instance that could not be updated
   * @param {Object} updates The updates that were attempted to be made
   */
  onUpdateFailure: function(instance, updates) {
    this.fireEvent('update-failed', instance, updates);
  },
  
  /**
   * Called after successful destruction of a model instance. By default simply fires the 'delete' event
   * with the instance as a single argument
   * @param {ExtMVC.model.Base} instance The instane that was just destroyed
   */
  onDestroySuccess: function(instance) {
    this.fireEvent('delete', instance);
    
    this.showDestroyedNotice();
  },
  
  /**
   * Called after unsuccessful destruction of a model instance. By default simply fires the 'delete-failed' event
   * with the instance as a single argument
   * @param {ExtMVC.model.Base} instance The instance that could not be destroyed
   */
  onDestroyFailure: function(instance) {
    this.fireEvent('delete-failed', instance);
  },
  
  /**
   * Called whenever the Edit form has been rendered for a given instance. This is an empty function by default,
   * which you can override to provide your own logic if needed
   * @param {Ext.Component} form The rendered Edit form
   * @param {ExtMVC.model.Base} instance The instance loaded into the form
   */
  onEdit: function(form) {},
  
  /**
   * Sets up events emitted by the CRUD Controller's actions
   */
  initEvents: function() {
    this.addEvents(
      /**
       * @event create
       * Fired when a new instance has been successfully created
       * @param {ExtMVC.model.Base} instance The newly created model instance
       */
      'create',
      
      /**
       * @event create-failed
       * Fired when an attempt to create a new instance failed
       * @param {ExtMVC.model.Base} instance The instance object which couldn't be saved
       */
      'create-failed',
      
      /**
       * @event read
       * Fired when a single instance has been loaded from the database
       * @param {ExtMVC.model.Base} instance The instance instance that was loaded
       */
      'read',
      
      /**
       * @event read-failed
       * Fired when an attempt to load a single instance failed
       * @param {Number} id The ID of the instance we were attempting to find
       */
      'read-failed',
      
      /**
       * @event update
       * Fired when an existing instance has been successfully created
       * @param {ExtMVC.model.Base} instance The updated instance
       * @param {Object} updates The updates object that was supplied
       */
      'update',
      
      /**
       * @event update-failed
       * Fired when an attempty to update an existing instance failed
       * @param {ExtMVC.model.Base} instance The instance we were attempting to update
       * @param {Object} updates The object of updates we were trying to apply
       */
      'update-failed',
      
      /**
       * @event delete
       * Fired when an existing instance has been successfully deleteed
       * @param {ExtMVC.model.Base} instance The instance that was deleteed
       */
      'delete',
      
      /**
       * @event delete-failed
       * Fired when an attempt to delete an existing instance failed
       * @param {ExtMVC.model.Base} instance The instance we were trying to delete
       */
      'delete-failed',
      
      /**
       * @event index
       * Fired when an instances collection has been loaded from the database
       */
      'index',
      
      /**
       * @event edit
       * Fired when an instance is being edited
       * @param {ExtMVC.model.Base} instance The instance being edited
       */
      'edit'
    );
  },
  
  /**
   * If a view of the given viewName is defined in this controllers viewPackage, a reference to its
   * constructor is defined.  If not, a reference to the default scaffold for the viewName is returned
   * @param {String} viewName The name of the view to return a constructor function for
   * @return {Function} A reference to the custom view, or the scaffold fallback
   */
  getViewClass: function(viewName) {
    var userView = ExtMVC.controller.CrudController.superclass.getViewClass.call(this, viewName);
    
    return (userView == undefined) ? this.scaffoldViewName(viewName) : userView;
  },
  
  /**
   * Returns a reference to the Scaffold view class for a given viewName
   * @param {String} viewName The name of the view to return a class for (index, new, edit or show)
   * @return {Function} A reference to the view class to instantiate to render this scaffold view
   */
  scaffoldViewName: function(viewName) {
    return ExtMVC.view.scaffold[viewName.titleize()];
  }
});

/**
 * @class ExtMVC.model
 * @extends Object
 * Manages the definition and creation of model classes.
 * 
 * <h2>Defining models</h2>
 * <p>Models in your application are defined using Ext.model.define, which is given 2 arguments - the String name of your model and a config object</p>
 * <p>
 * <pre><code>
ExtMVC.model.define("MyModel", {
  fields: [
    {name: 'id',    type: 'int'},
    {name: 'title', type: 'string'},
    {name: 'price', type: 'int'}
  ],

  validatesPresenceOf: ['id', 'title'],
  classMethods: {
    doSomething: function() {alert('oh hi!');}
  }
});
</code></pre>
 * 
 * Fields are passed straight to the underlying Ext.data.Record.
 * classMethods are defined on the constructor function, e.g. from the example above:
 * 
<pre><code>
MyModel.doSomething(); //alerts 'oh hi'
</code></pre>
 * 
 * All other properties are simply assigned to the Model's prototype, but may be intercepted by plugins
 * 
 * <h2>Extending other models</h2>
 * Models can extend other models using the 'extend' property:
<pre></code>
ExtMVC.model.define("Product", {
  fields: [...]
}

ExtMVC.model.define("Flower", {
  extend: "Product",
  fields: [...]
}
</code></pre>
 * 
 * The class builds a simple dependency graph to allow models to extend other models, e.g.:
 * 
<pre><code>
//this model definition will not actually be created until SuperUser has been defined
ExtMVC.model.define("SuperUser", {
  extend: "User",
  fields: [
    {name: 'isAdmin', type: 'bool'}
  ]
});

//SuperUser does not extend anything, so is created immediately. User is then also created
ExtMVC.model.define("User", {
  fields: [
    {name: 'id',       type: 'int'},
    {name: 'username', type: 'string'}
  ],

  validatesPresenceOf: ['id', 'username']
});

//At this point both SuperUser and User have been created and are instantiable and extendable.
</code></pre>
 * 
 * When a model extends another one it inherits all of that model's instance and class methods. It also
 * inherits all of the superclass model's fields, overwriting if redefined in the subclass. In the example
 * above the SuperUser model would have fields 'id', 'username' and 'isAdmin', and will also have inherited
 * User's validatesPresenceOf declaration
 * 
 * @singleton
 */
ExtMVC.model = {
  /**
   * @property pendingCreation
   * @type Object
   * An object of model creation configurations awaiting definition because their dependency model(s) have not yet
   * been defined. e.g. {'User': [{name: 'SuperUser', config: someConfigObject}, {name: 'AdminUser', config: anotherCfgObj}]}
   * signifies that SuperUser and AdminUser should be defined as soon as User has been defined
   */
  pendingCreation: {},
  
  /**
   * Returns an array of any Model subclasses waiting for this model to be defined
   * @param {String} modelName The dependency model name to check against
   * @return {Array} An array of model definitions (e.g. [{name: 'MyModel', config: someObject}])
   */
  getModelsPendingDefinitionOf: function(modelName) {
    return this.pendingCreation[modelName] || [];
  },
  
  /**
   * Adds a model definition to the pendingCreation object if it is waiting for another model to be defined first
   * @param {String} dependencyModelName The name of another model which must be created before this one
   * @param {String} dependentModelName The name of the new model to be defined after its dependency
   * @param {Object} config The new model's config object, as sent to ExtMVC.model.define
   */
  setModelPendingDefinitionOf: function(dependencyModelName, dependentModelName, config) {
    var arr = this.pendingCreation[dependencyModelName] || [];
    
    arr.push({name: dependentModelName, config: config});
    
    this.pendingCreation[dependencyModelName] = arr;
  },
  
  /**
   * @property strictMode
   * @type Boolean
   * Throws errors rather than return false when performing operations such as overwriting existing models
   * Defaults to false
   */
  strictMode: false,
  
  /**
   * @property modelNamespace
   * @type Object
   * The object into which Models are defined.  This defaults to window, meaning calls to ExtMVC.model.create
   * will create models globally scoped unless this is modified.  Setting this instead to MyApp.models would 
   * mean that a model called 'User' would be defined as MyApp.models.User instead
   */
  modelNamespace: window,

  /**
   * Sets a model up for creation.  If this model doesn't extend any other Models that haven't been defined yet
   * it is returned immediately, otherwise it is placed into a queue and defined as soon as its dependency models
   * are in place. Example:
   * 
   * ExtMVC.model.define('MyApp.models.MyModel', {
   *   fields: [
   *     {name: 'title',     type: 'string'},
   *     {name: 'price',     type: 'number'},
   *     {name: 'available', type: 'bool'}
   *   ],
   *   
   *   //Adds tax to the price field
   *   calculatePrice: function() {
   *     return this.data.price * 1.15;
   *   },
   * 
   *   classMethods: {
   *     findAvailable: function() {
   *       //some logic to find all available MyModel's
   *     }
   *   }
   * });
   * 
   * var m = new MyApp.models.MyModel({title: 'Test', available: true, price: 100});
   * m.calculatePrice(); // => 115
   * MyApp.models.MyModel.findAvailable(); // => Returns as defined above
   *
   * @param {String} modelName The name of the model to create (e.g. 'User')
   * @param {Object} extensions An object containing field definitions and any extension methods to add to this model
   * @return {ExtMVC.model.Base/Null} The newly defined model constructor, or null if the model can't be defined yet
   */
  define: function(modelName, extensions) {
    var createNow  = true,
        extensions = extensions || {};
    
    if (typeof extensions.extend != 'undefined') {
      var superclass = this.modelNamespace[extensions.extend];
      if (typeof superclass == 'undefined') {
        //the model we're extending hasn't been created yet
        createNow = false;
        this.setModelPendingDefinitionOf(extensions.extend, modelName, extensions);
      };
    };
    
    if (createNow) this.create.apply(this, arguments);
  },
  
  /**
   * @ignore
   * Creates a new ExtMVC.model.Base subclass and sets up all fields, instance and class methods.
   * Don't use this directly unless you know what you're doing - use define instead (with the same arguments)
   * 
   * @param {String} modelName The full model name to define, including namespace (e.g. 'MyApp.models.MyModel')
   * @param {Object} extensions An object containing field definitions and any extension methods to add to this model
   */
  create: function(modelName, extensions) {
    extensions = extensions || {};
    
    //check that this model has not already been defined
    if (this.isAlreadyDefined(modelName)) {
      if (this.strictMode) throw new Error(modelName + ' is already defined');
      return false;
    }
    
    //get a handle on the super class model if extending (this will be undefined if we are not extending another model)
    var superclassModel = this.modelNamespace[extensions.extend];
    
    var fields = this.buildFields(extensions.fields, superclassModel);
    delete extensions.fields;
    
    //create the base Ext.data.Record, which we'll extend in a moment, and assign it to our model namespace
    var model = this.modelNamespace[modelName] = Ext.data.Record.create(fields);
    
    //separate out any methods meant to operate at class level
    var classMethods = extensions.classMethods || {};
    delete extensions.classMethods;
    
    //extend our new record firstly with Model.Base, then apply any user extensions
    Ext.apply(model.prototype, extensions);
    
    //if we're extending another model, add class and instance methods now
    if (typeof superclassModel != 'undefined') {
      Ext.applyIf(classMethods, superclassModel);
      Ext.applyIf(model.prototype, superclassModel.prototype);
    };
    
    //set up the various string names associated with this model
    model.prototype.modelName = modelName;
    this.setupNames(model);

    //add any class methods to the class level
    for (var methodName in classMethods) {
      if (methodName != 'prototype') model[methodName] = classMethods[methodName];
    };

    this.initializePlugins(model);
    this.afterCreate(modelName);
  },
  
  /**
   * @ignore
   * Creates any other models that were waiting for this one to be created. Do not override this
   * unless you really know what you are doing...
   * @param {String} modelName The name of the model that was just created
   */
  afterCreate: function(modelName) {
    var awaiting = this.getModelsPendingDefinitionOf(modelName);
    if (awaiting) {
      Ext.each(awaiting, function(obj) {
        this.create(obj.name, obj.config);
      }, this);
    };
  },
  
  /**
   * Checks if a given model name has already been defined, or is awaiting creation.
   * @param {String} modelName the name of the new model to check
   * @return {Boolean} True if the model has already been defined somewhere
   */
  isAlreadyDefined: function(modelName) {
    if (typeof this.modelNamespace[modelName] != "undefined") return true;
    
    var found = false;
    
    //check that this model is not awaiting creation
    for (superclass in this.pendingCreation) {
      var subclasses = this.pendingCreation[superclass];
      Ext.each(subclasses, function(s) {
        if (s.name == modelName) found = true;
      }, this);
    }
    
    return found;
  },
  
  /**
   * @ignore
   * Builds an array of fields for this model, adding fields from the super class if present
   */
  buildFields: function(subclassFields, superclass) {
    subclassFields = subclassFields || [];
    
    var fields = new Ext.util.MixedCollection(false, function(field) { return field.name; });
    fields.addAll(subclassFields);
    
    if (typeof superclass != 'undefined') {
      superclass.prototype.fields.each(function(field) {
        if (typeof fields.get(field.name) == 'undefined') fields.add(field);
      });
    };
    
    return fields.items;
  },
  
  /**
   * Sets up the various names required by this model, such as tableName, humanName etc
   * @param {Object} model The model to set up names on
   * @return {Object} The model, decorated with names
   */
  setupNames: function(model) {
    var p = model.prototype,
        i = ExtMVC.Inflector;
    
    Ext.applyIf(model.prototype, {
      tableName        : i.pluralize(p.modelName.underscore()),
      foreignKeyName   : i.singularize(p.modelName.underscore()) + '_id',
      singularHumanName: p.modelName.humanize().titleize(),
      pluralHumanName  : i.pluralize(p.modelName.humanize().titleize())
    });
  },
  
  /**
   * @property plugins
   * @type Array
   * An array containing all plugin constructor functions - these get applied at model creation time
   */
  plugins: [],
  
  /**
   * Makes Model aware of a new plugin.  All plugins defined here will be initialized when a model is created
   * @param {Function} plugin The plugin object
   */
  addPlugin: function(plugin) {
    this.plugins.push(plugin);
  },
  
  /**
   * Runs each plugin's initialize method with a newly created model constructor
   * @param {ExtMVC.model} model The model to initialize the plugin with
   */
  initializePlugins: function(model) {
    Ext.each(this.plugins, function(plugin) {
      plugin.initialize(model);
    }, this);
  }
};

Ext.ns('ExtMVC.model.plugin');

/**
 * @class ExtMVC.model.Base
 * A set of properties and functions which are applied to all ExtMVC.models when they are defined
 */
ExtMVC.model.Base = function() {};

ExtMVC.model.Base.prototype = {
  
  /**
   * @property primaryKey
   * @type String
   * The name of the field assumed to be the primary key (defaults to 'id')
   */
  primaryKey: 'id',
  
  /**
   * Returns true if this model's primaryKey has not yet been set (i.e. it has not been saved yet)
   * @return {Boolean} True if this model's primaryKey has not yet been set
   */
  newRecord: function() {
    var id = this.get(this.primaryKey);
    return typeof id == 'undefined' || id == '';
  },
  
  /**
   * Returns a unique string for a model instance, suitable for use as a key in a cache (e.g. ExtMVC.model.Cache).
   * new User({id: 123}).MVCModelId(); //'user-123'
   * @return {String} The unique key for this model object
   */
  MVCModelId: function() {
    return String.format("{0}-{1}", this.tableName, this.get(this.primaryKey));
  },
  
  /**
   * Returns a JsonReader suitable for use decoding generic JSON data from a server response
   * Override this to provide your own Reader
   */
  getReader: function() {
    if (!this.reader) {
      this.reader = new Ext.data.JsonReader({
        totalProperty: "results",
        root:          this.tableName
      }, this.constructor);
    }
    
    return this.reader;
  },
  
  /**
   * @property initialize
   * @type Function
   * Function which is called whenever a model object is instantiated.  Override this with your own callback if needed
   */
  initialize: Ext.emptyFn
};


/**
 * @ignore
 * Add the above Base methods and properties to the Ext.data.Record prototype. This means all Record instances
 * will have MVC models methods, even if not instantiated by an MVC-defined model constructor
 */
Ext.apply(Ext.data.Record.prototype, new ExtMVC.model.Base());

/**
 * @class ExtMVC.model.plugin.adapter
 * @ignore
 */
ExtMVC.model.plugin.adapter = {
  initialize: function(model) {
    var adapter = new this.RESTJSONAdapter();
    
    Ext.override(Ext.data.Record, adapter.instanceMethods());
    Ext.apply(model, adapter.classMethods());
    
    //associations are optional so only add them if they are present
    try {
      Ext.override(ExtMVC.model.plugin.association.HasMany,   adapter.hasManyAssociationMethods());
      Ext.override(ExtMVC.model.plugin.association.BelongsTo, adapter.belongsToAssociationMethods());
    } catch(e) {};
  }
};

ExtMVC.model.addPlugin(ExtMVC.model.plugin.adapter);

/**
 * @class ExtMVC.model.plugin.adapter.Abstract
 * Abstract adapter class containing methods that all Adapters should provide
 * All of these methods are expected to be asynchronous except for loaded()
 */

/**
 * @constructor
 * @param {ExtMVC.model} model The model this adapter represents
*/
ExtMVC.model.plugin.adapter.Abstract = function(model) {
  /**
   * @property model
   * @type ExtMVC.model.Base
   * The model this adapter represents (set on initialize)
   */
  // this.model = model;
};

ExtMVC.model.plugin.adapter.Abstract.prototype = {
  
  /**
   * Abstract save method which should be overridden by an Adapter subclass
   * @param {ExtMVC.model.Base} instance A model instance to save
   * @param {Object} options Save options (e.g. {success: function(), failure: function()})
   */
  doSave: Ext.emptyFn,
  
  /**
   * Abstract find method which should be overridden by an Adapter subclass
   * @param {Object} options Options for the find, such as primaryKey and conditions
   */
  doFind: Ext.emptyFn,
  
  /**
   * Abstract destroy method which should be overridden by an Adapter subclass
   * @param {ExtMVC.model.Base} instance The model instance to destroy
   */
  doDestroy: Ext.emptyFn,
  
  /**
   * @property instanceMethods
   * @type Object
   * An object of properties that get added to the model's prototype
   * These all run within the scope of a model instance
   */
  instanceMethods: function() {
    return {
      adapter: this,
    
      /**
       * Attempts to save this instance
       * @member ExtMVC.model.Base
       * @param {Object} options Options (see collectionMethods.create for arguments)
       */
      save: function(options) {
        options = options || {};
        if (options.skipValidation === true || this.isValid()) {
          //looks good, attempt the save
          return this.adapter.doSave(this, options);
        } else {
          //couldn't save
          if (typeof options.failure == 'function') {
            return options.failure.call(options.scope || this, this);
          };
        };
      },
    
      /**
       * Attempts to destroy this instance (asynchronously)
       * @member ExtMVC.model.Base
       * @param {Object} options Options to pass to the destroy command (see collectionMethods.create for args)
       */
      destroy: function(options) {
        return this.adapter.doDestroy(this, options);
      },
    
      /**
       * Updates selected fields with new values and saves straight away
       * @member ExtMVC.model.Base
       * @param {Object} data The fields to update with new values
       * @param {Object} options Options (see collectionMethods.create for arguments)
       */
      update: function(data, options) {
        this.setValues(data);
        this.save(options);
      },
    
      /**
       * Returns true if this instance has been loaded from backend storage or has only been instantiated
       * @member ExtMVC.model.Base
       * @return {Boolean} True if loaded from the server
       */
      loaded: function() {
      
      }
    };
  },
  
  classMethods: function() {
    return {
      adapter: this,
    
      /**
       * Attempts to create and save a new instance of this model
       * @param {Object} data The data to use in creating and saving an instance of this model
       * @param {Object} options Options object:
       * * skipValidation - set to true to bypass validation before saving (defaults to false)
       * * scope   - The scope to run callback functions in
       * * success - pass in a function as a callback if save succeeds.  Function called with 1
       *             argument - the new model instance
       * * failure - pass in a function as a callback if save succeeds.  Function called with 2
       *             arguments - the unsaved model instance and the json response
       */
      create: function(data, options) {
        var instance = new this(data);
        instance.save(options);
      
        return instance;
      },
    
      /**
       * Builds a new model on this collection but does not save it
       * @param {Object} data The data to use in creating and saving an instance of this model
       * @return {Object} The new model instance
       */
      build: function(data) {
        return new this(data);
      },
    
      /**
       * Finds the given related model on a relationship
       * @param {Number|String|Object} conditions The unique identifier for this model, or a conditions object
       * @param {Object} options Options (see collectionMethods.create for arguments)
       */
      find: function(conditions, options) {
        //assume to be the primary key
        if (typeof(conditions) == 'number') conditions = {primaryKey: conditions};
        
        return this.adapter.doFind(conditions, options, this);
      },
    
      /**
       * Issues a destroy (delete) command to delete the appropriate related object by ID
       * @param {Number|String} id The ID of the associated model to delete
       * @param {Object} options Options (see collectionMethods.create for arguments)
       */
      destroy: function(id, options) {
        return this.adapter.doDestroy(id, options, this);
      }
    };
  },

  /**
   * @property hasManyAssociationMethods
   * @type Object
   * An object full of properties and functions that get mixed in to hasMany association collections
   * These methods are run in the scope of the model instance that owns the association, e.g. if
   * User hasMany Posts, then 'this' refers to the user instance
   */
  hasManyAssociationMethods: function() {
    return {
      /**
       * @member ExtMVC.model.plugin.association.HasMany
       * @ignore (member doesn't seem to work for properties)
       * @property adapter
       * @type ExtMVC.model.plugin.adapter.Abstract
       * A reference to the adapter attached to this association. Useful if you need to dip down to a lower
       * level than the methods inside HasMany provide
       */
      adapter: this,
    
      /**
       * Attempts to create and save a new instance of this model
       * @member ExtMVC.model.plugin.association.HasMany
       * @param {Object} data The data to use in creating and saving an instance of this model
       * @param {Object} options Options object:
       * * skipValidation - set to true to bypass validation before saving (defaults to false)
       * * success - pass in a function as a callback if save succeeds.  Function called with 1
       *             arguments - the new model instance
       * * failure - pass in a function as a callback if save succeeds.  Function called with 2
       *             arguments - the unsaved model instance and the json response
       */
      create: function(data, options) {
        var instance = new this.associatedClass(data);
        
        //automatically set the foreign key here
        // instance.set(this.foreignKey, )
      },
    
      /**
       * Builds a new model on this collection but does not save it
       * @member ExtMVC.model.plugin.association.HasMany
       * @param {Object} data The data to use in creating and saving an instance of this model
       * @return {Object} The new model instance
       */
      build: function(data, options) {
      
      },
    
      /**
       * Finds the given related model on a relationship
       * @member ExtMVC.model.plugin.association.HasMany
       * @param {Number|String} id The unique identifier for this model.
       */
      find: function(id) {
      
      },
    
      /**
       * Returns true if this association has been fully loaded yet
       * @member ExtMVC.model.plugin.association.HasMany
       * @return {Boolean} True if this association has been loaded yet
       */
      loaded: function() {
      
      },
    
      /**
       * Issues a destroy (delete) command to delete the appropriate related object by ID
       * @member ExtMVC.model.plugin.association.HasMany
       * @param {Number|String} id The ID of the associated model to delete
       */
      destroy: function(id) {
      
      }
    };
  },
  
  /**
   * @property belongsToAssociationMethods
   * @type Object
   * An object full of properties and functions that get mixed in to belongsTo association collections
   */
  belongsToAssociationMethods: function() {
    return {
      /**
       * @member ExtMVC.model.plugin.association.BelongsTo
       * @ignore (member doesn't seem to work for properties)
       * @property adapter
       * @type ExtMVC.model.plugin.adapter.Abstract
       * A reference to the adapter attached to this association. Useful if you need to dip down to a lower
       * level than the methods inside BelongsTo provide
       */
      adapter: this,
      
      /**
       * Finds the given related model on a relationship
       * @member ExtMVC.model.plugin.association.BelongsTo
       * @param {Number|String} id The unique identifier for this model.
       */
      find: function(id) {
      
      },
    
      /**
       * Returns true if this association has been fully loaded yet
       * @member ExtMVC.model.plugin.association.BelongsTo
       * @return {Boolean} True if this association has been loaded yet
       */
      loaded: function() {
      
      },
    
      /**
       * Issues a destroy (delete) command to delete the appropriate related object by ID
       * @member ExtMVC.model.plugin.association.BelongsTo
       * @param {Number|String} id The ID of the associated model to delete
       */
      destroy: function(id) {
      
      }
    };
  }
};

/**
 * @class ExtMVC.model.plugin.adapter.RESTAdapter
 * @extends ExtMVC.model.plugin.adapter.Abstract
 * An adapter which hooks into a RESTful server side API for its data storage. This is the recommended
 * adapter to use on MVC applications.
 * <h2>Usage</h2>
 * Say we have a User model defined:
<pre><code>
  ExtMVC.model.define("User", {
    fields: [{name: 'id', type: 'int'}, {name: 'name', type: 'string'}]
  });
  var user = new User({id: 1, name: 'Saul Tigh'});
</code></pre>
 * If this model uses the REST Adapter, the following methods are made available to it. Each fires the AJAX request
 * indicated in the comment next to it:
<pre><code>
  user.destroy(); //DELETE /users/1
  user.save(); //PUT /users/1 with {id: 1, name: 'Saul Tigh'} as the request payload
  user.update({name: 'Bill Adama'})l //PUT /users/1/ with {id: 1, name: 'Bill Adama'} as the request payload
</code></pre>
 * In addition, the following methods are made available to the User class object:
 <pre><code>
User.destroy(10); //DELETE /users/1

User.find(10, {
  success: function(instance) {
    console.log("Asyncronously loaded User 10 from /users/10 using GET")
  },
  failure: function() {
    console.log('Called if user 10 could not be found');
  }
}); //GET /users/10

User.create({name: 'Gaius Baltar'}, {
  success: function(instance) {
    console.log('Gaius was created');
  },
  failure: function(errors) {
    console.log('Called if Gaius could not be created');
    console.log(errors);
  }
}); //POST /users

User.build({name: 'Felix Gaeta'}); //same as new User({name: 'Felix Gaeta'});
</code></pre>
 */
ExtMVC.model.plugin.adapter.RESTAdapter = Ext.extend(ExtMVC.model.plugin.adapter.Abstract, {
  
  /**
   * @property createMethod
   * @type String
   * The HTTP verb to use when creating a new instance (defaults to 'POST')
   */
  createMethod: 'POST',
  
  /**
   * @property readMethod
   * @type String
   * The HTTP verb to use when reading data from the server (e.g. in find requests). Defaults to 'GET'
   */
  readMethod: 'GET',

  /**
   * @property updateMethod
   * @type String
   * The HTTP verb to use when updating an existing instance (defaults to 'PUT')
   */
  updateMethod: 'PUT',
  
  /**
   * @property destroyMethod
   * @type String
   * The HTTP verb to use when destroying an instance (defaults to 'DELETE')
   */
  destroyMethod: 'DELETE',
  
  /**
   * @property proxyType
   * @type Function
   * The type of Data Proxy to use (defaults to Ext.data.HttpProxy)
   */
  proxyType: Ext.data.HttpProxy,
  
  /**
   * Performs the actual save request.  Uses POST for new records, PUT when updating existing ones
   */
  doSave: function(instance, options) {
    if (typeof instance == 'undefined') throw new Error('No instance provided to REST Adapter save');
    options = options || {};
    
    var successFn = options.success || Ext.emptyFn,
        failureFn = options.failure || Ext.emptyFn;
        
    delete options.success; delete options.failure;
    
    Ext.Ajax.request(
      Ext.apply({
        url    : this.instanceUrl(instance),
        method : instance.newRecord() ? this.createMethod : this.updateMethod,
        params : this.buildPostData(instance),
        
        success: function(instance, userCallback, scope) {
          scope = scope || this;
          
          return function(response, options) {
            var jsonPath = instance.modelName.underscore(),
                jsonData = Ext.decode(response.responseText)[jsonPath];
            
            for (var key in jsonData) {
              instance.set(key, jsonData[key]);
            }
            
            userCallback.call(this, instance);
          };
        }(instance, successFn, options.scope)
      }, options)
    );
  },
  
  /**
   * Callback for save AJAX request. By default this reads server response data and populates the instance
   * if the request was successful, adds errors if not
   * @private
   */
  afterSave: function() {
    
  },
  
  /**
   * Performs the actual find request.
   * @private
   * @param {Object} conditions An object containing find conditions. If a primaryKey is set this will be used
   * to build the url for that particular instance, otherwise the collection url will be used
   * @param {Object} options Callbacks (use callback, success and failure)
   */
  doFind: function(conditions, options, constructor) {
    conditions = conditions || {}; options = options || {};
      
    //if primary key is given, perform a single search
    var single = (conditions.primaryKey !== undefined),
        url    = options.url || this.findUrl(conditions, constructor);
    
    Ext.applyIf(options, {
      conditions: conditions,
      scope     : this
    });
    
    var findMethod = single ? this.doSingleFind : this.doCollectionFind;
    return findMethod.call(this, url, options, constructor);
  },
  
  /**
   * Performs an HTTP DELETE request using Ext.Ajax.request
   * @private
   * @param {ExtMVC.model.Base} instance The model instance to destroy
   * @param {Object} options Options object passed to Ext.Ajax.request
   * @return {Number} The Ajax transaction ID
   */
  doDestroy: function(instance, options, constructor) {
    var options = options || {};
    
    if (typeof instance == 'undefined') throw new Error('No instance provided to REST Adapter destroy');
    
    if (!(instance instanceof Ext.data.Record)) {
      var id = parseInt(instance, 10);
      
      instance = new constructor();
      instance.set(constructor.prototype.primaryKey, id);
    }
    
    //if we were passed a success function, save it here so that we can call it with the instance later
    var successFn = options.success || Ext.emptyFn;
    delete options.success;
    
    return Ext.Ajax.request(
      Ext.applyIf(options, {
        method: this.destroyMethod,
        url:    this.instanceUrl(instance),
        success: function() {
          successFn.call(options.scope || this, instance);
        }
      })
    );
  },
  
  /**
   * Loads a single instance of a model via an Ext.Ajax.request
   * @private
   * @param {String} url The url to load from
   * @param {Object} options Options passed to Ext.Ajax.request
   * @param {Function} constructor The constructor function used to instantiate the model instance
   * @return {Number} The transaction ID of the Ext.Ajax.request
   */
  doSingleFind: function(url, options, constructor) {
    //store references to user callbacks as we need to overwrite them in the request
    var optionsCallback = options.callback, 
        successCallback = options.success, 
        failureCallback = options.failure;
    
    delete options.callback; delete options.success; delete options.failure;
    
    //need to make a local reference here as scope inside the Ext.data.Request block may not be 'this'
    var decodeFunction = this.decodeSingleLoadResponse;
    
    //helper function to cut down repetition in Ajax request callback
    var callIf = function(callback, args) {
      if (typeof callback == 'function') callback.apply(options.scope, args);
    };
     
    Ext.Ajax.request(
      Ext.apply(options, {
        callback: function(opts, success, response) {
          if (success === true) {
            var instance = new constructor(decodeFunction(response.responseText, constructor));

            callIf(successCallback, [instance, opts, response]);
          } else callIf(failureCallback, arguments);

          //call the generic callback passed into options
          callIf(optionsCallback, arguments);
        }
      }, this.buildProxyConfig(url))
    );
  },
  
  /**
   * @property storeConfig
   * @type Object
   * Default properties assigned to the Ext.data.Store used in find requests
   */
  storeConfig: {
    autoLoad  : true,
    remoteSort: false
  },
  
  /**
   * Specialised find for dealing with collections. Returns an Ext.data.Store
   * @private
   * @param {String} url The url to load the collection from
   * @param {Object} options Options passed to the Store constructor
   * @param {Function} constructor The constructor function used to instantiate the model instance
   * @return {Ext.data.Store} A Store with the appropriate configuration to load this collection
   */
  doCollectionFind: function(url, options, constructor) {
    Ext.applyIf(options, this.storeConfig);
    
    if (options.conditions != undefined) {
      Ext.applyIf(options, {
        baseParams: options.conditions
      });
    }
    
    return new Ext.data.Store(
      Ext.applyIf(options, {
        reader    : constructor.prototype.getReader(),
        proxy     : new this.proxyType(this.buildProxyConfig(url))
      })
    );
  },
  
  /**
   * Calculates the unique REST URL for a given model instance
   * @param {ExtMVC.model.Base} instance The model instance
   * @return {String} The url associated with this instance
   */
  instanceUrl: function(instance) {
    if (instance.newRecord()) {
      return String.format("/{0}", instance.tableName);
    } else {
      return String.format("/{0}/{1}", instance.tableName, instance.get(instance.primaryKey));
    }
  },
  
  /**
   * Calculates the REST URL for a given model collection. By default this just returns / followed by the table name
   * @param {Function} constructor The model constructor function
   */
  collectionUrl: function(constructor) {
    return String.format("/{0}", constructor.prototype.tableName);
  },
  
  /**
   * Returns configuration data to be used by the DataProxy when loading records. Override to provide your own config
   * @param {String} url The url the proxy should use. This is typically calculated elsewhere so must be provided
   * @return {Object} Configuration for the proxy
   */
  buildProxyConfig: function(url) {
    return {
      url:    url,
      method: this.readMethod
    };
  },
  
  /**
   * Creates a params object suitable for sending as POST data to the server
   * @param {ExtMVC.model.Base} instance The models instance to build post data for
   * @return {Object} Params object to send to the server
   */
  buildPostData: function(instance) {
    var data   = {},
        prefix = instance.modelName.underscore();
    
    for (key in instance.data) {
      data[prefix + '[' + key + ']'] = instance.data[key];
    }
    
    return data;
  },
  
  /**
   * Decodes response text received from the server as the result of requesting data for a single record.
   * By default this expects the data to be in the form {"model_name": {"key": "value", "key2", "value 2"}}
   * and would return an object like {"key": "value", "key2", "value 2"}
   * @param {String} responseText The raw response text
   * @param {Function} constructor The constructor used to construct model instances.  Useful for access to the prototype
   * @return {Object} Decoded data suitable for use in a model constructor
   */
  decodeSingleLoadResponse: function(responseText, constructor) {
    var tname = constructor.prototype.tableName;
    return Ext.decode(responseText)[tname];
  },
  
  //private
  findUrl: function(conditions, constructor) {
    if (typeof(conditions) == 'object' && conditions.primaryKey) {
      //find by ID
      var instance = new constructor({});
      instance.set(instance.primaryKey, conditions.primaryKey);
      delete conditions.primaryKey;
      
      return this.instanceUrl(instance);
    } else {
      //find by conditions
      return this.collectionUrl(constructor);
    }
  }
});

/**
 * @class ExtMVC.model.plugin.adapter.RESTJSONAdapter
 * @extends ExtMVC.model.plugin.adapter.RESTAdapter
 * An adapter which hooks into a RESTful server side API that expects JSON for its data storage
 */
ExtMVC.model.plugin.adapter.RESTJSONAdapter = Ext.extend(ExtMVC.model.plugin.adapter.RESTAdapter, {

  /**
   * Performs the actual save request.  Uses POST for new records, PUT when updating existing ones
   * puts the data into jsonData for the request
   */
  doSave: function(instance, options) {
    if (typeof instance == 'undefined') throw new Error('No instance provided to REST Adapter save');
    
    Ext.applyIf(options || {}, {
      jsonData: instance.data,
      params  : {}, //ensures that params aren't appended to the end of the url
      headers : {
        "Content-Type": "application/json"
      }
    });
    
    ExtMVC.model.plugin.adapter.RESTJSONAdapter.superclass.doSave.apply(this, arguments);
  },
  
  /**
   * Performs the actual destroy request. This simply adds an 'application/json' content type to the headers
   */
  doDestroy: function(instance, options, constructor) {
    options = options || {};
    
    Ext.applyIf(options, {
      headers: {
        "Content-type": "application/json"
      }
    });
    
    ExtMVC.model.plugin.adapter.RESTJSONAdapter.superclass.doDestroy.call(this, instance, options, constructor);
  },
  
  /**
   * Decodes response text received from the server as the result of requesting data for a single record.
   * By default this expects the data to be in the form {"model_name": {"key": "value", "key2", "value 2"}}
   * and would return an object like {"key": "value", "key2", "value 2"}
   * @param {String} responseText The raw response text
   * @param {Function} constructor The constructor used to construct model instances.  Useful for access to the prototype
   * @return {Object} Decoded data suitable for use in a model constructor
   */
  decodeSingleLoadResponse: function(responseText, constructor) {
    var tname = ExtMVC.Inflector.singularize(constructor.prototype.tableName);
    return Ext.decode(responseText)[tname];
  },
  
  /**
   * Returns configuration data to be used by the DataProxy when loading records. Override to provide your own config
   * @param {String} url The url the proxy should use. This is typically calculated elsewhere
   * @return {Object} Configuration for the proxy
   */
  buildProxyConfig: function(url) {
    var defaults = ExtMVC.model.plugin.adapter.RESTJSONAdapter.superclass.buildProxyConfig.apply(this, arguments);
    
    return Ext.apply(defaults, {
      headers: {
        "Content-Type": "application/json"
      }      
    });
  }
});

Ext.ns('ExtMVC.model.plugin.validation');

/**
 * @ignore
 * The Validation classes themselves are defined here.
 * Subclass ExtMVC.model.plugin.validation.AbstractValidation to create your own validations
 */

/**
 * @class ExtMVC.model.plugin.validation.AbstractValidation
 * Base class for all validations - not used directly, but any of the following may be used:
<pre><code>
ExtMVC.model.define("SomeModel", {
  fields: [
    {name: 'title',  type: 'string'},
    {name: 'price',  type: 'int'},
    {name: 'stock',  type: 'int'},
    {name: 'gender', type: 'string'},
    {name: 'colour', type: 'string'}
  ],
  
  validatesPresenceOf : ["title", "price"],
  validatesLengthOf   : {field: 'title', minimum: 3, maximum: 12},
  
  validatesInclusionOf: {field: 'gender', allowed   : ["Male", "Female"]},
  validatesExclusionOf: {field: 'colour', disallowed: ["Red"]},
  validatesFormatOf   : {field: 'email',  regex: /someRegex/},
  
  validatesNumericalityOf: "stock"
});
</code></pre>
 * 
 * Most validations will allow an array to be passed to set the validation up on more than one field (e.g.
 * see the validatesPresenceOf declaration above). If only a string is provided it is assume to be the field name.
 * The following are all equivalent:
<pre><code>
validatesPresenceOf: "title"
validatesPresenceOf: ["title"]
validatesPresenceOf: {field: "title"}
validatesPresenceOf: [{field: "title"}]
</code></pre>
 * 
 * <h2>Running validations</h2>
 * This plugin overrides ExtMVC.model.Base's usual isValid() function to provide feedback from the validations:
 * 
<pre><code>
var user = new SomeModel({title: "A really long title", colour: "Blue"});
user.isValid(); //returns false if any of the validations failed
user.errors; //returns an {@link ExtMVC.model.plugin.validation.Errors Errors} object
</code></pre>
 */
ExtMVC.model.plugin.validation.AbstractValidation = function(ownerClass, field, config) {
  this.ownerClass = ownerClass;
  this.field = field;
  
  Ext.apply(this, config);
};

ExtMVC.model.plugin.validation.AbstractValidation.prototype = {
  /**
   * Returns the current value of the field to which this validation applies
   * @param {ExtMVC.model.Base} instance The model instance to get the value from
   * @return {Mixed} The current value of the field
   */
  getValue: function(instance) {
    return instance.get(this.field);
  },
  
  /**
   * Empty function which must be overridden by a validation subclass. Make your function return
   * true if the validation passes, false otherwise
   * @return {Boolean} True if this validation passes
   */
  isValid: function(instance) {
    return true;
  }
};

/**
 * @class ExtMVC.model.plugin.validation.ValidatesPresenceOf
 * @extends ExtMVC.model.plugin.validation.AbstractValidation
 * Ensures that a field is present. See {*link ExtMVC.model.plugin.validation.AbstractValidation AbstractValidation} for example.
 */
ExtMVC.model.plugin.validation.ValidatesPresenceOf = Ext.extend(ExtMVC.model.plugin.validation.AbstractValidation, {
  /**
   * @property message
   * @type String
   * The textual message returned if this validation didn't pass
   */
  message: 'must be present',
  
  /**
   * Returns true if the field is an object or a non-empty string
   * @return {Boolean} True if the field is present
   */
  isValid: function(instance) {
    var value = this.getValue(instance),
        valid = false;
    
    switch(typeof value) {
      case 'object': if (value != null)     valid = true; break;
      case 'string': if (value.length != 0) valid = true; break;
    };
    
    return valid;
  }
});

/**
 * @class ExtMVC.model.plugin.validation.ValidatesLengthOf
 * @extends ExtMVC.model.plugin.validation.AbstractValidation
 * Returns true if the field is within the length bounds imposed. See {*link ExtMVC.model.plugin.validation.AbstractValidation AbstractValidation} for example.
 */
ExtMVC.model.plugin.validation.ValidatesLengthOf = Ext.extend(ExtMVC.model.plugin.validation.AbstractValidation, {
  
  /**
   * @property tooShortMessage
   * @type String
   * The message returned if this field was too short
   */
  tooShortMessage: 'is too short',
  
  /**
   * @property tooLongMessage
   * @type String
   * The message returned if this field was too long
   */
  tooLongMessage: 'is too long',
  
  message: '',

  /**
   * Tests that the mimimum and maximum length of this field are met.
   * Intended to be used on strings and arrays
   * @return {Boolean} True if the conditions are met
   */
  isValid: function(instance) {
    var value = this.getValue(instance);
    
    if (typeof value == 'undefined') return true;
        
    if (this.minimum && value.length < this.minimum) {
      this.message = this.tooShortMessage;
      return false;
    }
    
    if (this.maximum & value.length > this.maximum) {
      this.message = this.tooLongMessage;
      return false;
    }
    
    return true;
  }
});

/**
 * @class ExtMVC.model.plugin.validation.ValidatesNumericalityOf
 * @extends ExtMVC.model.plugin.validation.AbstractValidation
 * Ensures that the field is a number. See {*link ExtMVC.model.plugin.validation.AbstractValidation AbstractValidation} for example.
 */
ExtMVC.model.plugin.validation.ValidatesNumericalityOf = Ext.extend(ExtMVC.model.plugin.validation.AbstractValidation, {
  /**
   * @property message
   * @type String
   * The message returned if this field is not a number
   */
  message: 'must be a number',
  
  /**
   * Returns true if the typeof this field is a number
   * @return {Boolean} True if this is a number
   */
  isValid: function(instance) {
    return 'number' == typeof this.getValue(instance);
  }
});

/**
 * @class ExtMVC.model.plugin.validation.ValidatesInclusionOf
 * @extends ExtMVC.model.plugin.validation.AbstractValidation
 * Ensures that the field is one of the allowed values. See {*link ExtMVC.model.plugin.validation.AbstractValidation AbstractValidation} for example.
 */
ExtMVC.model.plugin.validation.ValidatesInclusionOf = Ext.extend(ExtMVC.model.plugin.validation.AbstractValidation, {


  /**
   * Override Abstract constructor to build the validation message
   */
  constructor: function(m, f, config) {
    //set up defaults
    config = config || {};
    Ext.applyIf(config, { allowed: [] });
    
    ExtMVC.model.plugin.validation.ValidatesInclusionOf.superclass.constructor.call(this, m, f, config);
    
    Ext.applyIf(this, {
      message: 'must be one of ' + this.allowed.toSentence('or')
    });
  },
  
  /**
   * Returns true if the value of this field is one of those specified in this.allowed
   * @return {Boolean} True if the field's value is allowed
   */
  isValid: function(instance) {
    var value = this.getValue(instance);
    
    for (var i=0; i < this.allowed.length; i++) {
      if (this.allowed[i] == value) return true;
    };
    
    return false;
  }
});

/**
 * @class ExtMVC.model.plugin.validation.ValidatesExclusionOf
 * @extends ExtMVC.model.plugin.validation.AbstractValidation
 * Ensures that the field is not one of the allowed values. See {*link ExtMVC.model.plugin.validation.AbstractValidation AbstractValidation} for example.
 */
ExtMVC.model.plugin.validation.ValidatesExclusionOf = Ext.extend(ExtMVC.model.plugin.validation.AbstractValidation, {

  /**
   * Override Abstract constructor to build the validation message
   * @ignore
   */
  constructor: function(m, f, config) {
    //set up defaults
    config = config || {};
    Ext.applyIf(config, { disallowed: [] });
    
    ExtMVC.model.plugin.validation.ValidatesExclusionOf.superclass.constructor.call(this, m, f, config);
    
    Ext.applyIf(this, {
      message: 'must not be ' + this.disallowed.toSentence('or')
    });
  },
  
  /**
   * Returns true if the value of this field is one of those specified in this.allowed
   * @return {Boolean} True if the field's value is allowed
   */
  isValid: function(instance) {
    var value = this.getValue(instance),
        valid = true;
    
    for (var i=0; i < this.disallowed.length; i++) {
      if (this.disallowed[i] == value) valid = false;
    };
    
    return valid;
  }
});

/**
 * @class ExtMVC.model.plugin.validation.ValidatesFormatOf
 * @extends ExtMVC.model.plugin.validation.AbstractValidation
 * Ensures that the field matches the given regular expression. See {*link ExtMVC.model.plugin.validation.AbstractValidation AbstractValidation} for example.
 */
ExtMVC.model.plugin.validation.ValidatesFormatOf = Ext.extend(ExtMVC.model.plugin.validation.AbstractValidation, {
  
  /**
   * @property message
   * @type String
   * The default message to return if this validation does not pass
   */
  message: 'is invalid',
  
  /**
   * Returns true if the value of this field matches the suppled regular expression
   * @return {Boolean} True if the field's value matches
   */
  isValid: function(instance) {
    return this.regex.test(this.getValue(instance));
  }
});

/**
 * @class ExtMVC.model.plugin.validation
 * @ignore
 */

/**
 * @class ExtMVC.model.plugin.validation.Errors
 * Simple class to collect validation errors on a model and return them in various formats. Usage:
<pre><code>
ExtMVC.model.define("SomeModel", {
  fields: [
    {name: 'title',  type: 'string'},
    {name: 'price',  type: 'int'},
    {name: 'stock',  type: 'int'},
    {name: 'colour', type: 'string'}
  ],
  
  validatesPresenceOf : ["title", "price"],
  validatesLengthOf   : {field: 'title', minimum: 3, maximum: 12}
});

var s = new SomeModel({title: 'Some really long title'});
s.errors; //returns this Errors object
s.isValid(); //returns false, same as calling s.errors.isValid()

//manually add a validation error on the title field
s.errors.add('title', 'has an problem of some kind');

this.errors.forField('title'); //returns an array of problems with the title field

this.errors.forForm(); //returns an object suitable for marking fields invalid on a form
</code></pre>
 */
ExtMVC.model.plugin.validation.Errors = function() {
  /**
   * @property errors
   * @type Object
   * Object containing all errors attached to this model.  This is READ ONLY - do not interact with directly
   */
  this.all = {};
};

ExtMVC.model.plugin.validation.Errors.prototype = {
  
  /**
   * Returns an errors object suitable for applying to a form via BasicForm's markInvalid() method
   * @return {Object} An object with field IDs as keys and formatted error strings as values
   */
  forForm: function() {
    var formErrors = {};
    for (key in this.all) {
      formErrors[key] = this.forField(key, true);
    }
    
    return formErrors;
  },
  
  /**
   * @property multipleErrorConnector
   * @type String
   * The string to use when connecting more than one error (defaults to 'and')
   */
  multipleErrorConnector: 'and',
  
  /**
   * Clears out all errors
   */
  clear: function() {
    this.all = {};
  },
  
  /**
   * Adds an error to a particular field
   * @param {String} field The field to add an error onto
   * @param {String} error The error message
   */
  add: function(field, error) {
    this.all[field] = this.all[field] || [];
    this.all[field].push(error);
  },
  
  /**
   * Returns an array of all errors for the given field.  Pass true as a second argument to
   * return a human-readable string, e.g.:
<pre><code>
forField('title'); // ['must be present', 'is too short']
forField('title', true); // 'must be present and is too short'
</code></pre>
   * @param {String} field The field to find errors for
   * @param {Boolean} humanize True to turn the errors array into a human-readable string (defaults to false)
   * @return {Array|String} An array of errors for this field, or a string 
   */
  forField: function(field, humanize) {
    humanize = humanize || false;
    var errs = this.all[field] || [];
        
    return humanize ? errs.toSentence(this.multipleErrorConnector) : errs;
  },
  
  /**
   * Returns true if this model currently has no validation errors
   * @return {Boolean} True if this model is currently valid
   */
  isValid: function(paramName) {
    for (key in this.all) {return false;}
    
    return true;
  },
  
  /**
   * Parses server response to a failed save, adding each error message to the appropriate field.  Override to provide
   * an implementation for your own server responses.  The default implementation accepts a response like this:
   * {errors: [['some_field', 'some error regarding some_field'], ['another_field', 'another error']]}
   * @param {Object/String} serverErrors A errors object returned by server-side validations.  If this is a string it will
   * @param {Boolean} preserveErrors False to clear all errors before adding errors from server (defaults to false)
   * automatically be turned into an object via Ext.decode
   */
  readServerErrors: function(serverErrors, preserveErrors) {
    var serverErrors = serverErrors || {};
    
    //remove any existing errors unless instructed to preserve them
    if (preserveErrors !== true) {this.clearErrors();}
    
    //make sure we're dealing with an object
    if (typeof(serverErrors) == 'string') {
      serverErrors = Ext.decode(serverErrors);
    };
    
    var rawErrors = serverErrors.errors;
    if (rawErrors) {
      for (var i=0; i < rawErrors.length; i++) {
        this.all.push(rawErrors[i]);
      };
    };
  }
};

/**
 * This is the Validation plugin definition, which mixes in validation.Errors
 * and some other functions into a model prototype
 * @ignore
 */

/**
 * Overrides Ext.data.Record's isValid() function.
 * We apply this to Record's prototype as there is no need to define it per model or instance
 * @ignore
 */
Ext.apply(Ext.data.Record.prototype, {
  isValid: function() {
    if (this.validations) {
      if (!this.errors) this.errors = new ExtMVC.model.plugin.validations.Errors();
      
      this.errors.clear();
      
      //test each validation, add to errors if any fail
      Ext.each(this.validations, function(validation) {
        if (!validation.isValid(this)) {
          this.errors.add(validation.field, validation.message);
        };
      }, this);
    };
    
    return this.errors.isValid();
  }
});

/**
 * @ignore
 * FIXME: This is possibly the most horrendous hack ever. I'm so sorry :(
 * 
 * The basic problem is that we need to add an errors object to every Record instance,
 * which means we need to hook into the constructor somehow.  Sadly everything I tried
 * to overload the constructor directly failed, so this horrific hack has been done instead
 */
(function() {
  var oldPrototype       = Ext.data.Record.prototype,
      oldConstructor     = Ext.data.Record,
      oldFunctionMethods = {};

  for (var method in Ext.data.Record) {
    oldFunctionMethods[method] = Ext.data.Record[method];
  }

  Ext.data.Record = function(data, id) {
    oldConstructor.apply(this, arguments);

    this.errors = new ExtMVC.model.plugin.validation.Errors();
  };

  for (var method in oldFunctionMethods) {
    Ext.data.Record[method] = oldFunctionMethods[method];
  }
})();
/**
 * Again, I'm really sorry :(
 * @ignore
 */

/**
 * @class ExtMVC.model.plugin.validation.Plugin
 */
ExtMVC.model.plugin.validation.Plugin = {
  /**
   * Initializes this plugin for a given model.  This is called every time a model is *created*
   * via ExtMVC.model.create, not when a model object is *instantiated*
   * @param {ExtMVC.model} model The model to initialize the plugin for
   */
  initialize: function(model) {
    this.model = model;
    
    Ext.apply(model.prototype, {
      /**
       * @property validations
       * @type Array
       * An array of all validations performed on this model
       */
      validations: this.parseValidations()
    });
  },
  
  /**
   * Parses a defined model's prototype for validation declarations and creates validation instances
   * @return {Array} An Array of validation objects
   */
  parseValidations: function() {
    var validations = [];
    
    for (var validation in ExtMVC.model.plugin.validation) {
      if (/^validate/.test(validation.toLowerCase())) {
        
        //for each validation type defined on ExtMVC.model.plugin.validation, check to see if we are using
        //it in on our model
        for (var modelKey in this.model.prototype) {
          if (modelKey.toLowerCase() == validation.toLowerCase()) {
            //this validation is being used by the model, so add it now
            var validationConstructor = ExtMVC.model.plugin.validation[validation],
                validationOptions     = this.model.prototype[modelKey];
            
            if (!Ext.isArray(validationOptions)) {
              validationOptions = [validationOptions];
            };
            
            Ext.each(validationOptions, function(options) {
              validations.push(this.buildValidation(validationConstructor, options));
            }, this);
          };
        }
      };
    }
    
    return validations;
  },
  
  /**
   * Creates a new Validation object based on the passed constructor and options
   * @param {Function} validation The validation constructor function
   * @param {Object|String} options A fieldname string, or config object
   * @return {ExtMVC.model.plugin.validation.AbstractValidation} The validation instance
   */
  buildValidation: function(validation, options) {
    var field, config = {};
    
    if (typeof options == 'string') {
      field = options;
    } else {
      field = options.field;
      delete options.field;
      config = options;
    }
    
    return new validation(this.model, field, config);
  }
};

ExtMVC.model.addPlugin(ExtMVC.model.plugin.validation.Plugin);

/**
 * A simple manager for registering and retrieving named ViewportBuilders
 * @class ExtMVC.ViewportBuilderManager
 */
ExtMVC.ViewportBuilderManager = {
  
  /**
   * @property viewportBuilders
   * @type Object
   * Key/value pairs for registered viewport builders.  Private
   */
  viewportBuilders: {},
  
  /**
   * Registers a ViewportBuilder with the manager
   * @param {String} name String name for this ViewportBuilder (e.g. 'desktop')
   * @param {Function} constructor A reference to the constructor of the ViewportBuilder
   */
  register: function(name, constructor) {
    this.viewportBuilders[name] = constructor;
  },
  
  find: function(name, config) {
    var c = this.viewportBuilders[name];
    if (c) {
      return new c(config);
    };
  }
};

ExtMVC.ViewportBuilder = function(config) {
  this.initialConfig = config;
};

ExtMVC.ViewportBuilder.prototype = {
  
  /**
   * Abstract function which should be overridden by your implementation
   * @param {ExtMVC.OS} os A reference to the OS.  Usually a builder would set 
   * os.viewport = new Ext.Viewport({...}) and return the os at the end of the function
   * @return {ExtMVC.OS} The operating system as passed in parameters after viewport is built
   */
  build: Ext.emptyFn
};

/**
 * @class ExtMVC.view.scaffold.ScaffoldFormPanel
 * @extends Ext.form.FormPanel
 * Base class for any scaffold form panel (e.g. new and edit forms)
 */
ExtMVC.view.scaffold.ScaffoldFormPanel = Ext.extend(Ext.form.FormPanel, {
  autoScroll: true,
  
  /**
   * Sets up the FormPanel, adds default configuration and items
   */
  constructor: function(config) {
    var config = config || {};
    
    this.model = config.model;
    if (this.model == undefined) throw new Error("No model supplied to scaffold Form view");
    
    ExtMVC.view.scaffold.ScaffoldFormPanel.superclass.constructor.call(this, config);
  },
  
  /**
   * Adds default items, keys and buttons to the form
   */
  initComponent: function() {
    Ext.applyIf(this, {
      items: this.buildItems(),
      keys : [
        {
          key:     Ext.EventObject.ESC,
          scope:   this,
          handler: this.onCancel
        },
        {
          key:       's',
          ctrl:      true,
          scope:     this,
          stopEvent: true,
          handler:   this.onSave
        }
      ],
      
      /**
       * @property hasSaveButton
       * @type Boolean
       * True to include a save button (defaults to true)
       */
      hasSaveButton: true,

      /**
       * @property hasCancelButton
       * @type Boolean
       * True to include a cancel button (defaults to true)
       */
      hasCancelButton: true
    });
    
    //applyIf applies when buttons: [] is passed, which meant there was no way to
    //specify any empty set of buttons before
    if (!Ext.isArray(this.buttons)) {
      Ext.apply(this, {
        buttons: this.buildButtons()
      });
    }
    
    ExtMVC.view.scaffold.ScaffoldFormPanel.superclass.initComponent.apply(this, arguments);
    
    this.initEvents();
    this.initListeners();
  },
  
  /**
   * Sets up any listeners on related objects. By default this just listens to update-failed and create-failed
   * events on the related controller and marks fields as invalid as appropriate
   */
  initListeners: function() {
    if (this.controller) {
      this.controller.on({
        scope          : this,
        'create-failed': this.showErrorsFromInstance,
        'update-failed': this.showErrorsFromInstance
      });
    }
  },
  
  /**
   * Reads errors from a model instance and marks the relevant fields as invalid
   * @param {ExtMVC.Model.Base} instance The model instance
   */
  showErrorsFromInstance: function(instance) {
    this.getForm().markInvalid(instance.errors.forForm());
  },
  
  /**
   * Sets up events emitted by this component
   */
  initEvents: function() {
    this.addEvents(
      /**
       * @event save
       * Fired when the user clicks the save button, or presses ctrl + s
       * @param {Object} values The values entered into the form
       * @param {ExtMVC.view.scaffold.ScaffoldFormPanel} this The form panel
       */
      'save',
      
      /**
       * @event cancel
       * Fired when the user clicks the cancel button, or presses the esc key
       * @param {ExtMVC.Model.Base|Null} instance If editing an existing instance, this is a reference to that instance
       */
      'cancel'
    );
  },
  
  /**
   * @property formItemConfig
   * @type Object
   * Default config which will be passed to all form items
   */
  formItemConfig: {
    anchor: '-40',
    xtype:  'textfield'
  },
  
  /**
   * @property ignoreFields
   * @type Array
   * An array of fields not to show in the form (defaults to empty)
   */
  ignoreFields: ['id', 'created_at', 'updated_at'],
  
  /**
   * Builds the buttons added to this form.  By default this returns an array containing
   * a Save button and a Cancel button, which fire the 'save' and 'cancel' events respectively
   * @return {Array} An array of Ext.Button objects or configs
   */
  buildButtons: function() {
    var buttons = [];
    
    if (this.hasSaveButton   === true) buttons.push(this.buildSaveButton());
    if (this.hasCancelButton === true) buttons.push(this.buildCancelButton());
    
    return buttons;
  },
  
  /**
   * Builds the Save button config. Override this to provide your own
   * @return {Object/Ext.Button} The button config or object
   */
  buildSaveButton: function() {
    return {
      text:    'Save',
      scope:   this,
      iconCls: 'save',
      handler: this.onSave
    };
  },
  
  /**
   * Builds the Cancel button config. Override this to provide your own
   * @return {Object/Ext.Button} The button config or object
   */
  buildCancelButton: function() {
    return {
      text:    'Cancel',
      scope:   this,
      iconCls: 'cancel',
      handler: this.onCancel
    };
  },
  
  /**
   * Builds an array of form items for the given model
   * @param {ExtMVC.Model} model The model to build form items for
   * @return {Array} An array of auto-generated form items
   */
  buildItems: function() {
    items = [];
    
    //check to see if FormFields have been created for this model
    //e.g. for a MyApp.models.User model, checks for existence of MyApp.views.users.FormFields
    if (this.viewsPackage && this.viewsPackage.FormFields) {
      items = this.viewsPackage.FormFields;
    } else {
      //no user defined form fields, generate them automatically
      var model  = this.model,
          proto  = model.prototype,
          fields = proto.fields;
      
      fields.each(function(field) {

        //add if it's not a field to be ignored
        if (this.ignoreFields.indexOf(field.name) == -1) {
          items.push(Ext.applyIf({
            name:        field.name,
            fieldLabel: (field.name.replace(/_/g, " ")).capitalize()
          }));
        }
      }, this);      
    }
    
    //apply defaults to each item
    for (var i=0; i < items.length; i++) {
      if (items[i].layout === undefined) Ext.applyIf(items[i], this.formItemConfig);
    }
    
    return items;
  },
  
  /**
   * Called when the save button is clicked or CTRL + s pressed.  By default this simply fires
   * the 'save' event, passing this.getForm().getValues() as the sole argument
   */
  onSave: function() {
    this.fireEvent('save', this.getFormValues(), this);
  },
  
  /**
   * Gets form values in a nicer way than getForm.getValues() does - calls getValue on each field.
   * See http://www.diloc.de/blog/2008/03/05/how-to-submit-ext-forms-the-right-way/
   * @return {Object} key: value pairings of form values
   */
  getFormValues: function() {
    var form   = this.getForm(),
        values = {};
    
    form.items.each(function(item) {
      var func = (typeof item.getSubmitValue == "function") ? 'getSubmitValue' : 'getValue';
      
      values[item.getName()] = item[func]();
    }, this);
    
    return values;
  },
  
  /**
   * Called when the cancel button is clicked or ESC pressed. Fires the 'cancel' event.  If this is
   * an edit form the cancel event will be called with a single argument - the current instance
   */
  onCancel: function() {
    this.fireEvent('cancel', this.instance, this);
  }
});

Ext.reg('scaffold_form_panel', ExtMVC.view.scaffold.ScaffoldFormPanel);

/**
 * @class ExtMVC.view.scaffold.Index
 * @extends Ext.grid.GridPanel
 * A default index view for a scaffold (a paging grid with double-click to edit)
 */
ExtMVC.view.scaffold.Index = Ext.extend(Ext.grid.GridPanel, {
  
  constructor: function(config) {
    config = config || {};

    this.model = config.model;
    if (this.model == undefined) throw new Error("No model supplied to scaffold Index view");
    
    this.controller = this.controller || config.controller;
    
    //we can't put these in applyIf block below as the functions are executed immediately
    if (config.columns == undefined && config.colModel == undefined && config.cm == undefined) {
      config.columns = this.buildColumns(this.model);
    }
    config.store   = config.store   || this.model.find();
    
    Ext.applyIf(config, {
      viewConfig: { forceFit: true },
      id:         String.format("{0}_index", this.model.prototype.tableName),

      loadMask: true
    });

    ExtMVC.view.scaffold.Index.superclass.constructor.call(this, config);
    
    this.initEvents();
    this.initListeners();
  },
  
  initComponent: function() {
    var tbarConfig = this.hasTopToolbar    ? this.buildTopToolbar()              : null;
    var bbar       = this.hasBottomToolbar ? this.buildBottomToolbar(this.store) : null;
    
    Ext.applyIf(this, {
      title: this.getTitle(),
      tbar:  tbarConfig,
      bbar:  bbar,
      
      keys:  [
        {
          key:     'a',
          scope:   this,
          handler: this.onAdd
        },
        {
          key:     'e',
          scope:   this,
          handler: this.onEdit
        },
        {
          key:     Ext.EventObject.DELETE,
          scope:   this,
          handler: this.onDelete
        }
      ]
    });
    
    ExtMVC.view.scaffold.Index.superclass.initComponent.apply(this, arguments);
  },
  
  /**
   * Sets up events emitted by the grid panel
   */
  initEvents: function() {
    this.addEvents(
      /**
       * @event edit
       * Fired when the user wishes to edit a particular record
       * @param {ExtMVC.Model.Base} instance The instance of the model the user wishes to edit
       */
      'edit',
      
      /**
       * @event new
       * Fired when the user wishes to add a new record
       */
      'new',
      
      /**
       * @event delete
       * Fired when the user wishes to destroy a particular record
       * @param {ExtMVC.Model.Base} instance The instance fo the model the user wishes to destroy
       */
      'delete'
    );
  },
  
  /**
   * Listens to clicks in the grid and contained components and takes action accordingly.
   * Mostly, this is simply a case of capturing events received and re-emitting normalized events
   */
  initListeners: function() {
    this.on({
      scope     : this,
      'dblclick': this.onEdit
    });
    
    if (this.controller != undefined) {
      this.controller.on('delete', this.refreshStore, this);
    }
  },
  
  //removes any controller listeners added by initListeners
  destroy: function() {
    if (this.controller != undefined) {
      this.controller.un('delete', this.refreshStore, this);
    }
    
    ExtMVC.view.scaffold.Index.superclass.destroy.apply(this, arguments);
  },

  /**
   * Calls reload on the grid's store
   */
  refreshStore: function() {
    //NOTE: For some reason this.store is undefined here, but getCmp on this.id works :/
    var store = Ext.getCmp(this.id).store;
    store.reload();
  },
  
  /**
   * Returns the title to give to this grid.  If this view is currently representing a model called User,
   * this will return "All Users". Override to set your own grid title
   * @return {String} The title to give the grid
   */
  getTitle: function() {
    return String.format("All {0}", this.model.prototype.pluralHumanName);
  },
  
  /**
   * @property preferredColumns
   * @type Array
   * An array of columns to show first in the grid, if they exist
   * Overwrite ExtMVC.view.scaffold.Index.preferredColumns if required
   */
  preferredColumns: ['id', 'title', 'name', 'first_name', 'last_name', 'login', 'username', 'email', 'email_address', 'content', 'message', 'body'],
  
  /**
   * @property ignoreColumns
   * @type Array
   * An array of columns not to show in the grid (defaults to empty)
   */
  ignoreColumns: ['password', 'password_confirmation'],
  
  /**
   * @property useColumns
   * @type Array
   * An array of fields to use to generate the column model.  This defaults to undefined, but if added in a 
   * subclass then these fields are used to make the column model.
   */
  useColumns: undefined,
  
  /**
   * @property narrowColumns
   * @type Array
   * An array of columns to render at half the average width
   */
  narrowColumns: ['id'],
  
  /**
   * @property wideColumns
   * @type Array
   * An array of columns to render at double the average width
   */
  wideColumns:   ['message', 'content', 'description', 'bio', 'body'],
  
  /**
   * @property narrowColumnWidth
   * @type Number
   * The width to make columns in the narrowColumns array (defaults to 30)
   */
  narrowColumnWidth: 30,
  
  /**
   * @property normalColumnWidth
   * @type Number
   * The width to make columns not marked as narrow or wide (defaults to 100)
   */
  normalColumnWidth: 100,
  
  /**
   * @property wideColumnWidth
   * @type Number
   * The width to make wide columns (defaults to 200)
   */
  wideColumnWidth: 200,
  
  /**
   * @property hasTopToolbar
   * @type Boolean
   * True to automatically include a default top toolbar (defaults to true)
   */
  hasTopToolbar: true,
  
  /**
   * @property hasBottomToolbar
   * @type Boolean
   * True to automatically include a paging bottom toolbar (defaults to true)
   */
  hasBottomToolbar: true,
    
  /**
   * Takes a model definition and returns a column array to use for a columnModel
   */
  buildColumns: function(model) {
    //check to see if GridColumns have been created for this model
    //e.g. for a MyApp.models.User model, checks for existence of MyApp.views.users.GridColumns
    if (this.viewsPackage && this.viewsPackage.GridColumns) {
      var columns = this.viewsPackage.GridColumns;
    } else {
      var fields      = this.getFields(),
          columns     = [];
          wideColumns = [];
      
      //put any preferred columns at the front
      Ext.each(fields, function(field) {
        if (this.preferredColumns.indexOf(field.name) > -1) {
          columns.push(this.buildColumn(field.name));
        }
      }, this);

      //add the rest of the columns to the end
      Ext.each(fields, function(field) {
        if (this.preferredColumns.indexOf(field.name) == -1 && this.ignoreColumns.indexOf(field.name) == -1) {
          columns.push(this.buildColumn(field.name));
        };

        //if it's been declared as a wide column, add it to the wideColumns array
        if (this.wideColumns.indexOf(field.name)) {
          wideColumns.push(field.name);
        }
      }, this);

      //add default widths to each
      for (var i = columns.length - 1; i >= 0; i--){
        var col = columns[i];

        if (this.narrowColumns.indexOf(col.id) > -1) {
          //id col is extra short
          Ext.applyIf(col, { width: this.narrowColumnWidth });
        } else if(this.wideColumns.indexOf(col.id) > -1) {
          //we have a wide column
          Ext.applyIf(col, { width: this.wideColumnWidth });
        } else {
          //we have a normal column
          Ext.applyIf(col, { width: this.normalColumnWidth });
        }
      };
    }
    
    return columns;
  },
  
  /**
   * Returns the array of field names the buildColumns() should use to generate the column model.
   * This will return this.useColumns if defined, otherwise it will return all fields
   * @return {Array} The array of field names to use to generate the column model
   */
  getFields: function() {
    if (this.useColumns === undefined) {
      return this.model.prototype.fields.items;
    } else {
      var fields = [];
      Ext.each(this.useColumns, function(column) {
        fields.push({name: column});
      }, this);
      
      return fields;
    }
  },
  
  /**
   * Build a single column object based on a name, adds default properties
   * @param {Object/String} cfg Column config object (can just include a 'name' property).  Also accepts a string, which is translated into the name property
   * @return {Object} A fully-formed column config with default properties set
   */
  buildColumn: function(cfg) {
    var cfg = cfg || {};
    if (typeof(cfg) == 'string') {cfg = {name: cfg};}
    
    return Ext.applyIf(cfg, {
      id       : cfg.name,
      header   : cfg.name.replace(/_/g, " ").titleize(),
      sortable : true,
      dataIndex: cfg.name
    });
  },
  
  /**
   * @property hasAddButton
   * @type Boolean
   * Defines whether or not there should be an 'Add' button on the top toolbar (defaults to true)
   */
  hasAddButton: true,
  
  /**
   * @property hasEditButton
   * @type Boolean
   * Defines whether or not there should be a 'Edit' button on the top toolbar (defaults to true)
   */
  hasEditButton: true,
  
  /**
   * @property hasDeleteButton
   * @type Boolean
   * Defines whether or not there should be a 'Delete' button on the top toolbar (defaults to true)
   */
  hasDeleteButton: true,
  
  /**
   * Builds the Add button for the top toolbar. Override to create your own
   * @param {Object} config An optional config object used to customise the button
   * @return {Ext.Button} The Add Button
   */
  buildAddButton: function(config) {
    return new Ext.Button(
      Ext.applyIf(config || {}, {
        text:    'New ' + this.model.prototype.singularHumanName,
        scope:   this,
        iconCls: 'add',
        handler: this.onAdd
      }
    ));
  },
  
  /**
   * Builds the Edit button for the top toolbar. Override to create your own
   * @param {Object} config An optional config object used to customise the button
   * @return {Ext.Button} The Edit button
   */
  buildEditButton: function(config) {
    return new Ext.Button(
      Ext.applyIf(config || {}, {
        text:     'Edit selected',
        scope:    this,
        iconCls:  'edit',
        disabled: true,
        handler:  this.onEdit
      }
    ));
  },
  
  /**
   * Builds the Delete button for the top toolbar. Override to create your own
   * @param {Object} config An optional config object used to customise the button
   * @return {Ext.Button} The Delete button
   */
  buildDeleteButton: function(config) {
    return new Ext.Button(
      Ext.applyIf(config || {}, {
        text:     'Delete selected',
        disabled: true,
        scope:    this,
        iconCls:  'delete',
        handler:  this.onDelete
      }
    ));
  },
  
  /**
   * Creates Add, Edit and Delete buttons for the top toolbar and sets up listeners to
   * activate/deactivate them as appropriate
   * @return {Array} An array of buttons 
   */
  buildTopToolbar: function() {
    var items = [];
    
    if (this.hasAddButton === true) {
      this.addButton = this.buildAddButton();
      items.push(this.addButton, '-');
    }
    
    if (this.hasEditButton === true) {
      this.editButton = this.buildEditButton();
      items.push(this.editButton, '-');
    }
    
    if (this.hasDeleteButton === true) {
      this.deleteButton = this.buildDeleteButton();
      items.push(this.deleteButton, '-');
    }
    
    if (this.hasSearchField === true) {
      this.searchField = this.buildSearchField();
      items.push(this.searchField, '-');
    }
    
    this.getSelectionModel().on('selectionchange', function(selModel) {
      if (selModel.getCount() > 0) {
        if (this.deleteButton != undefined) this.deleteButton.enable();
        if (this.editButton   != undefined) this.editButton.enable();
      } else {
        if (this.deleteButton != undefined) this.deleteButton.disable();
        if (this.editButton   != undefined) this.editButton.disable();
      };
    }, this);
    
    return items;
  },
  
  /**
   * @property pageSize
   * @type Number
   * The pageSize to use in the PagingToolbar bottom Toolbar (defaults to 25)
   */
  pageSize: 25,
  
  /**
   * Creates a paging toolbar to be placed at the bottom of this grid
   * @param {Ext.data.Store} store The store to bind to this paging toolbar (should be the same as for the main grid)
   * @return {Ext.PagingToolbar} The Paging Toolbar
   */
  buildBottomToolbar: function(store) {
    return new Ext.PagingToolbar({
      store:       store,
      displayInfo: true,
      pageSize:    this.pageSize,
      emptyMsg:    String.format("No {0} to display", this.model.prototype.pluralHumanName)
    });
  },
  
  /**
   * @property hasSearchField
   * @type Boolean
   * True to add a search input box to the end of the top toolbar (defaults to false)
   */
  hasSearchField: false,
  
  /**
   * @property searchParamName
   * @type String
   * The name of the param to send as the search variable in the GET request (defaults to 'q')
   */
  searchParamName: 'q',

  /**
   * Builds the search field component which can be added to the top toolbar of a grid
   * @return {Ext.form.TwinTriggerField} The search field object
   */
  buildSearchField: function() {
    /**
     * @property searchField
     * @type Ext.form.TwinTriggerField
     * The search field that is added to the top toolbar
     */
    this.searchField = new Ext.form.TwinTriggerField({
      width           : 200,
      validationEvent : false,
      validateOnBlur  : false,
      hideTrigger1    : true,
      onTrigger1Click : this.clearSearchField.createDelegate(this, []),
      onTrigger2Click : this.onSearch.createDelegate(this, []),
      
      trigger1Class   :'x-form-clear-trigger',
      trigger2Class   :'x-form-search-trigger'
    });
    
    this.searchField.on('specialkey', function(field, e) {
      if (e.getKey() === e.ESC)   this.clearSearchField(); e.stopEvent();
      if (e.getKey() === e.ENTER) this.onSearch();
    }, this);
    
    return this.searchField;
  },
  
  /**
   * Clears the search field in the top toolbar and hides the clear button
   */
  clearSearchField: function() {
    var f = this.searchField;
    
    f.el.dom.value = '';
    f.triggers[0].hide();
    this.doSearch();
  },
  
  /**
   * Attached to the search fields trigger2Click and Enter key events. Calls doSearch if the
   * user has actually entered anything.
   */
  onSearch: function() {
    var f = this.searchField,
        v = f.getRawValue();
        
    if (v.length < 1) {
      this.clearSearchField();
    } else {
      f.triggers[0].show();
      this.doSearch(v);
    }
  },
  
  /**
   * Performs the actual search operation by updating the store bound to this grid
   * TODO: Move this to the controller if possible (might not be...)
   * @param {String} value The string to search for
   */
  doSearch: function(value) {
    value = value || this.searchField.getRawValue() || "";
    
    var o = {start: 0};
    this.store.baseParams = this.store.baseParams || {};
    this.store.baseParams[this.searchParamName] = value;
    this.store.reload({params:o});
  },
  
  /**
   * Called when the add button is pressed, or when the 'a' key is pressed.  By default this will simply fire the 'add' event
   */
  onAdd: function() {
    this.fireEvent('new');
  },
  
  /**
   * Called when a row in this grid panel is double clicked.  By default this will find the associated
   * record and fire the 'edit' event.  Override to provide your own logic
   * @param {Ext.EventObject} e The Event object
   */
  onEdit: function(e) {
    var obj = this.getSelectionModel().getSelected();
    
    if (obj) this.fireEvent('edit', obj);
  },
  
  /**
   * Called when the delete button is pressed, or the delete key is pressed.  By default this will ask the user to confirm,
   * then fire the delete action with the selected record as the sole argument
   */
  onDelete: function() {
    Ext.Msg.confirm(
      'Are you sure?',
      String.format("Are you sure you want to delete this {0}?  This cannot be undone.", this.model.prototype.modelName.titleize()),
      function(btn) {
        if (btn == 'yes') {
          var selected = this.getSelectionModel().getSelected();
          if (selected) this.fireEvent('delete', selected);
        };
      },
      this
    );
  }
});

Ext.reg('scaffold_index', ExtMVC.view.scaffold.Index);

/**
 * @class ExtMVC.view.scaffold.New
 * @extends ExtMVC.view.scaffold.ScaffoldFormPanel
 * Shows a generic new form for a given model
 */
ExtMVC.view.scaffold.New = Ext.extend(ExtMVC.view.scaffold.ScaffoldFormPanel, {

  /**
   * Sets this panel's title, if not already set.  Also specifies the save handler to use
   */
  initComponent: function() {
    Ext.applyIf(this, {
      title: 'New ' + this.model.prototype.singularHumanName
    });
    ExtMVC.view.scaffold.New.superclass.initComponent.apply(this, arguments);
  }
});

Ext.reg('scaffold_new', ExtMVC.view.scaffold.New);

/**
 * @class ExtMVC.view.scaffold.Edit
 * @extends ExtMVC.view.scaffold.ScaffoldFormPanel
 * Shows a generic edit form for a given model
 */
ExtMVC.view.scaffold.Edit = Ext.extend(ExtMVC.view.scaffold.ScaffoldFormPanel, {
  
  /**
   * Sets the panel's title, if not already set
   */
  initComponent: function() {
    Ext.applyIf(this, {
      title: 'Edit ' + this.model.prototype.singularHumanName
    });
    
    ExtMVC.view.scaffold.Edit.superclass.initComponent.apply(this, arguments);
  },
  
  /**
   * Loads the given record into the form and maintains a reference to it so that it can be returned
   * when the 'save' event is fired
   * @param {ExtMVC.Model.Base} instance The model instance to load into this form
   */
  loadRecord: function(instance) {
    this.instance = instance;
    this.getForm().loadRecord(instance);
  },
  
  /**
   * Called when the save button is clicked or CTRL + s pressed.  By default this simply fires
   * the 'save' event, passing this.getForm().getValues() as the sole argument
   */
  onSave: function() {
    this.fireEvent('save', this.instance, this.getFormValues(), this);
  }
  
  /**
   * @event save
   * Fired when the user clicks the save button, or presses ctrl + s
   * @param {ExtMVC.model.Base} instance The existing instance that is to be updated
   * @param {Object} values The values entered into the form
   * @param {ExtMVC.view.scaffold.ScaffoldFormPanel} this The form panel
   */
});

Ext.reg('scaffold_edit', ExtMVC.view.scaffold.Edit);

/**
 * @class ExtMVC.view.HasManyEditorGridPanel
 * @extends Ext.grid.EditorGridPanel
 * Provides some sensible defaults for a HasMany editor grid.  For example, given the following models:
 * ExtMVC.model.define("MyApp.models.User", {
 *   ...
 *   hasMany: "Post"
 * });
 *
 * ExtMVC.model.define("MyApp.models.Post", {
 *   ...
 *   belongsTo: "User"
 * });
 *
 * Inside the edit User view, if we wanted to be able to quickly edit any of that User's Posts, we can insert
 * a HasManyEditorGridPanel like this:
 *
 * items: [
 *   {
 *     xtype:       'hasmany_editorgrid',
 *     modelObj:    userObj,
 *     association: userObj.posts,
 *     columns:     [... set up editor columns as per a normal EditorGridPanel]
 *   }
 * ]
 *
 * In the example above, userObj refers to the loaded User instance tied to the edit form.  The HasMany editor grid
 * automatically listens to afteredit events and saves the HasMany model (Post in this case).
 */
ExtMVC.view.HasManyEditorGridPanel = Ext.extend(Ext.grid.EditorGridPanel, {
  
  initComponent: function() {
    Ext.applyIf(this, {
      autoScroll: true,
      store:      this.association.findAll(),
      viewConfig: { forceFit: true }
    });
    
    if (this.hasTopToolbar) { this.addTopToolbar(); }
    
    ExtMVC.view.HasManyEditorGridPanel.superclass.initComponent.apply(this, arguments);
    
    /**
     * Set up listening on the afteredit event.  Simply saves the model instance
     */
    this.on('afteredit', function(args) {
      args.record.save({
        success: function() {
          args.record.commit();
        }
      });
    }, this);
    
    /**
     * Set up listening to selection change to activate the Remove button
     */
    this.getSelectionModel().on('selectionchange', function(selModel, selection) {
      if (this.deleteButton) {
        this.deleteButton.enable();
      };
    }, this);
  },
  
  /**
   * @property hasTopToolbar
   * @type Boolean
   * True to automatically show a toolbar at the top of the grid with Add and Delete buttons (defaults to true)
   */
  hasTopToolbar: true,
  
  /**
   * @property hasNewButton
   * @type Boolean
   * True to add a 'New' button to the top toolbar if the top toolbar is present (defaults to true)
   */
  hasNewButton: true,
  
  /**
   * @property hasDeleteButton
   * @type Boolean
   * True to add a 'Delete' button to the top toolbar if the top toolbar is present (defaults to true)
   */
  hasDeleteButton: true,
  
  /**
   * Private.
   * Creates a top toolbar and applies it to 'this'.  Should only be called from inside initComponent
   */
  addTopToolbar: function(paramName) {
    var items = [];
    
    if (this.hasNewButton) {
      this.newButton = new Ext.Toolbar.Button({
        iconCls: 'add',
        text:    'Add',
        scope:   this,
        handler: this.onAdd
      });
      
      items.push(this.newButton);
      items.push('-');
    };
    
    if (this.hasDeleteButton) {
      this.deleteButton = new Ext.Toolbar.Button({
        text:     'Remove selected',
        disabled: true,
        iconCls:  'delete',
        scope:    this,
        handler:  this.onDelete
      });
      
      items.push(this.deleteButton);
    };
    
    Ext.applyIf(this, {
      tbar: items
    });
  },
  
  /**
   * @property windowConfig
   * @type Object
   * Config object passed when creating the New Association window.  Override this to customise
   * the window that appears
   */
  windowConfig: {},
  
  /**
   * Called when the Add button is clicked on the top toolbar
   */
  onAdd: function(btn) {
    if (!this.addWindow) {
      this.addWindow = new Ext.Window(
        Ext.applyIf(this.windowConfig, {
          title:  'New',
          layout: 'fit',
          modal:  true,
          height: 300,
          width:  400,
          items:  [this.form],
          closeAction: 'hide',
          buttons: [
            {
              text:    'Save',
              iconCls: 'save',
              scope:   this,
              handler: this.onSaveNew
            },
            {
              text:    'Cancel',
              iconCls: 'cancel',
              scope:   this,
              handler: this.onCancelNew
            }
          ]
        })
      );
    }
    
    this.addWindow.show();
  },
  
  /**
   * Called when a row is selected and the delete button is clicked
   */
  onDelete: function(btn) {
    var record = this.getSelectionModel().selection.record;
    
    if (record) {
      record.destroy({
        scope:   this,
        success: function() {
          this.store.reload();
        },
        failure: function() {
          Ext.Msg.alert('Delete failed', "Something went wrong while trying to delete - please try again");
          this.store.reload();
        }
      });
    };
    
    this.deleteButton.disable();
  },
  
  /**
   * Called when the user clicks the save button to create a new record
   */
  onSaveNew: function() {
    this.association.create(this.form.getForm().getValues(), {
      scope:   this,
      success: function(modelObj, response) {
        this.store.reload();
        this.addWindow.hide();
      },
      failure: function(modelObj, response) {
        this.form.getForm().clearInvalid();
        this.form.getForm().markInvalid(modelObj.errors.forForm());
      }
    });
  },
  
  /**
   * Called when the user cancels adding a new association model
   */
  onCancelNew: function(paramName) {
    this.addWindow.hide();
  }
});

Ext.reg('hasmany_editorgrid', ExtMVC.view.HasManyEditorGridPanel);

/**
 * @class ExtMVC.view.FormWindow
 * @extends Ext.Window
 * Convenience class for creating a window with a default form.  Example:
 * 
<pre>
MyApp.views.MyFormWindow = Ext.extend(ExtMVC.view.FormWindow, {
 height: 200,
 width : 400,
 
  buildForm: function() {
    //return your Ext.form.FormPanel here
  }
});
</pre>
 * 
 */
ExtMVC.view.FormWindow = Ext.extend(Ext.Window, {
  modal  : true,
  height : 230,
  width  : 400,
  
  initComponent: function() {
    /**
     * @property form
     * @type Ext.form.FormPanel
     * The new POLN form
     */
    this.form = this.buildForm();
    
    Ext.apply(this, {
      items : [
        this.form
      ],
      buttons: [
        {
          text   : 'Save',
          iconCls: 'save',
          scope  : this,
          handler: this.onSave
        },
        {
          text   : 'Cancel',
          iconCls: 'cancel',
          scope  : this,
          handler: this.onCancel
        }
      ],
      layout: 'fit',
      closeAction: 'hide'
    });
    
    ExtMVC.view.FormWindow.superclass.initComponent.apply(this, arguments);
  },
  
  /**
   * Creates and returns a FormPanel instance to go inside the window. Override this yourself
   * @return {Ext.form.FormPanel} The form panel
   */
  buildForm: function() {
    return new Ext.form.FormPanel({});
  },
  
  /**
   * Loads an instance into the form
   * @param {GetIt.models.PurchaseOrderLineNote} instance The POLN instance to load
   */
  loadRecord: function(instance) {
    /**
     * @property instance
     * @type ExtMVC.model.Base
     * The instance currently loaded into the form
     */
    this.instance = instance;
    
    this.form.form.loadRecord(instance);
  },
  
  /**
   * Called when the user clicks the save button
   */
  onSave: function() {
    this.fireEvent('save', this.getFormValues());
  },
  
  /**
   * Called when the usre clicks the cancel button. By default this just hides the window
   */
  onCancel: function() {
    this.hide();
  },
  
  /**
   * Gets form values in a nicer way than getForm.getValues() does - calls getValue on each field.
   * See http://www.diloc.de/blog/2008/03/05/how-to-submit-ext-forms-the-right-way/
   * @return {Object} key: value pairings of form values
   */
  getFormValues: function() {
    var form   = this.form.getForm(),
        values = {};
    
    form.items.each(function(item) {
      var func = (typeof item.getSubmitValue == "function") ? 'getSubmitValue' : 'getValue';
      
      values[item.getName()] = item[func]();
    }, this);
    
    return values;
  }
});

Ext.reg('formwindow', ExtMVC.view.FormWindow);

