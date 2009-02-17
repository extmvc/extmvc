/**
 * @class ExtMVC.view.scaffold.Edit
 * @extends ExtMVC.view.scaffold.ScaffoldFormPanel
 * Shows a generic edit form for a given model
 */
ExtMVC.view.scaffold.Edit = Ext.extend(ExtMVC.view.scaffold.ScaffoldFormPanel, {
  
  /**
   * Sets the panel's title, if not already set
   */
  initComponent: function() {
    Ext.applyIf(this, {
      title:       'Edit ' + this.model.prototype.modelName.capitalize(),
      saveHandler: this.onUpdate
    });
    
    ExtMVC.view.scaffold.Edit.superclass.initComponent.apply(this, arguments);
  }
});

Ext.reg('scaffold_edit', ExtMVC.view.scaffold.Edit);