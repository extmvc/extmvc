Screw.Unit(function() {
  //keep track of the object to which models are currently assigned
  var ns = ExtMVC.Model.modelNamespace;
  
  describe("A belongsTo association", function() {
    //create an association between User and BlogPost
    var bt = new ExtMVC.Model.BelongsToAssociation({
      ownerModel:      ns.BlogPost,
      associatedModel: ns.Users
    });
    
    describe("instance", function() {
      it("should maintain a reference to its owner and associated models", function() {
        expect(bt.ownerModel).to(equal, ns.User);
        expect(bt.associatedModel).to(equal, us.BlogPost);
      });
      
      describe("finding methods", function() {
        
      });
      
      describe("if cache is set to false", function() {
        it("should not cache results of find operations", function() {
          
        });
      });
    });
    
    describe("helpers", function() {
      
    });
  });
});
