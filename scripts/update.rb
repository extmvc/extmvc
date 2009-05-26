# run ruby script/update to update MVC files used inside the baseapp,
# such as ensuring the files in the 'script' folder are up to date`
module ExtMVC
  module Update
    def self.dispatch
      Updater.new
    end
    
    class Updater
      def initialize
        [:build, :generate, :info, :setup, :stats].each do |script|
          self.send("ensure_#{script}")
        end        
      end
      
      def ensure_build
        install_file('build', 'ExtMVC::Builder.dispatch')
      end
      
      def ensure_generate
        install_file('generate', 'ExtMVC::Generator.dispatch')        
      end
      
      def ensure_info
        install_file('info', 'ExtMVC.show_settings')
      end
      
      def ensure_setup
        install_file('setup', 'ExtMVC.setup(ARGV.shift)')
      end
      
      def ensure_stats
        install_file('stats', 'ExtMVC::Stats.dispatch')
      end
      
      def ensure_update
        install_file('update', 'ExtMVC::Update.dispatch')
      end
      
      def delete_file filename
        File.delete()
      rescue
      end
      
      def install_file filename, contents
        filename = "script/#{filename}"
        
        delete_file filename
        str = "require 'vendor/mvc/scripts/scripts'\n\n" + contents
        
        FileUtils.touch(filename)
        File.open(filename, "w") {|f| f.puts str}
      end
    end
  end
end