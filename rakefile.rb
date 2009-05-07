namespace :extmvc do
  namespace :mvc do
    task :build do
      Rake::Task["extmvc:mvc:concatenate"].execute
      Rake::Task["extmvc:mvc:minify"].execute
    end
    
    task :concatenate do
      #ordered list of files to build
      # files = ["MVC.js", "lib/Inflector.js", "lib/String.js", "lib/Router.js", "lib/Route.js", "controller/Controller.js", "controller/CrudController.js", "os/OS.js", "model/Model.js", "model/AdapterManager.js", "model/Cache.js", "model/UrlBuilder.js", "model/Association.js", "model/HasManyAssociation.js", "model/BelongsToAssociation.js", "model/adapters/AbstractAdapter.js", "model/adapters/RESTAdapter.js", "model/validations/Errors.js", "os/viewportbuilder/ViewportBuilderManager.js", "os/viewportbuilder/ViewportBuilder.js", "view/scaffold/ScaffoldFormPanel.js", "view/scaffold/Index.js", "view/scaffold/New.js", "view/scaffold/Edit.js", "view/HasManyEditorGridPanel.js"]
      files = ["MVC.js", "lib/Inflector.js", "lib/String.js", "lib/Router.js", "lib/Route.js", "controller/Controller.js", "controller/CrudController.js", "os/OS.js", "model/Model.js", "model/Base.js", "model/validations/Errors.js", "model/validations/Validations.js", "os/viewportbuilder/ViewportBuilderManager.js", "os/viewportbuilder/ViewportBuilder.js", "view/scaffold/ScaffoldFormPanel.js", "view/scaffold/Index.js", "view/scaffold/New.js", "view/scaffold/Edit.js", "view/HasManyEditorGridPanel.js"]
      
      concatenated_filename = "ext-mvc-all.js"
      
      #remove old files, create blank ones again
      File.delete(concatenated_filename) and puts "Deleted old file" if File.exists?(concatenated_filename)
      FileUtils.touch(concatenated_filename)
      
      file = File.open(concatenated_filename, 'w') do |f|
        files.each do |i|
          f.puts(IO.read(i))
          f.puts("\n")
        end
      end

    end
    
    #assumes Java is installed and YUI compressor can be found at ../../script/yui-compressor
    task :minify do
      concatenated_filename = "ext-mvc-all.js"
      minified_filename     = "ext-mvc-all-min.js"
      FileUtils.rm(minified_filename) if File.exists?(minified_filename)
      
      system("java -jar ../yui-compressor/build/yuicompressor-2.4.jar #{concatenated_filename} -o #{minified_filename}")
    end
  end
end