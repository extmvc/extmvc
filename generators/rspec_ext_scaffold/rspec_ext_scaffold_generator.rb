class RspecExtScaffoldGenerator < Rails::Generator::NamedBase
  
  default_options :skip_timestamps => false, :skip_migration => false
  
  attr_accessor :field_collection

  attr_reader   :controller_name,
                :controller_class_path,
                :controller_file_path,
                :controller_class_nesting,
                :controller_class_nesting_depth,
                :controller_class_name,
                :controller_underscore_name,
                :controller_singular_name,
                :controller_plural_name
  alias_method  :controller_file_name,  :controller_underscore_name
  alias_method  :controller_table_name, :controller_plural_name

  def initialize(runtime_args, runtime_options = {})
    super

    @controller_name = @name.pluralize

    base_name, @controller_class_path, @controller_file_path, @controller_class_nesting, @controller_class_nesting_depth = extract_modules(@controller_name)
    @controller_class_name_without_nesting, @controller_underscore_name, @controller_plural_name = inflect_names(base_name)
    @controller_singular_name=base_name.singularize
    if @controller_class_nesting.empty?
      @controller_class_name = @controller_class_name_without_nesting
    else
      @controller_class_name = "#{@controller_class_nesting}::#{@controller_class_name_without_nesting}"
    end
    
    @field_collection = FieldCollection.new(@args)
  end
  
  def manifest 
    record do |m|
      # Check for class naming collisions.
      m.class_collisions(controller_class_path, "#{controller_class_name}Controller", "#{controller_class_name}Helper")
      m.class_collisions(class_path, "#{class_name}")
      
      js_dir = "public/javascripts"

      # Controller, helper, views, and test directories.
      m.directory('app/models')
      m.directory('app/controllers')
      m.directory('app/helpers')
      m.directory("#{js_dir}/views")
      m.directory("#{js_dir}/views/#{table_name}")
      m.directory("#{js_dir}/models")
      m.directory("#{js_dir}/controllers")
      m.directory('spec/controllers')
      m.directory('spec/controllers/admin')
      m.directory('spec/models')
      
      m.file("controllers/admin/crud_controller.rb", "controllers/admin/crud_controller.rb")
            
      #views
      scaffold_views.each do |view|
        m.template("views/#{view}.js", "#{js_dir}/views/#{table_name}/#{view}.js")
      end
      
      #controller
      m.template("controllers/_controller.rb", "app/controllers/admin/#{controller_file_name}_controller.rb")
      m.template("models/_model.rb", "app/models/#{@name}.rb")
      
      #model
      m.template("controllers/_controller.js", "#{js_dir}/controllers/#{controller_file_name}_controller.js")
      m.template("models/_model.js", "#{js_dir}/models/#{@name}.js")
      
      # m.dependency 'rspec_model', [name] + @args, :collision => :skip
      
      unless options[:skip_migration]
        m.migration_template 'migrations/migration.rb', 'db/migrate', :assigns => {
          :migration_name => "Create#{class_name.pluralize.gsub(/::/, '')}"
        }, :migration_file_name => "create_#{file_path.gsub(/\//, '_').pluralize}"
      end
      
      #specs
      m.template("specs/_controller_spec.rb", "spec/controllers/admin/#{controller_file_name}_controller_spec.rb")
      m.template("specs/_model_spec.rb", "spec/models/#{@name}_spec.rb")
      
      m.readme "../USAGE"
    end
  end
  

  protected
    def add_options!(opt)
      opt.separator ''
      opt.separator 'Options:'
      opt.on("--skip-timestamps",
             "Don't add timestamps to the migration file for this model") { |v| options[:skip_timestamps] = v }
      opt.on("--skip-migration",
             "Don't generate a migration file for this model") { |v| options[:skip_migration] = v }
    end

    def scaffold_views
      %w[ index new edit form_items ]
    end

    def model_name
      class_name.demodulize
    end
end