/**
 * Ext.ux.MVC.view.LocalComboBox
 * @extends Ext.view.ComboBox
 * @cfg {Ext.ux.MVC.model.Base} model The model to attach the combo box to
 * @cfg {Int} id The id of the field to attach the combo box to
 * @cfg {Ext.data.Store} The store to take combobox values from
 *
 * Example Usage:
 * <pre><code>
new Ext.ux.MVC.view.LocalComboBox({
  model: Page,
  id: 'section_id',
  store: someStore
})

Is equivalent to:
new Ext.view.ComboBox({
  mode: local,
  store: someStore,
  id: 'section_id',
  name: 'page[section_id],
  hiddenName: 'page[section_id]',
  displayField: 'human_name',
  valueField: 'class_name',
  fieldLabel: 'section_id',
  forceSelection: true,
  triggerAction: 'all',
  anchor: "95%"
})
</code></pre>
*/
Ext.ux.MVC.view.LocalComboBox = function(config) {
  var config = config || {};
  
  Ext.applyIf(config, {
    mode: 'local',
    displayField: 'human_name',
    valueField: 'class_name',
    triggerAction: 'all',
    forceSelection: true,
    anchor: "95%"
  });
  
  Ext.applyIf(config, {
    name: config.model.model_name + '[' + config.id + ']',
    hiddenName: config.model.model_name + '[' + config.id + ']',
    fieldLabel: config.id
  });
  
  Ext.ux.MVC.view.LocalComboBox.superclass.constructor.call(this, config);
};
Ext.extend(Ext.ux.MVC.view.LocalComboBox, Ext.form.ComboBox);
Ext.reg('local_combo_box', Ext.ux.MVC.view.LocalComboBox);
