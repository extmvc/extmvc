/**
 * @class Ext.ux.MVC.view.scaffold.Edit
 * @extends Ext.ux.MVC.view.scaffold.ScaffoldFormPanel
 * Shows a generic edit form for a given model
 */
Ext.ux.MVC.view.scaffold.Edit = function(model, config) {
  var config = config || {};
  
  Ext.applyIf(config, {
    title:    'Edit ' + String.capitalize(model.prototype.modelName),
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
  });
 
  Ext.ux.MVC.view.scaffold.Edit.superclass.constructor.call(this, model, config);
  Ext.ux.MVC.OS.getOS().setsTitle(this);
};

Ext.extend(Ext.ux.MVC.view.scaffold.Edit, Ext.ux.MVC.view.scaffold.ScaffoldFormPanel);

Ext.reg('scaffold_edit', Ext.ux.MVC.view.scaffold.Edit);