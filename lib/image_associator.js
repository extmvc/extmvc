var ImageAssociationRecord = Ext.data.Record.create([
  {name: 'id',                      type: 'int'},
  {name: 'image_id',                type: 'int'},
  {name: 'image_linked_model_id',   type: 'int'},
  {name: 'image_linked_model_type', type: 'string'},
  {name: 'created_at',              type: 'string'},
  {name: 'updated_at',              type: 'string'},
  {name: 'thumb_filename',          type: 'string', mapping: 'image.thumb_filename'},
  {name: 'title',                   type: 'string', mapping: 'image.title'},
  {name: 'filename',                type: 'string', mapping: 'image.filename'},
  {name: 'image'}
]);

var ImageAssociationReader = new Ext.data.JsonReader({root: 'image_associations', totalProperty: 'results'}, ImageAssociationRecord);

/*
options should include at least a model and an ID, e.g.:

new ImageAssociator({model: Product, id: 1});
*/

var ImageAssociator = function(options) {
  config = {};
  
  Ext.apply(config, options, {
    baseUrl: '/admin/image_associations',
    height: 300,
    anchor: "95%",
    autoLoad: true
  });
  
  readAssociationsUrl  = config.baseUrl + '?type=' + config.model.class_name + '&id=' + config.id;
  
  imageAssociationStore = new Ext.data.Store({
    url: readAssociationsUrl,
    reader: ImageAssociationReader
  });
  
  this.store = imageAssociationStore;
  
  if (config.autoLoad) {
    this.store.load();
  };
  
  tpl = new Ext.XTemplate(
    '<tpl for=".">',
      '<div class="thumb-wrap" id="{id}">',
      '<div class="thumb"><img src="{thumb_filename}" title="{title}"></div>',
      '<span class="x-editable">{filename}</span></div>',
    '</tpl>',
    '<div class="x-clear"></div>'
  );
  
  addButton = new Ext.Toolbar.Button({
    text: 'Add an Image',
    iconCls: 'add',
    handler: function() {
      imageChooser = new ImageChooser(options.image_chooser_options);
      imageChooser.show('noid', afterImageSelected);
      
      function afterImageSelected (record) {
        image_id = record.id;
        
        param_string  = '&image_association[image_id]=' + image_id;
        param_string += '&image_association[image_linked_model_type]=' + config.model.class_name;
        param_string += '&image_association[image_linked_model_id]=' + config.id;
        
        Ext.Ajax.request({
          url: config.baseUrl + '.ext_json',
          method: 'post',
          params: param_string,
          success: function() {
            imageAssociationStore.reload();
          }
        });
      }
    }
  });
  
  removeButton = new Ext.Toolbar.Button({
    text: 'Remove Selected',
    disabled: true,
    iconCls: 'cancel',
    handler: function() {
      association_id = dataView.getSelectedRecords()[0].data.id;
      
      Ext.Ajax.request({
        url: config.baseUrl + '/' + association_id + '.ext_json',
        method: 'post',
        params: "_method=delete",
        success: function() {
          imageAssociationStore.reload();
        }
      });
    }
  });
  
  toolbar = new Ext.Toolbar({title: 'Images attached to this ' + config.model.human_name, items: [addButton, '-', removeButton]});
  
  dataView = new Ext.DataView({
    store: imageAssociationStore,
    tpl: tpl,
    autoScroll: true,
    itemSelector: 'div.thumb-wrap',
    emptyText: 'No images have been attached yet',
    singleSelect: true
  });
  
  this.dataView = dataView;
  
  this.dataView.on('selectionchange', function(dView, selections) {
    if (selections.length > 0) {
      removeButton.enable();
    } else {
      removeButton.disable();
    };
  });
  
  this.panel = new Ext.Panel({
    tbar: toolbar,
    height: config.height,
    title: 'Images attached to this ' + config.model.human_singular_name,
    anchor: config.anchor,
    bodyStyle: 'background-color: #fff; border: 1px solid #99BBE8; padding: 7px; overflow:auto;',
    // margins: '20 40 60 100',
    style: config.style,
    items: [this.dataView]
  });  
};

ImageAssociator.prototype = {
  reloadStore: function(id) {
    config.id = id;
    this.store.proxy.conn.url = config.baseUrl + '?type=' + config.model.class_name + '&id=' + config.id;
    this.store.load();
  }
};
