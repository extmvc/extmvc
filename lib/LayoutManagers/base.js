/* Abstract base LayoutManager class.  Don't use this directly, use one of the subclasses */
Ext.ux.MVC.LayoutManager.Base = function(config) {
  var config = config || {};
  
  //register the events that LayoutManager fires
  this.addEvents({
    "beforeshowpanel": true,
    "showpanel"      : true
  });
  
  /**
   * Most Layout Managers would override initialize to provide
   * specific setup functions
   */
  this.initialize = Ext.emptyFn;
  
  this.showPanel = function() {
    throw new Error('All LayoutManagers must implement showPanel');
  };
  
  if (config.autoInitialize) {
    this.initialize();
  };
};

Ext.extend(Ext.ux.MVC.LayoutManager.Base, Ext.util.Observable);