Screw.Unit(function() {
  describe("A Validation Errors object", function() {
    var errors = new ExtMVC.Model.validation.Errors();
    
    before(function() {
      //make sure we clear out any errors between each test
      errors.clear();
    });
    
    it("should contain an object of all errors", function() {
      expect(errors.all).to(equal, {});
    });
    
    it("should clear current errors out", function() {
      //add some fake errors
      errors.all = {'title': ['must be present'], 'text': ['is too short']};
      
      errors.clear();
      expect(errors.all).to(equal, {});
    });
    
    describe("when retrieving errors by field name or for a form", function() {
      before(function() {
        errors.add('title', 'must be present');
        errors.add('title', 'is too short');
        errors.add('title', 'is quite boring');
        errors.add('text',  'is a hideous diatribe');
      });
      
      it("should allow retrieval of errors per field via the forField method", function() {
        expect(errors.forField('title')).to(equal, ['must be present', 'is too short', 'is quite boring']);
      });

      it("should return a human readable form for errors on a given field", function() {
        expect(errors.forField('title', true)).to(equal, 'must be present, is too short and is quite boring');
        expect(errors.forField('text', true)).to(equal, 'is a hideous diatribe');
      });
      
      it("should return the errors in a format suitable for displaying on a FormPanel", function() {
        var formErrors = {'title': 'must be present, is too short and is quite boring', 'text': 'is a hideous diatribe'};
        expect(errors.forForm()).to(equal, formErrors);
      });
    });
    
    it("should allow addition of new errors", function() {
      expect(errors.forField('title').length).to(equal, 0);
      
      errors.add('title', 'must be present');
      expect(errors.forField('title').length).to(equal, 1);
      
      errors.add('title', 'is too short');
      expect(errors.forField('title').length).to(equal, 2);
    });
    
    it("should be valid if there are no errors", function() {
      expect(errors.isValid()).to(equal, true);
    });
    
    it("should not be valid if there are errors present", function() {
      errors.add('title', 'has serious problems');
      expect(errors.isValid()).to(equal, false);
    });
  });
});