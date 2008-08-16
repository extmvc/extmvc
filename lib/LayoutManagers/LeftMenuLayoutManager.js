/**
 * Ext.ux.MVC.LayoutManager.LeftMenuLayoutManager
 * @extends Ext.ux.MVC.LayoutManager.Base
 * Creates a left panel and a centre panel, adding menu_items to the left panel
 */
Ext.ux.MVC.LayoutManager.LeftMenuLayoutManager = function(config) {
  var config = config || {};
  
  //set general config options
  Ext.applyIf(config, {
    autoInitialize: true
  });
  
  //set a default topPanelConfig if not already set
  Ext.applyIf(config, {
    topPanelConfig: {
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
    }
  });
  
  //set a default leftPanelConfig if not already set
  Ext.applyIf(config, {
    leftPanelConfig: {
      id: 'layout_left_panel',
      region: 'west',
      width: 200,
      margins: '8 0 8 8',
      title: 'Menu',
      split: true,
      autoScroll: true,
      bodyStyle: 'background-color: #DFE8F6;',
      frame: true,
      collapsible: true
    }
  });
  
  //set a default mainPanelConfig if not already set
  Ext.applyIf(config, {
    mainPanelConfig: {
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
    }
  });
  
  this.config = config;
  
  this.mainPanel = new Ext.Panel(config.mainPanelConfig);
  this.topPanel  = new Ext.Panel(config.topPanelConfig);
  this.leftPanel = new Ext.Panel(config.leftPanelConfig);
  
  this.contentPanel = new Ext.Panel({
    region: 'center',
    layout: 'border',
    bodyStyle: 'background-color: #c5d1e7; padding: 10px;',
    items: [this.leftPanel, this.mainPanel]
  });
  
  this.viewport = new Ext.Viewport({
    layout:'border',
    bodyStyle: 'background-color: #c5d1e7; margin-bottom: 10px;',
    items:[this.topPanel, this.contentPanel]
  });
  
  Ext.ux.MVC.LayoutManager.LeftMenuLayoutManager.superclass.constructor.call(this, config);
  
  this.showPanel = function(panel) {
    if (this.fireEvent("beforeshowpanel")) {
      //remove current panel, add new one
      this.mainPanel.remove(this.mainPanel.items.first(), true);
      this.mainPanel.add(panel);
      this.mainPanel.doLayout();      
      
      //notify all listeners that a new panel has been shown
      this.fireEvent("showpanel");
    };
  };
  
  /**
   * Initializes the Layout Manager by building the menu
   */
  this.initialize = function() {
    this.createMenuHolder();
  };
  
  /**
   * Takes config.menu_items and converts them to an array of Domspec li elements
   */
  this.buildMenuItems = function() {
    var menu_items = this.config.menu_items;
    var array = [];
    
    if (menu_items.length > 0) {
      for (var i=0; i < menu_items.length; i++) {
        
        var link_config = Ext.apply({}, menu_items[i].html, {
          href: '#',
          tag: 'a',
          html: menu_items[i].text
        });
        
        var list_element = {
          tag: 'li',
          children: [link_config]
        };
        
        array.push(list_element);        
      };
    };
    
    return array;
  };
  
  /**
   * Creates the <ul> which holds the menu items
   */
  this.createMenuHolder = function() {
    this.menuHolder = this.leftPanel.add({
      xtype: 'panel',
      html: {
        id: 'layout_left_panel_menu',
        tag: 'ul',
        cls: 'left_menu',
        children: this.buildMenuItems()
      }
    });
    
    this.leftPanel.doLayout();
    
    return this.menuHolder;
  };

};
Ext.extend(Ext.ux.MVC.LayoutManager.LeftMenuLayoutManager, Ext.ux.MVC.LayoutManager.Base);
Ext.reg('left_menu_layout', Ext.ux.MVC.LayoutManager.LeftMenuLayoutManager);