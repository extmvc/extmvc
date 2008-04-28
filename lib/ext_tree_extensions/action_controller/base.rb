module ExtTreeExtensions
  module ActionController
    module Base
      def self.included(base)
        base.extend(ClassMethods)
      end
      
      module ClassMethods
        def acts_as_ext_tree_controller model_name
          include InstanceMethods
          
          write_inheritable_attribute(:acts_as_ext_tree_controller_options, {
            :model_name => model_name,
            :pluralized_model_name => model_name.to_s.pluralize.intern
          })
          
          class_inheritable_reader :acts_as_ext_tree_controller_options
          
          before_filter :classify_model, :only => [:tree, :reorder]
          before_filter :find_tree_node, :only => :reorder
        end
      end
      
      module InstanceMethods
        def tree
          if params[:node] == 'source' || params[:node] == 'root'
            @roots = @klass.roots
          else
            @roots = @klass.find(params[:node]).children
          end
                    
          if params[:checked]
            ids = []
            if params[:associated_model] && params[:associated_id]
              @associated_klass = params[:associated_model].to_s.classify.constantize
              
              associated_object = @associated_klass.find(params[:associated_id])
              ids = associated_object.send(params[:model]).collect {|m| m.id}
            end
            @tree = @klass.to_checked_ext_tree(@roots, ids)
            
          else
            @tree = @klass.to_ext_tree(@roots)
          end
          
          respond_to do |format|
            format.ext_json {render :json => @tree}
          end
        end
        
        def reorder
          @tree_node.move_to_child_of_with_index params[:parent].to_i, params[:index]
          
          respond_to do |format|
            format.html
            format.xml
            format.ext_json {render :text => "{success: true}"}
          end
        end
        
        protected
        
        def find_tree_node
          @tree_node = @klass.find(params[:id])
        rescue ActiveRecord::RecordNotFound => e
        
          respond_to do |format|
            format.html { render :text => "The tree node could not be found"}
            format.xml  { render :text => '', :status => :not_found }
            format.ext  { render :text => "{success: false}"}
          end
        end
        
        def classify_model
          @klass = acts_as_ext_tree_controller_options[:model_name].to_s.classify.constantize
        end

      end
    end
  end
end