var boo;
var boo2;
describe('The Router', {
  before_each : function() {
    map = new Ext.ux.MVC.Router({});
  },
  'converts mapping "regexes" into actual regexes useful for matching' : function() {
    expected = '^([a-zA-Z0-9\_]+)/([a-zA-Z0-9\_]+)$';
    value_of(map.convert_regex(':controller/:action')).should_be(expected);
  },
  'converts complex mapping "regexes" into actual regexes useful for matching' : function() {
    expected = '^namespace/([a-zA-Z0-9\_]+)/([a-zA-Z0-9\_]+)$';
    value_of(map.convert_regex('namespace/:controller/:action')).should_be(expected);
  },
  'splits route regexes into arrays of matched parameters' : function() {
    value_of(map.params_for(':controller/:action/:id')).should_be([':controller', ':action', ':id']);
  },
  'splits url into an array of ordered matches' : function() {
    map.connect(':controller/:action/:id');
    
    url = 'controller_name/action_name/1';
    matches = map.split(url);
    value_of(matches[0]).should_be('controller_name');
    value_of(matches[1]).should_be('action_name');
    value_of(matches[2]).should_be('1');
  },
  'splits more complex url into an array of ordered matches' : function() {
    map.connect('namespace/:controller/:action');
    
    url = 'namespace/c_name/a_name';
    matches = map.split(url);
    value_of(matches[0]).should_be('c_name');
    value_of(matches[1]).should_be('a_name');
  },
  'finds the first matching route for a given url' : function() {
    map.connect(':controller/:action');
    map.connect(':controller/:action/:id');
    
    value_of(map.matching_route_for('c/a')).should_be(":controller/:action");
    value_of(map.matching_route_for('c/a/1')).should_be(":controller/:action/:id");
  },
  'finds the first matching route for complex urls' : function() {
    map.connect('namespace/:controller/:action');
    map.connect(':controller/:action/:id');
    
    value_of(map.matching_route_for('namespace/c/a')).should_be("namespace/:controller/:action");
    value_of(map.matching_route_for('c/a/1')).should_be(":controller/:action/:id");
  },
  'routes actions for :controller/:action' : function() {
    map.connect(':controller/:action');
    obj = map.recognise('controller_name/action_name');
    
    value_of(obj[':controller']).should_be('controller_name');
    value_of(obj[':action']).should_be('action_name');  
  },
  'routes params for :controller/:action/:id' : function() {
    map.connect(':controller/:action/:id');
    obj = map.recognise('controller_name/action_name/1');
    
    value_of(obj[':controller']).should_be('controller_name');
    value_of(obj[':action']).should_be('action_name');
    value_of(obj[':id']).should_be('1');
  },
  'route params for more specific regexes' : function() {
    map.connect('namespace/:controller/:action');
    map.connect(':controller/:action/:id');
    obj = map.recognise('namespace/controller_name/action_name');
    
    value_of(obj[':controller']).should_be('controller_name');
    value_of(obj[':action']).should_be('action_name');
  }
});