Screw.Unit(function() {
  describe("The Router", function() {
    var router;
    
    before(function() {
      router = new ExtMVC.Router();
    });
    
    describe("connect", function() {
      // it("should create a new Route", function() {
      //   var routeCreated = false;
      //   ExtMVC.Route = function() {routeCreated = true;};
      //   
      //   router.connect(':controller/:action');
      //   expect(routeCreated).to(equal, true);
      // });
    });
    
    describe("name", function() {
      before(function() {
        router.name("myRoute", "myNamespace/:controller/:action");
      });
      
      // it("should create a new Route", function() {
      //   var routeCreated = false;
      //   
      //   ExtMVC.Route = ExtMVC.Route.prototype.constructor.createInterceptor(function() {
      //     routeCreated = true; 
      //     
      //     return arguments;
      //   }, this);
      //   
      //   router.connect(':controller/:action');
      //   expect(routeCreated).to(equal, true);
      // });
      
      it("should make the route accessible as a named route", function() {
        expect(typeof router.namedRoutes['myRoute']).to_not(equal, "undefined");
      });
    });
    
    describe("root", function() {
      before(function() {
        router.root({controller: 'index', action: 'index'});
      });
      
      
    });
    
    describe("recognising url strings", function() {
      before(function() {
        router.connect(":controller/:action/:id");
        router.connect(":controller/:action");
      });
      
      it("should recognise :controller/:action/:id", function() {
        expect(router.recognise("index/index")).to_not(equal, false);
      });
      
      it("should return the correct controller", function() {
        expect(router.recognise("cont/act").controller).to(equal, "cont");
      });
      
      it("should return the correct action", function() {
        expect(router.recognise("cont/act").action).to(equal, "act");
      });
      
      it("should return the correct id", function() {
        expect(router.recognise("cont/act/100").id).to(equal, "100");
      });
      
      describe("more complex URLs", function() {
        before(function() {
          router.connect("myNamespace/:controller/anotherSegment/:action");
        });
        
        it("should recognise URLS with arbitrary text in the matcher", function() {
          var url = "myNamespace/cont/anotherSegment/act";
          expect(router.recognise(url).controller).to(equal, "cont");
          expect(router.recognise(url).action).to(equal, "act");
        });
        
        describe("with match conditions", function() {
          before(function() {
            router.connect("myNamespace/:controller/:action/:id", {conditions: {':id': "[0-9]+"}});
          });
          
          it("should not recognise if the conditions are not met", function() {
            expect(router.recognise("myNamespace/cont/act/notanumber")).to(equal, false);
          });
          
          it("should recognise if the conditions are met", function() {
            expect(router.recognise("myNamespace/cont/act/150").id).to(equal, 150);
          });
        });
      });
    });
  });
});
