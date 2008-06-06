function Application(config) {
  var layoutManager = new LeftMenuLayoutManager(config);
  var lm = this.layoutManager;
  var controllers = [];
  
  layoutManager.initializeMenu('menu');
  
  return {
    getLayoutManager : function() {
      return layoutManager;
    },
    
    registerController : function(controller, controller_name) {
      controllers[controller_name] = controller;
    },
    
    getControllerByName : function(controller_name) {
      return new controllers[controller_name];
    }
  };
};