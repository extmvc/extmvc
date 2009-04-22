Screw.Unit(function() {
  describe("ExtMVC", function() {
    describe("environments", function() {
      it("should default to the production environment", function() {
        expect(ExtMVC.getCurrentEnvironment()).to(equal, 'production');
      });
      
      it("should return current environment settings", function() {
        expect(ExtMVC.getCurrentEnvironmentSettings()).to(equal, {});
      });
      
      it("should allow retrieval of existing environment settings", function() {
        var prod = ExtMVC.getEnvironmentSettings('production');
        expect(prod).to(equal, {});
      });
      
      it("should allow specification of environment settings to an existing environment", function() {
        expect(ExtMVC.getEnvironmentSettings('production')).to(equal, {});
        
        ExtMVC.addEnvironmentSettings('production', {myKey: 'myValue'});
        expect(ExtMVC.getEnvironmentSettings('production').myKey).to(equal, 'myValue');
      });
      
      it("should allow specification of environment settings to a new environment", function() {
        var mySettings = {key: 'value'};
        expect(ExtMVC.getEnvironmentSettings('newEnv')).to(equal, null);
        
        ExtMVC.addEnvironmentSettings('newEnv', mySettings);
        expect(ExtMVC.getEnvironmentSettings('newEnv')).to(equal, mySettings);
      });
      
      describe("when changing environment", function() {
        it("should allow the current environment to be changed if the new environment is valid", function() {
          expect(ExtMVC.getCurrentEnvironment()).to(equal, 'production');

          //we need to add this environment first to make it valid
          ExtMVC.addEnvironmentSettings('development', {key: 'value'});

          ExtMVC.setCurrentEnvironment('development');
          expect(ExtMVC.getCurrentEnvironment()).to(equal, 'development');
        });

        it("should not allow the current environment to be changed if the new environment does not exist", function() {
          ExtMVC.setCurrentEnvironment('notReal');
          expect(ExtMVC.getCurrentEnvironment()).to_not(equal, 'notReal');
        });
        
        it("should fire an environment-changed event", function() {
          var newEnv = '', newConfig = {};
          var devSettings = {key: 'value'};
          
          //add another environment to be able to change to
          ExtMVC.addEnvironmentSettings('development', devSettings);
          
          ExtMVC.on('environment-changed', function(n, c) {newEnv = n; newConfig = c;}, this);
          
          ExtMVC.setCurrentEnvironment('development');
          
          expect(newEnv).to(equal, 'development');
          expect(newConfig).to(equal, devSettings);
        });
      });
    });
  });
});
