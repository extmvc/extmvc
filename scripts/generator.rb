require 'rubygems'
require 'hpricot'

module ExtMVC
  module Generator
    
    @@generators = %w(Model Controller)
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
      end
    end
    
    class Base
      def initialize *args
        @gsubs ||= {}
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
        #grab the template file text
        template_text = IO.read("vendor/mvc/scripts/templates/#{template_filename}")
        
        #translate the template file text
        @gsubs.each_pair do |key, value|
          template_text.gsub!(Regexp.new("<%= @#{key} %>"), value)
        end
        
        #write the file
        File.open(destination_filename, 'w') {|f| f.puts(template_text)}
        
        puts "Created #{destination_filename}"
      end
      
      def include_script html_filename, script_filename, dom_id
        
      end
    end
    
    class Model < Base
      def initialize(name, fields = [])
        super
        
        @fields = fields
        
        @gsubs['namespace']  = ExtMVC.environment['namespace']
        @gsubs['name']       = name
        @gsubs['model_name'] = name.split(".").last
        @gsubs['inst_name']  = name.split(".").last.downcase
        @gsubs['fields']     = fields.collect {|f| field_template(f[0], f[1])}.join(",\n")
        
        @model_filename = "app/models/#{@gsubs['model_name']}.js"
        @spec_filename  = "spec/models/#{@gsubs['model_name']}.spec.js"
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
  end
end