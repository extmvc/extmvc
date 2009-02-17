/**
 * @class ExtMVC.view.scaffold.Index
 * @extends Ext.grid.GridPanel
 * A default index view for a scaffold (a paging grid with double-click to edit)
 */
ExtMVC.view.scaffold.Index = function(model, config) {
  var config = config || {};
  
  this.model = model;
  this.os    = ExtMVC.OS.getOS();
  
  this.controllerName = model.modelName.pluralize();
  this.controller     = this.os.getController(this.controllerName);
  
  //we can't put these in applyIf block below as the functions are executed immediately
  config.columns = config.columns || this.buildColumns(model);
  config.store   = config.store   || model.findAll();
  
  var tbarConfig = this.hasTopToolbar    ? this.buildTopToolbar()                : null;
  var bbar       = this.hasBottomToolbar ? this.buildBottomToolbar(config.store) : null;
  
  Ext.applyIf(config, {
    title:      'Showing ' + model.prototype.modelName.pluralize().capitalize(),
    viewConfig: { forceFit: true },
    id:         model.prototype.modelName + 's_index',
    
    loadMask: true,
    
    tbar: tbarConfig,
    bbar: bbar,
    
    listeners: {
      'dblclick': {
        scope: this,
        fn: function(e) {
          var obj = this.getSelectionModel().getSelected();
          
          if (obj) {
            this.os.router.redirectTo({controller: this.controllerName, action: 'edit', id: obj.data.id});
          };
        }
      }
    },
    
    keys: [
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
 
  ExtMVC.view.scaffold.Index.superclass.constructor.call(this, config);
  ExtMVC.OS.getOS().setsTitle(this);
};

Ext.extend(ExtMVC.view.scaffold.Index, Ext.grid.GridPanel, {
  
  /**
   * @property preferredColumns
   * @type Array
   * An array of columns to show first in the grid, if they exist
   * Overwrite ExtMVC.view.scaffold.Index.preferredColumns if required
   */
  preferredColumns: ['id', 'title', 'name', 'first_name', 'last_name', 'login', 'username', 'email', 'email_address', 'content', 'message'],
  
  /**
   * @property ignoreColumns
   * @type Array
   * An array of columns not to show in the grid (defaults to empty)
   */
  ignoreColumns: ['password', 'password_confirmation'],
  
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
  wideColumns:   ['message', 'content', 'description', 'bio'],
  
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
    var columns     = [];
    var wideColumns = [];
    
    //put any preferred columns at the front
    for (var i=0; i < model.fields.length; i++) {
      var f = model.fields[i];
      if (this.preferredColumns.indexOf(f.name) > -1) {
        columns.push(this.buildColumn(f.name));
      }
    };
    
    //add the rest of the columns to the end
    for (var i = model.fields.length - 1; i >= 0; i--){
      var f = model.fields[i];
      //if this field is not in the prefer or ignore list, add it to the columns array
      if (this.preferredColumns.indexOf(f.name) == -1 && this.ignoreColumns.indexOf(f.name) == -1) {
        columns.push(this.buildColumn(f.name));
      };
      
      //if it's been declared as a wide column, add it to the wideColumns array
      if (this.wideColumns.indexOf(f.name)) {
        wideColumns.push(f.name);
      }
    };
    
    //add default widths to each
    var numberOfSegments = columns.length + (2 * wideColumns.length);
    for (var i = columns.length - 1; i >= 0; i--){
      var col = columns[i];
      
      if (this.narrowColumns.indexOf(col.id) > -1) {
        //id col is extra short
        Ext.applyIf(col, { width: 30 });
      } else if(this.wideColumns.indexOf(col.id) > -1) {
        //we have a wide column
        Ext.applyIf(col, { width: 200 });
      } else {
        //we have a normal column
        Ext.applyIf(col, { width: 100 });
      }
    };
    
    return columns;
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
      id:        cfg.name,
      header:    cfg.name.replace(/_/g, " ").titleize(),
      sortable:  true,
      dataIndex: cfg.name
    });
  },
  
  /**
   * Creates Add, Edit and Delete buttons for the top toolbar and sets up listeners to
   * activate/deactivate them as appropriate
   * @return {Array} An array of buttons 
   */
  buildTopToolbar: function() {
    this.addButton = new Ext.Button({
      text:    'New ' + this.model.modelName.titleize(),
      scope:   this,
      iconCls: 'add',
      handler: this.onAdd
    });
    
    this.editButton = new Ext.Button({
      text:     'Edit selected',
      scope:    this,
      iconCls:  'edit',
      disabled: true,
      handler:  this.onEdit
    });
    
    this.deleteButton = new Ext.Button({
      text:     'Delete selected',
      disabled: true,
      scope:    this,
      iconCls:  'delete',
      handler:  this.onDelete
    });
    
    this.getSelectionModel().on('selectionchange', function(selModel) {
      if (selModel.getCount() > 0) {
         this.deleteButton.enable();  this.editButton.enable();
      } else {
        this.deleteButton.disable(); this.editButton.disable();
      };
    }, this);
    
    return [
      this.addButton,  '-',
      this.editButton, '-',
      this.deleteButton
    ];
  },
  
  /**
   * Creates a paging toolbar to be placed at the bottom of this grid
   * @param {Ext.data.Store} store The store to bind to this paging toolbar (should be the same as for the main grid)
   * @return {Ext.PagingToolbar} The Paging Toolbar
   */
  buildBottomToolbar: function(store) {
    //Used for getting human-readable names for this model
    //TODO: this is overkill, shouldn't need to instantiate an object for this...
    var modelObj = new this.model({});
    
    return new Ext.PagingToolbar({
      store:       store,
      displayInfo: true,
      pageSize:    25,
      emptyMsg:    String.format("No {0} to display", modelObj.humanPluralName)
    });
  },
  
  /**
   * Called when the add button is pressed, or when the 'a' key is pressed.  By default this will redirect to the
   * 'New' form for this resource
   */
  onAdd: function() {
    this.os.router.redirectTo({controller: this.controllerName, action: 'new'});
  },
  
  /**
   * Called when the edit button is pressed, or when the 'e' key is pressed.  By default this will look to see if a row
   * is selected, then redirect to the appropriate Edit form.
   * If you override this you'll need to provide the row record lookup yourself
   */
  onEdit: function() {
    var selected = this.getSelectionModel().getSelected();
    if (selected) {
      this.os.router.redirectTo({controller: this.controllerName, action: 'edit', id: selected.data.id});
    }
  },
  
  /**
   * Called when the delete button is pressed, or the delete key is pressed.  By default this will ask the user to confirm,
   * then fire the controller's destroy action with the selected record's data.id and a reference to this grid as arguments.
   */
  onDelete: function() {
    Ext.Msg.confirm(
      'Are you sure?',
      String.format("Are you sure you want to delete this {0}?  This cannot be undone.", this.model.modelName.titleize()),
      function(btn) {
        if (btn == 'yes') {
          var selected = this.getSelectionModel().getSelected();
          if (selected) {
            this.controller.fireAction('destroy', null, [selected.data.id, this.store]);
          }
        };
      },
      this
    );
  }
});

Ext.reg('scaffold_index', ExtMVC.view.scaffold.Index);