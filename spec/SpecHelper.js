/**
 * @class MVCTest.models.User
 * @extends Ext.ux.MVC.Model
 */
Ext.ux.MVC.Model.define("MVCTest.models.User", {
  modelName: 'user',
  fields:    [
    {name: 'id',         type: 'int'},
    {name: 'first_name', type: 'string'},
    {name: 'last_name',  type: 'string'},
    {name: 'email',      type: 'string'}
  ],
  hasMany: "BlogPost",
  
  testClassMethod: function() {
    return "A Class Method";
  }
});

/**
 * @class MVCTest.models.AdminUser
 * @extends MVCTest.models.User
 * A subclass of User, defining additional fields
 */
Ext.ux.MVC.Model.define("MVCTest.models.AdminUser", {
  extend: "MVCTest.models.User",
  fields: [
    {name: 'is_admin', type: 'bool'},
    {name: 'password', type: 'string'}
  ]
});

/**
 * @class MVCTest.models.BlogPost
 * @extends Ext.ux.MVC.Model
 */
Ext.ux.MVC.Model.define("MVCTest.models.BlogPost", {
  fields:    [
    {name: 'id',      type: 'int'},
    {name: 'title',   type: 'string'},
    {name: 'content', type: 'string'},
    {name: 'user_id', type: 'int'}
  ],
  belongsTo: "User",
  hasMany:   "Comment",
  
  instanceMethods: {
    testInstanceMethod: Ext.emptyFn
  }
});

/**
 * @class MVCTest.models.Comment
 * @extends Ext.ux.MVC.Model
 */
Ext.ux.MVC.Model.define("MVCTest.models.Comment", {
  fields:    [
    {name: 'id',           type: 'int'},
    {name: 'blog_post_id', type: 'int'},
    {name: 'content',      type: 'string'}
  ],
  belongsTo: "BlogPost"
});

MVCTest.OS = new Ext.ux.MVC.OS({
  name: "MVCTest"
});

MVCTest.controllers = {};

/**
 * @class MVCTest.controllers.IndexController
 * @extends Ext.ux.MVC.Controller
 * Fake controller for use in OS.spec.js, Controller.spec.js and CrudController.spec.js
 */
MVCTest.controllers.IndexController = Ext.extend(Ext.ux.MVC.Controller, {
  constructor: function() {
    //super
    MVCTest.controllers.IndexController.superclass.constructor.call(this, {
      viewsPackage: MVCTest.views.index
    });
    
    // this.actsAsCrudController(MVCTest.models.User);
  }
});

Ext.ns('MVCTest.views.index');