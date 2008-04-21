<%= class_name %>EditPanel = function(config) {
  form = new defaultEditForm(
    Ext.apply({}, config, {
      model: <%= class_name %>,
      iconCls: 'form_<%= file_name %>_edit',
      labelAlign: 'top',
      items: putMethodField.concat(<%= file_name %>FormFields)
    })
  );
  
  <%= class_name %>.loadFormWithId(config.ids[0], form);
  
  return form;
}