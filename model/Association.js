ExtMVC.Model.Association = {
  
  /**
   * Returns the default association name for a given class (e.g. "Post" becomes "posts", "SecretAgent" becomes "secretAgents" etc)
   * @param {String} className The string name of the class which this belongs to
   * @return {String} The association name for this class
   */
  hasManyAssociationName: function(className) {
    return className.toLowerCase() + 's';
  },
  
  /**
   * Returns the default association name for a given class (e.g. "Post" becomes "post", "SecretAgent" becomes "secretAgent")
   * @param {String} className The string name of the class to calculate a belongsTo name for
   * @return {String} The association name for this class
   */
  belongsToAssociationName: function(className) {
    return className.toLowerCase();
  }
};



// //this is not currently used
// ExtMVC.Model.Association = function(ownerObject, config) {
//   var config = config || {};
//   
//   //set some sensible default values
//   Ext.applyIf(config, {
//     primaryKey:      'id',
//     foreignKey:      ownerObject.foreignKeyName,
//     extend:          {},
//     className:       (ownerObject.constructor.namespace ? ownerObject.constructor.namespace + '.' + config.name : config.name)
//   });
//   
//   // //get a reference to the class definition function of the associated object
//   // //(e.g. a hasMany: ['Post'] association will return a reference to Post)
//   // var associatedObjectClass = eval(config.className);
//   // 
//   // /**
//   //  * Private, calls the ownerObject's class method with the supplied args
//   //  */
//   // function callOwnerObjectClassMethod(method, args, scope) {
//   //   return ownerObject.constructor[method].apply(scope || ownerObject.constructor, args || []);
//   // };
//   // 
//   // /**
//   //  * Private, calls the associated object's class method with the supplied args
//   //  */
//   // function callAssociatedObjectClassMethod (method, args, scope) {
//   //   return associatedObjectClass[method].apply(scope || associatedObjectClass, args || []);
//   // }
// };