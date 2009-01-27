/**
 * @class Ext.ux.MVC.view.scaffold.Edit
 * @extends Ext.ux.MVC.view.scaffold.ScaffoldFormPanel
 * Shows a generic edit form for a given model
 */
Ext.ux.MVC.view.scaffold.Edit = function(model, config) {
  var config = config || {};
  var os     = Ext.ux.MVC.OS.getOS();
  
  Ext.applyIf(config, {
    title:    'Edit ' + model.prototype.modelName.capitalize(),
    buttons: [
      {
        text:  'Save',
        scope: this,
        handler: function() {
          var values = this.getForm().getValues();
          for (key in values) {
            this.modelObj.set(key, values[key]);
          };
          
          this.modelObj.save({
            success: function() {
              os.router.redirectTo(Ext.apply(os.params, { action: 'index' }));
            },
            failure: function() {
              
            }
          });
        }
      },
      //FIXME: no, can't decide controller name like this
      os.router.linkTo({controller: model.modelName + 's', action: 'index'}, {text: 'Cancel'})
    ]
  });
 
  Ext.ux.MVC.view.scaffold.Edit.superclass.constructor.call(this, model, config);
  os.setsTitle(this);
  
  /**
   * @property modelObj
   * @type Ext.ux.MVC.Model/Null
   * Reference to the model being edited in this form.  Is set once loaded by the adapter
   */
  this.modelObj = null;
  
  //load the model into the form
  model.findById(os.params.id, {
    scope: this,
    success: function(modelObj) {
      this.getForm().loadRecord(modelObj);
      this.modelObj = modelObj;
    },
    failure: function() {
      console.log('failure');
    }
  });
};

Ext.extend(Ext.ux.MVC.view.scaffold.Edit, Ext.ux.MVC.view.scaffold.ScaffoldFormPanel);

Ext.reg('scaffold_edit', Ext.ux.MVC.view.scaffold.Edit);