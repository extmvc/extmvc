/**
 * Ext.ux.MVC.view.LiveSearchComboBox
 * @extends Ext.form.ComboBox
 * Provides a combo box with live search
 */
Ext.ux.MVC.view.LiveSearchComboBox = function(config) {
  var config = config || {};
  
  Ext.applyIf(config, {
    typeAhead: false,
    loadingText: 'Searching...',
    pageSize: 10,
    anchor: "95%",
    autoLoad: true,
    minChars: 2
  });
  
  Ext.ux.MVC.view.LiveSearchComboBox.superclass.constructor.call(this, config);
  
  //FIXME: For some reason passing 'this' as scope to the store.on('load') function below
  //screws everything up.  The first time the combo is rendered it's fine, but subsequent times
  //seem to maintain a reference to 'this', and use the same getValue() result every time
  tempCombo = this;

  this.store.on('load', function(store, records, index) {
    tempCombo.setValue(tempCombo.getValue());
  });
  
  if (config.autoLoad) {
    tempCombo.store.load();
  };
};
Ext.extend(Ext.ux.MVC.view.LiveSearchComboBox, Ext.form.ComboBox);
Ext.reg('live_search_combo_box', Ext.ux.MVC.view.LiveSearchComboBox);
