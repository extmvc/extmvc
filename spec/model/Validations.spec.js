/**
 * Tests the validations framework and the built-in validations
 * 
 * var v = new ValidatedModel();
 * v.isValid(); //false
 * v.errors.all; // {title: ['must be present', 'is too short'], text: ['must be present']}
 * v.errors.forField('title'); // ['must be present', 'is too short']
 * v.errors.forField('title', true); // 'must be present and is too short'
 * v.errors.forForm(); //{'title': 'must be present and is too short', 'text': 'must be present'}
 */
Screw.Unit(function() {
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
  
  describe("Individual Validations", function() {
    ExtMVC.Model.define('SomeModel', {
      fields: [
        {name: 'title', type: 'string'},
        {name: 'text',  type: 'string'},
        {name: 'price', type: 'number'}
      ]
    });
    
    var myInstance = new ns.SomeModel({});
    var V = ExtMVC.Model.validation;
    
    describe("Validates Presence Of", function() {
      var v = new V.ValidatesPresenceOf(myInstance, 'title');
      
      it("should not be valid if not present", function() {
        expect(v.isValid()).to(equal, false);
      });
      
      it("should not be valid if an empty string", function() {
        myInstance.set('title', '');
        expect(v.isValid()).to(equal, false);
      });
      
      it("should be valid if any value is present", function() {
        myInstance.set('title', 'My Title');
        expect(v.isValid()).to(equal, true);
        
        myInstance.set('title', {'some': 'object'});
        expect(v.isValid()).to(equal, true);
      });
      
      it("should return a default message", function() {
        expect(v.message).to(equal, 'must be present');
      });
      
      it("should allow specification of a customised message", function() {
        var v = new V.ValidatesPresenceOf(myInstance, 'title', {message: 'My Message'});
        expect(v.message).to(equal, 'My Message');
      });
    });

    describe("Validates Numericality Of", function() {
      var v = new V.ValidatesNumericalityOf(myInstance, 'price');
      
      it("should pass if the field is a number", function() {
        myInstance.set('price', 9.99);
        expect(v.isValid()).to(equal, true);
      });
      
      it("should fail if the field is not a number", function() {
        myInstance.set('price', 'not a number!');
        expect(v.isValid()).to(equal, false);
        
        expect(v.message).to(equal, 'must be a number');
      });
    });

    describe("Validates Length Of", function() {
      var v = new ExtMVC.Model.validation.ValidatesLengthOf(myInstance, 'title', {minimum: 5, maximum: 9});
      
      it("should fail if the field is too short", function() {
        myInstance.set('title', 'a');
        expect(v.isValid()).to(equal, false);
        expect(v.message).to(equal, 'is too short');
      });
      
      it("should fail if the field is too long", function() {
        myInstance.set('title', 'a very long title');
        expect(v.isValid()).to(equal, false);
        expect(v.message).to(equal, 'is too long');
      });
      
      it("should pass if the field is an acceptable length", function() {
        //minimum
        myInstance.set('title', 'Adama');
        expect(v.isValid()).to(equal, true);
        
        //maximum
        myInstance.set('title', 'President');
        expect(v.isValid()).to(equal, true);
        
        //in between
        myInstance.set('title', 'Colonel');
        expect(v.isValid()).to(equal, true);
      });
    });
  });
  
  describe("A Validation Errors object", function() {
    var myModel = new ns.ValidatedModel();
    // var errors = new ExtMVC.Model.validation.Errors(myModel);
  });
  
  describe("Model Validations", function() {
    // describe("A Validation Errors object", function() {
    //   var myModel = new ns.ValidatedModel({});
    //   var errors  = new ExtMVC.Model.ValidationErrors(myModel);
    //   
    //   it("should have a errors property", function() {
    //     expect(typeof errors.errors).to_not(equal, "undefined");
    //   });
    //   
    //   it("should return true for isValid() if there are no errors", function() {
    //     
    //   });
    //   
    //   it("should join errors into a readable form", function() {
    //     
    //   });
    // });
  });
});
