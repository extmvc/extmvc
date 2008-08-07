String.capitalize = function(word) {
  return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
};

String.titleize = function(word) {
  return word.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

/**
 * Takes any string and de-underscores and uppercases it
 * e.g. long_underscored_string => LongUnderscoredString
 */
String.camelize = function(class_name_string) {
  return String.titleize(class_name_string.replace(/_/g, " ")).replace(/ /g, "");

  // this feels nicer, sadly no collect function (yet) though
  // class_name_string.split("_").collect(function(e) {return String.capitalize(e)}).join("");
};