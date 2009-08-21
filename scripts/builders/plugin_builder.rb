module ExtMVC
  class PluginBuilder < Builder
    # returns an array of PluginBuilder instances based on input from the command line.
    # The sole argument should be an array, where the first element will usually be a plugin name, or 'all'
    def self.instances(args = [])
      name = args[0] || 'all'
      
      if name == 'all'
        self.all_plugin_names.collect {|name| ExtMVC::PluginBuilder.new(name)}
      else
        [ExtMVC::PluginBuilder.new(name)]
      end
    end
    
    attr_accessor :name
    
    def initialize(name)
      @name = name
    end
    
    def output_filename
      "#{directory_name}/#{name}-all.js"
    end
    
    def message
      "Built the #{name} plugin"
    end
    
    def description
      "The #{name} plugin (#{directory_name})"
    end
    
    def directory_name
      "#{ExtMVC::PluginBuilder.plugins_directory}/#{@name}"
    end
    
    # The plugins directory, relative to the directory the build command is run from
    def self.plugins_directory
      "vendor/plugins"
    end
    
    private
    
    #Gets the name of each plugin directory inside vendor/plugins and calls self.plugin with it
    def self.all_plugin_names
      Dir.entries(self.plugins_directory).select {|fileName| 
        File.directory?("#{self.plugins_directory}/#{fileName}") && (fileName =~ /^\./) != 0
      }
    end
  end
end