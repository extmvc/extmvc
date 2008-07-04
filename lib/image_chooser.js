var ImageChooser = function(config){
  
  //set up our local variables
  Ext.apply(this, config, {
      width: 780, height: 520, url: '/admin/images.ext_json'
  });
  
  uploadImageForm = new Ext.FormPanel({
    labelAlign: 'left',
    url: '/admin/images',
    title: 'New File',
    iconCls: 'file_new',
    layout: 'form',
    closable: true,
    fileUpload: true,
    waitMsgTarget: true,
    items: [
      {
        xtype: 'textfield',
        inputType: 'file',
        fieldLabel: 'File',
        name: 'image[uploaded_data]',
        id: 'uploaded_data'
      },
      {
        xtype: 'textfield',
        fieldLabel: 'Title',
        name: 'image[title]',
        id: 'title'
      },
      {
        xtype: 'textarea',
        fieldLabel: 'Description',
        name: 'image[description]',
        id: 'description',
        width: 310,
        height: 150
      }
    ]
  });
  
  uploadImageForm.addButton({
    text: 'Save',
    handler: function(){
      uploadImageForm.form.submit({
        url: '/admin/images.ext_json', 
        waitMsg: 'Saving Data...',
        failure: function() {Ext.Msg.alert('Operation Failed', 'There were errors saving this File, please see any fields with red icons');},
        success: function(formElement, action) {
          uploadWin.hide();
          Ext.Msg.alert('File Saved', 'The File has been successfully uploaded');
          store.reload();
        }
      });
    }
  });
  
  var uploadWin = new Ext.Window({
    title: 'Choose a new image to upload',
    closable: true,
    closeAction: 'hide',
    modal: true,
    height: 400,
    width: 500,
    layout: 'fit',
    items: [uploadImageForm]
  });
  this.uploadWin = uploadWin;
  
  this.infoPanel = new Ext.Panel({
    region: 'east',
    width: 150,
    maxWidth: 250
  });
  
  //template for image info panel
  this.detailsTemplate = new Ext.Template(
    '<div class="details"><img src="{thumb_filename}"><div class="details-info">',
    '<dl>',
      '<dt>Title:</dt>',
      '<dd>{title}</dd>',
      '<dt>Description:</dt>',
      '<dd>{descString}</dd>',
      '<dt>Filename:</dt>',
      '<dd>{shortName}</dd>',
      '<dt>Size:</dt>',
      '<dd>{sizeString}</dd>',
    '</dl>'
  );
  this.detailsTemplate.compile();
  
  var store = new Ext.data.Store({
    proxy: new Ext.data.HttpProxy({
      url: this.url,
      method: 'get',
      params: {start: 0, limit: 15}
    }),
    reader: Image.getReader()
  });
  
  // override the default store.load function to load data through GET rather than POST
  store.load = function(options){
    options = options || {};
    if(this.fireEvent("beforeload", this, options) !== false){
        this.storeOptions(options);
        
        var p = Ext.apply(options.params || {}, this.baseParams);
        if(this.sortInfo && this.remoteSort){
          var pn = this.paramNames;
          p[pn["sort"]] = this.sortInfo.field;
          p[pn["dir"]] = this.sortInfo.direction;
        }
        
        // set the proxy's url with the correct parameters
        this.proxy.conn.url = this.proxy.conn.url.split("?")[0] + "?" + Ext.urlEncode(p);
        
        this.proxy.load(p, this.reader, this.loadRecords, this, options);
        return true;
    } else {
      return false;
    }
  };

  store.load({params: {start: 0, limit: 15}});
  this.store = store;
  
  var tpl = new Ext.XTemplate(
    '<tpl for=".">',
      '<div class="thumb-wrap" id="{id}">',
      '<div class="thumb"><img src="{thumb_filename}" title="{title}"></div>',
      '<span class="x-editable">{shortName}</span></div>',
    '</tpl>',
    '<div class="x-clear"></div>'
  );
  
  //view
  this.view = new Ext.DataView({
    store: store,
    tpl: tpl,
    autoHeight: true,
    multiSelect: false,
    singleSelect: true,
    overClass:'x-view-over',
    itemSelector:'div.thumb-wrap',
    emptyText: 'No images to display'
  });
  
  this.view.on('selectionchange', this.showDetails, this, {buffer:100});
  this.view.on('dblclick', this.doCallback, this);
  this.view.on('loadexception', this.onLoadException, this);
  
  newImageButton = new Ext.Toolbar.Button({text: 'Upload a new image', iconCls: 'file_new'});
  newImageButton.on('click', function() {
    uploadWin.show();
  });
  
  this.viewTopToolbar = new Ext.Toolbar({
    items: ['Search by Title: ', ' ', new Ext.app.SearchField({store: this.store, width:220}), '-', newImageButton]
  });
  
  this.viewBottomToolbar = new Ext.PagingToolbar({
    pageSize: 15,
    store: this.store,
    displayInfo: true,
    displayMsg: 'Displaying Images {0} - {1} of {2}',
    emptyMsg: "No Images to display",
    items: [new Ext.Toolbar.Fill]
  });

  this.imagesPanel = new Ext.Panel({
    region: 'center',
    cls: 'images-view',
    fitToFrame: true,
    width: 535,
    layout: 'fit',
    bodyStyle: 'overflow: auto;',
    items: [this.view],
    bbar: this.viewBottomToolbar,
    tbar: this.viewTopToolbar
  });  

  // create the window, add components to it
  var win = new Ext.Window({
    title: 'Choose an Image',
    closable: true,
    closeAction: 'hide',
    autoCreate: true,
    modal: true,
    minWidth: 400,
    minHeight: 300,
		syncHeightBeforeShow: true,
		shadow: true,
    layout: 'border',
    items: [this.imagesPanel, this.infoPanel]
  });
  this.win = win;
  
  this.okButton = win.addButton('OK', this.doCallback, this);
  this.okButton.disable();
  this.cancelButton = win.addButton('Cancel', function() {win.hide();}, win);  
  
  //resize the window to the size required by the call to new ImageChooser
  win.setSize(this.width, this.height);
  
  // cache data by image name for easy lookup
  var lookup = {};
  // make some values pretty for display
  this.view.prepareData = function(data){
    data.shortName = Ext.util.Format.ellipsis(data.title, 15);
    data.sizeString = Ext.util.Format.fileSize(data.size);
    data.dateString = data.created_at;//.format("m/d/Y g:i a");
    data.descString = data.description || 'n/a';
    lookup[data.id] = data;
    return data;
  };
  this.lookup = lookup;
};

