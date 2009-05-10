Screw.Unit(function() {
  describe("The REST adapter", function() {
    var ns = ExtMVC.Model.modelNamespace;
    
    var rest      = new ExtMVC.Model.plugin.adapter.RESTAdapter(),
        savedInst = new ns.User({title: 'Ed', id: 100}),
        newInst   = new ns.User({title: 'Nick'});
        
    describe("the instanceUrl method", function() {
      it("should return a url including the ID if the primary key is set", function() {
        expect(rest.instanceUrl(savedInst)).to(equal, '/users/100');
      });
      
      it("should return a generic url for this model if the primary key is not set", function() {
        expect(rest.instanceUrl(newInst)).to(equal, '/users');
      });
    });
  });
});
