Screw.Unit(function() {
  describe("The <%= @name %> class", function() {
    var <%= @inst_name %>;
    before(function() {
      <%= @inst_name %> = new <%= @namespace %>.models.<%= @name %>({
        //set fields for this model here
      });
    });
    
    //create your unit tests here
  });
});