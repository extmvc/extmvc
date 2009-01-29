/**
 * @class Ext.ux.MVC.view.scaffold.New
 * @extends Ext.ux.MVC.view.scaffold.ScaffoldFormPanel
 * Shows a generic new form for a given model
 */
Ext.ux.MVC.view.scaffold.New = Ext.extend(Ext.ux.MVC.view.scaffold.ScaffoldFormPanel, {
  /**
   * Sets up the Edit form with references to required objects
   * @param {Function} model The model definition to create an Edit form for (e.g. MyApp.models.MyModel)
   * @param {Object} config Any configuration to pass up the constructor chain
   */
  constructor: function(model, config) {
    this.model = model;
    Ext.ux.MVC.view.scaffold.Edit.superclass.constructor.call(this, model, config || {});
    
    /**
     * @property modelObj
     * @type Ext.ux.MVC.Model
     * An empty instance of the model this scaffold is for.  Will be updated on save
     */
    this.modelObj = new this.model({});
  },
  
  /**
   * Sets this panel's title, if not already set
   */
  initComponent: function() {
    Ext.applyIf(this, {
      title:    'New ' + this.model.prototype.modelName.capitalize()
    });
    Ext.ux.MVC.view.scaffold.New.superclass.initComponent.apply(this, arguments);
  }
});

Ext.reg('scaffold_new', Ext.ux.MVC.view.scaffold.New);