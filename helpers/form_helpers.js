function defaultNewForm(config) {
  var options = {};
    
  Ext.apply(options, config, {
    items: null,
    model: Model,
    frame: true,
    labelAlign: 'left',
    autoScroll: true,
    iconCls: 'form_new',
    bodyStyle: 'position: relative'
  });
  
  Ext.apply(options, {}, {
    url: '/admin/' + options.model.url_name,
    title: 'New ' + options.model.human_singular_name,
    cancelAction: function() {
      controller = application.getControllerByName(options.model.controller_name);
      controller.viewIndex();
    },
    saveAction: function() {
      form.form.submit({
        url: '/admin/' + options.model.url_name + '.ext_json', 
        waitMsg: 'Saving Data...',
        failure: function() {Ext.Msg.alert('Operation Failed', 'There were errors saving this ' + options.model.human_singular_name + ', please see any fields with red icons')},
        success: function(formElement, action) {
          flash('The ' + options.model.human_singular_name + ' was created successfully', options.model.human_singular_name + ' Created');
          if (options.success) {
            options.success.call(this, action.result, form);
          } else {
            controller = application.getControllerByName(options.model.controller_name);
            controller.viewIndex();
          };
        }
      });
    }
  });
  
  this.form = new Ext.FormPanel(options);
  
  this.form.addButton({
    text: 'Save',
    iconCls: 'save',
    handler: options.saveAction,
    tooltip: 'Saves this ' + options.model.human_singular_name + ' (keyboard shortcut: CTRL + s)'
  }); 
     
  this.form.addButton({
    text: 'Cancel', 
    iconCls: 'cancel', 
    handler: options.cancelAction, 
    tooltip: 'Keyboard shortcut: ESC'
  });
  
  this.form.handleKeypress = function(ev) {
    if(ev.getKey() == Ext.EventObject.ESC) {
      options.cancelAction();
      ev.stopEvent();
    } else if (ev.ctrlKey) {
      var keyNum = ev.getCharCode();
      switch (keyNum) {
        case 115: options.saveAction(); //CTRL + s
        
        ev.stopEvent();
      }
    }
  };
  
  return this.form;
}

function defaultEditForm(config) {
  var options = {};
  
  Ext.apply(options, config, {
    items: null,
    model: Model,
    frame: true,
    iconCls: 'form_edit',
    autoScroll: true,
    labelAlign: 'left'
  });
  
  Ext.applyIf(options, {
    title: 'Edit ' + options.model.human_singular_name,
    cancelAction: function() {options.editNext(options.ids);},
    saveAction: function() {      
      form.form.submit({
        waitMsg: 'Saving Data...',
        url: '/admin/' + options.model.url_name + '/' + options.ids[0] + '.ext_json',
        failure: function() {Ext.Msg.alert('Operation Failed', 'There were errors saving this ' + options.model.human_singular_name + ', please see any fields with red icons')},
        success: function(formElement, action) {
          if (options.success) {options.success.call(this, action.result, form);};
          flash("Your changes have been saved", options.model.human_singular_name + ' successfully updated')
          options.editNext(options.ids);
        }
      });
    },
    editNext: function(ids) {
      ids.reverse();ids.pop();ids.reverse();
            
      controller = application.getControllerByName(this.model.controller_name);
      if (ids instanceof Array && ids.length > 0) {
        controller.viewEdit(ids);
      } else {
        controller.viewIndex();
      }        
    }
  });
  
  this.form = new Ext.FormPanel(options);
  
  this.form.addButton({
    text: 'Save',
    iconCls: 'save',
    handler: options.saveAction,
    tooltip: 'Saves this ' + options.model.human_singular_name + ' (keyboard shortcut: CTRL + s)'
  });
  
  this.form.addButton({
    text: 'Cancel', 
    iconCls: 'cancel',
    handler: options.cancelAction, 
    tooltip: 'Keyboard shortcut: ESC'
  });

  this.form.handleKeypress = function(ev) {
    if(ev.getKey() == Ext.EventObject.ESC) {
      options.cancelAction();
      ev.stopEvent();
    } else if (ev.ctrlKey) {
      var keyNum = ev.getCharCode();
      switch (keyNum) {
        case 115: options.saveAction(); ev.stopEvent(); //CTRL + s
      }
    }
  };
  
  return this.form;
};

// a globally re-usable field to add to any forms needing to send a PUT request
var putMethodField = [{
  xtype: 'hidden',
  name: '_method',
  value: 'put'
}];