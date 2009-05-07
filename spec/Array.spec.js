Screw.Unit(function() {
  describe("Array extensions", function() {
    describe("toSentence", function() {
      var array = ['Adama', 'Tigh', 'Roslin'];
      
      it("should join an array using and by default", function() {
        expect(array.toSentence()).to(equal, "Adama, Tigh and Roslin");
      });
      
      it("should allow specification of a custom connector string", function() {
        expect(array.toSentence('or')).to(equal, "Adama, Tigh or Roslin");
      });
    });
  });
});
