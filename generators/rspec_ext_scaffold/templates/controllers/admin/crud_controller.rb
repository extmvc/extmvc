# Subclass this with any model to get a full, basic CRUD controller, e.g.:
# class Admin::PagesController < Admin::CrudController; end
# gives you the full CRUD for HTML, XML and EXT JSON
# 
# if a particular action need specific behaviour, just override it in the class:
# class Admin::PagesController < Admin::CrudController
#   def index
#     @pages = Page.find_active
#   end
# end

class Admin::CrudController < AdminController
  attr_accessor :model_name, :model_klass, :model_symbol, :model_assigns_name, :model_collection_assigns_name
  
  before_filter :find_single, :only => [:show, :edit, :update, :destroy]
  before_filter :find_collection, :only => [:index]
  
  def initialize
    @model_name                    ||= self.controller_class_name.gsub("Controller", '').classify
    @model_klass                   ||= @model_name.constantize
    @model_human_name              ||= @model_name.underscore.humanize
    @model_symbol                  ||= @model_name.to_sym
    @model_assigns_name            ||= @model_name.underscore.to_sym
    @model_collection_assigns_name ||= @model_name.underscore.pluralize.to_sym

    super
  end
  
  def index
    respond_to do |format|
      format.html
      format.xml      { render :xml  => @collection}
      format.ext_json { render :json => @collection.to_ext_json(:class => @model_assigns_name, :count => @model_klass.count) }
    end
  end
  
  def new
    
  end
  
  def show
    respond_to do |format|
      format.html
      format.xml      { render :xml  => @single.to_xml}
      format.ext_json { render :json => [@single].to_ext_json(:class => @model_assigns_name)}
    end
  end
  
  def edit
    
  end
  
  def create
    @object = @model_klass.new(params[@model_assigns_name])
    self.instance_variable_set "@#{@model_assigns_name}", @object
    
    #force creation of an image instead if this is an image filetype
    # if @asset.image?
    #   @asset = Image.new(params[:asset])
    # end
    
    # @asset.site = @site

    respond_to do |format|
      if @object.save
        format.html     { flash[:notice] = "The #{@model_name} has been uploaded successfully"; redirect_to edit_path(@object)}
        format.xml      { render :xml => @object, :status => :created}
        format.ext_json { render :text => @object.to_ext_json(:success => true), :content_type => 'text/html'}
      else
        format.ext_json { render :json   => @object.to_ext_json(:success => false), :content_type => 'text/html' }
        format.html     { flash[:errors] =  @object.errors; render :action => :new}
        format.xml      { render :xml    => @object.errors}
      end
    end
  end
  
  def update
    respond_to do |format|
      if @single.update_attributes(params[@model_assigns_name])
        format.html     { flash[:notice] = "#{@model_human_name} was successfully updated."; redirect_to(collection_path)}
        format.xml      { render :status => 200}
        format.ext_json { render :json => @single.to_ext_json(:success => true) }
      else
        format.ext_json { render :json => "{success: false}" }
        format.html     { flash[:errors] = @single.errors; render :action => :edit}
        format.xml      { render :xml => @single.errors.to_xml}
      end
    end
  end
  
  def destroy
    @single.destroy

    respond_to do |format|
      format.html     { flash[:notice] = "The #{@model_human_name} has been deleted"; redirect_to collection_path}
      format.xml      { render :status => 200 }
      format.ext_json { render :json => "{success: true}"}
    end
  rescue
    respond_to do |format|
      format.ext_json { head   :status => 500 }
      format.xml      { render :status => 500 }
    end
  end
  
  protected
  def find_single
    @single = @model_klass.find(params[:id])
    
  rescue ActiveRecord::RecordNotFound => e
    @errors.add "That #{@model_human_name} could not be found"
    respond_to do |format|
      format.html     { flash[:errors] = @errors; redirect_to collection_path}
      format.xml      { render :status => :not_found}
      format.ext_json { render :json => "{success: false}"}
    end
  end
  
  def find_collection
    @collection = @model_klass.find(:all)
    
    # assigns the found collection so that it's usable in the view
    # equivalent to @model_names = ModelName.find(:all)
    self.instance_variable_set "@#{@model_collection_assigns_name}", @collection
  end
  
  def collection_path
    {:action => 'index'}
  end
  
  def edit_path object
    {:action => 'edit', :id => object.id}
  end
end