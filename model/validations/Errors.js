/**
 * @class ExtMVC.model.plugin.validation
 * @ignore
 */

/**
 * @class ExtMVC.model.plugin.validation.Errors
 * Simple class to collect validation errors on a model and return them in various formats. Usage:
<pre><code>
ExtMVC.model.define("SomeModel", {
  fields: [
    {name: 'title',  type: 'string'},
    {name: 'price',  type: 'int'},
    {name: 'stock',  type: 'int'},
    {name: 'colour', type: 'string'}
  ],
  
  validatesPresenceOf : ["title", "price"],
  validatesLengthOf   : {field: 'title', minimum: 3, maximum: 12}
});

var s = new SomeModel({title: 'Some really long title'});
s.errors; //returns this Errors object
s.isValid(); //returns false, same as calling s.errors.isValid()

//manually add a validation error on the title field
s.errors.add('title', 'has an problem of some kind');

this.errors.forField('title'); //returns an array of problems with the title field

this.errors.forForm(); //returns an object suitable for marking fields invalid on a form
</code></pre>
 */
ExtMVC.model.plugin.validation.Errors = function() {
  /**
   * @property errors
   * @type Object
   * Object containing all errors attached to this model.  This is READ ONLY - do not interact with directly
   */
  this.all = {};
};

ExtMVC.model.plugin.validation.Errors.prototype = {
  
  /**
   * Returns an errors object suitable for applying to a form via BasicForm's markInvalid() method
   * @return {Object} An object with field IDs as keys and formatted error strings as values
   */
  forForm: function() {
    var formErrors = {};
    for (key in this.all) {
      formErrors[key] = this.forField(key, true);
    }
    
    return formErrors;
  },
  
  /**
   * @property multipleErrorConnector
   * @type String
   * The string to use when connecting more than one error (defaults to 'and')
   */
  multipleErrorConnector: 'and',
  
  /**
   * Clears out all errors
   */
  clear: function() {
    this.all = {};
  },
  
  /**
   * Adds an error to a particular field
   * @param {String} field The field to add an error onto
   * @param {String} error The error message
   */
  add: function(field, error) {
    this.all[field] = this.all[field] || [];
    this.all[field].push(error);
  },
  
  /**
   * Returns an array of all errors for the given field.  Pass true as a second argument to
   * return a human-readable string, e.g.:
<pre><code>
forField('title'); // ['must be present', 'is too short']
forField('title', true); // 'must be present and is too short'
</code></pre>
   * @param {String} field The field to find errors for
   * @param {Boolean} humanize True to turn the errors array into a human-readable string (defaults to false)
   * @return {Array|String} An array of errors for this field, or a string 
   */
  forField: function(field, humanize) {
    humanize = humanize || false;
    var errs = this.all[field] || [];
        
    return humanize ? errs.toSentence(this.multipleErrorConnector) : errs;
  },
  
  /**
   * Returns true if this model currently has no validation errors
   * @return {Boolean} True if this model is currently valid
   */
  isValid: function(paramName) {
    for (key in this.all) {return false;}
    
    return true;
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
        this.all.push(rawErrors[i]);
      };
    };
  }
};