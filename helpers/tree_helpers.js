function treeWithForm(config) {
  var options = {};
      
  Ext.apply(options, config, {
    items: null,
    frame: true,
    autoLoad: true,
    labelAlign: 'left',
    autoScroll: true,
    treeEditable: true,
    treeEditableField: 'title',
    beforeForeLoad: function() {},
    afterFormLoad: function() {}
  });
  
  //local aliases to stop me getting RSI
  human_name = options.model.human_singular_name;
  
  newButton = new defaultAddButton({
    model: options.model,
    text: 'Add a new ' + human_name,
    tooltip: 'Adds a new ' + human_name,
    handler: function() {
      alert("Add button");
    }
  });
  
  deleteButton = new defaultDeleteButton({
    model: options.model,
    text: 'Delete selected ' + human_name,
    tooltip: 'Deletes the selected ' + human_name,
    handler: function() {
      id = selectionModel.getSelectedNode().id;
      
      Ext.Ajax.request({
        url: options.model.singleUrl({data: {id: id}}),
        method: 'post',
        params: '_method=delete',
        success: function() {
          flash('The ' + human_name + ' has been successfully deleted', human_name + ' deleted');
          updateTree();
        },
        failure: function() {
          Ext.Msg.alert(human_name + ' NOT Deleted', 'Something went wrong while deleting this ' + human_name + ', it has NOT been deleted');
        }
      });
    }
  });
  
  saveButton = new Ext.Button({
    text: 'Save changes',
    iconCls: 'save',
    handler: function() {
      alert("save");
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
    bodyStyle: 'background-color: #fff',
    enableDD: true,
    region: 'west',
    width: 300,
    split: true,
    minWidth: 200,
    rootVisible: false,
    tbar: toolbar,
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
      blankText: 'A title is required',
      selectOnFocus: true
    });
    
    editor.on('complete', function(editor, value, previousValue) {
      id = editor.editNode.attributes.id;
      
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
          success: afterCreate
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
    
    if (selectionModel.getSelectedNode() == null || node.selNode.id == 'source') {
      //root node is selected, disabled delete
      deleteButton.disable();
      
    } else {
      //a real node is selected, load the data into the form
      id = node.selNode.id;
      options.model.loadFormWithId(id, form, {callback: options.afterFormLoad}, {listeners: {'beforeload': options.beforeFormLoad}});
      
      //enable the delete and save buttons
      deleteButton.enable();
      saveButton.enable();
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
    title: options.model.human_plural_name,
    items: [tree, form]
  });
  
  return panel;
};

