/**
 * @class Ext.ux.MVC.view.scaffold.New
 * @extends Ext.ux.MVC.view.scaffold.ScaffoldFormPanel
 * Shows a generic new form for a given model
 */
Ext.ux.MVC.view.scaffold.New = Ext.extend(Ext.ux.MVC.view.scaffold.ScaffoldFormPanel, {
  
  /**
   * Sets this panel's title, if not already set.  Also creates an empty model instance
   */
  initComponent: function() {
    Ext.applyIf(this, {
      title:    'New ' + this.model.prototype.modelName.capitalize()
    });
    Ext.ux.MVC.view.scaffold.New.superclass.initComponent.apply(this, arguments);
  }
});

Ext.reg('scaffold_new', Ext.ux.MVC.view.scaffold.New);