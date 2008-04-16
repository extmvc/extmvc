var ApplicationController = {
  
  displayPanel : function(newContent) {
    mainPanel.remove(mainPanel.items.first(), true);
    mainPanel.add(newContent);
    mainPanel.doLayout();
  },
  
  displayPanelFromModelAndKeyword : function(class_name, keyword, options) {
    if (options == null) { var options = {};};
    var view = eval("new " + this.newPanelTypeFromModelAndKeyword(class_name, keyword) + "(" + Ext.util.JSON.encode(options) + ");");
    this.displayPanel(view);
  },
  
  viewIndex : function(options) {
    return this.displayPanelFromModelAndKeyword(this.class_name, 'Index', options)
  },
  
  viewNew : function(options) {
    return this.displayPanelFromModelAndKeyword(this.class_name, 'New', options)
  },
  
  viewEdit: function(grid) {
    var ids = new Array();
    selections = grid.getSelectionModel().getSelections();
    for (var i=0; i < selections.length; i++) {
      ids.push(selections[i].data.id);
    };
    
    if (ids.length == 0) {return false;};
    this.displayPanelFromModelAndKeyword(this.class_name, 'Edit', {ids: ids})
  },
  
  deleteSelected : function(store, grid) {
    var ids = new Array();
    selections = grid.getSelectionModel().getSelections();
    for (var i=0; i < selections.length; i++) { ids.push(selections[i].data.id);};
    if (ids.length == 0) {return false;};
    
    var deleteTitle = this.deleteTitle(ids.length);
    var deleteMessage = this.deleteMessage(ids.length);
    var url = this.batchDestroyUrl();
    
    Ext.Msg.confirm(deleteTitle, deleteMessage, function(btn) {
      if (btn == 'yes') {
        Ext.Ajax.request({
          url: url,
          method: 'post',
          params: "_method=delete&ids=" + ids.join(","),
          success: function() {
            store.reload();
          },
          failure: function() {
            this.deleteFailure();
            store.reload();
          }
        });
      };
    });
  },
  
  storeGoToPage : function(store, page) {
    
  },
  
  storeNextOrPreviousPage : function(store, direction) {
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
  
  storeFirstPage : function(store) {
    store.load({params: {start: 0, limit: store.lastOptions.params.limit}});
  },
  
  storeLastPage : function(store) {
    limit = store.lastOptions.params.limit;
    lastPage = Math.floor((store.totalLength - 1) / limit) * limit;
    store.load({params: {start: lastPage, limit: limit}});
  },
  
  //private
  batchDestroyUrl : function() {
    return '/admin/batch_destroy_' + this.model_name + 's.ext_json';
  },
  
  deleteTitle : function(number_of_items_to_delete) {
    if (number_of_items_to_delete > 1) {
      return "Delete " + this.human_name + "s?";
    } else {
      return "Delete " + this.human_name + "?";
    };
  },
  
  deleteMessage : function(number_of_items_to_delete) {
    if (number_of_items_to_delete > 1) {
      return "Are you sure you want to delete these " + this.human_name + "s? This cannot be undone";
    } else {
      return "Are you sure you want to delete this " + this.human_name + "? This cannot be undone";
    };
  },
  
  deleteFailure : function() {
    Ext.Msg.alert(this.human_name + ' not deleted', 'Something went wrong when trying to delete those ' + this.human_name + 's - please try again');
  },
  
  newPanelTypeFromModelAndKeyword : function(class_name, keyword) {
    return class_name + keyword + 'Panel';
  },
  
  getControllerFromModelName : function(model_name) {
    switch (model_name) {
      case 'Supplier' : return SuppliersController;  break;
      case 'User'     : return UsersController;      break;
      case 'Category' : return CategoriesController; break;
      case 'Page'     : return PagesController;      break;
      case 'Video'    : return VideosController;     break;
      case 'Feedback' : return FeedbacksController;  break;
    }
  }
}