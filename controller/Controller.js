/**
 * Ext.ux.MVC.Controller
 * @extends Ext.util.Observable
 * Controller base class
 */
Ext.ux.MVC.Controller = function(config) {
  var config = config || {};
  Ext.applyIf(config, {
    autoRegisterViews: true
  });
  
  Ext.ux.MVC.Controller.superclass.constructor.call(this, config);
  
  /**
   * @property views
   * @type Object
   * Hash of all views registered for use with this Controller.
   * Read only, use @link {getViewClass} for access
   */
  this.views = {};
  
  /**
   * @property runningViews
   * @type Object
   * Hash of all views which are currently rendered and referenced.  Indexed by the view's ID
   * Read only!  Use renderView and destroyView to add or remove.
   */
  this.runningViews = {};
  
  /**
   * @property actions
   * @type Object
   * Maintains a reference to each registered action. Read only.
   */
  this.actions = {};
  
  this.addEvents(
    /**
     * @event init
     * Fires when this controller is created.
     * @param {Ext.ux.MVC.Controller} this The controller instance
     */
    'init',
    
    /**
     * @event beforedefaultaction
     * Fires is this.fireAction('someAction') is called, but 'someAction' has not been defined
     * with this.registerAction().  Default behaviour in this case is to attempt to find a view
     * of the same name and display it.  If you want to provide your own behaviour here, just
     * return false to this event
     * @param {string} actionName The name of the action being fired
     * @param {Object} scope The scope the action is being fired within
     * @param {Array} args An array of arguments passed to the action
     */
    'beforedefaultaction'
  );
  
  /**
   * Automatically register all views in the config.viewsPackage
   */
  if (config.autoRegisterViews && config.viewsPackage) {
    for (v in config.viewsPackage) {
      this.registerView(v.toLowerCase(), config.viewsPackage[v]);
    }
  };
  
  this.fireEvent('init', this);
};

