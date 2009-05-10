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

/**
 * Method  Collection Individual
 * create  yes        yes  (but different)
 * build   yes        yes
 * find    yes        no
 * loaded  yes        yes  (but different)
 * count   yes        no
 * destroy yes        yes  (but different)
 */

/**
 * Method  HasMany BelongsTo
 * create  yes     no
 * build   yes     no
 * destroy yes     yes
 * find    yes     yes
 */

/**
 * User.find(1, {
 *   success: function(user) {
 *     //on belongs to associations
 *     user.group.destroy();
 *     user.group.find({success: function(group) {}});
 *     user.group.set(someGroupInstance); //someGroupInstance must be a saved record (e.g. have an ID)
 * 
 *     //on has many associations
 *     user.posts.destroy(1);
 *     user.posts.find({id: 1, conditions: [{field: 'title', comparator: '=', value: 'some title'}]}, options);
 *     user.posts.create(data, options)
 *     user.posts.build(data)
 *   }
 * };
 */

// ExtMVC.Model.define('User', {
//   fields:  [],
//   belongsTo: "Group",
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