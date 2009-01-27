/**
 * @class Ext.ux.MVC.view.scaffold.New
 * @extends Ext.ux.MVC.view.scaffold.ScaffoldFormPanel
 * Shows a generic new form for a given model
 */
Ext.ux.MVC.view.scaffold.New = function(model, config) {
  var config = config || {};
  var os     = Ext.ux.MVC.OS.getOS();
  
  Ext.applyIf(config, {
    title:    'New ' + model.prototype.modelName.capitalize(),
    buttons: [
      {
        text:  'Save',
        scope: this,
        handler: function() {
          var m = new model(this.getForm().getValues());
          m.save({
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
 
  Ext.ux.MVC.view.scaffold.New.superclass.constructor.call(this, model, config);
  os.setsTitle(this);
};

Ext.extend(Ext.ux.MVC.view.scaffold.New, Ext.ux.MVC.view.scaffold.ScaffoldFormPanel);

Ext.reg('scaffold_new', Ext.ux.MVC.view.scaffold.New);