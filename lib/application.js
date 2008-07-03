function Application(config) {
  this.layoutManager = new LeftMenuLayoutManager(config);  
  this.layoutManager.initializeMenu('menu');
  
  this.controllers = [];
  
  //a bit of eval horridness to automatically register the controllers in this namespace
  if (config.namespace) {
    config.namespace_var = eval(config.namespace);
    for (c in config.namespace_var.controllers) {
      eval("this.registerController(" + config.namespace + ".controllers." + c + ", '" + c + "');");
    };
  };
};
  
Application.prototype = {
  getLayoutManager : function() {
    return this.layoutManager;
  },

  registerController : function(controller, controller_name) {
    this.controllers[controller_name] = controller;
  },

  getControllerByName : function(controller_name) {
    return new this.controllers[controller_name];
  }
};