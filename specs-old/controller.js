describe('An example controller', {
  'maintain a reference to the application': function() {
    value_of(controller.application).should_be(application);
  },
  'maintain a reference to the model': function() {
    value_of(controller.model).should_be(AgentPageTemplate)
  },
  'return the correct batch destroy url': function() {
    value_of(controller.batchDestroyUrl).should_be('/admin/batch_destroy_agent_page_templates.ext_json')
  },
  'return the correct delete confirmation message when deleting 1 item': function() {
    value_of(controller.deleteMessage(1)).should_be('Are you sure you want to delete this Agent Page Template? This cannot be undone')
  },
  'return the correct delete confirmation message when deleting more than one 1 item': function() {
    value_of(controller.deleteMessage(2)).should_be('Are you sure you want to delete these Agent Page Templates? This cannot be undone')
  }
});