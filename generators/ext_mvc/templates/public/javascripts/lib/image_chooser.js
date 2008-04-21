var ImageChooser = function(config){
  
  //set up our local variables
  Ext.apply(this, config, {
      width: 540, height: 400, url: '/admin/images.js'
  });
  
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
      
  // Set up the images loader
  var store = new Ext.data.JsonStore({
    url: this.url,
    root: 'images',
    fields: ['title', 'description', 'public_filename', 'thumb_filename', 'id', 'filename', {name:'size', type: 'float'}, {name:'created_at', type:'date', dateFormat:'timestamp'}]
  });
  store.load();
  
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

  this.imagesPanel = new Ext.Panel({
    region: 'center',
    cls: 'images-view',
    fitToFrame: true,
    width: 535,
    collapsible:true,
    layout: 'fit',
    bodyStyle: 'overflow: auto;',
    items: [this.view]
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
    center:{autoScroll:false},
		syncHeightBeforeShow: true,
		shadow:true,
    fixedcenter:true,
    layout: 'border',
		east:{split:true,initialSize:150,minSize:150,maxSize:250},
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
    data.shortName = Ext.util.Format.ellipsis(data.filename, 15);
    data.sizeString = Ext.util.Format.fileSize(data.size);
    data.dateString = data.created_at.format("m/d/Y g:i a");
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