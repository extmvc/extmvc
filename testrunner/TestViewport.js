/**
 * @class ExtMVC.test.TestViewport
 * @extends Ext.Viewport
 * Specialised Viewport which manages the running and reporting of tests
 */
ExtMVC.test.TestViewport = Ext.extend(Ext.Viewport, {

  constructor: function(config) {
    config = config || {};
    
    /**
     * @property header
     * @type Ext.Panel
     * Ext MVC test suite banner Panel
     */
    this.header = new Ext.Panel({
      html  : 'Ext MVC Application Test suite',
      region: 'north'
    });
    
    /**
     * @property statusText
     * @type Ext.Toolbar.TextItem
     * Displays the current status of the test suite in the bottom toolbar
     */
    this.statusText = new Ext.Toolbar.TextItem({
      text: "Ready"
    });
    
    /**
     * @property rerunButton
     * @type Ext.Button
     * Button attached to the toolbar which re-runs the whole suite
     */
    this.rerunButton = new Ext.Button({
      text    : 'Rerun all tests',
      iconCls : 'all',
      scope   : this,
      handler : function() {
        this.client.runner.runTests();
      }
    });
    
    /**
     * @property main
     * @type Ext.Panel
     * The main Ext.grid.GridPanel that shows results from browsers as they come in
     */
    this.main = new ExtMVC.test.TestGrid({
      region: 'center',
      tbar  : [this.rerunButton],
      bbar  : [this.statusText]
    });
          
    Ext.applyIf(config, {
      layout: 'border',
      items: [
        this.header,
        this.main
      ]
    });
    
    ExtMVC.test.TestViewport.superclass.constructor.call(this, config);
    
    this.initListeners();
  },
  
  /**
   * Initialises listeners on the Test Client
   */
  initListeners: function() {
    if (this.client != undefined) {
      //used in calculating run time
      var startTime;
      
      this.client.runner.on({
        scope: this,
        starting: function() {
          startTime = new Date();
          this.statusText.setText("Running specs");
        },
        finished: function(stats) {
          Ext.apply(stats, {
            time        : new Date() - startTime,
            failingSpecs: new ExtMVC.test.JSpecFormatter(JSpec, JSpec.options).getFailingSpecs()
          });
          
          this.main.store.loadData([stats], true);
          this.statusText.setText("Ready");
        }
      });
    }
  }
});