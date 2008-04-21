UsersController = Ext.extend(CrudController, {
  constructor: function(config) {
    UsersController.superclass.constructor.call(this, {
      model      : User, 
      indexPanel : UserIndexPanel,
      editPanel  : UserEditPanel,
      newPanel   : UserNewPanel
    });
  }
});
