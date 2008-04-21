# Some lovely hackery to automatically include all .js files under the models and views directories
# javascript_include_tag :models includes all files in public/javascripts/models
# javascript_include_tag :views includes all files in *subfolders* of public/javascripts/views

# EXT MVC EXPANSIONS

#returns all files in the collection which end in .js, then strips the .js extension as these are not needed in the helper
def js_files_in_directory dirname
  collection = Dir.entries("#{Rails.root}/public/javascripts/#{dirname}")
  collection.select {|c| c.split(".").last == 'js'}.collect {|js| "#{dirname}/#{js.split(".").first}"}
end

view_directories = Dir.entries("#{Rails.root}/public/javascripts/views").reject {|v| v =~ /\./}
view_files  = js_files_in_directory('views')
view_files += view_directories.collect {|v| js_files_in_directory("views/#{v}")}.flatten

model_files       = ['models/model'] + js_files_in_directory('models').reject {|m| m =='models/model'}
controller_files  = ['controllers/application_controller.js', 'controllers/crud_controller.js'] + js_files_in_directory('controllers').reject {|m| m == 'controllers/application_controller.js' || m == 'controllers/crud_controller.js'}
helper_files      = js_files_in_directory('helpers')
initializer_files = js_files_in_directory('initializers')
lib_files         = js_files_in_directory('lib')

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :models       => model_files
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :views        => view_files
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :controllers  => controller_files
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :helpers      => helper_files
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :initializers => initializer_files
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :libs         => lib_files

# EXT EXPANSIONS

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :ext => ['ext/adapter/ext/ext-base', 'ext/ext-all']
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :ext_extensions => ['ext/search-field', 
                                                                                      'ext/data-view-plugins',
                                                                                      'ext/renderers',
                                                                                      'ext/check_column']
                                                                                      
ActionView::Helpers::AssetTagHelper.register_javascript_expansion :ext_grid_filter => ['ext/ux/menu/EditableItem',
                                                                                       'ext/ux/menu/RangeMenu',
                                                                                       'ext/ux/grid/GridFilters',
                                                                                       'ext/ux/grid/filter/Filter',
                                                                                       'ext/ux/grid/filter/StringFilter',
                                                                                       'ext/ux/grid/filter/DateFilter',
                                                                                       'ext/ux/grid/filter/ListFilter',
                                                                                       'ext/ux/grid/filter/NumericFilter',
                                                                                       'ext/ux/grid/filter/BooleanFilter']
