/**
 * VideoPreviewButton
 * @extends Ext.Button
 * @cfg {String} url The url to load into the window.  This would usually
 * be a flash object, which plays the video
 * Opens a modal video preview window to display a given flash video
*/
VideoPreviewButton = function(config) {
  var config = config || {};
  
  Ext.applyIf(config, {
    text: 'Preview Video',
    iconCls: 'play'
  });
  
  Ext.applyIf(config, {
    handler: function() {
      var win;
      if (!win) { win = new VideoPreviewWindow(config); };
      win.show();
    }
  });
    
  VideoPreviewButton.superclass.constructor.call(this, config);
};
Ext.extend(VideoPreviewButton, Ext.Button);
Ext.reg('video_preview_button', VideoPreviewButton);

/**
 * VideoPreviewWindow
 * @extends Ext.Window
 * @cfg {String} url The url to load into the window.  This would usually
 * be a flash object, which plays the video
 * Opens a modal video preview window to display a given flash video
*/
VideoPreviewWindow = function(config) {
  var config = config || {};
  
  var win = this;
  
  Ext.applyIf(config, {
    title: 'Preview Video',
    modal: true,
    height: 377,
    width: 368,
    resizable: false,
    items: [
      new Ext.Panel({
        autoLoad: config.url
      })
    ],
    buttons: [
      {
        text: 'OK',
        handler: function() {win.close();}
      }
    ]
  });
  
  VideoPreviewWindow.superclass.constructor.call(this, config);
};
Ext.extend(VideoPreviewWindow, Ext.Window);