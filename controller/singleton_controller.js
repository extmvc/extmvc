SingletonController = function(config) {
  Ext.apply(this, config);
  CrudController.superclass.constructor.call(this, config);
};

Ext.extend(SingletonController, ApplicationController, {
  viewIndex : function(options) {
    return this.viewEdit(options);
  },
  
  viewEdit: function(options) {
    this.showPanel(new this.editPanel(options));
  }
});