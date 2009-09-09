/**
 * @class ExtMVC.model.plugin.adapter
 * @ignore
 */
ExtMVC.model.plugin.adapter = {
  initialize: function(model) {
    var adapter = new this.RESTJSONAdapter();
    
    Ext.override(Ext.data.Record, adapter.instanceMethods());
    Ext.apply(model, adapter.classMethods());
    
    //associations are optional so only add them if they are present
    // try {
    //   Ext.override(ExtMVC.model.plugin.association.HasMany,   adapter.hasManyAssociationMethods());
    //   Ext.override(ExtMVC.model.plugin.association.BelongsTo, adapter.belongsToAssociationMethods());
    // } catch(e) {};
  }
};

ExtMVC.model.addPlugin(ExtMVC.model.plugin.adapter);

/**
 * @class ExtMVC.model.plugin.adapter.Abstract
 * Abstract adapter class containing methods that all Adapters should provide
 * All of these methods are expected to be asynchronous except for loaded()
 */

/**
 * @constructor
 * @param {ExtMVC.model} model The model this adapter represents
*/
ExtMVC.model.plugin.adapter.Abstract = function(model) {
  /**
   * @property model
   * @type ExtMVC.model.Base
   * The model this adapter represents (set on initialize)
   */
  // this.model = model;
};

