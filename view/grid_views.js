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
    viewConfig: {forceFit: true},
    tbar: null,
    autoLoadStore: true,
    headings: [],
    clicksToEdit: 1,
    loadMask: true
  });
  
  //set default actions if they are not supplied
  Ext.applyIf(config, {
    title: config.model.human_plural_name,
    iconCls: 'grid_list',
    id: config.model.url_name + '_index',
    store: config.model.collectionStore(),
    saveEditAction: function(event) {
      record = event.record;
      field = event.field;
      value = event.value;
      
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
  
  if (config.editable) {
    this.columnModel = new Ext.grid.ColumnModel(config.headings);
  } else {
    sm = new Ext.grid.CheckboxSelectionModel();
    config.sm = sm;
    this.columnModel = new Ext.grid.ColumnModel([sm].concat(config.headings));
  };
  
  this.columnModel.defaultSortable = true;
  this.columnModel.defaultWidth = 160;

  config.filters = new Ext.ux.grid.GridFilters({filters: config.headings});
  config.bbar = defaultPagingToolbar(config.store, {model: config.model});
  config.plugins = [config.bbar, config.filters];
  config.cm = this.columnModel;
  
  //TODO: WORK OUT HOW TO DO THIS...
  // if (options.editable) {
  //   this.grid = new Ext.grid.EditorGridPanel(options);
  //   this.grid.addListener('afteredit', options.saveEditAction);    
  // } else {
  //   this.grid = new Ext.grid.GridPanel(options); 
  // };
  
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
    topToolbarButtonsAfter: [],
    displaySearchByName: true,
    displayAddButton: true,
    displayEditButton: true,
    displayDeleteButton: true,
    displayToggleEditableButton: false
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
  
  //set up the buttons for the grid
  var bh = Ext.ux.MVC.helper.button; //local button helpers reference to avoid RSI...
  this.addButton    = new bh.DefaultAddButton({   model: config.model, handler: config.newAction});
  this.editButton   = new bh.DefaultEditButton({  model: config.model, handler: config.editAction,   scope: this});
  this.deleteButton = new bh.DefaultDeleteButton({model: config.model, handler: config.deleteAction, scope: this});
  
  toggleEditableButton = new Ext.Toolbar.Button({
    text: 'Quick Edit Mode',
    enableToggle: true,
    iconCls: 'quick_edit',
    tooltip: {
      title: 'Quick Edit Mode',
      text: 'Quick edit mode turns the grid into a fully editable spreadsheet - just click into any cell to edit it.  Changes are saved as soon as you press enter, or discarded if you press escape.<br /><br />Click the Quick Edit button again to go back to normal mode.<br /><br />Keyboard shortcut: q'
    },
    pressed: config.editable
  });
  
  toggleEditableButton.on('click', function() { config.toggleEditableAction(config);});
  
  //set up the top toolbar
  topToolbarButtons = [];
  if (config.displaySearchByName) {
    config.searchField = new Ext.app.SearchField({store: this.store, width:220});
    topToolbarButtons = topToolbarButtons.concat(['Search by Name:', ' ', config.searchField]);
  };

  topToolbarButtons = topToolbarButtons.concat(config.topToolbarButtonsBefore);
  if (config.displayAddButton) {
    topToolbarButtons = topToolbarButtons.concat(['-', this.addButton]);
  };
  if (config.displayEditButton) {
    topToolbarButtons = topToolbarButtons.concat(['-', this.editButton]);
  };
  if (config.displayDeleteButton) {
    topToolbarButtons = topToolbarButtons.concat(['-', this.deleteButton]);
  };
  if (config.displayToggleEditableButton) {
    topToolbarButtons = topToolbarButtons.concat(['-', toggleEditableButton]);
  };
  topToolbarButtons = topToolbarButtons.concat(config.topToolbarButtonsAfter);
  config.tbar = new Ext.Toolbar({ items: topToolbarButtons });
  
  Ext.ux.MVC.view.DefaultPagingGridWithTopToolbar.superclass.constructor.call(this, config);
  
  //this.store is only instantiated after calling the constructor, so need to give it a reference here
  //TODO: This smells, there is probably a better way
  if (config.displaySearchByName) {
    config.searchField.store = this.store;
  };
  
  if (!config.editable) {
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
  
  this.on('rowdblclick', config.editAction);
  
};
Ext.extend(Ext.ux.MVC.view.DefaultPagingGridWithTopToolbar, Ext.ux.MVC.view.DefaultPagingGrid);
Ext.reg('default_paging_grid_with_top_toolbar', Ext.ux.MVC.view.DefaultPagingGridWithTopToolbar);


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