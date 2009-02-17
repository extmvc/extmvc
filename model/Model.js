/**
 * ExtMVC.Model
 * @extends Ext.util.Observable
 * Base model class
 */
ExtMVC.Model = function(fields, config) {
  Ext.applyIf(this, {
    /**
     * @property newRecord
     * @type Boolean
     * True if this record is newly created and has not yet been successfully saved
     */
    newRecord: fields.id ? false : true
  });
  
  //create a new Record object and then decorate it with RecordExtensions
  var record = ExtMVC.Model.recordFor(this.modelName, fields);
  var rec = new record(fields || {});
  rec.init(this);
  
  Ext.applyIf(this, this.constructor.instanceMethods);
  
  //add any hasMany associations
  var hm = this.constructor.hasMany;
  if (hm) {
    //make sure we're dealing with an array
    if (typeof hm == 'string') { hm = [hm]; }
    
    for (var i=0; i < hm.length; i++) {
      var hma = hm[i];
      
      //association can just be specified via a string, in which case turn it into an object here
      if (typeof hma == 'string') { hma = { name: hma }; };
      
      hma = new ExtMVC.Model.HasManyAssociation(this, hma);
      this[hma.associationName] = hma;
    };
  };
  
  //add any belongsTo associations
  var bt = this.constructor.belongsTo;
  if (bt) {
    //make sure we're dealing with an array
    if (typeof bt == 'string') { bt = [bt]; }
    
    for (var i=0; i < bt.length; i++) {
      var bta = bt[i];
      
      //association can just be specified via a string, in which case turn it into an object here
      if (typeof bta == 'string') { bta = { name: bta }; };
      
      var btaAssoc = new ExtMVC.Model.BelongsToAssociation(this, bta);
      this[btaAssoc.associationName] = btaAssoc;
      
      //see if a parent has been defined, if not set one up now (defaults here to the first belongsTo assoc)
      var parentModel = this.constructor.parentModel || bta.name;
      if (parentModel && !this.parent) {
        this.parent = btaAssoc;
      };
    };
  };
  
  Ext.apply(this, rec);
};

/**
 * Creates a model definition
 * @param {String} modelNameWithNamespace The (string) name of the model to create (e.g. MyNamespace.model.MyModel)
 * @param {object} config Configuration for this model.
 * @cfg {Array} fields Array of field definitions for this model, same format as Ext.data.Record.create takes
 * @cfg {String} adapter The data adapter to use (defaults to REST, which attempts to save models to a RESTful url backend)
 * @cfg {String} urlName The string version of the model name to use when making requests to the server.  e.g. for a model called
 * MyModel the server may be set up to accept urls like /my_models/1 or /MyModels/1, this is where you specify that
 * @cfg {String} xmlName The name of the XML element which contains the model fields.  e.g. for a model called MyModel, this may look
 * like <MyModel>...</MyModel> or <my_model>...</my_model>.  This is where you set that (don't include the angle brackets)
 */
ExtMVC.Model.define = function(modelNameWithNamespace, config) {
  var config = config || {};
  
  //split into namespace and model name
  var nsRegex = /(.+)\.([A-Za-z]*)$/;
  var match = nsRegex.exec(modelNameWithNamespace);
  var namespace = null;
  if (match) {
    var namespace = match[1];
    var modelName = match[2];
    Ext.ns(namespace); //make sure the namespace is defined
  };

  Ext.applyIf(config, {
    namespace: namespace, //.split(".")[0],
    modelName: modelName,
    className: modelName,
    adapter:   'REST'
  });
  
  //extend ExtMVC.Model for this className
  eval(modelNameWithNamespace + " = Ext.extend(ExtMVC.Model, config)");
  var className = eval(modelNameWithNamespace);
  
  /**
   * If we are extending another model, copy its fields, class methods and instance methods
   * into this model
   */
  if (className.prototype.extend) {
    var extendsModel = eval(className.prototype.extend);
    var parentFields = extendsModel.fields;
    
    //add parent model fields to the front of the child model fields array
    for (var i = parentFields.length - 1; i >= 0; i--){
      var childFields    = className.prototype.fields;
      var alreadyDefined = false;
      
      //check that this field is not redefined in the child model
      for (var j=0; j < childFields.length; j++) {
        if (childFields[j].name == parentFields[i].name) {
          alreadyDefined = true;
          break; //no need to finish the loop as we've already made the match
        }
      };
      
      //only add if not redefined in child model
      if (!alreadyDefined) {
        className.prototype.fields.unshift(parentFields[i]);
      };
    };
    
    //add any class methods
    Ext.applyIf(className, extendsModel.prototype);
  };
  
  /**
   * Add fields the way Ext.data.Record does it.
   * TODO: We shouldn't be doing this here, Record should be doing it... not very DRY
   */
  className.prototype.fields = new Ext.util.MixedCollection();
  Ext.each(config.fields, function(f) {
    className.prototype.fields.add(new Ext.data.Field(f));
  });
  
  //add fields, modelName, className and adapter as class-level items
  Ext.apply(className, {
    adapter:   config.adapter,
    modelName: modelName,
    className: className,
    namespace: namespace,
    
    //build the underlying Ext.data.Record now (will be used in model's constructor)
    record:    ExtMVC.Model.recordFor(modelName, config.fields)
  });
  
  //add model class functions such as findById
  ExtMVC.Model.addClassMethodsToModel(className, config);
};


/**
 * Custom extensions to Ext.data.Record.  These methods are added to new Ext.data.Record objects
 * when you subclass ExtMVC.Model.
 * For example
 * model = new ExtMVC.Spec.FakeUser({
 *   id:   100,
 *   name: 'Ed'
 * });
 * alert(model.namespacedUrl('my_url')); // => '/admin/my_url.ext_json'
 */
