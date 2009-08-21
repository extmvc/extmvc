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
    
    def name
      "Ext MVC"
    end
    
    def message
      "Built #{name}"
    end
    
    def description
      "The #{name} framework (#{directory_name})"
    end
  end
end