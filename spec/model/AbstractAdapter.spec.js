Screw.Unit(function() {
  describe("The Abstract Adapter", function() {
    var ns = ExtMVC.Model.modelNamespace;
    
    describe("instance methods", function() {
      it("should add instance methods to Ext.data.Record's prototype", function() {
        var p = Ext.data.Record.prototype,
            i = ExtMVC.Model.plugin.adapter.instanceMethods;
        
        Ext.each(['save', 'destroy', 'update'], function(methodName) {
          expect(typeof p[methodName] == 'function').to(equal, true);
        }, this);
      });
      
      describe("the save method", function() {
        
      });
    });
    
    describe("class methods", function() {
      it("should add class methods to each model class", function() {
        Ext.each(['create', 'build', 'find', 'destroy'], function(methodName) {
          for (var model in ns) {
            expect(typeof ns[model][methodName] == 'function').to(equal, true);
          }
        }, this);
      });
    });
  });
});
