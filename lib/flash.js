/**
 * Basic Flash class.  Calling Ext.ux.Flash.flash('my message', 'my optional title');
 * Displays a message at the top centre of the screen for a given length of time (defaults to 1 second)
 * Set different time by setting Ext.ux.MVC.Flash.flashDisplayTime
 */
Ext.ux.MVC.Flash = {
  flashContainer: null,
  flashDisplayTime: 1, //default to show the flash for one second
  
  /**
   * Displays the passed message and optional title for the amount of time specified by flashDisplayTime
   */
  flash: function(message, title, config) {
    var config = config || {};
    
    //create a reusable container if one has not already been created
    if(!Ext.ux.MVC.Flash.flashContainer){
      Ext.ux.MVC.Flash.flashContainer = Ext.DomHelper.insertFirst(document.body, {id:'msg-div'}, true);
    };
    
    //align flash box to top centre of the screen
    Ext.ux.MVC.Flash.flashContainer.alignTo(document, 't-t');
    
    //display the flash box for the given number of seconds
    var m = Ext.DomHelper.append(Ext.ux.MVC.Flash.flashContainer, {html: Ext.ux.MVC.Flash._createBox(title, message, config)}, true);
    m.slideIn('t').pause(Ext.ux.MVC.Flash.flashDisplayTime).ghost("t", {remove:true});
  },

  /**
   * Specialised form of flash - provide a styleable flash by setting div class="notice"
   */
  notice: function(message, title) {
    Ext.ux.MVC.Flash.flash(message, title, {cls: 'notice'});
  },
  
  /**
   * Specialised form of flash - provide a styleable flash by setting div class="error"
   */
  error: function(message, title) {
    Ext.ux.MVC.Flash.flash(message, title, {cls: 'error'});
  },
  
  /**
   * Internal method used to create styled div and contents to display the flash message
   */
  _createBox: function(title, message, config) {
    var config = config || {};
    
    //append user div class if present
    var div_class = 'msg';
    if (config.cls) {
      div_class += ' ' + config.cls;
    };
    
    return ['<div class="' + div_class + '">',
            '<div class="x-box-tl"><div class="x-box-tr"><div class="x-box-tc"></div></div></div>',
            '<div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc"><h3>', title, '</h3>', message, '</div></div></div>',
            '<div class="x-box-bl"><div class="x-box-br"><div class="x-box-bc"></div></div></div>',
            '</div>'].join('');
  }
  
};