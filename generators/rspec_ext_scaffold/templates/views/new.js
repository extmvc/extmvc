<%= class_name %>NewPanel = function(config) {  
  form = new defaultNewForm(
    Ext.apply({}, config, {
    model: <%= class_name %>,
    iconCls: 'form_<%= file_name %>_new',
    labelAlign: 'top',
    items: <%= file_name %>FormFields
  }));
  
  return form;
};