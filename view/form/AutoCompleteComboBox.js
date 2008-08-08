/**
 * Ext.ux.MVC.view.AutoCompleteComboBox
 * @extends Ext.form.ComboBox
 */
Ext.ux.MVC.view.AutoCompleteComboBox = function(config) {
  var config = config || {};
  
  Ext.applyIf(config, {
    name: config.model.model_name + '[' + config.id +']',
    fieldLabel: config.id,
    displayField: config.id,
    mode: 'local',
    selectOnFocus: true,
    typeAhead: true,
    triggerAction: 'all',
    autoLoad: true
  });
  
  Ext.ux.MVC.view.AutoCompleteComboBox.superclass.constructor.call(this, config);
  
  if (config.autoLoad) {
    this.store.load();
  };
};
Ext.extend(Ext.ux.MVC.view.AutoCompleteComboBox, Ext.form.ComboBox);
Ext.reg('autocomplete_combo_box', Ext.ux.MVC.view.AutoCompleteComboBox);
