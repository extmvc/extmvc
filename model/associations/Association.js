Ext.ns('ExtMVC.Model.association');

(function() {
  var A = ExtMVC.Model.association;
  
  A.Base = function(ownerClass, associatedClass, config) {
    config = config || {};
    
    this.ownerClass = ownerClass;
    this.associatedClass = associatedClass;
    
    Ext.apply(this, config.extend || {});
    this.initialConfig = config;
    
    this.initialize();
  };

  A.Base.prototype = {
    /**
     * Sets up default values for foreignKey
     */
    initialize: Ext.emptyFn
  };
  
  /**
   * @class A.BelongsTo
   * @extends A.Base
   * A belongsTo association
   */
  A.BelongsTo = Ext.extend(A.Base, {
    initialize: function() {
      Ext.apply(this, {
        name:       ExtMVC.Inflector.singularize(this.associatedClass.prototype.tableName),
        foreignKey: this.associatedClass.prototype.foreignKeyName
      });
    }
  });
  
  /**
   * @class A.HasMany
   * @extends A.Base
   * A hasMany association
   */
  A.HasMany = Ext.extend(A.Base, {
    
    /**
     * Set up default values for name etc
     */
    initialize: function() {
      Ext.apply(this, {
        name:       this.associatedClass.prototype.tableName,
        foreignKey: this.ownerClass.prototype.foreignKeyName
      });
    }
  });
})();



// ExtMVC.Model.define('User', {
//   fields:    [],
//   hasMany: [{
//     name:       'posts',
//     className:  'Post',
//     foreignKey: 'user_id',
//     
//     extend: {
//       //some functions
//     }
//   }]
// });
// 
// user.posts.find(1, {
//   success: function() {},
//   failure: function() {}
// });
// 
// user.posts.create({}, {
//   success: function() {},
//   failure: function() {}
// });
// 
// user.posts.build({});
// 
// user.posts.loaded();
// user.posts.count();
// user.posts.destroy(1);
// 
// ExtMVC.Model.define('Post', {
//   fields:    [],
//   belongsTo: [{
//     name:       'user',
//     className:  'User',
//     foreignKey: 'user_id',
//     
//     extend: {
//       //some functions
//     }
//   }],
//   hasMany: 'Comment'
// });
// 
// post.user.find();
// post.user.loaded();
// post.user.destroy();
// 
// ExtMVC.Model.define('Comment', {
//   fields:    [],
//   belongsTo: "Post"
// });