module ExtMVC
  class AppBuilder < Builder
    def self.instances(args = [])
      [ExtMVC::AppBuilder.new]
    end
    
    def file_list
      # build to production environment
      environment = ExtMVC.mvc_production_environment
      
      return ExtMVC.application_files_for(environment)
    end
    
    def name
      "Ext MVC Application"
    end
    
    def message
      "Built #{name}"
    end
    
    def description
      "Your #{name}"
    end
    
    def output_filename
      "public/application-all.js"
    end
    
    def should_minify
      true
    end
    
  end
end