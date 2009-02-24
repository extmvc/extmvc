require 'ftools'

module ExtMVC
  class Plugin
    attr_reader :name, :type, :directory
    
    def initialize name
      @name = @directory = name
      @type = @name =~ /git:\/\// ? 'git' : 'dir'
      
      @public_directory = "#{@name}/public"
    end
    
    def install
      install_assets
    end
    
    def install_assets
      install_assets_from_directory(@public_directory) if File.exists?(@public_directory)
    end
    
    def uninstall
      if File.exists?(@public_directory)
        
      end
    end
    
    private
    #installs all assets from the given directory and subdirs into the main /public folder
    def install_assets_from_directory(directory)
      directory ||= @public_directory

      find_assets_in_directory(directory).each do |f|
        new_asset = asset_new_location_name(f)
        puts new_asset
        if File.directory?(f)
          Dir.mkdir(new_asset) unless File.exists?(new_asset)
          puts "Created directory: " + new_asset
        else
          File.copy(f, new_asset)
        end
      end
    end
    
    #recursively finds assets in directories under /public inside the plugin
    def find_assets_in_directory(directory)
      files = []
      
      Dir.entries(directory).each do |e|
        filename = File.join(directory, e)
        next if ['.', '..'].include?(filename.split('/').last.to_s)
        
        files.push(filename)
        files.concat(find_assets_in_directory(filename)) if File.directory?(filename)
      end
      
      return files
    end
    
    #i.e. vendor/plugins/MyPlugin/public/images/image.gif becomes public/images/image.gif
    def asset_new_location_name(filename)
      pieces = filename.split("/")
      if index = pieces.index('public')
        File.join(pieces.slice(index, pieces.size))
      else
        filename
      end
    end
  end
end