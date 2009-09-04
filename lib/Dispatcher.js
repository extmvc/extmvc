/**
 * @class ExtMVC.lib.Dispatcher
 * @extends Ext.util.MixedCollection
 * Normalises dispatch info received by an application, finds and calls the relevant controller action
 * with any arguments supplied
 */
ExtMVC.lib.Dispatcher = Ext.extend(Ext.util.MixedCollection, {

  constructor: function(config) {
    ExtMVC.lib.Dispatcher.superclass.constructor.apply(this, arguments);
    
    Ext.apply(this, config || {}, {
      /**
       * @property matchers
       * @type Array
       * All registered Dispatch Matchers
       */
      matchers: [],
      
      /**
       * @cfg matcherOrder
       * @type Array
       * An array of strings that correspond to DispatchMatcher names. This defines the order
       * in which dispatch matchers will be called. Override if you wish to inject your own matchers
       * before the default ones. This is empty by default, and pushed to whenever a matcher is registered
       */
      matcherOrder: []
    });
    
    this.addEvents(
      /**
       * @event dispatch
       * Fires before the dispatcher dispatches a request. Return false to cancel
       * @param {Array} arguments The arguments receivd by the dispatcher
       * @param {ExtMVC.lib.DispatchMatcher} matcher The DispatchMatcher instance that will be used
       * @param {Object} dispatchConfig An object containing controller, action and arguments properties
       */
      'dispatch'
    );
    
    this.registerDefaultDispatchMatchers();
  },
  
  /**
   * Dispatches to a controller action. Takes numerous argument formats, such as:
    <pre>
      <ul>
        <li>dispatch('controllerName', 'actionName', ['list', 'of', 'arguments'])</li>
        <li>dispatch({controller: 'controllerName', action: 'actionName', arguments: ['list', 'of', 'arguments']})</li>
      </ul>
    </pre>
   * These are normalised, the controller found and the action called with the supplied arguments.
   */
  dispatch: function() {
    var matcher = this.getDispatchMatcher.apply(this, arguments),
        config  = matcher.getDispatchConfig.apply(matcher, arguments);

    //fire the 'dispatch' event, and then dispatch if no listeners return false
    if (this.fireEvent('dispatch', arguments, matcher, config) !== false) {
      var controller = ExtMVC.getController(config.controller);
      
      if (controller == undefined) {
        throw new Ext.Error(
          String.format("The controller you are trying to dispatch to ({0}) does not exist", config.controller)
        );
      }
      
      if (controller[config.action] == undefined) {
        throw new Ext.Error(
          String.format("The action {0} does not exist on the {1} controller", config.action, config.controller)
        );
      }
      
      //if controller and action both exist, dispatch now
      return controller[config.action].apply(controller, config.arguments);      
    }
  },

  /**
   * Registers a dispatch matcher for use with this dispatcher.
   * @param {ExtMVC.lib.DispatchMatcher} matcher The matcher to register
   */
  registerDispatchMatcher: function(matcher) {
    this.add(matcher);
    
    this.matcherOrder.push(matcher.name);
  },

  /**
   * Adds the default dispatch matchers. This is called automatically by the constructor
   */
  registerDefaultDispatchMatchers: function() {
    this.registerDispatchMatcher(new ExtMVC.lib.DefaultDispatchMatcher());
    this.registerDispatchMatcher(new ExtMVC.lib.ObjectDispatchMatcher());
  },
  
  /**
   * @private
   * Returns a DispatchMatcher object if any matchers match the supplied dispatch format
   */
  getDispatchMatcher: function() {
    var dispatchArgs = arguments,
        dispatchMatcher;
    
    Ext.each(this.matcherOrder, function(name) {
      var matcher = this.get(name);
      
      if (matcher.matches.apply(matcher, dispatchArgs)) {
        dispatchMatcher = matcher;
        
        //stops Ext.each
        return false;
      }
    }, this);
    
    if (dispatchMatcher == undefined) {
      throw new Ext.Error("Could not find a suitable Dispatch Matcher for the dispatch arguments provided", dispatchArgs);
    } else {
      return dispatchMatcher;
    }
  },
  
  /**
   * @private
   */
  getKey: function(item) {
    return item.name;
  }
});