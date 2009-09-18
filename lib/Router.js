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

  /**
   * Immediately redirects to the specified route.
   * @param {String} route The route 
   */
  route: function(route) {
    document.location.hash = route;
  },

  /**
   * Creates a handler for redirecting to the specified route
   * @param {String} route The route
   * @return {Function} handler A function that redirects to the route
   */
  handleRoute: function(url) {
    return this.route.createDelegate(this, [url]);
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
