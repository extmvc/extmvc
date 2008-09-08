/**
 * Ext.ux.MVC.view.DefaultPagingGrid
 * @extends Ext.grid.GridPanel
 * Provides a simple default paging grid for any model
 */
Ext.ux.MVC.view.DefaultPagingGrid = function(config) {
  var config = config || {};
  if (config.model == null) {alert("Error - no Model supplied to DefaultPagingGrid"); return false;};
  
  //set a few default properties
  Ext.applyIf(config, {
    viewConfig: {
      forceFit: true
    },
    
    tbar:                null,
    changeDocumentTitle: true,
    autoLoadStore:       true,
    loadMask:            true,
    headings:            [],
    clicksToEdit:        1
  });
  
  //set default actions if they are not supplied
  Ext.applyIf(config, {
    iconCls: 'grid_list',
    title:   config.model.human_plural_name,
    id:      config.model.url_name + '_index',
    store:   config.model.collectionStore(),
    
    saveEditAction: function(event) {
      var record = event.record;
      var field  = event.field;
      var value  = event.value;
      
      Ext.Ajax.request({
        url: config.model.singleDataUrl(record),
        method: 'post',
        params: "_method=put&" + config.model.underscore_name + "[" + field + "]=" + value,
        success: function() {
          //removes the red tick from the cell once the change has been saved
          record.commit();
        },
        failure: function() {
          Ext.Msg.alert(config.model.human_singular_name + ' NOT Updated', 'Something went wrong when trying to update this ' + config.model.human_singular_name + ' - please try again');
        }
      });
    }
  });
  
  this.store = config.store;
  
  this.sm = config.sm = new Ext.grid.CheckboxSelectionModel();
  this.columnModel = new Ext.grid.ColumnModel([this.sm].concat(config.headings));
  
  this.columnModel.defaultSortable = true;
  this.columnModel.defaultWidth = 160;

  config.filters = new Ext.ux.grid.GridFilters({filters: config.headings});
  config.bbar    = new Ext.ux.MVC.DefaultPagingToolbar({store: config.store, model: config.model});
  config.plugins = [config.bbar, config.filters];
  config.cm      = this.columnModel;

  config.controller = application.getControllerByName(config.model.controller_name);
  
  //set up key handlers
  //TODO: need a more elegant way of overriding/disabling this
  this.handleKeypress = function(e) {
    if (config.searchField.hasFocus) { return false;};
    if(e.getKey() == Ext.EventObject.DELETE) {
      config.deleteAction();
    } else {
      var keyNum = e.getCharCode();
      switch (keyNum) {
        case 97: //a
          config.newAction();
          break;
        case 101: //e
          config.editAction();
          break;
        case 110: //n
          config.controller.nextPage(config.store);
          break;
        case 112: //p
          config.controller.previousPage(config.store);
          break;
        case 113:
          config.toggleEditableAction(config);
          break;
        case 114: //r
          config.store.reload();
          break;
        case 102: //f
          config.controller.firstPage(config.store);
          break;
        case 108: //l
          config.controller.lastPage(config.store);
          break;
        case 115: //s
          Ext.get(config.searchField.id).focus();
          break;
      }
    };
  };
  
  Ext.ux.MVC.view.DefaultPagingGrid.superclass.constructor.call(this, config);
  
  if (config.changeDocumentTitle) {
    document.title = "View " + config.model.human_plural_name;
  };
  
  //attempt to retrieve state to keep on the same page we were on last time
  //TODO: refactor this out of here, should be an initializer like the paging toolbar one
  try {
    var start = Ext.state.Manager.getProvider().get(config.id).start || 0;
  } catch(e) {
    var start = 0;
  }
  
  if (config.autoLoadStore) {
    this.store.load({params: {start: start, limit: 25}});    
  };  
  
};
Ext.extend(Ext.ux.MVC.view.DefaultPagingGrid, Ext.grid.GridPanel);
Ext.reg('default_paging_grid', Ext.ux.MVC.view.DefaultPagingGrid);


/**
 * Ext.ux.MVC.view.DefaultPagingGridWithTopToolbar
 * @extends Ext.ux.MVC.view.DefaultPagingGrid
 * Provides a fully featured searchable, paginated grid for any model
 */
