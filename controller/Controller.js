/**
 * @class ExtMVC.controller.Controller
 * @extends Ext.util.Observable
 * <h1>Controllers in Ext MVC</h1>
 * <p>Controllers are the glue that stick applications together. They listen to events emitted by the UI as the user
 * clicks interface elements, and take actions as appropriate. The relevant action may be to create or save a model
 * instance, to render another view, to perform AJAX requests, or any other action.</p>
 * 
 * <p>Controllers should be kept skinny as far as possible - receive an event, then hand any processing off to the 
 * appropriate model. This ensures we can keep the code as DRY as possible and makes refactoring easier.</p>
 * 
 * <h2>Example Controller</h2>
 * Here is a simple example controller which renders a couple of views and listens to events:
<pre><code>
//simple controller which manages the Page model within our application
MyApp.controllers.PagesController = Ext.extend(ExtMVC.controller.Controller, {
  name: 'pages',

  //renders the 'Index' template and sets up listeners
  index: function() {
    this.render('Index', {
      listeners: {
        scope   : this,
        'edit'  : this.edit,
        'delete': this.destroy
      }
    });
  },

  //renders the 'Edit' template (let's say it's a FormPanel), and loads the instance
  edit: function(instance) {
    this.render('Edit', {
      listeners: {
        scope  : this,
        save   : this.update,
        cancel : function() {
          alert("You cancelled the update!");
        }
      }
    }).loadRecord(instance);
  },

  //when the 'delete' event is fired by our 'Index' template (see the index action), this method is called.
  //In this fictional example, we assume that the templates 'delete' event was called with the single argument
  //of the Page instance the user wishes to destroy
  destroy: function(instance) {
    instance.destroy({
      success: function() {
        alert("The Page was deleted");
        //at this point we might render another page for the user to look at
      },
      failure: function() {
        alert('Curses! The Page could not be deleted');
      }
    });
  },

  //when the 'save' event is fired by our 'Edit' template, this method is called.
  //Again, we assume that our template fired the event with the Page instance, and also an object with updates
  update: function(instance, updates) {
    //this applies the updates to the model instance and saves
    instance.update(updates, {
      success: function(updatedInstance) {
        alert('Success! It saved');
        //at this point we might render another page for the user to look at
      },
      failure: function(updatedInstance) {
        alert('Darn it. Did not save');

        //here we're firing the controller's update-failed event, which the view can pick up on
        //The view can simply listen to our Pages controller and add errors from this instance to the form
        //using form.markInvalid(instance.errors.forForm())
        this.fireEvent('update-failed', instance);
      };
    });
  },

   //Sets up events emitted by this controller. Controllers are expected to fire events, so this method is called
   //automatically when a controller is instantiated. Don't forget to call super here
  initEvents: function() {
    this.addEvents(
      //this event will be fired when the controller can't update a Page instance
      'update-failed'
    );

    MyApp.controllers.PagesController.superclass.initEvents.apply(this, arguments);
  }
})
</code></pre>
 * Note that many of the methods above are provided by the {@link ExtMVC.controller.CrudController CrudController}
 * 
 * <h2>Rendering Views</h2>
 * Each controller can automatically render view classes inside its views package. In the Pages controller above the
 * views package is MyApp.views.pages - the application itself is called MyApp, and the 'pages' segment comes from the
 * controller's 'name' property
 * <br />
 * <br />
 * In the example above, the line: <pre><code>this.render('Edit', {})</code></pre> will automatically find the
 * MyApp.views.pages.Edit class, with the second argument to this.render being a config argument passed to the view's constructor.
 * 
 * <br />
 * <h4>Rendering strategies</h4>
 * Not all applications will render views in the same way
 */
