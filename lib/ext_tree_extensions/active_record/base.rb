module ExtTreeExtensions
  module ActiveRecord
   #:nodoc:
    module Base
      def self.included(base)
        base.extend(ClassMethods)
      end
      
      module ClassMethods
        
        def to_ext_tree roots
          roots.collect {|r| build_tree(r)}.to_json
        end
        
        def to_checked_ext_tree roots, checked_ids
          roots.collect {|r| build_tree(r, {:checked_tree => true, :checked_ids => checked_ids})}.to_json
        end
  
        def build_tree treenode, opts = {}
          node = {:id => treenode.id, :text => treenode.to_s}
          
          if treenode.children.empty?
            # node[:expanded] = false
            # node[:leaf] = true
          else
            node[:expanded] = true
            node[:children] = treenode.children.collect {|c| build_tree(c, opts)}
            node[:leaf] = false
          end
                    
          if opts[:checked_tree] #&& opts[:checked_ids]
            node[:checked] = opts[:checked_ids].include?(treenode.id) ? true : false
            node[:depth] = treenode.ancestors.size
            # node[:expanded] = true
          end
          
          node
        end
        
        
        def acts_as_ext_tree
          include InstanceMethods
        end
      end
      
      module InstanceMethods
        
        def move_to_child_of_with_index parent = nil, index = 0
          index = index.to_i
          
          # first, remove the node from the tree altogether by temporarily 
          # making it the rightmost node at the root of the tree
          roots = self.class.roots
          move_to_right_of roots.last unless self.id == roots.last.id #unless it's already the rightmost node...
          
          if parent.class.to_s == self.class.to_s
            tree_parent = parent
          else
            tree_parent = find_tree_parent(parent)
          end
          
          # find the children of the nodes new parent
          children = tree_parent.nil? ? self.class.roots : tree_parent.children
          
          if index == 0
            #make this the first node
            if tree_parent
              move_to_child_of tree_parent
            else
              move_to_left_of children.first
            end
          else
            #find the node to the left of where we want this one to go
            left_node = (index >= children.size) ? children.last : children[index - 1]
            
            #now place it back in the correct position
            move_to_right_of left_node
          end
        end
        
        def find_tree_parent parent_id = nil
          self.class.find(parent_id) unless parent_id.nil? || parent_id.zero?
        rescue ActiveRecord::RecordNotFound => e
        
          respond_to do |format|
            format.html { render :text => "The tree parent could not be found"}
            format.xml  { render :text => '', :status => :not_found }
            format.ext  { render :text => "{success: false}"}
          end
        end
      end
    end
  end
end
