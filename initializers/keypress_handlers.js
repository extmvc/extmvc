Ext.onReady(function() {
  //hand off keypress events to the current panel
  Ext.EventManager.addListener(document, "keypress", handleKeypress);
  function handleKeypress (ev) {
    try {
      application.getLayoutManager().delegateKeypress(ev);
    } catch(err) {}
  };
});