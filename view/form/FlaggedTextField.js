/**
 * Ext.ux.MVC.view.FlaggedTextField
 * @extends Ext.view.TextField
 * Provides a button next to each form field to flag as inappropriate
 */
Ext.ux.MVC.view.FlaggedTextField = function(config) {
  var config = config || {};
  var panel_config = {};
  var textfield_config = {};
  Ext.apply(textfield_config, {xtype: 'textfield'}, config);
    
  this.flagButton = new Ext.Button({
    iconCls: 'flag_yellow',
    style: 'padding-top: 18px;',
    tooltip: "Click to flag this field as inappropriate",
    scope: this,
    handler: function() {
      window_config = {
        field_id: textfield_config.id,
        fieldLabel: textfield_config.fieldLabel,
        flaggedTextField: this
      };
      this.win = new Ext.ux.MVC.FlaggedTextFieldWindow(window_config);
      this.win.show();
    }
  });
  
  this.textField = new Ext.form.TextField(textfield_config);
  
  Ext.apply(panel_config, {
    layout: 'form',
    items: [
      {
        layout: 'column',
        items: [
          {
            columnWidth: .85,
            layout: 'form',
            items: [
              this.textField
            ]
          },
          {
            columnWidth: .15,
            layout: 'form',
            items: [
              this.flagButton
            ]
          }
        ]
      }
    ]
  });
  
  //call this after data have been loaded - this changes the button's appearance
  /**
   * Call this with the record that has been loaded into the form.  If there is a profile_review
   * matching this field, change the flag from yellow to red.  Otherwise turn to green.
   * 
   * TODO: This is far too implementation specific, refactor to provide some way of providing this logic in config
   */
  this.updateFlag = function(record) {
    //set to green once data have been loaded.  Set to red if appropriate below
    this.flagButton.setIconClass('flag_green');
    
    //if there is a profile review for this field, colour the flag red
    pr = record.data.profile_reviews;
    for (var i = pr.length - 1; i >= 0; i--){
      if (pr[i].field == textfield_config.id) {
        this.setFlagColour('red');
      };
    };
    
  };
  
  this.setFlagColour = function(colour) {
    this.flagButton.setIconClass('flag_' + colour);
  };
  
  Ext.ux.MVC.view.FlaggedTextField.superclass.constructor.call(this, panel_config);
};
Ext.extend(Ext.ux.MVC.view.FlaggedTextField, Ext.Panel);
Ext.reg('flagged_textfield', Ext.ux.MVC.view.FlaggedTextField);


/**
 * Ext.ux.MVC.FlaggedTextFieldWindow
 * @extends Ext.Window
 * Popup window used to gather flagging information.  Intended for use with a Ext.ux.MVC.FlaggedTextField
 */
Ext.ux.MVC.FlaggedTextFieldWindow = function(config) {
  var config = config || {};
  
  //find the current flag text if it exists
  flagText = ILF.flaggedFields[config.field_id];
  
  this.flagForm = new Ext.form.FormPanel({
    bodyStyle: 'background-color: #dfe8f6; padding: 15px',
    labelAlign: 'top',
    items: [
      {
        xtype: 'label',
        text: 'Field to flag: ' + config.fieldLabel
      },
      {
        xtype: 'textarea',
        fieldLabel: 'Reason',
        anchor: "100% 80%",
        id: config.field_id + "_flag_message",
        value: flagText
      }
    ],
    buttons: [
      {
        text: 'Mark as OK',
        iconCls: 'flag_green',
        scope: this,
        handler: function() {
          //all flagged fields are stored here before form submission
          f = ILF.flaggedFields;
          
          //unset the flag on this field.  Need to create a new object here
          //as setting to null still keeps a track of the flag instead of removing it
          newObject = {};
          for (field in f) {
            if (field != config.field_id) {
              newObject[field] = f[field];
            };
          };
          ILF.flaggedFields = newObject;
          
          //set the button's flag colour
          config.flaggedTextField.setFlagColour('green');
          
          //notify the user that they need to save the record
          Ext.ux.MVC.Flash.flash("The field has been unflagged, don't forget to save the form for changes to take effect", "Flag unset");
          this.window.close();
        }
      },
      {
        text: 'Mark as Flagged',
        iconCls: 'flag_red',
        scope: this,
        handler: function() {
          //all flagged fields are stored here before form submission
          f = ILF.flaggedFields;
          
          //set the flagged field for this field's ID to the message in the box above
          f[config.field_id] = Ext.getCmp(config.field_id + '_flag_message').getValue();
          
          //set the button's flag colour
          config.flaggedTextField.setFlagColour('red');
          
          //notify the user that they need to save the record
          Ext.ux.MVC.Flash.flash("The field has been marked as flagged, don't forget to save the form for changes to take effect", "Flag set");
          
          //close the window
          this.window.close();
        }
      }
    ]
  });
  
  Ext.applyIf(config, {
    title: 'Flag as inappropriate',
    // closeAction: 'hide',
    layout: 'fit',
    minHeight: 300,
    minWidth: 400,
    height: 300,
    width: 400,
    items: [
      this.flagForm
    ],
    modal: true
  });
  
  Ext.ux.MVC.FlaggedTextFieldWindow.superclass.constructor.call(this, config);
  
  this.window = this;
};
Ext.extend(Ext.ux.MVC.FlaggedTextFieldWindow, Ext.Window);