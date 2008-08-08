Ext.namespace("Ext.ux.MVC");

Ext.ux.MVC = {
  version: "0.4",
  
  /**
   * Method to set up namespaces for views, controllers, models, views and each view directory.  Calling:
   * Ext.ux.MVC.namespaceViews('MyNamespace', ['users', 'products']);
   * is equivalent to:
   * Ext.namespace("MyNamespace.views.users", "MyNamespace.views.products");
   */
  createNamespaces: function(namespace, views) {
    //First, set up top level namespaces
    Ext.namespace(namespace, namespace + ".controllers", namespace + ".models", namespace + ".views", namespace + ".helpers");
    
    for (var i = views.length - 1; i >= 0; i--){
      Ext.namespace(namespace + ".views." + views[i]);
    };
  },
  
  /**
   * Creates global aliases to make Ext MVC feel more like rails.
   * Specifically, provide aliases for:
   * Ext.ux.MVC.params => params
   * Ext.ux.MVC.Flash.flash => flash
   */
  behaveLikeRails: function() {
    params = Ext.ux.MVC.params;
    flash  = Ext.ux.MVC.Flash.flash;
  }
};

Ext.namespace("Ext.ux.MVC.controller", "Ext.ux.MVC.model", "Ext.ux.MVC.view", "Ext.ux.MVC.helper");

//additional helper namespaces
Ext.namespace("Ext.ux.MVC.helper.button", "Ext.ux.MVC.helper.grid", "Ext.ux.MVC.helper.form");