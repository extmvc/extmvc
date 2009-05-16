Screw.Unit(function() {
  describe("The Abstract Adapter", function() {
    var ns = ExtMVC.Model.modelNamespace;
    
    describe("instance methods", function() {
      it("should add instance methods to Ext.data.Record's prototype", function() {
        var p = Ext.data.Record.prototype;
        
        Ext.each(['save', 'destroy', 'update'], function(methodName) {
          expect(typeof p[methodName]).to(equal, 'function');
        }, this);
      });
      
      describe("the save method", function() {
        
      });
    });
    
    describe("class methods", function() {
      it("should add class methods to each model class", function() {
        Ext.each(['create', 'build', 'find', 'destroy'], function(methodName) {
          for (var model in ns) {
            expect(typeof ns[model][methodName]).to(equal, 'function');
          }
        }, this);
      });
    });
    
    describe("hasMany association methods", function() {
      it("should add the correct methods to the hasMany prototype", function() {
        var p = ExtMVC.Model.plugin.association.HasMany.prototype;
        
        Ext.each(['create', 'build', 'find', 'destroy'], function(methodName) {
          expect(typeof p[methodName]).to(equal, 'function');
        }, this);
      });
    });
    
    describe("belongsTo association methods", function() {
      it("should add the correct methods to the hasMany prototype", function() {
        var p = ExtMVC.Model.plugin.association.HasMany.prototype;
        
        Ext.each(['find', 'destroy'], function(methodName) {
          expect(typeof p[methodName]).to(equal, 'function');
        }, this);
      });
    });
  });
});
