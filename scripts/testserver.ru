require 'vendor/mvc/scripts/settings'
require 'json'

# Rack adapter - each time a file changes, it gets given a sequential ID by builder. Browsers can then
# poll request all tests to perform since the last test they ran, based on its ID. Browsers report back
# to the Rack server, and amalgamated results can be retrieved:
# 
# GET  localhost:5000/changes?since=someDateTime
# POST localhost:5000/results  <= POST to with json object of success/fail data
# GET  localhost:5000/results?since=someDateTime
module Rack
  class ExtMVCSpecServer
    def initialize
      super
      
      @files = ExtMVC.application_files_for(ExtMVC.mvc_production_environment)
    end
    
    def call env
      path = env["REQUEST_PATH"].gsub(/^\//, '')
      path = 'index' if path == '/'
      
      @params = {}
      env["QUERY_STRING"].split("&").each do |query|
        @params[query.split("=")[0]] = query.split("=")[1]
      end
      
      [200, { 'Content-Type' => 'text/html' }, jsonp_encode(self.send(path, env))]
    end
    
    def jsonp_encode(obj)
      @params["callback"] + "(" + JSON.generate(obj) + ")"
    end
    
    def session env
      
    end
    
    def index env
      'index'
    end
    
    # Returns an array of all test files to run
    def all_test_files env
      {"files" => scope_files(file_list)}
    end
    
    # Returns true if any files have changed since the date given
    def changes env
      {"files" => changes_since(@params["since"].to_i)}
    end
    
    # Called when a client sends results to the server. Growls and adds to recent results array
    def results env
      puts @params
      puts "Results!"
      
      if @params["failures"].to_i == 0
        notify("All Tests Passed")
      else
        notify("#{@params['failures']} of #{@params['specsFinished']} Tests Failed")
      end
      
      @params
    end
    
    # Notifies of test passes/failures using Growl
    def notify message
      system('growlnotify -m "' + message + '"')
    end
    
    # Returns an array of all watched files that have changed since the given timestamp
    def changes_since(mtime)
      files = file_list.inject({}) {|m, f| m.merge({f => Kernel.const_get("File").mtime(f)})}
      
      changed_files = file_list.select { |file, last_changed|
        Kernel.const_get("File").mtime(file).to_i > mtime
      }
      
      scope_files(changed_files)
    end
    
    # prepends each file in an array with '../'
    def scope_files files
      files.collect {|f| "../#{f}"}
    end
    
    def file_list
      Dir["spec/models/*.js"].concat(Dir["spec/controllers/*.js"]) #.concat(Dir["spec/views/**/*.js"])
    end
  end
end

app = Rack::ExtMVCSpecServer.new
run app
