/**
 * @class ExtMVC.Presenter
 * @extends Ext.util.Observable
 * Used as an interface between a controller and its views
 */
ExtMVC.Presenter = Ext.extend(Ext.util.Observable, {

  constructor: function(config) {
    ExtMVC.Presenter.superclass.constructor.apply(this, arguments);
    
    this.addEvents(
      /**
       * @event load
       * Fires when all items in the Presenter have been loaded
       */
      'load'
    );
    
    /**
     * @property loaded
     * @type Boolean
     * True if all items that must be loaded before rendering have been
     */
    this.loaded = false;
    
    /**
     * @property loading
     * @type Boolean
     * True while the loader is loading
     */
    this.loading = false;
  },
  
  load: function() {
    if (this.loaded || this.loading) return;
    
    this.each(function(item, index, length) {
      var callback = function(index) {
        return function() {
          if (index == length) {
            this.loaded = true;
            this.loading = false;
            
            this.fireEvent('load');
          }
        };
      }(index);
      
      item.on('load', callback, this, {single: true});
    }, this);
  }
});