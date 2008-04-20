class ExtFilterConditionsParser
  
  attr_accessor :conditions, :condition_string
  
  def initialize filter_params, extra_conditions = nil
    @conditions = []
    filter_params ||= {}
    
    filter_params.each_pair do |index, condition|
      @conditions.push(ExtFilterConditionsParser.send("parse_" + condition["data"]["type"], condition))
    end
    
    if extra_conditions.is_a? String
      @conditions += [extra_conditions]
    elsif extra_conditions.is_a? Array
      @conditions += extra_conditions
    end
    
    @condition_string = @conditions.join(" AND ")
  end
  
  def self.parse_string condition
    ActiveRecord::Base.send('sanitize_sql', ["#{escape_field_name(condition['field'])} LIKE ?", "%#{condition['data']['value']}%"])
  end
  
  def self.parse_numeric condition
    ActiveRecord::Base.send('sanitize_sql', ["#{escape_field_name(condition['field'])} #{decode_comparison_operator(condition['data']['comparison'])} ?", 
                                             condition['data']['value'].to_i])
  end
  
  def self.parse_boolean condition
   "#{escape_field_name(condition['field'])} IS #{condition['data']['value'] == 'true' ? 'TRUE' : 'FALSE'}"
  end
  
  def self.parse_list condition
    ActiveRecord::Base.send('sanitize_sql', ["#{escape_field_name(condition['field'])} IN (?)", condition['data']['value'].split(",")])
  end
  
  def self.parse_date condition
    ActiveRecord::Base.send('sanitize_sql', ["#{escape_field_name(condition['field'])} #{decode_comparison_operator(condition['data']['comparison'])} ?", 
                                             condition['data']['value'].to_date])
  end
  
  def self.escape_field_name field_name
    "`#{field_name.gsub(/[^a-zA-Z0-9_]/, "")}`"
  end
  
  def self.decode_comparison_operator operator
    case operator
      when "lt" : "<"
      when "gt" : ">"
      else "="
    end
  end
end
