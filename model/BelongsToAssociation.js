/**
 * @class ExtMVC.model.BelongsToAssociation
 * @extends ExtMVC.model.Association
 */
ExtMVC.model.BelongsToAssociation = function(ownerObject, config) {
  var config = config || {};
  
  Ext.applyIf(config, {
    associationName: ExtMVC.model.Association.belongsToAssociationName(config.name)
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
  };
  
  return {
    /**
     * @property associationName
     * @type String
     * Returns the name of this association so that the model can add it to its definition
     */
    associationName: config.associationName,
    
    /**
     * @property associationClass
     * @type ExtMVC.model
     * A reference to the association's class (e.g. belongsTo: "Post" would have associationClass of Post)
     */
    associationClass: associatedObjectClass,
    
    /**
     * @property associationType
     * @type String
     * The type of association (hasMany or belongsTo)
     */
    associationType: 'belongsTo',
    
    /**
     * @property lastFetched
     * @type Date
     * Date object representing the last time the associated object was successfully fetched
     */
    lastFetched: null,
    
    /**
     * Sets the associated model for this association to the specified model object
     * @param {ExtMVC.model} modelObject The associated model to set this belongsTo association to
     */
    set: function(modelObject) {
      this.lastFetched = new Date();
      this.cachedObject = modelObject;
      
      //add the foreign key automatically
      ownerObject.data[modelObject.foreignKeyName] = modelObject.data[config.primaryKey];
    },
    
    /**
     * Gets the associated model for this association
     * @param {Object} options Options to pass through to the Ajax load request
     * @param {Number} cacheFor If the object has been retrieved less than this number of seconds ago, use the cached object
     */
    get: function(options, cacheFor) {
      var options  = options  || {};
      var cacheFor = cacheFor || 0;
      
      Ext.applyIf(options, {
        loadSuccess: Ext.emptyFn,
        loadFailure: Ext.emptyFn
      });
      
      var cacheIsCurrent = (((new Date() - this.lastFetched) / 1000) < cacheFor) || (cacheFor == -1);
      
      if (this.lastFetched && this.cachedObject && cacheIsCurrent) {
        //return the cached object via a callback
        options.loadSuccess.call(options.scope || this, this.cachedObject);
        
        //also return via normal return if this is a cached object.  This allows some functions to use the cached object
        //without the overhead of setting up a callback, so long as they first check that the object has been fetched
        return this.cachedObject;
      } else {
        //inject caching code before loadSuccess - caches the object into this.cachedObject and sets this.lastFetched to now
        Ext.apply(options, {
          loadSuccess: options.loadSuccess.createInterceptor(function(obj) {
            this.cachedObject = obj;
            this.lastFetched  = new Date();
          }, this)
        });
        
        return callAssociatedObjectClassMethod('findById', [1, options]);
      };
    }
  };
};