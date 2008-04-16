class AdminController < ApplicationController
  before_filter :check_access
  
  def index
  end
  
  def dashboard
    render :layout => false
  end
  
  def paginate_for_ext
    params[:dir]   ||= 'DESC'
    params[:start] ||= 0
    params[:sort]    = (params[:sort] || order_field(params[:model])).underscore
    params[:limit] ||= 25
    klass = params[:model].to_s.classify.constantize
    
    if params[:query].nil? || params[:query].empty?
      condition_string = nil
    else
      condition_string = ActiveRecord::Base.send('sanitize_sql', ["#{search_field(klass)} LIKE ?", "%#{params[:query]}%"])
    end
    
    conditions = ExtFilterConditionsParser.new(params[:filter], condition_string).condition_string
      
    @total      = klass.count(:conditions => conditions)
    @collection = klass.find(:all, :offset => params[:start], :limit => params[:limit], :order => "#{params[:sort]} #{params[:dir]}", :conditions => conditions)
    
    respond_to do |format|
      format.ext_json { render :json => @collection.to_ext_json(:class => params[:model], :count => @total) }
    end
  end
  
  def destroy_batch
    klass = params[:model].to_s.classify.constantize
    klass.delete_all ["id IN (?)", params[:ids].split(",")]
    
    respond_to do |format|
      format.ext_json { render :json => {:success => true}}
    end
  end

  private

  def search_field klass
    case klass.to_s
    when 'Supplier' : 'name'
    when 'User'     : 'login'
    when 'Category' : 'name'
    else 'title'
    end
  end
  
  def order_field klass
    case klass.to_s.classify.constantize.to_s
    when 'User' : 'email'
    else 'created_at'
    end
  rescue NameError
    return 'created_at'
  end
  
  def check_access
    unless logged_in? #and current_user.authorise(params[:controller], params[:action])
      respond_to do |format|
        format.html do
          session[:return_to] = request.path
          redirect_to login_path 
        end
        format.xml {render :status => 401}
        format.ext_json {render :text => "{success: false, errors: {'You are not authorised to carry out this action'}}"}
      end
    end
  end

end
