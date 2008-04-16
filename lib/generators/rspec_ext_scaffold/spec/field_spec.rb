require File.dirname(__FILE__) + '/../spec_helper'

describe Field do
  before(:each) do
    @field = Field.new("name:string:vp")
  end
  
  it "should return the correct fieldname" do
    @field.field_name.should == 'name'
  end
  
  it "should return the correct field type" do
    @field.field_type.should == 'string'
  end
  
  it "should return whether or not the presence should be validated" do
    @field.validates_presence.should be(true)
    
    @field2 = Field.new("name:string")
    @field2.validates_presence.should be(false)
  end
end