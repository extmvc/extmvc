class <%= migration_name %> < ActiveRecord::Migration
  def self.up
    create_table "<%= table_name %>", :force => true do |t|
<%- FieldCollection::FIELD_TYPES.each do |field_type| -%><%-   unless field_collection.fields_by_type(field_type).empty? -%>
      t.<%= field_type %> <%= field_collection.fields_by_type(field_type).collect {|f| ":#{f.field_name}"}.join(", ") %><%-   end -%><%- end -%>
<% unless options[:skip_timestamps] %>
      t.timestamps
<%- end -%>
    end
  end

  def self.down
    drop_table "<%= table_name %>"
  end
end
