/**
 * @class ExtMVC.lib.Booter
 * @extends Ext.util.Observable
 * Boots an Ext MVC application by loading all application files and launching
 */
ExtMVC.lib.Booter = Ext.extend(Ext.util.Observable, {
  
  /**
   * @property defaultBootParams
   * @type Object
   * Contains default boot parameters (e.g. sets the default environment to 'production')
   */
  defaultBootParams: {
    environment: 'production'
  },

  constructor: function(config) {
    config = config || {};
    Ext.applyIf(config, this.parseLocationParams());
    Ext.apply(this, config, this.defaultBootParams);
    
    ExtMVC.lib.Booter.superclass.constructor.apply(this, arguments);
    
    this.initEvents();
    this.initListeners();
  },
  
  /**
   * The Booter loads some code asynchronously, so uses events to proceed the logic. This sets up
   * all of the internal event monitoring.
   */
  initListeners: function() {
    this.on('environment-loaded', this.loadApplicationFiles, this);
    
    this.on({
      scope                     : this,
      'environment-loaded'      : this.loadApplicationFiles,
      'application-files-loaded': this.launchApp,
      'boot-complete'           : this.onBootComplete
    });
  },
  
  /**
   * Sets up events emitted by this component
   */
  initEvents: function() {
    this.addEvents(
      /**
       * @event before-boot
       * Called just before boot starts. Use this as a hook to tie in any pre-boot logic
       * @param {ExtMVC.lib.Booter} this The Booter instance
       */
      'before-boot',
      
      /**
       * @event boot-complete
       * Fires when the entire boot sequence has been completed
       */
      'boot-complete',
      
      /**
       * @event environment-loaded
       * Fires when environment config data has been retrieved
       * @param {ExtMVC.Environment} environment the Ext.Environment object
       */
      'environment-loaded',
      
      /**
       * @event app-files-loaded
       * Fires when all application files (overrides, config, models, views and controllers) 
       * have been loaded and are available
       */
      'application-files-loaded',
      
      /**
       * @event application-launched
       * Fires after the application has been launched
       */
      'application-launched'
    );
  },
  
  boot: function() {
    this.fireEvent('before-boot');
    
    if (this.useLoadingMask) this.addLoadingMask();
    
    this.loadEnvironment();
  },
  
  /**
   * Called when the app has been fully booted. Override to provide you own logic (defaults to an empty function)
   */
  onBootComplete: function() {},
  
  /**
   * Loads up the current environment by loading config/environment.json, and the appropriate file from within
   * config/environments/ for the current environment (e.g. config/environments/production.json)
   */
  loadEnvironment: function() {
    Ext.Ajax.request({
      url    : 'config/environment.json',
      scope  : this,
      success: function(response, options) {
        var envName = this.environment;
        
        this.environment = new ExtMVC.Environment(Ext.decode(response.responseText));

        Ext.Ajax.request({
          url   : String.format("config/environments/{0}.json", envName),
          success: function(response, options) {
            this.environment.update(Ext.decode(response.responseText));
            
            this.fireEvent('environment-loaded', this.environment);
          },
          scope  : this
        });
      },
      failure: function() {
        Ext.Msg.alert(
          'Could not load environment',
          'The environment could not be found'
        );
      }
    });
  },
  
  /**
   * Loads all required application files, fires the 'app-files-loaded' event when done
   * @param {ExtMVC.Environment} environment The ExtMVC.Environment to gather file list from
   */
  loadApplicationFiles: function(env) {
    this.loadStylesheets(env);
    
    //if the 'scripts' property on the Environment is present then models, controllers, plugins etc are ignored
    if (Ext.isArray(env.scripts)) { //&& env.scripts.length > 0) {
      if (env.scripts.length == 0) {
        this.fireEvent('application-files-loaded');
      } else {
        this.loadFiles(env.scripts, false, function() {
          this.fireEvent('application-files-loaded');
        }, this);
      }
      
      return;
    }
    
    
    var order           = ['overrides', 'config', 'plugins', 'models', 'controllers', 'views'],
        baseFiles       = [],
        pluginFiles     = [],
        modelFiles      = [],
        controllerFiles = [],
        viewFiles       = [];
    
    // var groups = {
    //   'base': {preserveOrder: false, }
    // };
    

    Ext.each(env.config, function(file) {
      baseFiles.push(String.format("../{0}.js", file));
    }, this);
    
    Ext.each(env.plugins, function(file) {
      pluginFiles.push(String.format("{0}/{1}/{2}-all.js", env.pluginsDir, file, file));
    }, this);
    
    Ext.each(env.overrides, function(file) {
      pluginFiles.push(String.format("{0}/{1}.js", env.overridesDir, file));
    }, this);
    
    Ext.each(env.models, function(file) {
      modelFiles.push(String.format("{0}/models/{1}.js", env.appDir, file));
    }, this);
    
    Ext.each(env.controllers, function(file) {
      controllerFiles.push(String.format("{0}/controllers/{1}Controller.js", env.appDir, file));
    }, this);
    
    Ext.each(env.views, function(viewObj) {
      Ext.iterate(viewObj, function(dir, fileList) {
        Ext.each(fileList, function(file) {
          viewFiles.push(String.format("{0}/views/{1}/{2}.js", env.appDir, dir, file));
        }, this);
      }, this);
    }, this);
    
    var me = this;
    var doFireEvent = function() {
      me.fireEvent('application-files-loaded');
    };
    
    this.loadFiles(baseFiles, false, function() {
      this.loadFiles(pluginFiles, false, function() {
        this.loadFiles(modelFiles, false, function() {
          this.loadFiles(controllerFiles, true, function() {
            this.loadFiles(viewFiles, true, function() {
              doFireEvent();
            });
          });
        });
      });
    });
  },
  
  /**
   * Once all application files are loaded, this launches the application, hides the loading mask, fires the
   * 'application-launched' event
   */
  launchApp: function() {
    ExtMVC.app.onReady();
    
    if (this.useLoadingMask) this.removeLoadingMask();
    
    this.fireEvent('application-launched');
    this.fireEvent('boot-complete');
  },
  
  /**
   * @property useLoadingMask
   * @type Boolean
   * True to automatically add an application loading mask layer to give the user loading feedback (defaults to false)
   */
  useLoadingMask: false,
  
  /**
   * Adds loading mask HTML elements to the page (called at start of bootup)
   */
  addLoadingMask: function() {
    var body = Ext.getBody();
    
    body.createChild({
      id: 'loading-mask'
    });
    
    body.createChild({
      id: 'loading',
      cn: [{
        cls: 'loading-indicator',
        html: this.getLoadingMaskMessage()
      }]
    });
  },
  
  /**
   * Returns the loading mask message string. Override this to provide your own
   * @return {String} The message to place inside the loading mask (defaults to "Loading...")
   */
  getLoadingMaskMessage: function() {
    return "Loading...";
  },
  
  /**
   * @property loadingMaskFadeDelay
   * @type Number
   * Number of milliseconds after app launch is called before the loading mask will fade away.
   * Gives your app a little time to draw its UI (defaults to 250)
   */
  loadingMaskFadeDelay: 250,
  
  /**
   * Fades out the loading mask (called after bootup is complete)
   */
  removeLoadingMask: function() {
    (function(){  
      Ext.get('loading').remove();  
      Ext.get('loading-mask').fadeOut({remove:true});  
    }).defer(this.loadingMaskFadeDelay);
  },
  
  /**
   * @private
   * Inspects document.location and returns an object containing all of the url params
   * @return {Object} The url params
   */
  parseLocationParams: function() {
    var args   = window.location.search.split("?")[1],
        params = {};
    
    /**
     * Read config data from url parameters
     */
    if (args != undefined) {
      Ext.each(args.split("&"), function(arg) {
        var splits = arg.split("="),
            key    = splits[0],
            value  = splits[1];

        params[key] = value;
      }, this);
    }
    
    return params;
  },
  
  /**
   * Inserts <link> tags to load stylesheets contained in the environment
   * @param {ExtMVC.lib.Environment} env The environment to load stylesheets from
   */
  loadStylesheets: function(env) {
    var body = Ext.getBody();
    Ext.each(env.stylesheets, function(filename) {
      body.createChild({
        tag : 'link',
        rel : 'stylesheet',
        type: 'text/css',
        href: String.format("stylesheets/{0}.css", filename)
      });
    }, this);
  },
  
  /**
   * Creates and returns a script tag, but does not place it into the document. If a callback function
   * is passed, this is called when the script has been loaded
   * @param {String} filename The name of the file to create a script tag for
   * @param {Function} callback Optional callback, which is called when the script has been loaded
   * @return {Element} The new script ta
   */
  buildScriptTag: function(filename, callback) {
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
  },
  
  /**
   * Loads a given set of application .js files. Calls the callback function when all files have been loaded
   * Set preserveOrder to true to ensure non-parallel loading of files, if load ordering is important
   * @param {Array} fileList Array of all files to load
   * @param {Boolean} preserveOrder True to make files load in serial, one after the other (defaults to false)
   * @param {Function} callback Callback to call after all files have been loaded
   * @param {Object} scope The scope to call the callback in
   */
  loadFiles: function(fileList, preserveOrder, callback, scope) {
    var scope       = scope || this,
        head        = document.getElementsByTagName("head")[0],
        fragment    = document.createDocumentFragment(),
        numFiles    = fileList.length,
        loadedFiles = 0,
        me          = this;
    
    if (fileList.length == 0) {
      callback.call(scope);
      return;
    }
    
    /**
     * Loads a particular file from the fileList by index. This is used when preserving order
     */
    var loadFileIndex = function(index) {
      head.appendChild(
        me.buildScriptTag(fileList[index], onFileLoaded)
      );
    };

    /**
     * Callback function which is called after each file has been loaded. This calls the callback
     * passed to loadFiles once the final file in the fileList has been loaded
     */
    var onFileLoaded = function() {
      loadedFiles ++;

      //if this was the last file, call the callback, otherwise load the next file
      if (numFiles == loadedFiles && Ext.isFunction(callback)) {
        callback.call(scope);
      } else {
        if (preserveOrder === true) loadFileIndex(loadedFiles);
      }
    };
    
    if (preserveOrder === true) {
      loadFileIndex.call(this, 0);
    } else {
      //load each file (most browsers will do this in parallel)
      Ext.each(fileList, function(file, index) {
        fragment.appendChild(
          this.buildScriptTag(file, onFileLoaded)
        );  
      }, this);

      head.appendChild(fragment);
    }
  }
});

Ext.onReady(function() {
  ExtMVC.booter = new ExtMVC.lib.Booter();

  ExtMVC.booter.boot();
});