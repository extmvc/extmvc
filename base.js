Ext.namespace("Ext.ux.MVC");

//version 0.4
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
    Ext.namespace(namespace, namespace + ".controllers", namespace + ".models", namespace + ".views");
    
    for (var i = views.length - 1; i >= 0; i--){
      Ext.namespace(namespace + ".views." + views[i]);
    };
  }
};

Ext.namespace("Ext.ux.MVC.controller", "Ext.ux.MVC.model", "Ext.ux.MVC.view", "Ext.ux.MVC.helper");

//additional helper namespaces
Ext.namespace("Ext.ux.MVC.helper.button", "Ext.ux.MVC.helper.grid", "Ext.ux.MVC.helper.form");