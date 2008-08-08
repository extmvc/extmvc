/**
 * Class which handles requestexception events raised by Ext.Ajax
 */
Ext.ux.MVC.RequestExceptionHandler = function(config) {
  var config = config || {};
  Ext.applyIf(config, {
    showHandlerNotImplementedError: true
  });
  
  var exception_handlers = {};

  /**
   * Handle any request exception - delegate to specialised handler function
   */
  this.handleRequestException = function(connection, response, options) {
    if (handler = exception_handlers[response.status]) {
      //call the handler within the scope of the RequestExceptionHandler object
      handler.call(this, connection, response, options);
    } else {
      if (config.showHandlerNotImplementedError) {
        Ext.Msg.alert('Handler Not Implemented', "Something went wrong and the application couldn't decide what action to take.  Please report this to your developer");
      };
    };
  };
  
  /**
   * Allows addition of status code handlers at run tie
   */
  this.registerExceptionHandler = function(statusCode, handler) {
    exception_handlers[statusCode] = handler;
  };
  
  /**
   * Retrieves the current handler for the given status code
   */
  this.getExceptionHandler = function(statusCode) {
    return exception_handlers[statusCode];
  };
  
  /**
   * Default handler for 400 Bad Request status codes.  Don't call this directly, it is registered
   * using registerExceptionHandler(400, this._handle400).  Override with your own method if needed
   */
  this._handle400 = function(connection, response, options) {
    var errorMessage = this.fetchErrorMessage(response) || "The server could not understand how to process your request.";
    Ext.Msg.alert("Bad Request", errorMessage);
  };
  
  /**
   * Default handler for 401 Unauthorized status codes.  Don't call this directly, it is registered
   * using registerExceptionHandler(401, this._handle401).  Override with your own method if needed
   */
  this._handle401 = function(connection, response, options) {
    var errorMessage = this.fetchErrorMessage(response) || "You are not authorised to view that information";
    Ext.Msg.alert("Unauthorized", errorMessage);
  };
  
  /**
   * Default handler for 403 Forbidden status codes.  Don't call this directly, it is registered
   * using registerExceptionHandler(403, this._handle403).  Override with your own method if needed
   */
  this._handle403 = function(connection, response, options) {
    var errorMessage = this.fetchErrorMessage(response) || "You are not authorised to view that information";
    Ext.Msg.alert("Forbidden", errorMessage);
  };
  
  /**
   * Default handler for 404 Not Found status codes.  Don't call this directly, it is registered
   * using registerExceptionHandler(404, this._handle404).  Override with your own method if needed
   */
  this._handle404 = function(connection, response, options) {
    Ext.Msg.alert("Item Not Found", "The information you were looking for could not be found on the server");
  };
  
  /**
   * Default handler for 500 Server Error status codes.  Don't call this directly, it is registered
   * using registerExceptionHandler(500, this._handle500).  Override with your own method if needed
   */
  this._handle500 = function(connection, response, options) {
    Ext.Msg.alert("Server Error", "There was an error on the server - your request was not successfully carried out");
  };
  
  /**
   * Default handler for 502 Bad Gateway, 503 Service Unavailable and 504 Gateway Timeout status codes
   * Don't call this directly, it is registered using registerExceptionHandler(500, this._handle500).
   * Override with your own method if needed
   */
  this._handle50x = function(connection, response, options) {
    Ext.Msg.alert("Server could not be reached", "There was a problem trying to contact the server and your request could not be completed.  Please try again in a few moments.");
  };
  
  //register the default handlers
  this.registerExceptionHandler(400, this._handle400);
  this.registerExceptionHandler(401, this._handle401);
  this.registerExceptionHandler(403, this._handle403);
  this.registerExceptionHandler(404, this._handle404);
  this.registerExceptionHandler(500, this._handle500);
  this.registerExceptionHandler(502, this._handle50x);
  this.registerExceptionHandler(503, this._handle50x);
  this.registerExceptionHandler(504, this._handle50x);
  
  //catch all request exceptions and handle them
  Ext.Ajax.on('requestexception', this.handleRequestException, this);
};

Ext.ux.MVC.RequestExceptionHandler.prototype = {
  
  /**
   * Checks responseText for a property called error.  If that is not present,
   * look for .errors - if that is an array, join messages together with commas
   */
  fetchErrorMessage : function(response) {
    var text = this.evalResponseText(response);
    
    if (text.error) {
      return text.error;
    } else {
      if (text.errors) {
        if (typeof(text.errors) == 'string') {
          return text.errors;
        } else {
          return text.errors.join(", ");
        };
      };
    };
    
    //return null if none of the above errors could be found
    return null;
  },
  
  /**
   * Attempts to evaluate the response's responseText.  Returns the eval'd object or an empty object
   */
  evalResponseText: function(response) {
    try {
      return eval("(" + response.responseText + ")");
    } catch(e) {
      return {};
    };
  }
};