/**
 * This started life as a plugin, moving it here for now as it might be useful on every project (hence oddish definition)
 */


Ext.ns('ExtMVC.plugin.CrudController');

(function() {
  var c = ExtMVC.plugin.CrudController;
  
  /**
   * Adds default CRUD (Create, Read, Update, Delete) to this controller.
   * This is currently injected into Controller's prototype, so a simple call to this.actsAsCrudController()
   * with the following params sets everything up. It adds the following actions:
   * 
   * new() - by default displays the view called 'new' in this controller's view namespace
   * edit() - displays the 'edit' view and loads the model whose id is in your os.params.id
   * create(form) - takes an Ext.form.BasicForm and attempts to create + save a new model object with it
   * update(form) - takes a BasicForm and attempts to update an existing object with it (again using os.params.id)
   * destroy(id, store) - takes an ID, deletes it and optionally refreshes a store
   * 
   * It does not overwrite any existing action already defined under one of those names.
   *
   * Override any of the default methods like this:
   * 
   * this.actsAsCrudController, MyNamespace.models.MyModel, {
   *   onUpdateFailure: function() {... your custom onUpdateFailure behaviour ...}
   * });
   *
   * @param {ExtMVC.Model} model The model to provide CRUD support for
   * @return {ExtMVC.Controller} The controller, now with addition actions and methods
   */
  c.registerActions = function(model, overrides) {
    Ext.apply(this, overrides, c.defaultFunctions);
    
    this.addEvents(
      /**
       * @event findsuccess
       * Fires after a successful load has taken place (applies to Edit forms)
       * @param {ExtMVC.Model} modelObj The instantiated model object found by the lookup
       */
      'findsuccess',
      
      /**
       * @event findfailure
       * Fires if the model instance could not be found
       */
      'findfailure'
    );
    
    /**
     * @property model
     * @type ExtMVC.Model
     * Holds a reference to the model this controller provides CRUD support for
     */
    this.model = model;
    
    if (!this.model) {
      throw new Error("You must provide a model to this.actsAsCrudController().  " +
                      "Pass it as the first argument to actsAsCrudController or set " + 
                      "'this.model = YourModel' before calling actsAsCrudController.");
    };
    
    /**
     * @action new 
     * Renders the new form for this model
     */
    this.registerAction('new', function() {
      this.form = this.renderView('new');
    }, {overwrite: false});
    
    /**
     * @action edit 
     * Renders the edit form and loads the model data into it
     */
    this.registerAction('edit', function() {
      this.form = this.renderView('edit');
      this.form.el.mask('Loading...', 'x-mask-loading');
      
      this.loadForm(this.form);
    }, {overwrite: false});
    
    /**
     * @action create 
     * Creates a new model instance, displays errors if required and redirects to index
     */
    this.registerAction('create', function(form) {
      form.el.mask('Saving...', 'x-mask-loading');
      this.onCreate(form);
    }, {overwrite: false});
    
    /**
     * @action update
     * Updates an existing model instance, displays errors if required and redirects to index
     */
    this.registerAction('update', function(form) {
      form.el.mask('Saving...', 'x-mask-loading');
      this.onUpdate(form);
    }, {overwrite: false});
    
    /**
     * @action destroy 
     * Deletes a given model instance
     */
    this.registerAction('destroy', function(id, store) {
      var id = id || this.os.params.id;
      if (id) {
        var u = new this.model({id: id});
        u.destroy({
          scope:   this,
          success: this.onDestroySuccess.createDelegate(this, [store]),
          failure: this.onDestroyFailure
        });
      };
    }, {overwrite: false});
  };
  
  c.defaultFunctions = {
    
    /**
     * @property modelObj
     * @type ExtMVC.Model/Null
     * Reference to the model being edited in this form.  Is set once loaded by the adapter
     */
    modelObj: null,
    
    /**
     * @property loadUrl
     * @type String/Null
     * If your form needs to load from a non-standard url, override this (should be very rare).
     * Defaults to undefined, which lets the model choose which url to load from
     */
    loadUrl: undefined,
    
    /**
     * @property saveUrl
     * @type String
     * If your form needs to save to a non-standard url, override this (should be very rare).
     * Defaults to undefined, which lets the model choose which url to save to
     */
    saveUrl: undefined,
  
    /**
     * Loads the form with model data
     * @param {Ext.form.FormPanel} form a reference to the form into which to load the data
     */
    loadForm: function(form) {
      this.model.findById(this.os.params.id, {
        scope:    this,
        url:      this.loadUrl,
        success:  this.onFindSuccess,
        failure:  this.onFindFailure,
        callback: form.el.unmask.createDelegate(form.el)
      });
    },
    
    /**
     * Fires after successful find of the model.  Loads data into the form
     * @param {ExtMVC.Model} modelObj The found model object
     */
    onFindSuccess: function(modelObj) {
      this.editModelObj = modelObj;
      this.form.getForm().loadRecord(modelObj);
      
      this.fireEvent('findsuccess', modelObj);
    },
    
    /**
     * Fires if the model object could not be loaded for whatever reason.
     * By default it offers the user to try again or go back
     */
    onFindFailure: function() {
      this.fireEvent('findfailure');
      Ext.Msg.show({
        title:   'Load Failed',
        msg:     'The item could not be loaded',
        buttons: {yes: 'Try again', no: 'Back'},
        scope:   this,
        fn:      function(btn) { btn == 'yes' ? this.loadForm() : Ext.History.back(); }
      });
    },
    
    /**
     * Called when the save button on an edit form is pressed.  By default this will load the model object with the form values,
     * then call save() on the model object.  Override onCreateSuccess and onCreateFailure to update success and failure callbacks
     * @param {Ext.form.BasicForm} form A reference to the FormPanel
     */
    onCreate: function(form) {
      this.newModelObj = new this.model({});
      
      this.onSave(form, this.newModelObj, {
        success:  this.onCreateSuccess,
        failure:  this.onCreateFailure
      });
    },
    
    /**
     * Called when the save button on an edit form is pressed.  By default this will load the model object with the form values,
     * then call save() on the model object.  Override onUpdateSuccess and onUpdateFailure to update success and failure callbacks
     * @param {Ext.form.BasicForm} form A reference to the FormPanel
     */
    onUpdate: function(form) {
      this.onSave(form, this.editModelObj, {
        success:  this.onUpdateSuccess,
        failure:  this.onUpdateFailure
      });
    },
    
    /**
     * Used by both onCreate and onUpdate.  Don't override this unless you understand what you're doing
     */
    onSave: function(form, model, options) {
      //add a saving mask
      form.el.mask('Saving...', 'x-mask-loading');
      
      /**
       * Updates the model (which also saves it).  Uses success and failure options passed in from
       * one of onUpdate or onCreate, depending on which one called this
       */
      model.update(form.getValues(), Ext.apply({}, options, {
        scope:    this,
        url:      this.saveUrl,
        callback: function() {form.el.unmask();}
      }));
    },
    
    /**
     * Called after a successful save.  By default will redirect to the model's index page
     * @param {Object} response The response object from the server
     */
    onSaveSuccess: function(response) {
      this.os.router.redirectTo(Ext.apply({}, { action: 'index' }, this.os.params));
    },
    
    /**
     * Called after successful item creation.  By default this just first onSaveSuccess
     */
    onCreateSuccess: function() {this.onSaveSuccess();},
    
    /**
     * Called after successful item update.  By default this just first onSaveSuccess
     */
    onUpdateSuccess: function() {this.onSaveSuccess();},
    
    /**
     * Called after save fails on create.  By default this will parse server errors and display them on the form
     * @param {Object} response the response object from the server (should be containing errors)
     */
    onCreateFailure: function(modelObj, response) {
      this.addErrorMessages(modelObj, response);
    },
    
    /**
     * Called after save fails on update.  By default this will parse server errors and display them on the form
     * @param {Object} response the response object from the server (should be containing errors)
     */
    onUpdateFailure: function(modelObj, response) {
      this.addErrorMessages(modelObj, response);
    },
    
    /**
     * Adds server errors to the model and form fields. Private.
     * @ignore
     */
    addErrorMessages: function(modelObj, response) {
      this.form.getForm().clearInvalid();
      this.form.getForm().markInvalid(modelObj.errors.forForm());
    },
    
    /**
     * Called after an item has been successfully destroyed (deleted).  By default this reloads the grid's store
     * @param {Ext.data.Store} store The Ext.data.Store to reload after deletion
     */
    onDestroySuccess: function(store) {
      if (store) store.reload();
    },
    
    /**
     * Called after an destroy attempt was made on a model instance, but the attempt failed.  By default this shows
     * a MessageBox alert informing the user
     */
    onDestroyFailure: function(paramName) {
      Ext.Msg.alert(
        'Delete Failed',
        'Sorry, something went wrong when trying to delete that item.  Please try again'
      );
    }
  };
  
  /**
   * Define a method on Controller to enable this.actsAsCrudController(this) within a
   * controller constructor function
   */
  ExtMVC.Controller.prototype.actsAsCrudController = c.registerActions;
  
})();