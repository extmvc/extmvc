var <%= file_name%>FormFields = [
<%- field_collection.fields.each do |f| -%><%-   if f.field_type == 'boolean' %>
  { 
    xtype: '<%= f.ext_field_type %>',
    fieldLabel: '<%= f.field_name.humanize %>', 
    name: '<%= file_name%>[<%= f.field_name %>]',
    id: '<%= f.field_name %>',
    anchor: "95%",
    inputValue: '1'
  },
  {
    xtype: 'hidden',
    name: '<%= file_name%>[<%= f.field_name %>]',
    value: '0'
  }<%= ',' unless f == field_collection.fields.last %>
<%-   else %>
  { 
    xtype: '<%= f.ext_field_type %>',
    fieldLabel: '<%= f.field_name.humanize %>', 
    name: '<%= file_name%>[<%= f.field_name %>]',
    id: '<%= f.field_name %>',
    anchor: "95%"
  }<%= ',' unless f == field_collection.fields.last %>
<%-   end -%><%- end -%>
];