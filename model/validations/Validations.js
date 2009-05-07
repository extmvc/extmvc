Ext.ns('ExtMVC.Model.validation');

(function() {
  //local reference to save my fingers, object lookups (maybe?) and # bytes
  var V = ExtMVC.Model.validation;
  
  /**
   * @class ExtMVC.Model.validation.AbstractValidation
   * Base class for all validations - don't use this directly but use a subclass
   */
  V.AbstractValidation = function(modelObject, field, config) {
    this.modelObject = modelObject;
    this.field = field;
    
    Ext.apply(this, config);
  };

  V.AbstractValidation.prototype = {
    /**
     * Empty function which must be overridden by a validation subclass. Make your function return
     * true if the validation passes, false otherwise
     * @return {Boolean} True if this validation passes
     */
    isValid: function() {return true;}
  };
  
  /**
   * @class ExtMVC.model.validation.ValidatesPresenceOf
   * @extends ExtMVC.model.validation.AbstractValidation
   * Ensures that a field is present
   */
  V.ValidatesPresenceOf = Ext.extend(V.AbstractValidation, {
    /**
     * @property message
     * @type String
     * The textual message returned if this validation didn't pass
     */
    message: 'must be present',
    
    /**
     * Returns true if the field is an object or a non-empty string
     * @return {Boolean} True if the field is present
     */
    isValid: function() {
      var value = this.modelObject.get(this.field),
          valid = false;
      
      switch(typeof value) {
        case 'object': if (value != null)     valid = true; break;
        case 'string': if (value.length != 0) valid = true; break;
      };
      
      return valid;
    }
  });
  
  /**
   * @class V.ValidatesLengthOf
   * @extends V.AbstractValidation
   * Returns true if the field is within the length bounds imposed.
   */
  V.ValidatesLengthOf = Ext.extend(V.AbstractValidation, {
    
    /**
     * @property tooShortMessage
     * @type String
     * The message returned if this field was too short
     */
    tooShortMessage: 'is too short',
    
    /**
     * @property tooLongMessage
     * @type String
     * The message returned if this field was too long
     */
    tooLongMessage: 'is too long',
    
    message: '',
  
    /**
     * Tests that the mimimum and maximum length of this field are met.
     * Intended to be used on strings and arrays
     * @return {Boolean} True if the conditions are met
     */
    isValid: function() {
      var value = this.modelObject.get(this.field);
          
      if (this.minimum && value.length < this.minimum) {
        this.message = this.tooShortMessage;
        return false;
      }
      
      if (this.maximum & value.length > this.maximum) {
        this.message = this.tooLongMessage;
        return false;
      }
      
      return true;
    }
  });
  
  /**
   * @class V.ValidatesNumericalityOf
   * @extends V.AbstractValidation
   * Ensures that the field is a number
   */
  V.ValidatesNumericalityOf = Ext.extend(V.AbstractValidation, {
    /**
     * @property message
     * @type String
     * The message returned if this field is not a number
     */
    message: 'must be a number',
    
    /**
     * Returns true if the typeof this field is a number
     * @return {Boolean} True if this is a number
     */
    isValid: function() {
      return 'number' == typeof this.modelObject.get(this.field);
    }
  });
})();