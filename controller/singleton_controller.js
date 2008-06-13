Ext.ux.MVC.controller.SingletonController = function(config) {
  Ext.apply(this, config);
  Ext.ux.MVC.controller.CrudController.superclass.constructor.call(this, config);
};

Ext.extend(Ext.ux.MVC.controller.SingletonController, Ext.ux.MVC.controller.Base, {
  viewIndex : function(options) {
    return this.viewEdit(options);
  },
  
  viewEdit: function(options) {
    this.showPanel(new this.editPanel(options));
  }
});