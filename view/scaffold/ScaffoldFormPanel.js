/**
 * @class ExtMVC.view.scaffold.ScaffoldFormPanel
 * @extends Ext.form.FormPanel
 * Base class for any scaffold form panel (e.g. new and edit forms)
 */
ExtMVC.view.scaffold.ScaffoldFormPanel = Ext.extend(Ext.form.FormPanel, {
  
  /**
   * Sets up the FormPanel, adds default configuration and items
   */
  constructor: function(config) {
    var config = config || {};
    
    this.model = config.model;
    if (this.model == undefined) throw new Error("No model supplied to scaffold Form view");
    
    ExtMVC.view.scaffold.ScaffoldFormPanel.superclass.constructor.call(this, config);
  },
  
  /**
   * Adds default items, keys and buttons to the form
   */
  initComponent: function() {
    Ext.applyIf(this, {
      autoScroll: true,
      items:      this.buildItems(),
      keys: [
        {
          key:     Ext.EventObject.ESC,
          scope:   this,
          handler: this.onCancel
        },
        {
          key:       's',
          ctrl:      true,
          scope:     this,
          stopEvent: true,
          handler:   this.onSave
        }
      ],
      buttons: [
        {
          text:    'Save',
          scope:   this,
          iconCls: 'save',
          handler: this.onSave
        },
        {
          text:    'Cancel',
          scope:   this,
          iconCls: 'cancel',
          handler: this.onCancel
        }
      ]
    });
    
    ExtMVC.view.scaffold.ScaffoldFormPanel.superclass.initComponent.apply(this, arguments);
  },
  
  /**
   * @property formItemConfig
   * @type Object
   * Default config which will be passed to all form items
   */
  formItemConfig: {
    anchor: '-40',
    xtype:  'textfield'
  },
  
  /**
   * @property ignoreFields
   * @type Array
   * An array of fields not to show in the form (defaults to empty)
   */
  ignoreFields: ['id', 'created_at', 'updated_at'],
  
  /**
   * Builds an array of form items for the given model
   * @param {ExtMVC.Model} model The model to build form items for
   * @return {Array} An array of auto-generated form items
   */
  buildItems: function() {
    items = [];
    
    //check to see if FormFields have been created for this model
    //e.g. for a MyApp.models.User model, checks for existence of MyApp.views.users.FormFields
    if (this.viewsPackage && this.viewsPackage.FormFields) {
      items = this.viewsPackage.FormFields;
    } else {
      //no user defined form fields, generate them automatically
      var model  = this.model,
          proto  = model.prototype,
          fields = proto.fields;
      
      fields.each(function(field) {

        //add if it's not a field to be ignored
        if (this.ignoreFields.indexOf(field.name) == -1) {
          items.push(Ext.applyIf({
            name:        field.name,
            fieldLabel: (field.name.replace(/_/g, " ")).capitalize()
          }));
        }
      }, this);      
    }
    
    //apply defaults to each item
    for (var i=0; i < items.length; i++) {
      Ext.applyIf(items[i], this.formItemConfig);
    }
    
    return items;
  },
  
  /**
   * Called when the save button is clicked or CTRL + s pressed.  By default this simply fires
   * the 'save' event, passing this.getForm().getValues() as the sole argument
   */
  onSave: function() {
    this.fireEvent('save', this.getForm().getValues());
  },
  
  /**
   * Called when the cancel button is clicked or ESC pressed.  By default this simply calls Ext.History.back
   */
  onCancel: function() {
    this.fireEvent('cancel');
  }
});

Ext.reg('scaffold_form_panel', ExtMVC.view.scaffold.ScaffoldFormPanel);