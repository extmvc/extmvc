Ext.ns('ExtMVC.model.plugin.validation');

/**
 * @ignore
 * The Validation classes themselves are defined here.
 * Subclass ExtMVC.model.plugin.validation.AbstractValidation to create your own validations
 */

/**
 * @class ExtMVC.model.plugin.validation.AbstractValidation
 * Base class for all validations - not used directly, but any of the following may be used:
<pre><code>
ExtMVC.model.define("SomeModel", {
  fields: [
    {name: 'title',  type: 'string'},
    {name: 'price',  type: 'int'},
    {name: 'stock',  type: 'int'},
    {name: 'gender', type: 'string'},
    {name: 'colour', type: 'string'}
  ],
  
  validatesPresenceOf : ["title", "price"],
  validatesLengthOf   : {field: 'title', minimum: 3, maximum: 12},
  
  validatesInclusionOf: {field: 'gender', allowed   : ["Male", "Female"]},
  validatesExclusionOf: {field: 'colour', disallowed: ["Red"]},
  validatesFormatOf   : {field: 'email',  regex: /someRegex/},
  
  validatesNumericalityOf: "stock"
});
</code></pre>
 * 
 * Most validations will allow an array to be passed to set the validation up on more than one field (e.g.
 * see the validatesPresenceOf declaration above). If only a string is provided it is assume to be the field name.
 * The following are all equivalent:
<pre><code>
validatesPresenceOf: "title"
validatesPresenceOf: ["title"]
validatesPresenceOf: {field: "title"}
validatesPresenceOf: [{field: "title"}]
</code></pre>
 * 
 * <h2>Running validations</h2>
 * This plugin overrides ExtMVC.model.Base's usual isValid() function to provide feedback from the validations:
 * 
<pre><code>
var user = new SomeModel({title: "A really long title", colour: "Blue"});
user.isValid(); //returns false if any of the validations failed
user.errors; //returns an {@link ExtMVC.model.plugin.validation.Errors Errors} object
</code></pre>
 */
ExtMVC.model.plugin.validation.AbstractValidation = function(ownerClass, field, config) {
  this.ownerClass = ownerClass;
  this.field = field;
  
  Ext.apply(this, config);
};

ExtMVC.model.plugin.validation.AbstractValidation.prototype = {
  /**
   * Returns the current value of the field to which this validation applies
   * @param {ExtMVC.model.Base} instance The model instance to get the value from
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
 * @class ExtMVC.model.plugin.validation.ValidatesPresenceOf
 * @extends ExtMVC.model.plugin.validation.AbstractValidation
 * Ensures that a field is present. See {*link ExtMVC.model.plugin.validation.AbstractValidation AbstractValidation} for example.
 */
ExtMVC.model.plugin.validation.ValidatesPresenceOf = Ext.extend(ExtMVC.model.plugin.validation.AbstractValidation, {
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
 * @class ExtMVC.model.plugin.validation.ValidatesLengthOf
 * @extends ExtMVC.model.plugin.validation.AbstractValidation
 * Returns true if the field is within the length bounds imposed. See {*link ExtMVC.model.plugin.validation.AbstractValidation AbstractValidation} for example.
 */
ExtMVC.model.plugin.validation.ValidatesLengthOf = Ext.extend(ExtMVC.model.plugin.validation.AbstractValidation, {
  
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
 * @class ExtMVC.model.plugin.validation.ValidatesNumericalityOf
 * @extends ExtMVC.model.plugin.validation.AbstractValidation
 * Ensures that the field is a number. See {*link ExtMVC.model.plugin.validation.AbstractValidation AbstractValidation} for example.
 */
ExtMVC.model.plugin.validation.ValidatesNumericalityOf = Ext.extend(ExtMVC.model.plugin.validation.AbstractValidation, {
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
 * @class ExtMVC.model.plugin.validation.ValidatesInclusionOf
 * @extends ExtMVC.model.plugin.validation.AbstractValidation
 * Ensures that the field is one of the allowed values. See {*link ExtMVC.model.plugin.validation.AbstractValidation AbstractValidation} for example.
 */
ExtMVC.model.plugin.validation.ValidatesInclusionOf = Ext.extend(ExtMVC.model.plugin.validation.AbstractValidation, {


  /**
   * Override Abstract constructor to build the validation message
   */
  constructor: function(m, f, config) {
    //set up defaults
    config = config || {};
    Ext.applyIf(config, { allowed: [] });
    
    ExtMVC.model.plugin.validation.ValidatesInclusionOf.superclass.constructor.call(this, m, f, config);
    
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
 * @class ExtMVC.model.plugin.validation.ValidatesExclusionOf
 * @extends ExtMVC.model.plugin.validation.AbstractValidation
 * Ensures that the field is not one of the allowed values. See {*link ExtMVC.model.plugin.validation.AbstractValidation AbstractValidation} for example.
 */
ExtMVC.model.plugin.validation.ValidatesExclusionOf = Ext.extend(ExtMVC.model.plugin.validation.AbstractValidation, {

  /**
   * Override Abstract constructor to build the validation message
   * @ignore
   */
  constructor: function(m, f, config) {
    //set up defaults
    config = config || {};
    Ext.applyIf(config, { disallowed: [] });
    
    ExtMVC.model.plugin.validation.ValidatesExclusionOf.superclass.constructor.call(this, m, f, config);
    
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
 * @class ExtMVC.model.plugin.validation.ValidatesFormatOf
 * @extends ExtMVC.model.plugin.validation.AbstractValidation
 * Ensures that the field matches the given regular expression. See {*link ExtMVC.model.plugin.validation.AbstractValidation AbstractValidation} for example.
 */
ExtMVC.model.plugin.validation.ValidatesFormatOf = Ext.extend(ExtMVC.model.plugin.validation.AbstractValidation, {
  
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