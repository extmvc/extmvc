/**
 * @class ExtMVC.view.scaffold.Index
 * @extends Ext.grid.GridPanel
 * A default index view for a scaffold (a paging grid with double-click to edit)
 */
ExtMVC.view.scaffold.Index = Ext.extend(Ext.grid.GridPanel, {
  
  constructor: function(config) {
    config = config || {};

    this.model = config.model;
    if (this.model == undefined) throw new Error("No model supplied to scaffold Index view");
    
    //we can't put these in applyIf block below as the functions are executed immediately
    config.columns = config.columns || this.buildColumns(this.model);
    config.store   = config.store   || this.model.find();
    
    var tbarConfig = this.hasTopToolbar    ? this.buildTopToolbar()                : null;
    var bbar       = this.hasBottomToolbar ? this.buildBottomToolbar(config.store) : null;

    Ext.applyIf(config, {
      title:      this.getTitle(),
      viewConfig: { forceFit: true },
      id:         String.format("{0}_index", this.model.prototype.tableName),

      loadMask: true,

      tbar: tbarConfig,
      bbar: bbar,
      

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
    
    this.initEvents();
    this.initListeners();
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
       * @event add
       * Fired when the user wishes to add a new record
       */
      'add',
      
      /**
       * @event delete
       * Fired when the user wishes to destroy a particular record
       * @param {ExtMVC.Model.Base} instance The instance fo the model the user wishes to destroy
       */
      'delete'
    );
  },
  
  /**
   * Listens to clicks in the grid and contained components and takes action accordingly.
   * Mostly, this is simply a case of capturing events received and re-emitting normalized events
   */
  initListeners: function() {
    this.on({
      scope     : this,
      'dblclick': this.onEdit
    });
  },

  
  /**
   * Returns the title to give to this grid.  If this view is currently representing a model called User,
   * this will return "Showing Users". Override to set your own grid title
   * @return {String} The title to give the grid
   */
  getTitle: function() {
    return String.format("Showing {0}", this.model.prototype.pluralHumanName);
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
    var model       = this.model,
        proto       = model.prototype,
        fields      = proto.fields,
        columns     = [];
        wideColumns = [];
    
    //put any preferred columns at the front
    fields.each(function(field) {
      if (this.preferredColumns.indexOf(field.name) > -1) {
        columns.push(this.buildColumn(field.name));
      }
    }, this);
    
    //add the rest of the columns to the end
    fields.each(function(field) {
      if (this.preferredColumns.indexOf(field.name) == -1 && this.ignoreColumns.indexOf(f.name) == -1) {
        columns.push(this.buildColumn(field.name));
      };
      
      //if it's been declared as a wide column, add it to the wideColumns array
      if (this.wideColumns.indexOf(field.name)) {
        wideColumns.push(field.name);
      }
    }, this);
    
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
      text:    'New ' + this.model.prototype.singularHumanName,
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
      emptyMsg:    String.format("No {0} to display", this.model.prototype.pluralHumanName)
    });
  },
  
  /**
   * Called when the add button is pressed, or when the 'a' key is pressed.  By default this will simply fire the 'add' event
   */
  onAdd: function() {
    this.fireEvent('add');
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
      String.format("Are you sure you want to delete this {0}?  This cannot be undone.", this.model.prototype.modelName.titleize()),
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

Ext.reg('scaffold_index', ExtMVC.view.scaffold.Index);