ImageChooser.prototype = {
  show : function(el, callback){
    //this.reset();
    this.win.show(el);
    this.callback = callback;
  },
  
  reset : function(){
    this.view.getEl().dom.scrollTop = 0;
    this.view.clearFilter();
    this.txtFilter.dom.value = '';
    this.view.select(0);
  },
  
  load : function(){
    if(!this.loaded){
      this.view.load({url: this.url, params:this.params, callback:this.onLoad.createDelegate(this)});
    }
  },
  
  onLoadException : function(v,o){
      this.view.getEl().update('<div style="padding:10px;">Error loading images.</div>'); 
  },
  
  filter : function(){
    var filter = this.txtFilter.dom.value;
    this.view.filter('name', filter);
    this.view.select(0);
  },
  
  onLoad : function(){
    this.loaded = true;
    this.view.select(0);
  },
  
  sortImages : function(){
    var p = this.sortSelect.dom.value;
      this.view.sort(p, p != 'name' ? 'desc' : 'asc');
      this.view.select(0);
    },
  
  showDetails : function(view, nodes){
    var selNode = this.view.getSelectedNodes()[0];
    if(selNode){
      this.okButton.enable();
      var data = this.lookup[selNode.id];
      this.infoPanel.getEl().hide();
      this.detailsTemplate.overwrite(this.infoPanel.getEl(), data);
      this.infoPanel.getEl().slideIn('l', {stopFx:true,duration:.2});
      
    }else{
        this.okButton.disable();
        this.infoPanel.getEl().update('');
    }
  },
  
  doCallback : function(){
    var selNode = this.view.getSelectedNodes()[0];
    var callback = this.callback;
    this.win.hide();
    if(selNode && callback){
      callback(this.lookup[selNode.id]);
    };
  }

};

String.prototype.ellipse = function(maxLength){
    if(this.length > maxLength){
        return this.substr(0, maxLength-3) + '...';
    }
    return this;
};