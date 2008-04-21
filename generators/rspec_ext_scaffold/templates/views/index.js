<%= class_name %>IndexPanel = function(options) {
  headings = [
<%= field_collection.fields.collect {|f| "    { header: '#{f.field_name.humanize}', dataIndex: '#{f.field_name}', type: 'string', editor: new Ext.form.TextField({allowBlank: #{f.validates_presence ? 'false' : 'true'}})}"}.join(",\n") %>
  ];
  
  var grid = defaultPagingGridWithTopToolbar(
    Ext.apply({}, options, {
      model: <%= class_name %>, 
      store: <%= class_name %>.collectionStore(), 
      headings: headings
    })
  );
  
  return grid;
};