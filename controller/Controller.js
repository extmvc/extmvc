/**
 * ExtMVC.Controller
 * @extends Ext.util.Observable
 * Controller base class
 */
ExtMVC.Controller = Ext.extend(Ext.util.Observable, {
  
  /**
   * @property name
   * @type String
   * The string name for this controller. Used to automatically register the controller with ExtMVC,
   * and to include all views under the view package of the same name.  For example, if your application is
   * called MyApp and the controller name is users, all views in the MyApp.views.users namespace will be 
   * registered automatically for use with this.render().
   */
  name: null,
  
  onExtended: function() {
    if (this.name != null) {
      this.viewsPackage = Ext.ns(String.format("{0}.views.{1}", ExtMVC.name, this.name));
      
      ExtMVC.registerController(this.name, this.constructor);
    }
  },
  
  constructor: function(config) {
    ExtMVC.Controller.superclass.constructor.apply(this, arguments);
    
    Ext.apply(this, config || {});
    
    this.initEvents();
    this.initListeners();
  },
  
  /**
   * Sets up events emitted by this controller. This defaults to an empty function and is
   * called automatically when the controller is constructed so can simply be overridden
   */
  initEvents: Ext.emptyFn,
  
  /**
   * Sets up events this controller listens to, and the actions the controller should take
   * when each event is received.  This defaults to an empty function and is called when
   * the controller is constructed so can simply be overridden
   */
  initListeners: Ext.emptyFn,
  
  /**
   * Shows the user a notification message. Usually used to inform user of a successful save, deletion, etc
   * This is an empty function which you must implement yourself
   * @param {String} notice The string notice to display
   */
  showNotice: function(notice) {
    console.log(notice);
  },
  
  /**
   * Returns the view class registered for the given view name, or null
   * @param {String} viewName The name registered for this view with this controller
   * @return {Function/null} The view class (or null if not present)
   */
  getViewClass: function(viewName) {
    return this.viewsPackage[viewName];
  },
  
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
  render: function(viewName, config) {
    var viewC = this.getViewClass(viewName);
    
    if (typeof viewC == "function") {
      var view = new viewC(config);
      if (this.addTo) this.renderViaAddTo(view);
      
      return view;
    } else {
      throw new Error(String.format("View '{0}' not found", viewName));
    }
  },
  
  /**
   * Adds the given component to this application's main container.  This is usually a TabPanel
   * or similar, and must be assigned to the controllers addTo property.  By default,
   * this method removes any other items from the container first, then adds the new component
   * and calls doLayout
   * @param {Ext.Component} component The component to add to the controller's container
   */
  renderViaAddTo: function(component) {
    if (this.addTo != undefined) {
      this.addTo.removeAll();
      this.addTo.doLayout();
      
      this.addTo.add(component);
      this.addTo.doLayout();
    }
  }
});

Ext.reg('controller', ExtMVC.Controller); 