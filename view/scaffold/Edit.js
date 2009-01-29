/**
 * @class Ext.ux.MVC.view.scaffold.Edit
 * @extends Ext.ux.MVC.view.scaffold.ScaffoldFormPanel
 * Shows a generic edit form for a given model
 */
Ext.ux.MVC.view.scaffold.Edit = Ext.extend(Ext.ux.MVC.view.scaffold.ScaffoldFormPanel, {
  /**
   * @property modelObj
   * @type Ext.ux.MVC.Model/Null
   * Reference to the model being edited in this form.  Is set once loaded by the adapter
   */
  modelObj: null,
  
  /**
   * Sets up the Edit form with references to required objects
   * @param {Function} model The model definition to create an Edit form for (e.g. MyApp.models.MyModel)
   * @param {Object} config Any configuration to pass up the constructor chain
   */
  constructor: function(model, config) {
    Ext.ux.MVC.view.scaffold.Edit.superclass.constructor.call(this, model, config || {});
  
    //load the model into the form
    this.model.findById(this.os.params.id, {
      scope:   this,
      success: this.onFindSuccess,
      failure: this.onFindFailure
    });
  },
  
  /**
   * Sets the panel's title, if not already set
   */
  initComponent: function() {
    Ext.applyIf(this, {
      title:    'Edit ' + this.model.prototype.modelName.capitalize()
    });
    
    Ext.ux.MVC.view.scaffold.Edit.superclass.initComponent.apply(this, arguments);
  },
  
  /**
   * Called when the model has been successfully loaded.  By default this just populates the form
   * @param {Ext.ux.MVC.Model} modelObj The loaded model object
   */
  onFindSuccess: function(modelObj) {
    this.getForm().loadRecord(modelObj);
    this.modelObj = modelObj;
  },
  
  /**
   * Called when the model could not be loaded.  By default just shows an Ext.MSG alert message
   */
  onFindFailure: function(paramName) {
    Ext.Msg.alert(
      'Load Failed',
      'The item could not be loaded'
    );
  }
});

Ext.reg('scaffold_edit', Ext.ux.MVC.view.scaffold.Edit);