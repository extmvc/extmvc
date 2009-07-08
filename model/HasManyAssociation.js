/**
 * @class ExtMVC.model.HasManyAssociation
 * @extends ExtMVC.model.Association
 */
ExtMVC.model.HasManyAssociation = function(ownerObject, config) {
  var config = config || {};
  
  Ext.applyIf(config, {
    offset:          0,
    limit:           25,
    associationName: ExtMVC.model.Association.hasManyAssociationName(config.name)
  });

  //TODO: these should be abstracted to a parent object (as should private vars and funcs below)
  Ext.applyIf(config, {
    primaryKey:      'id',
    foreignKey:      ownerObject.foreignKeyName,
    extend:          {},
    
    className:       (ownerObject.constructor.namespace ? ownerObject.constructor.namespace + '.' + config.name : config.name)
  });
  
  //get a reference to the class definition function of the associated object
  //(e.g. a hasMany: ['Post'] association will return a reference to Post)
  var associatedObjectClass = eval(config.className);
  
  /**
   * Private, calls the ownerObject's class method with the supplied args
   */
  function callOwnerObjectClassMethod(method, args, scope) {
    return ownerObject.constructor[method].apply(scope || ownerObject.constructor, args || []);
  };
  
  /**
   * Private, calls the associated object's class method with the supplied args
   */
  function callAssociatedObjectClassMethod (method, args, scope) {
    return associatedObjectClass[method].apply(scope || associatedObjectClass, args || []);
  }
  
  return Ext.applyIf(config.extend, {
    
    /**
     * @property associationName
     * @type String
     * Returns the name of this association so that the model can add it to its definition
     */
    associationName: config.associationName,
    
    /**
     * @property associationType
     * @type String
     * The type of association (hasMany or belongsTo)
     */
    associationType: 'hasMany',
    
    /**
     * Returns the URL for this association - e.g. if model User hasMany Posts, user.posts.url() will
     * return something like /users/1/posts.
     * Pass additional parameter options as arguments to pass straight through to the URL builder - e.g.:
     * user.posts.url('published'); // = /users/1/posts/published
     * @return {String} The URL for the has many resource
     */
    url: function() {
      var args = [ownerObject, associatedObjectClass];
      for (var i=0; i < arguments.length; i++) {
        args.push(arguments[i]);
      };
      
      return ExtMVC.UrlBuilder.urlFor.apply(ExtMVC.UrlBuilder, args);
    },
    
    /**
     * Passes through to the owner class's findById class method, adding a foreign key constraint first
     * @param {String} id The ID of the associated object to retrieve
     * @param {Object} options Options passed along to the associated model's Class's findById method.  Pass in loadSuccess, loadFailure, conditions, order etc here
     */
    findById: function(id, options) {
      var options = options || {};
      
      //add a condition to constrain to the owner object's id
      if (!options.conditions) { options.conditions = []; }
      options.conditions.push({
        key:   config.foreignKey,
        value: ownerObject.data[config.primaryKey]
      });
      
      return callAssociatedObjectClassMethod('findById', [id, options]);
    },
    
    findAll: function(storeOptions) {
      var storeOptions = storeOptions || {};
      Ext.applyIf(storeOptions, {
        url: this.url(),
        
        listeners: {
          
          //Once we have fetched all hasMany records, make sure newRecord is false, and set the parent
          //relationship to point to this ownerObject (The object which hasMany of these records)
          'load': {
            scope: this,
            fn: function(store, records, options) {
              Ext.each(records, function(record) {
                record.newRecord = false;
                if (record.parent && record.parent.set) {
                  record.parent.set(ownerObject);
                }
              }, this);
            }
          }
        }
      });
      
      return callAssociatedObjectClassMethod('findAll', [storeOptions]);
    },
    
    /**
     * Creates (builds and attempts to save) this associated model
     * @param {Object} fields Object with keys and values to initialise this object
     * @param {Object} saveConfig Passed to the Ext.Ajax request, supply success and failure options here
     */
    create: function(fields, saveConfig) {
      return this.build(fields).save(saveConfig);
    },
    
    /**
     * Builds an instantiation of the associated model with the supplied data.
     * Automatically links in the correct foreign key
     * @param {Object} fields The data to initialize this object with
     */
    build: function(fields) {
      var fields = fields || {};
      
      //instantiate the new object with the augmented fields
      var obj = new associatedObjectClass(fields);
      
      //set up the object's belongsTo association.  This also sets up the foreign key
      var assocName = ExtMVC.model.Association.belongsToAssociationName(ownerObject.className);
      obj[assocName].set(ownerObject);
      
      return obj;
    },

    /**
     * Adds an existing (saved) instantiation of the associated model to this model's hasMany collection
     * @param {ExtMVC.model} modelObject The existing, saved model
     */
    add: function(modelObject) {
      //TODO: implement this
      
    },

    destroy: function(id) {
      //TODO: implement this
      
    }
  });
};

// Ext.extend(ExtMVC.model.HasManyAssociation, ExtMVC.model.Association);