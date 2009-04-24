/**
 * Initialise package and set version
 */
ExtMVC = Ext.extend(Ext.util.Observable, {
  version: "0.5b1",
  
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

Ext.ns('ExtMVC.Model', 'ExtMVC.plugin', 'ExtMVC.view', 'ExtMVC.view.scaffold');

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
  return this.toLowerCase().replace(/ /g, "_");
};

String.prototype.singularize = function() {
  return ExtMVC.Inflector.singularize(this);
};

String.prototype.pluralize = function() {
  return ExtMVC.Inflector.pluralize(this);
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
 * ExtMVC.Controller
 * @extends Ext.util.Observable
 * Controller base class
 */
ExtMVC.Controller = function(config) {
  var config = config || {};
  Ext.applyIf(config, {
    autoRegisterViews: true
  });
  
  ExtMVC.Controller.superclass.constructor.call(this, config);
  
  /**
   * @property os
   * @type ExtMVC.OS
   * Maintains a reference to the current OS
   */
  //we need to wrap this in try/catch because OS also inherits from Controller, so can't call getOS()
  //get.  Hmm
  try {
    this.os = ExtMVC.OS.getOS();
  } catch(e) {};
  
  /**
   * @property views
   * @type Object
   * Hash of all views registered for use with this Controller.
   * Read only, use @link {getViewClass} for access
   */
  this.views = {};
  
  /**
   * @property runningViews
   * @type Object
   * Hash of all views which are currently rendered and referenced.  Indexed by the view's ID
   * Read only!  Use renderView and destroyView to add or remove.
   */
  this.runningViews = {};
  
  /**
   * @property actions
   * @type Object
   * Maintains a reference to each registered action. Read only.
   */
  this.actions = {};
  
  this.addEvents(
    /**
     * @event init
     * Fires when this controller is created.
     * @param {ExtMVC.Controller} this The controller instance
     */
    'init',
    
    /**
     * @event beforedefaultaction
     * Fires is this.fireAction('someAction') is called, but 'someAction' has not been defined
     * with this.registerAction().  Default behaviour in this case is to attempt to find a view
     * of the same name and display it.  If you want to provide your own behaviour here, just
     * return false to this event
     * @param {string} actionName The name of the action being fired
     * @param {Object} scope The scope the action is being fired within
     * @param {Array} args An array of arguments passed to the action
     */
    'beforedefaultaction'
  );
  
  /**
   * Automatically register all views in the config.viewsPackage
   */
  if (config.autoRegisterViews && config.viewsPackage) {
    for (var v in config.viewsPackage) {
      this.registerView(v.toLowerCase(), config.viewsPackage[v]);
    }
  };
  
  this.fireEvent('init', this);
};

Ext.extend(ExtMVC.Controller, Ext.util.Observable, {
  
  /**
   * Attaches a view class to this controller - allows the controller to create the view
   * @param {String} viewName The name of this view (e.g. 'index')
   * @param {Function} viewClass A reference to the view class to be instantiated (e.g. MyApp.view.Index, which is some subclass of Ext.Panel)
   */
  registerView: function(viewName, viewClass) {
    this.views[viewName] = viewClass;
  },
  
  /**
   * Convenience method to batch register views with this Controller
   * @param {Object} An object of viewName: viewClass options.  e.g. {'index': MyApp.view.Index}
   * would be the same as this.registerView('index', MyApp.view.Index)
   */
  registerViews: function(viewObject) {
    for (var v in viewObject) {
      this.registerView(v, viewObject[v]);
    }
  },
  
  /**
   * Returns the view class registered for the given view name, or null
   * @param {String} viewName The name registered for this view with this controller
   * @return {Function/null} The view class (or null if not present)
   */
  getViewClass: function(viewName) {
    return this.views[viewName];
  },
  
  /**
   * @property renderMethod
   * @type String
   * Can be either renderNow or return.  renderNow attempts to actually render the view, whereas return just returns it
   */
  renderMethod: 'renderNow',
  
  /**
   * @property addTo
   * @type Ext.Container
   * The container to add views to using the 'add' renderMethod.  Usually set to an Ext.TabPanel instance or similar
   */
  addTo: null,
  
  /**
   * @property model
   * @type Function/Null
   * Defaults to null.  If set to a reference to an ExtMVC.Model subclass, renderView will attempt to dynamically
   * scaffold any missing views, if the corresponding view is defined in the ExtMVC.view.scaffold package
   */
  model: null,
  
  /**
   * Returns a reference to the Scaffold view class for a given viewName
   * @param {String} viewName The name of the view to return a class for (index, new, edit or show)
   * @return {Function} A reference to the view class to instantiate to render this scaffold view
   */
  scaffoldViewName: function(viewName) {
    return ExtMVC.view.scaffold[viewName.titleize()];
  },
  
  /**
   * Creates the requested view and registers it with this.runningViews.
   * Each view should have a unique ID, or the view is not rendered and an error is raised
   * @param {String} viewName The registered name of the view to create and render
   * @param {Object} viewConfig Generic config object passed to the view's constructor
   * @param {Object} renderConfig Render configuration options
   * @return {Object} A reference to the newly created view
   * @throws Error when a view for the given viewName has not been registered, or if the view's ID has already been taken
   */
  renderView: function(viewName, viewConfig, renderConfig) {
    var renderConfig = renderConfig || {};
    var viewConfig   = viewConfig   || {};
    
    //by default we render straight away, to the Body element
    Ext.applyIf(renderConfig, {
      renderTo:   Ext.getBody(),
      renderNow:  true,
      renderOnce: true
    });
    
    var v;
    
    //if a view class has been registered
    if (typeof((this.getViewClass(viewName))) == 'function') {
      v = new (this.getViewClass(viewName))(viewConfig);
      
    //view has not been registered, attempt to create one
    } else if (this.model) {
      try {
        v = new (this.scaffoldViewName(viewName))(this.model);
      } catch(e) {};
    }
    
    if (!v || typeof(v) == 'undefined') {return;}
    
    var running = this.getRunningView(v.id);
    if (running) {
      if (renderConfig.renderOnce) {
        v.destroy();
        return running;
      } else {
        //view ID has already been taken, throw an error
        throw new Error('The view ID ' + v.id + ' has already been taken.  Each view instance must have a unique ID');        
      };
    } else {
      return this.launchView(v);
    };

  },
  
  /**
   * Launches a view instance by either rendering it to the renderTo element or adding it to this.addTo
   * @param {Ext.Component} v Any Component which can be added to a container or rendered to an element
   * @param {Object} renderConfig A config object with instructions on how to render this view.  Relevant options are:
   *                              renderNow: true to render the view right away (defaults to true)
   *                              renderTo: The element to render this view to (unless using the addTo method)
   */
  launchView: function(v, renderConfig) {
    var renderConfig = renderConfig || {};
    Ext.applyIf(renderConfig, {
      renderNow: true,
      renderTo:  Ext.getBody()
    });
    
    v.on('close',   function()     {this.destroyView(v.id); },            this);
    v.on('destroy', function(view) {delete this.runningViews[view.id]; }, this);
    this.runningViews[v.id] = v;
    
    if (this.renderMethod == 'renderNow' && renderConfig.renderNow) {
      v.render(renderConfig.renderTo, renderConfig.renderPosition);
      return v;
    } else {
      if (this.addTo && renderConfig.renderNow) {
        this.addTo.add(v).show();
        this.addTo.doLayout();
        return v;
      };
      
      // XXX
      // TODO there needs to be some kind of exception here if nothing happens
      return v;
    };
  },
  
  /**
   * Returns an instance of a running view with the given ID
   * @param {String} viewId The unique ID of a view instantiation
   * @return {Object} The view instance, or null if no match
   */
  getRunningView: function(viewId) {
    return this.runningViews[viewId];
  },
  
  /**
   * Returns an array of all running view instances whose IDs match the given regex
   * @param {Object} regex The regular expression to compare unique view instance IDs to
   * @return {Array} An array of matching view instances
   */
  getRunningViews: function(regex) {
    //make sure we have a regex object
    if (!regex.test) { return []; }
    
    var matches = [];
    for (var v in this.runningViews) {
      if (regex.test(v)) {
        matches.push(this.runningViews[v]);
      };
    }
    
    return matches;
  },
  
  /**
   * Destroys the currently running view as referenced by the argument.
   * The argument must be an <em>ID</em> of a running view, not the registered viewName.
   * Check that a running view for a given ID exists using this.getRunningView.
   * @param {String} viewId The ID of the running view to destroy
   */
  destroyView: function(viewId) {
    var view = this.getRunningView(viewId);
    if (view) {
      view.destroy();
      delete this.runningViews[viewId];
    };
  },
  
  /**
   * Destroys all views with IDs matching the given regex
   * @param {Object} regex The Regular Expression to match IDs against
   */
  destroyViews: function(regex) {
    //make sure we have a regex object
    if (!regex.test) { return []; }
    
    for (var v in this.runningViews) {
      if (regex.test(v)) {
        this.destroyView(v);
      };
    }
  },
  
  /**
   * Registers a function as an Action for this Controller.  Actions registered here
   * can take part in this.fireAction, and are automatically given before and after events.
   * For example registerAction('index', function() { ... }) registeres before_index and after_index
   * events, which are called before and after the action has been fired.  Return false to the before_
   * event in order to stop the action being called.
   * @param {String} actionName The string name to associate with this action function
   * @param {Function} actionFunction The action function to be called with this.fireAction(actionName)
   * @param {Object} options Gives ability to optionally bypass creation of before_ and after_ events
   * (e.g. {before_filter: false, after_filter: true}).  Both default to true
   * Also takes an overwrite option which will stop this action overwriting a previous action defined with
   * this action name (defaults to true)
   */
  registerAction: function(actionName, actionFunction, options) {
    var options = options || {};
    Ext.applyIf(options, { before_filter: true, after_filter: true, overwrite: true});
    
    //create the before and after filters
    if (options.before_filter) { this.addEvents('before_' + actionName); }
    if (options.after_filter)  { this.addEvents('after_'  + actionName); }
    
    //don't overwrite the existing action if told not to
    if (!this.getAction(actionName) || options.overwrite == true) {
      this.actions[actionName] = actionFunction;
    };
  },
  
  /**
   * Returns a reference to the function of the requested action name.  Does not execute the action
   * @param {String} actionName The string name of the action to find
   * @return {Function} A reference to the function, or null if not found
   */
  getAction: function(actionName) {
    return this.actions[actionName];
  },
  
  /**
   * Fires the requested action with any arguments passed to it.  If before and after filters have been
   * added to this action, they are fired before and after the action is executed (see {@link registerAction}).
   * If the specified action has not been registered, this will try to display the registered view with the same name,
   * if one has been defined.
   * @param {String} actionName The name of the action to call.  Nothing will happen if an invalid action name is specified
   * @param {Object} scope The scope in which to execute the action (defaults to the controller's scope).  Set this to null 
   * keep scope as the controller's scope if you need to pass additional params to the action
   * @param {Array} args An array of arguments to execute the action with (optional)
   */
  fireAction: function(actionName, scope, args) {
    var scope = scope || this;
    var args  = args  || [];
    
    var a = this.getAction(actionName);
    if (a) {
      if (this.fireEvent('before_' + actionName)) {
        a.apply(scope, args);
        
        this.fireEvent('after_' + actionName);
      };
    } else {
      if (this.fireEvent('beforedefaultaction', actionName, scope, args)) {
        var v;
        if (v = this.renderView(actionName, args[0])) {
          v.show();
        }
      };
    };
  },
  
  /**
   * Attaches an action to an event on any Ext.util.Observable object. Mainly a convenience method
   * in place of firingObject.on(eventName, actionName, actionScope)
   * @param {Object} firingObject The object to listen to for fired events
   * @param {String} eventName The name of the event to handle
   * @param {String} actionName The name of the action to dispatch to (this will be called with the arguments attached to the event)
   * @param {Object} actionScope The scope to execute the action within (defaults to this controller)
   */
  handleEvent: function(firingObject, eventName, actionName, actionScope) {
    var actionScope = actionScope || this;
    
    firingObject.on(eventName, function() {
      this.fireAction(actionName, actionScope, arguments);
    }, this);
  }
});

Ext.reg('controller', ExtMVC.Controller); 

/**
 * This started life as a plugin, moving it here for now as it might be useful on every project (hence oddish definition)
 */


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
   * destroy(id, store) - takes an ID, deletes it and optionally refreshes a store
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
     * @action destroy 
     * Deletes a given model instance
     */
    this.registerAction('destroy', function(id, store) {
      var id = id || this.os.params.id;
      if (id) {
        var u = new this.model({id: id});
        u.destroy({
          scope:   this,
          success: this.onDestroySuccess.createDelegate(this, [store]),
          failure: this.onDestroyFailure
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
     * Called after an item has been successfully destroyed (deleted).  By default this reloads the grid's store
     * @param {Ext.data.Store} store The Ext.data.Store to reload after deletion
     */
    onDestroySuccess: function(store) {
      if (store) store.reload();
    },
    
    /**
     * Called after an destroy attempt was made on a model instance, but the attempt failed.  By default this shows
     * a MessageBox alert informing the user
     */
    onDestroyFailure: function(paramName) {
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
      var createNow = true;
      
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
      Ext.apply(model.prototype, extensions, ExtMVC.Model.Base);
      
      //if we're extending another model, class and instance methods now
      if (typeof superclassModel != 'undefined') {
        Ext.applyIf(classMethods, superclassModel);
        Ext.applyIf(model.prototype, superclassModel.prototype);
      };

      //add any class methods to the class level
      for (methodName in classMethods) {
        if (methodName != 'prototype') model[methodName] = classMethods[methodName];
      };

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
    }
  };
}();


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
 * A set of properties and functions which are applied to all ExtMVC.Models when they are defined
 */
ExtMVC.Model.Base = {
  
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
    return typeof(this.data[this.primaryKey]) == 'undefined';
  }
};

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
  
  /**
   * Sets up the FormPanel, adds default configuration and items
   */
  constructor: function(model, config) {
    var config = config || {};
    
    this.model = model;
    this.os    = ExtMVC.OS.getOS();
    
    this.controllerName = this.model.modelName.pluralize();
    this.controller     = this.os.getController(this.controllerName);
    
    ExtMVC.view.scaffold.ScaffoldFormPanel.superclass.constructor.call(this, config);
  },
  
  /**
   * Adds default items, keys and buttons to the form
   */
  initComponent: function() {
    Ext.applyIf(this, {
      autoScroll: true,
      items:      this.buildItems(this.model),
      keys: [
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
          handler:   this.saveHandler
        }
      ],
      buttons: [
        {
          text:    'Save',
          scope:   this,
          iconCls: 'save',
          handler: this.saveHandler
        },
        {
          text:    'Cancel',
          scope:   this,
          iconCls: 'cancel',
          handler: this.onCancel
        }
      ]
    });
    
    //sets the document's title to the title of this panel
    this.os.setsTitle(this);
    
    ExtMVC.view.scaffold.ScaffoldFormPanel.superclass.initComponent.apply(this, arguments);
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
   * Builds an array of form items for the given model
   * @param {ExtMVC.Model} model The model to build form items for
   * @return {Array} An array of auto-generated form items
   */
  buildItems: function(model) {
    //check to see if FormFields have been created for this model
    //e.g. for a MyApp.models.User model, checks for existence of MyApp.views.users.FormFields
    var formFields;
    
    if (formFields = eval(String.format("{0}.views.{1}.FormFields", model.namespace.split(".")[0], model.modelName.pluralize().toLowerCase()))) {
      return formFields;
    };
    
    //no user defined form fields, generate them automatically
    var items = [];
    
    for (var i=0; i < model.fields.length; i++) {
      var f = model.fields[i];
      
      //add if it's not a field to be ignored
      if (this.ignoreFields.indexOf(f.name) == -1) {
        items.push(Ext.applyIf({
          name:        f.name,
          fieldLabel: (f.name.replace(/_/g, " ")).capitalize()
        }, this.formItemConfig));
      };
    };
    
    return items;
  },
  
  /**
   * Called when the save button is clicked or CTRL + s pressed.  By default this simply fires
   * the associated controller's 'update' action, passing this.getForm() as the sole argument
   */
  onCreate: function() {
    this.controller.fireAction('create', null, [this.getForm()]);
  },
  
  onUpdate: function() {
    this.controller.fireAction('update', null, [this.getForm()]);
  },
  
  /**
   * Called when the cancel button is clicked or ESC pressed.  By default this simply calls Ext.History.back
   */
  onCancel: Ext.History.back
});

Ext.reg('scaffold_form_panel', ExtMVC.view.scaffold.ScaffoldFormPanel);

/**
 * @class ExtMVC.view.scaffold.Index
 * @extends Ext.grid.GridPanel
 * A default index view for a scaffold (a paging grid with double-click to edit)
 */
ExtMVC.view.scaffold.Index = function(model, config) {
  var config = config || {};
  
  this.model = model;
  this.os    = ExtMVC.OS.getOS();
  
  this.controllerName = model.modelName.pluralize();
  this.controller     = this.os.getController(this.controllerName);
  
  //we can't put these in applyIf block below as the functions are executed immediately
  config.columns = config.columns || this.buildColumns(model);
  config.store   = config.store   || model.findAll();
  
  var tbarConfig = this.hasTopToolbar    ? this.buildTopToolbar()                : null;
  var bbar       = this.hasBottomToolbar ? this.buildBottomToolbar(config.store) : null;
  
  Ext.applyIf(config, {
    title:      'Showing ' + model.prototype.modelName.pluralize().capitalize(),
    viewConfig: { forceFit: true },
    id:         model.prototype.modelName + 's_index',
    
    loadMask: true,
    
    tbar: tbarConfig,
    bbar: bbar,
    
    listeners: {
      'dblclick': {
        scope: this,
        fn: function(e) {
          var obj = this.getSelectionModel().getSelected();
          
          if (obj) {
            this.os.router.redirectTo({controller: this.controllerName, action: 'edit', id: obj.data.id});
          };
        }
      }
    },
    
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
  ExtMVC.OS.getOS().setsTitle(this);
};

Ext.extend(ExtMVC.view.scaffold.Index, Ext.grid.GridPanel, {
  
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
    var columns     = [];
    var wideColumns = [];
    
    //put any preferred columns at the front
    for (var i=0; i < model.fields.length; i++) {
      var f = model.fields[i];
      if (this.preferredColumns.indexOf(f.name) > -1) {
        columns.push(this.buildColumn(f.name));
      }
    };
    
    //add the rest of the columns to the end
    for (var i = model.fields.length - 1; i >= 0; i--){
      var f = model.fields[i];
      //if this field is not in the prefer or ignore list, add it to the columns array
      if (this.preferredColumns.indexOf(f.name) == -1 && this.ignoreColumns.indexOf(f.name) == -1) {
        columns.push(this.buildColumn(f.name));
      };
      
      //if it's been declared as a wide column, add it to the wideColumns array
      if (this.wideColumns.indexOf(f.name)) {
        wideColumns.push(f.name);
      }
    };
    
    //add default widths to each
    var numberOfSegments = columns.length + (2 * wideColumns.length);
    for (var i = columns.length - 1; i >= 0; i--){
      var col = columns[i];
      
      if (this.narrowColumns.indexOf(col.id) > -1) {
        //id col is extra short
        Ext.applyIf(col, { width: 30 });
      } else if(this.wideColumns.indexOf(col.id) > -1) {
        //we have a wide column
        Ext.applyIf(col, { width: 200 });
      } else {
        //we have a normal column
        Ext.applyIf(col, { width: 100 });
      }
    };
    
    return columns;
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
   * Creates Add, Edit and Delete buttons for the top toolbar and sets up listeners to
   * activate/deactivate them as appropriate
   * @return {Array} An array of buttons 
   */
  buildTopToolbar: function() {
    this.addButton = new Ext.Button({
      text:    'New ' + this.model.modelName.titleize(),
      scope:   this,
      iconCls: 'add',
      handler: this.onAdd
    });
    
    this.editButton = new Ext.Button({
      text:     'Edit selected',
      scope:    this,
      iconCls:  'edit',
      disabled: true,
      handler:  this.onEdit
    });
    
    this.deleteButton = new Ext.Button({
      text:     'Delete selected',
      disabled: true,
      scope:    this,
      iconCls:  'delete',
      handler:  this.onDelete
    });
    
    this.getSelectionModel().on('selectionchange', function(selModel) {
      if (selModel.getCount() > 0) {
         this.deleteButton.enable();  this.editButton.enable();
      } else {
        this.deleteButton.disable(); this.editButton.disable();
      };
    }, this);
    
    return [
      this.addButton,  '-',
      this.editButton, '-',
      this.deleteButton
    ];
  },
  
  /**
   * Creates a paging toolbar to be placed at the bottom of this grid
   * @param {Ext.data.Store} store The store to bind to this paging toolbar (should be the same as for the main grid)
   * @return {Ext.PagingToolbar} The Paging Toolbar
   */
  buildBottomToolbar: function(store) {
    //Used for getting human-readable names for this model
    //TODO: this is overkill, shouldn't need to instantiate an object for this...
    var modelObj = new this.model({});
    
    return new Ext.PagingToolbar({
      store:       store,
      displayInfo: true,
      pageSize:    25,
      emptyMsg:    String.format("No {0} to display", modelObj.humanPluralName)
    });
  },
  
  /**
   * Called when the add button is pressed, or when the 'a' key is pressed.  By default this will redirect to the
   * 'New' form for this resource
   */
  onAdd: function() {
    this.os.router.redirectTo({controller: this.controllerName, action: 'new'});
  },
  
  /**
   * Called when the edit button is pressed, or when the 'e' key is pressed.  By default this will look to see if a row
   * is selected, then redirect to the appropriate Edit form.
   * If you override this you'll need to provide the row record lookup yourself
   */
  onEdit: function() {
    var selected = this.getSelectionModel().getSelected();
    if (selected) {
      this.os.router.redirectTo({controller: this.controllerName, action: 'edit', id: selected.data.id});
    }
  },
  
  /**
   * Called when the delete button is pressed, or the delete key is pressed.  By default this will ask the user to confirm,
   * then fire the controller's destroy action with the selected record's data.id and a reference to this grid as arguments.
   */
  onDelete: function() {
    Ext.Msg.confirm(
      'Are you sure?',
      String.format("Are you sure you want to delete this {0}?  This cannot be undone.", this.model.modelName.titleize()),
      function(btn) {
        if (btn == 'yes') {
          var selected = this.getSelectionModel().getSelected();
          if (selected) {
            this.controller.fireAction('destroy', null, [selected.data.id, this.store]);
          }
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
      title:       'New ' + this.model.prototype.modelName.capitalize(),
      saveHandler: this.onCreate
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
      title:       'Edit ' + this.model.prototype.modelName.capitalize(),
      saveHandler: this.onUpdate
    });
    
    ExtMVC.view.scaffold.Edit.superclass.initComponent.apply(this, arguments);
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

