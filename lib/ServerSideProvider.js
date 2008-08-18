/**
 * @class Ext.ux.MVC.ServerSideProvider
 * @extends Ext.state.Provider
 * @constructor
 * Create a new ServerSideProvider
 * @param {Object} config The configuration object
 */
Ext.state.ServerSideProvider = function(config){
  Ext.state.ServerSideProvider.superclass.constructor.call(this);
  Ext.apply(this, config, {
    url: '/state.json'
  });
  
  /**
   * @event staterestore Fires when state has been fetched from the server and restored to local hash
   * @event staterestorefail Fires if state could not be restored from the server
   * @event afterclearstate Fires after state has been successfully cleared from the server
   * @event clearstatefail Fires if state was not successfully cleared from the server
   * @event aftersetstate Fires after state has been successfully synchronised with the server
   * @event setstatefail Fires if state update could not be synchronised with the server
   */
  this.addEvents('staterestore', 'staterestorefail', 'clearstatefail', 'afterclearstate', 'aftersetstate', 'setstatefail');
  
  //perform an AJAX request against the server to initially populate state
  this.readStateFromServer();
};

Ext.extend(Ext.state.ServerSideProvider, Ext.state.Provider, {
    /**
     * Sets the key/value pair locally and sends an AJAX request to the Server to update
     * Server's representation
     */
    set : function(name, value){
      //clear the key if set to null/undefined
      if(typeof value == "undefined" || value === null) {
        this.clear(name);
        return;
      };
      
      this.setServerSideValue(name, value);
      Ext.state.CookieProvider.superclass.set.call(this, name, value);
    },

    /**
     * Private Method: Performs AJAX request to Server to clear state information for a given key
     */
    clear : function(name){
      Ext.Ajax.request({
        url: this.url,
        method: 'post',
        params: '_method=delete&key=' + name,
        scope: this,
        success: function() {this.fireEvent('afterclearstate');},
        failure: function() {this.fireEvent('clearstatefail');}
      });
      
      Ext.state.CookieProvider.superclass.clear.call(this, name);
    },

    /**
     * Private Method: Reads all state information from the Server Side URL
     */
    readStateFromServer : function(){
      Ext.Ajax.request({
        url: this.url,
        method: 'get',
        scope: this,
        success: function(response, options) {
          // try {
            var state_object = Ext.decode("(" + response.responseText + ")");
            
            boo = state_object;
            
            for (item in state_object) {
              this.state[item] = this.decodeValue(state_object[item]);
            }
            
            this.fireEvent('staterestore');
          // } catch(e) {
          //   if (this.hasListener('staterestorefail')) {
          //     this.fireEvent('staterestorefail');
          //   } else {
          //     Ext.ux.MVC.Flash.error("Something went wrong trying to retrieve your default settings", "Your settings could not be retrieved");
          //   };
          // }
        },
        failure: function() {this.fireEvent('staterestorefail');}
      });
    },

    /**
     * Private Method: Sends an AJAX request to the Server to update the Server's state representation
     */
    setServerSideValue : function(name, value){
      Ext.Ajax.request({
        url: this.url,
        method: 'post',
        params: 'key=' + name + '&value=' + Ext.encode(this.encodeValue(value)),
        scope: this,
        success: function() {this.fireEvent('aftersetstate');},
        failure: function() {this.fireEvent('setstatefail');}
      });
    }
});