/**
 * @param {String} str A string to be capitalized
 * @returns A capitalized string (e.g. "some test sentence" becomes "Some test sentence")
 * @type String
 */
String.capitalize = function(str) {
  return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
};

/**
 * @param {String} str A string to be turned into title case
 * @returns The string in Title Case (e.g. "some test sentence" becomes "Some Test Sentence")
 * @type String
 */
String.titleize = function(str) {
  return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};