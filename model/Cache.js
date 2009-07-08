/**
 * @class ExtMVC.model.Cache
 * @extends Ext.util.Observable
 * Provides an interface for caching model objects which have been fetched from some database/backend
 */
ExtMVC.model.Cache = function(config) {
  var config = config || {};
 
  ExtMVC.model.Cache.superclass.constructor.call(this, config);
  
  this.addEvents(
    /**
     * @event beforeadd
     * Fires before an item is added to the cache
     * @param {ExtMVC.model} modelObject The model which is about to be added
     */
    'beforeadd',
    
    /**
     * @event add
     * Fires after an item is added to the cache
     * @param {ExtMVC.model} modelObject The model which was just added
     */
    'add',
    
    /**
     * @event beforeclear
     * Fires before the cache is cleared
     * @param {Number} seconds The number of seconds worth of caches which will be saved
     */
    'beforeclear',
    
    /**
     * @event clear
     * Fires after the cache has been cleared
     * @param {Number} seconds The number of seconds worth of caches which were saved
     */
    'clear'
  );
};

Ext.extend(ExtMVC.model.Cache, Ext.util.Observable, {
  
  /**
   * @property caches
   * @type Object
   * Maintains all cached objects
   */
  caches: {},
  
  /**
   * Adds the given model object to the cache.  Automatically stores the datetime of the add
   * @param {ExtMVC.model} modelObject The model you want to store in the cache
   */
  add: function(modelObject) {
    if (this.fireEvent('beforeadd', modelObject)) {
      var modelName = modelObject.className;
      var modelId   = modelObject.data.id;

      if (modelName && modelId) {
        modelObject.cachedAt = new Date();
        
        this.caches[modelName] = this.caches[modelName] || {};        
        this.caches[modelName][modelId] = modelObject;
        
        this.fireEvent('add', modelObject);
        return true;
      } else {
        
        return false;
      };
    }
  },
  
  /**
   * Fetches an object from the cache
   * @param {Object} params params object which must contain at least modelName and id.  Optionally 
   * supply staleTime, which is the number of seconds old the cached object is allowed to be to get a hit,
   * or a Date which will restrict hits to anything cached after that date
   * @return {ExtMVC.model/null} The model if found, or null
   */
  fetch: function(params) {
    this.caches[params['modelName']] = this.caches[params['modelName']] || {};
    
    var params = params || {};
    var hit    = this.caches[params['modelName']][params['id']];
    
    if (hit) {
      if (params.staleTime) {
        if (typeof params.staleTime == 'number') {
          var date = new Date();
          date.setTime(date.getTime() - (1000 * params.staleTime));
          params.staleTime = date;
        };
        
        //make sure we have a date object
        if (params.staleTime.getTime && hit.cachedAt > params.staleTime) {
          return hit;
        }
      } else {
        return hit;
      };
    };
  },
  
  /**
   * Clears all objects more than the given number of seconds old (defaults to clearing all objects)
   * @param {Number} seconds The number of seconds to keep cached objects for (e.g. setting this to 10 would delete anything cached more than 10 seconds ago)
   */
  clear: function(seconds) {
    var seconds = seconds || 0;
    var date = new Date();
    date.setTime(date.getTime() - (1000 * seconds));
    
    if (this.fireEvent('beforeclear', seconds)) {
      if (seconds == 0) {
        this.caches = {};
      } else {
        for (var i=0; i < this.caches.length; i++) {
          for (var j=0; j < this.caches[i].length; j++) {
            if (this.caches[i][j].cachedAt < date) {
              delete this.caches[i][j];
            };
          };
        };
      };
      
      this.fireEvent('clear', seconds);
    }
  }
});