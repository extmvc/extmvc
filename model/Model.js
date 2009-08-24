/**
 * @class ExtMVC.model
 * @extends Object
 * Manages the definition and creation of model classes.
 * 
 * <h2>Defining models</h2>
 * <p>Models in your application are defined using Ext.model.define, which is given 2 arguments - the String name of your model and a config object</p>
 * <p>
 * <pre><code>
ExtMVC.model.define("MyModel", {
  fields: [
    {name: 'id',    type: 'int'},
    {name: 'title', type: 'string'},
    {name: 'price', type: 'int'}
  ],

  validatesPresenceOf: ['id', 'title'],
  classMethods: {
    doSomething: function() {alert('oh hi!');}
  }
});
</code></pre>
 * 
 * Fields are passed straight to the underlying Ext.data.Record.
 * classMethods are defined on the constructor function, e.g. from the example above:
 * 
<pre><code>
MyModel.doSomething(); //alerts 'oh hi'
</code></pre>
 * 
 * All other properties are simply assigned to the Model's prototype, but may be intercepted by plugins
 * 
 * <h2>Extending other models</h2>
 * Models can extend other models using the 'extend' property:
<pre></code>
ExtMVC.model.define("Product", {
  fields: [...]
}

ExtMVC.model.define("Flower", {
  extend: "Product",
  fields: [...]
}
</code></pre>
 * 
 * The class builds a simple dependency graph to allow models to extend other models, e.g.:
 * 
<pre><code>
//this model definition will not actually be created until SuperUser has been defined
ExtMVC.model.define("SuperUser", {
  extend: "User",
  fields: [
    {name: 'isAdmin', type: 'bool'}
  ]
});

//SuperUser does not extend anything, so is created immediately. User is then also created
ExtMVC.model.define("User", {
  fields: [
    {name: 'id',       type: 'int'},
    {name: 'username', type: 'string'}
  ],

  validatesPresenceOf: ['id', 'username']
});

//At this point both SuperUser and User have been created and are instantiable and extendable.
</code></pre>
 * 
 * When a model extends another one it inherits all of that model's instance and class methods. It also
 * inherits all of the superclass model's fields, overwriting if redefined in the subclass. In the example
 * above the SuperUser model would have fields 'id', 'username' and 'isAdmin', and will also have inherited
 * User's validatesPresenceOf declaration
 * 
 * @singleton
 */
