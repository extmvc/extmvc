String.capitalize = function(word) {
  return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
};

String.titleize = function(word) {
  return word.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};