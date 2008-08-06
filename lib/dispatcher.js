/**
 * Simple class to handle dispatching from the Router
 */
Ext.ux.MVC.Dispatcher = function(config) {
  var config = config || {};
  
  /**
   * Instantiates the correct controller, fires the relevant action with the 
   * data given to us by the router
   */
  this.dispatch = function(url) {
    Ext.ux.MVC.params = config.router.recognise(url);
    params = Ext.ux.MVC.params;
    
    c = this.getControllerByName(String.capitalize(params[":controller"]) + "Controller");
    c.doAction(params[":action"], params);
  };
  
  this.getControllerByName = function(controller_name) {
    return new config.application.controllers[controller_name];
  };
};

Ext.ux.MVC.params = {};