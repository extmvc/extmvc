class Field
  
  attr_accessor :validates_presence, :field_name, :field_type
  attr_accessor :config
    
  def initialize config
    @config = config.split(":")
    
    @field_name = @config.shift
    @field_type = @config.shift
    
    @validates_presence = @config.delete('vp') ? true : false #.include?('vp')
  end
  
  def ext_field_type
    case @field_type
    when 'text' : 'textarea'
    when 'boolean' : 'checkbox'
    else 'textfield'
    end
  end
  
end