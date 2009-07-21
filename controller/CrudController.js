/**
 * @class ExtMVC.controller.CrudController
 * @extends ExtMVC.controller.Controller
 * <h1>CRUD Controller</h1>
 * <p>The CRUD Controller is an extension of Controller which provides the generic CRUD actions (Create, Read, Update and Delete).
 * Although CRUD Controller provides sensible default options for most cases, it is also highly extensible. Here's an example for
 * managing CRUD operations on a fictional 'Page' model in our app. Note that the name and model are the only required properties
 * for a CRUD controller with default behaviour:</p>
<pre><code>
MyApp.controllers.PagesController = Ext.extend(ExtMVC.controller.CrudController, {
  //the name of the controller (see {@link ExtMVC.controller.Controller})
  name : 'pages',
  
  //The model that this controller will be providing CRUD services for
  model: MyApp.models.Page,
  
  //override the default behaviour that occurs when the 'create' action was successfully completed
  onCreateSuccess: function(instance) {
    alert('new Page successfully created!');
  },
  
  //override the listeners that are attached to the Index view. The Index view is usually an instance of
  //{@link ExtMVC.view.scaffold.Index} or a subclass of it.
  getIndexViewListeners: function() {
    return {
      scope : this,
      'edit': function(instance) {
        alert('inside the Index view (usually a scaffold grid), the user wants to edit an instance');
      }
    };
  },
  
  //provide our own implementation for destroy
  destroy: function(instance) {
    alert('user wants to destroy an instance');
  }
});
</code></pre>
 * 
 * <p>The 3 CRUD Controller methods that take action are create, update and destroy<p>
 * <p>The 3 CRUD Controller methods that render views are index, new and edit</p>
 * <p>By default, CRUD Controllers render the scaffolding views, which provide sensible default views.
 * The index action renders a {@link ExtMVC.view.scaffold.Index Scaffold Grid}, edit renders a 
 * {@link ExtMVC.view.scaffold.Edit Scaffold Edit Form} and new renders a {@link ExtMVC.view.scaffold.New Scaffold New Form}</p>
 * <p>To make CRUD controller render a customised view instead of the scaffold, simply define the relevant view and ensure it is
 * available within your code. For example, if you want to show a customised Ext.Panel instead of the Scaffold Grid on index,
 * simply define:</p>
<pre><code>
MyApp.views.pages.Index = Ext.extend(Ext.Panel, {
  title: 'My Specialised Index view - replaces the scaffold grid'
});
</code></pre>
 * <p>The same applies with Edit and New classes within the appropriate views namespace. See more on view namespaces in
 * {@link ExtMVC.controller.Controller Controller}.</p>
 */
