/**
 * @class <%= @namespace %>.views.<%= @view_namespace %>.<%= @name %>
 * @extends Ext.Panel
 * A default generated view
 */
<%= @namespace %>.views.<%= @view_namespace %>.<%= @name %> = Ext.extend(Ext.Panel, {

  initComponent: function() {
    Ext.applyIf(this, {
      title: "<%= @name %> Template",
      html:  "Find me in <%= @filename %>"
    });
    
    <%= @namespace %>.views.<%= @view_namespace %>.<%= @name %>.superclass.initComponent.apply(this, arguments);
  }
});