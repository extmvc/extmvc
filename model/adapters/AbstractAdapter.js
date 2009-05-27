ExtMVC.Model.plugin.adapter = (function() {
  return {
    initialize: function(model) {
      var adapter = new this.RESTAdapter();
      
      Ext.override(Ext.data.Record, adapter.instanceMethods());
      Ext.apply(model, adapter.classMethods());
      
      //associations are optional so only add them if they are present
      try {
        Ext.override(ExtMVC.Model.plugin.association.HasMany,   adapter.hasManyAssociationMethods());
        Ext.override(ExtMVC.Model.plugin.association.BelongsTo, adapter.belongsToAssociationMethods());
      } catch(e) {};
    }
  };
})();

ExtMVC.Model.addPlugin(ExtMVC.Model.plugin.adapter);

/**
 * @class ExtMVC.Model.plugin.adapter.Abstract
 * Abstract adapter class containing methods that all Adapters should provide
 * All of these methods are expected to be asynchronous except for loaded()
 */

/**
 * @constructor
 * @param {ExtMVC.Model} model The model this adapter represents
*/
ExtMVC.Model.plugin.adapter.Abstract = function(model) {
  /**
   * @property model
   * @type ExtMVC.Model.Base
   * The model this adapter represents (set on initialize)
   */
  // this.model = model;
};

ExtMVC.Model.plugin.adapter.Abstract.prototype = {
  
  /**
   * Abstract save method which should be overridden by an Adapter subclass
   * @param {ExtMVC.Model.Base} instance A model instance to save
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
   * @param {ExtMVC.Model.Base} instance The model instance to destroy
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
            return options.failure.call(options.scope || this, options);
          };
        };
      },
    
      /**
       * Attempts to destroy this instance (asynchronously)
       * @param {Object} options Options to pass to the destroy command (see collectionMethods.create for args)
       */
      destroy: function(options) {
        return this.adapter.doDestroy(this, options);
      },
    
      /**
       * Updates selected fields with new values and saves straight away
       * @param {Object} data The fields to update with new values
       * @param {Object} options Options (see collectionMethods.create for arguments)
       */
      update: function(data, options) {
        this.setValues(data);
        this.save(options);
      },
    
      /**
       * Returns true if this instance has been loaded from backend storage or has only been instantiated
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
        if (typeof(conditions) == 'number') conditions = {primaryKey: conditions};
        
        return this.adapter.doFind(conditions, options, this);
      },
    
      /**
       * Issues a destroy (delete) command to delete the appropriate related object by ID
       * @param {Number|String} id The ID of the associated model to delete
       * @param {Object} options Options (see collectionMethods.create for arguments)
       */
      destroy: function(id, options) {
        return this.adapter.doDestroy(id, options);
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
      adapter: this,
    
      /**
       * Attempts to create and save a new instance of this model
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
       * @param {Object} data The data to use in creating and saving an instance of this model
       * @return {Object} The new model instance
       */
      build: function(data, options) {
      
      },
    
      /**
       * Finds the given related model on a relationship
       * @param {Number|String} id The unique identifier for this model.
       */
      find: function(id) {
      
      },
    
      /**
       * Returns true if this association has been fully loaded yet
       * @return {Boolean} True if this association has been loaded yet
       */
      loaded: function() {
      
      },
    
      /**
       * Issues a destroy (delete) command to delete the appropriate related object by ID
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
      adapter: this,
      
      /**
       * Finds the given related model on a relationship
       * @param {Number|String} id The unique identifier for this model.
       */
      find: function(id) {
      
      },
    
      /**
       * Returns true if this association has been fully loaded yet
       * @return {Boolean} True if this association has been loaded yet
       */
      loaded: function() {
      
      },
    
      /**
       * Issues a destroy (delete) command to delete the appropriate related object by ID
       * @param {Number|String} id The ID of the associated model to delete
       */
      destroy: function(id) {
      
      }
    };
  }
};

/**
 * Method  Collection Individual
 * create  yes        yes  (but different)
 * build   yes        yes  (might be different)
 * find    yes        no
 * loaded  yes        no
 * count   yes        no
 * destroy yes        yes  (but different)
 */


// ExtMVC.Model.Adapter.Abstract = {
//   initialize: function(model) {
//     
//   },
//   
//   classMethods: {
//     find: function(options) {
//       
//     },
//     
//     findById: function(id, options) {
//       return this.findByField('id', id, options);
//     },
//     
//     findByField: function(fieldName, matcher, options) {
//       
//     },
//     
//     findAll: function(options) {
//       
//     }
//   },
//   
//   instanceMethods: {
//     save:    Ext.emptyFn,
//     
//     reload:  Ext.emptyFn,
//     
//     destroy: Ext.emptyFn
//   }
// };
// 
// /**
//  * Methods adding url data mapping
//  */
// ExtMVC.Model.AbstractAdapter = {
//   /**
//    * Set up the model for use with Active Resource.  Add various url-related properties to the model
//    */
//   initAdapter: function() {
//     Ext.applyIf(this, {
//       urlNamespace: '/admin',
//       urlExtension: '.ext_json',
//       urlName:      ExtMVC.Model.urlizeName(this.modelName)
//     });
//   },
//   
//   /**
//    * Saves this record.  Performs validations first unless you pass false as the single argument
//    */
//   save: function(performValidations) {
//     var performValidations = performValidations || true;
//     
//     console.log("saving model");
//   },
//   
//   destroy: function(config) {
//     var config = config || {};
//     
//     console.log("destroying model");
//   },
//   
//   /**
//    * Loads this record with data from the given ID
//    * @param {Number} id The unique ID of the record to load the record data with
//    * @param {Boolean} asynchronous False to load the record synchronously (defaults to true)
//    */
//   load: function(id, asynchronous) {
//     var asynchronous = asynchronous || true;
//     
//     console.log("loading model");
//   },
//   
//   /**
//    * URL to retrieve a JSON representation of this model from
//    */
//   singleDataUrl : function(record_or_id) {
//     return this.namespacedUrl(String.format("{0}/{1}", this.urlName, this.data.id));
//   },
//   
//   /**
//    * URL to retrieve a JSON representation of the collection of this model from
//    * This would typically return the first page of results (see {@link #collectionStore})
//    */
//   collectionDataUrl : function() {
//     return this.namespacedUrl(this.urlName);
//   },
// 
//   /**
//    * URL to retrieve a tree representation of this model from (in JSON format)
//    * This is used when populating most of the trees in ExtMVC, though
//    * only applies to models which can be representated as trees
//    */
//   treeUrl: function() {
//     return this.namespacedUrl(String.format("{0}/tree", this.urlName));
//   },
//   
//   /**
//    * URL to post details of a drag/drop reorder operation to.  When reordering a tree
//    * for a given model, this url is called immediately after the drag event with the
//    * new configuration
//    * TODO: Provide more info/an example here
//    */
//   treeReorderUrl: function() {
//     return this.namespacedUrl(String.format("{0}/reorder/{1}", this.urlName, this.data.id));
//   },
//   
//   /**
//    * Provides a namespaced url for a generic url segment.  Wraps the segment in this.urlNamespace and this.urlExtension
//    * @param {String} url The url to wrap
//    * @returns {String} The namespaced URL
//    */
//   namespacedUrl: function(url) {
//     return(String.format("{0}/{1}{2}", this.urlNamespace, url, this.urlExtension));
//   }
// };
// 
// // ExtMVC.Model.registerAdapter('REST', ExtMVC.Model.AbstractAdapter);