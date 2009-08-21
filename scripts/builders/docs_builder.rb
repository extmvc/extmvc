module ExtMVC
  class DocsBuilder < Builder
    def initialize(args)
      
    end
    
    
  end
end


# Builds documentation
def self.docs
  system("java -jar vendor/ext-doc/ext-doc.jar -p config/build.xml -o docs -t vendor/ext-doc/template/ext/template.xml -verbose")
  app_name = ExtMVC.settings['docs']['title'] rescue ExtMVC.environment["namespace"] || "Ext MVC"
  logo     = ExtMVC.settings['docs']['logo']  rescue "resources/extjs.gif"
  
  {:app_name => app_name, :logo => logo}.each_pair do |key, value|
    ExtMVC.gsub_file("docs/index.html", "<%= @#{key} %>", value)
    ExtMVC.gsub_file("docs/welcome.html", "<%= @#{key} %>", value)
  end
end

def self.docs_auto
  filename = 'myindex.html'
  command  = "ruby script/build docs"
  
  self.listen_to_file_and_run(filename, command, "Built Ext MVC app documentation")
end