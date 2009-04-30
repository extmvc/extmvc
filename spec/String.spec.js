Screw.Unit(function() {
  describe("String Functions", function() {
    it('should capitalize a string', function() {
      expect("user".capitalize()).to(equal, "User");
    });
    
    it("should titleize a string", function() {
      expect("a test sentence".titleize()).to(equal, "A Test Sentence");
    });
    
    it("should camelize a string", function() {
      expect("an_underscored_string".camelize()).to(equal, "AnUnderscoredString");
    });
    
    it("should underscore a string", function() {
      expect("A string with whitespaces".underscore()).to(equal, "a_string_with_whitespaces");
    });
    
    it("should underscore a camelized string", function() {
      expect("ALongTableName".underscore()).to(equal, "a_long_table_name");
    });
    
    it("should delegate singularize to Inflector", function() {
      //stub
      var singularize_was_called = false;
      ExtMVC.Inflector.singularize = function() {
        singularize_was_called = true;
      };
      
      "users".singularize();
      expect(singularize_was_called).to(equal, true);
    });
    
    it("should delegate pluralize to Inflector", function() {
      //stub
      var pluralize_was_called = false;
      ExtMVC.Inflector.pluralize = function() {
        pluralize_was_called = true;
      };
      
      "users".pluralize();
      expect(pluralize_was_called).to(equal, true);
    });
    
    describe("toCurrency", function() {
      var amount = "1234567.89";
      
      it("should add commas as appropriate", function() {
        expect(amount.toCurrency("£")).to(equal, "£1,234,567.89");
      });
      
      it("should use dollars by default", function() {
        expect(amount.toCurrency()).to(equal, "$1,234,567.89");
      });
    });
    
    describe("escaping HTML", function() {
      var html = '<span>"fish & chips"</span>';
      var escaped = html.escapeHTML();
      
      it("should escape left angle brackets", function() {
        expect(escaped).to_not(match, /</);
      });
      
      it("should escape right angle brackets", function() {
        expect(escaped).to_not(match, />/);
      });
      
      it("should escape double-quotes", function() {
        expect(escaped).to_not(match, /\"/);
      });

      it("should escape ampersands", function() {
        expect(escaped).to(match, /(&[^a]|&[^a][^m]|&[^a][^m][^p]|&[^a][^m][^p][^;])/);
      });      
      
      it("should escape a string correctly", function() {
        expect(escaped).to(equal, "&lt;span&gt;&quot;fish &amp; chips&quot;&lt;/span&gt;");
      });
    });

  });
});