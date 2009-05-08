Screw.Unit(function() {
  //keep track of the object to which models are currently assigned
  var ns = ExtMVC.Model.modelNamespace;
  
  describe("Associations", function() {
    describe("A Base association", function() {
      /**
       * Create an association between BlogPost and User.
       * In practice we never actually instantiate Base associations as they don't
       * do very much, instead use a subclass such as HasMany or BelongsTo
       */
      var assoc = new ExtMVC.Model.association.Base(ns.BlogPost, ns.User, {
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
      var assoc = new ExtMVC.Model.association.BelongsTo(ns.BlogPost, ns.User);

      it("should set a default association name", function() {
        expect(assoc.name).to(equal, 'user');
      });

      it("should set a default foreign key", function() {
        expect(assoc.foreignKey).to(equal, 'user_id');
      });
    });

    describe("A HasMany association", function() {
      //user has many blog posts
      var assoc = new ExtMVC.Model.association.HasMany(ns.User, ns.BlogPost);

      it("should set a default association name", function() {
        expect(assoc.name).to(equal, 'blog_posts');
      });

      it("should set a default foreign key", function() {
        expect(assoc.foreignKey).to(equal, 'user_id');
      });
    });
  });
});