ExtMVC.model = {
  /**
   * @property pendingCreation
   * @type Object
   * An object of model creation configurations awaiting definition because their dependency model(s) have not yet
   * been defined. e.g. {'User': [{name: 'SuperUser', config: someConfigObject}, {name: 'AdminUser', config: anotherCfgObj}]}
   * signifies that SuperUser and AdminUser should be defined as soon as User has been defined
   */
  pendingCreation: {},
  
  /**
   * Returns an array of any Model subclasses waiting for this model to be defined
   * @param {String} modelName The dependency model name to check against
   * @return {Array} An array of model definitions (e.g. [{name: 'MyModel', config: someObject}])
   */
  getModelsPendingDefinitionOf: function(modelName) {
    return this.pendingCreation[modelName] || [];
  },
  
  /**
   * Adds a model definition to the pendingCreation object if it is waiting for another model to be defined first
   * @param {String} dependencyModelName The name of another model which must be created before this one
   * @param {String} dependentModelName The name of the new model to be defined after its dependency
   * @param {Object} config The new model's config object, as sent to ExtMVC.model.define
   */
  setModelPendingDefinitionOf: function(dependencyModelName, dependentModelName, config) {
    var arr = this.pendingCreation[dependencyModelName] || [];
    
    arr.push({name: dependentModelName, config: config});
    
    this.pendingCreation[dependencyModelName] = arr;
  },
  
  /**
   * @property strictMode
   * @type Boolean
   * Throws errors rather than return false when performing operations such as overwriting existing models
   * Defaults to false
   */
  strictMode: false,
  
  /**
   * @property modelNamespace
   * @type Object
   * The object into which Models are defined.  This defaults to window, meaning calls to ExtMVC.model.create
   * will create models globally scoped unless this is modified.  Setting this instead to MyApp.models would 
   * mean that a model called 'User' would be defined as MyApp.models.User instead
   */
  modelNamespace: function() {
    Ext.ns('ExtMVC.modelsTemp');
    
    return ExtMVC.modelsTemp;
  }(),

  /**
   * Sets a model up for creation.  If this model doesn't extend any other Models that haven't been defined yet
   * it is returned immediately, otherwise it is placed into a queue and defined as soon as its dependency models
   * are in place. Example:
   * 
   * ExtMVC.model.define('MyApp.models.MyModel', {
   *   fields: [
   *     {name: 'title',     type: 'string'},
   *     {name: 'price',     type: 'number'},
   *     {name: 'available', type: 'bool'}
   *   ],
   *   
   *   //Adds tax to the price field
   *   calculatePrice: function() {
   *     return this.data.price * 1.15;
   *   },
   * 
   *   classMethods: {
   *     findAvailable: function() {
   *       //some logic to find all available MyModel's
   *     }
   *   }
   * });
   * 
   * var m = new MyApp.models.MyModel({title: 'Test', available: true, price: 100});
   * m.calculatePrice(); // => 115
   * MyApp.models.MyModel.findAvailable(); // => Returns as defined above
   *
   * @param {String} modelName The name of the model to create (e.g. 'User')
   * @param {Object} extensions An object containing field definitions and any extension methods to add to this model
   * @return {ExtMVC.model.Base/Null} The newly defined model constructor, or null if the model can't be defined yet
   */
  define: function(modelName, extensions) {
    var createNow  = true,
        extensions = extensions || {};
    
    if (typeof extensions.extend != 'undefined') {
      var superclass = this.modelNamespace[extensions.extend];
      if (typeof superclass == 'undefined') {
        //the model we're extending hasn't been created yet
        createNow = false;
        this.setModelPendingDefinitionOf(extensions.extend, modelName, extensions);
      };
    };
    
    if (createNow) return this.create.apply(this, arguments);
  },
  
  /**
   * @ignore
   * Creates a new ExtMVC.model.Base subclass and sets up all fields, instance and class methods.
   * Don't use this directly unless you know what you're doing - use define instead (with the same arguments)
   * 
   * @param {String} modelName The full model name to define, including namespace (e.g. 'MyApp.models.MyModel')
   * @param {Object} extensions An object containing field definitions and any extension methods to add to this model
   */
  create: function(modelName, extensions) {
    extensions = extensions || {};
    
    //check that this model has not already been defined
    if (this.isAlreadyDefined(modelName)) {
      if (this.strictMode) throw new Error(modelName + ' is already defined');
      return false;
    }
    
    //get a handle on the super class model if extending (this will be undefined if we are not extending another model)
    var superclassModel = this.modelNamespace[extensions.extend];
    
    var fields = this.buildFields(extensions.fields, superclassModel);
    delete extensions.fields;
    
    //create the base Ext.data.Record, which we'll extend in a moment, and assign it to our model namespace
    var model = this.modelNamespace[modelName] = Ext.data.Record.create(fields);
    
    //separate out any methods meant to operate at class level
    var classMethods = extensions.classMethods || {};
    delete extensions.classMethods;
    
    //extend our new record firstly with Model.Base, then apply any user extensions
    Ext.apply(model.prototype, extensions);
    
    //if we're extending another model, add class and instance methods now
    if (typeof superclassModel != 'undefined') {
      Ext.applyIf(classMethods, superclassModel);
      Ext.applyIf(model.prototype, superclassModel.prototype);
    };
    
    //set up the various string names associated with this model
    model.prototype.modelName = modelName;
    this.setupNames(model);

    //add any class methods to the class level
    for (var methodName in classMethods) {
      if (methodName != 'prototype') model[methodName] = classMethods[methodName];
    };

    this.initializePlugins(model);
    this.afterCreate(modelName);
    
    return model;
  },
  
  /**
   * @ignore
   * Creates any other models that were waiting for this one to be created. Do not override this
   * unless you really know what you are doing...
   * @param {String} modelName The name of the model that was just created
   */
  afterCreate: function(modelName) {
    var awaiting = this.getModelsPendingDefinitionOf(modelName);
    if (awaiting) {
      Ext.each(awaiting, function(obj) {
        this.create(obj.name, obj.config);
      }, this);
    };
  },
  
  /**
   * Checks if a given model name has already been defined, or is awaiting creation.
   * @param {String} modelName the name of the new model to check
   * @return {Boolean} True if the model has already been defined somewhere
   */
  isAlreadyDefined: function(modelName) {
    if (typeof this.modelNamespace[modelName] != "undefined") return true;
    
    var found = false;
    
    //check that this model is not awaiting creation
    for (superclass in this.pendingCreation) {
      var subclasses = this.pendingCreation[superclass];
      Ext.each(subclasses, function(s) {
        if (s.name == modelName) found = true;
      }, this);
    }
    
    return found;
  },
  
  /**
   * @ignore
   * Builds an array of fields for this model, adding fields from the super class if present
   */
  buildFields: function(subclassFields, superclass) {
    subclassFields = subclassFields || [];
    
    var fields = new Ext.util.MixedCollection(false, function(field) { return field.name; });
    fields.addAll(subclassFields);
    
    if (typeof superclass != 'undefined') {
      superclass.prototype.fields.each(function(field) {
        if (typeof fields.get(field.name) == 'undefined') fields.add(field);
      });
    };
    
    return fields.items;
  },
  
  /**
   * Sets up the various names required by this model, such as tableName, humanName etc
   * @param {Object} model The model to set up names on
   * @return {Object} The model, decorated with names
   */
  setupNames: function(model) {
    var p = model.prototype,
        i = ExtMVC.Inflector;
    
    Ext.applyIf(model.prototype, {
      tableName        : i.pluralize(p.modelName.underscore()),
      foreignKeyName   : i.singularize(p.modelName.underscore()) + '_id',
      singularHumanName: p.modelName.humanize().titleize(),
      pluralHumanName  : i.pluralize(p.modelName.humanize().titleize())
    });
  },
  
  /**
   * @property plugins
   * @type Array
   * An array containing all plugin constructor functions - these get applied at model creation time
   */
  plugins: [],
  
  /**
   * Makes Model aware of a new plugin.  All plugins defined here will be initialized when a model is created
   * @param {Function} plugin The plugin object
   */
  addPlugin: function(plugin) {
    this.plugins.push(plugin);
  },
  
  /**
   * Runs each plugin's initialize method with a newly created model constructor
   * @param {ExtMVC.model} model The model to initialize the plugin with
   */
  initializePlugins: function(model) {
    Ext.each(this.plugins, function(plugin) {
      plugin.initialize(model);
    }, this);
  }
};

Ext.ns('ExtMVC.model.plugin');