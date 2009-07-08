Ext.ns('MVCTest', 'MVCTest.models');

ExtMVC.model.modelNamespace = MVCTest.models;

/**
 * @class MVCTest.models.User
 * @extends ExtMVC.model
 */
ExtMVC.model.define("User", {
  fields:    [
    {name: 'id',         type: 'int'},
    {name: 'first_name', type: 'string'},
    {name: 'last_name',  type: 'string'},
    {name: 'email',      type: 'string'}
  ],
  hasMany: "BlogPost",
  
  displayName: function() {
    return String.format("{0} {1}", this.data.first_name, this.data.last_name);
  },
  
  //this is used to test instance method inheritance in Model.spec.js
  earlyJoiner: function() {
    return this.data.id < 100;
  },
  
  classMethods: {
    testClassMethod: function() {
      return "A Class Method";
    },
    
    //simple class method to test class method overwrites
    methodToOverwrite: function() {
      return true;
    }
  }
});

/**
 * @class MVCTest.models.AdminUser
 * @extends MVCTest.models.User
 * A subclass of User, defining additional fields
 */
ExtMVC.model.define("AdminUser", {
  extend: "User",
  fields: [
    {name: 'is_admin', type: 'bool'},
    {name: 'password', type: 'string'}
  ]
});

/**
 * @class MVCTest.models.BlogPost
 * @extends ExtMVC.model
 */
ExtMVC.model.define("BlogPost", {
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
 * @extends ExtMVC.model
 */
ExtMVC.model.define("Comment", {
  fields:    [
    {name: 'id',           type: 'int'},
    {name: 'blog_post_id', type: 'int'},
    {name: 'content',      type: 'string'}
  ],
  belongsTo: "BlogPost"
});

MVCTest.OS = new ExtMVC.OS({
  name: "MVCTest"
});

MVCTest.controllers = {};

/**
 * @class MVCTest.controllers.IndexController
 * @extends ExtMVC.Controller
 * Fake controller for use in OS.spec.js, Controller.spec.js and CrudController.spec.js
 */
MVCTest.controllers.IndexController = Ext.extend(ExtMVC.Controller, {
  constructor: function() {
    //super
    MVCTest.controllers.IndexController.superclass.constructor.call(this, {
      viewsPackage: MVCTest.views.index
    });
    
    // this.actsAsCrudController(MVCTest.models.User);
  }
});

Ext.ns('MVCTest.views.index');