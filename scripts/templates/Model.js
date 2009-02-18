/**
 * @class <%= @namespace %>.models.<%= @name %>
 * @extends ExtMVC.Model
 */
ExtMVC.Model.define("<%= @namespace %>.models.<%= @name %>", {
  modelName: '<%= @model_name %>',
  fields:    [
<%= @fields %>
  ]
});