//gives a simple default paging toolbar for the given store:
//e.g. suppliersPagingToolbar = defaultPagingToolbar(suppliersStore, {model_name: 'Supplier'});
function defaultPagingToolbar(store, config) {
  this.options = {};
  Ext.apply(this.options, config, {
    pageSize: 25,
    model_name: Model,
    nextText: 'Next Page (shortcut key: n)',
    prevText: 'Previous Page (shortcut key: p)',
    refreshText: 'Refresh (shortcut key: r)',
    firstText: 'First Page (shortcut key: f)',
    lastText: 'Last Page (shortcut key: l)',
    displayInfo: true,
    store: store,
    items: [new Ext.Toolbar.Fill]
  });
  
  Ext.apply(this.options, {}, {
    displayMsg: 'Displaying ' + this.model_name.human_plural_name + ' {0} - {1} of {2}',
    emptyMsg: 'No ' + this.model_name.human_plural_name + ' to display'
  });
  
  return new Ext.PagingToolbar(options);
}
