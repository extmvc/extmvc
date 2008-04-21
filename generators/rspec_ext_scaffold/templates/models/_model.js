var <%= class_name %>Record = Ext.data.Record.create([
  { name: 'id', type: 'int'},
<%= field_collection.fields.collect {|f| "  { name: '#{f.field_name}', type: 'string'}"}.join(",\n") %>
]);

var <%= file_name %>Reader = new Ext.data.JsonReader({root: '<%= table_name %>',totalProperty: 'results'}, <%= class_name %>Record);
var <%= class_name %> = {model_name : '<%= file_name %>'};
Ext.apply(<%= class_name %>, Model);
<%= class_name %>.init();