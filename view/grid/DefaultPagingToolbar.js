/**
 * Ext.ux.MVC.DefaultPagingToolbar
 * @extends Ext.PagingToolbar
 * Gives a simple default paging toolbar for a givenmodel:
 * e.g. myToolbar = new Ext.ux.MVC.DefaultPagingToolbar({model: MyModel})
 */
Ext.ux.MVC.DefaultPagingToolbar = function(config) {
  var config = config || {};
  
  if (!config.model) {
    throw new Error("You must supply a model to the DefaultPagingToolbar");
  };
  
  Ext.applyIf(config, {
    pageSize: 25,
    nextText: 'Next Page (shortcut key: n)',
    prevText: 'Previous Page (shortcut key: p)',
    refreshText: 'Refresh (shortcut key: r)',
    firstText: 'First Page (shortcut key: f)',
    lastText: 'Last Page (shortcut key: l)',
    displayInfo: true,
    store: config.model.collectionStore(),
    items: [new Ext.Toolbar.Fill],
    displayMsg: 'Displaying ' + config.model.human_plural_name + ' {0} - {1} of {2}',
    emptyMsg: 'No ' + config.model.human_plural_name + ' to display'
  });
  
  Ext.ux.MVC.DefaultPagingToolbar.superclass.constructor.call(this, config);
};
Ext.extend(Ext.ux.MVC.DefaultPagingToolbar, Ext.PagingToolbar);
Ext.reg('default_paging_toolbar', Ext.ux.MVC.DefaultPagingToolbar);