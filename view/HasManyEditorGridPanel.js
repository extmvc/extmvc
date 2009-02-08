/**
 * @class Ext.ux.MVC.view.HasManyEditorGridPanel
 * @extends Ext.grid.EditorGridPanel
 * Provides some sensible defaults for a HasMany editor grid.  For example, given the following models:
 * Ext.ux.MVC.Model.define("MyApp.models.User", {
 *   ...
 *   hasMany: "Post"
 * });
 *
 * Ext.ux.MVC.Model.define("MyApp.models.Post", {
 *   ...
 *   belongsTo: "User"
 * });
 *
 * Inside the edit User view, if we wanted to be able to quickly edit any of that User's Posts, we can insert
 * a HasManyEditorGridPanel like this:
 *
 * items: [
 *   {
 *     xtype: 'hasmany_editorgrid',
 *     store: userObj.posts.findAll(),
 *     columns: [... set up editor columns as per a normal EditorGridPanel]
 *   }
 * ]
 *
 * In the example above, userObj refers to the loaded User instance tied to the edit form.  The HasMany editor grid
 * automatically listens to afteredit events and saves the HasMany model (Post in this case).
 */
Ext.ux.MVC.view.HasManyEditorGridPanel = Ext.extend(Ext.grid.EditorGridPanel, {

  initComponent: function() {
    Ext.applyIf(this, {
      autoScroll: true,
      viewConfig: { forceFit: true }
    });
    
    Ext.ux.MVC.view.HasManyEditorGridPanel.superclass.initComponent.apply(this, arguments);
    
    /**
     * Set up listening on the afteredit event.  Simply saves the model instance
     */
    this.on('afteredit', function(args) {
      args.record.save({
        success: function() {
          args.record.commit();
        }
      });
    }, this);
  }
});

Ext.reg('hasmany_editorgrid', Ext.ux.MVC.view.HasManyEditorGridPanel);