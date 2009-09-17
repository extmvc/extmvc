/**
 * @class ExtMVC.view.scaffold.Index
 * @extends Ext.grid.GridPanel
 * A default index view for a scaffold (a paging grid with double-click to edit)
 */
// ExtMVC.view.scaffold.Index = Ext.extend(Ext.grid.GridPanel, {
ExtMVC.registerView('scaffold', 'index', {
  xtype        : 'grid',
  registerXType: 'scaffold_grid',

  constructor: function(config) {
    config = config || {};

    this.model = config.model;
    
    if (this.model == undefined) throw new Error("No model supplied to scaffold Index view");
    
    this.controller = this.controller || config.controller;
    
    //we can't put these in applyIf block below as the functions are executed immediately
    if (config.columns == undefined && config.colModel == undefined && config.cm == undefined) {
      config.columns = this.buildColumns(this.model);
    }
    config.store   = config.store   || this.model.find();
    
    Ext.applyIf(config, {
      viewConfig: { forceFit: true },
      id:         String.format("{0}_index", this.model.prototype.tableName),

      loadMask: true,
      
      /**
       * @property dblClickToEdit
       * @type Boolean
       * True to edit a record when it is double clicked (defaults to true)
       */
      dblClickToEdit: true
    });

    Ext.grid.GridPanel.prototype.constructor.call(this, config);
    
    this.initListeners();
  },
  
  initComponent: function() {
    var tbarConfig = this.hasTopToolbar    ? this.buildTopToolbar()              : null;
    var bbar       = this.hasBottomToolbar ? this.buildBottomToolbar(this.store) : null;
    
    Ext.applyIf(this, {
      title: this.getTitle(),
      tbar:  tbarConfig,
      bbar:  bbar,
      
      keys:  [
        {
          key:     'a',
          scope:   this,
          handler: this.onAdd
        },
        {
          key:     'e',
          scope:   this,
          handler: this.onEdit
        },
        {
          key:     Ext.EventObject.DELETE,
          scope:   this,
          handler: this.onDelete
        }
      ]
    });
    
    Ext.grid.GridPanel.prototype.initComponent.apply(this, arguments);
  },
  
  /**
   * Sets up events emitted by the grid panel
   */
  initEvents: function() {
    this.addEvents(
      /**
       * @event edit
       * Fired when the user wishes to edit a particular record
       * @param {ExtMVC.Model.Base} instance The instance of the model the user wishes to edit
       */
      'edit',
      
      /**
       * @event new
       * Fired when the user wishes to add a new record
       */
      'new',
      
      /**
       * @event delete
       * Fired when the user wishes to destroy a particular record
       * @param {ExtMVC.Model.Base} instance The instance fo the model the user wishes to destroy
       */
      'delete'
    );
    
    Ext.grid.GridPanel.prototype.initEvents.apply(this, arguments);
  },
  
  /**
   * Listens to clicks in the grid and contained components and takes action accordingly.
   * Mostly, this is simply a case of capturing events received and re-emitting normalized events
   */
  initListeners: function() {
    if (this.dblClickToEdit === true) {
      this.on({
        scope        : this,
        'rowdblclick': this.onEdit
      });      
    }
    
    if (this.controller != undefined) {
      this.controller.on('delete', this.refreshStore, this);
    }
  },
  
  //removes any controller listeners added by initListeners
  destroy: function() {
    if (this.controller != undefined) {
      this.controller.un('delete', this.refreshStore, this);
    }
    
    Ext.grid.GridPanel.prototype.destroy.apply(this, arguments);
  },

  /**
   * Calls reload on the grid's store
   */
  refreshStore: function() {
    //NOTE: For some reason this.store is undefined here, but getCmp on this.id works :/
    var store = Ext.getCmp(this.id).store;
    store.reload();
  },
  
  /**
   * Returns the title to give to this grid.  If this view is currently representing a model called User,
   * this will return "All Users". Override to set your own grid title
   * @return {String} The title to give the grid
   */
  getTitle: function() {
    return String.format("All {0}", this.model.prototype.pluralHumanName);
  },
  
  /**
   * @property preferredColumns
   * @type Array
   * An array of columns to show first in the grid, if they exist
   * Overwrite ExtMVC.view.scaffold.Index.preferredColumns if required
   */
  preferredColumns: ['id', 'title', 'name', 'first_name', 'last_name', 'login', 'username', 'email', 'email_address', 'content', 'message', 'body'],
  
  /**
   * @property ignoreColumns
   * @type Array
   * An array of columns not to show in the grid (defaults to empty)
   */
  ignoreColumns: ['password', 'password_confirmation'],
  
  /**
   * @property useColumns
   * @type Array
   * An array of fields to use to generate the column model.  This defaults to undefined, but if added in a 
   * subclass then these fields are used to make the column model.
   */
  useColumns: undefined,
  
  /**
   * @property narrowColumns
   * @type Array
   * An array of columns to render at half the average width
   */
  narrowColumns: ['id'],
  
  /**
   * @property wideColumns
   * @type Array
   * An array of columns to render at double the average width
   */
  wideColumns:   ['message', 'content', 'description', 'bio', 'body'],
  
  /**
   * @property narrowColumnWidth
   * @type Number
   * The width to make columns in the narrowColumns array (defaults to 30)
   */
  narrowColumnWidth: 30,
  
  /**
   * @property normalColumnWidth
   * @type Number
   * The width to make columns not marked as narrow or wide (defaults to 100)
   */
  normalColumnWidth: 100,
  
  /**
   * @property wideColumnWidth
   * @type Number
   * The width to make wide columns (defaults to 200)
   */
  wideColumnWidth: 200,
  
  /**
   * @property hasTopToolbar
   * @type Boolean
   * True to automatically include a default top toolbar (defaults to true)
   */
  hasTopToolbar: true,
  
  /**
   * @property hasBottomToolbar
   * @type Boolean
   * True to automatically include a paging bottom toolbar (defaults to true)
   */
  hasBottomToolbar: true,
    
  /**
   * Takes a model definition and returns a column array to use for a columnModel
   */
  buildColumns: function(model) {
    //check to see if GridColumns have been created for this model
    //e.g. for a MyApp.models.User model, checks for existence of MyApp.views.users.GridColumns
    if (this.viewsPackage && this.viewsPackage.GridColumns) {
      var columns = this.viewsPackage.GridColumns;
    } else {
      var fields      = this.getFields(),
          columns     = [];
          wideColumns = [];
      
      //put any preferred columns at the front
      Ext.each(fields, function(field) {
        if (this.preferredColumns.indexOf(field.name) > -1) {
          columns.push(this.buildColumn(field.name));
        }
      }, this);

      //add the rest of the columns to the end
      Ext.each(fields, function(field) {
        if (this.preferredColumns.indexOf(field.name) == -1 && this.ignoreColumns.indexOf(field.name) == -1) {
          columns.push(this.buildColumn(field.name));
        };

        //if it's been declared as a wide column, add it to the wideColumns array
        if (this.wideColumns.indexOf(field.name)) {
          wideColumns.push(field.name);
        }
      }, this);

      //add default widths to each
      for (var i = columns.length - 1; i >= 0; i--){
        var col = columns[i];

        if (this.narrowColumns.indexOf(col.id) > -1) {
          //id col is extra short
          Ext.applyIf(col, { width: this.narrowColumnWidth });
        } else if(this.wideColumns.indexOf(col.id) > -1) {
          //we have a wide column
          Ext.applyIf(col, { width: this.wideColumnWidth });
        } else {
          //we have a normal column
          Ext.applyIf(col, { width: this.normalColumnWidth });
        }
      };
    }
    
    return columns;
  },
  
  /**
   * Returns the array of field names the buildColumns() should use to generate the column model.
   * This will return this.useColumns if defined, otherwise it will return all fields
   * @return {Array} The array of field names to use to generate the column model
   */
  getFields: function() {
    if (this.useColumns === undefined) {
      return this.model.prototype.fields.items;
    } else {
      var fields = [];
      Ext.each(this.useColumns, function(column) {
        fields.push({name: column});
      }, this);
      
      return fields;
    }
  },
  
  /**
   * Build a single column object based on a name, adds default properties
   * @param {Object/String} cfg Column config object (can just include a 'name' property).  Also accepts a string, which is translated into the name property
   * @return {Object} A fully-formed column config with default properties set
   */
  buildColumn: function(cfg) {
    var cfg = cfg || {};
    if (typeof(cfg) == 'string') {cfg = {name: cfg};}
    
    return Ext.applyIf(cfg, {
      id       : cfg.name,
      header   : cfg.name.replace(/_/g, " ").titleize(),
      sortable : true,
      dataIndex: cfg.name
    });
  },
  
  /**
   * @property hasAddButton
   * @type Boolean
   * Defines whether or not there should be an 'Add' button on the top toolbar (defaults to true)
   */
  hasAddButton: true,
  
  /**
   * @property hasEditButton
   * @type Boolean
   * Defines whether or not there should be a 'Edit' button on the top toolbar (defaults to true)
   */
  hasEditButton: true,
  
  /**
   * @property hasDeleteButton
   * @type Boolean
   * Defines whether or not there should be a 'Delete' button on the top toolbar (defaults to true)
   */
  hasDeleteButton: true,
  
  /**
   * Builds the Add button for the top toolbar. Override to create your own
   * @param {Object} config An optional config object used to customise the button
   * @return {Ext.Button} The Add Button
   */
  buildAddButton: function(config) {
    return new Ext.Button(
      Ext.applyIf(config || {}, {
        text:    'New ' + this.model.prototype.singularHumanName,
        scope:   this,
        iconCls: 'add',
        handler: this.onAdd
      }
    ));
  },
  
  /**
   * Builds the Edit button for the top toolbar. Override to create your own
   * @param {Object} config An optional config object used to customise the button
   * @return {Ext.Button} The Edit button
   */
  buildEditButton: function(config) {
    return new Ext.Button(
      Ext.applyIf(config || {}, {
        text:     'Edit selected',
        scope:    this,
        iconCls:  'edit',
        disabled: true,
        handler:  this.onEdit
      }
    ));
  },
  
  /**
   * Builds the Delete button for the top toolbar. Override to create your own
   * @param {Object} config An optional config object used to customise the button
   * @return {Ext.Button} The Delete button
   */
  buildDeleteButton: function(config) {
    return new Ext.Button(
      Ext.applyIf(config || {}, {
        text:     'Delete selected',
        disabled: true,
        scope:    this,
        iconCls:  'delete',
        handler:  this.onDelete
      }
    ));
  },
  
  /**
   * Creates Add, Edit and Delete buttons for the top toolbar and sets up listeners to
   * activate/deactivate them as appropriate
   * @return {Array} An array of buttons 
   */
  buildTopToolbar: function() {
    var items = [];
    
    if (this.hasAddButton === true) {
      this.addButton = this.buildAddButton();
      items.push(this.addButton, '-');
    }
    
    if (this.hasEditButton === true) {
      this.editButton = this.buildEditButton();
      items.push(this.editButton, '-');
    }
    
    if (this.hasDeleteButton === true) {
      this.deleteButton = this.buildDeleteButton();
      items.push(this.deleteButton, '-');
    }
    
    if (this.hasSearchField === true) {
      this.searchField = this.buildSearchField();
      items.push(this.searchField, '-');
    }
    
    this.getSelectionModel().on('selectionchange', function(selModel) {
      if (selModel.getCount() > 0) {
        if (this.deleteButton != undefined) this.deleteButton.enable();
        if (this.editButton   != undefined) this.editButton.enable();
      } else {
        if (this.deleteButton != undefined) this.deleteButton.disable();
        if (this.editButton   != undefined) this.editButton.disable();
      };
    }, this);
    
    return items;
  },
  
  /**
   * @property pageSize
   * @type Number
   * The pageSize to use in the PagingToolbar bottom Toolbar (defaults to 25)
   */
  pageSize: 25,
  
  /**
   * Creates a paging toolbar to be placed at the bottom of this grid
   * @param {Ext.data.Store} store The store to bind to this paging toolbar (should be the same as for the main grid)
   * @return {Ext.PagingToolbar} The Paging Toolbar
   */
  buildBottomToolbar: function(store) {
    return new Ext.PagingToolbar({
      store:       store,
      displayInfo: true,
      pageSize:    this.pageSize,
      emptyMsg:    String.format("No {0} to display", this.model.prototype.pluralHumanName)
    });
  },
  
  /**
   * @property hasSearchField
   * @type Boolean
   * True to add a search input box to the end of the top toolbar (defaults to false)
   */
  hasSearchField: false,
  
  /**
   * @property searchParamName
   * @type String
   * The name of the param to send as the search variable in the GET request (defaults to 'q')
   */
  searchParamName: 'q',

  /**
   * Builds the search field component which can be added to the top toolbar of a grid
   * @return {Ext.form.TwinTriggerField} The search field object
   */
  buildSearchField: function() {
    /**
     * @property searchField
     * @type Ext.form.TwinTriggerField
     * The search field that is added to the top toolbar
     */
    this.searchField = new Ext.form.TwinTriggerField({
      width           : 200,
      validationEvent : false,
      validateOnBlur  : false,
      hideTrigger1    : true,
      onTrigger1Click : this.clearSearchField.createDelegate(this, []),
      onTrigger2Click : this.onSearch.createDelegate(this, []),
      
      trigger1Class   :'x-form-clear-trigger',
      trigger2Class   :'x-form-search-trigger'
    });
    
    this.searchField.on('specialkey', function(field, e) {
      if (e.getKey() === e.ESC)   this.clearSearchField(); e.stopEvent();
      if (e.getKey() === e.ENTER) this.onSearch();
    }, this);
    
    return this.searchField;
  },
  
  /**
   * Clears the search field in the top toolbar and hides the clear button
   */
  clearSearchField: function() {
    var f = this.searchField;
    
    f.el.dom.value = '';
    f.triggers[0].hide();
    this.doSearch();
  },
  
  /**
   * Attached to the search fields trigger2Click and Enter key events. Calls doSearch if the
   * user has actually entered anything.
   */
  onSearch: function() {
    var f = this.searchField,
        v = f.getRawValue();
        
    if (v.length < 1) {
      this.clearSearchField();
    } else {
      f.triggers[0].show();
      this.doSearch(v);
    }
  },
  
  /**
   * Performs the actual search operation by updating the store bound to this grid
   * TODO: Move this to the controller if possible (might not be...)
   * @param {String} value The string to search for
   */
  doSearch: function(value) {
    value = value || this.searchField.getRawValue() || "";
    
    var o = {start: 0};
    this.store.baseParams = this.store.baseParams || {};
    this.store.baseParams[this.searchParamName] = value;
    this.store.reload({params:o});
  },
  
  /**
   * Called when the add button is pressed, or when the 'a' key is pressed.  By default this will simply fire the 'add' event
   */
  onAdd: function() {
    this.fireEvent('new');
  },
  
  /**
   * Called when a row in this grid panel is double clicked.  By default this will find the associated
   * record and fire the 'edit' event.  Override to provide your own logic
   * @param {Ext.EventObject} e The Event object
   */
  onEdit: function(e) {
    var obj = this.getSelectionModel().getSelected();
    
    if (obj) this.fireEvent('edit', obj);
  },
  
  /**
   * Called when the delete button is pressed, or the delete key is pressed.  By default this will ask the user to confirm,
   * then fire the delete action with the selected record as the sole argument
   */
  onDelete: function() {
    Ext.Msg.confirm(
      'Are you sure?',
      String.format("Are you sure you want to delete this {0}?  This cannot be undone.", this.model.prototype.modelName.humanize()),
      function(btn) {
        if (btn == 'yes') {
          var selected = this.getSelectionModel().getSelected();
          if (selected) this.fireEvent('delete', selected);
        };
      },
      this
    );
  }
});
