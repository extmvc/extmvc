require 'rubygems'
require 'hpricot'

module ExtMVC
  module Generator
    
    @@generators = %w(Model Controller Scaffold View)
    def self.dispatch
      generator = ARGV.shift.capitalize
      
      unless @@generators.include?(generator)
        raise ArgumentError.new("Must use one of the following: " + @@generators.join(", ").downcase)
      end
      
      case generator
        when "Model"
          name = ARGV.shift
          fields = ARGV.select {|arg| arg != "--force"}.collect {|f| f.split(":")}
          Model.new(name, fields).generate!
        when "Controller"
          name = ARGV.shift
          actions = ARGV.select {|arg| arg != "--force"}
          Controller.new(name, actions).generate!
        when "Scaffold"
          name = ARGV.shift
          fields = ARGV.select {|arg| arg != "--force"}.collect {|f| f.split(":")}
          Scaffold.new(name, fields).generate!
        when "View"
          package = ARGV.shift
          name    = ARGV.shift
          View.new(package, name).generate!
      end
    end
    
    class Base
      def initialize *args
        @gsubs ||= {}
        @gsubs['namespace']  = ExtMVC.environment['namespace']
      end
      
      protected
      def ensure_directories_present! *args
        args.each do |a|
          Dir.mkdir(a) unless File.exists?(a)
        end
      end
      
      def ensure_no_overwrite! *args
        args.each do |a|
          if File.exists?(a) && !ARGV.include?("--force")
            raise ArgumentError.new("File already exists: #{a}")
          end
        end
      end
      
      def template(template_filename, destination_filename)
        #write the file
        File.open(destination_filename, 'w') {|f| f.puts(render_template(template_filename))}
        
        puts "Created #{destination_filename}"
      end
      
      def render_template(template_filename, gsubs = @gsubs)
        #grab the template file text
        template_text = IO.read("vendor/mvc/scripts/templates/#{template_filename}")
        
        #translate the template file text
        gsubs.each_pair do |key, value|
          template_text.gsub!(Regexp.new("<%= @#{key} %>"), value)
        end
        
        template_text
      end
      
      def include_script html_filename, script_filename, dom_id
        
      end
    end
    
    class Model < Base
      def initialize(name, fields = [])
        super
        
        @fields = fields
        
        @gsubs['name']       = name.capitalize
        @gsubs['model_name'] = name
        @gsubs['inst_name']  = name.downcase
        @gsubs['fields']     = fields.collect {|f| field_template(f[0], f[1])}.join(",\n")
        
        @model_filename = "app/models/#{@gsubs['name']}.js"
        @spec_filename  = "spec/models/#{@gsubs['name']}.spec.js"
      end
      
      def generate!
        ensure_no_overwrite! @model_filename, @spec_filename
        
        ensure_directories_present! "app",  "app/models"
        ensure_directories_present! "spec", "spec/models"
        
        template "Model.js",     @model_filename
        template "ModelSpec.js", @spec_filename
      end
      
      private
      def field_template(name, type)
        padding = longest_field_length - name.length
        "    {name: '#{name}', #{" " * padding}type: '#{type}'}"
      end
      
      def longest_field_length
        @fields.collect {|f| f[0].length}.max
      end
    end
    
    class Controller < Base
      def initialize(name, actions = [])
        super
        
        @name    = name
        @actions = actions
        @package = name.downcase
        
        @gsubs.merge!({
          'controller_name' => "#{name.capitalize}Controller",
          'short_name'      => @package,
          'actions'         => generate_actions
        })
        
        @controller_filename = "app/controllers/#{@gsubs['controller_name']}.js"
      end
      
      def generate!
        ensure_no_overwrite!        @controller_filename
        ensure_directories_present! "app", "app/controllers"
        
        template "Controller.js", @controller_filename
        
        generate_views!
      end
      
      private
      def generate_actions
        @actions.collect {|act| render_template("_Action.js", {'action_name' => act})}.join("")
      end
      
      def generate_views!
        @actions.each {|a| View.new(@package, a).generate!}
      end
    end
    
    class View < Base
      def initialize(package, name)
        super
        
        @package = package
        @name    = name.capitalize
        
        @view_filename = "app/views/#{package}/#{@name}.js"
        
        @gsubs.merge!({
          'name'           => @name,
          'view_namespace' => @package,
          'filename'       => @view_filename
        })
      end
      
      def generate!
        ensure_no_overwrite! @view_filename
        ensure_directories_present! "app", "app/views", "app/views/#{@package}"
        
        template "View.js", @view_filename
      end
    end
    
    class Scaffold < Base
      def initialize(name, fields = [])
        super
        
        @name = name
      end
      
      def generate!
        Model.new(name, fields).generate!
      end
    end
  end
end