/**
 * @class ExtMVC.view.scaffold.Edit
 * @extends ExtMVC.view.scaffold.ScaffoldFormPanel
 * Shows a generic edit form for a given model
 */
ExtMVC.registerView('scaffold', 'edit', {
  xtype        : 'scaffold_form',
  registerXType: 'scaffold_edit',
  
  /**
   * Sets the panel's title, if not already set
   */
  initComponent: function() {
    Ext.applyIf(this, {
      title: 'Edit ' + this.model.prototype.singularHumanName
    });
    
    ExtMVC.getView('scaffold', 'form').prototype.initComponent.apply(this, arguments);
  },
  
  /**
   * Loads the given record into the form and maintains a reference to it so that it can be returned
   * when the 'save' event is fired
   * @param {ExtMVC.Model.Base} instance The model instance to load into this form
   */
  loadRecord: function(instance) {
    this.instance = instance;
    this.getForm().loadRecord(instance);
  },
  
  /**
   * Called when the save button is clicked or CTRL + s pressed.  By default this simply fires
   * the 'save' event, passing this.getForm().getValues() as the sole argument
   */
  onSave: function() {
    this.fireEvent('save', this.instance, this.getFormValues(), this);
  }
  
  /**
   * @event save
   * Fired when the user clicks the save button, or presses ctrl + s
   * @param {ExtMVC.model.Base} instance The existing instance that is to be updated
   * @param {Object} values The values entered into the form
   * @param {ExtMVC.view.scaffold.ScaffoldFormPanel} this The form panel
   */
});
