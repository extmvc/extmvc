Ext.ux.MVC.Router = function(config) {
  var config = config || {};
  this.mappings = [];
  
  this.connect = function(re) {
    this.mappings.push(re);
  };
  
  //private
  this.split = function(pattern) {
    result = {};
    for (var i=0; i < this.mappings.length; i++) {
      var m = this.mappings[i];

      var re = new RegExp(this.convert_regex(m));
      var match = pattern.match(re);

      if (match && match.length > 0) {
        //first match is the whole route, so ignore it
        match.shift();
        return match;
      };
    };
  };
  
  //private
  this.convert_regex = function(regex_string) {
    //create a more usable regex to test against
    //essentially swapping any colon followed by letters + numbers with a group matcher, e.g.:
    //':controller/:action' => '([a-zA-Z0-9\_]+)/([a-zA-Z0-9\_]+)'
    var route_params = this.params_for(regex_string);
    for (var i = route_params.length - 1; i >= 0; i--){
      regex_string = regex_string.replace(new RegExp(route_params[i]), "([a-zA-Z0-9\_,]+)");
    };
    
    //we want to match the whole string, so include the anchors
    return "^" + regex_string + "$";
  };
  
  /**
   * Converts a route string into an array of symbols starting with a colon. e.g.
   * params_for(":controller/:action/:id") => [':controller', ':action', ':id']
   * @cfg {String} route_string The string to be matched for symbols starting with a colon
   * @return {Array} array of matching elements from the string
   */
  this.params_for = function(route_string) {
    var exp = new RegExp(/:([0-9A-Za-z\_]*)/g);
    return route_string.match(exp);
  };
  
  /**
   * Returns the highest matching mapping for this url
   */
  this.matching_route_for = function(url) {
    for (var i=0; i < this.mappings.length; i++) {
      var m = this.mappings[i];
      
      if (new RegExp(this.convert_regex(m)).test(url)) {
        return m;
      }
    };
  };
  
  this.recognise = function(url) {
    var parameters = [];
    
    var keys = this.params_for(this.matching_route_for(url));
    var values = this.split(url);
    
    for (var i = keys.length - 1; i >= 0; i--){
      parameters[keys[i]] = values[i];
    };
    
    return parameters;
  };
};
