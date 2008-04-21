/* Abstract base LayoutManager class.  Don't use this directly, use one of the subclasses */
LayoutManager = function() {

};

LeftMenuLayoutManager = function(config) {
  // super
  LeftMenuLayoutManager.superclass.constructor.call(this, config);
  
  //set up the layout based on the underlying HTML elements
  this.topBar = new Ext.Panel({
    region: 'north',
    height: 50,
    contentEl: 'header',
    items: [
      new Ext.Button({
        text: 'Logout',
        icon: '/images/icons/door_in.png',
        cls: 'x-btn-text-icon logout',
        handler: function() {
          window.location = "/logout";
        }
      })
    ]
  });
  
  this.leftMenu = new Ext.Panel({
    region: 'west',
    width: 200,
    margins: '8 8 8 8',
    title: 'Menu',
    items: [
      new Ext.Panel({
        contentEl: 'menu',
        bodyStyle: 'background-color: #DFE8F6;'
      })
    ],
    autoScroll: true,
    bodyStyle: 'background-color: #DFE8F6;',
    frame: true,
    collapsible: true
  });
  
  this.mainPanel = new Ext.Panel({
    region:'center',
    margins:'0 8 8 0',
    layout: 'fit',
    bodyBorder: false,
    border: false,
    bodyStyle: 'padding-top: 8px; background-color: #c5d1e7;',
    defaults: {frame: true},
    items: [{
      hideMode:'offsets',
      bodyStyle: 'background-color: #c5d1e7;',
      iconCls: 'home',
      border: false
    }]
  });
  
  this.contentPanel = new Ext.Panel({
    region: 'center',
    layout: 'border',
    bodyStyle: 'background-color: #c5d1e7; padding: 10px;',
    items: [this.leftMenu, this.mainPanel]
  });
  
  this.viewport = new Ext.Viewport({
    layout:'border',
    bodyStyle: 'background-color: #c5d1e7; margin-bottom: 10px;',
    items:[this.topBar, this.contentPanel]
  });
  
  // Public functions
  this.showPanel = function(panel) {
    this.mainPanel.remove(this.mainPanel.items.first(), true);
    this.mainPanel.add(panel);
    this.mainPanel.doLayout();
  };
  
  this.delegateKeypress = function(ev) {
    this.mainPanel.items.first().handleKeypress(ev);
  };
  
  this.initializeMenu = function(menu_dom_id) {    
    menu_links = Ext.get(menu_dom_id).select('ul li a').elements;
    
    for (var i=0; i < menu_links.length; i++) {
      Ext.get(menu_links[i]).on('click', this.createDisplayFunction(menu_links[i].id));
    };
  };
  
  //used by initializeMenu - should be private
  this.createDisplayFunction = function(name) { 
    var class_name = name.split("_")[0];
    var keyword = name.split("_")[1];
    return function() {application.getControllerByName(class_name + "Controller").viewIndex()};
  };
  
};

LeftMenuLayoutManager = Ext.extend(LeftMenuLayoutManager, LayoutManager, {});