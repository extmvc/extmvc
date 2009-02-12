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
  hasMany:   "Comment"
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