ExtMVC.Model.RecordExtensions = {
  /**
   * Adds logic on top of Ext.data.Record
   */
  init: function(config) {
    Ext.applyIf(config, {
      //set up the various variations on the model name
      className:         ExtMVC.Model.classifyName(config.modelName),
      controllerName:    ExtMVC.Model.controllerName(config.modelName),
      foreignKeyName:    ExtMVC.Model.foreignKeyName(config.modelName),
      
      humanPluralName:   ExtMVC.Model.pluralizeHumanName(config.modelName),
      humanSingularName: ExtMVC.Model.singularizeHumanName(config.modelName),
      
      underscoreName:    config.modelName
    });
    
    //add the data adapter, initialize it
    var adapter = ExtMVC.Model.AdapterManager.find(config.adapter || ExtMVC.Model.prototype.adapter);
    if (adapter) {
      Ext.apply(config, adapter.instanceMethods);
      adapter.initialize(this);
    }
    
    //mix in validations package
    Ext.apply(config, ExtMVC.Model.ValidationExtensions);
    config.initializeValidationExtensions();
    
    Ext.apply(this, config);
  },
  
  /**
   * Calculates a nested url for this object based on it's data.id and parent model
   * @return {String} The url for this model object
   */
  url: function() {
    var el = this.data.id ? this : this.constructor;
    if (this.parent && this.parent.lastFetched) {
      return ExtMVC.UrlBuilder.urlFor(this.parent.get({}, -1), el);
    } else {
      return ExtMVC.UrlBuilder.urlFor(el);
    };
  },
  
  /**
   * Mass-assigns field values.  Operation is wrapped in beginEdit and endEdit
   * e.g. setValues({first_name: 'Ed', last_name: 'Spencer'})
   * is the same as set('first_name', 'Ed'); set('last_name': 'Spencer')
   * @param {Object} values An object containing key: value pairs for fields on this object
   */
  setValues: function(values) {
    this.beginEdit();
    for (key in values) {
      this.set(key, values[key]);
    }
    this.endEdit();
  },
  
  /**
   * Reads errors from a generic object and adds them to this model's internal errors object.
   * Intended to be used mainly to process server responses
   */
  readErrors: function(errorsObject) {
    this.errors.readServerErrors(errorsObject);
  }
};

/**
 * Provides a framework for validating the contents of each field
 */
ExtMVC.Model.ValidationExtensions = {
  /**
   * Sets up this record's validation parameters
   */
  initializeValidationExtensions: function() {
    this.validations = this.validations || [];
    this.errors      = new ExtMVC.Model.Validation.Errors(this);
  },
  
  isValid: function() {
    return this.errors.isValid();
  }
};


ExtMVC.Model.models   = [];

/**
 * Utility methods which don't need to be declared per model
 */
Ext.apply(ExtMVC.Model, {
  
  /**
   * Retrieves or creates an Ext.data.Record for the given model name.  This is then cached
   * in ExtMVC.models for later reuse
   * @param {String} modelName The name of the model to create or retrieve a record for
   * @param {Array} fields An array of fields to be passed to the Ext.data.Record.create call
   * @return {Ext.data.Record} An instantiated Record object using Ext.data.Record.create
   */
  recordFor: function(modelName, fields) {
    var record = ExtMVC.Model.models[modelName];
    if (!record) {
      record = Ext.data.Record.create(fields);

      Ext.apply(record.prototype, ExtMVC.Model.RecordExtensions);
      ExtMVC.Model.models[modelName] = record;
    }
    
    return record;
  },
    
  /**
   * String methods:
   */
   
  urlizeName : function(name) {
    return name.toLowerCase().pluralize();
  },
  
  classifyName: function(name) {
    return this.singularizeHumanName(name).replace(/ /g, "");
  },
  
  singularizeHumanName: function(name) {
    return name.replace(/_/g, " ").titleize();
  },
  
  pluralizeHumanName: function(name) {
    return name.pluralize().replace(/_/g, " ").titleize();
  },
  
  controllerName : function(name) {
    return this.pluralizeHumanName(name).replace(/ /g, "")  + "Controller";
  },
  
  foreignKeyName: function(name) {
    return name.toLowerCase() + '_id';
  },
  
  /**
   * Add class methods for finding model objects
   * @param {Function} modelClass The class to add methods to
   * @param {Object} additionalFunctions (Optional) extra class methods to add to this class
   */
  addClassMethodsToModel: function(modelClass, additionalFunctions) {
    var additionalFunctions = additionalFunctions || {};
    
    Ext.applyIf(additionalFunctions, {
      //add a urlName property to the Model subclass
      urlName: ExtMVC.Model.urlizeName(modelClass.prototype.modelName)
    });
    
    //add any class methods from the adapter
    var adapter = ExtMVC.Model.AdapterManager.find(modelClass.adapter || ExtMVC.Model.prototype.adapter);
    if (adapter && adapter.classMethods) {
      Ext.apply(modelClass, adapter.classMethods);
    };
        
    //add other class methods    
    Ext.apply(modelClass, {      
      /**
       * Returns the default reader for this model subclass.  Creates a default reader if
       * one has not already been set
       */
      getReader: function() {
        if (!modelClass.reader) {
          modelClass.reader = new Ext.data.JsonReader({
            totalProperty: 'totalCount',
            root: modelClass.jsonName || modelClass.prototype.modelName.toLowerCase()
          }, modelClass);
        };
        
        return modelClass.reader;
      }
    }, additionalFunctions);
  }
});

Ext.ns('ExtMVC.Model.Adapter', 'ExtMVC.Model.Validation');