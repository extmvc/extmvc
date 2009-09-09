require 'rubygems'
require 'fileutils'

module ExtMVC
  # overwrites all instances of 'MyApp' with the namespace provided
  def self.setup(namespace)
    files = %w(
      app/controllers/IndexController.js
      app/views/index/Index.js
      config/settings.yml
    )
    
    files.each {|f| gsub_file(f, 'MyApp', namespace)}
  end
  
  private
  
  #find/replace in a file.  Stolen/adapted from Rails
  def self.gsub_file(filename, regexp, *args, &block)
    content = File.read(filename).gsub(regexp, *args, &block)
    File.open(filename, 'wb') { |file| file.write(content) }
  end
end