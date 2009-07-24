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
  
  def self.add_script
    filename = environment['homepage'] || 'index.html'
    
    doc = Hpricot(open(filename))
    
    doc.search("#ext-mvc-application-views").append "test"
    
    doc.search("#ext-mvc-application-views")
  end
end