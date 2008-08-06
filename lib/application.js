function Application(config) {
  var config = config || {};
  
  this.controllers = [];
  
  //TODO: Can we do this a less disgusting way?
  //a bit of eval horridness to automatically register the controllers in this namespace
  if (config.namespace) {
    config.namespace_var = eval(config.namespace);
    for (c in config.namespace_var.controllers) {
      eval("this.registerController(" + config.namespace + ".controllers." + c + ", '" + c + "');");
    };
  };
  
  //initialize the History manager if a router has been defined
  if (config.router) {
    this.dispatcher = new Ext.ux.MVC.Dispatcher({router: config.router, application: this});
    Ext.History.init();
    Ext.History.on('change', function(token) {
      if (token) {
        this.dispatcher.dispatch(token);
      } else {
        //TODO: Should go to a default place... but where? :)
        
      };
    }, this);
  };
  
  this.layoutManager = new LeftMenuLayoutManager(config);  
  this.layoutManager.initializeMenu('menu');
};
  
Application.prototype = {
  getLayoutManager : function() {
    return this.layoutManager;
  },
  
  getRouter : function() {
    return this.router;
  },
  
  setRouter : function(router) {
    this.router = router;
  },

  registerController : function(controller, controller_name) {
    this.controllers[controller_name] = controller;
  },

  getControllerByName : function(controller_name) {
    return new this.controllers[controller_name];
  },
  
  /**
   * Restores the application to the correct view.  Used when first initializing the application
   */
  initialize : function(config) {
    var config = config || {};
    
    if (window.location.hash) {
      url = window.location.hash.replace(/#/, '');
      this.dispatcher.dispatch(url);
    } else {
      if (config.defaultView) {
        Ext.History.add(config.defaultView);
      } else {
        alert("Couldn't find any view to display when initializing the application.  Call application.initialize({defaultView: \"dashboard/Index\"}) or similar to show a default view)");
      };
    };
  }
};