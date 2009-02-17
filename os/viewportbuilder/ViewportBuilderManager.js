/**
 * A simple manager for registering and retrieving named ViewportBuilders
 * @class ExtMVC.ViewportBuilderManager
 */
ExtMVC.ViewportBuilderManager = {
  
  /**
   * @property viewportBuilders
   * @type Object
   * Key/value pairs for registered viewport builders.  Private
   */
  viewportBuilders: {},
  
  /**
   * Registers a ViewportBuilder with the manager
   * @param {String} name String name for this ViewportBuilder (e.g. 'desktop')
   * @param {Function} constructor A reference to the constructor of the ViewportBuilder
   */
  register: function(name, constructor) {
    this.viewportBuilders[name] = constructor;
  },
  
  find: function(name, config) {
    var c = this.viewportBuilders[name];
    if (c) {
      return new c(config);
    };
  }
};