/**
 * @class ExtMVC.view.scaffold.New
 * @extends ExtMVC.view.scaffold.ScaffoldFormPanel
 * Shows a generic new form for a given model
 */
ExtMVC.registerView('scaffold', 'new', {
  xtype        : 'scaffold_form',
  registerXType: 'scaffold_new',

  /**
   * Sets this panel's title, if not already set.  Also specifies the save handler to use
   */
  initComponent: function() {
    Ext.applyIf(this, {
      title: 'New ' + this.model.prototype.singularHumanName
    });
    
    ExtMVC.getView('scaffold', 'form').prototype.initComponent.apply(this, arguments);
  }
});
