/**
 * Ext.ux.MVC.view.InPlaceHasManyGrid
 * @extends Ext.ux.MVC.view.DefaultPagingGridWithTopToolbar
 * Provides a has_many grid for very simple has_many relationships to allow
 * addition of new relations without leaving the grid
 */
Ext.ux.MVC.view.InPlaceHasManyGrid = function(config) {
  var config = config || {};
  
  Ext.applyIf(config, {
    
  });
  
  Ext.ux.MVC.view.InPlaceHasManyGrid.superclass.constructor.call(this, config);
};
Ext.extend(Ext.ux.MVC.view.InPlaceHasManyGrid, Ext.ux.MVC.view.DefaultPagingGridWithTopToolbar);
Ext.reg('in_place_has_many_grid', Ext.ux.MVC.view.InPlaceHasManyGrid);