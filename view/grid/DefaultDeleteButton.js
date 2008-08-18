/**
 * Ext.ux.MVC.DefaultDeleteButton
 * Simple set of sensible defaults for a Delete Button
 * @extends Ext.Toolbar.Button
 * @cfg {Ext.ux.MVC.model} model The model this button is for (optional - used for tooltip)
 */
Ext.ux.MVC.DefaultDeleteButton = function(config) {
  var config = config || {};
  
  if (!config.handler) {
    throw new Error("You must supply a handler to DefaultDeleteButton");
  };
  
  Ext.applyIf(config, {
    iconCls:  'delete',
    text:     'Delete',
    disabled: true
  });
  
  if (config.model) {
    Ext.applyIf(config, {
      tooltip: 'Deletes all selected ' + config.model.human_plural_name + ' (shortcut key: Delete)'
    });    
  };
  
  Ext.ux.MVC.DefaultDeleteButton.superclass.constructor.call(this, config);
};
Ext.extend(Ext.ux.MVC.DefaultDeleteButton, Ext.Toolbar.Button);
Ext.reg('default_delete_button', Ext.ux.MVC.DefaultDeleteButton);