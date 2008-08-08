/**
 * Ext.ux.MVC.view.DefaultNewForm
 * @extends Ext.FormPanel
 * Provides a sensible default for a form which creates a new object for any type of model
 */
Ext.ux.MVC.view.DefaultNewForm = function(config) {
  var config = config || {};
  if (!config.model) {alert("No model provided to the DefaultNewForm"); return false;};
  
  //keep a local reference to the model's human_singular name to save my fingers
  var singular = config.model.human_singular_name;
  
  //set some sensible defaults
  Ext.applyIf(config, {
    frame: true,
    changeDocumentTitle: true,
    labelAlign: 'top',
    autoScroll: true,
    bodyStyle: 'position: relative;', //fixes an IE bug where scrolling forms go nuts
    iconCls: 'form_new',
    title: 'New ' + singular,
    url: config.model.collectionDataUrl(config)
  });
  
  Ext.ux.MVC.view.DefaultNewForm.superclass.constructor.call(this, config);
  
  if (config.changeDocumentTitle) {
    document.title = "New " + config.model.human_singular_name;
  };
    
  //set some more sensible defaults, and what to do on save and cancel
  Ext.applyIf(config, {
    cancelAction: function() {
      if (config.model.parent_model) {
        //TODO: this probably isn't guaranteed to work all of the time
        // show the edit page for this model's parent (by going back)
        Ext.History.back();
      } else {
        // show this model's index grid
        Ext.History.add(config.model.collectionUrl());
      };
    },
    saveAction: function() {
      //trigger any Tiny MCE instances to save first
      try {
        tinymce.EditorManager.triggerSave();
      } catch(e) {}
      
      this.form.submit({
        url: config.url, 
        waitMsg: 'Saving Data...',
        failure: function() {
          Ext.Msg.alert('Operation Failed', 'There were errors saving this ' + singular + ', please see any fields with red icons');
        },
        success: function(formElement, action) {
          Ext.ux.MVC.Flash.flash('The ' + singular + ' was created successfully', singular + ' Created');
          if (config.afterSave) {
            config.afterSave.call(this, action.result, form);
          } else {
            config.cancelAction();
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
    tooltip: 'Saves this ' + singular + ' (keyboard shortcut: CTRL + s)'
  }); 
     
  this.addButton({
    text: 'Cancel', 
    iconCls: 'cancel', 
    handler: config.cancelAction, 
    tooltip: 'Keyboard shortcut: ESC'
  });
  
  this.handleKeypress = function(ev) {
    if(ev.getKey() == Ext.EventObject.ESC) {
      config.cancelAction();
      ev.stopEvent();
    } else if (ev.ctrlKey) {
      var keyNum = ev.getCharCode();
      switch (keyNum) {
        case 115: config.saveAction(); //CTRL + s
        
        ev.stopEvent();
      }
    }
  };
  
};
Ext.extend(Ext.ux.MVC.view.DefaultNewForm, Ext.FormPanel);
Ext.reg('default_new_form', Ext.ux.MVC.view.DefaultNewForm);
