VideoChooser = function(config) {
  var config = config || {};
  
  Ext.applyIf(config, {
    title: 'Choose a Video',
    width: 780, 
    height: 520,
    closable: true,
    closeAction: 'hide',
    autoCreate: true,
    modal: true,
    minWidth: 400,
    minHeight: 300,
    syncHeightBeforeShow: true,
    shadow: true,
    layout: 'border',
    url: '/admin/videos.ext_json'
  });

  this.infoPanel = new Ext.Panel({
    region: 'east',
    width: 150,
    maxWidth: 250
  });
  
  //template for video info panel
  this.detailsTemplate = new Ext.Template(
    '<div class="details"><img src="/images/video_preview.gif"><div class="details-info">',
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
      url: config.url,
      method: 'get',
      params: {start: 0, limit: 15}
    }),
    reader: Video.getReader()
  });
  
  // override the default store.load function to load data through GET rather than POST
  store.load = function(options){
    options = options || {};
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
  };

  store.load({params: {start: 0, limit: 15}});
  this.store = store;
  
  
  var tpl = new Ext.XTemplate(
    '<tpl for=".">',
      '<div class="video-preview-wrap" id="{id}">',
      '<div class="thumb"><img src="/images/video_preview.gif" title="{title}"></div>',
      '<span>{title}</span></div>',
    '</tpl>',
    '<div class="x-clear"></div>'
  );
  
  //view
  var view = new Ext.DataView({
    store: store,
    tpl: tpl,
    autoHeight: true,
    multiSelect: false,
    singleSelect: true,
    overClass:'x-view-over',
    itemSelector:'div.video-preview-wrap',
    emptyText: 'No images to display'
  });
  this.view = view;
  
  this.viewTopToolbar = new Ext.Toolbar({
    items: ['Search by Title: ', ' ', new Ext.app.SearchField({store: this.store, width:220})]
  });
  
  this.viewBottomToolbar = new Ext.PagingToolbar({
    pageSize: 15,
    store: this.store,
    displayInfo: true,
    displayMsg: 'Displaying Videos {0} - {1} of {2}',
    emptyMsg: "No Videos to display",
    items: [new Ext.Toolbar.Fill]
  });

  this.videosPanel = new Ext.Panel({
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
  
  var win = this;
  
  this.reset = function(){
    this.view.getEl().dom.scrollTop = 0;
    this.view.clearFilter();
    this.txtFilter.dom.value = '';
    this.view.select(0);
  };
  
  this.onLoadException = function(v,o){
    this.view.getEl().update('<div style="padding:10px;">Error loading videos.</div>'); 
  };
  
  this.filter = function(){
    var filter = this.txtFilter.dom.value;
    this.view.filter('name', filter);
    this.view.select(0);
  };
  
  this.onLoad = function(){
    this.loaded = true;
    this.view.select(0);
  };
  
  this.sortVideos = function(){
    var p = this.sortSelect.dom.value;
    this.view.sort(p, p != 'name' ? 'desc' : 'asc');
    this.view.select(0);
  };
  
  this.showDetails = function(view, nodes){
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
  };
  
  this.doCallback = function(){
    var selNode = view.getSelectedNodes()[0];
    var callback = config.callback;
    win.hide();
    if(selNode && callback){
      callback(this.lookup[selNode.id]);
    };
  };
  
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

  this.okButton = new Ext.Button({
    text: 'OK',
    disabled: true
  });
  
  this.cancelButton = new Ext.Button({
    text: 'Cancel',
    handler: function() {win.close();}
  });
  
  this.view.on('selectionchange', this.showDetails, this, {buffer:100});
  this.view.on('dblclick', this.doCallback, this);
  this.view.on('loadexception', this.onLoadException, this);
  this.okButton.on('click', this.doCallback, this);
  
  Ext.applyIf(config, {
    items: [this.videosPanel, this.infoPanel],
    buttons: [this.okButton, this.cancelButton]
  });
  
  VideoChooser.superclass.constructor.call(this, config);
  
};
Ext.extend(VideoChooser, Ext.Window);


String.prototype.ellipse = function(maxLength){
    if(this.length > maxLength){
        return this.substr(0, maxLength-3) + '...';
    }
    return this;
};