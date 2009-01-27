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
    
    Ext.applyIf(config, {
      closable: true,
      items:    this.buildItems(model)
    });
   
    Ext.ux.MVC.view.scaffold.ScaffoldFormPanel.superclass.constructor.call(this, config);
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