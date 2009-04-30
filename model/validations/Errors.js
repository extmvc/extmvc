/**
 * @class ExtMVC.Model.ValidationErrors
 * Simple class to collect validation errors on a model and return them in various formats
 */
ExtMVC.Model.ValidationErrors = function(modelObject) {
  this.modelObject = modelObject;
};

ExtMVC.Model.ValidationErrors.prototype = {
  
  /**
   * @property errors
   * @type Array
   * Raw array of all errors attached to this model.  This is READ ONLY - do not interact with directly
   */
  errors: [],
  
  /**
   * Returns an errors object suitable for applying to a form via BasicForm's markInvalid() method
   * @return {Object} An object with field IDs as keys and formatted error strings as values
   */
  forForm: function() {
    var formErrors = {};
    Ext.each(this.modelObject.fields.items, function(field) {
      var fieldErrors = this.forField(field.name);
      if (fieldErrors.length > 0) {
        formErrors[field.name] = this.joinErrors(fieldErrors);
      };
    }, this);
    
    return formErrors;
  },
  
  /**
   * @property multipleErrorConnector
   * @type String
   * The string to use when connecting more than one error (defaults to 'and')
   */
  multipleErrorConnector: 'and',
  
  /**
   * Joins one or more errors into a human-readable sentence.  For example, there may be two errors on an email field:
   * ["can't be blank", "must be at least 6 characters", "must contain an @"].  This would return:
   * "can't be blank, must be at least 6 characters and must contain an @"
   * @param {Array} errors An array of error messages for a given field
   * @return {String} A human-readable errors sentence
   */
  joinErrors: function(errors) {
    var errors   = errors || [];
    var sentence = "";
    if (errors.length <= 1) { 
      sentence =  errors[0];
    } else {
      //we'll join all but the last error with commas
      var firstErrors = errors.slice(0, errors.length - 1);
      
      //add the last error, with the connector string
      sentence = String.format("{0} {1} {2}", firstErrors.join(", "), this.multipleErrorConnector, errors[errors.length - 1]);
    }
    
    ///add a full stop; sometimes one already present in which case remove final one
    return (/\.$/.test(sentence) ? sentence : sentence + ".").capitalize();
  },
  
  /**
   * Returns an array of all errors for the given field
   * @param {String} field The field to find errors for
   * @return {Array} An array of errors for this field
   */
  forField: function(field) {
    var errs = [];
    
    for (var i=0; i < this.errors.length; i++) {
      var error = this.errors[i];
      if (error[0] == field) { errs.push(error[1]); }
    };
    
    return errs;
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
   * an implementation for your own server responses.  The default implementation accepts a response like this:
   * {errors: [['some_field', 'some error regarding some_field'], ['another_field', 'another error']]}
   * @param {Object/String} serverErrors A errors object returned by server-side validations.  If this is a string it will
   * @param {Boolean} preserveErrors False to clear all errors before adding errors from server (defaults to false)
   * automatically be turned into an object via Ext.decode
   */
  readServerErrors: function(serverErrors, preserveErrors) {
    var serverErrors = serverErrors || {};
    
    //remove any existing errors unless instructed to preserve them
    if (preserveErrors !== true) {this.clearErrors();}
    
    //make sure we're dealing with an object
    if (typeof(serverErrors) == 'string') {
      serverErrors = Ext.decode(serverErrors);
    };
    
    var rawErrors = serverErrors.errors;
    if (rawErrors) {
      for (var i=0; i < rawErrors.length; i++) {
        this.errors.push(rawErrors[i]);
      };
    };
  }
};