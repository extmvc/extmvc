function defaultPagingGrid(config) {
  if (config.store == null) {alert("Error - no Store supplied to defaultPagingGrid"); return;};
  
  var options = {};
  Ext.apply(options, config, {
    model: Model,
    viewConfig: {forceFit: true},
    tbar: null,
    headings: [],
    clicksToEdit:1,
    loadMask: true,
    newAction: function() {},
    editAction: function() {},
    deleteAction: function() {},
    toggleEditableAction: function() {}
  });
  
  Ext.apply(options, {}, {
    title: options.model.human_plural_name,
    iconCls: 'grid_list',
    id: options.model.url_name + '_index',
    saveEditAction: function(event) {
      record = event.record;
      field = event.field;
      value = event.value;
      
      Ext.Ajax.request({
        url: '/admin/' + options.model.url_name + '/' + record.data.id + '.ext_json',
        method: 'post',
        params: "_method=put&" + options.model.underscore_name + "[" + field + "]=" + value,
        success: function() {
          //removes the red tick from the cell once the change has been saved
          record.commit();
        },
        failure: function() {
          Ext.Msg.alert(options.model.human_singular_name + ' NOT Updated', 'Something went wrong when trying to update this ' + options.model.human_singular_name + ' - please try again');
        }
      });
    }
  });
  
  if (options.editable) {
    this.columnModel = new Ext.grid.ColumnModel(options.headings);
  } else {
    this.columnModel = new Ext.grid.ColumnModel([new Ext.grid.CheckboxSelectionModel()].concat(options.headings));
  };
  
  this.columnModel.defaultSortable = true;
  this.columnModel.defaultWidth = 160;

  options.filters = new Ext.ux.grid.GridFilters({filters: options.headings});
  options.bbar = defaultPagingToolbar(options.store, {model: options.model.human_singular_name});
  options.plugins = [options.bbar, options.filters];
  options.cm = this.columnModel;
  
  if (options.editable) {
    this.grid = new Ext.grid.EditorGridPanel(options);
    this.grid.addListener('afteredit', options.saveEditAction);    
  } else {
    this.grid = new Ext.grid.GridPanel(options); 
  };
  
  options.controller = application.getControllerByName(this.model.controller_name);
  
  this.grid.handleKeypress = function(e) {
    if (options.searchField.hasFocus) { return false;};
    if(e.getKey() == Ext.EventObject.DELETE) {
      options.deleteAction();
    } else {
      var keyNum = e.getCharCode();
      switch (keyNum) {
        case 97: //a
          options.newAction();
          break;
        case 101: //e
          options.editAction();
          break;
        case 110: //n
          options.controller.nextPage(options.store);
          break;
        case 112: //p
          options.controller.previousPage(options.store);
          break;
        case 113:
          options.toggleEditableAction(options);
          break;
        case 114: //r
          options.store.reload();
          break;
        case 102: //f
          options.controller.firstPage(options.store);
          break;
        case 108: //l
          options.controller.lastPage(options.store);
          break;
        case 115: //s
          Ext.get(options.searchField.id).focus();
          break;
      }
    };
  };
  
  try {
    var start = Ext.state.Manager.getProvider().get(options.id).start || 0;
  } catch(e) {
    var start = 0;
  }
  
  this.grid.store.load({params: {start: start, limit: 25}});
  
  return this.grid;
}

function defaultPagingGridWithTopToolbar(config) {
  var options = {};
  
  Ext.apply(options, config, {
    model: Model,
    editable: false
  });
  
  options.toggleEditableAction = function(opts) {
    opts.editable = !opts.editable;
    controller = application.getControllerByName(this.model.controller_name);
    controller.viewIndex(opts)
  }
  
  options.newAction = function() {
    controller = application.getControllerByName(this.model.controller_name);
    controller.viewNew();
  };
  
  options.editAction = function() {
    var ids = new Array();
    selections = grid.getSelectionModel().getSelections();
    for (var i=0; i < selections.length; i++) {
      ids.push(selections[i].data.id);
    };
    
    controller = application.getControllerByName(this.model.controller_name);
    controller.viewEdit(ids);
  }
  
  options.deleteAction = function() {
    controller = application.getControllerByName(this.model.controller_name);
    controller.deleteSelected(grid);
  }
  
  newButton    = defaultAddButton   ({model: options.model, handler: options.newAction});
  editButton   = defaultEditButton  ({model: options.model, handler: options.editAction});
  deleteButton = defaultDeleteButton({model: options.model, handler: options.deleteAction});
  
  toggleEditableButton = new Ext.Toolbar.Button({
    text: 'Quick Edit Mode',
    enableToggle: true,
    iconCls: 'quick_edit',
    tooltip: {
      title: 'Quick Edit Mode',
      text: 'Quick edit mode turns the grid into a fully editable spreadsheet - just click into any cell to edit it.  Changes are saved as soon as you press enter, or discarded if you press escape.<br /><br />Click the Quick Edit button again to go back to normal mode.<br /><br />Keyboard shortcut: q'
    },
    pressed: options.editable
  });
  
  toggleEditableButton.on('click', function() {
    options.toggleEditableAction(options);
  });
  
  options.searchField = new Ext.app.SearchField({store: options.store, width:220});
  options.tbar = new Ext.Toolbar({
    items: ['Search by Name:', ' ', options.searchField, '-', newButton, '-', editButton, '-', deleteButton, '-', toggleEditableButton]
  });
  
  this.grid = defaultPagingGrid(options);
  
  if (!options.editable) {
    this.grid.getSelectionModel().on('selectionchange', function(selModel){
      if (this.grid.getSelectionModel().selections.length == 0) {
        editButton.disable();
        deleteButton.disable();
      } else {
        editButton.enable();
        deleteButton.enable();
      }
    }); 
  };
  
  this.grid.on('rowdblclick', options.editAction);
  
  return this.grid;
}