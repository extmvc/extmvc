/**
 * This is the Validation plugin definition, which mixes in validation.Errors
 * and some other functions into a model prototype
 * @ignore
 */

/**
 * Overrides Ext.data.Record's isValid() function.
 * We apply this to Record's prototype as there is no need to define it per model or instance
 * @ignore
 */
Ext.apply(Ext.data.Record.prototype, {
  isValid: function() {
    if (this.validations) {
      if (!this.errors) this.errors = new ExtMVC.model.plugin.validations.Errors();
      
      this.errors.clear();
      
      //test each validation, add to errors if any fail
      Ext.each(this.validations, function(validation) {
        if (!validation.isValid(this)) {
          this.errors.add(validation.field, validation.message);
        };
      }, this);
    };
    
    return this.errors.isValid();
  }
});

/**
 * @ignore
 * FIXME: This is possibly the most horrendous hack ever. I'm so sorry :(
 * 
 * The basic problem is that we need to add an errors object to every Record instance,
 * which means we need to hook into the constructor somehow.  Sadly everything I tried
 * to overload the constructor directly failed, so this horrific hack has been done instead
 */
(function() {
  var oldPrototype       = Ext.data.Record.prototype,
      oldConstructor     = Ext.data.Record,
      oldFunctionMethods = {};

  for (var method in Ext.data.Record) {
    oldFunctionMethods[method] = Ext.data.Record[method];
  }

  Ext.data.Record = function(data, id) {
    oldConstructor.apply(this, arguments);

    this.errors = new ExtMVC.model.plugin.validation.Errors();
  };

  for (var method in oldFunctionMethods) {
    Ext.data.Record[method] = oldFunctionMethods[method];
  }
})();
/**
 * Again, I'm really sorry :(
 * @ignore
 */

/**
 * @class ExtMVC.model.plugin.validation.Plugin
 */
ExtMVC.model.plugin.validation.Plugin = {
  /**
   * Initializes this plugin for a given model.  This is called every time a model is *created*
   * via ExtMVC.model.create, not when a model object is *instantiated*
   * @param {ExtMVC.model} model The model to initialize the plugin for
   */
  initialize: function(model) {
    this.model = model;
    
    Ext.apply(model.prototype, {
      /**
       * @property validations
       * @type Array
       * An array of all validations performed on this model
       */
      validations: this.parseValidations()
    });
  },
  
  /**
   * Parses a defined model's prototype for validation declarations and creates validation instances
   * @return {Array} An Array of validation objects
   */
  parseValidations: function() {
    var validations = [];
    
    for (var validation in ExtMVC.model.plugin.validation) {
      if (/^validate/.test(validation.toLowerCase())) {
        
        //for each validation type defined on ExtMVC.model.plugin.validation, check to see if we are using
        //it in on our model
        for (var modelKey in this.model.prototype) {
          if (modelKey.toLowerCase() == validation.toLowerCase()) {
            //this validation is being used by the model, so add it now
            var validationConstructor = ExtMVC.model.plugin.validation[validation],
                validationOptions     = this.model.prototype[modelKey];
            
            if (!Ext.isArray(validationOptions)) {
              validationOptions = [validationOptions];
            };
            
            Ext.each(validationOptions, function(options) {
              validations.push(this.buildValidation(validationConstructor, options));
            }, this);
          };
        }
      };
    }
    
    return validations;
  },
  
  /**
   * Creates a new Validation object based on the passed constructor and options
   * @param {Function} validation The validation constructor function
   * @param {Object|String} options A fieldname string, or config object
   * @return {ExtMVC.model.plugin.validation.AbstractValidation} The validation instance
   */
  buildValidation: function(validation, options) {
    var field, config = {};
    
    if (typeof options == 'string') {
      field = options;
    } else {
      field = options.field;
      delete options.field;
      config = options;
    }
    
    return new validation(this.model, field, config);
  }
};

ExtMVC.model.addPlugin(ExtMVC.model.plugin.validation.Plugin);