/**
 * Initialise package and set version
 */
ExtMVC = {
  version: "0.5a0"
};

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
  
  for (o in options) {
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
    
    for (o in options) {
      //values in options must match this.options - e.g. this.options.action must be the same as options.action
      if (options[o] && this.options[o] && options[o] != this.options[o]) { return false; }
    }
    
    
    //TODO: Tidy this up.  All of it

    var paramsInOptions = [];
    for (o in options) {
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
    
    for (o in options) {
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
    for (v in config.viewsPackage) {
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
    for (v in viewObject) {
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
    Ext.applyIf(renderConfig, { renderNow: true });
    
    v.on('close',   function()     {this.destroyView(v.id); },            this);
    v.on('destroy', function(view) {delete this.runningViews[view.id]; }, this);
    this.runningViews[v.id] = v;
    
    if (this.renderMethod == 'render' && renderConfig.renderNow) {
      v.render(renderConfig.renderTo, renderConfig.renderPosition);
      return v;
    } else {
      if (this.addTo && renderConfig.renderNow) {
        this.addTo.add(v).show();
        this.addTo.doLayout();
        return v;
      };
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
    for (v in this.runningViews) {
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
    
    for (v in this.runningViews) {
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
     * Defaults to undefined, which lets the model choose which url to load from
     */
    loadUrl: undefined,
    
    /**
     * @property saveUrl
     * @type String
     * If your form needs to save to a non-standard url, override this (should be very rare).
     * Defaults to undefined, which lets the model choose which url to save to
     */
    saveUrl: undefined,
  
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

/**
 * ExtMVC.Model
 * @extends Ext.util.Observable
 * Base model class
 */
ExtMVC.Model = function(fields, config) {
  Ext.applyIf(this, {
    /**
     * @property newRecord
     * @type Boolean
     * True if this record is newly created and has not yet been successfully saved
     */
    newRecord: fields.id ? false : true
  });
  
  //create a new Record object and then decorate it with RecordExtensions
  var record = ExtMVC.Model.recordFor(this.modelName, fields);
  var rec = new record(fields || {});
  rec.init(this);
  
  Ext.applyIf(this, this.constructor.instanceMethods);
  
  //add any hasMany associations
  var hm = this.constructor.hasMany;
  if (hm) {
    //make sure we're dealing with an array
    if (typeof hm == 'string') { hm = [hm]; }
    
    for (var i=0; i < hm.length; i++) {
      var hma = hm[i];
      
      //association can just be specified via a string, in which case turn it into an object here
      if (typeof hma == 'string') { hma = { name: hma }; };
      
      hma = new ExtMVC.Model.HasManyAssociation(this, hma);
      this[hma.associationName] = hma;
    };
  };
  
  //add any belongsTo associations
  var bt = this.constructor.belongsTo;
  if (bt) {
    //make sure we're dealing with an array
    if (typeof bt == 'string') { bt = [bt]; }
    
    for (var i=0; i < bt.length; i++) {
      var bta = bt[i];
      
      //association can just be specified via a string, in which case turn it into an object here
      if (typeof bta == 'string') { bta = { name: bta }; };
      
      var btaAssoc = new ExtMVC.Model.BelongsToAssociation(this, bta);
      this[btaAssoc.associationName] = btaAssoc;
      
      //see if a parent has been defined, if not set one up now (defaults here to the first belongsTo assoc)
      var parentModel = this.constructor.parentModel || bta.name;
      if (parentModel && !this.parent) {
        this.parent = btaAssoc;
      };
    };
  };
  
  Ext.apply(this, rec);
};

/**
 * Creates a model definition
 * @param {String} modelNameWithNamespace The (string) name of the model to create (e.g. MyNamespace.model.MyModel)
 * @param {object} config Configuration for this model.
 * @cfg {Array} fields Array of field definitions for this model, same format as Ext.data.Record.create takes
 * @cfg {String} adapter The data adapter to use (defaults to REST, which attempts to save models to a RESTful url backend)
 * @cfg {String} urlName The string version of the model name to use when making requests to the server.  e.g. for a model called
 * MyModel the server may be set up to accept urls like /my_models/1 or /MyModels/1, this is where you specify that
 * @cfg {String} xmlName The name of the XML element which contains the model fields.  e.g. for a model called MyModel, this may look
 * like <MyModel>...</MyModel> or <my_model>...</my_model>.  This is where you set that (don't include the angle brackets)
 */
ExtMVC.Model.define = function(modelNameWithNamespace, config) {
  var config = config || {};
  
  //split into namespace and model name
  var nsRegex = /(.+)\.([A-Za-z]*)$/;
  var match = nsRegex.exec(modelNameWithNamespace);
  var namespace = null;
  if (match) {
    var namespace = match[1];
    var modelName = match[2];
    Ext.ns(namespace); //make sure the namespace is defined
  };

  Ext.applyIf(config, {
    namespace: namespace, //.split(".")[0],
    modelName: modelName,
    className: modelName,
    adapter:   'REST'
  });
  
  //extend ExtMVC.Model for this className
  eval(modelNameWithNamespace + " = Ext.extend(ExtMVC.Model, config)");
  var className = eval(modelNameWithNamespace);
  
  /**
   * If we are extending another model, copy its fields, class methods and instance methods
   * into this model
   */
  if (className.prototype.extend) {
    var extendsModel = eval(className.prototype.extend);
    var parentFields = extendsModel.fields;
    
    //add parent model fields to the front of the child model fields array
    for (var i = parentFields.length - 1; i >= 0; i--){
      var childFields    = className.prototype.fields;
      var alreadyDefined = false;
      
      //check that this field is not redefined in the child model
      for (var j=0; j < childFields.length; j++) {
        if (childFields[j].name == parentFields[i].name) {
          alreadyDefined = true;
          break; //no need to finish the loop as we've already made the match
        }
      };
      
      //only add if not redefined in child model
      if (!alreadyDefined) {
        className.prototype.fields.unshift(parentFields[i]);
      };
    };
    
    //add any class methods
    Ext.applyIf(className, extendsModel.prototype);
  };
  
  /**
   * Add fields the way Ext.data.Record does it.
   * TODO: We shouldn't be doing this here, Record should be doing it... not very DRY
   */
  className.prototype.fields = new Ext.util.MixedCollection();
  Ext.each(config.fields, function(f) {
    className.prototype.fields.add(new Ext.data.Field(f));
  });
  
  //add fields, modelName, className and adapter as class-level items
  Ext.apply(className, {
    adapter:   config.adapter,
    modelName: modelName,
    className: className,
    namespace: namespace,
    
    //build the underlying Ext.data.Record now (will be used in model's constructor)
    record:    ExtMVC.Model.recordFor(modelName, config.fields)
  });
  
  //add model class functions such as findById
  ExtMVC.Model.addClassMethodsToModel(className, config);
};


/**
 * Custom extensions to Ext.data.Record.  These methods are added to new Ext.data.Record objects
 * when you subclass ExtMVC.Model.
 * For example
 * model = new ExtMVC.Spec.FakeUser({
 *   id:   100,
 *   name: 'Ed'
 * });
 * alert(model.namespacedUrl('my_url')); // => '/admin/my_url.ext_json'
 */
ExtMVC.Model.RecordExtensions = {
  /**
   * Adds logic on top of Ext.data.Record
   */
  init: function(config) {
    Ext.applyIf(config, {
      //set up the various variations on the model name
      className:         ExtMVC.Model.classifyName(config.modelName),
      controllerName:    ExtMVC.Model.controllerName(config.modelName),
      foreignKeyName:    ExtMVC.Model.foreignKeyName(config.modelName),
      
      humanPluralName:   ExtMVC.Model.pluralizeHumanName(config.modelName),
      humanSingularName: ExtMVC.Model.singularizeHumanName(config.modelName),
      
      underscoreName:    config.modelName
    });
    
    //add the data adapter, initialize it
    var adapter = ExtMVC.Model.AdapterManager.find(config.adapter || ExtMVC.Model.prototype.adapter);
    if (adapter) {
      Ext.apply(config, adapter.instanceMethods);
      adapter.initialize(this);
    }
    
    //mix in validations package
    Ext.apply(config, ExtMVC.Model.ValidationExtensions);
    config.initializeValidationExtensions();
    
    Ext.apply(this, config);
  },
  
  /**
   * Calculates a nested url for this object based on it's data.id and parent model
   * @return {String} The url for this model object
   */
  url: function() {
    var el = this.data.id ? this : this.constructor;
    if (this.parent && this.parent.lastFetched) {
      return ExtMVC.UrlBuilder.urlFor(this.parent.get({}, -1), el);
    } else {
      return ExtMVC.UrlBuilder.urlFor(el);
    };
  },
  
  /**
   * Mass-assigns field values.  Operation is wrapped in beginEdit and endEdit
   * e.g. setValues({first_name: 'Ed', last_name: 'Spencer'})
   * is the same as set('first_name', 'Ed'); set('last_name': 'Spencer')
   * @param {Object} values An object containing key: value pairs for fields on this object
   */
  setValues: function(values) {
    this.beginEdit();
    for (key in values) {
      this.set(key, values[key]);
    }
    this.endEdit();
  },
  
  /**
   * Reads errors from a generic object and adds them to this model's internal errors object.
   * Intended to be used mainly to process server responses
   */
  readErrors: function(errorsObject) {
    this.errors.readServerErrors(errorsObject);
  }
};

/**
 * Provides a framework for validating the contents of each field
 */
ExtMVC.Model.ValidationExtensions = {
  /**
   * Sets up this record's validation parameters
   */
  initializeValidationExtensions: function() {
    this.validations = this.validations || [];
    this.errors      = new ExtMVC.Model.Validation.Errors(this);
  },
  
  isValid: function() {
    return this.errors.isValid();
  }
};


ExtMVC.Model.models   = [];

/**
 * Utility methods which don't need to be declared per model
 */
Ext.apply(ExtMVC.Model, {
  
  /**
   * Retrieves or creates an Ext.data.Record for the given model name.  This is then cached
   * in ExtMVC.models for later reuse
   * @param {String} modelName The name of the model to create or retrieve a record for
   * @param {Array} fields An array of fields to be passed to the Ext.data.Record.create call
   * @return {Ext.data.Record} An instantiated Record object using Ext.data.Record.create
   */
  recordFor: function(modelName, fields) {
    var record = ExtMVC.Model.models[modelName];
    if (!record) {
      record = Ext.data.Record.create(fields);

      Ext.apply(record.prototype, ExtMVC.Model.RecordExtensions);
      ExtMVC.Model.models[modelName] = record;
    }
    
    return record;
  },
    
  /**
   * String methods:
   */
   
  urlizeName : function(name) {
    return name.toLowerCase().pluralize();
  },
  
  classifyName: function(name) {
    return this.singularizeHumanName(name).replace(/ /g, "");
  },
  
  singularizeHumanName: function(name) {
    return name.replace(/_/g, " ").titleize();
  },
  
  pluralizeHumanName: function(name) {
    return name.pluralize().replace(/_/g, " ").titleize();
  },
  
  controllerName : function(name) {
    return this.pluralizeHumanName(name).replace(/ /g, "")  + "Controller";
  },
  
  foreignKeyName: function(name) {
    return name.toLowerCase() + '_id';
  },
  
  /**
   * Add class methods for finding model objects
   * @param {Function} modelClass The class to add methods to
   * @param {Object} additionalFunctions (Optional) extra class methods to add to this class
   */
  addClassMethodsToModel: function(modelClass, additionalFunctions) {
    var additionalFunctions = additionalFunctions || {};
    
    Ext.applyIf(additionalFunctions, {
      //add a urlName property to the Model subclass
      urlName: ExtMVC.Model.urlizeName(modelClass.prototype.modelName)
    });
    
    //add any class methods from the adapter
    var adapter = ExtMVC.Model.AdapterManager.find(modelClass.adapter || ExtMVC.Model.prototype.adapter);
    if (adapter && adapter.classMethods) {
      Ext.apply(modelClass, adapter.classMethods);
    };
        
    //add other class methods    
    Ext.apply(modelClass, {      
      /**
       * Returns the default reader for this model subclass.  Creates a default reader if
       * one has not already been set
       */
      getReader: function() {
        if (!modelClass.reader) {
          modelClass.reader = new Ext.data.JsonReader({
            totalProperty: 'totalCount',
            root: modelClass.jsonName || modelClass.prototype.modelName.toLowerCase()
          }, modelClass);
        };
        
        return modelClass.reader;
      }
    }, additionalFunctions);
  }
});

Ext.ns('ExtMVC.Model.Adapter', 'ExtMVC.Model.Validation');

/**
 * Manages registration and retrieval of MVC Model adapters
 * @class ExtMVC.Model.AdapterManager
 */
ExtMVC.Model.AdapterManager = {
  /**
   * @property adapters
   * @type Object
   * Key/Value pairs of registered names and the relevant Adapter objects
   */
  adapters: {},
  
  /**
   * Registers an adapter for use with MVC Models.  
   * @param {String} name String name for this Adapter (e.g. 'REST')
   * @param {Function} object A reference to the Adapter object itself
   */
  register: function(name, constructor) {
    this.adapters[name] = constructor;
  },
  
  /**
   * Retrieves the requested adapter by key name
   * @param {String} name The name of the adapter to fine (e.g. 'REST')
   * @return {Object/Null} The Adapter object, if found
   */
  find: function(name, config) {
    return this.adapters[name];
  }
};

/**
 * @class ExtMVC.Model.Cache
 * @extends Ext.util.Observable
 * Provides an interface for caching model objects which have been fetched from some database/backend
 */
ExtMVC.Model.Cache = function(config) {
  var config = config || {};
 
  ExtMVC.Model.Cache.superclass.constructor.call(this, config);
  
  this.addEvents(
    /**
     * @event beforeadd
     * Fires before an item is added to the cache
     * @param {ExtMVC.Model} modelObject The model which is about to be added
     */
    'beforeadd',
    
    /**
     * @event add
     * Fires after an item is added to the cache
     * @param {ExtMVC.Model} modelObject The model which was just added
     */
    'add',
    
    /**
     * @event beforeclear
     * Fires before the cache is cleared
     * @param {Number} seconds The number of seconds worth of caches which will be saved
     */
    'beforeclear',
    
    /**
     * @event clear
     * Fires after the cache has been cleared
     * @param {Number} seconds The number of seconds worth of caches which were saved
     */
    'clear'
  );
};

Ext.extend(ExtMVC.Model.Cache, Ext.util.Observable, {
  
  /**
   * @property caches
   * @type Object
   * Maintains all cached objects
   */
  caches: {},
  
  /**
   * Adds the given model object to the cache.  Automatically stores the datetime of the add
   * @param {ExtMVC.Model} modelObject The model you want to store in the cache
   */
  add: function(modelObject) {
    if (this.fireEvent('beforeadd', modelObject)) {
      var modelName = modelObject.className;
      var modelId   = modelObject.data.id;

      if (modelName && modelId) {
        modelObject.cachedAt = new Date();
        
        this.caches[modelName] = this.caches[modelName] || {};        
        this.caches[modelName][modelId] = modelObject;
        
        this.fireEvent('add', modelObject);
        return true;
      } else {
        
        return false;
      };
    }
  },
  
  /**
   * Fetches an object from the cache
   * @param {Object} params params object which must contain at least modelName and id.  Optionally 
   * supply staleTime, which is the number of seconds old the cached object is allowed to be to get a hit,
   * or a Date which will restrict hits to anything cached after that date
   * @return {ExtMVC.Model/null} The model if found, or null
   */
  fetch: function(params) {
    this.caches[params['modelName']] = this.caches[params['modelName']] || {};
    
    var params = params || {};
    var hit    = this.caches[params['modelName']][params['id']];
    
    if (hit) {
      if (params.staleTime) {
        if (typeof params.staleTime == 'number') {
          var date = new Date();
          date.setTime(date.getTime() - (1000 * params.staleTime));
          params.staleTime = date;
        };
        
        //make sure we have a date object
        if (params.staleTime.getTime && hit.cachedAt > params.staleTime) {
          return hit;
        }
      } else {
        return hit;
      };
    };
  },
  
  /**
   * Clears all objects more than the given number of seconds old (defaults to clearing all objects)
   * @param {Number} seconds The number of seconds to keep cached objects for (e.g. setting this to 10 would delete anything cached more than 10 seconds ago)
   */
  clear: function(seconds) {
    var seconds = seconds || 0;
    var date = new Date();
    date.setTime(date.getTime() - (1000 * seconds));
    
    if (this.fireEvent('beforeclear', seconds)) {
      if (seconds == 0) {
        this.caches = {};
      } else {
        for (var i=0; i < this.caches.length; i++) {
          for (var j=0; j < this.caches[i].length; j++) {
            if (this.caches[i][j].cachedAt < date) {
              delete this.caches[i][j];
            };
          };
        };
      };
      
      this.fireEvent('clear', seconds);
    }
  }
});

/**
 * @class ExtMVC.UrlBuilder
 * Builds URLs...
 */
ExtMVC.UrlBuilder = function() {
  
};

ExtMVC.UrlBuilder.prototype = {
  
  /**
   * @property baseUrlNamespace
   * @type String
   * An optional url namespace to prepend to all urls (e.g. /admin).  Defaults to an empty string
   */
  baseUrlNamespace: '',
  
  /**
   * @property baseUrlFormat
   * @type String
   * An optional url extension to append to all urls (e.g. .json).  Defaults to an empty string
   */
  baseUrlFormat: '',
  
  /**
   * @property segmentJoiner
   * @type String
   * The string to join url segments on (defaults to '/')
   */
  segmentJoiner: '/',
  
  /**
   * Generates a url for the given object or function definition
   * @param {Mixed} obj The object to create a URL for
   * @return {String} The generated URL
   */
  urlFor: function() {
    var config  = {};
    var lastArg = Array.prototype.slice.call(arguments, arguments.length - 1)[0];
    
    //if the last argument is a config object
    if (typeof lastArg == 'object' && !lastArg.className) {
      //set some default url building options
      Ext.apply(config, lastArg, {
        format:       this.baseUrlFormat,
        urlNamespace: this.baseUrlNamespace
      });
      
      //use all but the last argument now
      var arguments = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
    }
    
    var segments = [config.urlNamespace];
    
    //iterate over valid arguments, appending each to segments
    for (var i=0; i < arguments.length; i++) {
      var arg = arguments[i];
      var res = [];
      
      switch(typeof arg) {
        case 'string':   res = [arg];                         break;
        case 'object':   res = this.segmentsForInstance(arg); break;
        case 'function': res = this.segmentsForClass(arg);    break;
      }
      
      for (var j=0; j < res.length; j++) {
        segments.push(res[j]);
      };
    };
    
    var url = segments.join(this.segmentJoiner);
    if (config.format) { url += "." + config.format; }
    
    return url;
  },
  
  /**
   * Returns an array of url segments for a model instance
   * @param {ExtMVC.Model} instance A Model instance with at least its primary key value set
   * @return {Array} An array of segments for this url (e.g. ['users', '10'])
   */
  segmentsForInstance: function(instance) {
    return [instance.constructor.urlName, instance.data.id];
  },
  
  /**
   * Returns an array of url segments for a given class and optional primary key
   * @param {Function} cls The class to generate a url for
   * @param {String} id An optional ID to add to the segments
   * @return {Array} An array of segments for this class
   */
  segmentsForClass: function(cls, id) {
    var segs = [cls.urlName];
    if (id) { segs.push(id); }
    
    return segs;
  }
};

ExtMVC.UrlBuilder = new ExtMVC.UrlBuilder();

ExtMVC.Model.Association = {
  
  /**
   * Returns the default association name for a given class (e.g. "Post" becomes "posts", "SecretAgent" becomes "secretAgents" etc)
   * @param {String} className The string name of the class which this belongs to
   * @return {String} The association name for this class
   */
  hasManyAssociationName: function(className) {
    return className.toLowerCase() + 's';
  },
  
  /**
   * Returns the default association name for a given class (e.g. "Post" becomes "post", "SecretAgent" becomes "secretAgent")
   * @param {String} className The string name of the class to calculate a belongsTo name for
   * @return {String} The association name for this class
   */
  belongsToAssociationName: function(className) {
    return className.toLowerCase();
  }
};



// //this is not currently used
// ExtMVC.Model.Association = function(ownerObject, config) {
//   var config = config || {};
//   
//   //set some sensible default values
//   Ext.applyIf(config, {
//     primaryKey:      'id',
//     foreignKey:      ownerObject.foreignKeyName,
//     extend:          {},
//     className:       (ownerObject.constructor.namespace ? ownerObject.constructor.namespace + '.' + config.name : config.name)
//   });
//   
//   // //get a reference to the class definition function of the associated object
//   // //(e.g. a hasMany: ['Post'] association will return a reference to Post)
//   // var associatedObjectClass = eval(config.className);
//   // 
//   // /**
//   //  * Private, calls the ownerObject's class method with the supplied args
//   //  */
//   // function callOwnerObjectClassMethod(method, args, scope) {
//   //   return ownerObject.constructor[method].apply(scope || ownerObject.constructor, args || []);
//   // };
//   // 
//   // /**
//   //  * Private, calls the associated object's class method with the supplied args
//   //  */
//   // function callAssociatedObjectClassMethod (method, args, scope) {
//   //   return associatedObjectClass[method].apply(scope || associatedObjectClass, args || []);
//   // }
// };

/**
 * @class ExtMVC.Model.HasManyAssociation
 * @extends ExtMVC.Model.Association
 */
ExtMVC.Model.HasManyAssociation = function(ownerObject, config) {
  var config = config || {};
  
  Ext.applyIf(config, {
    offset:          0,
    limit:           25,
    associationName: ExtMVC.Model.Association.hasManyAssociationName(config.name)
  });

  //TODO: these should be abstracted to a parent object (as should private vars and funcs below)
  Ext.applyIf(config, {
    primaryKey:      'id',
    foreignKey:      ownerObject.foreignKeyName,
    extend:          {},
    
    className:       (ownerObject.constructor.namespace ? ownerObject.constructor.namespace + '.' + config.name : config.name)
  });
  
  //get a reference to the class definition function of the associated object
  //(e.g. a hasMany: ['Post'] association will return a reference to Post)
  var associatedObjectClass = eval(config.className);
  
  /**
   * Private, calls the ownerObject's class method with the supplied args
   */
  function callOwnerObjectClassMethod(method, args, scope) {
    return ownerObject.constructor[method].apply(scope || ownerObject.constructor, args || []);
  };
  
  /**
   * Private, calls the associated object's class method with the supplied args
   */
  function callAssociatedObjectClassMethod (method, args, scope) {
    return associatedObjectClass[method].apply(scope || associatedObjectClass, args || []);
  }
  
  return Ext.applyIf(config.extend, {
    
    /**
     * @property associationName
     * @type String
     * Returns the name of this association so that the model can add it to its definition
     */
    associationName: config.associationName,
    
    /**
     * @property associationType
     * @type String
     * The type of association (hasMany or belongsTo)
     */
    associationType: 'hasMany',
    
    /**
     * Returns the URL for this association - e.g. if model User hasMany Posts, user.posts.url() will
     * return something like /users/1/posts.
     * Pass additional parameter options as arguments to pass straight through to the URL builder - e.g.:
     * user.posts.url('published'); // = /users/1/posts/published
     * @return {String} The URL for the has many resource
     */
    url: function() {
      var args = [ownerObject, associatedObjectClass];
      for (var i=0; i < arguments.length; i++) {
        args.push(arguments[i]);
      };
      
      return ExtMVC.UrlBuilder.urlFor.apply(ExtMVC.UrlBuilder, args);
    },
    
    /**
     * Passes through to the owner class's findById class method, adding a foreign key constraint first
     * @param {String} id The ID of the associated object to retrieve
     * @param {Object} options Options passed along to the associated model's Class's findById method.  Pass in loadSuccess, loadFailure, conditions, order etc here
     */
    findById: function(id, options) {
      var options = options || {};
      
      //add a condition to constrain to the owner object's id
      if (!options.conditions) { options.conditions = []; }
      options.conditions.push({
        key:   config.foreignKey,
        value: ownerObject.data[config.primaryKey]
      });
      
      return callAssociatedObjectClassMethod('findById', [id, options]);
    },
    
    findAll: function(storeOptions) {
      var storeOptions = storeOptions || {};
      Ext.applyIf(storeOptions, {
        url: this.url(),
        
        listeners: {
          
          //Once we have fetched all hasMany records, make sure newRecord is false, and set the parent
          //relationship to point to this ownerObject (The object which hasMany of these records)
          'load': {
            scope: this,
            fn: function(store, records, options) {
              Ext.each(records, function(record) {
                record.newRecord = false;
                if (record.parent && record.parent.set) {
                  record.parent.set(ownerObject);
                }
              }, this);
            }
          }
        }
      });
      
      return callAssociatedObjectClassMethod('findAll', [storeOptions]);
    },
    
    /**
     * Creates (builds and attempts to save) this associated model
     * @param {Object} fields Object with keys and values to initialise this object
     * @param {Object} saveConfig Passed to the Ext.Ajax request, supply success and failure options here
     */
    create: function(fields, saveConfig) {
      return this.build(fields).save(saveConfig);
    },
    
    /**
     * Builds an instantiation of the associated model with the supplied data.
     * Automatically links in the correct foreign key
     * @param {Object} fields The data to initialize this object with
     */
    build: function(fields) {
      var fields = fields || {};
      
      //instantiate the new object with the augmented fields
      var obj = new associatedObjectClass(fields);
      
      //set up the object's belongsTo association.  This also sets up the foreign key
      var assocName = ExtMVC.Model.Association.belongsToAssociationName(ownerObject.className);
      obj[assocName].set(ownerObject);
      
      return obj;
    },

    /**
     * Adds an existing (saved) instantiation of the associated model to this model's hasMany collection
     * @param {ExtMVC.Model} modelObject The existing, saved model
     */
    add: function(modelObject) {
      //TODO: implement this
      
    },

    destroy: function(id) {
      //TODO: implement this
      
    }
  });
};

// Ext.extend(ExtMVC.Model.HasManyAssociation, ExtMVC.Model.Association);

/**
 * @class ExtMVC.Model.BelongsToAssociation
 * @extends ExtMVC.Model.Association
 */
ExtMVC.Model.BelongsToAssociation = function(ownerObject, config) {
  var config = config || {};
  
  Ext.applyIf(config, {
    associationName: ExtMVC.Model.Association.belongsToAssociationName(config.name)
  });
    
  //TODO: these should be abstracted to a parent object (as should private vars and funcs below)
  Ext.applyIf(config, {
    primaryKey:      'id',
    foreignKey:      ownerObject.foreignKeyName,
    extend:          {},
    
    className:       (ownerObject.constructor.namespace ? ownerObject.constructor.namespace + '.' + config.name : config.name)
  });
  
  //get a reference to the class definition function of the associated object
  //(e.g. a hasMany: ['Post'] association will return a reference to Post)
  var associatedObjectClass = eval(config.className);
  
  /**
   * Private, calls the ownerObject's class method with the supplied args
   */
  function callOwnerObjectClassMethod(method, args, scope) {
    return ownerObject.constructor[method].apply(scope || ownerObject.constructor, args || []);
  };
  
  /**
   * Private, calls the associated object's class method with the supplied args
   */
  function callAssociatedObjectClassMethod (method, args, scope) {
    return associatedObjectClass[method].apply(scope || associatedObjectClass, args || []);
  };
  
  return {
    /**
     * @property associationName
     * @type String
     * Returns the name of this association so that the model can add it to its definition
     */
    associationName: config.associationName,
    
    /**
     * @property associationClass
     * @type ExtMVC.Model
     * A reference to the association's class (e.g. belongsTo: "Post" would have associationClass of Post)
     */
    associationClass: associatedObjectClass,
    
    /**
     * @property associationType
     * @type String
     * The type of association (hasMany or belongsTo)
     */
    associationType: 'belongsTo',
    
    /**
     * @property lastFetched
     * @type Date
     * Date object representing the last time the associated object was successfully fetched
     */
    lastFetched: null,
    
    /**
     * Sets the associated model for this association to the specified model object
     * @param {ExtMVC.Model} modelObject The associated model to set this belongsTo association to
     */
    set: function(modelObject) {
      this.lastFetched = new Date();
      this.cachedObject = modelObject;
      
      //add the foreign key automatically
      ownerObject.data[modelObject.foreignKeyName] = modelObject.data[config.primaryKey];
    },
    
    /**
     * Gets the associated model for this association
     * @param {Object} options Options to pass through to the Ajax load request
     * @param {Number} cacheFor If the object has been retrieved less than this number of seconds ago, use the cached object
     */
    get: function(options, cacheFor) {
      var options  = options  || {};
      var cacheFor = cacheFor || 0;
      
      Ext.applyIf(options, {
        loadSuccess: Ext.emptyFn,
        loadFailure: Ext.emptyFn
      });
      
      var cacheIsCurrent = (((new Date() - this.lastFetched) / 1000) < cacheFor) || (cacheFor == -1);
      
      if (this.lastFetched && this.cachedObject && cacheIsCurrent) {
        //return the cached object via a callback
        options.loadSuccess.call(options.scope || this, this.cachedObject);
        
        //also return via normal return if this is a cached object.  This allows some functions to use the cached object
        //without the overhead of setting up a callback, so long as they first check that the object has been fetched
        return this.cachedObject;
      } else {
        //inject caching code before loadSuccess - caches the object into this.cachedObject and sets this.lastFetched to now
        Ext.apply(options, {
          loadSuccess: options.loadSuccess.createInterceptor(function(obj) {
            this.cachedObject = obj;
            this.lastFetched  = new Date();
          }, this)
        });
        
        return callAssociatedObjectClassMethod('findById', [1, options]);
      };
    }
  };
};

ExtMVC.Model.Adapter.Abstract = {
  initialize: function(model) {
    
  },
  
  classMethods: {
    find: function(options) {
      
    },
    
    findById: function(id, options) {
      return this.findByField('id', id, options);
    },
    
    findByField: function(fieldName, matcher, options) {
      
    },
    
    findAll: function(options) {
      
    }
  },
  
  instanceMethods: {
    save:    Ext.emptyFn,
    
    reload:  Ext.emptyFn,
    
    destroy: Ext.emptyFn
  }
};

/**
 * Methods adding url data mapping
 */
ExtMVC.Model.AbstractAdapter = {
  /**
   * Set up the model for use with Active Resource.  Add various url-related properties to the model
   */
  initAdapter: function() {
    Ext.applyIf(this, {
      urlNamespace: '/admin',
      urlExtension: '.ext_json',
      urlName:      ExtMVC.Model.urlizeName(this.modelName)
    });
  },
  
  /**
   * Saves this record.  Performs validations first unless you pass false as the single argument
   */
  save: function(performValidations) {
    var performValidations = performValidations || true;
    
    console.log("saving model");
  },
  
  destroy: function(config) {
    var config = config || {};
    
    console.log("destroying model");
  },
  
  /**
   * Loads this record with data from the given ID
   * @param {Number} id The unique ID of the record to load the record data with
   * @param {Boolean} asynchronous False to load the record synchronously (defaults to true)
   */
  load: function(id, asynchronous) {
    var asynchronous = asynchronous || true;
    
    console.log("loading model");
  },
  
  /**
   * URL to retrieve a JSON representation of this model from
   */
  singleDataUrl : function(record_or_id) {
    return this.namespacedUrl(String.format("{0}/{1}", this.urlName, this.data.id));
  },
  
  /**
   * URL to retrieve a JSON representation of the collection of this model from
   * This would typically return the first page of results (see {@link #collectionStore})
   */
  collectionDataUrl : function() {
    return this.namespacedUrl(this.urlName);
  },

  /**
   * URL to retrieve a tree representation of this model from (in JSON format)
   * This is used when populating most of the trees in ExtMVC, though
   * only applies to models which can be representated as trees
   */
  treeUrl: function() {
    return this.namespacedUrl(String.format("{0}/tree", this.urlName));
  },
  
  /**
   * URL to post details of a drag/drop reorder operation to.  When reordering a tree
   * for a given model, this url is called immediately after the drag event with the
   * new configuration
   * TODO: Provide more info/an example here
   */
  treeReorderUrl: function() {
    return this.namespacedUrl(String.format("{0}/reorder/{1}", this.urlName, this.data.id));
  },
  
  /**
   * Provides a namespaced url for a generic url segment.  Wraps the segment in this.urlNamespace and this.urlExtension
   * @param {String} url The url to wrap
   * @returns {String} The namespaced URL
   */
  namespacedUrl: function(url) {
    return(String.format("{0}/{1}{2}", this.urlNamespace, url, this.urlExtension));
  }
};

// ExtMVC.Model.registerAdapter('REST', ExtMVC.Model.AbstractAdapter);

Ext.ns('ExtMVC.Model.Adapter');

(function() {
  var A = ExtMVC.Model.Adapter;
  
  A.REST = {
    initialize: function(model) {
      // console.log('initialising REST adapter');
      
      A.Abstract.initialize(model);
    },
    
    classMethods: {
      /**
       * Generic find method, accepts many forms:
       * find(10, opts)      // equivalent to findById(10, opts)
       * find('all', opts)   // equivalent to findAll(opts)
       * find('first', opts) // equivalent to findById(1, opts)
       */
      find: function(what, options) {
        var id;
        if (id = parseInt(what, 10)) {
          return this.findById(id, options);
        };
        
        switch(what) {
          case 'first': return this.findById(1, options);
          default     : return this.findAll(options);
        }
      },
      
      /**
       * Shortcut for findByField('id', 1, {})
       */
      findById: function(id, options) {
        // return this.findByField('id', id, options);
        var options = options || {};
        Ext.applyIf(options, {
          url: this.singleDataUrl(id)
        });
        
        return this.performFindRequest(options);
      },
          
      /**
       * Performs a custom find on a given field and value pair.  e.g.:
       * User.findByField('email', 'adama@bsg.net') creates the following request:
       * GET /users?email=adama@bsg.net
       * And creates an array of User objects based on the server's response
       * @param {String} fieldName The name of the field to search on
       * @param {String/Number} matcher The field value to search for
       * @param {Object} options An object which should contain at least a success function, which will
       * be passed an array of instantiated model objects
       */
      findByField: function(fieldName, matcher, options) {
        var fieldName = fieldName || 'id';
        var options   = options || {};
        
        options.conditions = options.conditions || [];
        options.conditions.push({key: fieldName, value: matcher, comparator: '='});
                
        return this.performFindRequest(options);
      },
      
      findAll: function(options) {
        var options = options || {};
        
        var url = options.url || this.collectionDataUrl();
        
        return new Ext.data.Store(
          Ext.applyIf(options, {
            autoLoad:   true,
            remoteSort: false,
            proxy:      new Ext.data.HttpProxy({
              url:    url,
              method: "GET"
            }),
            reader:     this.getReader()
          })
        );
      },
      
      /**
       * Private, internal methods below here.  Not expected to be useful by anything else but
       * are left public for now just in case
       */
       
      /**
       * Underlying function which handles all find requests.  Private
       */
      performFindRequest: function(options) {
        var options = options || {};
        Ext.applyIf(options, {
          scope:   this,
          url:     this.collectionDataUrl(),
          method:  'GET',
          success: Ext.emptyFn,
          failure: Ext.emptyFn
        });
        
        //local references to reader and constructor so they can be used within callbacks
        var reader      = this.getReader();
        var constructor = this;
        
        //keep a handle on user-defined callbacks
        var successFn = options.success;
        
        options.success = function(response, opts) {
          var m = reader.read(response);
          if (m && m.records[0]) {
            m.records[0].newRecord = false;
            successFn.call(options.scope, m.records[0]);
          } else {
            failureFn.call(options.scope, response);
          };
        };
        
        /**
         * Build params variable from condition options.  Params should always be a string here
         * as we're dealing in GET requests only for a find
         */
        var params = options.params || '';
        if (options.conditions && options.conditions[0]) {
          for (var i=0; i < options.conditions.length; i++) {
            var cond = options.conditions[i];
            params += String.format("{0}{1}{2}", cond['key'], (cond['comparator'] || '='), cond['value']);
          };
          
          delete options.conditions;
        };
        options.params = params;

        return Ext.Ajax.request(options);
      },
      
      /**
       * Extension appended to the end of all generated urls (e.g. '.js').  Defaults to blank
       */
      urlExtension: '',
      
      /**
       * Default url namespace prepended to all generated urls (e.g. '/admin').  Defaults to blank
       */
      urlNamespace: '',
      
      /**
       * URL to retrieve a JSON representation of this model from
       */
      singleDataUrl : function(id) {
        return this.namespacedUrl(String.format("{0}/{1}", this.urlName, id));
      },
  
      /**
       * URL to retrieve a JSON representation of the collection of this model from
       * This would typically return the first page of results (see {@link #collectionStore})
       */
      collectionDataUrl : function() {
        return this.namespacedUrl(this.urlName);
      },
  
      /**
       * URL to retrieve a tree representation of this model from (in JSON format)
       * This is used when populating most of the trees in ExtMVC, though
       * only applies to models which can be representated as trees
       */
      treeUrl: function() {
        return this.namespacedUrl(String.format("{0}/tree", this.urlName));
      },
  
      /**
       * URL to post details of a drag/drop reorder operation to.  When reordering a tree
       * for a given model, this url is called immediately after the drag event with the
       * new configuration
       * TODO: Provide more info/an example here
       */
      treeReorderUrl: function() {
        return this.namespacedUrl(String.format("{0}/reorder/{1}", this.urlName, this.data.id));
      },
  
      /**
       * Provides a namespaced url for a generic url segment.  Wraps the segment in this.urlNamespace and this.urlExtension
       * @param {String} url The url to wrap
       * @returns {String} The namespaced URL
       */
      namespacedUrl: function(url) {
        return(String.format("{0}/{1}{2}", this.urlNamespace, url, this.urlExtension));
      } 
    },
    
    instanceMethods: {
      /**
       * Saves this model instance to the server.
       * @param {Object} options An object passed through to Ext.Ajax.request.  The success option is a special case,
       * and is called with the newly instantiated model instead of the usual (response, options) signature
       */
      save: function(options) {
        var options = options || {};
        
        if (options.performValidations === true) {
          //TODO: tie in validations here
        };
        
        //keep a reference to this record for use in the success and failure functions below
        var record = this;
        
        //set a _method param to fake a PUT request (used by Rails)
        var params = options.params || this.namespaceFields();
        if (!this.newRecord) { params["_method"] = 'put'; }
        delete options.params;
        
        //if the user passes success and/or failure functions, keep a reference to them to allow us to do some pre-processing
        var userSuccessFunction = options.success || Ext.emptyFn;
        var userFailureFunction = options.failure || Ext.emptyFn;
        delete options.success; delete options.failure;
        
        //function to call if Ext.Ajax.request is successful
        options.success = function(response) {
          //definitely not a new record any more
          record.newRecord = false;
          
          userSuccessFunction.call(options.scope || record, record, response);
        };
        
        //function to call if Ext.Ajax.request fails
        options.failure = function(response) {
          //parse any errors sent back from the server
          record.readErrors(response.responseText);
          
          userFailureFunction.call(options.scope || record, record, response);
        };
        
        //do this here as the scope in the block below is not always going to be 'this'
        var url = this.url();
        
        Ext.applyIf(options, {
          url:     url,
          method:  'POST',
          params:  params
        });
        
        Ext.Ajax.request(options);
      },
      
      /**
       * Updates the model instance and saves it.  Use setValues({... new attrs ...}) to change attributes without saving
       * @param {Object} updatedAttributes An object with any updated attributes to apply to this instance
       * @param {Object} saveOptions An object with save options, such as url, callback, success, failure etc.  Passed straight through to save()
       */
      update: function(updatedAttributes, saveOptions) {
        updatedAttributes = updatedAttributes || {};
        saveOptions = saveOptions || {};
        
        this.setValues(updatedAttributes);
        this.save(saveOptions);
      },
      
      reload: function() {
        console.log('reloading');
      },
      
      destroy: function(options) {
        var options = options || {};
        
        Ext.Ajax.request(
          Ext.applyIf(options, {
            url:    this.url(),
            method: 'post',
            params: "_method=delete"
          })
        );
      },
      
      /**
       * Namespaces fields within the modelName string, taking into account mappings.  For example, a model like:
       * 
       * modelName: 'user',
       * fields: [
       *   {name: 'first_name', type: 'string'},
       *   {name: 'last_name',  type: 'string', mapping: 'last'}
       * ]
       * 
       * Will be decoded to an object like:
       * 
       * {
       *   'user[first_name]': //whatever is in this.data.first_name
       *   'user[last]':       //whatever is in this.data.last_name
       * }
       *
       * Note especially that the mapping is used in the key where present.  This is to ensure that mappings work both
       * ways, so in the example above the server is sending a key called last, which we convert into last_name.  When we
       * send data back to the server, we convert last_name back to last.
       */
      namespaceFields: function() {
        var fields    = this.fields;
        var namespace = this.modelName;
        
        var nsfields = {};
        
        for (var i=0; i < fields.length; i++) {
          var item = fields.items[i];
          
          //don't send virtual fields back to the server
          if (item.virtual) {continue;}
          
          nsfields[String.format("{0}[{1}]", namespace.toLowerCase(), item.mapping || item.name)] = this.data[item.name];
        };
        
        //not sure why we ever needed this... 
        // for (f in fields) {
        //   nsfields[String.format("{0}[{1}]", namespace.toLowerCase(), this.data[f.name])] = fields.items[f];
        // }
        
        return nsfields;
      }
    }
  };
})();

ExtMVC.Model.AdapterManager.register('REST', ExtMVC.Model.Adapter.REST);

/**
 * @class ExtMVC.Model.ValidationErrors
 * Simple class to collect validation errors on a model and return them in various formats
 */
ExtMVC.Model.Validation.Errors = function(modelObject) {
  this.modelObject = modelObject;
};

ExtMVC.Model.Validation.Errors.prototype = {
  
  /**
   * @property errors
   * @type Array
   * Raw array of all errors attached to this model.  This is READ ONLY - do not interact with directly
   */
  errors: [],
  
  /**
   * Returns an errors object suitable for applying to a form via BasicForm's markInvalid() method
   * @return {Object} An object with field IDs as keys and formatted error strings as values
   */
  forForm: function() {
    var formErrors = {};
    Ext.each(this.modelObject.fields.items, function(field) {
      var fieldErrors = this.forField(field.name);
      if (fieldErrors.length > 0) {
        formErrors[field.name] = this.joinErrors(fieldErrors);
      };
    }, this);
    
    return formErrors;
  },
  
  /**
   * @property multipleErrorConnector
   * @type String
   * The string to use when connecting more than one error (defaults to 'and')
   */
  multipleErrorConnector: 'and',
  
  /**
   * Joins one or more errors into a human-readable sentence.  For example, there may be two errors on an email field:
   * ["can't be blank", "must be at least 6 characters", "must contain an @"].  This would return:
   * "can't be blank, must be at least 6 characters and must contain an @"
   * @param {Array} errors An array of error messages for a given field
   * @return {String} A human-readable errors sentence
   */
  joinErrors: function(errors) {
    var errors   = errors || [];
    var sentence = "";
    if (errors.length <= 1) { 
      sentence =  errors[0];
    } else {
      //we'll join all but the last error with commas
      var firstErrors = errors.slice(0, errors.length - 1);
      
      //add the last error, with the connector string
      sentence = String.format("{0} {1} {2}", firstErrors.join(", "), this.multipleErrorConnector, errors[errors.length - 1]);
    }
    
    ///add a full stop; sometimes one already present in which case remove final one
    return (/\.$/.test(sentence) ? sentence : sentence + ".").capitalize();
  },
  
  /**
   * Returns an array of all errors for the given field
   * @param {String} field The field to find errors for
   * @return {Array} An array of errors for this field
   */
  forField: function(field) {
    var errs = [];
    
    for (var i=0; i < this.errors.length; i++) {
      var error = this.errors[i];
      if (error[0] == field) { errs.push(error[1]); }
    };
    
    return errs;
  },
  
  /**
   * Returns true if this model currently has no validation errors
   * @return {Boolean} True if this model is currently valid
   */
  isValid: function(paramName) {
    return this.errors.length == 0;
  },
  
  /**
   * Removes all current validation errors
   */
  clearErrors: function() {
    this.errors = [];
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
        this.errors.push(rawErrors[i]);
      };
    };
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
    
    if (formFields = eval(String.format("{0}.views.{1}.FormFields", model.namespace.split(".")[0], model.modelName.pluralize()))) {
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
  preferredColumns: ['id', 'title', 'name', 'first_name', 'last_name', 'login', 'username', 'email', 'email_address', 'content', 'message'],
  
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
  wideColumns:   ['message', 'content', 'description', 'bio'],
  
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

