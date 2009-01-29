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
   * Sets the panel's title, if not already set
   */
  initComponent: function() {
    Ext.applyIf(this, {title: 'Edit ' + this.model.prototype.modelName.capitalize()});
    
    Ext.ux.MVC.view.scaffold.Edit.superclass.initComponent.apply(this, arguments);
    
    this.loadForm();
  },
  
  /**
   * Loads the form using the model's adapter and finding the ID from os.params
   */
  loadForm: function() {
    this.model.findById(this.os.params.id, {
      scope:   this,
      success: this.onFindSuccess,
      failure: this.onFindFailure
    });
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
   * Called when the model could not be loaded.  By default this displays a messagebox offering the user
   * to try again or go back
   */
  onFindFailure: function() {
    Ext.Msg.show({
      title:   'Load Failed',
      msg:     'The item could not be loaded',
      buttons: {yes: 'Try again', no: 'Back'},
      scope:   this,
      fn:      function(btn) { btn == 'yes' ? this.loadForm() : Ext.History.back(); }
    });
  }
});

Ext.reg('scaffold_edit', Ext.ux.MVC.view.scaffold.Edit);