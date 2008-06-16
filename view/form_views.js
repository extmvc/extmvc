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
    labelAlign: 'top',
    autoScroll: true,
    bodyStyle: 'position: relative;', //fixes an IE bug where scrolling forms go nuts
    iconCls: 'form_new',
    title: 'New ' + singular,
    url: config.model.collectionUrl(config)
  });
  
  Ext.ux.MVC.view.DefaultNewForm.superclass.constructor.call(this, config);
  
  //set some more sensible defaults, and what to do on save and cancel
  Ext.applyIf(config, {
    cancelAction: function() {
      if (config.model.parent_model) {
        // show the edit page for this model's parent
        controller = application.getControllerByName(config.model.parent_model.controller_name);
        controller.viewEdit([{data: config}]);
      } else {
        // show this model's index grid
        controller = application.getControllerByName(config.model.controller_name);
        controller.viewIndex();
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
          flash('The ' + singular + ' was created successfully', singular + ' Created');
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


/**
 * Ext.ux.MVC.view.DefaultEditForm
 * @extends Ext.FormPanel
 * Provides a sensible default edit panel for any model
 */
Ext.ux.MVC.view.DefaultEditForm = function(config) {
  var config = config || {};
  if (!config.model) {alert("No model provided to the DefaultEditForm"); return false;};
  
  //set some sensible default properties
  Ext.applyIf(config, {
    frame: true,
    iconCls: 'form_edit',
    title: 'Edit ' + config.model.human_singular_name,
    autoScroll: true,
    autoLoadForm: true,
    bodyStyle: 'position: relative', //fixes an IE bug where scrolling forms go nuts
    labelAlign: 'top',
    addDefaultButtons: true
  });
  
  //set what to do on Save or Cancel
  Ext.applyIf(config, {
    cancelAction: function() {config.editNext(config.records);},
    saveAction: function() {      
      //trigger any Tiny MCE instances to save first
      try {
        tinymce.EditorManager.triggerSave();
      } catch(e) {}
      
      this.form.submit({
        waitMsg: 'Saving Data...',
        url: '/admin/' + config.model.url_name + '/' + config.records[0].data.id + '.ext_json',
        failure: function() {
          Ext.Msg.alert('Operation Failed', 'There were errors saving this ' + config.model.human_singular_name + ', please see any fields with red icons');
        },
        success: function(formElement, action) {
          if (config.success) {
            config.success.call(this, action.result, form);
          };
          flash("Your changes have been saved", config.model.human_singular_name + ' successfully updated');
          config.editNext(config.records);
        }
      });
    },
    editNext: function(records) {
      records.reverse();
      current_record = records.pop();
      records.reverse();
      
      if (records instanceof Array && records.length > 0) {
        // edit the next item
        application.getControllerByName(this.model.controller_name).viewEdit(records);
      } else {
        if (this.model.parent_model) {
          // view this model's parent's edit form
          controller = application.getControllerByName(this.model.parent_model.controller_name);
          
          // FIXME: create a fake record.  We're relying on the fact that this record has all of its parents'
          // IDs in current_record.data.  We just replace the value of current_record.data.id with the value of
          // its parent's ID and then pass that to the parent edit form to load.  The parent edit form only looks
          // at the ID field and any of it's own parent IDs when loading, so ignores all of the actual data
          // inside current_record.data.
          // Still, this is **HORRIBLE**
          parent_record = current_record;
          parent_record.data.id = current_record.data[this.model.parent_model.foreign_key_name];
          
          controller.viewEdit([parent_record]);
        } else {
          // view this model's index
          application.getControllerByName(this.model.controller_name).viewIndex();
        }
      }
    },
    handleKeypress : function(ev) {
      if(ev.getKey() == Ext.EventObject.ESC) {
        config.cancelAction();
        ev.stopEvent();
      } else if (ev.ctrlKey) {
        var keyNum = ev.getCharCode();
        switch (keyNum) {
          case 115: config.saveAction(); ev.stopEvent(); //CTRL + s
        }
      }
    }
  });
  
  Ext.ux.MVC.view.DefaultEditForm.superclass.constructor.call(this, config);
  
  if (config.addDefaultButtons) {
    this.saveButton = new Ext.Button({
      text: 'Save',
      iconCls: 'save',
      scope: this,
      handler: config.saveAction,
      tooltip: 'Saves this ' + config.model.human_singular_name + ' (keyboard shortcut: CTRL + s)'
    });
    
    this.cancelButton = new Ext.Button({
      text: 'Cancel', 
      iconCls: 'cancel',
      handler: config.cancelAction, 
      tooltip: 'Keyboard shortcut: ESC'
    });
    
    this.addButton(this.saveButton);
    this.addButton(this.cancelButton);  
  };
  
  //load the record into the form
  if (config.autoLoadForm) {
    config.model.loadFormWithRecord(config.records[0], this);
  };
};
Ext.extend(Ext.ux.MVC.view.DefaultEditForm, Ext.FormPanel);
Ext.reg('default_new_form', Ext.ux.MVC.view.DefaultEditForm);

// a globally re-usable field to add to any forms needing to send a PUT request
var putMethodField = [{
  xtype: 'hidden',
  name: '_method',
  value: 'put'
}];