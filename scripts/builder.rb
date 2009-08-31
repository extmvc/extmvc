module ExtMVC
  class Builder
    
    # Subclasses must implement this method to return the name of the file that concatenated output will be saved to
    def output_filename
      raise 
    end
    
    # Does the actual building - just concatenates file_list and optionally minifies
    def build
      concatenate(file_list, output_filename)
      system('growlnotify -m "Built ' + name + '"')
      
      if should_minify
        minify output_filename
        system('growlnotify -m "Minified ' + name + '"')
      end
      
      puts message
    end
    
    # Indicates whether the outputted filename should also be minified (defaults to false)
    def should_minify
      false
    end
    
    def name
      "Unknown Package"
    end
    
    def message
      "Build complete"
    end
    
    def description
      directory_name
    end
    
    # Returns an array of all files to be concatenated, in the order they should be included
    def file_list
      has_build_file? ? order_from_build_file : guess_build_order
    end
    
    def has_build_file?
      File.exists?(build_file_name)
    end
    
    def build_file_name
      "#{directory_name}/build"
    end
    
    # Subclasses can override this method to return the string name of the directory under while the file_list resides
    def directory_name
      "./"
    end
    
    # Returns an array of all of the files listed in the build file
    def order_from_build_file
      build_files = []
      file        = File.open(build_file_name, "r")
      
      while (line = file.gets)
        line.gsub!(/\n/, '')
        next if line =~ /^#/ || line.length.zero?
        
        filename = "#{directory_name}/#{line}"
        
        if File.exists?(filename)
          build_files.push(filename) unless build_files.include?(filename)
        else
          js_files_in_glob(filename).each {|filename| build_files.push(filename) unless build_files.include?(filename)}
        end
      end
      
      build_files
    end
    
    # Returns an array of all the .js files found in the plugin dir, in the order in which they are found
    # (ignores the 'PluginName-all.js' file)
    def guess_build_order
      js_files_in_glob("#{directory_name}/**/*.js")
    end    
    
    def js_files_in_glob(glob)
      Dir[glob].select {|fileName| Regexp.new(output_filename).match(fileName).nil?}
    end
    
    private
    
    # Concatenates an array of files together and saves
    def concatenate(files, concatenated_filename, baseDir = './')
      #remove old files, create blank ones again
      if File.exists?(concatenated_filename)
        File.delete(concatenated_filename) 
        # puts "Deleted old #{concatenated_filename}"
      end
      FileUtils.touch(concatenated_filename)
      
      count = 0
      file = File.open(concatenated_filename, 'w') do |f|
        files.each do |i|
          # remove the directory the app is in if add_dir is supplied
          i = i.gsub(Regexp.new(ENV['app_dir']), '').gsub(/$(\/*)(.*)/, '\2') if ENV['app_dir']

          f.puts(IO.read(File.join(baseDir, i)))
          f.puts("\n")
          count += 1
        end
      end
      
      # puts "Concatenated #{count} files into #{concatenated_filename}"
      # puts
    end
    
    # Minifies a file using YUI compressor
    def minify(filename, minified_filename = nil)
      if minified_filename.nil?
        minified_filename = filename.gsub(/\.js$/, '-min.js')
      end
      
      if File.exists?(minified_filename)
        FileUtils.rm(minified_filename)
        # puts "Deleted old #{minified_filename}"
      end

      system("java -jar vendor/yui-compressor/build/yuicompressor-2.4.jar #{filename} -o #{minified_filename}")

      # puts "Created minified file #{minified_filename}"
      # puts
    end

  end
  
  class BuilderManager
    def self.dispatch
      builderName = ARGV.shift.downcase
      
      if builderName == 'auto'
        builderName = ARGV.shift.downcase
        auto = true
      end
      
      instances = self.instances_for(builderName, ARGV)
      
      auto == true ? self.auto(instances) : self.build(instances)
    end
    
    def self.instances_for(name, args)
      klass = case name
        when 'app'   : ExtMVC::AppBuilder
        when 'css'   : ExtMVC::CssBuilder
        when 'mvc'   : ExtMVC::MVCBuilder
        when 'docs'  : ExtMVC::DocsBuilder
        when 'plugin': ExtMVC::PluginBuilder
        when 'all'   : ExtMVC::AllBuilder
      end
      
      klass.instances(ARGV)
    end
    
    def self.build(instances)
      instances.each {|i| i.build}
    end
    
    # Takes an array of Builder instances and checks their files every second to see if any changed
    # if they did, rebuild that package. Also builds all packages immediately when first run
    def self.auto(instances)
      puts
      
      # Force rebuild on all packages on startup
      instances.each {|i| i.build}
      
      trap('INT') do
        puts "\nQuitting..."
        exit
      end
      
      puts
      puts "All packages built. Now listening for changes to any of the following:"
      puts
      
      instances.each_with_index {|instance, index| puts "  #{index + 1}) #{instance.description}"}
      
      files = {}
      instances.each do |builder|
        files[builder.directory_name] = builder.file_list.inject({}) {|m, f| m.merge({f => File.mtime(f)})}
      end
      
      puts
      puts "If files belonging to the above change, the concatenated versions will be rebuilt"
      puts
      puts "Listening for changes..."
      puts
      
      loop do
        sleep 1
        
        instances.each do |builder|
          #Hash of filename => last modified time
          changed_file, last_changed = files[builder.directory_name].find { |file, last_changed|
            File.mtime(file) > last_changed
          }

          if changed_file
            files[builder.directory_name][changed_file] = File.mtime(changed_file)
            
            puts "#{builder.description} is being rebuilt because #{changed_file} changed"
            builder.build
            puts
            puts "=> Listening for changes..."
            puts
          end

        end
      end
    end
    

    # Listens to any changes to the specified files and runs the specified command
    # This is taken largely from Geoffrey Grosenbach's rstakeout (http://nubyonrails.com/articles/automation-with-rstakeout)
    def self.listen_and_run files_array = [], command = '', message = nil
      files = {}
      files_array.each do |f|
        files[f] = File.mtime(f)
      end
      
      puts "Watching #{files.keys.join(', ')}\n\nFiles: #{files.keys.length}"

      trap('INT') do
        puts "\nQuitting..."
        exit
      end

      loop do

        sleep 1

        changed_file, last_changed = files.find { |file, last_changed|
          File.mtime(file) > last_changed
        }

        if changed_file
          files[changed_file] = File.mtime(changed_file)
          puts "=> #{changed_file} changed, running #{command}"
          results = `#{command}`
          puts results

          puts "=> done"
          system('growlnotify -m "' + message + '"') if message
        end

      end
    end
  end
end

# module ExtMVC
#   class Builder
#     def self.dispatch
#       meth = ARGV.shift.downcase
#       self.send(meth)
#     end
#     
#     # Watches all files in a standard project and runs ruby script/build all whenever any of them change
#     # Add any additional files or directories to watch as arguments, e.g.:
#     # ruby script/build auto my/special/File.js my/other/directory/*.js
#     def self.auto *args
#       filename = 'index.html'
#       command  = "ruby script/build all"
#       
#       self.listen_to_file_and_run(filename, command, "Built Ext MVC app")
#     end
#     
#     # Builds the current app based on the files specified in the index.html file
#     def self.app
#       filename = (ARGV.shift || 'index.html').downcase
#       
#       self.app_js(filename)
#       self.app_css(filename)
#     end
#     
#     def self.app_js filename = 'index.html'
#       self.concatenate_js(filename)
#       self.minify_js(filename)
#     end
#     
#     def self.app_css filename = 'index.html'
#       self.concatenate_css(filename)
#     end
#     
#     # Builds either a specific plugin, or all of them
#     def self.plugin(name = nil)
#       name ||= ARGV.shift
#       return self.all_plugins if name == 'all'
#       
#       dirName        = "vendor/plugins/#{name}"
#       pluginFileName = "#{dirName}/#{name}-all.js"
#       buildFiles     = []
#       
#       if File.exists?("#{dirName}/build")
#         #Load using the include file
#         includeFile = File.open("#{dirName}/build", "r")
#         while (line = includeFile.gets)
#           line.gsub!(/\n/, '')
#           next if line =~ /^#/ || line.length.zero?
#           buildFiles.push("#{dirName}/#{line}")
#         end
#       else
#         #Load all files in the order they are found
#         Dir["#{dirName}/**/*.js"].each do |fileName| 
#           next if fileName =~ /-all.js$/
#           buildFiles.push(fileName)
#         end
#       end
#       
#       self.concatenate_files(buildFiles, pluginFileName)
#       puts
#     end
#     
#     # Builds all plugins found in the vendor/plugins directory
#     def self.all_plugins
#       pluginsDir = 'vendor/plugins'
#       
#       #Gets the name of each plugin directory inside vendor/plugins and calls self.plugin with it
#       Dir.entries(pluginsDir).select {|fileName| 
#         File.directory?("#{pluginsDir}/#{fileName}") && (fileName =~ /^\./) != 0
#       }.each {|pluginName| self.plugin(pluginName)}
#     end
#     
#     def self.concatenate_js filename = 'index.html'
#       puts; puts "Concatenating Javascript files"
#       
#       self.concatenate_files(self.js_files_in_html(filename), "public/application-all.js")
#     end
#     
#     def self.minify_js filename
#       puts; puts "Minifying Javascript files"
#       
#       self.minify_file("public/application-all.js")
#     end
#     
#     def self.concatenate_css filename
#       puts; puts "Concatenating CSS files"
#       
#       self.concatenate_files(self.css_files_in_html(filename), "public/stylesheets/application-all.css")
#     end
#     
#     # Watches all ExtMVC core files and automatically rebuilds whenever any of them change
#     # Not intended for general use - good when developing MVC itself though
#     def self.mvc_auto
#       command = "ruby script/build mvc"
#       files = {}
#       
#       files = self.js_files_in_directories([
#         "vendor/mvc/MVC.js",
#         "vendor/mvc/App.js",
#         "vendor/mvc/overrides/**/*.js",
#         "vendor/mvc/controller/**/*.js",
#         "vendor/mvc/lib/**/*.js",
#         "vendor/mvc/model/**/*.js",
#         "vendor/mvc/view/**/*.js"
#       ])
#       
#       self.listen_and_run(files, command, "Built Ext MVC framework")
#     end
#     
#     # Builds MVC from source
#     def self.mvc
#       # Files to build in their dependency order. This is a bit gash :/
#       files = ["MVC.js", "App.js",
#                "lib/Inflector.js","lib/Array.js", "lib/String.js", "lib/Router.js", "lib/Route.js", "lib/Dependencies.js",
#                "lib/Booter.js", "lib/Environment.js",
#                "overrides/Ext.extend.js", "controller/Controller.js", "controller/CrudController.js",
#                "model/Model.js", "model/Base.js",
#                "model/adapters/AbstractAdapter.js", "model/adapters/RESTAdapter.js",  "model/adapters/RESTJSONAdapter.js",
#                "model/validations/Validations.js", "model/validations/Errors.js", "model/validations/Plugin.js",
#                "view/scaffold/ScaffoldFormPanel.js", "view/scaffold/Index.js", "view/scaffold/New.js", "view/scaffold/Edit.js",
#                "view/HasManyEditorGridPanel.js", "view/FormWindow.js"]
#       
#       concatenated_filename = "vendor/mvc/ext-mvc-all.js"
#       
#       self.concatenate_files(files, concatenated_filename, 'vendor/mvc')
#       self.minify_file(concatenated_filename)
#     end
#     
#     # Builds documentation
#     def self.docs
#       system("java -jar vendor/ext-doc/ext-doc.jar -p config/build.xml -o docs -t vendor/ext-doc/template/ext/template.xml -verbose")
#       app_name = ExtMVC.settings['docs']['title'] rescue ExtMVC.environment["namespace"] || "Ext MVC"
#       logo     = ExtMVC.settings['docs']['logo']  rescue "resources/extjs.gif"
#       
#       {:app_name => app_name, :logo => logo}.each_pair do |key, value|
#         ExtMVC.gsub_file("docs/index.html", "<%= @#{key} %>", value)
#         ExtMVC.gsub_file("docs/welcome.html", "<%= @#{key} %>", value)
#       end
#     end
#     
#     def self.docs_auto
#       filename = 'myindex.html'
#       command  = "ruby script/build docs"
#       
#       self.listen_to_file_and_run(filename, command, "Built Ext MVC app documentation")
#     end
#     
#     private
#     # Returns an array of all JavaScript files included by the given HTML file
#     def self.js_files_in_html filename
#       files = []
#       
#       #find all script files in the html file.  Ignore any with a class 'concat-ignore'
#       doc = Hpricot(open(filename))
#       (doc/"script[@class!='concat-ignore']").each {|s| files.push(s['src']) if s['src']}
#       
#       files
#     end
#     
#     # Returns an array of all CSS files included by the given HTML file
#     def self.css_files_in_html filename
#       files = []
#       
#       #find all script files in the html file.  Ignore any with a class 'concat-ignore'
#       doc = Hpricot(open(filename))
#       (doc/"link[@rel='stylesheet']").each {|s| files.push(s['href']) if s['href'] && !s['href'].match(/http(.*)/)}
#     
#       files
#     end
#     
#     def self.files_with_timestamps files_array
#       files = {}
#       files_array.each do |file|
#         files[file] = File.mtime(file)
#       end
#       
#       files
#     end
#     
#     # Returns a hash with the filenames of <script> include tags from an HTML file as the keys,
#     # and the modification timestamp for each file as values
#     def self.js_files_in_html_with_timestamps filename
#       self.files_with_timestamps(self.js_files_in_html(filename))
#     end
#     
#     # Returns a hash with the filenames of <script> include tags from an HTML file as the keys,
#     # and the modification timestamp for each file as values
#     def self.css_files_in_html_with_timestamps filename
#       self.files_with_timestamps(self.css_files_in_html(filename))
#     end
#     
#     # Watches a file for changes and rebuilds based on it's script includes each time it is modified.
#     # This is intended to be used on an MVC app's index.html file - command is execute every time any of the
#     # files included in that HTML file are changed the command is run, or when the file itself is updated
#     def self.listen_to_file_and_run filename, command = '', message = nil
#       # Track when the HTML file was last modified
#       file_modified = File.mtime(filename)
#       
#       # Track modification times of all JS files included in the HTML file
#       included_files = self.js_files_in_html_with_timestamps(filename)
#       
#       trap('INT') do
#         puts "\nQuitting..."
#         exit
#       end
#       
#       puts "Watching #{included_files.keys.join(', ')}\n\nFiles: #{included_files.keys.length}"
#       
#       loop do
#         sleep 1
#         rebuild = false
#         changed_file = ''
#         
#         #index file has been changed
#         if file_modified < File.mtime(filename)
#           rebuild = true
#           changed_file = filename
#         else
#           #check to see if any of the included files have been updated
#           rebuild, last_changed = included_files.find {|f, last_changed| File.mtime(f) > last_changed}
#           changed_file = rebuild
#         end
#         
#         if rebuild
#           #reset references from above
#           file_modified = File.mtime(filename)
#           included_files = self.js_files_in_html_with_timestamps(filename)
#           
#           #issue the rebuild command
#           puts "=> #{changed_file} changed, running #{command}"
#           results = `#{command}`
#           puts results
# 
#           puts "=> done"
#           system('growlnotify -m "' + message + '"') if message
#           
#           # if the file we were watching has changed, restate which files we're watching now
#           if changed_file == filename
#             puts
#             puts "Now watching #{included_files.keys.join(', ')}\n\nFiles: #{included_files.keys.length}"
#           end
#         end
#       end
#     end
#     
#     # Listens to any changes to the specified files and runs the specified command
#     # This is taken largely from Geoffrey Grosenbach's rstakeout (http://nubyonrails.com/articles/automation-with-rstakeout)
#     def self.listen_and_run files_array = [], command = '', message = nil
#       files = {}
#       files_array.each do |f|
#         files[f] = File.mtime(f)
#       end
#       
#       puts "Watching #{files.keys.join(', ')}\n\nFiles: #{files.keys.length}"
# 
#       trap('INT') do
#         puts "\nQuitting..."
#         exit
#       end
# 
#       loop do
# 
#         sleep 1
# 
#         changed_file, last_changed = files.find { |file, last_changed|
#           File.mtime(file) > last_changed
#         }
# 
#         if changed_file
#           files[changed_file] = File.mtime(changed_file)
#           puts "=> #{changed_file} changed, running #{command}"
#           results = `#{command}`
#           puts results
# 
#           puts "=> done"
#           system('growlnotify -m "' + message + '"') if message
#         end
# 
#       end      
#     end
#     
#     # Utility method to return an array of filenames for every file with a '.js' extension
#     # anywhere inside the specified directories or their subdirectories
#     def self.js_files_in_directories dirs = [], include_args = true
#       files = []
#       
#       ARGV.each {|arg| dirs.push(arg)} if include_args
#       
#       dirs.each do |dir|
#         Dir[dir].each { |file|
#           files.push(file)
#         }
#       end
#       
#       files
#     end
#     
#     def self.concatenate_files(files, concatenated_filename, baseDir = './')
#       #remove old files, create blank ones again
#       File.delete(concatenated_filename) and puts "Deleted old #{concatenated_filename}" if File.exists?(concatenated_filename)
#       FileUtils.touch(concatenated_filename)
#       
#       count = 0
#       file = File.open(concatenated_filename, 'w') do |f|
#         files.each do |i|
#           # remove the directory the app is in if add_dir is supplied
#           i = i.gsub(Regexp.new(ENV['app_dir']), '').gsub(/$(\/*)(.*)/, '\2') if ENV['app_dir']
# 
#           f.puts(IO.read(File.join(baseDir, i)))
#           f.puts("\n")
#           count += 1
#         end
#       end
#       
#       puts "Concatenated #{count} files into #{concatenated_filename}";
#     end
#     
#     def self.minify_file(filename, minified_filename = nil)
#       if minified_filename.nil?
#         minified_filename = filename.gsub(/\.js$/, '-min.js')
#       end
#       
#       FileUtils.rm(minified_filename) and puts "Deleted old #{minified_filename}" if File.exists?(minified_filename)
#       
#       system("java -jar vendor/yui-compressor/build/yuicompressor-2.4.jar #{filename} -o #{minified_filename}")
#       
#       puts "Created minified file #{minified_filename}";
#     end
#   end
# end