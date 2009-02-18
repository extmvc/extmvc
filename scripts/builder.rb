module ExtMVC
  module Builder
    def self.dispatch
      meth     = ARGV.shift.downcase
      filename = (ARGV.shift || 'index.html').downcase
      
      self.send(meth, filename)
    end
    
    def self.all filename
      self.js(filename)
      self.css(filename)
    end
    
    def self.js filename
      self.concatenate_js(filename)
      self.minify_js(filename)
    end
    
    def self.css filename
      self.concatenate_css(filename)
    end
    
    def self.concatenate_js filename
      puts; puts "Concatenating Javascript files"
      
      files = []
      
      #find all script files in the html file.  Ignore any with a class 'concat-ignore'
      doc = Hpricot(open(filename))
      (doc/"script[@class!='concat-ignore']").each {|s| files.push(s['src']) if s['src']}
    
      self.concatenate_files(files, "public/application-all.js")
    end
    
    def self.minify_js filename
      puts; puts "Minifying Javascript files"
      
      concatenated_filename = "public/application-all.js"
      minified_filename     = "public/application-all-min.js"
      
      FileUtils.rm(minified_filename) and puts "Deleted old #{minified_filename}" if File.exists?(minified_filename)
      
      system("java -jar vendor/mvc/scripts/yui-compressor/build/yuicompressor-2.4.jar #{concatenated_filename} -o #{minified_filename}")
      
      puts "Created minified file #{minified_filename}";
    end
    
    def self.concatenate_css filename
      puts; puts "Concatenating CSS files"
      
      files = []
      
      #find all script files in the html file.  Ignore any with a class 'concat-ignore'
      doc = Hpricot(open(filename))
      (doc/"link[@re!='stylesheet']").each {|s| files.push(s['href']) if s['href'] && !s['href'].match(/http(.*)/)}
    
      self.concatenate_files(files, "public/stylesheets/application-all.css")
    end
    
    private
    def self.concatenate_files(files, concatenated_filename)
      #remove old files, create blank ones again
      File.delete(concatenated_filename) and puts "Deleted old #{concatenated_filename}" if File.exists?(concatenated_filename)
      FileUtils.touch(concatenated_filename)
      
      count = 0
      file = File.open(concatenated_filename, 'w') do |f|
        files.each do |i|
          # remove the directory the app is in if add_dir is supplied
          i = i.gsub(Regexp.new(ENV['app_dir']), '').gsub(/$(\/*)(.*)/, '\2') if ENV['app_dir']

          f.puts(IO.read(i))
          f.puts("\n")
          count += 1
        end
      end
      
      puts "Concatenated #{count} files into #{concatenated_filename}";
    end
  end
end