ExtMVC.model.plugin.adapter.Abstract.prototype = {
  
  /**
   * Abstract save method which should be overridden by an Adapter subclass
   * @param {ExtMVC.model.Base} instance A model instance to save
   * @param {Object} options Save options (e.g. {success: function(), failure: function()})
   */
  doSave: Ext.emptyFn,
  
  /**
   * Abstract find method which should be overridden by an Adapter subclass
   * @param {Object} options Options for the find, such as primaryKey and conditions
   */
  doFind: Ext.emptyFn,
  
  /**
   * Abstract destroy method which should be overridden by an Adapter subclass
   * @param {ExtMVC.model.Base} instance The model instance to destroy
   */
  doDestroy: Ext.emptyFn,
  
  /**
   * @property instanceMethods
   * @type Object
   * An object of properties that get added to the model's prototype
   * These all run within the scope of a model instance
   */
  instanceMethods: function() {
    return {
      adapter: this,
    
      /**
       * Attempts to save this instance
       * @member ExtMVC.model.Base
       * @param {Object} options Options (see collectionMethods.create for arguments)
       */
      save: function(options) {
        options = options || {};
        if (options.skipValidation === true || this.isValid()) {
          //looks good, attempt the save
          return this.adapter.doSave(this, options);
        } else {
          //couldn't save
          if (typeof options.failure == 'function') {
            return options.failure.call(options.scope || this, this);
          };
        };
      },
    
      /**
       * Attempts to destroy this instance (asynchronously)
       * @member ExtMVC.model.Base
       * @param {Object} options Options to pass to the destroy command (see collectionMethods.create for args)
       */
      destroy: function(options) {
        return this.adapter.doDestroy(this, options);
      },
    
      /**
       * Updates selected fields with new values and saves straight away
       * @member ExtMVC.model.Base
       * @param {Object} data The fields to update with new values
       * @param {Object} options Options (see collectionMethods.create for arguments)
       */
      update: function(data, options) {
        this.setValues(data);
        this.save(options);
      },
    
      /**
       * Returns true if this instance has been loaded from backend storage or has only been instantiated
       * @member ExtMVC.model.Base
       * @return {Boolean} True if loaded from the server
       */
      loaded: function() {
      
      }
    };
  },
  
  classMethods: function() {
    return {
      adapter: this,
    
      /**
       * Attempts to create and save a new instance of this model
       * @param {Object} data The data to use in creating and saving an instance of this model
       * @param {Object} options Options object:
       * * skipValidation - set to true to bypass validation before saving (defaults to false)
       * * scope   - The scope to run callback functions in
       * * success - pass in a function as a callback if save succeeds.  Function called with 1
       *             argument - the new model instance
       * * failure - pass in a function as a callback if save succeeds.  Function called with 2
       *             arguments - the unsaved model instance and the json response
       */
      create: function(data, options) {
        var instance = new this(data);
        instance.save(options);
      
        return instance;
      },
    
      /**
       * Builds a new model on this collection but does not save it
       * @param {Object} data The data to use in creating and saving an instance of this model
       * @return {Object} The new model instance
       */
      build: function(data) {
        return new this(data);
      },
    
      /**
       * Finds the given related model on a relationship
       * @param {Number|String|Object} conditions The unique identifier for this model, or a conditions object
       * @param {Object} options Options (see collectionMethods.create for arguments)
       */
      find: function(conditions, options) {
        //assume to be the primary key
        if (typeof(conditions) == 'number' || typeof(conditions) == 'string') conditions = {primaryKey: conditions};
        
        return this.adapter.doFind(conditions, options, this);
      },
    
      /**
       * Issues a destroy (delete) command to delete the appropriate related object by ID
       * @param {Number|String} id The ID of the associated model to delete
       * @param {Object} options Options (see collectionMethods.create for arguments)
       */
      destroy: function(id, options) {
        return this.adapter.doDestroy(id, options, this);
      }
    };
  },

  /**
   * @property hasManyAssociationMethods
   * @type Object
   * An object full of properties and functions that get mixed in to hasMany association collections
   * These methods are run in the scope of the model instance that owns the association, e.g. if
   * User hasMany Posts, then 'this' refers to the user instance
   */
  hasManyAssociationMethods: function() {
    return {
      /**
       * @member ExtMVC.model.plugin.association.HasMany
       * @ignore (member doesn't seem to work for properties)
       * @property adapter
       * @type ExtMVC.model.plugin.adapter.Abstract
       * A reference to the adapter attached to this association. Useful if you need to dip down to a lower
       * level than the methods inside HasMany provide
       */
      adapter: this,
    
      /**
       * Attempts to create and save a new instance of this model
       * @member ExtMVC.model.plugin.association.HasMany
       * @param {Object} data The data to use in creating and saving an instance of this model
       * @param {Object} options Options object:
       * * skipValidation - set to true to bypass validation before saving (defaults to false)
       * * success - pass in a function as a callback if save succeeds.  Function called with 1
       *             arguments - the new model instance
       * * failure - pass in a function as a callback if save succeeds.  Function called with 2
       *             arguments - the unsaved model instance and the json response
       */
      create: function(data, options) {
        var instance = new this.associatedClass(data);
        
        //automatically set the foreign key here
        // instance.set(this.foreignKey, )
      },
    
      /**
       * Builds a new model on this collection but does not save it
       * @member ExtMVC.model.plugin.association.HasMany
       * @param {Object} data The data to use in creating and saving an instance of this model
       * @return {Object} The new model instance
       */
      build: function(data, options) {
      
      },
    
      /**
       * Finds the given related model on a relationship
       * @member ExtMVC.model.plugin.association.HasMany
       * @param {Number|String} id The unique identifier for this model.
       */
      find: function(id) {
      
      },
    
      /**
       * Returns true if this association has been fully loaded yet
       * @member ExtMVC.model.plugin.association.HasMany
       * @return {Boolean} True if this association has been loaded yet
       */
      loaded: function() {
      
      },
    
      /**
       * Issues a destroy (delete) command to delete the appropriate related object by ID
       * @member ExtMVC.model.plugin.association.HasMany
       * @param {Number|String} id The ID of the associated model to delete
       */
      destroy: function(id) {
      
      }
    };
  },
  
  /**
   * @property belongsToAssociationMethods
   * @type Object
   * An object full of properties and functions that get mixed in to belongsTo association collections
   */
  belongsToAssociationMethods: function() {
    return {
      /**
       * @member ExtMVC.model.plugin.association.BelongsTo
       * @ignore (member doesn't seem to work for properties)
       * @property adapter
       * @type ExtMVC.model.plugin.adapter.Abstract
       * A reference to the adapter attached to this association. Useful if you need to dip down to a lower
       * level than the methods inside BelongsTo provide
       */
      adapter: this,
      
      /**
       * Finds the given related model on a relationship
       * @member ExtMVC.model.plugin.association.BelongsTo
       * @param {Number|String} id The unique identifier for this model.
       */
      find: function(id) {
      
      },
    
      /**
       * Returns true if this association has been fully loaded yet
       * @member ExtMVC.model.plugin.association.BelongsTo
       * @return {Boolean} True if this association has been loaded yet
       */
      loaded: function() {
      
      },
    
      /**
       * Issues a destroy (delete) command to delete the appropriate related object by ID
       * @member ExtMVC.model.plugin.association.BelongsTo
       * @param {Number|String} id The ID of the associated model to delete
       */
      destroy: function(id) {
      
      }
    };
  }
};