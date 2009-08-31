/**
 * @class ExtMVC.Environment
 * @extends Ext.util.Observable
 * Represents an application in which to load an application. This is used by the
 * environment files inside the public/config and public/config/environments directories
 * 
 */
ExtMVC.Environment = Ext.extend(Ext.util.Observable, {

  constructor: function(config) {
    config = config || {};
    
    Ext.apply(this, config, {
      //TODO: jsdoc these defaults
      pluginsDir  : '../vendor/plugins',
      libDir      : '../lib',
      configDir   : '../config',
      overridesDir: '../config/overrides',
      appDir      : '../app',
      vendor      : ['mvc'],
      mvcFilename : 'ext-mvc-all-min',
      config      : ['app/App', 'config/routes'],
      
      /**
       * @property stylesheets
       * @type Array
       * The stylesheets to load for this app (defaults to just ext-all)
       */
      stylesheets: ['ext-all']
    });
    
    ExtMVC.Environment.superclass.constructor.apply(this, arguments);
  },
  
  /**
   * Updates this environment by applying the updates argument to itself
   * @param {Object} updates Any updated values to apply to the Environment
   * @return {ExtMVC.Environment} The environment object
   */
  update: function(updates) {
    Ext.apply(this, updates);
  }
});