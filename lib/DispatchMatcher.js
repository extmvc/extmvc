/**
 * @class ExtMVC.lib.DispatchMatcher
 * @extends Object
 * Abstract base class for dispatch matchers. A Dispatch Matcher just takes the arguments that
 * are passed to an ExtMVC.lib.Dispatcher's dispatch method, and returns normalised arguments.
 * This allows the Dispatcher to accept numerous forms, such as:
 *   dispatch('controllerName', 'actionName', ['list', 'of', 'arguments'])
 *   dispatch({controller: 'controllerName', action: 'actionName', arguments: ['list', 'of', 'arguments']})
 *   dispatch("controller/action/123")
 */
ExtMVC.lib.DispatchMatcher = Ext.extend(Object, {

  constructor: function(config) {
    Ext.applyIf(this, config || {});
    
    ExtMVC.lib.DispatchMatcher.superclass.constructor.apply(this, arguments);
  },
  
  matches: function() {
    throw new Ext.Error("DispatchMatcher subclass must implement this method");
  },
  
  /**
   * Returns an object like the following:
   * {
   *   controller: 'someControllerName',
   *   action    : 'someActionName',
   *   arguments : ['some', 'list', 'of', 'arguments']
   * }
   */
  getDispatchConfig: function() {
    throw new Ext.Error("DispatchMatcher subclass must implement this method");
  }
});

/**
 * @class ExtMVC.lib.DefaultDispatchMatcher
 * @extends ExtMVC.lib.DispatchMatcher
 * Dispatch matcher that accepts arguments in the form (controller, action, [args])
 */
ExtMVC.lib.DefaultDispatchMatcher = Ext.extend(ExtMVC.lib.DispatchMatcher, {
  name: 'default',
  
  /**
   * Returns true if the supplied arguments look like ('controllerName', 'actionName', ['args'])
   */
  matches: function(controller, action, args) {
    return Ext.isString(controller) && Ext.isString(action) && Ext.isArray(args || []);
  },
  
  getDispatchConfig: function() {
    return {
      controller: arguments[0],
      action    : arguments[1],
      arguments : arguments[2] || []
    };
  }
});

/**
 * @class ExtMVC.lib.ObjectDispatchMatcher
 * @extends ExtMVC.lib.DispatchMatcher
 * Dispatch matcher that accepts arguments in the form ({controller: controller, action: action, arguments: [args]})
 */
ExtMVC.lib.ObjectDispatchMatcher = Ext.extend(ExtMVC.lib.DispatchMatcher, {
  name: 'object',
  
  /**
   * Returns true if the supplied arguments are parseable by this matcher
   * @return {Boolean} true if this matcher matches the supplied arguments
   */
  matches: function() {
    var obj = arguments[0];
    
    //set the default action to 'index', if not supplied
    Ext.applyIf(obj, {
      action: 'index'
    });
    
    return arguments.length == 1 && obj.controller != undefined && obj.action != undefined;
  },
  
  getDispatchConfig: function() {
    return arguments[0];
  }
});


/**
 * @class ExtMVC.lib.RouterDispatchManager
 * @extends ExtMVC.lib.DispatchMatcher
 * Dispatch matcher that uses a Router to match a given string and split it into suitable arguments
 */
ExtMVC.lib.RouterDispatchManager = Ext.extend(ExtMVC.lib.DispatchMatcher, {
  name: 'router'
  
  //TODO
});