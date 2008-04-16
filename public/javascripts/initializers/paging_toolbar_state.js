// make paging toolbars save state
Ext.PagingToolbar.override({
  init : function (grid) {
    this.grid = grid;        
    this.grid.on("beforestatesave", this.saveState, this);    
    Ext.util.Observable.capture(grid.store, this.onStateChange, this);
  },
  saveState : function(grid, state) {
    state.start = grid.store.lastOptions.params.start;
  },
  onStateChange : function(ev, store, records, options) {
    if (ev == "load") {this.grid.saveState(); };
  }
});