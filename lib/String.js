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
