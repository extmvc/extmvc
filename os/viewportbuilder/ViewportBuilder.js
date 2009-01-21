Ext.ux.MVC.ViewportBuilder = function(config) {
  this.initialConfig = config;
};

Ext.ux.MVC.ViewportBuilder.prototype = {
  
  /**
   * Abstract function which should be overridden by your implementation
   * @param {Ext.ux.MVC.OS} os A reference to the OS.  Usually a builder would set 
   * os.viewport = new Ext.Viewport({...}) and return the os at the end of the function
   * @return {Ext.ux.MVC.OS} The operating system as passed in parameters after viewport is built
   */
  build: Ext.emptyFn
};