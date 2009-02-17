describe('The Router', {
  before_each : function() {
    map = new ExtMVC.Router({});
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
  
  //regression test to make sure underscore bug doesn't come back
  'routes params for :controller/:action/:underscored_id' : function() {
    map.connect(':controller/:action/:underscored_id');
    obj = map.recognise('controller_name/action_name/1');
    
    value_of(obj[':controller']).should_be('controller_name');
    value_of(obj[':action']).should_be('action_name');
    value_of(obj[':underscored_id']).should_be('1');
  },
  
  'routes params for :controller/:action/:id when there are multiple IDs' : function() {
    map.connect(':controller/:action/:id');
    obj = map.recognise('controller_name/action_name/1,2,3');
    
    value_of(obj[':controller']).should_be('controller_name');
    value_of(obj[':action']).should_be('action_name');
    value_of(obj[':id']).should_be('1,2,3');
  },
  
  'routes params for :controller/:action with other routes defined' : function() {
    map.connect(':controller/:action/:id');
    map.connect(':controller/:action');
    obj = map.recognise('controller_name/action_name');
    
    value_of(obj[':controller']).should_be('controller_name');
    value_of(obj[':action']).should_be('action_name');
  },
  
  'route params for more specific regexes' : function() {
    map.connect('namespace/:controller/:action');
    map.connect(':controller/:action/:id');
    obj = map.recognise('namespace/controller_name/action_name');
    
    value_of(obj[':controller']).should_be('controller_name');
    value_of(obj[':action']).should_be('action_name');
  }
});