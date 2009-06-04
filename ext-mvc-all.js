/**
 * Initialise package and set version
 */
ExtMVC = Ext.extend(Ext.util.Observable, {
  version: "0.6a1",
  
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

Ext.ns('ExtMVC.Model', 'ExtMVC.plugin', 'ExtMVC.view', 'ExtMVC.view.scaffold', 'ExtMVC.lib');

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

        if (this.usesHistory) this.initializeHistory();     

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
    if (this.router) {return;}
    this.router = new ExtMVC.Router();
    ExtMVC.Router.defineRoutes(this.router);
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
 * Turns an array into a sentence, joined by a specified connector - e.g.:
 * ['Adama', 'Tigh', 'Roslin'].toSentence(); //'Adama, Tigh and Roslin'
 * ['Adama', 'Tigh', 'Roslin'].toSentence('or'); //'Adama, Tigh or Roslin'
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
 * @returns A capitalized string (e.g. "some test sentence" becomes "Some test sentence")
 * @type String
 */
String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.substr(1).toLowerCase();
};

/**
 * @returns The string in Title Case (e.g. "some test sentence" becomes "Some Test Sentence")
 * @type String
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

String.prototype.underscore = function() {
  return this.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/ /g, "_").replace(/^_/, '');
};

String.prototype.singularize = function() {
  return ExtMVC.Inflector.singularize(this);
};

String.prototype.pluralize = function() {
  return ExtMVC.Inflector.pluralize(this);
};

String.prototype.humanize = function() {
  return this.underscore().replace(/_/g, " ");
};

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
 * Old versions.  Not sure if we should be augmenting String like the above so have left this for reference
 */

// /**
//  * @param {String} str A string to be capitalized
//  * @returns A capitalized string (e.g. "some test sentence" becomes "Some test sentence")
//  * @type String
//  */
// String.capitalize = function(str) {
//   return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
// };
// 
// /**
//  * @param {String} str A string to be turned into title case
//  * @returns The string in Title Case (e.g. "some test sentence" becomes "Some Test Sentence")
//  * @type String
//  */
// String.titleize = function(str) {
//   return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
// };
// 
// /**
//  * Takes any string and de-underscores and uppercases it
//  * e.g. long_underscored_string => LongUnderscoredString
//  */
// String.camelize = function(class_name_string) {
//   return String.titleize(class_name_string.replace(/_/g, " ")).replace(/ /g, "");
// 
//   // this feels nicer, sadly no collect function (yet) though
//   // class_name_string.split("_").collect(function(e) {return String.capitalize(e)}).join("");
// };

ExtMVC.Router = function() {};
ExtMVC.Router.prototype = {
  
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
   * @return {ExtMVC.Route} The newly created route object
   */
  connect: function(re, additional_params) {
    var route = new ExtMVC.Route(re, additional_params);
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
ExtMVC.Router.defineRoutes = function(map) {
  map.connect(":controller/:action");
  map.connect(":controller/:action/:id");
};

/**
 * 
 * 
 */
ExtMVC.Route = function(mappingString, options) {
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
  
  /**
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

ExtMVC.Route.prototype = {
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
   * @param {Object} config The new model's config object, as sent to ExtMVC.Model.define
   */
  add: function(dependencyName, dependentName, config) {
    var arr = this.dependencies[dependencyName] || [];
    
    arr.push({name: dependentName, config: config});
    
    this.dependencies[dependencyName] = arr;
  }
});

/**
 * ExtMVC.Controller
 * @extends Ext.util.Observable
 * Controller base class
 */
ExtMVC.Controller = Ext.extend(Ext.util.Observable, {
  
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
    ExtMVC.Controller.superclass.constructor.apply(this, arguments);
    
    Ext.apply(this, config || {});
    
    this.initEvents();
    this.initListeners();
  },
  
  /**
   * Sets up events emitted by this controller. This defaults to an empty function and is
   * called automatically when the controller is constructed so can simply be overridden
   */
  initEvents: Ext.emptyFn,
  
  /**
   * Sets up events this controller listens to, and the actions the controller should take
   * when each event is received.  This defaults to an empty function and is called when
   * the controller is constructed so can simply be overridden
   */
  initListeners: Ext.emptyFn,
  
  /**
   * Shows the user a notification message. Usually used to inform user of a successful save, deletion, etc
   * This is an empty function which you must implement yourself
   * @param {String} notice The string notice to display
   */
  showNotice: function(notice) {
    console.log(notice);
  },
  
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

Ext.reg('controller', ExtMVC.Controller); 

/**
 * @class ExtMVC.controller.CrudController
 * @extends ExtMVC.Controller
 * An extension of Controller which provides the generic CRUD actions
 */
ExtMVC.CrudController = Ext.extend(ExtMVC.Controller, {
  /**
   * @property model
   * @type Function/Null
   * Defaults to null.  If set to a reference to an ExtMVC.Model subclass, renderView will attempt to dynamically
   * scaffold any missing views, if the corresponding view is defined in the ExtMVC.view.scaffold package
   */
  model: null,

  /**
   * @action create
   * Attempts to create a new instance of this controller's associated model
   * @param {Object} data A fields object (e.g. {title: 'My instance'})
   */
  create: function(data, form) {
    var instance = new this.model(data);

    instance.save({
      scope:   this,
      success: function(instance) {
        this.showCreatedNotice();
        this.index();
        
        this.fireEvent('create', instance);
      },
      failure: function(instance) {
        this.fireEvent('create-failed', instance);
      }
    });
  },
  
  /**
   * @action read
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
   * @param {ExtMVC.Model.Base} instance The existing instance object
   * @param {Object} updates An object containing updates to apply to the instance
   */
  update: function(instance, updates) {
    for (var key in updates) {
      instance.set(key, updates[key]);
    }
    
    instance.save({
      scope:   this,
      success: function() {
        if (this.fireEvent('update', instance, updates) !== false) {
          this.showUpdatedNotice();
          this.index();          
        }
      },
      failure: function() {
        this.fireEvent('update-failed', instance, updates);
      }
    });
  },
  
  /**
   * @action destroy
   * Attempts to delete an existing instance
   * @param {Mixed} instance The ExtMVC.Model.Base subclass instance to delete.  Will also accept a string/number ID
   */
  destroy: function(instance) {
    instance.destroy({
      scope:   this,
      success: function() {
        this.fireEvent('delete', instance);
      },
      failure: function() {
        this.fireEvent('delete-failed', instance);
      }
    });
  },
  
  /**
   * @action index
   * Renders the custom Index view if present, otherwise falls back to the default scaffold grid
   */
  index: function() {
    this.render('Index', {
      model     : this.model,
      controller: this,
      listeners : {
        scope   : this,
        'delete': this.destroy,
        'add'   : this.build,
        'edit'  : this.edit
      },
      viewsPackage: this.viewsPackage
    });
  },
  
  /**
   * @action build
   * Renders the custom New view if present, otherwise falls back to the default scaffold New form
   */
  build: function() {
    this.render('New', {
      model: this.model,
      listeners: {
        scope:  this,
        cancel: this.index,
        save:   this.create
      },
      viewsPackage: this.viewsPackage
    });
  },
  
  /**
   * @action edit
   * Renders the custom Edit view if present, otherwise falls back to the default scaffold Edit form
   * @param {Mixed} instance The model instance to edit. If not given an ExtMVC.Model.Base
   * instance, a findById() will be called on this controller's associated model
   */
  edit: function(instance) {
    if (instance instanceof Ext.data.Record) {
      this.render('Edit', {
        model: this.model,
        listeners: {
          scope : this,
          cancel: this.index,
          save  : this.update
        },
        viewsPackage: this.viewsPackage
      }).loadRecord(instance);      
    } else {
      var id = instance;
      
      this.model.find(id, {
        scope  : this,
        success: function(instance) {
          this.edit(instance);
        }
      });
    }
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
   * Sets up events emitted by the CRUD Controller's actions
   */
  initEvents: function() {
    this.addEvents(
      /**
       * @event create
       * Fired when a new instance has been successfully created
       * @param {ExtMVC.Model.Base} instance The newly created model instance
       */
      'create',
      
      /**
       * @event create-failed
       * Fired when an attempt to create a new instance failed
       * @param {ExtMVC.Model.Base} instance The instance object which couldn't be saved
       */
      'create-failed',
      
      /**
       * @event read
       * Fired when a single instance has been loaded from the database
       * @param {ExtMVC.Model.Base} instance The instance instance that was loaded
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
       * @param {ExtMVC.Model.Base} instance The updated instance
       * @param {Object} updates The updates object that was supplied
       */
      'update',
      
      /**
       * @event update-failed
       * Fired when an attempty to update an existing instance failed
       * @param {ExtMVC.Model.Base} instance The instance we were attempting to update
       * @param {Object} updates The object of updates we were trying to apply
       */
      'update-failed',
      
      /**
       * @event delete
       * Fired when an existing instance has been successfully deleteed
       * @param {ExtMVC.Model.Base} instance The instance that was deleteed
       */
      'delete',
      
      /**
       * @event delete-failed
       * Fired when an attempt to delete an existing instance failed
       * @param {ExtMVC.Model.Base} instance The instance we were trying to delete
       */
      'delete-failed',
      
      /**
       * @event index
       * Fired when an instances collection has been loaded from the database
       * @param {Ext.data.Store} instances An Ext.data.Store containing the instances retrieved
       */
      'index',
      
      /**
       * @event index-failed
       * Fired when an error was encountered while trying to load the instances from the database
       */
      'index-failed'
    );
  },
  
  /**
   * If a view of the given viewName is defined in this controllers viewPackage, a reference to its
   * constructor is defined.  If not, a reference to the default scaffold for the viewName is returned
   * @param {String} viewName The name of the view to return a constructor function for
   * @return {Function} A reference to the custom view, or the scaffold fallback
   */
  getViewClass: function(viewName) {
    var userView = ExtMVC.CrudController.superclass.getViewClass.call(this, viewName);
    
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


Ext.ns('ExtMVC.plugin.CrudController');

(function() {
  var c = ExtMVC.plugin.CrudController;
  
  /**
   * Adds default CRUD (Create, Read, Update, Delete) to this controller.
   * This is currently injected into Controller's prototype, so a simple call to this.actsAsCrudController()
   * with the following params sets everything up. It adds the following actions:
   * 
   * new() - by default displays the view called 'new' in this controller's view namespace
   * edit() - displays the 'edit' view and loads the model whose id is in your os.params.id
   * create(form) - takes an Ext.form.BasicForm and attempts to create + save a new model object with it
   * update(form) - takes a BasicForm and attempts to update an existing object with it (again using os.params.id)
   * delete(id, store) - takes an ID, deletes it and optionally refreshes a store
   * 
   * It does not overwrite any existing action already defined under one of those names.
   *
   * Override any of the default methods like this:
   * 
   * this.actsAsCrudController, MyNamespace.models.MyModel, {
   *   onUpdateFailure: function() {... your custom onUpdateFailure behaviour ...}
   * });
   *
   * @param {ExtMVC.Model} model The model to provide CRUD support for
   * @return {ExtMVC.Controller} The controller, now with addition actions and methods
   */
  c.registerActions = function(model, overrides) {
    Ext.apply(this, overrides, c.defaultFunctions);
    
    this.addEvents(
      /**
       * @event findsuccess
       * Fires after a successful load has taken place (applies to Edit forms)
       * @param {ExtMVC.Model} modelObj The instantiated model object found by the lookup
       */
      'findsuccess',
      
      /**
       * @event findfailure
       * Fires if the model instance could not be found
       */
      'findfailure'
    );
    
    /**
     * @property model
     * @type ExtMVC.Model
     * Holds a reference to the model this controller provides CRUD support for
     */
    this.model = model;
    
    if (!this.model) {
      throw new Error("You must provide a model to this.actsAsCrudController().  " +
                      "Pass it as the first argument to actsAsCrudController or set " + 
                      "'this.model = YourModel' before calling actsAsCrudController.");
    };
    
    /**
     * @action new 
     * Renders the new form for this model
     */
    this.registerAction('new', function() {
      this.form = this.renderView('new');
    }, {overwrite: false});
    
    /**
     * @action edit 
     * Renders the edit form and loads the model data into it
     */
    this.registerAction('edit', function() {
      this.form = this.renderView('edit');
      this.form.el.mask('Loading...', 'x-mask-loading');
      
      this.loadForm(this.form);
    }, {overwrite: false});
    
    /**
     * @action create 
     * Creates a new model instance, displays errors if required and redirects to index
     */
    this.registerAction('create', function(form) {
      form.el.mask('Saving...', 'x-mask-loading');
      this.onCreate(form);
    }, {overwrite: false});
    
    /**
     * @action update
     * Updates an existing model instance, displays errors if required and redirects to index
     */
    this.registerAction('update', function(form) {
      form.el.mask('Saving...', 'x-mask-loading');
      this.onUpdate(form);
    }, {overwrite: false});
    
    /**
     * @action delete 
     * Deletes a given model instance
     */
    this.registerAction('delete', function(id, store) {
      var id = id || this.os.params.id;
      if (id) {
        var u = new this.model({id: id});
        u.destroy({
          scope:   this,
          success: this.ondeleteSuccess.createDelegate(this, [store]),
          failure: this.ondeleteFailure
        });
      };
    }, {overwrite: false});
  };
  
  c.defaultFunctions = {
    
    /**
     * @property modelObj
     * @type ExtMVC.Model/Null
     * Reference to the model being edited in this form.  Is set once loaded by the adapter
     */
    modelObj: null,
    
    /**
     * @property loadUrl
     * @type String/Null
     * If your form needs to load from a non-standard url, override this (should be very rare).
     * Defaults to null, which lets the model choose which url to load from
     */
    loadUrl: null,
    
    /**
     * @property saveUrl
     * @type String
     * If your form needs to save to a non-standard url, override this (should be very rare).
     * Defaults to null, which lets the model choose which url to save to
     */
    saveUrl: null,
  
    /**
     * Loads the form with model data
     * @param {Ext.form.FormPanel} form a reference to the form into which to load the data
     */
    loadForm: function(form) {
      this.model.findById(this.os.params.id, {
        scope:    this,
        url:      this.loadUrl,
        success:  this.onFindSuccess,
        failure:  this.onFindFailure,
        callback: form.el.unmask.createDelegate(form.el)
      });
    },
    
    /**
     * Fires after successful find of the model.  Loads data into the form
     * @param {ExtMVC.Model} modelObj The found model object
     */
    onFindSuccess: function(modelObj) {
      this.editModelObj = modelObj;
      this.form.getForm().loadRecord(modelObj);
      
      this.fireEvent('findsuccess', modelObj);
    },
    
    /**
     * Fires if the model object could not be loaded for whatever reason.
     * By default it offers the user to try again or go back
     */
    onFindFailure: function() {
      this.fireEvent('findfailure');
      Ext.Msg.show({
        title:   'Load Failed',
        msg:     'The item could not be loaded',
        buttons: {yes: 'Try again', no: 'Back'},
        scope:   this,
        fn:      function(btn) { btn == 'yes' ? this.loadForm() : Ext.History.back(); }
      });
    },
    
    /**
     * Called when the save button on an edit form is pressed.  By default this will load the model object with the form values,
     * then call save() on the model object.  Override onCreateSuccess and onCreateFailure to update success and failure callbacks
     * @param {Ext.form.BasicForm} form A reference to the FormPanel
     */
    onCreate: function(form) {
      this.newModelObj = new this.model({});
      
      this.onSave(form, this.newModelObj, {
        success:  this.onCreateSuccess,
        failure:  this.onCreateFailure
      });
    },
    
    /**
     * Called when the save button on an edit form is pressed.  By default this will load the model object with the form values,
     * then call save() on the model object.  Override onUpdateSuccess and onUpdateFailure to update success and failure callbacks
     * @param {Ext.form.BasicForm} form A reference to the FormPanel
     */
    onUpdate: function(form) {
      this.onSave(form, this.editModelObj, {
        success:  this.onUpdateSuccess,
        failure:  this.onUpdateFailure
      });
    },
    
    /**
     * Used by both onCreate and onUpdate.  Don't override this unless you understand what you're doing
     */
    onSave: function(form, model, options) {
      //add a saving mask
      form.el.mask('Saving...', 'x-mask-loading');
      
      /**
       * Updates the model (which also saves it).  Uses success and failure options passed in from
       * one of onUpdate or onCreate, depending on which one called this
       */
      model.update(form.getValues(), Ext.apply({}, options, {
        scope:    this,
        url:      this.saveUrl,
        callback: function() {form.el.unmask();}
      }));
    },
    
    /**
     * Called after a successful save.  By default will redirect to the model's index page
     * @param {Object} response The response object from the server
     */
    onSaveSuccess: function(response) {
      this.os.router.redirectTo(Ext.apply({}, { action: 'index' }, this.os.params));
    },
    
    /**
     * Called after successful item creation.  By default this just first onSaveSuccess
     */
    onCreateSuccess: function() {this.onSaveSuccess();},
    
    /**
     * Called after successful item update.  By default this just first onSaveSuccess
     */
    onUpdateSuccess: function() {this.onSaveSuccess();},
    
    /**
     * Called after save fails on create.  By default this will parse server errors and display them on the form
     * @param {Object} response the response object from the server (should be containing errors)
     */
    onCreateFailure: function(modelObj, response) {
      this.addErrorMessages(modelObj, response);
    },
    
    /**
     * Called after save fails on update.  By default this will parse server errors and display them on the form
     * @param {Object} response the response object from the server (should be containing errors)
     */
    onUpdateFailure: function(modelObj, response) {
      this.addErrorMessages(modelObj, response);
    },
    
    /**
     * Adds server errors to the model and form fields. Private.
     * @ignore
     */
    addErrorMessages: function(modelObj, response) {
      this.form.getForm().clearInvalid();
      this.form.getForm().markInvalid(modelObj.errors.forForm());
    },
    
    /**
     * Called after an item has been successfully deleteed (deleted).  By default this reloads the grid's store
     * @param {Ext.data.Store} store The Ext.data.Store to reload after deletion
     */
    ondeleteSuccess: function(store) {
      if (store) store.reload();
    },
    
    /**
     * Called after an delete attempt was made on a model instance, but the attempt failed.  By default this shows
     * a MessageBox alert informing the user
     */
    ondeleteFailure: function(paramName) {
      Ext.Msg.alert(
        'Delete Failed',
        'Sorry, something went wrong when trying to delete that item.  Please try again'
      );
    }
  };
  
  /**
   * Define a method on Controller to enable this.actsAsCrudController(this) within a
   * controller constructor function
   */
  ExtMVC.Controller.prototype.actsAsCrudController = c.registerActions;
  
})();

/**
 * ExtMVC.OS
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
    if (this.router) {return;}
    this.router = new ExtMVC.Router();
    ExtMVC.Router.defineRoutes(this.router);
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

ExtMVC.Model = function() {
  return {
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
     * @param {Object} config The new model's config object, as sent to ExtMVC.Model.define
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
     * The object into which Models are defined.  This defaults to window, meaning calls to ExtMVC.Model.create
     * will create models globally scoped unless this is modified.  Setting this instead to MyApp.models would 
     * mean that a model called 'User' would be defined as MyApp.models.User instead
     */
    modelNamespace: window,

    /**
     * Sets a model up for creation.  If this model doesn't extend any other Models that haven't been defined yet
     * it is returned immediately, otherwise it is placed into a queue and defined as soon as its dependency models
     * are in place. Example:
     * 
     * ExtMVC.Model.define('MyApp.models.MyModel', {
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
     * @return {ExtMVC.Model.Base/Null} The newly defined model constructor, or null if the model can't be defined yet
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
     * Creates a new ExtMVC.Model.Base subclass and sets up all fields, instance and class methods.
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
      for (methodName in classMethods) {
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
     * @param {ExtMVC.Model} model The model to initialize the plugin with
     */
    initializePlugins: function(model) {
      Ext.each(this.plugins, function(plugin) {
        plugin.initialize(model);
      }, this);
    }
  };
}();

Ext.ns('ExtMVC.Model.plugin');

// /**
//  * ExtMVC.Model
//  * @extends Ext.util.Observable
//  * Base model class
//  */
// ExtMVC.Model = function(fields, config) {
//   Ext.applyIf(this, {
//     /**
//      * @property newRecord
//      * @type Boolean
//      * True if this record is newly created and has not yet been successfully saved
//      */
//     newRecord: fields.id ? false : true
//   });
//   
//   //create a new Record object and then decorate it with RecordExtensions
//   var record = ExtMVC.Model.recordFor(this.modelName, fields);
//   var rec = new record(fields || {});
//   rec.init(this);
//   
//   Ext.applyIf(this, this.constructor.instanceMethods);
//   
//   //add any hasMany associations
//   var hm = this.constructor.hasMany;
//   if (hm) {
//     //make sure we're dealing with an array
//     if (typeof hm == 'string') { hm = [hm]; }
//     
//     for (var i=0; i < hm.length; i++) {
//       var hma = hm[i];
//       
//       //association can just be specified via a string, in which case turn it into an object here
//       if (typeof hma == 'string') { hma = { name: hma }; };
//       
//       hma = new ExtMVC.Model.HasManyAssociation(this, hma);
//       this[hma.associationName] = hma;
//     };
//   };
//   
//   //add any belongsTo associations
//   var bt = this.constructor.belongsTo;
//   if (bt) {
//     //make sure we're dealing with an array
//     if (typeof bt == 'string') { bt = [bt]; }
//     
//     for (var i=0; i < bt.length; i++) {
//       var bta = bt[i];
//       
//       //association can just be specified via a string, in which case turn it into an object here
//       if (typeof bta == 'string') { bta = { name: bta }; };
//       
//       var btaAssoc = new ExtMVC.Model.BelongsToAssociation(this, bta);
//       this[btaAssoc.associationName] = btaAssoc;
//       
//       //see if a parent has been defined, if not set one up now (defaults here to the first belongsTo assoc)
//       var parentModel = this.constructor.parentModel || bta.name;
//       if (parentModel && !this.parent) {
//         this.parent = btaAssoc;
//       };
//     };
//   };
//   
//   Ext.apply(this, rec);
// };
// 
// /**
//  * Creates a model definition
//  * @param {String} modelNameWithNamespace The (string) name of the model to create (e.g. MyNamespace.model.MyModel)
//  * @param {object} config Configuration for this model.
//  * @cfg {Array} fields Array of field definitions for this model, same format as Ext.data.Record.create takes
//  * @cfg {String} adapter The data adapter to use (defaults to REST, which attempts to save models to a RESTful url backend)
//  * @cfg {String} urlName The string version of the model name to use when making requests to the server.  e.g. for a model called
//  * MyModel the server may be set up to accept urls like /my_models/1 or /MyModels/1, this is where you specify that
//  * @cfg {String} xmlName The name of the XML element which contains the model fields.  e.g. for a model called MyModel, this may look
//  * like <MyModel>...</MyModel> or <my_model>...</my_model>.  This is where you set that (don't include the angle brackets)
//  */
// ExtMVC.Model.define = function(modelNameWithNamespace, config) {
//   var config = config || {};
//   
//   //split into namespace and model name
//   var nsRegex = /(.+)\.([A-Za-z]*)$/;
//   var match = nsRegex.exec(modelNameWithNamespace);
//   var namespace = null;
//   if (match) {
//     var namespace = match[1];
//     var modelName = match[2];
//     Ext.ns(namespace); //make sure the namespace is defined
//   };
// 
//   Ext.applyIf(config, {
//     namespace: namespace, //.split(".")[0],
//     modelName: modelName,
//     className: modelName,
//     adapter:   'REST'
//   });
//   
//   //extend ExtMVC.Model for this className
//   eval(modelNameWithNamespace + " = Ext.extend(ExtMVC.Model, config)");
//   var className = eval(modelNameWithNamespace);
//   
//   /**
//    * If we are extending another model, copy its fields, class methods and instance methods
//    * into this model
//    */
//   if (className.prototype.extend) {
//     var extendsModel = eval(className.prototype.extend);
//     var parentFields = extendsModel.fields;
//     
//     //add parent model fields to the front of the child model fields array
//     for (var i = parentFields.length - 1; i >= 0; i--){
//       var childFields    = className.prototype.fields;
//       var alreadyDefined = false;
//       
//       //check that this field is not redefined in the child model
//       for (var j=0; j < childFields.length; j++) {
//         if (childFields[j].name == parentFields[i].name) {
//           alreadyDefined = true;
//           break; //no need to finish the loop as we've already made the match
//         }
//       };
//       
//       //only add if not redefined in child model
//       if (!alreadyDefined) {
//         className.prototype.fields.unshift(parentFields[i]);
//       };
//     };
//     
//     //add any class methods
//     Ext.applyIf(className, extendsModel.prototype);
//   };
//   
//   /**
//    * Add fields the way Ext.data.Record does it.
//    * TODO: We shouldn't be doing this here, Record should be doing it... not very DRY
//    */
//   className.prototype.fields = new Ext.util.MixedCollection();
//   Ext.each(config.fields, function(f) {
//     className.prototype.fields.add(new Ext.data.Field(f));
//   });
//   
//   //add fields, modelName, className and adapter as class-level items
//   Ext.apply(className, {
//     adapter:   config.adapter,
//     modelName: modelName,
//     className: className,
//     namespace: namespace,
//     
//     //build the underlying Ext.data.Record now (will be used in model's constructor)
//     record:    ExtMVC.Model.recordFor(modelName, config.fields)
//   });
//   
//   //add model class functions such as findById
//   ExtMVC.Model.addClassMethodsToModel(className, config);
// };
// 
// 
// /**
//  * Custom extensions to Ext.data.Record.  These methods are added to new Ext.data.Record objects
//  * when you subclass ExtMVC.Model.
//  * For example
//  * model = new ExtMVC.Spec.FakeUser({
//  *   id:   100,
//  *   name: 'Ed'
//  * });
//  * alert(model.namespacedUrl('my_url')); // => '/admin/my_url.ext_json'
//  */
// ExtMVC.Model.RecordExtensions = {
//   /**
//    * Adds logic on top of Ext.data.Record
//    */
//   init: function(config) {
//     Ext.applyIf(config, {
//       //set up the various variations on the model name
//       className:         ExtMVC.Model.classifyName(config.modelName),
//       controllerName:    ExtMVC.Model.controllerName(config.modelName),
//       foreignKeyName:    ExtMVC.Model.foreignKeyName(config.modelName),
//       
//       humanPluralName:   ExtMVC.Model.pluralizeHumanName(config.modelName),
//       humanSingularName: ExtMVC.Model.singularizeHumanName(config.modelName),
//       
//       underscoreName:    config.modelName
//     });
//     
//     //add the data adapter, initialize it
//     var adapter = ExtMVC.Model.AdapterManager.find(config.adapter || ExtMVC.Model.prototype.adapter);
//     if (adapter) {
//       Ext.apply(config, adapter.instanceMethods);
//       adapter.initialize(this);
//     }
//     
//     //mix in validations package
//     Ext.apply(config, ExtMVC.Model.ValidationExtensions);
//     config.initializeValidationExtensions();
//     
//     Ext.apply(this, config);
//   },
//   
//   /**
//    * Calculates a nested url for this object based on it's data.id and parent model
//    * @return {String} The url for this model object
//    */
//   url: function() {
//     var el = this.data.id ? this : this.constructor;
//     if (this.parent && this.parent.lastFetched) {
//       return ExtMVC.UrlBuilder.urlFor(this.parent.get({}, -1), el);
//     } else {
//       return ExtMVC.UrlBuilder.urlFor(el);
//     };
//   },
//   
//   /**
//    * Mass-assigns field values.  Operation is wrapped in beginEdit and endEdit
//    * e.g. setValues({first_name: 'Ed', last_name: 'Spencer'})
//    * is the same as set('first_name', 'Ed'); set('last_name': 'Spencer')
//    * @param {Object} values An object containing key: value pairs for fields on this object
//    */
//   setValues: function(values) {
//     this.beginEdit();
//     for (var key in values) {
//       this.set(key, values[key]);
//     }
//     this.endEdit();
//   },
//   
//   /**
//    * Reads errors from a generic object and adds them to this model's internal errors object.
//    * Intended to be used mainly to process server responses
//    */
//   readErrors: function(errorsObject) {
//     this.errors.readServerErrors(errorsObject);
//   }
// };
// 
// /**
//  * Provides a framework for validating the contents of each field
//  */
// ExtMVC.Model.ValidationExtensions = {
//   /**
//    * Sets up this record's validation parameters
//    */
//   initializeValidationExtensions: function() {
//     this.validations = this.validations || [];
//     this.errors      = new ExtMVC.Model.Validation.Errors(this);
//   },
//   
//   isValid: function() {
//     return this.errors.isValid();
//   }
// };
// 
// 
// ExtMVC.Model.models   = [];
// 
// /**
//  * Utility methods which don't need to be declared per model
//  */
// Ext.apply(ExtMVC.Model, {
//   
//   /**
//    * Retrieves or creates an Ext.data.Record for the given model name.  This is then cached
//    * in ExtMVC.models for later reuse
//    * @param {String} modelName The name of the model to create or retrieve a record for
//    * @param {Array} fields An array of fields to be passed to the Ext.data.Record.create call
//    * @return {Ext.data.Record} An instantiated Record object using Ext.data.Record.create
//    */
//   recordFor: function(modelName, fields) {
//     var record = ExtMVC.Model.models[modelName];
//     if (!record) {
//       record = Ext.data.Record.create(fields);
// 
//       Ext.apply(record.prototype, ExtMVC.Model.RecordExtensions);
//       ExtMVC.Model.models[modelName] = record;
//     }
//     
//     return record;
//   },
//     
//   /**
//    * String methods:
//    */
//    
//   urlizeName : function(name) {
//     return name.toLowerCase().pluralize();
//   },
//   
//   classifyName: function(name) {
//     return this.singularizeHumanName(name).replace(/ /g, "");
//   },
//   
//   singularizeHumanName: function(name) {
//     return name.replace(/_/g, " ").titleize();
//   },
//   
//   pluralizeHumanName: function(name) {
//     return name.pluralize().replace(/_/g, " ").titleize();
//   },
//   
//   controllerName : function(name) {
//     return this.pluralizeHumanName(name).replace(/ /g, "")  + "Controller";
//   },
//   
//   foreignKeyName: function(name) {
//     return name.toLowerCase() + '_id';
//   },
//   
//   /**
//    * Add class methods for finding model objects
//    * @param {Function} modelClass The class to add methods to
//    * @param {Object} additionalFunctions (Optional) extra class methods to add to this class
//    */
//   addClassMethodsToModel: function(modelClass, additionalFunctions) {
//     var additionalFunctions = additionalFunctions || {};
//     
//     Ext.applyIf(additionalFunctions, {
//       //add a urlName property to the Model subclass
//       urlName: ExtMVC.Model.urlizeName(modelClass.prototype.modelName)
//     });
//     
//     //add any class methods from the adapter
//     var adapter = ExtMVC.Model.AdapterManager.find(modelClass.adapter || ExtMVC.Model.prototype.adapter);
//     if (adapter && adapter.classMethods) {
//       Ext.apply(modelClass, adapter.classMethods);
//     };
//         
//     //add other class methods    
//     Ext.apply(modelClass, {      
//       /**
//        * Returns the default reader for this model subclass.  Creates a default reader if
//        * one has not already been set
//        */
//       getReader: function() {
//         if (!modelClass.reader) {
//           modelClass.reader = new Ext.data.JsonReader({
//             totalProperty: 'totalCount',
//             root: modelClass.jsonName || modelClass.prototype.modelName.toLowerCase()
//           }, modelClass);
//         };
//         
//         return modelClass.reader;
//       }
//     }, additionalFunctions);
//   }
// });
// 
// Ext.ns('ExtMVC.Model.Adapter', 'ExtMVC.Model.Validation');

/**
 * @class Ext.Model.Base
 * A set of properties and functions which are applied to all ExtMVC.Models when they are defined
 */
ExtMVC.Model.Base = function() { 
  //any code in here will be run only once - when Base gets added to Record's prototype
  //this will NOT be run every time a Model is defined or instantiated
};
 
ExtMVC.Model.Base.prototype = {
  
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
   * Returns a unique string for a model instance, suitable for use as a key in a cache (e.g. ExtMVC.Model.Cache).
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
 * Add the above Base methods and properties to the Ext.data.Record prototype. This means all Record instances
 * will have MVC models methods, even if not instantiated by an MVC-defined model constructor
 */
Ext.apply(Ext.data.Record.prototype, new ExtMVC.Model.Base());

(function() {
  ExtMVC.Model.plugin.association = (function() {
    
    return {
      /**
       * This function is called every time a model is created via ExtMVC.Model.create
       * (*NOT* when a model instance is instantiated). Here we initialize associations
       * on this model.
       */
      initialize: function(model) {
        var proto = model.prototype,
            assoc = ExtMVC.Model.plugin.association;
        
        this.resolveDependencies(model);
        
        if (proto.hasMany) {
          Ext.each(this.parseParams(proto.hasMany, 'HasMany'), function(params) {
            this.define(assoc.HasMany, model, params);
          }, this);
        }
        
        if (proto.belongsTo) {
          Ext.each(this.parseParams(proto.belongsTo, 'BelongsTo'), function(params) {
            this.define(assoc.BelongsTo, model, params);
          }, this);
        }
      },
      
      /**
       * @property dependencies
       * @type ExtMVC.lib.Dependencies
       * Dependencies class to manage associations on currently undefined models
       */
      dependencies: new ExtMVC.lib.Dependencies(),
      
      /**
       * Defines a new association between two models.  If both models have already been created,
       * the association is created immediately, otherwise it is deferred until both models have been created
       * You should never have to call this manually...
       * @param {Function} constructor The Association constructor to use (one of BelongsTo or HasMany)
       * @param {ExtMVC.model.Base} model The model which owns the association
       * @param {Object} params Association params such as associationName and associatedClass
       */
      define: function(constructor, model, params) {
        var modelNS         = ExtMVC.Model.modelNamespace,
            associatedClass = params.associatedClass,
            modelName       = model.prototype.modelName;
        
        if (typeof modelNS[associatedClass] == 'function') {
          //create the model now
          this.create.call(this, constructor, modelName, params);
        } else {
          //create the model later
          params.associationConstructor = constructor;
          this.dependencies.add(associatedClass, modelName, params);
        }
      },
      
      /**
       * Creates an association once both models in question have been created
       * @param {Function} constructor The association constructor (should be HasMany or BelongsTo function)
       * @param {String} modelName The name of the model on which the association is to be defined
       * @param {Object} params Parameters for the association, containing at least the following properties:
       */
      create: function(constructor, modelName, params) {
        var modelNS         = ExtMVC.Model.modelNamespace,
            model           = modelNS[modelName],
            associatedModel = modelNS[params.associatedClass],
            associationName = params.associationName;
        
        model.prototype[associationName] = new constructor(model, associatedModel, params);
      },
      
      /**
       * This is called immediately by initialize().  Associations are often specified on models that haven't
       * been created yet, so we keep a list of dependent associations which are to be defined as soon as the
       * model has been created.  This method is called with the Model constructor function, looks up any associations
       * that couldn't previously be defined (as this model did not yet exist), and creates them no
       * @param {ExtMVC.Model.Base} model The newly created model
       */
      resolveDependencies: function(model) {
        var dependents = this.dependencies.get(model.prototype.modelName);
        
        Ext.each(dependents || [], function(dependent) {
          var constructor = dependent.config.associationConstructor;
          delete dependent.config.associationConstructor;
          
          this.create(constructor, dependent.name, dependent.config);
        }, this);
      },
      
      /**
       * Parses belongsTo and hasMany params into a unified format
       * @param {Mixed} params String, Object or Array
       * @param {String} associationType BelongsTo or HasMany - decides how to generate the default association name
       * @return {Array} An array of normalized params objects
       */
      parseParams: function(params, associationType) {
        var results         = [],
            associationType = associationType || 'BelongsTo',
            inflectMethod   = associationType == 'BelongsTo' ? 'singularize' : 'pluralize';
                
        /**
         * We're either passed a string, an object, or an array containing one or more
         * of each...
         */
        if (Ext.isArray(params)) {
          Ext.each(params, function(association) {
            results.concat(this.parseParams(association));
          }, this);
          return results;
          
        } else {
          if (typeof params == 'string') {
            params = {associatedClass: params};
          }
          
          var assocClass = params.associatedClass,
              assocName  = typeof assocClass == 'function'
                         ? ExtMVC.Inflector[inflectMethod](assocClass.prototype.modelName)
                         : ExtMVC.Inflector[inflectMethod](assocClass);
          
          Ext.applyIf(params, {
            extend:          {},
            associationName: assocName
          });
          
          results.push(params);
        }
        
        return results;
      }
    };
  })();
  
  var A = ExtMVC.Model.plugin.association;
  
  /**
   * @class ExtMVC.Model.plugin.association.Base
   * Association Base class which provides basic functionality for other Association classes to build upon
   * Don't use directly - instead use the HasMany or BelongsTo classes.
   */
  A.Base = function(ownerClass, associatedClass, config) {
    config = config || {};
    
    this.ownerClass = ownerClass;
    this.associatedClass = associatedClass;
    
    Ext.apply(this, config.extend || {});
    this.initialConfig = config;
    
    this.initialize();
  };

  A.Base.prototype = {
    /**
     * Sets up default values for foreignKey
     */
    initialize: Ext.emptyFn
  };
  
  /**
   * @class A.BelongsTo
   * @extends A.Base
   * A belongsTo association
   */
  A.BelongsTo = Ext.extend(A.Base, {
    initialize: function() {
      Ext.apply(this, {
        name:       ExtMVC.Inflector.singularize(this.associatedClass.prototype.tableName),
        foreignKey: this.associatedClass.prototype.foreignKeyName
      });
    }
  });
  
  /**
   * @class A.HasMany
   * @extends A.Base
   * A hasMany association
   */
  A.HasMany = Ext.extend(A.Base, {
    
    /**
     * Set up default values for name etc
     */
    initialize: function() {
      Ext.apply(this, {
        name:       this.associatedClass.prototype.tableName,
        foreignKey: this.ownerClass.prototype.foreignKeyName
      });
    }
  });
})();

ExtMVC.Model.addPlugin(ExtMVC.Model.plugin.association);

/**
 * Method  Collection Individual
 * create  yes        yes  (but different)
 * build   yes        yes
 * find    yes        no
 * loaded  yes        yes  (but different)
 * count   yes        no
 * destroy yes        yes  (but different)
 */

/**
 * Method  HasMany BelongsTo
 * create  yes     no
 * build   yes     no
 * destroy yes     yes
 * find    yes     yes
 */

/**
 * User.find(1, {
 *   success: function(user) {
 *     //on belongs to associations
 *     user.group.destroy();
 *     user.group.find({success: function(group) {}});
 *     user.group.set(someGroupInstance); //someGroupInstance must be a saved record (e.g. have an ID)
 * 
 *     //on has many associations
 *     user.posts.destroy(1);
 *     user.posts.find({id: 1, conditions: [{field: 'title', comparator: '=', value: 'some title'}]}, options);
 *     user.posts.create(data, options)
 *     user.posts.build(data)
 *   }
 * };
 */

// ExtMVC.Model.define('User', {
//   fields:  [],
//   belongsTo: "Group",
//   hasMany: [{
//     name:       'posts',
//     className:  'Post',
//     foreignKey: 'user_id',
//     
//     extend: {
//       //some functions
//     }
//   }]
// });
// 
// user.posts.find(1, {
//   success: function() {},
//   failure: function() {}
// });
// 
// user.posts.create({}, {
//   success: function() {},
//   failure: function() {}
// });
// 
// user.posts.build({});
// 
// user.posts.loaded();
// user.posts.count();
// user.posts.destroy(1);
// 
// ExtMVC.Model.define('Post', {
//   fields:    [],
//   belongsTo: [{
//     name:       'user',
//     className:  'User',
//     foreignKey: 'user_id',
//     
//     extend: {
//       //some functions
//     }
//   }],
//   hasMany: 'Comment'
// });
// 
// post.user.find();
// post.user.loaded();
// post.user.destroy();
// 
// ExtMVC.Model.define('Comment', {
//   fields:    [],
//   belongsTo: "Post"
// });

ExtMVC.Model.plugin.adapter = (function() {
  return {
    initialize: function(model) {
      var adapter = new this.RESTJSONAdapter();
      
      Ext.override(Ext.data.Record, adapter.instanceMethods());
      Ext.apply(model, adapter.classMethods());
      
      //associations are optional so only add them if they are present
      try {
        Ext.override(ExtMVC.Model.plugin.association.HasMany,   adapter.hasManyAssociationMethods());
        Ext.override(ExtMVC.Model.plugin.association.BelongsTo, adapter.belongsToAssociationMethods());
      } catch(e) {};
    }
  };
})();

ExtMVC.Model.addPlugin(ExtMVC.Model.plugin.adapter);

/**
 * @class ExtMVC.Model.plugin.adapter.Abstract
 * Abstract adapter class containing methods that all Adapters should provide
 * All of these methods are expected to be asynchronous except for loaded()
 */

/**
 * @constructor
 * @param {ExtMVC.Model} model The model this adapter represents
*/
ExtMVC.Model.plugin.adapter.Abstract = function(model) {
  /**
   * @property model
   * @type ExtMVC.Model.Base
   * The model this adapter represents (set on initialize)
   */
  // this.model = model;
};

ExtMVC.Model.plugin.adapter.Abstract.prototype = {
  
  /**
   * Abstract save method which should be overridden by an Adapter subclass
   * @param {ExtMVC.Model.Base} instance A model instance to save
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
   * @param {ExtMVC.Model.Base} instance The model instance to destroy
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
            return options.failure.call(options.scope || this, options);
          };
        };
      },
    
      /**
       * Attempts to destroy this instance (asynchronously)
       * @param {Object} options Options to pass to the destroy command (see collectionMethods.create for args)
       */
      destroy: function(options) {
        return this.adapter.doDestroy(this, options);
      },
    
      /**
       * Updates selected fields with new values and saves straight away
       * @param {Object} data The fields to update with new values
       * @param {Object} options Options (see collectionMethods.create for arguments)
       */
      update: function(data, options) {
        this.setValues(data);
        this.save(options);
      },
    
      /**
       * Returns true if this instance has been loaded from backend storage or has only been instantiated
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
        return this.adapter.doDestroy(id, options);
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
      adapter: this,
    
      /**
       * Attempts to create and save a new instance of this model
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
       * @param {Object} data The data to use in creating and saving an instance of this model
       * @return {Object} The new model instance
       */
      build: function(data, options) {
      
      },
    
      /**
       * Finds the given related model on a relationship
       * @param {Number|String} id The unique identifier for this model.
       */
      find: function(id) {
      
      },
    
      /**
       * Returns true if this association has been fully loaded yet
       * @return {Boolean} True if this association has been loaded yet
       */
      loaded: function() {
      
      },
    
      /**
       * Issues a destroy (delete) command to delete the appropriate related object by ID
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
      adapter: this,
      
      /**
       * Finds the given related model on a relationship
       * @param {Number|String} id The unique identifier for this model.
       */
      find: function(id) {
      
      },
    
      /**
       * Returns true if this association has been fully loaded yet
       * @return {Boolean} True if this association has been loaded yet
       */
      loaded: function() {
      
      },
    
      /**
       * Issues a destroy (delete) command to delete the appropriate related object by ID
       * @param {Number|String} id The ID of the associated model to delete
       */
      destroy: function(id) {
      
      }
    };
  }
};

/**
 * Method  Collection Individual
 * create  yes        yes  (but different)
 * build   yes        yes  (might be different)
 * find    yes        no
 * loaded  yes        no
 * count   yes        no
 * destroy yes        yes  (but different)
 */


// ExtMVC.Model.Adapter.Abstract = {
//   initialize: function(model) {
//     
//   },
//   
//   classMethods: {
//     find: function(options) {
//       
//     },
//     
//     findById: function(id, options) {
//       return this.findByField('id', id, options);
//     },
//     
//     findByField: function(fieldName, matcher, options) {
//       
//     },
//     
//     findAll: function(options) {
//       
//     }
//   },
//   
//   instanceMethods: {
//     save:    Ext.emptyFn,
//     
//     reload:  Ext.emptyFn,
//     
//     destroy: Ext.emptyFn
//   }
// };
// 
// /**
//  * Methods adding url data mapping
//  */
// ExtMVC.Model.AbstractAdapter = {
//   /**
//    * Set up the model for use with Active Resource.  Add various url-related properties to the model
//    */
//   initAdapter: function() {
//     Ext.applyIf(this, {
//       urlNamespace: '/admin',
//       urlExtension: '.ext_json',
//       urlName:      ExtMVC.Model.urlizeName(this.modelName)
//     });
//   },
//   
//   /**
//    * Saves this record.  Performs validations first unless you pass false as the single argument
//    */
//   save: function(performValidations) {
//     var performValidations = performValidations || true;
//     
//     console.log("saving model");
//   },
//   
//   destroy: function(config) {
//     var config = config || {};
//     
//     console.log("destroying model");
//   },
//   
//   /**
//    * Loads this record with data from the given ID
//    * @param {Number} id The unique ID of the record to load the record data with
//    * @param {Boolean} asynchronous False to load the record synchronously (defaults to true)
//    */
//   load: function(id, asynchronous) {
//     var asynchronous = asynchronous || true;
//     
//     console.log("loading model");
//   },
//   
//   /**
//    * URL to retrieve a JSON representation of this model from
//    */
//   singleDataUrl : function(record_or_id) {
//     return this.namespacedUrl(String.format("{0}/{1}", this.urlName, this.data.id));
//   },
//   
//   /**
//    * URL to retrieve a JSON representation of the collection of this model from
//    * This would typically return the first page of results (see {@link #collectionStore})
//    */
//   collectionDataUrl : function() {
//     return this.namespacedUrl(this.urlName);
//   },
// 
//   /**
//    * URL to retrieve a tree representation of this model from (in JSON format)
//    * This is used when populating most of the trees in ExtMVC, though
//    * only applies to models which can be representated as trees
//    */
//   treeUrl: function() {
//     return this.namespacedUrl(String.format("{0}/tree", this.urlName));
//   },
//   
//   /**
//    * URL to post details of a drag/drop reorder operation to.  When reordering a tree
//    * for a given model, this url is called immediately after the drag event with the
//    * new configuration
//    * TODO: Provide more info/an example here
//    */
//   treeReorderUrl: function() {
//     return this.namespacedUrl(String.format("{0}/reorder/{1}", this.urlName, this.data.id));
//   },
//   
//   /**
//    * Provides a namespaced url for a generic url segment.  Wraps the segment in this.urlNamespace and this.urlExtension
//    * @param {String} url The url to wrap
//    * @returns {String} The namespaced URL
//    */
//   namespacedUrl: function(url) {
//     return(String.format("{0}/{1}{2}", this.urlNamespace, url, this.urlExtension));
//   }
// };
// 
// // ExtMVC.Model.registerAdapter('REST', ExtMVC.Model.AbstractAdapter);

/**
 * @class ExtMVC.Model.plugin.adapter.RESTAdapter
 * @extends ExtMVC.Model.plugin.adapter.Abstract
 * An adapter which hooks into a RESTful server side API for its data storage
 */
ExtMVC.Model.plugin.adapter.RESTAdapter = Ext.extend(ExtMVC.Model.plugin.adapter.Abstract, {
  
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
    
    Ext.Ajax.request(
      Ext.applyIf(options, {
        url:    this.instanceUrl(instance),
        method: instance.newRecord() ? this.createMethod : this.updateMethod,
        params: this.buildPostData(instance)
      })
    );
  },
  
  /**
   * Performs the actual find request.
   * @param {Object} conditions An object containing find conditions. If a primaryKey is set this will be used
   * to build the url for that particular instance, otherwise the collection url will be used
   * @param {Object} options Callbacks (use callback, success and failure)
   */
  doFind: function(conditions, options, constructor) {
    conditions = conditions || {}; options = options || {};
      
    //if primary key is given, perform a single search
    var single = (conditions.primaryKey !== undefined),
        url    = this.findUrl(conditions, constructor);
    
    Ext.applyIf(options, {
      conditions: conditions,
      scope     : this
    });
    
    var findMethod = single ? this.doSingleFind : this.doCollectionFind;
    return findMethod.call(this, url, options, constructor);
  },
  
  /**
   * Performs an HTTP DELETE request using Ext.Ajax.request
   * @param {ExtMVC.Model.Base} instance The model instance to destroy
   * @param {Object} options Options object passed to Ext.Ajax.request
   * @return {Number} The Ajax transaction ID
   */
  doDestroy: function(instance, options) {
    if (typeof instance == 'undefined') throw new Error('No instance provided to REST Adapter destroy');
    
    return Ext.Ajax.request(
      Ext.applyIf(options || {}, {
        method: this.destroyMethod,
        url:    this.instanceUrl(instance)
      })
    );
  },
  
  /**
   * Loads a single instance of a model via an Ext.Ajax.request
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
   * Specialised find for dealing with collections. Returns an Ext.data.Store
   * @param {String} url The url to load the collection from
   * @param {Object} options Options passed to the Store constructor
   * @param {Function} constructor The constructor function used to instantiate the model instance
   * @return {Ext.data.Store} A Store with the appropriate configuration to load this collection
   */
  doCollectionFind: function(url, options, constructor) {
    return new Ext.data.Store(
      Ext.applyIf(options, {
        autoLoad  : true,
        remoteSort: false,
        reader    : constructor.prototype.getReader(),
        proxy     : new this.proxyType(this.buildProxyConfig(url))

        // reader:     this.getReader()
      })
    );
  },
  
  /**
   * Calculates the unique REST URL for a given model instance
   * @param {ExtMVC.Model.Base} instance The model instance
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
   * @param {ExtMVC.Model.Base} instance The models instance to build post data for
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


// Ext.ns('ExtMVC.Model.Adapter');
// 
// (function() {
//   var A = ExtMVC.Model.Adapter;
//   
//   A.REST = {
//     initialize: function(model) {
//       // console.log('initialising REST adapter');
//       
//       A.Abstract.initialize(model);
//     },
//     
//     classMethods: {
//       /**
//        * Generic find method, accepts many forms:
//        * find(10, opts)      // equivalent to findById(10, opts)
//        * find('all', opts)   // equivalent to findAll(opts)
//        * find('first', opts) // equivalent to findById(1, opts)
//        */
//       find: function(what, options) {
//         var id;
//         if (id = parseInt(what, 10)) {
//           return this.findById(id, options);
//         };
//         
//         switch(what) {
//           case 'first': return this.findById(1, options);
//           default     : return this.findAll(options);
//         }
//       },
//       
//       /**
//        * Shortcut for findByField('id', 1, {})
//        */
//       findById: function(id, options) {
//         // return this.findByField('id', id, options);
//         var options = options || {};
//         
//         // TODO
//         // Old code before below fix
//         // Ext.applyIf(options, {
//         //   url: this.singleDataUrl(id)
//         // });
//         
//         // This needs to be done as url is set as 'null' in
//         // crudcontroller.js line 133.
//         // this is temp n00b hack which teh master can fix. can't use apply either.
//         if (options.url == null) {
//           options.url = this.singleDataUrl(id);
//         };
//         
//         return this.performFindRequest(options);
//       },
//           
//       /**
//        * Performs a custom find on a given field and value pair.  e.g.:
//        * User.findByField('email', 'adama@bsg.net') creates the following request:
//        * GET /users?email=adama@bsg.net
//        * And creates an array of User objects based on the server's response
//        * @param {String} fieldName The name of the field to search on
//        * @param {String/Number} matcher The field value to search for
//        * @param {Object} options An object which should contain at least a success function, which will
//        * be passed an array of instantiated model objects
//        */
//       findByField: function(fieldName, matcher, options) {
//         var fieldName = fieldName || 'id';
//         var options   = options || {};
//         
//         options.conditions = options.conditions || [];
//         options.conditions.push({key: fieldName, value: matcher, comparator: '='});
//                 
//         return this.performFindRequest(options);
//       },
//       
//       findAll: function(options) {
//         var options = options || {};
//         
//         var url = options.url ? this.namespacedUrl(options.url) : this.collectionDataUrl();
//         
//         var proxyOpts = {};
//         Ext.apply(proxyOpts, this.proxyConfig, {
//           url:    url,
//           method: "GET"
//         });
//         
//         return new Ext.data.Store(
//           Ext.applyIf(options, {
//             autoLoad:   true,
//             remoteSort: false,
//             proxy:      new this.proxyType(proxyOpts),
//             reader:     this.getReader()
//           })
//         );
//       },
//       
//       /**
//        * Private, internal methods below here.  Not expected to be useful by anything else but
//        * are left public for now just in case
//        */
//        
//       /**
//        * Underlying function which handles all find requests.  Private
//        */
//       performFindRequest: function(options) {
//         var options = options || {};
//         Ext.applyIf(options, {
//           scope:   this,
//           url:     this.collectionDataUrl(),
//           method:  'GET',
//           success: Ext.emptyFn,
//           failure: Ext.emptyFn
//         });
//         
//         //keep a handle on user-defined callbacks
//         var callbacks = {
//           successFn: options.success,
//           failureFn: options.failure
//         };
//         
//         // FIXME fix scope issue
//         // For some reason the scope isnt correct on this?
//         // cant figure out why. scope is set on the applyIf block so it should work..
//         var scope = this;
//         
//         options.success = function(response, opts) {
//           scope.parseSingleLoadResponse(response, opts, callbacks);
//         };
//         
//         /**
//          * Build params variable from condition options.  Params should always be a string here
//          * as we're dealing in GET requests only for a find
//          */
//         var params = options.params || '';
//         if (options.conditions && options.conditions[0]) {
//           for (var i=0; i < options.conditions.length; i++) {
//             var cond = options.conditions[i];
//             params += String.format("{0}{1}{2}", cond['key'], (cond['comparator'] || '='), cond['value']);
//           };
//           
//           delete options.conditions;
//         };
//         options.params = params;
// 
//         return Ext.Ajax.request(options);
//       },
//       
//       /**
//        * @property urlExtension
//        * @type String
//        * Extension appended to the end of all generated urls (e.g. '.js').  Defaults to blank
//        */
//       urlExtension: '',
// 
//       /**
//        * @property urlNamespace
//        * @type String
//        * Default url namespace prepended to all generated urls (e.g. '/admin').  Defaults to blank
//        */
//       urlNamespace: '',
//       
//       /**
//        * @property port
//        * @type Number
//        * The web server port to contact (defaults to 80).  Requires host to be set also
//        */
//       port: 80,
//       
//       /**
//        * @property host
//        * @type String
//        * The hostname of the server to contact (defaults to an empty string)
//        */
//       host: "",
//       
//       /**
//        * @property proxyType
//        * @type Function
//        * A reference to the DataProxy implementation to use for this model (Defaults to Ext.data.HttpProxy)
//        */
//       proxyType: Ext.data.HttpProxy,
//       
//       /**
//        * @property proxyConfig
//        * @type Object
//        * Config to pass to the DataProxy when it is created (e.g. use this to set callbackParam on ScriptTagProxy, or similar)
//        */
//       proxyConfig: {},
//       
//       /**
//        * Called as the 'success' method to any single find operation (e.g. findById).
//        * The default implementation will parse the response into a model instance and then fire your own success of failure
//        * functions as provided to findById.  You can override this if you need to do anything different here, for example
//        * if you are loading via a script tag proxy with a callback containing the response
//        * @param {String} response The raw text of the response
//        * @param {Object} options The options that were passed to the Ext.Ajax.request
//        * @param {Object} callbacks An object containing a success function and a failure function, which should be called as appropriate
//        */
//       parseSingleLoadResponse: function(response, options, callbacks) {
//         var m = this.getReader().read(response);
//         if (m && m.records[0]) {
//           m.records[0].newRecord = false;
//           callbacks.successFn.call(options.scope, m.records[0]);
//         } else {
//           callbacks.failureFn.call(options.scope, response);
//         };
//       },
//       
//       /**
//        * URL to retrieve a JSON representation of this model from
//        */
//       singleDataUrl : function(id) {
//         return this.namespacedUrl(String.format("{0}/{1}", this.urlName, id));
//       },
//   
//       /**
//        * URL to retrieve a JSON representation of the collection of this model from
//        * This would typically return the first page of results (see {@link #collectionStore})
//        */
//       collectionDataUrl : function() {
//         return this.namespacedUrl(this.urlName);
//       },
//   
//       /**
//        * URL to retrieve a tree representation of this model from (in JSON format)
//        * This is used when populating most of the trees in ExtMVC, though
//        * only applies to models which can be representated as trees
//        */
//       treeUrl: function() {
//         return this.namespacedUrl(String.format("{0}/tree", this.urlName));
//       },
//   
//       /**
//        * URL to post details of a drag/drop reorder operation to.  When reordering a tree
//        * for a given model, this url is called immediately after the drag event with the
//        * new configuration
//        * TODO: Provide more info/an example here
//        */
//       treeReorderUrl: function() {
//         return this.namespacedUrl(String.format("{0}/reorder/{1}", this.urlName, this.data.id));
//       },
//   
//       /**
//        * Provides a namespaced url for a generic url segment.  Wraps the segment in this.urlNamespace and this.urlExtension
//        * @param {String} url The url to wrap
//        * @returns {String} The namespaced URL
//        */
//       namespacedUrl: function(url) {
//         url = url.replace(/^\//, ""); //remove any leading slashes
//         return(String.format("{0}{1}/{2}{3}", this.hostName(), this.urlNamespace, url, this.urlExtension));
//       },
//       
//       /**
//        * Builds the hostname if host and optionally port are set
//        * @return {String} The host name including port, if different from port 80
//        */
//       hostName: function() {
//         var p = this.port == 80 ? '' : this.port.toString();
//         
//         if (this.host == "") {
//           return "";
//         } else {
//           return this.port == 80 ? this.host : String.format("{0}:{1}", this.host, this.port);
//         };
//       }
//     },
//     
//     instanceMethods: {
//       /**
//        * Saves this model instance to the server.
//        * @param {Object} options An object passed through to Ext.Ajax.request.  The success option is a special case,
//        * and is called with the newly instantiated model instead of the usual (response, options) signature
//        */
//       save: function(options) {
//         var options = options || {};
//         
//         if (options.performValidations === true) {
//           //TODO: tie in validations here
//         };
//         
//         //keep a reference to this record for use in the success and failure functions below
//         var record = this;
//         
//         //set a _method param to fake a PUT request (used by Rails)
//         var params = options.params || this.namespaceFields();
//         if (!this.newRecord) { params["_method"] = 'put'; }
//         delete options.params;
//         
//         //if the user passes success and/or failure functions, keep a reference to them to allow us to do some pre-processing
//         var userSuccessFunction = options.success || Ext.emptyFn;
//         var userFailureFunction = options.failure || Ext.emptyFn;
//         delete options.success; delete options.failure;
//         
//         //function to call if Ext.Ajax.request is successful
//         options.success = function(response) {
//           //definitely not a new record any more
//           record.newRecord = false;
//           
//           userSuccessFunction.call(options.scope || record, record, response);
//         };
//         
//         //function to call if Ext.Ajax.request fails
//         options.failure = function(response) {
//           //parse any errors sent back from the server
//           record.readErrors(response.responseText);
//           
//           userFailureFunction.call(options.scope || record, record, response);
//         };
//         
//         //do this here as the scope in the block below is not always going to be 'this'
//         var url = this.url();
//         
//         Ext.applyIf(options, {
//           // url:     url, url == null sometimes so this doesnt work
//           method:  'POST',
//           params:  params
//         });
//         
//         //fix for the above
//         if (options.url == null) {
//           options.url = url;
//         };
//         
//         Ext.Ajax.request(options);
//       },
//       
//       /**
//        * Updates the model instance and saves it.  Use setValues({... new attrs ...}) to change attributes without saving
//        * @param {Object} updatedAttributes An object with any updated attributes to apply to this instance
//        * @param {Object} saveOptions An object with save options, such as url, callback, success, failure etc.  Passed straight through to save()
//        */
//       update: function(updatedAttributes, saveOptions) {
//         updatedAttributes = updatedAttributes || {};
//         saveOptions = saveOptions || {};
//         
//         this.setValues(updatedAttributes);
//         this.save(saveOptions);
//       },
//       
//       reload: function() {
//         console.log('reloading');
//       },
//       
//       destroy: function(options) {
//         var options = options || {};
//         
//         Ext.Ajax.request(
//           Ext.applyIf(options, {
//             url:    this.url(),
//             method: 'post',
//             params: "_method=delete"
//           })
//         );
//       },
//       
//       /**
//        * Namespaces fields within the modelName string, taking into account mappings.  For example, a model like:
//        * 
//        * modelName: 'user',
//        * fields: [
//        *   {name: 'first_name', type: 'string'},
//        *   {name: 'last_name',  type: 'string', mapping: 'last'}
//        * ]
//        * 
//        * Will be decoded to an object like:
//        * 
//        * {
//        *   'user[first_name]': //whatever is in this.data.first_name
//        *   'user[last]':       //whatever is in this.data.last_name
//        * }
//        *
//        * Note especially that the mapping is used in the key where present.  This is to ensure that mappings work both
//        * ways, so in the example above the server is sending a key called last, which we convert into last_name.  When we
//        * send data back to the server, we convert last_name back to last.
//        */
//       namespaceFields: function() {
//         var fields    = this.fields;
//         var namespace = this.modelName;
//         
//         var nsfields = {};
//         
//         for (var i=0; i < fields.length; i++) {
//           var item = fields.items[i];
//           
//           //don't send virtual fields back to the server
//           if (item.virtual) {continue;}
//           
//           nsfields[String.format("{0}[{1}]", namespace.toLowerCase(), item.mapping || item.name)] = this.data[item.name];
//         };
//         
//         //not sure why we ever needed this... 
//         // for (f in fields) {
//         //   nsfields[String.format("{0}[{1}]", namespace.toLowerCase(), this.data[f.name])] = fields.items[f];
//         // }
//         
//         return nsfields;
//       }
//     }
//   };
// })();
// 
// ExtMVC.Model.AdapterManager.register('REST', ExtMVC.Model.Adapter.REST);

/**
 * @class ExtMVC.Model.plugin.adapter.RESTJSONAdapter
 * @extends ExtMVC.Model.plugin.adapter.RESTAdapter
 * An adapter which hooks into a RESTful server side API that expects JSON for its data storage
 */
ExtMVC.Model.plugin.adapter.RESTJSONAdapter = Ext.extend(ExtMVC.Model.plugin.adapter.RESTAdapter, {

  /**
   * Performs the actual save request.  Uses POST for new records, PUT when updating existing ones
   * puts the data into jsonData for the request
   */
  doSave: function(instance, options) {
    if (typeof instance == 'undefined') throw new Error('No instance provided to REST Adapter save');
    
    Ext.Ajax.request(
      Ext.applyIf(options || {}, {
        url:      this.instanceUrl(instance),
        method:   instance.newRecord() ? this.createMethod : this.updateMethod,
        jsonData: instance.data,
        headers:  {
          "Content-Type": "application/json"
        }
      })
    );
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
    var defaults = ExtMVC.Model.plugin.adapter.RESTJSONAdapter.superclass.buildProxyConfig.apply(this, arguments);
    
    return Ext.apply(defaults, {
      headers: {
        "Content-Type": "application/json"
      }      
    });
  }
});

/**
 * The Validation classes themselves are defined here.
 * Subclass ExtMVC.Model.validation.AbstractValidation to create your own validations
 */

Ext.ns('ExtMVC.Model.validation');

(function() {
  //local reference to save my fingers, object lookups (maybe?) and # bytes
  var V = ExtMVC.Model.validation;
  
  /**
   * @class ExtMVC.Model.validation.AbstractValidation
   * Base class for all validations - don't use this directly but use a subclass
   */
  V.AbstractValidation = function(ownerClass, field, config) {
    this.ownerClass = ownerClass;
    this.field = field;
    
    Ext.apply(this, config);
  };

  V.AbstractValidation.prototype = {
    /**
     * Returns the current value of the field to which this validation applies
     * @param {ExtMVC.Model.Base} instance The model instance to get the value from
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
   * @class ExtMVC.model.validation.ValidatesPresenceOf
   * @extends ExtMVC.model.validation.AbstractValidation
   * Ensures that a field is present
   */
  V.ValidatesPresenceOf = Ext.extend(V.AbstractValidation, {
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
   * @class V.ValidatesLengthOf
   * @extends V.AbstractValidation
   * Returns true if the field is within the length bounds imposed.
   */
  V.ValidatesLengthOf = Ext.extend(V.AbstractValidation, {
    
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
   * @class V.ValidatesNumericalityOf
   * @extends V.AbstractValidation
   * Ensures that the field is a number
   */
  V.ValidatesNumericalityOf = Ext.extend(V.AbstractValidation, {
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
   * @class V.ValidatesInclusionOf
   * @extends V.AbstractValidation
   * Ensures that the field is one of the allowed values
   */
  V.ValidatesInclusionOf = Ext.extend(V.AbstractValidation, {
  
 
    /**
     * Override Abstract constructor to build the validation message
     */
    constructor: function(m, f, config) {
      //set up defaults
      config = config || {};
      Ext.applyIf(config, { allowed: [] });
      
      V.ValidatesInclusionOf.superclass.constructor.call(this, m, f, config);
      
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
   * @class V.ValidatesExclusionOf
   * @extends V.AbstractValidation
   * Ensures that the field is not one of the allowed values
   */
  V.ValidatesExclusionOf = Ext.extend(V.AbstractValidation, {
  
    /**
     * Override Abstract constructor to build the validation message
     */
    constructor: function(m, f, config) {
      //set up defaults
      config = config || {};
      Ext.applyIf(config, { disallowed: [] });
      
      V.ValidatesExclusionOf.superclass.constructor.call(this, m, f, config);
      
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
   * @class V.ValidatesFormatOf
   * @extends V.AbstractValidation
   * Ensures that the field matches the given regular expression
   */
  V.ValidatesFormatOf = Ext.extend(V.AbstractValidation, {
    
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
})();

/**
 * @class ExtMVC.Model.validation.Errors
 * Simple class to collect validation errors on a model and return them in various formats
 */
ExtMVC.Model.validation.Errors = function() {
  /**
   * @property errors
   * @type Object
   * Object containing all errors attached to this model.  This is READ ONLY - do not interact with directly
   */
  this.all = {};
};

ExtMVC.Model.validation.Errors.prototype = {
  
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
   * forField('title'); // ['must be present', 'is too short']
   * forField('title', true); // 'must be present and is too short'
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

Ext.ns('ExtMVC.Model.validation');

/**
 * This is the Validation plugin definition, which mixes in validation.Errors
 * and some other functions into a model prototype
 */
(function() {
  var V = ExtMVC.Model.validation;
  
  /**
   * Overrides Ext.data.Record's isValid() function.
   * We apply this to Record's prototype as there is no need to define it per model or instance
   */
  Ext.apply(Ext.data.Record.prototype, {
    isValid: function() {
      if (this.validations) {
        if (!this.errors) this.errors = new ExtMVC.Model.validations.Errors();
        
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

      this.errors = new ExtMVC.Model.validation.Errors();
    };

    for (var method in oldFunctionMethods) {
      Ext.data.Record[method] = oldFunctionMethods[method];
    }
  })();
  /**
   * Again, I'm really sorry :(
   */
  
  /**
   * @class ExtMVC.Model.validation.Plugin
   */
  V.Plugin = {
    /**
     * Initializes this plugin for a given model.  This is called every time a model is *created*
     * via ExtMVC.Model.create, not when a model object is *instantiated*
     * @param {ExtMVC.Model} model The model to initialize the plugin for
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
      
      for (var validation in ExtMVC.Model.validation) {
        if (/^validate/.test(validation.toLowerCase())) {
          
          //for each validation type defined on ExtMVC.Model.validation, check to see if we are using
          //it in on our model
          for (var modelKey in this.model.prototype) {
            if (modelKey.toLowerCase() == validation.toLowerCase()) {
              //this validation is being used by the model, so add it now
              var validationConstructor = ExtMVC.Model.validation[validation],
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
     * @return {ExtMVC.Model.validation.AbstractValidation} The validation instance
     */
    buildValidation: function(validation, options) {
      var field, config = {};
      
      if ('string' == typeof options) {
        field = options;
      } else {
        field = options.field;
        delete options.field;
        config = options;
      }
      
      return new validation(this.model, field, config);
    }
  };
  
  ExtMVC.Model.addPlugin(V.Plugin);
})();

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
      ]
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
    return [
      {
        text:    'Save',
        scope:   this,
        iconCls: 'save',
        handler: this.onSave
      },
      {
        text:    'Cancel',
        scope:   this,
        iconCls: 'cancel',
        handler: this.onCancel
      }
    ];
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
    this.fireEvent('save', this.getForm().getValues());
  },
  
  /**
   * Called when the cancel button is clicked or ESC pressed. Fires the 'cancel' event.  If this is
   * an edit form the cancel event will be called with a single argument - the current instance
   */
  onCancel: function() {
    this.fireEvent('cancel', this.instance);
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
    config.columns = config.columns || this.buildColumns(this.model);
    config.store   = config.store   || this.model.find();
    
    var tbarConfig = this.hasTopToolbar    ? this.buildTopToolbar()                : null;
    var bbar       = this.hasBottomToolbar ? this.buildBottomToolbar(config.store) : null;

    Ext.applyIf(config, {
      title:      this.getTitle(),
      viewConfig: { forceFit: true },
      id:         String.format("{0}_index", this.model.prototype.tableName),

      loadMask: true,

      tbar: tbarConfig,
      bbar: bbar,
      
      keys: [
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

    ExtMVC.view.scaffold.Index.superclass.constructor.call(this, config);
    
    this.initEvents();
    this.initListeners();
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
       * @event add
       * Fired when the user wishes to add a new record
       */
      'add',
      
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
    
    if (this.controller) {
      // this.controller.un('delete', this.refreshStore, this);
      this.controller.on('delete', this.refreshStore, this);
    }
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
   * this will return "Showing Users". Override to set your own grid title
   * @return {String} The title to give the grid
   */
  getTitle: function() {
    return String.format("Showing {0}", this.model.prototype.pluralHumanName);
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
      id:        cfg.name,
      header:    cfg.name.replace(/_/g, " ").titleize(),
      sortable:  true,
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
         this.deleteButton.enable();  this.editButton.enable();
      } else {
        this.deleteButton.disable(); this.editButton.disable();
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
    this.fireEvent('add');
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
    this.fireEvent('save', this.instance, this.getForm().getValues());
  }
});

Ext.reg('scaffold_edit', ExtMVC.view.scaffold.Edit);

/**
 * @class ExtMVC.view.HasManyEditorGridPanel
 * @extends Ext.grid.EditorGridPanel
 * Provides some sensible defaults for a HasMany editor grid.  For example, given the following models:
 * ExtMVC.Model.define("MyApp.models.User", {
 *   ...
 *   hasMany: "Post"
 * });
 *
 * ExtMVC.Model.define("MyApp.models.Post", {
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

