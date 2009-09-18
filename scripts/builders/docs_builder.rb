module ExtMVC
  class DocsBuilder < Builder
    def self.instances(args = [])
      [ExtMVC::DocsBuilder.new]
    end
    
    def build
      system("java -jar vendor/ext-doc/ext-doc.jar -p config/build.xml -o docs -t vendor/ext-doc/template/ext/template.xml -verbose")
      app_name = ExtMVC.settings['docs']['title'] rescue ExtMVC.environment["namespace"] || "Ext MVC"
      logo     = ExtMVC.settings['docs']['logo']  rescue "resources/extjs.gif"

      {:app_name => app_name, :logo => logo}.each_pair do |key, value|
        ExtMVC.gsub_file("docs/index.html", "<%= @#{key} %>", value)
        ExtMVC.gsub_file("docs/welcome.html", "<%= @#{key} %>", value)
      end
    end
  end
end