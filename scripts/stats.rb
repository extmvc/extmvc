module ExtMVC
  module Stats
    def self.dispatch
      Statistics.new.output
    end
    
    class Statistics
      
      # Gathers and aggregates all project statistics
      def statistics
        @statistics ||= begin
          stats = {}
        
          # Calculate requested stats
          line_order.each do |line|
            stats[line] = array_statistics(self.send(line))
          end
        
          # Calculate totals
          stats[:total_code_loc] = project_code_arrays.inject(0) {|sum, e| sum + stats[e][:loc_count]}
          stats[:total_spec_loc] = project_spec_arrays.inject(0) {|sum, e| sum + stats[e][:loc_count]}
          
          stats
        end
      end
      
      # Prints statistics to the console
      def output
        print_headings
        
        line_order.each do |line_name|
          stats = statistics[line_name]
          
          arr = [line_headings[line_name]] + column_order.collect {|col| stats[col]}
          print_line(arr)
        end
        
        print_separator
        print_summary
      end
      
      # Prints a headings line based on column_order
      def print_headings
        puts
        print_separator
        
        columns = ["Name"];
        column_order.each {|heading| columns.push(column_headings[heading])}
        print_line(columns)
        
        print_separator
      end
      
      def print_totals
        # columns = ["Totals"]
        # column_order.collect {|c| statistics}
        
        # print_line(columns)
      end
      
      # Prints a summary line with total LOC
      def print_summary
        stats = [statistics[:total_code_loc], statistics[:total_spec_loc]]
        stats.push(stats[1].to_f / stats[0].to_f)
        
        puts "  Code LOC: %s     Test LOC: %s     Code to Test Ratio: 1:%1.1f" % stats
        puts
      end
      
      # Prints a separator line
      def print_separator
        str = "+" + "-" * (title_width + 2)
        
        column_order.length.times do
          str += "+" + "-" * (column_width + 2)
        end
        
        puts str + '+'
      end
      
      # Prints an array of string as a line
      def print_line(line_elements)
        str = "| "
        
        line_elements.each_with_index do |element, index|
          if index == 0
            str += element.to_s.ljust(title_width)  + " | "
          else
            str += element.to_s.rjust(column_width) + " | "
          end
        end

        puts str
      end

      # Calculates the width of the first column.  Elements will be padded to this width
      def title_width
        line_headings.values.collect {|l| l.to_s.length}.max + 8
      end
      
      # Calculates the width of all columns but the first.  Elements will be padded to this width
      def column_width
        column_headings.values.collect {|l| l.to_s.length}.max + 2
      end
      
      # The statistics columns to show, in order
      def column_order
        [:line_count, :loc_count, :file_count, :class_length]
      end
      
      # The lines to show, in order
      def line_order
        [:controller_files, :model_files, :view_files, :lib_files, :controller_specs, :model_specs, :view_specs]
      end
      
      # The arrays to use when calculating totals for project LOC etc
      def project_code_arrays
        [:controller_files, :model_files, :view_files, :lib_files]
      end
      
      # The arrays to use when calculating totals for project spec LOC etc
      def project_spec_arrays
        [:controller_specs, :model_specs, :view_specs]
      end
      
      # Mappings between method and human names for line headings
      def line_headings
        {
          :controller_files => "Controllers",
          :model_files      => "Models",
          :view_files       => "Views",
          :lib_files        => "Libraries",
          :plugin_files     => "Plugins",
          :controller_specs => "Controller Specs",
          :model_specs      => "Model Specs",
          :view_specs       => "View Specs"
        }
      end
      
      # Mappings between method and human names for column headings
      def column_headings
        {
          :line_count      => "Lines",
          :loc_count       => "LOC",
          :file_count      => "Classes",
          :method_count    => "Methods",
          :average_methods => "M/C",
          :method_length   => "LOC/M",
          :class_length    => "LOC/C"
        }
      end
      
      def controller_files
        files_in('app/controllers') + ['app/App.js']
      end
      
      def model_files
        files_in('app/models')
      end
      
      def view_files
        files_in('app/views')
      end

      def lib_files
        files_in('lib')
      end
      
      def plugin_files
        files_in('vendor/plugins')
      end
      
      def controller_specs
        files_in('spec/controllers')
      end
      
      def model_specs
        files_in('spec/models')        
      end
      
      def view_specs
        files_in('spec/views')
      end

      private
      def files_in(directory)
        Dir.glob("#{directory}/**/*.js")
      end
      
      #calculates aggregated statistics for an array of files
      def array_statistics(files_array)
        file_count = 0; line_count = 0; loc_count = 0;
        
        files_array.collect {|f| file_statistics(f)}.each do |stats|
          file_count += 1
          line_count += stats[:line_count]
          loc_count  += stats[:loc_count]
        end
        
        {
          :file_count   => file_count,
          :line_count   => line_count,
          :loc_count    => loc_count,
          :class_length => file_count == 0 ? 0 : loc_count / file_count
        }
      end
      
      #calculates statistics on a given file
      def file_statistics(filename)
        line_count = 0; loc_count = 0;
        
        File.new(filename, 'r').each_line do |line|
          line.strip!
          line_count += 1
          
          # don't count blank lines or comment lines in LOC
          loc_count  += 1 if line.gsub(/[\/\*\s]/i, "").length > 1 && line.match(/^\/\//).nil?
        end
        
        {:line_count => line_count, :loc_count => loc_count}
      end
    end
  end
end

# +----------------------+-------+-------+---------+---------+-----+-------+
# | Name                 | Lines |   LOC | Classes | Methods | M/C | LOC/M |
# +----------------------+-------+-------+---------+---------+-----+-------+
# | Controllers          |  1479 |  1172 |      26 |     152 |   5 |     5 |
# | Helpers              |   113 |    47 |       0 |       6 |   0 |     5 |
# | Models               |  1239 |   869 |      32 |      93 |   2 |     7 |
# | Libraries            |   609 |   367 |       2 |      54 |  27 |     4 |
# | Model specs          |  1361 |   989 |       0 |       3 |   0 |   327 |
# | Controller specs     |  3372 |  2319 |       1 |      73 |  73 |    29 |
# | Helper specs         |   159 |   148 |       0 |       0 |   0 |     0 |
# +----------------------+-------+-------+---------+---------+-----+-------+
# | Total                |  8332 |  5911 |      61 |     381 |   6 |    13 |
# +----------------------+-------+-------+---------+---------+-----+-------+
#   Code LOC: 2455     Test LOC: 3456     Code to Test Ratio: 1:1.4
