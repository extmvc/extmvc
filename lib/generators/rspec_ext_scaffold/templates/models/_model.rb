class <%= class_name %> < ActiveRecord::Base
  <%- unless field_collection.validates_presence.empty? -%>
  validates_presence_of <%= field_collection.validates_presence.collect {|f| ":#{f.field_name}"}.join(", ") %>
  <%- end -%>
end