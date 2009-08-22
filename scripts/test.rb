module ExtMVC
  class Test
    def self.dispatch
      environment = ExtMVC.mvc_production_environment
      
      system("rackup vendor/mvc/scripts/testserver.ru -p 5000")
    end
  end
end
