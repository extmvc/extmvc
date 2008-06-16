/**
 * Ext.ux.MVC.helper.button.DefaultAddButton
 * Simple set of sensible defaults for an Add button - just sets an iconCls and text
 * @extends Ext.Toolbar.Button
 * @cfg {Ext.ux.MVC.model} model The model this button is for (optional - used for tooltip)
 */
Ext.ux.MVC.helper.button.DefaultAddButton = function(config) {
  var config = config || {};
  
  Ext.applyIf(config, {
    iconCls: 'add',
    text:    'Add',
    handler: function() {alert("This shouldn't ever appear.  It means you haven't passed a handler to your DefaultAddbutton");}
  });
  
  if (config.model) {
    Ext.applyIf(config, {
      tooltip: 'Shows new ' + config.model.human_singular_name + ' form (shortcut key: a)'
    });
  };
  
  Ext.ux.MVC.helper.button.DefaultAddButton.superclass.constructor.call(this, config);
};
Ext.extend(Ext.ux.MVC.helper.button.DefaultAddButton, Ext.Toolbar.Button);
Ext.reg('default_add_button', Ext.ux.MVC.helper.button.DefaultAddButton);


/**
 * Ext.ux.MVC.helper.button.DefaultEditButton
 * Simple set of sensible defaults for an Edit Button
 * @extends Ext.Toolbar.Button
 * @cfg {Ext.ux.MVC.model} model The model this button is for (optional - used for tooltip)
 */
Ext.ux.MVC.helper.button.DefaultEditButton = function(config) {
  var config = config || {};
  
  Ext.applyIf(config, {
    iconCls:  'edit',
    text:     'Edit',
    disabled: true,
    handler: function() {alert("This shouldn't ever appear.  It means you haven't passed a handler to your DefaultEditbutton");}
  });
  
  if (config.model) {
    Ext.applyIf(config, {
      tooltip: 'Edits all selected ' + config.model.human_plural_name + ' (shortcut key: e)'
    });
  };
  
  Ext.ux.MVC.helper.button.DefaultEditButton.superclass.constructor.call(this, config);
};
Ext.extend(Ext.ux.MVC.helper.button.DefaultEditButton, Ext.Toolbar.Button);
Ext.reg('default_edit_button', Ext.ux.MVC.helper.button.DefaultEditButton);


/**
 * Ext.ux.MVC.helper.button.DefaultDeleteButton
 * Simple set of sensible defaults for a Delete Button
 * @extends Ext.Toolbar.Button
 * @cfg {Ext.ux.MVC.model} model The model this button is for (optional - used for tooltip)
 */
Ext.ux.MVC.helper.button.DefaultDeleteButton = function(config) {
  var config = config || {};
  
  Ext.applyIf(config, {
    iconCls:  'delete',
    text:     'Delete',
    disabled: true,
    handler: function() {alert("This shouldn't ever appear.  It means you haven't passed a handler to your DefaultDeletebutton");}
  });
  
  if (config.model) {
    Ext.applyIf(config, {
      tooltip: 'Deletes all selected ' + config.model.human_plural_name + ' (shortcut key: Delete)'
    });    
  };
  
  Ext.ux.MVC.helper.button.DefaultDeleteButton.superclass.constructor.call(this, config);
};
Ext.extend(Ext.ux.MVC.helper.button.DefaultDeleteButton, Ext.Toolbar.Button);
Ext.reg('default_delete_button', Ext.ux.MVC.helper.button.DefaultDeleteButton);