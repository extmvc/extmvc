/**
 * @class ExtMVC
 * ExtMVC 
 * @singleton
 */
ExtMVC = Ext.extend(Ext.util.Observable, {
  version: "0.6b1",
  
  constructor: function() {
    ExtMVC.superclass.constructor.apply(this, arguments);
    
    this.addEvents(
      /**
       * @event environment-changed
       * Fired whenever the environment is changed
       * @param {String} name The name of the new environment
       * @param {Object} config The configuration of the new environment
       */
      'environment-changed'
    );
    
    /**
     * Set up aliases
     */
    this.getEnvSettings = this.getCurrentEnvironmentSettings;
  },
  
  /**
   * Sets up Ext MVC with application-specific configuration. Internally, this creates a new
   * Ext.App instance and assigns it to the 'name' property inside the config object you pass in.
   * If not present, this defaults to 'MyApp'.  The config object is passed straight into ExtMVC.App's
   * constructor, so any of ExtMVC.App's configuration options can be set this way. Sample usage:
   * ExtMVC.setup({
   *   name: 'MyApp',
   *   usesHistory: true
   * });
   * This sets up an ExtMVC.App instance in the global variable MyApp, which is
   * the only global variable your application should need.
   * It automatically sets up namespaces for models, views and controllers, e.g.:
   * MyApp.models, MyApp.views, MyApp.controllers
   *
   * @param {Object} config Application configuration
   */
  setup: function(config) {
    this.app = new ExtMVC.App(config);
    this.name = this.app.name;
  },
  
  /**
   * @property bootParams
   * @type Object
   * An object which contains all boot parameters. These are used during the boot phase,
   * and can be set using GET params after the '?' in the url
   */
  bootParams: {
    environment: 'production'
  },
  
  /**
   * @property globalEnvironmentSettings
   * @type Object
   * All default environment settings that will be Ext.applyIf'd to the current environment.
   * These are things that don't tend to change between applications, but you can override them if you need to
   */
  globalEnvironmentSettings: {
    pluginsDir  : '../vendor/plugins',
    libDir      : '../lib',
    configDir   : '../config',
    overridesDir: '../config/overrides',
    appDir      : '../app',
    vendor      : ['mvc'],
    mvcFilename : 'ext-mvc-all-min',
    config      : ['initialize', 'database', 'routes']
  },
  
  /**
   * Boots up the application.
   * TODO: When it works, document this :)
   */
  boot: function() {
    var args = window.location.href.split("?")[1];
    
    /**
     * Read config data from url parameters
     */
    if (args != undefined) {
      Ext.each(args.split("&"), function(arg) {
        var splits = arg.split("="),
            key    = splits[0],
            value  = splits[1];

        this.bootParams[key] = value;
      }, this);
    }
    
    
    //load up the environment
    Ext.Ajax.request({
      url: '../config/environment.json',
      scope  : this,
      success: function(response, options) {
        var envName = this.bootParams.environment;

        this.addEnvironmentSettings(envName, this.globalEnvironmentSettings);        
        this.addSettingsFromEnvironmentFile(response);
        this.setCurrentEnvironment(envName);

        Ext.Ajax.request({
          url   : String.format("../config/environments/{0}.json", envName),
          success: function(response, options) {
            this.addSettingsFromEnvironmentFile(response);
            
            this.onEnvironmentLoaded(this.getCurrentEnvironmentSettings());
          },
          scope  : this
        });
      },
      failure: function() {
        Ext.Msg.alert(
          'Could not load environment',
          'The ' + config.environment  + ' environment could not be found'
        );
      }
    });
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
    
    script.onload = callback;
    
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
        loadedFiles = 0;
      
    /**
     * Loads a particular file from the fileList by index. This is used when preserving order
     */
    var loadFileIndex = function(index) {
      head.appendChild(
        ExtMVC.buildScriptTag(fileList[index], onFileLoaded, scope)
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
      loadFileIndex(0);
    } else {
      //load each file (most browsers will do this in parallel)
      Ext.each(fileList, function(file, index) {
        fragment.appendChild(
          ExtMVC.buildScriptTag(file, onFileLoaded)
        );  
      }, this);

      head.appendChild(fragment);
    }
  },
  
  /**
   * Called when the environment files have been loaded and application load can begin
   * @param {Object} environment The current environment object
   */
  onEnvironmentLoaded: function(env) {
    var order           = ['overrides', 'config', 'plugins', 'models', 'controllers', 'views'],
        baseFiles       = [],
        pluginFiles     = [],
        modelFiles      = [],
        controllerFiles = [],
        viewFiles       = [];
    
    var loadFiles = function(fileList, onLoadFn, scope) {
      var fragment    = document.createDocumentFragment(),
          numFiles    = fileList.length,
          loadedFiles = 0;
      
      Ext.each(fileList, function(file, index) {
        var script = document.createElement('script');
        script.type = "text/javascript";
        script.src = file;
        
        script.onload = function() {
          loadedFiles ++;
          
          // console.log(loadedFiles + " of " + numFiles);
          if (numFiles == loadedFiles && Ext.isFunction(onLoadFn)) {
            onLoadFn.call(scope || this);
          }
        };
        
        fragment.appendChild(script);  
      }, this);
      
      document.getElementsByTagName("head")[0].appendChild(fragment);
    };
    
    var loadFilesInOrder = function(fileList, onLoadFn, scope) {
      if (Ext.isSafari) {
        var numFiles    = fileList.length,
            loadedFiles = 0;
        
        var loadFileIndex = function(index) {
          loadFiles([fileList[index]], onFileLoaded);
        };
        
        var onFileLoaded = function(response) {
          loadedFiles ++;
          
          // console.log(loadedFiles + " !!of " + numFiles);
          if (numFiles == loadedFiles && Ext.isFunction(onLoadFn)) {
            onLoadFn.call(scope || this);
          } else {
            loadFileIndex(loadedFiles);
          }
        };
        
        loadFileIndex(0);
        
      } else {
        loadFiles.apply(this, arguments);
      }
    };
    
    Ext.each(env.overrides, function(file) {
      baseFiles.push(String.format("{0}/{1}.js", env.overridesDir, file));
    }, this);
    
    Ext.each(env.config, function(file) {
      baseFiles.push(String.format("{0}/{1}.js", env.configDir, file));
    }, this);
    
    Ext.each(env.plugins, function(file) {
      pluginFiles.push(String.format("{0}/{1}/{2}-all.js", env.pluginsDir, file, file));
    }, this);
    
    Ext.each(env.models, function(file) {
      modelFiles.push(String.format("{0}/models/{1}.js", env.appDir, file));
    }, this);
    
    Ext.each(env.controllers, function(file) {
      controllerFiles.push(String.format("{0}/controllers/{1}Controller.js", env.appDir, file));
    }, this);
    
    Ext.iterate(env.views, function(dir, fileList) {
      Ext.each(fileList, function(file) {
        viewFiles.push(String.format("{0}/views/{1}/{2}.js", env.appDir, dir, file));
      }, this);
    }, this);
    
    this.loadFiles(baseFiles, false, function() {
      this.loadFiles(pluginFiles, false, function() {
        this.loadFiles(modelFiles, false, function() {
          this.loadFiles(controllerFiles, true, function() {
            this.loadFiles(viewFiles, true, function() {
              // console.log(Ext.app);
              // console.log(Ext.isReady);
              // 
              // console.log(GetIt);
              // console.log(GetIt.models);
              // console.log(GetIt.controllers);
              // console.log(GetIt.views);
              // 
              // console.log(ExtMVC.app);
              ExtMVC.app.onReady();
            });
          });
        });
      });
    });
  },

  
  /**
   * @private
   * Takes the response of an AJAX request, encodes it into a JSON object and adds to the current environment
   */
  addSettingsFromEnvironmentFile: function(response) {
    var envJSON = Ext.decode(response.responseText);
    this.addEnvironmentSettings(this.bootParams.environment, envJSON);
  },
  
  /**
   * @property controllers
   * When this.registerController('application', MyApp.ApplicationController) is called,
   * the ApplicationController class is registered here under the 'application' key.
   * When this.getController('application') is called, it checks here to see if the 
   * controller has been instantiated yet.  If it has, it is returned.  If not it is
   * instantiated, then returned.
   */
  controllers: {},
  
  /**
   * Registers a controller for use with this OS.  The controller is instantiated lazily
   * when needed, through the use of this.getController('MyController')
   * @param {String} controllerName A string name for this controller, used as a key to reference this controller with this.getController
   * @param {Function} controllerClass A reference to the controller class, which is later instantiated lazily
   */
  registerController: function(controllerName, controllerClass) {
    this.controllers[controllerName] = controllerClass;
  },

  /**
   * Returns a controller instance for the given controller name.
   * Instantiates the controller first if it has not yet been instantiated.
   * @param {String} controllerName The registered name of the controller to get
   * @return {Object} The controller instance, or null if not found
   */
  getController: function(controllerName) {
    var c = this.controllers[controllerName];
    if (c) {
      //instantiate the controller first, if required
      if (typeof c === 'function') {
        this.controllers[controllerName] = new this.controllers[controllerName]();
      }
      return this.controllers[controllerName];
    } else {
      return null;
    }
  },
  
  /**
   * @property currentEnvironment
   * @type String
   * The current code environment (defaults to production).  Read-only - use setCurrentEnvironment to change
   */
  currentEnvironment: 'production',
  
  /**
   * Used internally to manage environment variables... user addEnvironmentSettings and 
   * getEnvironmentSettings to change
   */
  environments: {'production': {}},
  
  /**
   * Sets the MVC environment to the specified name.  Usually one of 'production' or 'development'
   * Ignored if the environment has not yet been defined
   * @param {String} name The name of the environment to set.
   */
  setCurrentEnvironment: function(name) {
    if (this.getEnvironmentSettings(name)) {
      this.currentEnvironment = name;
      this.fireEvent('environment-changed', name, this.getEnvironmentSettings(name));
    }
  },
  
  /**
   * Returns the name of the current environment
   * @return {String} The name of the current environment
   */
  getCurrentEnvironment: function() {
    return ExtMVC.currentEnvironment;
  },
  
  /**
   * Returns settings for the current environment (aliased as getEnvSettings)
   * @return {Object} The settings for the current environment
   */
  getCurrentEnvironmentSettings: function() {
    return this.getEnvironmentSettings(this.getCurrentEnvironment());
  },
  
  /**
   * Adds settings for a given environment name
   * @param {String} name The name of the environment to add settings for
   * @param {Object} config The settings object to apply to this environment
   */
  addEnvironmentSettings: function(name, config) {
    ExtMVC.environments[name] = ExtMVC.environments[name] || {};
    Ext.apply(ExtMVC.environments[name], config);
  },
  
  /**
   * Retrieves all settings for a given environment (defaults to the current environment)
   * @param {String} name The name of the environment to get settings from
   * @return {Object} The settings object for the given environment, or null if not found
   */
  getEnvironmentSettings: function(name) {
    name = name || ExtMVC.environment;
    return ExtMVC.environments[name];
  }
});

ExtMVC = new ExtMVC();

Ext.ns('ExtMVC.router', 'ExtMVC.plugin', 'ExtMVC.controller', 'ExtMVC.view', 'ExtMVC.view.scaffold', 'ExtMVC.lib');