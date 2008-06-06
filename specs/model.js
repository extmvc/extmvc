describe('An example model', {
  'should set the class_name correctly': function() {
    value_of(AgentPageTemplate.class_name).should_be('AgentPageTemplate');
  },
  'should set the controller_name correctly': function() {
    value_of(AgentPageTemplate.controller_name).should_be('AgentPageTemplatesController');
  },
  'should set the foreign_key_name correctly': function() {
    value_of(AgentPageTemplate.foreign_key_name).should_be('agent_page_template_id');
  },
  'should set the human_plural_name correctly': function() {
    value_of(AgentPageTemplate.human_plural_name).should_be('Agent Page Templates');
  },
  'should set the human_singular_name correctly': function() {
    value_of(AgentPageTemplate.human_singular_name).should_be('Agent Page Template');
  },
  'should set the underscore_name correctly': function() {
    value_of(AgentPageTemplate.underscore_name).should_be('agent_page_template');
  },
  'should set the url_name correctly': function() {
    value_of(AgentPageTemplate.url_name).should_be('agent_page_templates');
  },
  'should return the correct tree url': function() {
    value_of(AgentPageTemplate.treeUrl()).should_be('/admin/agent_page_templates/tree.ext_json');
  },
  'should return the correct tree reorder url': function() {
    //fake a record - just an anonymous object with a data.id
    record = {data: {id: 1}};
    value_of(AgentPageTemplate.treeReorderUrl(record)).should_be('/admin/agent_page_templates/reorder/1.ext_json');
  },
  'should return the correct url for a given object': function() {
    //fake a record - just an anonymous object with a data.id
    record = {data: {id: 1}};
    
    value_of(AgentPageTemplate.singleUrl(record)).should_be('/admin/agent_page_templates/1.ext_json');
  },
  'should return the correct url for the collection': function() {
    value_of(AgentPageTemplate.collectionUrl()).should_be('/admin/agent_page_templates.ext_json');
  }
});