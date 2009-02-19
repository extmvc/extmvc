/**
 * @class <%= @namespace %>.controllers.<%= @controller_name %>
 * @extends ExtMVC.Controller
 */
<%= @namespace %>.controllers.<%= @controller_name %> = Ext.extend(ExtMVC.Controller, {
  constructor: function() {
    //super
    <%= @namespace %>.controllers.<%= @controller_name %>.superclass.constructor.call(this, {
      viewsPackage: <%= @namespace %>.views.<%= @short_name %>
    });
<%= @actions %>
  }
});

ExtMVC.OS.getOS().registerController('<%= @short_name %>', <%= @namespace %>.controllers.<%= @controller_name %>);

Ext.ns('<%= @namespace %>.views.<%= @short_name %>');