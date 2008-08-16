/**
 * 
 * 
 */
Ext.ux.MVC.Route = function(mappingString, options) {
  var options = options || {};
  
  if (!mappingString) {throw new Error("You must supply a mapping string");};
  this.mappingString = mappingString;
  
  Ext.applyIf(options, {
    
  });
  
  this.options = options;
  
  //The regular expression we use to match a segment of a route mapping
  //this will recognise segments starting with a colon,
  //e.g. on 'namespace/:controller/:action', :controller and :action will be recognised
  this.paramMatchingRegex = new RegExp(/:([0-9A-Za-z\_]*)/g);
  
  /**
   * Converts a route string into an array of symbols starting with a colon. e.g.
   * ":controller/:action/:id" => [':controller', ':action', ':id']
   */
  this.paramsInMatchString = this.mappingString.match(this.paramMatchingRegex);
  
  this.matcherRegex = this.convertToUsableRegex(mappingString);
};

Ext.ux.MVC.Route.prototype = {
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
    
    var parameters = [];
    
    var keys = this.paramsInMatchString;
    var values = url.match(this.matcherRegex);
    values.shift(); //first value is the entire match so reject
    
    for (var i = keys.length - 1; i >= 0; i--){
      parameters[keys[i]] = values[i];
    };
    
    //add any additional parameter options specified in the route definition
    for (option in this.options) {
      parameters[option] = this.options[option];
    }
    
    return parameters;
  },
  
  /**
   * Private: For a given string, replaces all substrings starting with a colon into
   * a regex string that can match a url segment. 
   * e.g. :controller/:action => '^([a-zA-Z0-9\_]+)/([a-zA-Z0-9\_]+)$'
   * @param {String} regex_string The string we want to turn into a matchable regex
   * @return {String} The replaced string
   */
  convertToUsableRegex: function(regex_string) {
    var p = this.paramsInMatchString;
    
    for (var i = p.length - 1; i >= 0; i--){
      regex_string = regex_string.replace(new RegExp(p[i]), "([a-zA-Z0-9\_,]+)");
    };
    
    //we want to match the whole string, so include the anchors
    return new RegExp("^" + regex_string + "$");
  }
};