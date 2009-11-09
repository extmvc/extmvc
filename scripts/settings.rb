require 'rubygems'
require 'json'
require 'yaml'

module ExtMVC

  # extracts settings from the config/settings.yml file
  def self.settings
    YAML.load_file('config/settings.yml')
  end
  
  # returns environment settings
  def self.environment
    settings['environment']
  end
  
  def self.show_settings
    puts environment.inspect
  end
  
  def self.application_files_for(environment)
    files = []
    
    [
      environment["plugins"].collect {|o| "vendor/plugins/#{o}/#{o}-all.js"},
      environment["overrides"].collect {|o| "config/overrides/#{o}.js"},
      environment["config"].collect {|o| "#{o}.js"},
      environment["models"].collect {|o| "app/models/#{o}.js"},
      environment["controllers"].collect {|o| "app/controllers/#{o}Controller.js"},
      environment["views"].collect {|o| o.collect {|dir, fileList| fileList.collect {|fileName| "app/views/#{dir}/#{fileName}.js"}.flatten}}.flatten
    ].each {|f| files.concat(f)}
    
    files
  end
  
  def self.css_files_for(environment)
    environment['stylesheets'].collect {|s| "public/stylesheets/#{s}.css"}
  end
  
  def self.mvc_development_environment
    environment = {}
    
    default     = JSON::Parser.new(File.read('public/config/environment.json')).parse()
    development = JSON::Parser.new(File.read('public/config/environments/development.json')).parse()
    
    environment.merge!(default)
    environment.merge!(development)
    
    environment
  end
  
  def self.mvc_production_environment
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
    
    default     = JSON::Parser.new(File.read('public/config/environment.json')).parse()
    production  = JSON::Parser.new(File.read('public/config/environments/production.json')).parse()
    
    environment.merge!(default)
    environment.merge!(production)
    
    environment
  end
end