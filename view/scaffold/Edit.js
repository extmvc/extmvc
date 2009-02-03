/**
 * @class Ext.ux.MVC.view.scaffold.Edit
 * @extends Ext.ux.MVC.view.scaffold.ScaffoldFormPanel
 * Shows a generic edit form for a given model
 */
Ext.ux.MVC.view.scaffold.Edit = Ext.extend(Ext.ux.MVC.view.scaffold.ScaffoldFormPanel, {
  
  /**
   * Sets the panel's title, if not already set
   */
  initComponent: function() {
    Ext.applyIf(this, {
      title:       'Edit ' + this.model.prototype.modelName.capitalize(),
      saveHandler: this.onUpdate
    });
    
    Ext.ux.MVC.view.scaffold.Edit.superclass.initComponent.apply(this, arguments);
  }
});

Ext.reg('scaffold_edit', Ext.ux.MVC.view.scaffold.Edit);