/**
 * @class ExtMVC.UrlBuilder
 * Builds URLs...
 */
ExtMVC.UrlBuilder = function() {
  
};

ExtMVC.UrlBuilder.prototype = {
  
  /**
   * @property baseUrlNamespace
   * @type String
   * An optional url namespace to prepend to all urls (e.g. /admin).  Defaults to an empty string
   */
  baseUrlNamespace: '',
  
  /**
   * @property baseUrlFormat
   * @type String
   * An optional url extension to append to all urls (e.g. .json).  Defaults to an empty string
   */
  baseUrlFormat: '',
  
  /**
   * @property segmentJoiner
   * @type String
   * The string to join url segments on (defaults to '/')
   */
  segmentJoiner: '/',
  
  /**
   * Generates a url for the given object or function definition
   * @param {Mixed} obj The object to create a URL for
   * @return {String} The generated URL
   */
  urlFor: function() {
    var config  = {};
    var lastArg = Array.prototype.slice.call(arguments, arguments.length - 1)[0];
    
    //if the last argument is a config object
    if (typeof lastArg == 'object' && !lastArg.className) {
      //set some default url building options
      Ext.apply(config, lastArg, {
        format:       this.baseUrlFormat,
        urlNamespace: this.baseUrlNamespace
      });
      
      //use all but the last argument now
      var arguments = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
    };
    
    //set some default url building options
    Ext.applyIf(config, {
      format:       this.baseUrlFormat,
      urlNamespace: this.baseUrlNamespace
    });
    
    var segments = [config.urlNamespace];
    
    //iterate over valid arguments, appending each to segments
    for (var i=0; i < arguments.length; i++) {
      var arg = arguments[i];
      var res = [];
      
      switch(typeof arg) {
        case 'string':   res = [arg];                         break;
        case 'object':   res = this.segmentsForInstance(arg); break;
        case 'function': res = this.segmentsForClass(arg);    break;
      }
      
      for (var j=0; j < res.length; j++) {
        segments.push(res[j]);
      };
    };
    
    var url = segments.join(this.segmentJoiner);
    if (config.format) { url += "." + config.format; }
    
    return url;
  },
  
  /**
   * Returns an array of url segments for a model instance
   * @param {ExtMVC.model} instance A Model instance with at least its primary key value set
   * @return {Array} An array of segments for this url (e.g. ['users', '10'])
   */
  segmentsForInstance: function(instance) {
    return [instance.constructor.urlName, instance.data.id];
  },
  
  /**
   * Returns an array of url segments for a given class and optional primary key
   * @param {Function} cls The class to generate a url for
   * @param {String} id An optional ID to add to the segments
   * @return {Array} An array of segments for this class
   */
  segmentsForClass: function(cls, id) {
    var segs = [cls.urlName];
    if (id) { segs.push(id); }
    
    return segs;
  }
};

ExtMVC.UrlBuilder = new ExtMVC.UrlBuilder();