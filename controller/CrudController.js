/**
 * @class ExtMVC.controller.CrudController
 * @extends ExtMVC.controller.Controller
 * An extension of Controller which provides the generic CRUD actions
 */
ExtMVC.controller.CrudController = Ext.extend(ExtMVC.controller.Controller, {
  /**
   * @property model
   * @type Function/Null
   * Defaults to null.  If set to a reference to an ExtMVC.Model subclass, renderView will attempt to dynamically
   * scaffold any missing views, if the corresponding view is defined in the ExtMVC.view.scaffold package
   */
  model: null,

  /**
   * @action create
   * Attempts to create a new instance of this controller's associated model
   * @param {Object} data A fields object (e.g. {title: 'My instance'})
   */
  create: function(data, form) {
    var instance = new this.model(data);

    instance.save({
      scope:   this,
      success: this.onCreateSuccess,
      failure: this.onCreateFailure
    });
  },
  
  /**
   * @action read
   * Attempts to find (read) a single model instance by ID
   * @param {Number} id The Id of the instance to read
   */
  read: function(id) {
    this.model.findById(id, {
      scope: this,
      success: function(instance) {
        this.fireEvent('read', instance);
      },
      failure: function() {
        this.fireEvent('read-failed', id);
      }
    });
  },
  
  /**
   * Attempts to update an existing instance with new values.  If the update was successful the controller fires
   * the 'update' event and then shows a default notice to the user (this.showUpdatedNotice()) and calls this.index().
   * To cancel this default behaviour, return false from any listener on the 'update' event.
   * @param {ExtMVC.Model.Base} instance The existing instance object
   * @param {Object} updates An object containing updates to apply to the instance
   */
  update: function(instance, updates) {
    for (var key in updates) {
      instance.set(key, updates[key]);
    }
    
    instance.save({
      scope:   this,
      success: function(instance) {
        this.onUpdateSuccess(instance, updates);
      },
      failure: function() {
        this.onUpdateFailure(instance, updates);
      }
    });
  },
  
  /**
   * @action destroy
   * Attempts to delete an existing instance
   * @param {Mixed} instance The ExtMVC.Model.Base subclass instance to delete.  Will also accept a string/number ID
   */
  destroy: function(instance) {
    instance.destroy({
      scope:   this,
      success: function() {
        this.fireEvent('delete', instance);
      },
      failure: function() {
        this.fireEvent('delete-failed', instance);
      }
    });
  },
  
  /**
   * @action index
   * Renders the custom Index view if present, otherwise falls back to the default scaffold grid
   */
  index: function() {
    var index = this.render('Index', {
      model       : this.model,
      controller  : this,
      listeners   : this.getIndexViewListeners(),
      viewsPackage: this.viewsPackage
    });
    
    this.fireEvent('index');
    
    return index;
  },
  
  /**
   * @action build
   * Renders the custom New view if present, otherwise falls back to the default scaffold New form
   */
  build: function() {
    this.render('New', {
      model       : this.model,
      controller  : this,
      listeners   : this.getBuildViewListeners(),
      viewsPackage: this.viewsPackage
    });
  },

  /**
   * @action edit
   * Renders the custom Edit view if present, otherwise falls back to the default scaffold Edit form
   * @param {Mixed} instance The model instance to edit. If not given an ExtMVC.Model.Base
   * instance, a findById() will be called on this controller's associated model
   */
  edit: function(instance) {
    if (instance instanceof Ext.data.Record) {
      this.render('Edit', {
        model       : this.model,
        controller  : this,
        listeners   : this.getEditViewListeners(),
        viewsPackage: this.viewsPackage
      }).loadRecord(instance);
      
      this.fireEvent('edit', instance);
    } else {
      var id = instance;
      
      this.model.find(id, {
        scope  : this,
        success: function(instance) {
          this.edit(instance);
        }
      });
    }
  },
  
  /**
   * Returns a listeners object passed to the Index view when rendered inside the index action. This contains 
   * default listeners, but can be overridden in subclasses to provide custom behaviour
   * @return {Object} The listeners object
   */
  getIndexViewListeners: function() {
    return {
      scope   : this,
      'delete': this.destroy,
      'new'   : this.build,
      'edit'  : this.edit
    };
  },
  
  /**
   * Returns a listeners object passed to the Edit view when rendered inside the edit action. This contains 
   * default listeners, but can be overridden in subclasses to provide custom behaviour
   * @return {Object} The listeners object
   */
  getEditViewListeners: function() {
    return {
      scope : this,
      cancel: this.index,
      save  : this.update
    };
  },
  
  /**
   * Returns a listeners object passed to the New view when rendered inside the build action. This contains 
   * default listeners, but can be overridden in subclasses to provide custom behaviour
   * @return {Object} The listeners object
   */
  getBuildViewListeners: function() {
    return {
      scope:  this,
      cancel: this.index,
      save:   this.create
    };
  },
  
  /**
   * Called when an instance has been successfully created.  This just calls this.showNotice
   * with a default message for this model. Overwrite to provide your own implementation
   */
  showCreatedNotice: function() {
    this.showNotice(String.format("{0} successfully created", this.model.prototype.singularHumanName));
  },
  
  /**
   * Called when an instance has been successfully updated.  This just calls this.showNotice
   * with a default message for this model. Overwrite to provide your own implementation
   */
  showUpdatedNotice: function() {
    this.showNotice(String.format("{0} successfully updated", this.model.prototype.singularHumanName));    
  },
  
  /**
   * Called after a successful update. By default this calls showUpdatedNotice and then this.index()
   * @param {ExtMVC.Model.Base} instance The newly updated instance
   * @param {Object} updates The updates that were made
   */
  onCreateSuccess: function(instance) {
    if(this.fireEvent('create', instance) !== false) {
      this.showCreatedNotice();
      this.index();
    }
  },
  
  /**
   * Called after an unsuccessful update. By default this simply fires the 'update-failed' event
   * @param {ExtMVC.Model.Base} instance The instance that could not be updated
   * @param {Object} updates The updates that were attempted to be made
   */
  onCreateFailure: function(instance) {
    this.fireEvent('create-failed', instance);
  },
  
  /**
   * Called after a successful update. By default this calls showUpdatedNotice and then this.index()
   * @param {ExtMVC.Model.Base} instance The newly updated instance
   * @param {Object} updates The updates that were made
   */
  onUpdateSuccess: function(instance, updates) {
    if (this.fireEvent('update', instance, updates) !== false) {
      this.showUpdatedNotice();
      this.index();          
    }
  },
  
  /**
   * Called after an unsuccessful update. By default this simply fires the 'update-failed' event
   * @param {ExtMVC.Model.Base} instance The instance that could not be updated
   * @param {Object} updates The updates that were attempted to be made
   */
  onUpdateFailure: function(instance, updates) {
    this.fireEvent('update-failed', instance, updates);
  },
   
  /**
   * Sets up events emitted by the CRUD Controller's actions
   */
  initEvents: function() {
    this.addEvents(
      /**
       * @event create
       * Fired when a new instance has been successfully created
       * @param {ExtMVC.Model.Base} instance The newly created model instance
       */
      'create',
      
      /**
       * @event create-failed
       * Fired when an attempt to create a new instance failed
       * @param {ExtMVC.Model.Base} instance The instance object which couldn't be saved
       */
      'create-failed',
      
      /**
       * @event read
       * Fired when a single instance has been loaded from the database
       * @param {ExtMVC.Model.Base} instance The instance instance that was loaded
       */
      'read',
      
      /**
       * @event read-failed
       * Fired when an attempt to load a single instance failed
       * @param {Number} id The ID of the instance we were attempting to find
       */
      'read-failed',
      
      /**
       * @event update
       * Fired when an existing instance has been successfully created
       * @param {ExtMVC.Model.Base} instance The updated instance
       * @param {Object} updates The updates object that was supplied
       */
      'update',
      
      /**
       * @event update-failed
       * Fired when an attempty to update an existing instance failed
       * @param {ExtMVC.Model.Base} instance The instance we were attempting to update
       * @param {Object} updates The object of updates we were trying to apply
       */
      'update-failed',
      
      /**
       * @event delete
       * Fired when an existing instance has been successfully deleteed
       * @param {ExtMVC.Model.Base} instance The instance that was deleteed
       */
      'delete',
      
      /**
       * @event delete-failed
       * Fired when an attempt to delete an existing instance failed
       * @param {ExtMVC.Model.Base} instance The instance we were trying to delete
       */
      'delete-failed',
      
      /**
       * @event index
       * Fired when an instances collection has been loaded from the database
       */
      'index',
      
      /**
       * @event edit
       * Fired when an instance is being edited
       * @param {ExtMVC.Model.Base} instance The instance being edited
       */
      'edit'
    );
  },
  
  /**
   * If a view of the given viewName is defined in this controllers viewPackage, a reference to its
   * constructor is defined.  If not, a reference to the default scaffold for the viewName is returned
   * @param {String} viewName The name of the view to return a constructor function for
   * @return {Function} A reference to the custom view, or the scaffold fallback
   */
  getViewClass: function(viewName) {
    var userView = ExtMVC.controller.CrudController.superclass.getViewClass.call(this, viewName);
    
    return (userView == undefined) ? this.scaffoldViewName(viewName) : userView;
  },
  
  /**
   * Returns a reference to the Scaffold view class for a given viewName
   * @param {String} viewName The name of the view to return a class for (index, new, edit or show)
   * @return {Function} A reference to the view class to instantiate to render this scaffold view
   */
  scaffoldViewName: function(viewName) {
    return ExtMVC.view.scaffold[viewName.titleize()];
  }
});