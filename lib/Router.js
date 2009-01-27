Ext.ux.MVC.Router = function(config) {
  var config = config || {};
  this.mappings = [];
};

Ext.ux.MVC.Router.prototype = {
  
  /**
   * Adds a new route to the collection.  Routes are given priority in the order they are added
   * @param {String} re The regular expression-style string to match (e.g. ":controller/:action/:id")
   * @param {Object} additional_params Any additional options which will be returned along with the match elements if the route matches
   */
  connect: function(re, additional_params) {
    var route = new Ext.ux.MVC.Route(re, additional_params);
    this.mappings.push(route);
  },
  
  /**
   * Same as calling connect("", options) - connects the empty route string to a controller/action pair
   * @params {Object} options An object containing at least a controller and optionally an action (which is otherwise defaulted to index)
   */
  root: function(options) {
    this.connect("", options);
  },
  
  /**
   * Adds specific index, new, show and edit routes for this resource. e.g.:
   * resources('videos') is equivalent to:
   * connect('videos',          {controller: 'videos', action: 'index'});
   * connect('videos/new',      {controller: 'videos', action: 'new'  });
   * connect('videos/:id',      {controller: 'videos', action: 'show' });
   * connect('videos/:id/edit', {controller: 'videos', action: 'edit' });
   *
   * You can pass a second parameter which is an options object, e.g.:
   * resources('videos', {controller: 'myController', myKey: 'myValue'}) sets up the following:
   * connect('videos',          {controller: 'myController', myKey: 'myValue', action: 'index'});
   * connect('videos/new',      {controller: 'myController', myKey: 'myValue', action: 'new'  });
   * connect('videos/:id',      {controller: 'myController', myKey: 'myValue', action: 'show' });
   * connect('videos/:id/edit', {controller: 'myController', myKey: 'myValue', action: 'edit' });
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
    
    //set a controller name if one is not provided
    var opts = {};
    Ext.applyIf(opts, { controller: resource_name });
    
    this.withOptions(opts, function(res) {
      res.connect(resource_name,               {action: 'index'});
      res.connect(resource_name + '/new',      {action: 'new'  });
      res.connect(resource_name + '/:id',      {action: 'show' });
      res.connect(resource_name + '/:id/edit', {action: 'edit' });
    });
  },
  
  /**
   * Given a hash containing at route segment options (e.g. {controller: 'index', action: 'welcome'}),
   * attempts to generate a url and redirect to it using Ext.History.add
   * @param {Object} options An object containing url segment options (such as controller and action)
   * @return {Boolean} True if a url was generated and redirected to
   */
  redirectTo: function(options) {
    var url = this.urlFor(options);
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
      singularName: urlOptions.controller.replace(/s$/, '') //naive singulariser.  TODO: build an inflector
    });
    
    var actionName = urlOptions.action.titleize();
    if (actionName == 'Index') {
      return "Show " + urlOptions.controller.titleize();
    } else {
      return actionName + " " + linkOptions.singularName.titleize();
    }
  },
  
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
      }
    });
    
    routes.call(this, optionScope);
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
      
      if (m.recognises(url)) {
        return m.matchesFor(url);
      };
    };
  },
  
  /**
   * Takes an object of url generation options such as controller and action.  Returns a generated url.
   * For a url to be generated, all of these options must match the requirements of at least one route definition
   * @param {Object} options An object containing url options.
   * @return {String} The generated url, or false if there was no match
   */
  urlFor: function(options) {
    for (var i=0; i < this.mappings.length; i++) {
      var m = this.mappings[i]; var u = m.urlFor(options);
      if (u) { return u; }
    };
    
    //there were no matches so return false
    return false;
  }
};

/**
 * Basic default routes.  Redefine this method inside config/routes.js
 */
Ext.ux.MVC.Router.defineRoutes = function(map) {
  map.connect(":controller/:action");
  map.connect(":controller/:action/:id");
};