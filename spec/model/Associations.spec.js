Screw.Unit(function() {
  //keep track of the object to which models are currently assigned
  var ns = ExtMVC.Model.modelNamespace;
  
  describe("Associations", function() {
    ExtMVC.Model.define("AssocUser", {
      fields:  [],
      hasMany: "AssocPost"
    });

    ExtMVC.Model.define("AssocPost", {
      fields:    [],
      hasMany:   "AssocComment",
      belongsTo: "AssocUser"
    });

    ExtMVC.Model.define("AssocComment", {
      fields:    [],
      belongsTo: {
        associatedClass: "AssocPost",
        associationName: 'posts',
        extend: {
          myMethod: function() {}
        }
      }
    });
    
    describe("The Associations plugin", function() {
      var associations = ExtMVC.Model.plugin.association,
          model        = ns.AssocPost,
          commentModel = ns.AssocComment;
      
      it("should add a hasMany relationship where defined", function() {
        expect(model.prototype.AssocComments instanceof associations.HasMany).to(equal, true);
      });
      
      it("should add a belongsTo relationship where defined", function() {
        expect(model.prototype.AssocUser instanceof associations.BelongsTo).to(equal, true);
      });
      
      it("should allow customisation of association names", function() {
        expect(commentModel.prototype.posts instanceof associations.BelongsTo).to(equal, true);
      });
    });
    
    describe("A Base association", function() {
      /**
       * Create an association between BlogPost and User.
       * In practice we never actually instantiate Base associations as they don't
       * do very much, instead use a subclass such as HasMany or BelongsTo
       */
      var assoc = new ExtMVC.Model.plugin.association.Base(ns.BlogPost, ns.User, {
        extend: {
          myProperty: 'property',
          myFunction: function() { return 'result'; }
        }
      });

      it("should maintain a reference to its owner class", function() {
        expect(assoc.ownerClass).to(equal, ns.BlogPost);
      });

      it("should maintain a reference to its associated class", function() {
        expect(assoc.associatedClass).to(equal, ns.User);
      });

      it("should add extension properties to the association", function() {
        expect(assoc.myProperty).to(equal, 'property');
        expect(assoc.myFunction()).to(equal, 'result');
      });
    });

    describe("A BelongsTo association", function() {
      //blog post belongs to user
      var assoc = new ExtMVC.Model.plugin.association.BelongsTo(ns.BlogPost, ns.User);

      it("should set a default association name", function() {
        expect(assoc.name).to(equal, 'user');
      });

      it("should set a default foreign key", function() {
        expect(assoc.foreignKey).to(equal, 'user_id');
      });
    });

    describe("A HasMany association", function() {
      //user has many blog posts
      var assoc = new ExtMVC.Model.plugin.association.HasMany(ns.User, ns.BlogPost);

      it("should set a default association name", function() {
        expect(assoc.name).to(equal, 'blog_posts');
      });

      it("should set a default foreign key", function() {
        expect(assoc.foreignKey).to(equal, 'user_id');
      });
    });
  });
});