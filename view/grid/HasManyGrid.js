/**
 * Ext.ux.MVC.view.HasManyGrid
 * @extends Ext.ux.MVC.view.DefaultPagingGridWithTopToolbar
 * Provides a simple has_many grid for any given model
 */
Ext.ux.MVC.view.HasManyGrid = function(config) {
  var config = config || {};
  if (!config.model)          {alert("You didn't provide a model to your Has Many Grid class"); return false; };
  // if (!config.has_many_model) {alert("You didn't provide a has_many_model to your Has Many Grid class"); return false; };
  
  Ext.applyIf(config, {
    title: config.model.human_plural_name,
    frame: false,
    height: 300,
    autoLoadStore: false,
    displayToggleEditableButton: false,
    newAction: function() {
      controller = application.getControllerByName(config.model.controller_name);
      controller.viewNew(Ext.applyIf(config.parent_ids, {id: config.id}));
    },
    store: config.model.collectionStore(config.parent_ids)
  });
  
  Ext.ux.MVC.view.HasManyGrid.superclass.constructor.call(this, config);
};
Ext.extend(Ext.ux.MVC.view.HasManyGrid, Ext.ux.MVC.view.DefaultPagingGridWithTopToolbar);
Ext.reg('has_many_grid', Ext.ux.MVC.view.HasManyGrid);