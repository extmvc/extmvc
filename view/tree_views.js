function treeWithForm(config) {
  var options = {};
  
  Ext.apply(options, config, {
    items: null,
    frame: true,
    autoLoad: true,
    labelAlign: 'left',
    autoScroll: true,
    treeEditable: false,
    treeEditableField: 'title',
    beforeFormLoad: function() {},
    afterFormLoad:  function() {},
    beforeDelete:   function() {},
    afterDelete:    function() {},
    beforeSave:     function() {},
    afterSave:      function() {},
    beforeCreate:   function() {},
    afterCreate:    function() {},
    beforeNew:      function() {},
    afterNew:       function() {}
  });
  
  //local aliases to stop me getting RSI
  human_name = options.model.human_singular_name;
    
  newButton = new defaultAddButton({
    model: options.model,
    text: 'Add a new ' + human_name,
    tooltip: 'Adds a new ' + human_name,
    handler: function() {
      if (options.beforeNew() !== false) {
        var node = (new Ext.tree.TreeNode({
          text: 'Unsaved New ' + human_name,
          allowDrag: false,
          iconCls: options.model.model_name + '_unsaved',
          qtip: 'This ' + human_name + ' has not been saved yet, you need to fill in the form and click "Save Changes" first'
        }));
        
        if (selectionModel.selNode && !(/ynode/.test(selectionModel.selNode.id))) {
          selectionModel.selNode.appendChild(node);
          panel.insertAsChildOf = selectionModel.selNode.id;
        } else {
          tree.root.appendChild(node);
        };
        
        record = options.model.newRecord();
        form.form.reset();
        form.form.loadRecord(record);
        panel.recordId = null;
        
        selectionModel.select(node);        
        options.afterNew();
      };      
    }
  });
  
  deleteButton = new defaultDeleteButton({
    model: options.model,
    text: 'Delete selected ' + human_name,
    tooltip: 'Deletes the selected ' + human_name,
    handler: function() {
      id = selectionModel.getSelectedNode().id;
      
      //beforeDelete callback can cancel delete by returning false
      if (options.beforeDelete() !== false) {
        Ext.Msg.confirm('Delete ' + human_name + '?', 'Are you sure you want to delete this ' + human_name + '?  This cannot be undone', function(btn) {
          if (btn == 'yes') {
            Ext.Ajax.request({
              url: options.model.singleUrl({data: {id: id}}),
              method: 'post',
              params: '_method=delete',
              success: function() {
                flash('The ' + human_name + ' has been successfully deleted', human_name + ' deleted');
                updateTree();
                
                options.afterDelete();
                form.form.reset();
                panel.formLoaded = false;
              },
              failure: function() {
                Ext.Msg.alert(human_name + ' NOT Deleted', 'Something went wrong while deleting this ' + human_name + ', it has NOT been deleted');
              }
            });
          };
        });  
      };    
    }
  });
  
  saveButton = new Ext.Button({
    text: 'Save changes',
    iconCls: 'save',
    handler: function() {
      //return false on beforeSave callback to stop save
      if (options.beforeSave() !== false) {
        
        if (panel.formLoaded) {
          if (panel.recordId == null) {
            
            // this is a NEW form, so post to the appropriate URL
            extra_params = '';
            if (panel.insertAsChildOf != null) { extra_params = "insert_as_child_of=" + panel.insertAsChildOf;};
            
            form.form.submit({
              waitMsg: 'Saving Data...',
              url: '/admin/' + options.model.url_name + '.ext_json',
              params: extra_params,
              failure: function() {
                Ext.Msg.alert('Operation Failed', 'There were errors saving this ' + human_name + ', please see any fields with red icons');
              },
              success: function(formElement, action) {
                if (options.success) {
                  options.success.call(this, action.result, form);
                };
                flash("Your changes have been saved", human_name + ' successfully updated');
                updateTree();
              }
            });
          
          } else {
            // this is an EDIT form
            form.form.submit({
              waitMsg: 'Saving Data...',
              url: '/admin/' + options.model.url_name + '/' + panel.recordId + '.ext_json',
              params: '_method=put',
              failure: function() {
                Ext.Msg.alert('Operation Failed', 'There were errors saving this ' + human_name + ', please see any fields with red icons');
              },
              success: function(formElement, action) {
                if (options.success) {
                  options.success.call(this, action.result, form);
                };
                flash("Your changes have been saved", human_name + ' successfully updated');
              }
            });
          };
          
        } else {
          Ext.Msg.alert('Form Not Loaded', 'Please load the form first by clicking a ' + human_name + ' from the tree');
        };
      };
    }
  });
  
  toolbar = new Ext.Toolbar({
    items: [newButton, '-', deleteButton]
  });
  
  tree = new Ext.tree.TreePanel({
    animate: true,
    autoScroll: true,
    containerScroll: true,
    collapsible: true,
    bodyStyle: 'background-color: #fff; border: 1px solid #99BBE8;',
    enableDD: true,
    region: 'west',
    width: 300,
    split: true,
    minWidth: 200,
    rootVisible: false,
    tbar: toolbar,
    title: options.model.human_plural_name,
    loader: new Ext.tree.TreeLoader({
      requestMethod: 'GET',
      dataUrl: options.model.treeUrl()
    })
  });
  
  treeRootNode = new Ext.tree.AsyncTreeNode({
    text: 'Root',
    draggable: false,
    id: 'source'
  });
  
  tree.setRootNode(treeRootNode);
  
  if (options.treeEditable) {
    editor = new Ext.tree.TreeEditor(tree, {
      allowBlank: false,
      ignoreNoChange: true,
      blankText: 'A title is required',
      selectOnFocus: true
    });
    
    editor.on('complete', function(editor, value, previousValue) {
      id = editor.editNode.attributes.id;
      
      // return false from beforeCreate callback to cancel creation
      if (options.beforeCreate() !== false) {
        if (/ynode/.test(id)) {
          //this is a new object, so do a POST create
          params = options.model.model_name + "[" + options.treeEditableField + "]=" + value;
          if (editor.editNode.parentNode) {
            //tell the server that we should be inserting this node as a child of the passed parent
            params += '&insert_as_child_of=' + editor.editNode.parentNode.id;
          };
          
          Ext.Ajax.request({
            method: 'post',
            url: options.model.collectionUrl(),
            params: params,
            success: options.afterCreate
          });
          
        } else {
          //this is updating an existing object
          Ext.Ajax.request({
            method: 'post',
            url: options.model.singleUrl({data: {id: id}}),
            params: "_method=put&" + options.model.model_name + "[" + options.treeEditableField + "]=" + value,
            success: function() {
              flash('The ' + human_name + ' ' + options.treeEditableField + ' was successfully updated', human_name + ' ' + options.treeEditableField + ' updated');
            },
            failure: function() {
              Ext.Msg.alert(human_name + ' ' + options.treeEditableField + ' NOT updated', 'The ' + options.treeEditableField + ' of this ' + human_name + ' could not be updated - please try again');
            }
          });
        };
      };
    });    
  };
  
  tree.on('movenode', function(tree, node, oldParent, newParent, index) {
    Ext.Ajax.request({
      method: 'post',
      url: options.model.treeReorderUrl({data: {id: node.id}}),
      params: "parent=" + newParent.id + "&index=" + index,
      success: function() {
        flash('The ' + human_name + ' was moved successfully', human_name + ' moved');
      },
      failure: function() {
        Ext.Msg.alert('Error moving ' + human_name, 'Something went wrong while moving this ' + human_name + ', please try again');
      }
    });
  });
  
  selectionModel = tree.getSelectionModel();
  
  tree.getSelectionModel().on('selectionchange', function(node) {
    //if we can't get a reference to the selected node, just return without acting
    if (!node.selNode) {return;};
    
    // ignore no selection || root selection || new node selected (one that has not been saved yet)
    if (selectionModel.getSelectedNode() == null || node.selNode.id == 'source' || (/ynode/).test(node.selNode.id)) {
      //root node is selected, disabled delete
      deleteButton.disable();
      
    } else {
      //a real node is selected, load the data into the form
      id = node.selNode.id;
      options.model.loadFormWithId(id, form, {callback: options.afterFormLoad}, {listeners: {'beforeload': options.beforeFormLoad}});
      
      //enable the delete and save buttons
      deleteButton.enable();
      saveButton.enable();
      
      panel.formLoaded = true;
      panel.recordId   = id;
    };
  });
  
  function updateTree() {
    treeRootNode.reload();
    deleteButton.disable();
  };
  
  form = new defaultEditForm({
    region: 'center',
    addDefaultButtons: false,
    model: options.model,
    items: options.items
  });
  
  form.addButton(saveButton);
  
  panel = new Ext.Panel({
    frame: true,
    layout: 'border',
    items: [tree, form]
  });
  
  //used by the save button to determine whether or not the form is currently loaded
  panel.formLoaded = false;
  
  //keep a reference of the ID currently loaded in the form (null if this is a new record)
  panel.recordId = null;
  
  panel.insertAsChildOf = null;
  
  return panel;
};
