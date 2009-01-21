Ext.ux.MVC.ViewportBuilderManager = {
  viewportBuilders: {},
  
  /**
   * Function description
   * @param {String} name String name for this ViewportBuilder (e.g. 'desktop')
   * @param {Function} constructor A reference to the constructor of the ViewportBuilder
   * @return {String} Return value description
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