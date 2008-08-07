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
    changeDocumentTitle: true,
    title: 'Edit ' + config.model.human_singular_name,
    autoScroll: true,
    autoLoadForm: true,
    bodyStyle: 'position: relative', //fixes an IE bug where scrolling forms go nuts
    labelAlign: 'top',
    addDefaultButtons: true,
    addPutMethodField: true //automatically adds a field called '_method' with value 'PUT'
  });
  
  if (config.addPutMethodField) {
    config.items = [{ xtype: 'hidden', name: '_method', value: 'put'}].concat(config.items);
  };
  
  if (config.changeDocumentTitle) {
    document.title = "Edit " + config.model.human_singular_name;
  };
  
  //set what to do on Save or Cancel
  Ext.applyIf(config, {
    cancelAction: function() {config.editNext();},
    saveAction: function() {
      //TODO: this should NOT be here
      //trigger any Tiny MCE instances to save first
      try {
        tinymce.EditorManager.triggerSave();
      } catch(e) {}
      
      ids = Ext.ux.MVC.params[":id"].split(",");
      
      this.form.submit({
        waitMsg: 'Saving Data...',
        url: config.model.singleDataUrl(ids[0]),
        failure: function() {
          Ext.Msg.alert('Operation Failed', 'There were errors saving this ' + config.model.human_singular_name + ', please see any fields with red icons');
        },
        success: function(formElement, action) {
          if (config.success) {
            config.success.call(this, action.result, form);
          };
          flash("Your changes have been saved", config.model.human_singular_name + ' successfully updated');
          config.editNext();
        }
      });
    },
    editNext: function() {
      ids = Ext.ux.MVC.params[":id"].split(",");
      current_id = ids.shift();
      
      if (ids instanceof Array && ids.length > 0) {
        // edit the next item
        Ext.History.add(this.model.editUrl(ids.join(",")));
      } else {
        if (this.model.parent_model) {
          //try to go back to the parent's grid edit page, else go back to parent's grid
          if (parent_id = Ext.ux.MVC.params[this.model.parent_model.parametized_foreign_key_name]) {
             Ext.History.add(this.model.parent_model.editUrl(parent_id));
          } else {
             Ext.History.add(this.model.parent_model.collectionUrl());
          };
        } else {
          // view this model's index
          Ext.History.add(this.model.collectionUrl());
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
    config.model.loadFormWithId(config.ids[0], this);
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
          flash('The ' + config.model.human_singular_name + ' was updated successfully', config.model.human_singular_name + ' Updated');
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
 
// a globally re-usable field to add to any forms needing to send a PUT request
var putMethodField = [{
  xtype: 'hidden',
  name: '_method',
  value: 'put'
}];