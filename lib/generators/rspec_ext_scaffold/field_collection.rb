class FieldCollection
  attr_accessor :fields
  
  FIELD_TYPES = %w(string integer boolean decimal datetime date text)
  
  def initialize args = []
    @fields = []
    
    args.each do |f|
      @fields << Field.new(f)
    end
  end
  
  def validates_presence
    @fields.select {|f| f.validates_presence}
  end
  
  def to_normal_args
    @fields.collect {|f| [f.field_name, f.field_type].join(":")}
  end
  
  def fields_by_type field_type
    @fields.select {|f| f.field_type == field_type}
  end
end
