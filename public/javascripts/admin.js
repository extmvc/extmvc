Ext.onReady(function(){
  topBar = new Ext.Panel({
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
  
  leftMenu = new Ext.Panel({
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
  
  mainPanel = new Ext.Panel({
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
  
  contentPanel = new Ext.Panel({
    region: 'center',
    layout: 'border',
    bodyStyle: 'background-color: #c5d1e7; padding: 10px;',
    items: [leftMenu, mainPanel]
  });
  
  var viewport = new Ext.Viewport({
    layout:'border',
    bodyStyle: 'background-color: #c5d1e7; margin-bottom: 10px;',
    items:[topBar, contentPanel]
  });
  
  var menuActions = new Array('Dashboard_Index', 'Supplier_Index', 'User_Index', 'Category_Index', 'Page_Index', 'Video_Index', 'Feedback_Index');
  
  //creates a function to display each panel in the menuActions array
  function createDisplayFunction (name) { 
    var class_name = name.split("_")[0];
    var keyword = name.split("_")[1];
    return function() {ApplicationController.displayPanelFromModelAndKeyword(class_name, keyword);};
  }
  for (var i=0; i < menuActions.length; i++) {
    Ext.get(menuActions[i]).on('click', createDisplayFunction(menuActions[i]));
  };
  
  //Add 'Not Implemented' popup on all qualifying elements
  Ext.addBehaviors({
    '.not_implemented@click' : notImplemented
  });
  
  //hand off keypress events to the current panel
  Ext.EventManager.addListener(document, "keypress", handleKeypress);
  function handleKeypress (ev) {
    if (ev.altKey) {
      //set up ALT + key shortcuts to get to menu items
      var keyNum = ev.getCharCode();
      switch (keyNum) {
        case 99:  CategoriesController.viewIndex(); ev.stopEvent(); break; //C
        case 102: FeedbacksController.viewIndex();  ev.stopEvent(); break; //F
        case 115: SuppliersController.viewIndex();  ev.stopEvent(); break; //S
        case 117: UsersController.viewIndex();      ev.stopEvent(); break; //U
        case 118: VideosController.viewIndex();     ev.stopEvent(); break; //V
      }
    } else {
      try {
        mainPanel.items.first().handleKeypress(ev);
      } catch(err) {}
    };
  };
  
  //put initial panel into mainPanel
  //DashboardController.viewIndex();
  ApplicationController.displayPanelFromModelAndKeyword('Dashboard', 'Index');
});

//Some code to display the not yet implemented messages
var msgCt;
function notImplemented () {
  var title = 'Not Yet Implemented';
  var message = "This feature has not yet been implemented";
  
  if(!msgCt){
      msgCt = Ext.DomHelper.insertFirst(document.body, {id:'msg-div'}, true);
  }
  msgCt.alignTo(document, 't-t');
  var m = Ext.DomHelper.append(msgCt, {html:createBox(title, message)}, true);
  m.slideIn('t').pause(1).ghost("t", {remove:true});
}

function createBox(t, s){
  return ['<div class="msg">',
          '<div class="x-box-tl"><div class="x-box-tr"><div class="x-box-tc"></div></div></div>',
          '<div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc"><h3>', t, '</h3>', s, '</div></div></div>',
          '<div class="x-box-bl"><div class="x-box-br"><div class="x-box-bc"></div></div></div>',
          '</div>'].join('');
}