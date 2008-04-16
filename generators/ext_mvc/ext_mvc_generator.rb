require 'find'

class ExtMvcGenerator < Rails::Generator::Base
  def manifest 
    record do |m|          
      # ext mvc directories
      m.directory("public/javascripts")
      m.directory("public/javascripts/ext")
      m.directory("public/javascripts/views")
      m.directory("public/javascripts/controllers")
      m.directory("public/javascripts/helpers")
      m.directory("public/javascripts/initializers")
      
      # other required dirs
      m.directory("public/images/icons")
      m.directory("config/initializers")
      
      # copy over key rails files
      m.file("config/initializers/javascript_symbols.rb", "config/initializers/javascript_symbols.rb") #asset tag expansions
      m.file("controllers/admin_controller.rb", "app/controllers/admin_controller.rb")
      m.file("views/layouts/admin.html.haml", "app/views/layouts/admin.html.haml")
      
      #recursively copy over all public files (includes EXTJS)
      recursive_copy_files 'public', m
      
      m.readme "../USAGE"
    end
  end
  
  # copies over all files in all child directories of the given directory name
  def recursive_copy_files dirname, record_object
    dirs, files = recursive_find_directories_and_files(dirname)
    
    dirs.each do |dir|
      record_object.directory(dir)
    end
    
    files.each do |filename|
      record_object.file(filename, filename)
    end
  end
  
  # unpleasant... just want to return a list of relative paths of all directories and
  # files under the specified directory.  e.g.
  # recursive_find_directories_and_files 'public'
  # returns a recursive array of directories and a recursive array of files of everything
  # under templates/public
  def recursive_find_directories_and_files dirname
    base_path = self.class.lookup('ExtMvc').path + "/templates/"
    
    directories = []
    files = []
    
    Find.find(File.join(base_path, dirname)) do |path|
      if FileTest.directory?(path)
        directories << path.gsub(base_path, '')
      else
        files << path.gsub(base_path, '')
      end
    end
    
    return directories, files
  end
end