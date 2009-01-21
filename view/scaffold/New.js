/**
 * @class Ext.ux.MVC.view.scaffold.New
 * @extends Ext.ux.MVC.view.scaffold.ScaffoldFormPanel
 * Shows a generic new form for a given model
 */
Ext.ux.MVC.view.scaffold.New = function(model) {
  var config = {
    title:    'New ' + String.capitalize(model.prototype.modelName),
    buttons: [
      {
        text:  'Save',
        scope: this,
        handler: function() {
          console.log('saving');
        }
      },
      //FIXME: no, can't decide controller name like this
      Ext.ux.MVC.OS.getOS().router.linkTo({controller: model.modelName + 's', action: 'index'}, {text: 'Cancel'})
    ]
  };
 
  Ext.ux.MVC.view.scaffold.New.superclass.constructor.call(this, config, model);
  Ext.ux.MVC.OS.getOS().setsTitle(this);
};

Ext.extend(Ext.ux.MVC.view.scaffold.New, Ext.ux.MVC.view.scaffold.ScaffoldFormPanel);

Ext.reg('scaffold_new', Ext.ux.MVC.view.scaffold.New);