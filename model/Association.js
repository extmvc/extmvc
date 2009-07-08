/**
 * class ExtMVC.model.Association
 * @ignore
 */
ExtMVC.model.Association = {
  
  /**
   * @ignore
   * Returns the default association name for a given class (e.g. "Post" becomes "posts", "SecretAgent" becomes "secretAgents" etc)
   * @param {String} className The string name of the class which this belongs to
   * @return {String} The association name for this class
   */
  hasManyAssociationName: function(className) {
    return className.toLowerCase() + 's';
  },
  
  /**
   * @ignore
   * Returns the default association name for a given class (e.g. "Post" becomes "post", "SecretAgent" becomes "secretAgent")
   * @param {String} className The string name of the class to calculate a belongsTo name for
   * @return {String} The association name for this class
   */
  belongsToAssociationName: function(className) {
    return className.toLowerCase();
  }
};