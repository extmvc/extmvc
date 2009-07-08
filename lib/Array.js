/**
 * @class Array
 * Extensions to the array class
 */

/**
 * Turns an array into a sentence, joined by a specified connector - e.g.:
 * ['Adama', 'Tigh', 'Roslin'].toSentence(); //'Adama, Tigh and Roslin'
 * ['Adama', 'Tigh', 'Roslin'].toSentence('or'); //'Adama, Tigh or Roslin'
 * @param {String} connector The string to use to connect the last two words. Usually 'and' or 'or', defaults to 'and'
 */
Array.prototype.toSentence = function(connector) {
  connector = connector || 'and';
  
  var sentence = "";
  if (this.length <= 1) { 
    sentence = this[0];
  } else {
    //we'll join all but the last error with commas
    var firstErrors = this.slice(0, this.length - 1);
    
    //add the last error, with the connector string
    sentence = String.format("{0} {1} {2}", firstErrors.join(", "), connector, this[this.length - 1]);
  }
  return sentence;
};