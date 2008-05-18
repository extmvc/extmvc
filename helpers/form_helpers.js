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
  
  Ext.applyIf(options, {
    url: options.model.collectionUrl(config),
    title: 'New ' + options.model.human_singular_name,
    cancelAction: function() {
      if (model.parent_model) {
        // show the edit page for this model's parent
        controller = application.getControllerByName(options.model.parent_model.controller_name);
        controller.viewEdit([{data: config}]);
      } else {
        // show this model's index grid
        controller = application.getControllerByName(options.model.controller_name);
        controller.viewIndex();
      };
    }
  });
  
  Ext.applyIf(options, {
    saveAction: function() {
      form.form.submit({
        url: options.model.collectionUrl(config), 
        waitMsg: 'Saving Data...',
        failure: function() {Ext.Msg.alert('Operation Failed', 'There were errors saving this ' + options.model.human_singular_name + ', please see any fields with red icons')},
        success: function(formElement, action) {
          flash('The ' + options.model.human_singular_name + ' was created successfully', options.model.human_singular_name + ' Created');
          if (options.success) {
            options.success.call(this, action.result, form);
          } else {
            options.cancelAction();
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
    cancelAction: function() {options.editNext(options.records);},
    saveAction: function() {      
      form.form.submit({
        waitMsg: 'Saving Data...',
        url: '/admin/' + options.model.url_name + '/' + options.records[0].data.id + '.ext_json',
        failure: function() {Ext.Msg.alert('Operation Failed', 'There were errors saving this ' + options.model.human_singular_name + ', please see any fields with red icons')},
        success: function(formElement, action) {
          if (options.success) {options.success.call(this, action.result, form);};
          flash("Your changes have been saved", options.model.human_singular_name + ' successfully updated')
          options.editNext(options.records);
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
          // insde current_record.data.
          // Still, this is horrible
          parent_record = current_record;
          parent_record.data.id = current_record.data[this.model.parent_model.foreign_key_name];
          
          controller.viewEdit([parent_record]);
        } else {
          // view this model's index
          application.getControllerByName(this.model.controller_name).viewIndex();
        }
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