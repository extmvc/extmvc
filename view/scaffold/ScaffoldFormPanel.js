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
    
    //FIXME: no, can't decide controller name like this
    this.controller = this.model.modelName + 's';
    
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
          handler: Ext.History.back.createCallback()
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
          handler: this.onSave.createDelegate(this)
        },
        this.os.router.linkTo({controller: this.controller, action: 'index'}, {text: 'Cancel', iconCls: 'cancel', cls: null})
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
   * Called when the save button is pressed.  By default this will load the model object with the form values,
   * then call save() on the model object.  Override onSaveSuccess and onSaveFailure to update success and failure callbacks
   */
  onSave: function() {
    //create a new model if we don't already have one
    this.modelObj = this.modelObj || new this.model({});
    
    //add a saving mask
    this.el.mask('Saving...', 'x-mask-loading');
    
    this.modelObj.setValues(this.getForm().getValues());
    this.modelObj.save({
      scope:    this,
      success:  this.onSaveSuccess,
      failure:  this.onSaveFailure,
      callback: function() {this.el.unmask();}
    });
  },
  
  /**
   * Called after a successful save.  By default will redirect to the model's index page
   * @param {Object} response The response object from the server
   */
  onSaveSuccess: function(response) {
    this.os.router.redirectTo(Ext.apply(this.os.params, { action: 'index' }));
  },
  
  /**
   * Called after save fails.  By default this will parse server errors and display them on the form
   * @param {Object} response the response object from the server (should be containing errors)
   */
  onSaveFailure: function(response) {
    this.modelObj.readErrors(response.responseText);
              
    this.getForm().clearInvalid();
    this.getForm().markInvalid(this.modelObj.errors.forForm());
  },
  
  /**
   * Builds an array of form items for the given model
   * @param {Ext.ux.MVC.Model} model The model to build form items for
   * @return {Array} An array of auto-generated form items
   */
  buildItems: function(model) {
    //check to see if FormFields have been created for this model
    //e.g. for a MyApp.models.User model, checks for existence of MyApp.views.users.FormFields
    var formFields;
    
    //FIXME: Again, we're pluralising in a very bad way here :(
    if (formFields = eval(String.format("{0}.views.{1}s.FormFields", model.namespace, model.modelName))) {
      return formFields;
    };
    
    //no user defined form fields, generate them automatically
    var items = [];
    
    for (var i=0; i < model.fields.length; i++) {
      var f = model.fields[i];
      
      //add if it's not a field to be ignored
      if (this.ignoreFields.indexOf(f.name) == -1) {
        items.push(Ext.applyIf({
          name:       f.name,
          fieldLabel: (f.name.replace(/_/g, " ")).capitalize()
        }, this.formItemConfig));
      };
    };
    
    return items;
  }
});

Ext.reg('scaffold_form_panel', Ext.ux.MVC.view.scaffold.ScaffoldFormPanel);