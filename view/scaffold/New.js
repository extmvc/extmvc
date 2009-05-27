/**
 * @class ExtMVC.view.scaffold.New
 * @extends ExtMVC.view.scaffold.ScaffoldFormPanel
 * Shows a generic new form for a given model
 */
ExtMVC.view.scaffold.New = Ext.extend(ExtMVC.view.scaffold.ScaffoldFormPanel, {

  /**
   * Sets this panel's title, if not already set.  Also specifies the save handler to use
   */
  initComponent: function() {
    Ext.applyIf(this, {
      title: 'New ' + this.model.prototype.singularHumanName
    });
    ExtMVC.view.scaffold.New.superclass.initComponent.apply(this, arguments);
  }
});

Ext.reg('scaffold_new', ExtMVC.view.scaffold.New);