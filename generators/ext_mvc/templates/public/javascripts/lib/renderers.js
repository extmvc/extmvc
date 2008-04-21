Ext.util.Format.renderThumbnail = function(value, metadata, record, rowIndex, colIndex, store) {
  t = new Ext.Template('<img src="{src}" />');  
  return t.apply({src: value});
};