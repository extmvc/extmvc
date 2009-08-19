/**
 * @class <%= @name %>
 * @extends ExtMVC.model.Base
 */
ExtMVC.model.define("<%= @name %>", {
  fields:    [
<%= @fields %>
  ]
});