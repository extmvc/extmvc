/**
 * Ext.ux.MVC.view.HabtmGrid
 * @extends Ext.grid.GridPanel
 * @cfg {Ext.ux.MVC.model.Base} model The model you want to associate from with habtm
 * @cfg {Ext.ux.MVC.model.Base} habtm_model The model you want to assocate with the model
 * @cfg {String} form_field_id The id of the hidden field to create which store the comma separated values
 * Provides support for Has and Belongs to Many associations (many to many relationships)
 * between any two models.  The grid will load the a collection of habtm_model with tick
 * boxes by each row.  A hidden form field is maintained with a comma separated list of
 * the ticked boxes, and is updated each time a row is ticked or unticked
 */
Ext.ux.MVC.view.HabtmGrid = function(config) {
  var config = config || {};
  if (!config.model)       {alert("You didn't provide a model to your HABTM Grid class"); return false; };
  if (!config.habtm_model) {alert("You didn't provide a habtm_model to your HABTM Grid class"); return false; };
  
  this.selectionModel = new Ext.grid.CheckboxSelectionModel();
  
  Ext.applyIf(config, {
    store: config.habtm_model.collectionStore(),
    title: config.habtm_model.human_plural_name,
    height: 400,
    loadMask: true,
    viewConfig: {forceFit: true},
    sm: this.selectionModel,
    columns: [this.selectionModel].concat(config.headings),
    autoLoadStore: false,
    id: config.model.model_name + '_habtm_' + config.habtm_model.model_name + '_grid'
  });
  
  Ext.ux.MVC.view.HabtmGrid.superclass.constructor.call(this, config);
  
  //updates the form_field_id's rawValue whenever rows are selected/deselected
  function updateFormField(selModel) {
    records = selModel.getSelections();
    
    //build an array of the IDs of the ticked rows
    ids = new Array();
    for (var i = records.length - 1; i >= 0; i--){
      ids.push(records[i].data.id);
    };
    
    //update the form field's rawValue
    Ext.getCmp(config.form_field_id).setRawValue(ids.join(","));
  };
  
  this.selectionModel.on('rowselect', updateFormField);
  this.selectionModel.on('rowdeselect', updateFormField);
  
  //callback to tick the relevant boxes after a set of data is loaded
  config.store.on('load', function(store) {
    //grab an array of the IDs which should be ticked
    ids = Ext.getCmp(config.form_field_id).getRawValue().split(",");
    records = store.data.items;
    selected_records = new Array();
    
    //must suspend events to stop this automatically updating the hidden field
    this.selectionModel.suspendEvents();
    
    //TODO: this is pretty gruesome
    // find an array of all records in the grid which should be ticked
    for (var i = records.length - 1; i >= 0; i--){
      for (var j = ids.length - 1; j >= 0; j--){
        if (ids[j] == records[i].data.id) {
          selected_records.push(records[i]);
        };
      };
    };
    
    // tick the boxes of the related categories
    try {
      this.selectionModel.selectRecords(selected_records);
      this.selectionModel.resumeEvents();
    } catch(e) {}
  }, this);
  
  if (config.autoLoadStore) {
    config.store.load({params: {start: 0, limit: 1000}});
  };
};
Ext.extend(Ext.ux.MVC.view.HabtmGrid, Ext.grid.GridPanel);
Ext.reg('habtm_grid', Ext.ux.MVC.view.HabtmGrid);
