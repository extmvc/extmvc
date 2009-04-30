Screw.Unit(function() {
  describe("Model Validations", function() {
    //keep track of the object to which models are currently assigned
    var ns = ExtMVC.Model.modelNamespace;
    
    //define a new model with some validations
    ExtMVC.Model.define("ValidatedModel", {
      fields: [
        {name: 'title', type: 'string'},
        {name: 'text',  type: 'string'}
      ],
      
      validatesPresenceOf: ['title', 'text'],
      validatesLengthOf:   [{field: 'title', min: 5, max: 10}]
    });
    
    describe("A Validation Errors object", function() {
      var myModel = new ns.ValidatedModel({});
      var errors  = new ExtMVC.Model.ValidationErrors(myModel);
      
      it("should have a errors property", function() {
        expect(typeof errors.errors).to_not(equal, "undefined");
      });
      
      it("should return true for isValid() if there are no errors", function() {
        
      });
      
      it("should join errors into a readable form", function() {
        
      });
    });
  });
});
