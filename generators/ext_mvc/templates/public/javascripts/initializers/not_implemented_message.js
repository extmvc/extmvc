Ext.onReady(function() {
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

  //Add 'Not Implemented' popup on all qualifying elements
  Ext.addBehaviors({
    '.not_implemented@click' : notImplemented
  });
});