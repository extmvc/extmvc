module ExtMVC
  module Builder
    def self.dispatch
      meth = ARGV.shift.downcase
      self.send(meth)
    end
    
    # Watches all files in a standard project and runs ruby script/build all whenever any of them change
    # Add any additional files or directories to watch as arguments, e.g.:
    # ruby script/build auto my/special/File.js my/other/directory/*.js
    def self.auto *args
      filename = 'index.html'
      command  = "ruby script/build all"
      files    = self.js_files_in_html(filename)
      
      self.listen_and_run(files, command, "Built Ext MVC app")
    end
    
    # Builds the current app based on the files specified in the index.html file
    def self.all
      filename = (ARGV.shift || 'index.html').downcase
      
      self.js(filename)
      self.css(filename)
    end
    
    def self.js filename = 'index.html'
      self.concatenate_js(filename)
      self.minify_js(filename)
    end
    
    def self.css filename = 'index.html'
      self.concatenate_css(filename)
    end
    
    def self.concatenate_js filename = 'index.html'
      puts; puts "Concatenating Javascript files"
      
      self.concatenate_files(self.js_files_in_html(filename), "public/application-all.js")
    end
    
    def self.minify_js filename
      puts; puts "Minifying Javascript files"
      
      self.minify_file("public/application-all.js")
    end
    
    def self.concatenate_css filename
      puts; puts "Concatenating CSS files"
      
      files = []
      
      #find all script files in the html file.  Ignore any with a class 'concat-ignore'
      doc = Hpricot(open(filename))
      (doc/"link[@re!='stylesheet']").each {|s| files.push(s['href']) if s['href'] && !s['href'].match(/http(.*)/)}
    
      self.concatenate_files(files, "public/stylesheets/application-all.css")
    end
    
    # Watches all ExtMVC core files and automatically rebuilds whenever any of them change
    # Not intended for general use - good when developing MVC itself though
    def self.mvc_auto
      command = "ruby script/build mvc"
      files = {}
      
      files = self.js_files_in_directories([
        "vendor/mvc/MVC.js",
        "vendor/mvc/controller/**/*.js",
        "vendor/mvc/lib/**/*.js",
        "vendor/mvc/model/**/*.js",
        "vendor/mvc/os/**/*.js",
        "vendor/mvc/view/**/*.js"
      ])
      
      self.listen_and_run(files, command, "Built Ext MVC framework")
    end
    
    # Builds MVC from source
    def self.mvc
      # Files to build in their dependency order. This is a bit gash :/
      files = ["MVC.js", "lib/Inflector.js", "lib/String.js", "lib/Router.js", "lib/Route.js", "controller/Controller.js", 
               "controller/CrudController.js", "os/OS.js", "model/Model.js", "model/AdapterManager.js", "model/Cache.js", 
               "model/UrlBuilder.js", "model/Association.js", "model/HasManyAssociation.js", "model/BelongsToAssociation.js", 
               "model/adapters/AbstractAdapter.js", "model/adapters/RESTAdapter.js", "model/validations/Errors.js", 
               "os/viewportbuilder/ViewportBuilderManager.js", "os/viewportbuilder/ViewportBuilder.js", 
               "view/scaffold/ScaffoldFormPanel.js", "view/scaffold/Index.js", "view/scaffold/New.js", "view/scaffold/Edit.js", 
               "view/HasManyEditorGridPanel.js"]
      
      concatenated_filename = "vendor/mvc/ext-mvc-all.js"
      
      self.concatenate_files(files, concatenated_filename, 'vendor/mvc')
      self.minify_file(concatenated_filename)
    end
    
    private
    # Returns an array of all JavaScript files included by the given HTML file
    def self.js_files_in_html filename
      files = []
      
      #find all script files in the html file.  Ignore any with a class 'concat-ignore'
      doc = Hpricot(open(filename))
      (doc/"script[@class!='concat-ignore']").each {|s| files.push(s['src']) if s['src']}
      
      files
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
    
    # Utility method to return an array of filenames for every file with a '.js' extension
    # anywhere inside the specified directories or their subdirectories
    def self.js_files_in_directories dirs = [], include_args = true
      files = []
      
      ARGV.each {|arg| dirs.push(arg)} if include_args
      
      dirs.each do |dir|
        Dir[dir].each { |file|
          files.push(file)
        }
      end
      
      files
    end
    
    def self.concatenate_files(files, concatenated_filename, baseDir = './')
      #remove old files, create blank ones again
      File.delete(concatenated_filename) and puts "Deleted old #{concatenated_filename}" if File.exists?(concatenated_filename)
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
      
      puts "Concatenated #{count} files into #{concatenated_filename}";
    end
    
    def self.minify_file(filename, minified_filename = nil)
      if minified_filename.nil?
        minified_filename = filename.gsub(/\.js$/, '-min.js')
      end
      
      FileUtils.rm(minified_filename) and puts "Deleted old #{minified_filename}" if File.exists?(minified_filename)
      
      system("java -jar vendor/yui-compressor/build/yuicompressor-2.4.jar #{filename} -o #{minified_filename}")
      
      puts "Created minified file #{minified_filename}";
    end
  end
end