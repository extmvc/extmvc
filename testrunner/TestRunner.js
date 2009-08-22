/**
 * @class ExtMVC.test.TestRunner
 * @extends Ext.util.Observable
 * Wraps JSpec to provide normal Ext-style events
 */
ExtMVC.test.TestRunner = Ext.extend(Ext.util.Observable, {

  constructor: function(config) {
    ExtMVC.test.TestRunner.superclass.constructor.apply(this, arguments);
    
    Ext.apply(this, {
      /**
       * @property hasRecentFailures
       * @type Boolean
       * True if the last full suite run had failures
       */
      hasRecentFailures: false,
      
      /**
       * @property fullRun
       * @type Boolean
       * True if the last run was a full run (as opposed to only running a subset of suites)
       */
      fullRun: false
    });
    
    this.addEvents(
      /**
       * @event starting
       * Fires when the runner starts running specs
       */
      'starting',
      
      /**
       * @event finished
       * Fires when the runner has finished running a batch of tests
       * @param {Object} stats Test pass stats
       */
      'finished'
    );
    
    this.tests = [];
  },
  
  onJSpecFinish: function(options) {
    runner.fireEvent('finished', JSpec.stats);
    
    if (runner.fullRun == true) {
      runner.hasRecentFailures = JSpec.stats.failures > 0;
    }
  },
  
  /**
   * Adds an array of test suites
   * @param {Array} tests Array of urls to load test suites from
   */
  addTests: function(tests) {
    this.tests = this.tests.concat(tests);
  },
  
  /**
   * Executes an array of test files and fires the 'finished' event when complete
   * @param {Array} tests Optional array of test files to run (defaults to all tests)
   */
  runTests: function(tests) {
    //we're doing a full run if a test subset array was not passed in
    this.fullRun = !Ext.isArray(tests);
    
    tests = tests || this.tests;
    
    delete JSpec;
    var filename = "../vendor/jspec/lib/jspec.js",
        callback = function() {
          this.fireEvent('starting');
          
          JSpec.options.formatter = ExtMVC.test.JSpecFormatter;
          
          Ext.each(tests, function(test) {
            JSpec.exec(test);
          }, this);

          JSpec.include({
            utilities : {
              runner: this
            },
            reporting : this.onJSpecFinish
          });

          JSpec.run({ failuresOnly: false }).report();
        }.createDelegate(this);
    
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
    
    document.getElementsByTagName("head")[0].appendChild(script);
  }
});