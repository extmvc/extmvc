Ext.ns('ExtMVC.Model.plugin.validation');

/**
 * @ignore
 * The Validation classes themselves are defined here.
 * Subclass ExtMVC.Model.plugin.validation.AbstractValidation to create your own validations
 */

/**
 * @class ExtMVC.Model.plugin.validation.AbstractValidation
 * Base class for all validations - don't use this directly but use a subclass
 */
ExtMVC.Model.plugin.validation.AbstractValidation = function(ownerClass, field, config) {
  this.ownerClass = ownerClass;
  this.field = field;
  
  Ext.apply(this, config);
};

ExtMVC.Model.plugin.validation.AbstractValidation.prototype = {
  /**
   * Returns the current value of the field to which this validation applies
   * @param {ExtMVC.Model.Base} instance The model instance to get the value from
   * @return {Mixed} The current value of the field
   */
  getValue: function(instance) {
    return instance.get(this.field);
  },
  
  /**
   * Empty function which must be overridden by a validation subclass. Make your function return
   * true if the validation passes, false otherwise
   * @return {Boolean} True if this validation passes
   */
  isValid: function(instance) {
    return true;
  }
};

/**
 * @class ExtMVC.Model.plugin.validation.ValidatesPresenceOf
 * @extends ExtMVC.Model.plugin.validation.AbstractValidation
 * Ensures that a field is present
 */
ExtMVC.Model.plugin.validation.ValidatesPresenceOf = Ext.extend(ExtMVC.Model.plugin.validation.AbstractValidation, {
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
  isValid: function(instance) {
    var value = this.getValue(instance),
        valid = false;
    
    switch(typeof value) {
      case 'object': if (value != null)     valid = true; break;
      case 'string': if (value.length != 0) valid = true; break;
    };
    
    return valid;
  }
});

/**
 * @class ExtMVC.Model.plugin.validation.ValidatesLengthOf
 * @extends ExtMVC.Model.plugin.validation.AbstractValidation
 * Returns true if the field is within the length bounds imposed.
 */
ExtMVC.Model.plugin.validation.ValidatesLengthOf = Ext.extend(ExtMVC.Model.plugin.validation.AbstractValidation, {
  
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
  isValid: function(instance) {
    var value = this.getValue(instance);
    
    if (typeof value == 'undefined') return true;
        
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
 * @class ExtMVC.Model.plugin.validation.ValidatesNumericalityOf
 * @extends ExtMVC.Model.plugin.validation.AbstractValidation
 * Ensures that the field is a number
 */
ExtMVC.Model.plugin.validation.ValidatesNumericalityOf = Ext.extend(ExtMVC.Model.plugin.validation.AbstractValidation, {
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
  isValid: function(instance) {
    return 'number' == typeof this.getValue(instance);
  }
});

/**
 * @class ExtMVC.Model.plugin.validation.ValidatesInclusionOf
 * @extends ExtMVC.Model.plugin.validation.AbstractValidation
 * Ensures that the field is one of the allowed values
 */
ExtMVC.Model.plugin.validation.ValidatesInclusionOf = Ext.extend(ExtMVC.Model.plugin.validation.AbstractValidation, {


  /**
   * Override Abstract constructor to build the validation message
   */
  constructor: function(m, f, config) {
    //set up defaults
    config = config || {};
    Ext.applyIf(config, { allowed: [] });
    
    ExtMVC.Model.plugin.validation.ValidatesInclusionOf.superclass.constructor.call(this, m, f, config);
    
    Ext.applyIf(this, {
      message: 'must be one of ' + this.allowed.toSentence('or')
    });
  },
  
  /**
   * Returns true if the value of this field is one of those specified in this.allowed
   * @return {Boolean} True if the field's value is allowed
   */
  isValid: function(instance) {
    var value = this.getValue(instance);
    
    for (var i=0; i < this.allowed.length; i++) {
      if (this.allowed[i] == value) return true;
    };
    
    return false;
  }
});

/**
 * @class ExtMVC.Model.plugin.validation.ValidatesExclusionOf
 * @extends ExtMVC.Model.plugin.validation.AbstractValidation
 * Ensures that the field is not one of the allowed values
 */
ExtMVC.Model.plugin.validation.ValidatesExclusionOf = Ext.extend(ExtMVC.Model.plugin.validation.AbstractValidation, {

  /**
   * Override Abstract constructor to build the validation message
   */
  constructor: function(m, f, config) {
    //set up defaults
    config = config || {};
    Ext.applyIf(config, { disallowed: [] });
    
    ExtMVC.Model.plugin.validation.ValidatesExclusionOf.superclass.constructor.call(this, m, f, config);
    
    Ext.applyIf(this, {
      message: 'must not be ' + this.disallowed.toSentence('or')
    });
  },
  
  /**
   * Returns true if the value of this field is one of those specified in this.allowed
   * @return {Boolean} True if the field's value is allowed
   */
  isValid: function(instance) {
    var value = this.getValue(instance),
        valid = true;
    
    for (var i=0; i < this.disallowed.length; i++) {
      if (this.disallowed[i] == value) valid = false;
    };
    
    return valid;
  }
});

/**
 * @class ExtMVC.Model.plugin.validation.ValidatesFormatOf
 * @extends ExtMVC.Model.plugin.validation.AbstractValidation
 * Ensures that the field matches the given regular expression
 */
ExtMVC.Model.plugin.validation.ValidatesFormatOf = Ext.extend(ExtMVC.Model.plugin.validation.AbstractValidation, {
  
  /**
   * @property message
   * @type String
   * The default message to return if this validation does not pass
   */
  message: 'is invalid',
  
  /**
   * Returns true if the value of this field matches the suppled regular expression
   * @return {Boolean} True if the field's value matches
   */
  isValid: function(instance) {
    return this.regex.test(this.getValue(instance));
  }
});