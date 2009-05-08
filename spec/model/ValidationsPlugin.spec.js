Screw.Unit(function() {
  describe("The Validations Plugin", function() {
    var ns = ExtMVC.Model.modelNamespace;
    
    delete ns.ValidatedModel;
    ExtMVC.Model.define("ValidatedModel", {
      fields: [
        {name: 'title', type: 'string'},
        {name: 'text',  type: 'string'},
        {name: 'price', type: 'number'}
      ],
      validatesPresenceOf:     ['title', 'text'],
      validatesNumericalityOf: 'price',
      validatesLengthOf:       {field: 'title', minimum: 5, maximum: 10}
    });
    
    var validations = ns.ValidatedModel.prototype.validations;
    
    it("should add a validations array to each model prototype", function() {
      expect(Ext.isArray(validations)).to(equal, true);
    });
    
    it("should populate the validations array with the correct validations", function() {
      expect(validations.length).to(equal, 4);
    });
    
    it("should create each validation with a reference to the parent model", function() {
      Ext.each(validations, function(validation) {
        expect(validation.ownerClass).to(equal, ns.ValidatedModel);
      }, this);
    });
    
    it("should add an errors object to each model instance", function() {
      //make sure it goes on the instance, not the prototype
      expect(typeof ns.ValidatedModel.prototype.errors == 'undefined').to(equal, true);
      
      var myInstance = new ns.ValidatedModel({});
      expect(myInstance.errors instanceof ExtMVC.Model.validation.Errors).to(equal, true);
    });
    
    describe("the isValid method", function() {
      /**
       * Not sure if this is the best place to test this code.  The isValid method is defined
       * in ExtMVC.Model.validation.Plugin and applied to Ext.data.Record's prototype.  As this
       * means each Model instance has it available, that's how it's being tested here...
       */
      var validInstance = new ns.ValidatedModel({
        title: 'Title',
        text:  'My Text',
        price: 9.99
      });
      
      it("should clear any existing errors", function() {
        //add a fake error to make sure it gets cleared
        validInstance.errors.add('title', 'fake error');
        expect(validInstance.errors.all).to_not(equal, {});
        
        validInstance.isValid();
        expect(validInstance.errors.all).to(equal, {});
      });
      
      it("should return true if there were no errors", function() {
        expect(validInstance.isValid()).to(equal, true);
      });
      
      describe("if there were any errors", function() {
        var invalidInstance = new ns.ValidatedModel({
          price: 'test'
        });
        
        it("should return false", function() {
          expect(invalidInstance.isValid()).to(equal, false);
        });
        
        it("should add the errors to the errors object", function() {
          invalidInstance.isValid();
          
          //we're expecting an error on title, text and price here
          Ext.each(['title', 'text', 'price'], function(field) {
            expect(invalidInstance.errors.forField(field).length).to(equal, 1);
          }, this);
        });
      });
    });
    
    describe("the buildValidation method", function() {
      var constructor = ExtMVC.Model.validation.ValidatesPresenceOf,
          validation  = ExtMVC.Model.validation.Plugin.buildValidation(constructor, 'somefield'),
          validation2 = ExtMVC.Model.validation.Plugin.buildValidation(constructor, {field: 'anotherfield', message: 'test'});
          
      it("should return an instance of the correct type", function() {
        expect(validation instanceof constructor).to(equal, true);
      });
      
      it("should assign the field correctly if passed as a string", function() {
        expect(validation.field).to(equal, 'somefield');
      });
      
      it("should assign the field correctly if passed inside a config object", function() {
        expect(validation2.field).to(equal, 'anotherfield');
      });
      
      it("should pass config options except field to the validation's constructor", function() {
        expect(validation2.message).to(equal, 'test');
      });
    });
  });
});
