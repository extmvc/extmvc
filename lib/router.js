Ext.ux.MVC.Router = function(config) {
  var config = config || {};
  this.mappings = [];
  
  this.connect = function(re, additional_params) {
    var route = new Ext.ux.MVC.Route(re, additional_params);
    this.mappings.push(route);
  };
  
  this.resources = function(resource_name) {
    
  };
  
  /**
   * @params {String} url The url to be matched by the Router.  Router will match against
   * all connected matchers in the order they were connected and return an object created
   * by parsing the url with the first matching matcher as defined using the connect() method
   * @returns {Object} Object of all matches to this url
   */
  this.recognise = function(url) {
    for (var i=0; i < this.mappings.length; i++) {
      var m = this.mappings[i];
      
      if (m.recognises(url)) {
        return m.matchesFor(url);
      };
    };
    
    throw new Error("No route matches url " + url);
  };
};
