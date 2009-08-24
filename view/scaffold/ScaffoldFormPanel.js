/**
 * @class ExtMVC.view.scaffold.ScaffoldFormPanel
 * @extends Ext.form.FormPanel
 * Base class for any scaffold form panel (e.g. new and edit forms)
 */
ExtMVC.registerView('scaffold', 'form', {
  xtype        : 'form',
  registerXType: 'scaffold_form',
  
  autoScroll: true,
  
  /**
   * Sets up the FormPanel, adds default configuration and items
   */
  constructor: function(config) {
    var config = config || {};
    
    this.model = config.model;
    
    if (this.model == undefined) {
      throw new Ext.Error(String.format("No model supplied to scaffold Form {0}", config.title), config);
    }
    
    Ext.form.FormPanel.prototype.constructor.call(this, config);
  },
  
  /**
   * Adds default items, keys and buttons to the form
   */
  initComponent: function() {
    Ext.applyIf(this, {
      items: this.buildItems(),
      keys : [
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
    }
    
    Ext.form.FormPanel.prototype.initComponent.apply(this, arguments);
    
    this.initEvents();
    this.initListeners();
  },
  
  /**
   * Sets up any listeners on related objects. By default this just listens to update-failed and create-failed
   * events on the related controller and marks fields as invalid as appropriate
   */
  initListeners: function() {
    if (this.controller) {
      this.controller.on({
        scope          : this,
        'create-failed': this.showErrorsFromInstance,
        'update-failed': this.showErrorsFromInstance
      });
    }
  },
  
  /**
   * Reads errors from a model instance and marks the relevant fields as invalid
   * @param {ExtMVC.Model.Base} instance The model instance
   */
  showErrorsFromInstance: function(instance) {
    this.getForm().markInvalid(instance.errors.forForm());
  },
  
  /**
   * Sets up events emitted by this component
   */
  initEvents: function() {
    this.addEvents(
      /**
       * @event save
       * Fired when the user clicks the save button, or presses ctrl + s
       * @param {Object} values The values entered into the form
       * @param {ExtMVC.view.scaffold.ScaffoldFormPanel} this The form panel
       */
      'save',
      
      /**
       * @event cancel
       * Fired when the user clicks the cancel button, or presses the esc key
       * @param {ExtMVC.Model.Base|Null} instance If editing an existing instance, this is a reference to that instance
       */
      'cancel'
    );
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
      text:    'Save',
      scope:   this,
      iconCls: 'save',
      handler: this.onSave
    };
  },
  
  /**
   * Builds the Cancel button config. Override this to provide your own
   * @return {Object/Ext.Button} The button config or object
   */
  buildCancelButton: function() {
    return {
      text:    'Cancel',
      scope:   this,
      iconCls: 'cancel',
      handler: this.onCancel
    };
  },
  
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
      if (items[i].layout === undefined) Ext.applyIf(items[i], this.formItemConfig);
    }
    
    return items;
  },
  
  /**
   * Called when the save button is clicked or CTRL + s pressed.  By default this simply fires
   * the 'save' event, passing this.getForm().getValues() as the sole argument
   */
  onSave: function() {
    this.fireEvent('save', this.getFormValues(), this);
  },
  
  /**
   * Gets form values in a nicer way than getForm.getValues() does - calls getValue on each field.
   * See http://www.diloc.de/blog/2008/03/05/how-to-submit-ext-forms-the-right-way/
   * @return {Object} key: value pairings of form values
   */
  getFormValues: function() {
    var form   = this.getForm(),
        values = {};
    
    form.items.each(function(item) {
      var func = (typeof item.getSubmitValue == "function") ? 'getSubmitValue' : 'getValue';
      
      values[item.getName()] = item[func]();
    }, this);
    
    return values;
  },
  
  /**
   * Called when the cancel button is clicked or ESC pressed. Fires the 'cancel' event.  If this is
   * an edit form the cancel event will be called with a single argument - the current instance
   */
  onCancel: function() {
    this.fireEvent('cancel', this.instance, this);
  }
});