Ext.extend(Ext.ux.MVC.Controller, Ext.util.Observable, {
  
  /**
   * Attaches a view class to this controller - allows the controller to create the view
   * @param {String} viewName The name of this view (e.g. 'index')
   * @param {Function} viewClass A reference to the view class to be instantiated (e.g. MyApp.view.Index, which is some subclass of Ext.Panel)
   */
  registerView: function(viewName, viewClass) {
    this.views[viewName] = viewClass;
  },
  
  /**
   * Convenience method to batch register views with this Controller
   * @param {Object} An object of viewName: viewClass options.  e.g. {'index': MyApp.view.Index}
   * would be the same as this.registerView('index', MyApp.view.Index)
   */
  registerViews: function(viewObject) {
    for (v in viewObject) {
      this.registerView(v, viewObject[v]);
    }
  },
  
  /**
   * Returns the view class registered for the given view name, or null
   * @param {String} viewName The name registered for this view with this controller
   * @return {Function/null} The view class (or null if not present)
   */
  getViewClass: function(viewName) {
    return this.views[viewName];
  },
  
  /**
   * @property renderMethod
   * @type String
   * Can be either renderNow or return.  renderNow attempts to actually render the view, whereas return just returns it
   */
  renderMethod: 'renderNow',
  
  /**
   * @property addTo
   * @type Ext.Container
   * The container to add views to using the 'add' renderMethod.  Usually set to an Ext.TabPanel instance or similar
   */
  addTo: null,
  
  /**
   * @property resourceModel
   * @type Function/Null
   * Defaults to null.  If set to a reference to an Ext.ux.MVC.Model subclass, renderView will attempt to dynamically
   * scaffold any missing views, if the corresponding view is defined in the Ext.ux.MVC.view.scaffold package
   */
  resourceModel: null,
  
  /**
   * Returns a reference to the Scaffold view class for a given viewName
   * @param {String} viewName The name of the view to return a class for (index, new, edit or show)
   * @return {Function} A reference to the view class to instantiate to render this scaffold view
   */
  scaffoldViewName: function(viewName) {
    return eval("Ext.ux.MVC.view.scaffold." + String.titleize(viewName));
  },
  
  /**
   * Creates the requested view and registers it with this.runningViews.
   * Each view should have a unique ID, or the view is not rendered and an error is raised
   * @param {String} viewName The registered name of the view to create and render
   * @param {Object} viewConfig Generic config object passed to the view's constructor
   * @param {Object} renderConfig Render configuration options
   * @return {Object} A reference to the newly created view
   * @throws Error when a view for the given viewName has not been registered, or if the view's ID has already been taken
   */
  renderView: function(viewName, viewConfig, renderConfig) {
    var renderConfig = renderConfig || {};
    var viewConfig   = viewConfig   || {};
    
    //by default we render straight away, to the Body element
    Ext.applyIf(renderConfig, {
      renderTo:   Ext.getBody(),
      renderNow:  true,
      renderOnce: true
    });
    
    var v;
    
    //if a view class has been registered
    if (typeof((this.getViewClass(viewName))) == 'function') {
      v = new (this.getViewClass(viewName))(viewConfig);
      
    //view has not been registered, attempt to create one
    } else if (this.resourceModel) {
      v = new (this.scaffoldViewName(viewName))(this.resourceModel);
    }
    
    if (!v || typeof(v) == 'undefined') {return;}
    
    var running = this.getRunningView(v.id);
    if (running) {
      if (renderConfig.renderOnce) {
        v.destroy();
        return running;
      } else {
        //view ID has already been taken, throw an error
        throw new Error('The view ID ' + v.id + ' has already been taken.  Each view instance must have a unique ID');        
      };
    } else {
      v.on('close',   function()     {this.destroyView(v.id); },            this);
      v.on('destroy', function(view) {delete this.runningViews[view.id]; }, this);
      this.runningViews[v.id] = v;
      
      if (this.renderMethod == 'render' && renderConfig.renderNow) {
        v.render(renderConfig.renderTo, renderConfig.renderPosition);
        return v;
      } else {
        if (this.addTo && renderConfig.renderNow) {
          this.addTo.add(v).show();
          this.addTo.doLayout();
        };
      };
    };

  },
  
  /**
   * Returns an instance of a running view with the given ID
   * @param {String} viewId The unique ID of a view instantiation
   * @return {Object} The view instance, or null if no match
   */
  getRunningView: function(viewId) {
    return this.runningViews[viewId];
  },
  
  /**
   * Returns an array of all running view instances whose IDs match the given regex
   * @param {Object} regex The regular expression to compare unique view instance IDs to
   * @return {Array} An array of matching view instances
   */
  getRunningViews: function(regex) {
    //make sure we have a regex object
    if (!regex.test) { return []; }
    
    var matches = [];
    for (v in this.runningViews) {
      if (regex.test(v)) {
        matches.push(this.runningViews[v]);
      };
    }
    
    return matches;
  },
  
  /**
   * Destroys the currently running view as referenced by the argument.
   * The argument must be an <em>ID</em> of a running view, not the registered viewName.
   * Check that a running view for a given ID exists using this.getRunningView.
   * @param {String} viewId The ID of the running view to destroy
   */
  destroyView: function(viewId) {
    var view = this.getRunningView(viewId);
    if (view) {
      view.destroy();
      delete this.runningViews[viewId];
    };
  },
  
  /**
   * Destroys all views with IDs matching the given regex
   * @param {Object} regex The Regular Expression to match IDs against
   */
  destroyViews: function(regex) {
    //make sure we have a regex object
    if (!regex.test) { return []; }
    
    for (v in this.runningViews) {
      if (regex.test(v)) {
        this.destroyView(v);
      };
    }
  },
  
  /**
   * Registers a function as an Action for this Controller.  Actions registered here
   * can take part in this.fireAction, and are automatically given before and after events.
   * For example registerAction('index', function() { ... }) registeres before_index and after_index
   * events, which are called before and after the action has been fired.  Return false to the before_
   * event in order to stop the action being called.
   * @param {String} actionName The string name to associate with this action function
   * @param {Function} actionFunction The action function to be called with this.fireAction(actionName)
   * @param {Object} options Gives ability to optionally bypass creation of before_ and after_ events
   * (e.g. {before_filter: false, after_filter: true}).  Both default to true
   */
  registerAction: function(actionName, actionFunction, options) {
    var options = options || {};
    Ext.applyIf(options, { before_filter: true, after_filter: true });
    
    //create the before and after filters
    if (options.before_filter) { this.addEvents('before_' + actionName); }
    if (options.after_filter)  { this.addEvents('after_'  + actionName); }
    
    this.actions[actionName] = actionFunction;
  },
  
  /**
   * Returns a reference to the function of the requested action name.  Does not execute the action
   * @param {String} actionName The string name of the action to find
   * @return {Function} A reference to the function, or null if not found
   */
  getAction: function(actionName) {
    return this.actions[actionName];
  },
  
  /**
   * Fires the requested action with any arguments passed to it.  If before and after filters have been
   * added to this action, they are fired before and after the action is executed (see {@link registerAction}).
   * If the specified action has not been registered, this will try to display the registered view with the same name,
   * if one has been defined.
   * @param {String} actionName The name of the action to call.  Nothing will happen if an invalid action name is specified
   * @param {Object} scope The scope in which to execute the action (defaults to the controller's scope).  Set this to null 
   * keep scope as the controller's scope if you need to pass additional params to the action
   * @param {Array} args An array of arguments to execute the action with (optional)
   */
  fireAction: function(actionName, scope, args) {
    var scope = scope || this;
    var args  = args  || [];
    
    var a = this.getAction(actionName);
    if (a) {
      if (this.fireEvent('before_' + actionName)) {
        a.apply(scope, args);
        
        this.fireEvent('after_' + actionName);
      };
    } else {
      if (this.fireEvent('beforedefaultaction', actionName, scope, args)) {
        var v;
        if (v = this.renderView(actionName, args[0])) {
          v.show();
        }
      };
    };
  },
  
  /**
   * Attaches an action to an event on any Ext.util.Observable object. Mainly a convenience method
   * in place of firingObject.on(eventName, actionName, actionScope)
   * @param {Object} firingObject The object to listen to for fired events
   * @param {String} eventName The name of the event to handle
   * @param {String} actionName The name of the action to dispatch to (this will be called with the arguments attached to the event)
   * @param {Object} actionScope The scope to execute the action within (defaults to this controller)
   */
  handleEvent: function(firingObject, eventName, actionName, actionScope) {
    var actionScope = actionScope || this;
    
    firingObject.on(eventName, function() {
      this.fireAction(actionName, actionScope, arguments);
    }, this);
  }
});

Ext.reg('controller', Ext.ux.MVC.Controller); 