Ext.ux.MVC.view.DefaultPagingGridWithTopToolbar = function(config) {
  var config = config || {};
  
  if (!config.model) {
    alert("You didn't provide a model in your Default Paging Grid With Top Toolbar class");
    return false;
  };
  
  // Set some default properties...
  Ext.applyIf(config, {
    editable: false,
    topToolbarButtonsBefore: [],
    topToolbarButtonsAfter:  [],
    
    displaySearchByName:     true,
    displayAddButton:        true,
    displayEditButton:       true,
    displayDeleteButton:     true,
    displayCSVExportButton:  false
  });
  
  //add default actions if they are not passed in constructor config
  Ext.applyIf(config, {
    toggleEditableAction : function(opts) {
      opts.editable = !opts.editable;
      controller = application.getControllerByName(config.model.controller_name);
      controller.viewIndex(opts);
    },
    
    newAction : function() {
      Ext.History.add(this.model.newUrl());
    },
    
    editAction : function() {
      var ids = new Array();
      selections = this.getSelectionModel().getSelections();
      for (var i=0; i < selections.length; i++) {
        ids.push(selections[i].data.id);
      };
      
      Ext.History.add(config.model.editUrl(ids.join(",")));
    },
    
    deleteAction : function() {
      controller = application.getControllerByName(config.model.controller_name);
      controller.deleteSelected(this);
    }
  });
    
  //set up the top toolbar
  var topToolbarButtons = [];
  if (config.displaySearchByName) {
    config.searchField = new Ext.app.SearchField({store: this.store, width:220});
    topToolbarButtons = topToolbarButtons.concat(['Search by Name:', ' ', config.searchField]);
  };

  topToolbarButtons = topToolbarButtons.concat(config.topToolbarButtonsBefore);
  if (config.displayAddButton) {
    this.addButton = new Ext.ux.MVC.DefaultAddButton({
      model: config.model, 
      handler: config.newAction
    });
    
    topToolbarButtons = topToolbarButtons.concat(['-', this.addButton]);
  };
  
  if (config.displayEditButton) {
    this.editButton = new Ext.ux.MVC.DefaultEditButton({
      model: config.model,
      handler: config.editAction,
      scope: this
    });
    
    topToolbarButtons = topToolbarButtons.concat(['-', this.editButton]);
  };
  
  if (config.displayDeleteButton) {
    this.deleteButton = new Ext.ux.MVC.DefaultDeleteButton({
      model: config.model,
      handler: config.deleteAction,
      scope: this
    });
    
    topToolbarButtons = topToolbarButtons.concat(['-', this.deleteButton]);
  };
  
  if (config.displayCSVExportButton) {
    this.csvExportButton = new Ext.ux.MVC.DefaultCSVExportButton({
      xtype: 'default_csv_export_button',
      model: config.model,
      scope: this
    });
    
    topToolbarButtons = topToolbarButtons.concat(['-', this.csvExportButton]);
  };

  topToolbarButtons = topToolbarButtons.concat(config.topToolbarButtonsAfter);
  config.tbar = new Ext.Toolbar({ items: topToolbarButtons });
  
  Ext.ux.MVC.view.DefaultPagingGridWithTopToolbar.superclass.constructor.call(this, config);
  
  //this.store is only instantiated after calling the constructor, so need to give it a reference here
  //TODO: This smells, there is probably a better way
  if (config.displaySearchByName) {
    config.searchField.store = this.store;
  };
  
  this.on('rowdblclick', config.editAction);
  
  this.getSelectionModel().on('selectionchange', function(selModel){
    if (selModel.selections.length == 0) {
      this.editButton.disable();
      this.deleteButton.disable();
    } else {
      this.editButton.enable();
      this.deleteButton.enable();
    }
  }, this); 
};
Ext.extend(Ext.ux.MVC.view.DefaultPagingGridWithTopToolbar, Ext.ux.MVC.view.DefaultPagingGrid);
Ext.reg('default_paging_grid_with_top_toolbar', Ext.ux.MVC.view.DefaultPagingGridWithTopToolbar);
