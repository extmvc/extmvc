Ext.onReady(function(){
  application = new function Application() {
    var layoutManager = new LeftMenuLayoutManager();
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
  
  application.registerController(DashboardController,  'DashboardController');

  d = new DashboardController();
  d.viewIndex();
});