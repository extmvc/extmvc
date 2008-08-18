/**
 * Ext.ux.MVC.DefaultCSVExportButton
 * @extends Ext.Toolbar.Button
 * Simple set of sensible defaults for a CSV Export button
 * @cfg {Ext.ux.MVC.model} model The model this button is for (optional - used for tooltip)
 */
Ext.ux.MVC.DefaultCSVExportButton = function(config) {
  var config = config || {};
  
  if (!config.model) {
    throw new Error("You must supply a model to DefaultDeleteButton");
  };
  
  Ext.applyIf(config, {
    text: 'Export as CSV',
    iconCls: 'page_white_excel'
  });
  
  if (config.model) {
    var model_name = config.model.human_plural_name;
    
    Ext.applyIf(config, {
      tooltip: 'Export all selected ' + model_name + ' to a CSV file.  If no ' + model_name + ' are selected, all will be exported to a single file.'
    });    
  };
  
  Ext.ux.MVC.DefaultCSVExportButton.superclass.constructor.call(this, config);
};
Ext.extend(Ext.ux.MVC.DefaultCSVExportButton, Ext.Toolbar.Button);
Ext.reg('default_csv_export_button', Ext.ux.MVC.DefaultCSVExportButton);