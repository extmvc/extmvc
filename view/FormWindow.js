/**
 * @class ExtMVC.view.FormWindow
 * @extends Ext.Window
 * Convenience class for creating a window with a default form.  Example:
 * 
<pre>
MyApp.views.MyFormWindow = Ext.extend(ExtMVC.view.FormWindow, {

 height: 200,

 width : 400,

 
  buildForm: function() {
    //return your Ext.form.FormPanel here
  }
});
</pre>
 * 
 */
ExtMVC.registerView('extmvc', 'formwindow', {
  xtype        : 'window',
  registerXType: 'formwindow',

  modal  : true,
  height : 230,
  width  : 400,
  
  initComponent: function() {
    /**
     * @property form
     * @type Ext.form.FormPanel
     * The new POLN form
     */
    this.form = this.buildForm();
    
    Ext.apply(this, {
      items : [
        this.form
      ],
      layout: 'fit',
      closeAction: 'hide',
      
      /**
       * @property maskOnSave
       * @type Boolean
       * True to add a mask to the field while saving (defaults to true)
       */
      maskOnSave: true,
      
      /**
       * @property saveMaskMessage
       * @type String
       * The message to show in the saving mask (defaults to "Saving...")
       */
      saveMaskMessage: "Saving...",
      
     /**
       * @property hasSaveButton
       * @type Boolean
       * True to include a save button (defaults to true)
       */
      hasSaveButton: true,

      /**
       * @property hasCancelButton
       * @type Boolean
       * True to include a cancel button (defaults to true)
       */
      hasCancelButton: true
    });
    
    //applyIf applies when buttons: [] is passed, which meant there was no way to
    //specify any empty set of buttons before
    if (!Ext.isArray(this.buttons)) {
      Ext.apply(this, {
        buttons: this.buildButtons()
      });
    };
    
    Ext.Window.prototype.initComponent.apply(this, arguments);
  },
  
  /**
   * Builds the buttons added to this form.  By default this returns an array containing
   * a Save button and a Cancel button, which fire the 'save' and 'cancel' events respectively
   * @return {Array} An array of Ext.Button objects or configs
   */
  buildButtons: function() {
    var buttons = [];
    
    if (this.hasSaveButton   === true) buttons.push(this.buildSaveButton());
    if (this.hasCancelButton === true) buttons.push(this.buildCancelButton());
    
    return buttons;
  },
  
  /**
   * Builds the Save button config. Override this to provide your own
   * @return {Object/Ext.Button} The button config or object
   */
  buildSaveButton: function() {
    return {
      text   : 'Save',
      iconCls: 'save',
      scope  : this,
      handler: this.onSave
    };
  },
  
  /**
   * Builds the Cancel button config. Override this to provide your own
   * @return {Object/Ext.Button} The button config or object
   */
  buildCancelButton: function() {
    return {
      text:     'Cancel',
      scope:    this,
      iconCls:  'cancel',
      handler:  this.onCancel
    };
  },
  
  /**
   * Creates and returns a FormPanel instance to go inside the window. Override this yourself
   * @return {Ext.form.FormPanel} The form panel
   */
  buildForm: function() {
    return new Ext.form.FormPanel({});
  },
  
  /**
   * Loads an instance into the form
   * @param {GetIt.models.PurchaseOrderLineNote} instance The POLN instance to load
   */
  loadRecord: function(instance) {
    /**
     * @property instance
     * @type ExtMVC.model.Base
     * The instance currently loaded into the form
     */
    this.instance = instance;
    
    this.form.form.loadRecord(instance);
  },
  
  /**
   * Called when the user clicks the save button
   */
  onSave: function() {
    if (this.maskOnSave === true) this.el.mask(this.saveMaskMessage);
    
    if (this.instance == undefined || this.instance.newRecord()) {
      this.fireEvent('save', this.getFormValues(), this);
    } else {
      this.fireEvent('save', this.instance, this.getFormValues(), this);
    }
  },
  
  /**
   * Called when the usre clicks the cancel button. By default this just hides the window
   */
  onCancel: function() {
    this.close();
  },
  
  /**
   * Gets form values in a nicer way than getForm.getValues() does - calls getValue on each field.
   * See http://www.diloc.de/blog/2008/03/05/how-to-submit-ext-forms-the-right-way/
   * @return {Object} key: value pairings of form values
   */
  getFormValues: function() {
    var form   = this.form.getForm(),
        values = {};
    
    form.items.each(function(item) {
      var func = (typeof item.getSubmitValue == "function") ? 'getSubmitValue' : 'getValue';
      
      values[item.getName()] = item[func]();
    }, this);
    
    return values;
  }
});
