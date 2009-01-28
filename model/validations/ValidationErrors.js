Ext.ux.MVC.Model.Validation.Errors = function() {
  
};

Ext.ux.MVC.Model.Validation.Errors.prototype = {
  
  /**
   * @property errors
   * @type Array
   * Raw array of all errors attached to this model
   */
  errors: [],
  
  /**
   * Returns an errors object suitable for applying to a form via BasicForm's markInvalid() method
   * @return {Object} An object with field IDs as keys and formatted error strings as values
   */
  forForm: function() {
    
  },
  
  /**
   * Returns true if this model currently has no validation errors
   * @return {Boolean} True if this model is currently valid
   */
  isValid: function(paramName) {
    return this.errors.length == 0;
  },
  
  /**
   * Removes all current validation errors
   */
  clearErrors: function() {
    this.errors = [];
  },
  
  /**
   * Parses server response to a failed save, adding each error message to the appropriate field.  Override to provide
   * an implementation for your own server responses
   * @param {Object/String} serverErrors A errors object returned by server-side validations.  If this is a string it will
   * automatically be turned into an object via Ext.decode
   */
  readServerErrors: function(serverErrors) {
    var serverErrors = serverErrors || {};
    if (typeof(serverErrors) == 'string') {
      serverErrors = Ext.decode(serverErrors);
    };
    
    console.log('reading errors');
    
    console.log(serverErrors.errors);
    console.log(serverErrors);
    // console.log(this.errorReader.read(serverErrors.errors));
    
    var rawErrors = serverErrors.errors;
    if (rawErrors) {
      for (var i=0; i < rawErrors.length; i++) {
        console.log(rawErrors[i]);
      };
    };
  }
}