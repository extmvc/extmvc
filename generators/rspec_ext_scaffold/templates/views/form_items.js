var <%= file_name%>FormFields = [
<%- field_collection.fields.each do |f| -%>
  { 
    xtype: '<%= f.ext_field_type %>',
    fieldLabel: '<%= f.field_name.humanize %>', 
    name: '<%= file_name%>[<%= f.field_name %>]',
    id: '<%= f.field_name %>',
    anchor: "95%"
  }<%= ',' unless f == field_collection.fields.last %>
<%- end -%>
];