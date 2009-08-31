module ExtMVC
  class AllBuilder < Builder
    def self.instances(args = [])
      # set defaults
      args = ['app', 'css', 'plugin', 'mvc'] if args.empty?      
      instances = []

      args.each {|builderName| instances.concat(ExtMVC::BuilderManager.instances_for(builderName, []))}
      
      return instances
    end
  end
end