describe('A Route', {
  before_each: function() {
    r = new ExtMVC.Route(':controller/:action/:id');
  },
  
  'should return whether or not it matches a given URL': function() {
    value_of(r.recognises('someroute')).should_be(false);
    value_of(r.recognises('c/a/id')).should_be(true);
  },
  
  "should have an array of all matching segments found in the matching string": function() {
    var obj = r.paramsInMatchString;
    value_of(obj).should_be([':controller', ':action', ':id']);
  },
  
  "should return false from matches_for when the route doesn't match" : function() {
    value_of(r.matchesFor('a')).should_be(false);
  },
  
  "should return the correct params hash from a matching url": function() {
    var obj = r.matchesFor('con/act/1');
    value_of(obj[":controller"]).should_be('con');
    value_of(obj[":action"]).should_be('act');
    value_of(obj[":id"]).should_be('1');
  },
  
  'return an object with all extra passed params' : function() {
    r = new ExtMVC.Route(':controller/:action/:id', {':some_key': 'some value'});
    obj = r.matchesFor('c/a/id');
    
    value_of(obj[':some_key']).should_be('some value');
  },
  
  'should convert mapping "regexes" into actual regexes useful for matching' : function() {
    expected = /^([a-zA-Z0-9\_,]+)\/([a-zA-Z0-9\_,]+)\/([a-zA-Z0-9\_,]+)$/;
    value_of(r.matcherRegex).should_be(expected);
  }
});