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
end