/**
 * @class ExtMVC.test.JSpecFormatter
 * @extends Object
 * A JSpec formatter which can be used to extract failure data from JSpec
 */
ExtMVC.test.JSpecFormatter = Ext.extend(Object, {

  constructor: function(results, options) {
    this.suites = results.suites;
  },
  
  /**
   * Returns an array of all failing Spec objects for all suites
   */
  getFailingSpecs: function(suites) {
    var suites = suites || this.suites;
    var failures = [];
    
    Ext.each(suites, function(suite) {
      failures = failures.concat(this.getFailuresForSuite(suite));
      
      if (suite.hasSuites()) {
        failures = failures.concat(this.getFailingSpecs(suite.suites));
      }
    }, this);
    
    return failures;
  },
  
  /**
   * Returns an array of failing Spec objects for a given suite
   */
  getFailuresForSuite: function(suite) {
    if (suite.ran && suite.passed()) {
      return [];
    } else {
      var failures = [];
      
      Ext.each(suite.specs, function(spec) {
        if (!spec.passed()) {
          Ext.apply(spec, {
            code: this.bodyContents(spec.body)
          });
          
          failures.push(spec);
        }
      }, this);
      
      return failures;
    }
  },
  
  bodyContents: function(body) {
    return JSpec.
      escape(JSpec.contentsOf(body)).
      replace(/^ */gm, function(a){ 
        return (new Array(Math.round(a.length / 3))).join(' ');
      }).
      replace("\n", '<br/>');
  }
});

// DOM : function(results, options) {
//   var id = option('reportToId') || 'jspec'
//   var report = document.getElementById(id)
//   var failuresOnly = option('failuresOnly')
//   var classes = results.stats.failures ? 'has-failures' : ''
//   if (!report) throw 'JSpec requires the element #' + id + ' to output its reports'
// 
//   var markup =
//   '<div id="jspec-report" class="' + classes + '"><div class="heading">           \
//   <span class="passes">Passes: <em>' + results.stats.passes + '</em></span>       \
//   <span class="failures">Failures: <em>' + results.stats.failures + '</em></span> \
//   </div><table class="suites">'
//   
//   bodyContents = function(body) {
//     return JSpec.
//       escape(JSpec.contentsOf(body)).
//       replace(/^ */gm, function(a){ return (new Array(Math.round(a.length / 3))).join(' ') }).
//       replace("\n", '<br/>')
//   }
//   
//   renderSuite = function(suite) {
//     var displaySuite = failuresOnly ? suite.ran && !suite.passed() : suite.ran
//     if (displaySuite && suite.hasSpecs()) {
//       markup += '<tr class="description"><td colspan="2">' + escape(suite.description) + '</td></tr>'
//       each(suite.specs, function(i, spec){
//         markup += '<tr class="' + (i % 2 ? 'odd' : 'even') + '">'
//         if (spec.requiresImplementation())
//           markup += '<td class="requires-implementation" colspan="2">' + escape(spec.description) + '</td>'
//         else if (spec.passed() && !failuresOnly)
//           markup += '<td class="pass">' + escape(spec.description)+ '</td><td>' + spec.assertionsGraph() + '</td>'
//         else if(!spec.passed())
//           markup += '<td class="fail">' + escape(spec.description) + ' <em>' + spec.failure().message + '</em>' + '</td><td>' + spec.assertionsGraph() + '</td>'
//         markup += '<tr class="body"><td colspan="2"><pre>' + bodyContents(spec.body) + '</pre></td></tr>'
//       })
//       markup += '</tr>'
//     }
//   }  
//   
//   renderSuites = function(suites) {
//     each(suites, function(suite){
//       renderSuite(suite)
//       if (suite.hasSuites()) renderSuites(suite.suites)
//     })
//   }
//   
//   renderSuites(results.suites)
//   markup += '</table></div>'
//   report.innerHTML = markup
// },