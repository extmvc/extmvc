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
      buttons: [
        {
          text   : 'Save',
          iconCls: 'save',
          scope  : this,
          handler: this.onSave
        },
        {
          text   : 'Cancel',
          iconCls: 'cancel',
          scope  : this,
          handler: this.onCancel
        }
      ],
      layout: 'fit',
      closeAction: 'hide'
    });
    
    Ext.Window.prototype.initComponent.apply(this, arguments);
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
    this.hide();
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
