<%= controller_class_name %>Controller = Ext.extend(CrudController, {
  constructor: function(config) {
    <%= controller_class_name %>Controller.superclass.constructor.call(this, {
      model      : <%= file_name %>, 
      indexPanel : <%= file_name %>IndexPanel,
      editPanel  : <%= file_name %>EditPanel,
      newPanel   : <%= file_name %>NewPanel
    });
  }
});