ExtMVC.controller.CrudController = Ext.extend(ExtMVC.controller.Controller, {
  /**
   * @property model
   * @type Function/Null
   * Defaults to null.  If set to a reference to an ExtMVC.model subclass, renderView will attempt to dynamically
   * scaffold any missing views, if the corresponding view is defined in the ExtMVC.view.scaffold package
   */
  model: null,

  /**
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
   * @param {ExtMVC.model.Base} instance The existing instance object
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
   * Attempts to delete0 an existing instance
   * @param {Mixed} instance The ExtMVC.model.Base subclass instance to delete.  Will also accept a string/number ID
   */
  destroy: function(instance) {
    if (instance.destroy == undefined) {
      //if we're passed an ID instead of an instance
      this.model.destroy(parseInt(instance, 10));
    } else {
      instance.destroy({
        scope:   this,
        success: this.onDestroySuccess,
        failure: this.onDestroyFailure
      });
    }
  },
  
  /**
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
   * Renders the custom New view if present, otherwise falls back to the default scaffold New form
   */
  build: function() {
    return this.render('New', {
      model       : this.model,
      controller  : this,
      listeners   : this.getBuildViewListeners(),
      viewsPackage: this.viewsPackage
    });
  },

  /**
   * Renders the custom Edit view if present, otherwise falls back to the default scaffold Edit form
   * @param {Mixed} instance The model instance to edit. If not given an ExtMVC.model.Base
   * instance, a findById() will be called on this controller's associated model
   */
  edit: function(instance) {
    if (instance instanceof Ext.data.Record) {
      var editView = this.render('Edit', {
        model       : this.model,
        controller  : this,
        listeners   : this.getEditViewListeners(),
        viewsPackage: this.viewsPackage,
        id          : String.format("{0}_edit_{1}", this.name, instance.get(instance.primaryKey))
      });
      
      editView.loadRecord(instance);
      
      this.onEdit(editView, instance);
      this.fireEvent('edit', instance);
      
      return editView;
    } else {
      var id = instance;
      
      this.model.find(parseInt(id, 10), {
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
      scope : this,
      cancel: this.index,
      save  : this.create
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
   * Called when an instance has been successfully destroyed.  This just calls this.showNotice
   * with a default message for this model. Overwrite to provide your own implementation
   */
  showDestroyedNotice: function() {
    this.showNotice(String.format("{0} successfully deleted", this.model.prototype.singularHumanName));    
  },
  
  /**
   * Called after a successful update. By default this calls showUpdatedNotice and then this.index()
   * @param {ExtMVC.model.Base} instance The newly updated instance
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
   * @param {ExtMVC.model.Base} instance The instance that could not be updated
   * @param {Object} updates The updates that were attempted to be made
   */
  onCreateFailure: function(instance) {
    this.fireEvent('create-failed', instance);
  },
  
  /**
   * Called after a successful update. By default this calls showUpdatedNotice and then this.index()
   * @param {ExtMVC.model.Base} instance The newly updated instance
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
   * @param {ExtMVC.model.Base} instance The instance that could not be updated
   * @param {Object} updates The updates that were attempted to be made
   */
  onUpdateFailure: function(instance, updates) {
    this.fireEvent('update-failed', instance, updates);
  },
  
  /**
   * Called after successful destruction of a model instance. By default simply fires the 'delete' event
   * with the instance as a single argument
   * @param {ExtMVC.model.Base} instance The instane that was just destroyed
   */
  onDestroySuccess: function(instance) {
    this.fireEvent('delete', instance);
    
    this.showDestroyedNotice();
  },
  
  /**
   * Called after unsuccessful destruction of a model instance. By default simply fires the 'delete-failed' event
   * with the instance as a single argument
   * @param {ExtMVC.model.Base} instance The instance that could not be destroyed
   */
  onDestroyFailure: function(instance) {
    this.fireEvent('delete-failed', instance);
  },
  
  /**
   * Called whenever the Edit form has been rendered for a given instance. This is an empty function by default,
   * which you can override to provide your own logic if needed
   * @param {Ext.Component} form The rendered Edit form
   * @param {ExtMVC.model.Base} instance The instance loaded into the form
   */
  onEdit: function(form) {},
  
  /**
   * Sets up events emitted by the CRUD Controller's actions
   */
  initEvents: function() {
    this.addEvents(
      /**
       * @event create
       * Fired when a new instance has been successfully created
       * @param {ExtMVC.model.Base} instance The newly created model instance
       */
      'create',
      
      /**
       * @event create-failed
       * Fired when an attempt to create a new instance failed
       * @param {ExtMVC.model.Base} instance The instance object which couldn't be saved
       */
      'create-failed',
      
      /**
       * @event read
       * Fired when a single instance has been loaded from the database
       * @param {ExtMVC.model.Base} instance The instance instance that was loaded
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
       * @param {ExtMVC.model.Base} instance The updated instance
       * @param {Object} updates The updates object that was supplied
       */
      'update',
      
      /**
       * @event update-failed
       * Fired when an attempty to update an existing instance failed
       * @param {ExtMVC.model.Base} instance The instance we were attempting to update
       * @param {Object} updates The object of updates we were trying to apply
       */
      'update-failed',
      
      /**
       * @event delete
       * Fired when an existing instance has been successfully deleteed
       * @param {ExtMVC.model.Base} instance The instance that was deleteed
       */
      'delete',
      
      /**
       * @event delete-failed
       * Fired when an attempt to delete an existing instance failed
       * @param {ExtMVC.model.Base} instance The instance we were trying to delete
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
       * @param {ExtMVC.model.Base} instance The instance being edited
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