/**
 * Ext.ux.MVC.helper.grid.SearchFilter
 * @extends Ext.form.ComboBox
 * Description
 */
Ext.ux.MVC.helper.grid.SearchFilter = function(config) {
  var config = config || {};
  
  Ext.applyIf(config, {
    mode: 'remote',
    triggerAction: 'all',
    pageSize: 1000,
    width: 220
  });
  
  Ext.ux.MVC.helper.grid.SearchFilter.superclass.constructor.call(this, config);

  this.on('beforeselect', function(combo, record, index){
    if (this.gridStore) {
      var v = record.data.id;
      var o = {start: 0, limit: 15};
      this.gridStore.baseParams = this.gridStore.baseParams || {};
      this.gridStore.baseParams[this.paramName] = v;
      this.gridStore.reload({params:o});
    };
  });
};
Ext.extend(Ext.ux.MVC.helper.grid.SearchFilter, Ext.form.ComboBox);
Ext.reg('grid_search_filter', Ext.ux.MVC.helper.grid.SearchFilter);