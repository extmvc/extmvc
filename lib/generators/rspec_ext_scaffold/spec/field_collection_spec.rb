require File.dirname(__FILE__) + '/../spec_helper'

describe FieldCollection do
  before(:each) do
    @field_collection = FieldCollection.new(["name:string:vp", "date:datetime", "price:decimal", "size:integer", "description:text:vp", "postcode:string"])
  end
  
  it "should have one field for each element of the array" do
    @field_collection.fields.size.should == 6
  end
  
  it "should have two fields validating presence" do
    vp = @field_collection.validates_presence
    
    vp.size.should == 2
    vp.collect {|f| f.field_name}.include?('name').should be(true)
    vp.collect {|f| f.field_name}.include?('description').should be(true)
  end
  
  it "should return normal generator args" do
    @field_collection.to_normal_args.should == ["name:string", "date:datetime", "price:decimal", "size:integer", "description:text", "postcode:string"]
  end
  
  it "should return the correct fields from fields_by_type" do
    strings = @field_collection.fields_by_type 'string'
    strings.size.should == 2
    strings.collect {|f| f.field_name}.include?('name').should be(true)
    strings.collect {|f| f.field_name}.include?('postcode').should be(true)
  end
end