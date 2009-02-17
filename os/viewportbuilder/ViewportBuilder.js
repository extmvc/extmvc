ExtMVC.ViewportBuilder = function(config) {
  this.initialConfig = config;
};

ExtMVC.ViewportBuilder.prototype = {
  
  /**
   * Abstract function which should be overridden by your implementation
   * @param {ExtMVC.OS} os A reference to the OS.  Usually a builder would set 
   * os.viewport = new Ext.Viewport({...}) and return the os at the end of the function
   * @return {ExtMVC.OS} The operating system as passed in parameters after viewport is built
   */
  build: Ext.emptyFn
};