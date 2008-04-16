require File.dirname(__FILE__) + '/../spec_helper'

describe <%= class_name %> do
  before(:each) do
    @<%= file_name %> = <%= class_name %>.new
  end
  
<%- field_collection.validates_presence.each do |vp| -%>
  it "should require a <%= vp.field_name %>" do
    @<%= file_name %>.should require_a(:<%= vp.field_name %>)
  end
<%- end -%>
  
end