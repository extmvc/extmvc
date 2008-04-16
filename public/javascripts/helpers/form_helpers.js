function defaultNewForm(config) {
  var options = {};
    
  Ext.apply(options, config, {
    items: null,
    model_name: Model,
    frame: true,
    labelAlign: 'left',
    iconCls: 'form_new',
    success: function() {}
  });
  
  Ext.apply(options, {}, {
    url: '/admin/' + options.model_name.plural_name,
    title: 'New ' + options.model_name.human_name,
    cancelAction: function() {ApplicationController.displayPanelFromModelAndKeyword(options.model_name.human_name, 'Index');},
    saveAction: function() {
      form.form.submit({
        url: '/admin/' + options.model_name.plural_name + '.ext_json', 
        waitMsg: 'Saving Data...',
        failure: function() {Ext.Msg.alert('Operation Failed', 'There were errors saving this ' + options.model_name.human_name + ', please see any fields with red icons')},
        success: function(formElement, action) {
          if (options.success) {
            options.success.call(this, action.result, form);
          } else {
            Ext.Msg.alert(options.model_name.human_name + ' Saved', 'The ' + options.model_name.human_name + ' has been saved successfully')
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
    tooltip: 'Saves this ' + options.model_name.human_name + ' (keyboard shortcut: CTRL + s)'
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
    model_name: Model,
    frame: true,
    iconCls: 'form_edit',
    labelAlign: 'left',
    success: function() {},
    cancelAction: function() {},
    editNext: function() {}
  });
    
  Ext.apply(options, {}, {
    title: 'Edit ' + options.model_name.human_name,
    cancelAction: function() {options.editNext(options.ids);},
    saveAction: function() {      
      form.form.submit({
        waitMsg: 'Saving Data...',
        url: '/admin/' + options.model_name.plural_name + '/' + options.ids[0] + '.ext_json',
        failure: function() {Ext.Msg.alert('Operation Failed', 'There were errors saving this ' + options.model_name.human_name + ', please see any fields with red icons')},
        success: function(formElement, action) {
          if (options.success) {options.success.call(this, action.result, form);};
          options.editNext(options.ids);
        }
      });
    },
    editNext: function(ids) {
      ids.reverse();ids.pop();ids.reverse();
      if (ids instanceof Array && ids.length > 0) {
        ApplicationController.displayPanelFromModelAndKeyword(options.model_name.human_name, 'Edit', {ids: ids});
      } else {
        ApplicationController.displayPanelFromModelAndKeyword(options.model_name.human_name, 'Index');
      }        
    }
  });
  
  this.form = new Ext.FormPanel(options);
  
  this.form.addButton({
    text: 'Save',
    iconCls: 'save',
    handler: options.saveAction,
    tooltip: 'Saves this ' + options.model_name.human_name + ' (keyboard shortcut: CTRL + s)'
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