module ExtMVC
  class CssBuilder < Builder
    def self.instances(args = [])
      [ExtMVC::CssBuilder.new]
    end
    
    def file_list
      # build to production environment
      environment = ExtMVC.mvc_development_environment
      
      return ExtMVC.css_files_for(environment)
    end
    
    def name
      "Ext MVC Application Stylesheets"
    end
    
    def message
      "Built #{name}"
    end
    
    def description
      "Your #{name}"
    end
    
    def output_filename
      "public/stylesheets/application-all.css"
    end
    
    def directory_name
      "public/stylesheets/"
    end
  end
end