// ExtMVC.controller.Controller = Ext.extend(Ext.util.Observable,
ExtMVC.registerController('controller', {

  constructor: function(config) {
    Ext.util.Observable.prototype.constructor.apply(this, arguments);
    
    Ext.apply(this, {
      /**
       * @property renderStrategies
       * @type Object
       * An object of the form {xtype: function} which keys a container's xtype to the function to use
       * when rendering a view to that container (see registerRenderStrategy)
       */
      renderStrategies: {}
    }, config || {});
    
    this.registerDefaultRenderStrategies();
    
    this.initEvents();
    this.initListeners();
  },
  
  /**
   * Registers a rendering function for a given container xtype. When a view is rendered via this.render,
   * the xtype of the container it is being rendered to is compared to the registered strategy xtypes, and
   * the most specific match will be used to perform the rendering.
   * @param {String} xtype The container xtype to register
   * @param {Function} strategy The function to call when rendering to a container of the given xtype
   */
  registerRenderStrategy: function(xtype, strategy) {
    this.renderStrategies[xtype] = strategy;
  },
  
  /**
   * Returns the strategy function to use when rendering to the given container instance.
   * @param {Ext.Container} container The container to add to
   * @return {Function} The rendering strategy to use
   */
  getRenderStrategy: function(container) {
    var xtypes = container.getXTypes().split("/");
    
    for (var i = xtypes.length - 1; i >= 0; i--){
      var strategy = this.renderStrategies[xtypes[i]];
      
      if (strategy != undefined) return strategy;
    };
    
    throw new Ext.Error("No render strategy could be found for the container you specified");
  },
  
  /**
   * @private
   * Adds the default strategies for panel and tabpanel
   */
  registerDefaultRenderStrategies: function() {
    this.registerRenderStrategy('panel', this.panelRenderStrategy);
    this.registerRenderStrategy('tabpanel', this.tabPanelRenderStrategy);
  },
  
  /**
   * Sets up events emitted by this controller. This defaults to an empty function and is
   * called automatically when the controller is constructed so can simply be overridden
   */
  initEvents: function() {},
  
  /**
   * Sets up events this controller listens to, and the actions the controller should take
   * when each event is received.  This defaults to an empty function and is called when
   * the controller is constructed so can simply be overridden
   */
  initListeners: function() {},
  
  /**
   * Shows the user a notification message. Usually used to inform user of a successful save, deletion, etc
   * This is an empty function which you must implement yourself
   * @param {String} notice The string notice to display
   */
  showNotice: function(notice) {},
  
  /**
   * @property addTo
   * @type Ext.Container
   * The container to add views to using the 'add' renderMethod.  Usually set to an Ext.TabPanel instance or similar
   */
  addTo: null,
  
  /**
   * Renders a given view name in the way set up by the controller.  For this to work you must have passed a 
   * 'name' property when creating the controller, which is automatically used to find the view namespace for
   * this controller.  For example, in an application called MyApp, and a controller with a name of 'users',
   * the view namespace would be MyApp.views.users, and render('Index') would search for a class called
   * MyApp.views.users.Index and instantiate it with the passed config.
   * An error is thrown if the view could not be found.
   * @param {String} viewName The name of the view class within the view namespace used by this controller
   * @param {Object} config Configuration options passed through to the view class' constructor
   * @return {Ext.Component} The view object that was just created
   */
  render: function render() {
    //handle both method signatures
    switch(arguments.length) {
      case 1:
        //this just falls through into case 2, which provides a config {} if one is not supplied
      case 2:
        var namespace = this.name,
            viewName  = arguments[0],
            config    = arguments[1] || {};
        break;
      case 3:
        var namespace = arguments[0],
            viewName  = arguments[1],
            config    = arguments[2] || {};
        break;
    }
    
    //we also use this constructor object to define whether or not the view should be added to the default
    //container or not
    Ext.applyIf(config, { 
      autoAdd: true,
      addTo  : ExtMVC.app.main
    });
    
    //NOTE: ExtMVC.getView will throw an error if the view hasn't been defined anywhere yet. At the moment this
    //error will just propagate up as it's probably pretty clear, but we could provide a custom Error message here instead
    var view = new (this.getView(namespace, viewName))(config);
    
    if (config.autoAdd === true) {
      if (view.isXType('window')) {
        view.show();
      } else {
        this.getRenderStrategy(config.addTo)(config.addTo, view);
      }
    }

    return view;
  },
  
  /**
   * Just calls ExtMVC.getView and returns. This is here because we override it in Crud Controller
   * @param {String} namespace The view namespace
   * @param {String} name The view name
   * @return {Function} The view constructor function
   */
  getView: function(namespace, name) {
    return ExtMVC.getView(namespace, name);
  },
  
  /**
   * @private
   * The tabpanel render strategy
   */
  tabPanelRenderStrategy: function(container, view) {
    var existing = container.getItem(view.id);
    
    //don't add a tab with the same id as an existing one
    if (existing == undefined) {
      container.add(view);
      container.doLayout();
      container.activate(view);      
    } else {
      container.setActiveTab(view.id);
      view.destroy();
    }
  },
  
  /**
   * @private
   * The panel render strategy
   */
  panelRenderStrategy: function(container, view) {
    container.removeAll();
    container.add(view);
    container.doLayout();
  }
});