/**
 * @class Ext.ux.MVC.view.scaffold.ScaffoldFormPanel
 * @extends Ext.form.FormPanel
 * Base class for any scaffold form panel (e.g. new and edit forms)
 */
Ext.ux.MVC.view.scaffold.ScaffoldFormPanel = Ext.extend(Ext.form.FormPanel, {
  
  /**
   * Sets up the FormPanel, adds default configuration and items
   */
  constructor: function(model, config) {
    var config = config || {};
    
    this.model = model;
    this.os    = Ext.ux.MVC.OS.getOS();
    
    this.controllerName = this.model.modelName.pluralize();
    this.controller     = this.os.getController(this.controllerName);
    
    Ext.ux.MVC.view.scaffold.ScaffoldFormPanel.superclass.constructor.call(this, config);
  },
  
  /**
   * Adds default items, keys and buttons to the form
   */
  initComponent: function() {
    Ext.applyIf(this, {
      closable: true,
      items:    this.buildItems(this.model),
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
          handler:   this.saveHandler
        }
      ],
      buttons: [
        {
          text:    'Save',
          scope:   this,
          iconCls: 'save',
          handler: this.saveHandler
        },
        {
          text:    'Cancel',
          scope:   this,
          iconCls: 'cancel',
          handler: this.onCancel
        }
      ]
    });
    
    //sets the document's title to the title of this panel
    this.os.setsTitle(this);
    
    Ext.ux.MVC.view.scaffold.ScaffoldFormPanel.superclass.initComponent.apply(this, arguments);
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
   * @param {Ext.ux.MVC.Model} model The model to build form items for
   * @return {Array} An array of auto-generated form items
   */
  buildItems: function(model) {
    //check to see if FormFields have been created for this model
    //e.g. for a MyApp.models.User model, checks for existence of MyApp.views.users.FormFields
    var formFields;
    
    if (formFields = eval(String.format("{0}.views.{1}.FormFields", model.namespace, model.modelName.pluralize()))) {
      return formFields;
    };
    
    //no user defined form fields, generate them automatically
    var items = [];
    
    for (var i=0; i < model.fields.length; i++) {
      var f = model.fields[i];
      
      //add if it's not a field to be ignored
      if (this.ignoreFields.indexOf(f.name) == -1) {
        items.push(Ext.applyIf({
          name:        f.name,
          fieldLabel: (f.name.replace(/_/g, " ")).capitalize()
        }, this.formItemConfig));
      };
    };
    
    return items;
  },
  
  /**
   * Called when the save button is clicked or CTRL + s pressed.  By default this simply fires
   * the associated controller's 'update' action, passing this.getForm() as the sole argument
   */
  onCreate: function() {
    this.controller.fireAction('create', null, [this.getForm()]);
  },
  
  onUpdate: function() {
    this.controller.fireAction('update', null, [this.getForm()]);
  },
  
  /**
   * Called when the cancel button is clicked or ESC pressed.  By default this simply calls Ext.History.back
   */
  onCancel: Ext.History.back
});

Ext.reg('scaffold_form_panel', Ext.ux.MVC.view.scaffold.ScaffoldFormPanel);