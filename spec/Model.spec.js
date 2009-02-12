Screw.Unit(function() {
  describe("A Model", function() {
    var user; var blogPost;
    
    before(function() {
      user = new MVCTest.models.User({
        id:         100,
        first_name: 'William',
        last_name:  'Adama',
        email:      'adama@bsg.net'
      });
      
      blogPost = new MVCTest.models.BlogPost({
        id:      1,
        user_id: 100,
        title:   'Test Post',
        content: "Frak the odds, we're going to find her"
      });
    });
    
    it("should make class methods available at class level", function() {
      expect(typeof MVCTest.models.User.testClassMethod).to(equal, "function");
    });
    
    describe("When instantiating", function() {
      it("should assign parameters correctly from constructor", function() {
        expect(user.data.id).to(equal, 100);
        expect(user.data.first_name).to(equal, 'William');
        expect(user.data.last_name).to(equal, 'Adama');
        expect(user.data.email).to(equal, 'adama@bsg.net');
      });
      
      it("should return false for newRecord if the model object has an ID", function() {
        expect(user.newRecord).to(equal, false);
      });
      
      it("should return true to newRecord if the model does not have an ID", function() {
        var user2 = new MVCTest.models.User({first_name: 'Ed', last_name: 'Spencer'});
        expect(user2.newRecord).to(equal, true);
      });
    });
    
    describe("Extending another model", function() {
      var admin;
      before(function() {
        admin = new MVCTest.models.AdminUser({
          first_name: 'Saul',
          last_name:  'Tigh',
          email:      'tigh@bsg.net',
          logged_in:  true,
          password:   "It's in the fraking ship!"
        });
      });
      
      it("should inherit the fields from the base model", function() {
        var fields = MVCTest.models.AdminUser.fields;
        expect(fields.length).to(equal, 6);
      });
      
      it("should inherit class methods from the base model", function() {
        expect(typeof MVCTest.models.AdminUser.testClassMethod).to(equal, "function");
      });
    });
    
    describe("Associations", function() {
      describe("belongsTo", function() {
        var btAssoc;
        before(function() {
          btAssoc = blogPost.user;
        });
        
        it("should set up the belongsTo association", function() {
          expect(typeof btAssoc).to_not(equal, "undefined");
        });
        
        it("should expose 'get' on the association", function() {
          expect(typeof btAssoc.get).to(equal, "function");
        });
        
        it("should expose 'set' on the association", function() {
          expect(typeof btAssoc.set).to(equal, "function");
        });
      });
      
      describe("hasMany", function() {
        var hmAssoc;
        before(function() {
          hmAssoc = blogPost.comments;
        });
        
        it("should set up the hasMany association", function() {
          expect(typeof hmAssoc).to_not(equal, "undefined");
        });
        
        it("should expose 'findAll' on the association", function() {
          expect(typeof hmAssoc.findAll).to(equal, "function");
        });        
      });
    });
  });
});
