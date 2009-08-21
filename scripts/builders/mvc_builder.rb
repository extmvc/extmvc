module ExtMVC
  class MVCBuilder < Builder
    def self.instances(args = [])
      [ExtMVC::MVCBuilder.new]
    end
    
    def output_filename
      "#{directory_name}/ext-mvc-all.js"
    end
    
    def directory_name
      "vendor/mvc"
    end
    
    def should_minify
      true
    end
    
    def message
      "Built Ext MVC"
    end
    
    def description
      "The Ext MVC framework (#{directory_name})"
    end
  end
end