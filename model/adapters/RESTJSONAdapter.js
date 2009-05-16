/**
 * @class ExtMVC.Model.plugin.adapter.RESTJSONAdapter
 * @extends ExtMVC.Model.plugin.adapter.RESTAdapter
 * An adapter which hooks into a RESTful server side API that expects JSON for its data storage
 */
ExtMVC.Model.plugin.adapter.RESTJSONAdapter = Ext.extend(ExtMVC.Model.plugin.adapter.RESTAdapter, {

  /**
   * Performs the actual save request.  Uses POST for new records, PUT when updating existing ones
   * puts the data into jsonData for the request
   */
  doSave: function(instance, options) {
    if (typeof instance == 'undefined') throw new Error('No instance provided to REST Adapter save');
    options = options || {};
    
    Ext.Ajax.request(
      Ext.applyIf(options, {
        url:    this.instanceUrl(instance),
        method: instance.newRecord() ? this.createMethod : this.updateMethod,
        jsonData: this.buildPostJSONData(instance)
      })
    );
  },
  
  /**
   * Creates a jsonData object suitable for sending as POST data to the server
   * @param {ExtMVC.Model.Base} instance The models instance to build post data for
   * @return {Object} jsonData object to send to the server
   */
  buildPostJSONData: function(instance) {
    var data = Ext.util.JSON.encode(instance.data);
    return data;
  }
});
