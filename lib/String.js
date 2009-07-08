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
