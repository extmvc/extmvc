Screw.Unit(function() {
  var os;
  before(function() {
    os = new ExtMVC.OS();
  });
  
  describe("An OS", function() {
    
    it("should register controllers", function() {
      expect(os.getController('index')).to(equal, null);
      
      os.registerController('index', MVCTest.controllers.IndexController);
      expect(os.controllers['index']).to(equal, MVCTest.controllers.IndexController);
    });
    
    it("should find and instantiate registered controllers", function() {
      os.registerController('index', MVCTest.controllers.IndexController);
      expect(os.getController('index') instanceof MVCTest.controllers.IndexController).to(equal, true);
    });
    
    describe("when Launching", function() {
      it("should call onLaunch", function() {
        var called = false;
        os.onLaunch = function() {called = true;};
        
        os.launch();
        
        expect(called).to(equal, true);
      });
    });
    
    describe("when creating the Router", function() {
      it("should not overwrite the current router", function() {
        os.router = 'not a real router';
        os.initializeRouter();
        expect(os.router).to(equal, 'not a real router');
      });
      
      it("should assign a new Router instance to this.router", function() {
        os.initializeRouter();
        expect(os.router instanceof ExtMVC.Router).to(equal, true);
      });
    });
    
    describe("when Dispatching", function() {
      var dispatchConfig = {controller: 'someController', action: 'new'};

      it("should assign dispatchConfig to os.params", function() {
        os.dispatch(dispatchConfig);
        expect(os.params).to(equal, dispatchConfig);
      });
      
      it("should use index as the default action", function() {
        os.dispatch({controller: 'someController'});
        expect(os.params).to(equal, {controller: 'someController', action: 'index'});
      });
      
      it("should attempt to find the correct controller", function() {
        var controllerName = "";
        
        var correctResponse = os.getController('index');
        os.getController = function(conName) {
          controllerName = conName;
          return correctResponse;
        };
        
        os.dispatch({controller: 'index'});
        expect(controllerName).to(equal, "index");
      });
      
      it("should fire the correct action", function() {
        var fired = false;
        
        os.getController('index').registerAction('test', function() {
          fired = true;
        });
        
        os.dispatch({controller: 'index', action: 'test'});
        expect(fired).to(equal, true);
      });
    });
  });
});
