Ext.ux.MVC.controller.Base = function(config) {
  
  this.application = application;

  this.showPanel = function(panel) {
    this.application.getLayoutManager().showPanel(panel);
  };
};