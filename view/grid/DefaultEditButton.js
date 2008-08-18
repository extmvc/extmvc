/**
 * Ext.ux.MVC.DefaultEditButton
 * Simple set of sensible defaults for an Edit Button
 * @extends Ext.Toolbar.Button
 * @cfg {Ext.ux.MVC.model} model The model this button is for (optional - used for tooltip)
 */
Ext.ux.MVC.DefaultEditButton = function(config) {
  var config = config || {};
  
  if (!config.handler) {
    throw new Error("You must supply a handler to DefaultEditButton");
  };
  
  Ext.applyIf(config, {
    iconCls:  'edit',
    text:     'Edit',
    disabled: true
  });
  
  if (config.model) {
    Ext.applyIf(config, {
      tooltip: 'Edits all selected ' + config.model.human_plural_name + ' (shortcut key: e)'
    });
  };
  
  Ext.ux.MVC.DefaultEditButton.superclass.constructor.call(this, config);
};
Ext.extend(Ext.ux.MVC.DefaultEditButton, Ext.Toolbar.Button);
Ext.reg('default_edit_button', Ext.ux.MVC.DefaultEditButton);