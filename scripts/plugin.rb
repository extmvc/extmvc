require 'ftools'

module ExtMVC
  module Plugin
    def self.dispatch
      meth = ARGV.shift.downcase
      name = ARGV.shift
      
      self.send(meth, name)
    end
    
    def self.build(name)
      return self.build_all if name == 'all'
      
      dirName        = "vendor/plugins/#{name}"
      pluginFileName = "#{dirName}/#{name}-all.js"
      buildFiles     = []
      
      if File.exists?("#{dirName}/include_order.txt")
        #Load using the include file
        includeFile = File.open("#{dirName}/include_order.txt", "r")
        while (line = includeFile.gets)
          line.gsub!(/\n/, '')
          next if line =~ /^#/ || line.length.zero?
          buildFiles.push("#{dirName}/#{line}")
        end
      else
        #Load all files in the order they are found
        Dir["#{dirName}/**/*.js"].each do |fileName| 
          next if fileName =~ /-all.js$/
          buildFiles.push(fileName)
        end
      end
      
      self.concatenate_files(buildFiles, pluginFileName)
      puts
    end
    
    def self.build_all
      dirs = []
      pluginsPath = 'vendor/plugins'
      
      Dir.entries(pluginsPath).each do |fileName|
        dirs.push(fileName) if File.directory?("#{pluginsPath}/#{fileName}") && (fileName =~ /^\./) != 0
      end
      
      dirs.each {|plugin| self.build(plugin)}
    end
    
    # Installs a given plugin by copying its public assets
    def self.install(name)
      
    end
    
    # Uninstalls a given plugin by removing its public assets
    def self.uninstall(name)
      
    end
    
    # Creates a new skeleton plugin
    def self.create(name)
      
    end
    
    private
    # TODO: this is copied verbatim from the builder script. Refactor this and builder's version somewhere else
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
      
      puts "Concatenated #{count} files into #{concatenated_filename}"
    end
  end
end

# module ExtMVC
#   class Plugin
#     attr_reader :name, :type, :directory
#     
#     def initialize name
#       @name = @directory = name
#       @type = @name =~ /git:\/\// ? 'git' : 'dir'
#       
#       @public_directory = "#{@name}/public"
#     end
#     
#     def install
#       install_assets
#     end
#     
#     def install_assets
#       install_assets_from_directory(@public_directory) if File.exists?(@public_directory)
#     end
#     
#     def uninstall
#       if File.exists?(@public_directory)
#         
#       end
#     end
#     
#     private
#     #installs all assets from the given directory and subdirs into the main /public folder
#     def install_assets_from_directory(directory)
#       directory ||= @public_directory
# 
#       find_assets_in_directory(directory).each do |f|
#         new_asset = asset_new_location_name(f)
#         puts new_asset
#         if File.directory?(f)
#           Dir.mkdir(new_asset) unless File.exists?(new_asset)
#           puts "Created directory: " + new_asset
#         else
#           File.copy(f, new_asset)
#         end
#       end
#     end
#     
#     #recursively finds assets in directories under /public inside the plugin
#     def find_assets_in_directory(directory)
#       files = []
#       
#       Dir.entries(directory).each do |e|
#         filename = File.join(directory, e)
#         next if ['.', '..'].include?(filename.split('/').last.to_s)
#         
#         files.push(filename)
#         files.concat(find_assets_in_directory(filename)) if File.directory?(filename)
#       end
#       
#       return files
#     end
#     
#     #i.e. vendor/plugins/MyPlugin/public/images/image.gif becomes public/images/image.gif
#     def asset_new_location_name(filename)
#       pieces = filename.split("/")
#       if index = pieces.index('public')
#         File.join(pieces.slice(index, pieces.size))
#       else
#         filename
#       end
#     end
#   end
# end