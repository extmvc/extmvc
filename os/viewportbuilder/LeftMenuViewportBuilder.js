/**
 * @class Ext.ux.MVC.LeftMenuViewportBuilder
 * @extends Ext.ux.MVC.ViewportBuilder
 * Creates a viewport with a left menu and a main tabpanel.
 */
Ext.ux.MVC.LeftMenuViewportBuilder = function() {
  Ext.ux.MVC.LeftMenuViewportBuilder.superclass.constructor.call(this);
};
Ext.extend(Ext.ux.MVC.LeftMenuViewportBuilder, Ext.ux.MVC.ViewportBuilder, {
  
  /**
   * Creates the viewport elements, taking config options from OS.viewportBuilderConfig
   * @param {Ext.ux.MVC.OS} os The OS instance to link built viewport components to
   * Assigns this.topBar, this.sideMenu, this.mainPanel, this.contentPanel and this.viewport
   * to the passed os when calling build(os)
   * @return {Ext.ux.MVC.OS} The same OS instance, now decorated with topBar, sideMenu, mainPanel,
   * contentPanel and viewport
   */
  build: function(os) {
    var config  = os.getViewportBuilderConfig() || {};
    config.menu = config.menu || {};
    
    //menu items are placed into a child container, allow config.menu.items to
    //pass straight through to the child
    config.menu.items = [
      new Ext.Panel({
        bodyStyle: 'background-color: #DFE8F6;',
        items:     config.menu.items,
        defaults:  {
          xtype: 'menu_link'
        }
      })
    ];
    
    console.log('fas');
    console.log(config.menu.items);
    
    os.topBar = new Ext.Panel({
      region: 'north',
      height: 50,
      items: [
        new Ext.Button({
          text: 'Logout',
          icon: '/images/icons/door_in.png',
          cls:  'x-btn-text-icon logout',
          handler: function() {
            window.location = "/logout";
          }
        })
      ]
    });
    
    os.sideMenu = new Ext.Panel(Ext.applyIf(config.menu, {
      region:      'west',
      width:       200,
      frame:       true,
      margins:     '8 0 8 8',
      title:       'Menu',
      split:       true,
      collapsible: true,
      autoScroll:  true,
      bodyStyle:   'background-color: #DFE8F6;'
    }));
    
    os.mainPanel = this.createMainPanel(config);
    
    os.contentPanel = new Ext.Panel({
      region:    'center',
      layout:    'border',
      bodyStyle: 'background-color: #c5d1e7; padding: 10px;',
      items:     [os.sideMenu, os.mainPanel]
    });
    
    os.viewport = new Ext.Viewport({
      layout:    'border',
      bodyStyle: 'background-color: #c5d1e7; margin-bottom: 10px;',
      items:     [
        // os.topBar,
        os.contentPanel
      ]
    });
            
    //Tell controllers to add views to the mainPanel instead of rendering directly
    Ext.ux.MVC.Controller.prototype.addTo = os.mainPanel;
    
    //don't render views automatically, return a renderable instantiation instead (a subclass of Ext.Component)
    Ext.ux.MVC.Controller.prototype.renderMethod = 'add';
    
    return os;
  },
  
  //private - decides whether to create a TabPanel or not, based on os.viewportBuilderConfig.useTabs
  createMainPanel: function(config) {
    var config  = config || {};
    config.main = config.main || {};
    Ext.applyIf(config.main, {
      region:   'center',
      border:   false,
      defaults: { frame: true }
    });

    if (config.useTabs) {
      return new Ext.TabPanel(Ext.applyIf(config.main, {
        margins:    '8 8 8 0',
        items:      []
      }));
    } else {
      return new Ext.Panel(Ext.applyIf(config.main, {
        margins:    '0 8 8 0',
        layout:     'fit',
        bodyBorder: false,
        bodyStyle:  'padding-top: 8px; background-color: #c5d1e7;',
        listeners:  {
          'beforeadd': {
            //removes the current component so newly added component shows up automatically
            fn: function(ct, component, index) {
              if (ct.items) {
                ct.items.each(function(i) {this.remove(i);}, this);
              };
            }
          }
        },
        items: [{
          hideMode:  'offsets',
          bodyStyle: 'background-color: #c5d1e7;',
          iconCls:   'home',
          border:    false
        }]
      }));
    };
  }
  
});

Ext.ux.MVC.ViewportBuilderManager.register('leftmenu', Ext.ux.MVC.LeftMenuViewportBuilder);