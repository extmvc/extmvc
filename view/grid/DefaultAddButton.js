/**
 * Ext.ux.MVC.DefaultAddButton
 * Simple set of sensible defaults for an Add button - just sets an iconCls and text
 * @extends Ext.Toolbar.Button
 * @cfg {Ext.ux.MVC.model} model The model this button is for (optional - used for tooltip)
 */
Ext.ux.MVC.DefaultAddButton = function(config) {
  var config = config || {};
  
  if (!config.handler) {
    throw new Error("You must supply a handler to DefaultAddButton");
  };
  
  Ext.applyIf(config, {
    iconCls: 'add',
    text:    'Add'
  });
  
  if (config.model) {
    Ext.applyIf(config, {
      tooltip: 'Shows new ' + config.model.human_singular_name + ' form (shortcut key: a)'
    });
  };
  
  Ext.ux.MVC.DefaultAddButton.superclass.constructor.call(this, config);
};
Ext.extend(Ext.ux.MVC.DefaultAddButton, Ext.Toolbar.Button);
Ext.reg('default_add_button', Ext.ux.MVC.DefaultAddButton);
