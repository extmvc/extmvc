/**
 * Ext.ux.MVC.view.DefaultSingletonForm
 * @extends Ext.FormPanel
 * Provides a sensible default for any singleton model (e.g. Account - there is only one Account)
 */
Ext.ux.MVC.view.DefaultSingletonForm = function(config) {
  var config = config || {};
  
  Ext.applyIf(config, {
    items: null,
    frame: true,
    changeDocumentTitle: true,
    labelAlign: 'left',
    autoScroll: true,
    autoLoadForm: true,
    iconCls: 'form_new',
    bodyStyle: 'position: relative'
  });
  
  Ext.applyIf(config, {
    url: config.model.singleDataUrl(config),
    title: 'Edit ' + config.model.human_singular_name
  });
  
  Ext.ux.MVC.view.DefaultSingletonForm.superclass.constructor.call(this, config);
  
  
  if (config.changeDocumentTitle) {
    document.title = "Edit the " + config.model.human_singular_name;
  };
  
  Ext.applyIf(config, {
    saveAction: function() {
      this.form.submit({
        url: config.model.singleDataUrl,
        waitMsg: 'Saving Data...',
        failure: function() {
          Ext.Msg.alert('Operation Failed', 'There were errors saving the ' + config.model.human_singular_name + ', please see any fields with red icons');
        },
        success: function(formElement, action) {
          Ext.ux.MVC.Flash.flash('The ' + config.model.human_singular_name + ' was updated successfully', config.model.human_singular_name + ' Updated');
          if (config.success) {
            config.success.call(this, action.result, form);
          };
        }
      });
    }
  });
  
  this.addButton({
    text: 'Save',
    iconCls: 'save',
    scope: this,
    handler: config.saveAction,
    tooltip: 'Saves this ' + config.model.human_singular_name + ' (keyboard shortcut: CTRL + s)'
  });
  
  this.handleKeypress = function(ev) {
    if (ev.ctrlKey) {
      var keyNum = ev.getCharCode();
      switch (keyNum) {
        case 115: config.saveAction(); //CTRL + s
        
        ev.stopEvent();
      }
    }
  };
  
  if (config.autoLoadForm) {
    config.model.loadFormWithSingletonRecord(this);
  };
};
Ext.extend(Ext.ux.MVC.view.DefaultSingletonForm, Ext.FormPanel);
Ext.reg('default_singleton_form', Ext.ux.MVC.view.DefaultSingletonForm);
