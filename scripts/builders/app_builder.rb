require 'rubygems'
require 'json'
# require 'json/pure'


module ExtMVC
  class AppBuilder < Builder
    def self.instances(args = [])
      [ExtMVC::AppBuilder.new]
    end
    
    def file_list
      # build to production environment
      environment = {
        'pluginsDir'   => '../vendor/plugins',
        'libDir'       => '../lib',
        'configDir'    => '../config',
        'overridesDir' => '../config/overrides',
        'appDir'       => '../app',
        'vendor'       => ['mvc'],
        'mvcFilename'  => 'ext-mvc-all-min',
        'config'       => ['app/App', 'config/routes'],
        'stylesheets'  => ['ext-all']
      }
      
      default     = JSON::Parser.new(File.read('config/environment.json')).parse()
      production  = JSON::Parser.new(File.read('config/environments/production.json')).parse()
      
      environment.merge!(default)
      environment.merge!(production)
      
      files = []
      
      [
        environment["overrides"].collect {|o| "config/overrides/#{o}.js"},
        environment["config"].collect {|o| "#{o}.js"},
        environment["plugins"].collect {|o| "vendor/plugins/#{o}/#{o}-all.js"},
        environment["models"].collect {|o| "app/models/#{o}.js"},
        environment["controllers"].collect {|o| "app/controllers/#{o}Controller.js"},
        environment["views"].collect {|o| o.collect {|dir, fileList| fileList.collect {|fileName| "app/views/#{dir}/#{fileName}.js"}.flatten}}.flatten
      ].each {|f| files.concat(f)}
      
      files
    end
    
    def message
      "Built Ext MVC Application"
    end
    
    def output_filename
      "public/application-all.js"
    end
    
    def should_minify
      true
    end
    
  end
end

 
# Ext.iterate(env.views, function(dir, fileList) {
#   Ext.each(fileList, function(file) {
#     viewFiles.push(String.format("{0}/views/{1}/{2}.js", env.appDir, dir, file));
#   }, this);
# }, this);

    
    # Watches all files in a standard project and runs ruby script/build all whenever any of them change
    # Add any additional files or directories to watch as arguments, e.g.:
    # ruby script/build auto my/special/File.js my/other/directory/*.js
    def self.auto *args
      filename = 'index.html'
      command  = "ruby script/build all"
      
      self.listen_to_file_and_run(filename, command, "Built Ext MVC app")
    end
    
    # Builds the current app based on the files specified in the index.html file
    def self.app
      filename = (ARGV.shift || 'index.html').downcase
      
      self.app_js(filename)
      self.app_css(filename)
    end
    
    def self.app_js filename = 'index.html'
      self.concatenate_js(filename)
      self.minify_js(filename)
    end
    
    def self.app_css filename = 'index.html'
      self.concatenate_css(filename)
    end
    
    
    
    def concatenate_js filename = 'index.html'
      puts; puts "Concatenating Javascript files"
      
      self.concatenate_files(js_files_in_html(filename), "public/application-all.js")
    end
    
    def minify_js filename
      puts; puts "Minifying Javascript files"
      
      minify_file("public/application-all.js")
    end
    
    def concatenate_css filename
      puts; puts "Concatenating CSS files"
      
      concatenate_files(css_files_in_html(filename), "public/stylesheets/application-all.css")
    end