CrudController = function(config) {
  Ext.apply(this, config);
  Ext.applyIf(this, {
    batchDestroyUrl : '/admin/batch_destroy_' + this.model.url_name + '.ext_json',
    deleteTitle     : function(number_of_items_to_delete) {
      if (number_of_items_to_delete > 1) {
        return "Delete " + this.model.human_plural_name + "?";
      } else {
        return "Delete " + this.model.human_singlular_name + "?";
      };
    },
    deleteMessage : function(number_of_items_to_delete) {
      if (number_of_items_to_delete > 1) {
        return "Are you sure you want to delete these " + this.model.human_plural_name + "? This cannot be undone";
      } else {
        return "Are you sure you want to delete this " + this.model.human_singular_name + "? This cannot be undone";
      };
    },
    deleteFailure : function() {
      Ext.Msg.alert(this.model.human_singular_name + ' not deleted', 'Something went wrong when trying to delete the ' + this.model.human_singular_name + ' - please try again');
    }
  });
  
  CrudController.superclass.constructor.call(this, config);
};

Ext.extend(CrudController, ApplicationController, {  
  viewIndex : function(options) {
    this.showPanel(new this.indexPanel(options));
  },
  
  viewNew : function(options) {
    this.showPanel(new this.newPanel(options));
  },
  
  viewEdit : function(ids) {
    if (ids.length == 0) {return false;};
    this.showPanel(new this.editPanel({ids: ids}));
  },
  
  nextPage : function(store) {
    this.nextOrPreviousPage(store, 'UP');
  },
  
  previousPage : function(store) {
    this.nextOrPreviousPage(store, 'DOWN');
  },
  
  firstPage : function(store) {
    store.load({params: {start: 0, limit: store.lastOptions.params.limit}});
  },
  
  lastPage : function(store) {
    limit = store.lastOptions.params.limit;
    lastPage = Math.floor((store.totalLength - 1) / limit) * limit;
    store.load({params: {start: lastPage, limit: limit}});
  },
  
  nextOrPreviousPage : function(store, direction) {
    var lastOpts = store.lastOptions.params;
    
    if (direction == 'UP') {
      if (lastOpts.start + lastOpts.limit < store.totalLength) {
        lastOpts.start = lastOpts.start + lastOpts.limit;
      }
    } else {
      if (lastOpts.start - lastOpts.limit >= 0) {
        lastOpts.start = lastOpts.start - lastOpts.limit;
      }
    };
    
    store.load({params: lastOpts});
  },
  
  deleteSelected : function(grid) {
    var ids = new Array();
    selections = grid.getSelectionModel().getSelections();
    for (var i=0; i < selections.length; i++) { ids.push(selections[i].data.id);};
    if (ids.length == 0) {return false;};
    
    var deleteTitle = this.deleteTitle(ids.length);
    var deleteMessage = this.deleteMessage(ids.length);
    var url = this.batchDestroyUrl;
    
    Ext.Msg.confirm(deleteTitle, deleteMessage, function(btn) {
      if (btn == 'yes') {
        Ext.Ajax.request({
          url: url,
          method: 'post',
          params: "_method=delete&ids=" + ids.join(","),
          success: function() {
            grid.store.reload();
          },
          failure: function() {
            this.deleteFailure();
            grid.store.reload();
          }
        });
      };
    });
  }
  
});