/**
 * Turns an array into a sentence, joined by a specified connector - e.g.:
 * ['Adama', 'Tigh', 'Roslin'].toSentence(); //'Adama, Tigh and Roslin'
 * ['Adama', 'Tigh', 'Roslin'].toSentence('or'); //'Adama, Tigh or Roslin'
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
  
  ///add a full stop; sometimes one already present in which case remove final one
  // return (/\.$/.test(sentence) ? sentence : sentence + ".");
};