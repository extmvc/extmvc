/**
 * @class ExtMVC.test.TestClient
 * @extends Ext.util.Observable
 * Simple client which interacts with a test server, polling for new tests to run and posting results
 */
ExtMVC.test.TestClient = Ext.extend(Ext.util.Observable, {

  constructor: function(config) {
    config = config || {};
          
    Ext.applyIf(config, {
      /**
       * @property currentCallbackId
       * @type Number
       * The current callback number. This is incremented on every request, and allows for a unique
       */
      currentCallbackId: 1,
      
      /**
       * @property lastChangesReceived
       * @type Date
       * Time the last changes array was received from the server
       */
      lastChangesReceived: new Date()
    });
    
    Ext.apply(this, config);
    
    ExtMVC.test.TestClient.superclass.constructor.apply(this, arguments);
    
    this.initEvents();
    this.initListeners();
    
    /**
     * @property runner
     * @type ExtMVC.test.TestRunner
     * The test runner instance used to actually run the tests
     */
    this.runner = new ExtMVC.test.TestRunner();
    this.runner.on('finished', this.postResults, this);
    
    this.loadTestFiles();
    
    Ext.TaskMgr.start({
      interval: 1000,
      scope   : this,
      run     : function() {
        this.jsonpRequest("http://192.168.3.2:5000/changes", {
          since: Math.floor(this.lastChangesReceived.getTime() / 1000)
        }, this.onChangePoll);
      }
    });
  },
  
  /**
   * Sets up events emitted by TestClient
   */
  initEvents: function() {
    this.addEvents(
      /**
       * @event results-posted
       * Fires when results have been successfully sent to the test server
       * @param {Object} stats The stats object that was sent
       */
      'results-posted',
      
      /**
       * @event changes-received
       * Fires when the server has notified this client that files have changed and the appropriate
       * suites must be run again
       * @param {Array} changes The files that have changed
       */
      'changes-received'
    );
  },
  
  /**
   * Sets up internal listeners
   */
  initListeners: function() {
    this.on('changes-received', this.onChangesReceived, this);
  },
  
  /**
   * Retrieves the array of all test files from the server, then tells JSpec to run them
   * @param {Boolean} autoRun True to run test files as soon as they are loaded (defaults to true)
   */
  loadTestFiles: function() {
    this.jsonpRequest('http://192.168.3.2:5000/all_test_files', {}, function(response) {
      this.runner.addTests(response.files);
      this.runner.runTests();
    });
  },
  
  /**
   * Posts results back to the server
   * @param {Object} stats Stats object
   */
  postResults: function(stats) {
    this.jsonpRequest('http://192.168.3.2:5000/results', stats, function() {
      this.fireEvent('results-posted', stats);
      
      var runner = this.runner;
      
      if (stats.failures == 0 && runner.hasRecentFailures && !runner.fullRun) {
        console.log('running full suite after failures');
        // runner.runTests();
      };
    });
  },
  
  /**
   * Called after the client has polled the server for changes. Fires the 'changes-received' event if any files have changed
   * @param {Object} response The server response, should include a 'changes' property with an array of changes
   */
  onChangePoll: function(response) {
    var changes = response.files;
    
    if (Ext.isArray(changes) && changes.length > 0) {
      this.fireEvent('changes-received', changes);
    };
  },
  
  /**
   * Called when the server has indicated that app or spec files have been modified.
   * Runs the test suite again.
   * @param {Array} changes The array of changed file names
   */
  onChangesReceived: function(changes) {
    this.lastChangesReceived = new Date();
    this.runner.runTests(changes);
  },
  
  jsonpRequest: function(url, params, callback, scope) {
    scope = scope || this;
    
    var head = document.getElementsByTagName("head")[0];
    
    var callbackName = "stProxyCallback" + this.currentCallbackId;
    this.currentCallbackId += 1;
    
    window[callbackName] = function() {
      callback.apply(scope, arguments);
    };
    
    var urlParams = ["callback=" + callbackName];
    
    Ext.iterate(params, function(key, value) {
      urlParams.push(String.format("{0}={1}", key, value));
    }, this);
    
    url = String.format("{0}?{1}", url, urlParams.join("&"));
    
    head.appendChild(
      this.buildScriptTag(url)
    );
  },
  
  
  buildScriptTag: function(filename, callback) {
    callback = callback || Ext.emptyFn;
    
    var script = document.createElement('script');
    script.type = "text/javascript";
    script.src = filename;
    
    //IE has a different way of handling <script> loads, so we need to check for it here
    if (script.readyState) {
      script.onreadystatechange = function(){
        if (script.readyState == "loaded" || script.readyState == "complete") {
          script.onreadystatechange = null;
          callback();
        }
      };
    } else {
      script.onload = callback;
    }    
    
    return script;
  }
});