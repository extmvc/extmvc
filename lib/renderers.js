Ext.util.Format.renderThumbnail = function(value, metadata, record, rowIndex, colIndex, store) {
  t = new Ext.Template('<img src="{src}" />');  
  return t.apply({src: value});
};

Ext.util.Format.datetimeRenderer = function(value, metadata, record, rowIndex, colIndex, store) {
  try {
    date_splits = value.split(" ")[0].split("/");
    time_splits = value.split(" ")[1].split(":");
    
    year = date_splits[0]; month  = date_splits[1]; day    = date_splits[2];
    hour = time_splits[0]; minute = time_splits[1]; second = time_splits[2];
    
    offset = value.split(" ")[2];
    
    return String.format("{0}/{1}/{2} {3}:{4}", day, month, year, hour, minute);
  } catch (e) {
    return 'Unknown';
  };
};