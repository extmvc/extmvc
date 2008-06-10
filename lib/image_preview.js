/**
 * ImagePreviewButton
 * @extends Ext.Button
 * @cfg {String} url The url to load into the window.  This would usually
 * be a flash object, which plays the image
 * Opens a modal image preview window to display a given flash image
*/
ImagePreviewButton = function(config) {
  var config = config || {};
  
  Ext.applyIf(config, {
    text: 'Preview Image',
    iconCls: 'play'
  });
  
  Ext.applyIf(config, {
    handler: function() {
      var win;
      if (!win) { win = new ImagePreviewWindow(config); };
      win.show();
    }
  });
    
  ImagePreviewButton.superclass.constructor.call(this, config);
};
Ext.extend(ImagePreviewButton, Ext.Button);
Ext.reg('image_preview_button', ImagePreviewButton);

/**
 * ImagePreviewWindow
 * @extends Ext.Window
 * @cfg {String} url The url to load into the window.  This would usually
 * be a flash object, which plays the image
 * Opens a modal image preview window to display a given flash image
*/
ImagePreviewWindow = function(config) {
  var config = config || {};
  
  var win = this;
  
  Ext.applyIf(config, {
    title: 'Preview Image',
    modal: true,
    height: 400,
    width: 400,
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
  
  ImagePreviewWindow.superclass.constructor.call(this, config);
};
Ext.extend(ImagePreviewWindow, Ext.Window);