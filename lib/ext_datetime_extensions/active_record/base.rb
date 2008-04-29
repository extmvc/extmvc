module ExtDatetimeExtensions
  module ActiveRecord #:nodoc:
    module Base
      def self.included(base)
        base.extend(ClassMethods)
      end
      
      module ClassMethods
        def ext_datetime_fields *opts      
          include ExtDatetimeExtensions::ActiveRecord::Base::InstanceMethods
          
          # Adds a date, time, date= and time= for each option
          # 
          # e.g. if we had this in the model:
          # class SomeClass < ActiveRecord::Base
          #   ext_datetime_fields :starts_at, :ends_at
          # end
          # 
          # we get these methods:
          # starts_at_date
          # starts_at_time
          # starts_at_date=(datestring)
          # starts_at_time=(timestring)
          # ends_at_date
          # ends_at_time
          # ends_at_date=(datestring)
          # ends_at_time=(timestring)
          opts.each do |datetime_field|
            src = <<-end_eval
            def #{datetime_field}_date
              self.#{datetime_field} = Time.now if self.#{datetime_field}.nil?
              "#\{padded_datetime_field(self.#{datetime_field}.day)}/#\{padded_datetime_field(self.#{datetime_field}.month)}/#\{self.#{datetime_field}.year}"
            end
            
            def #{datetime_field}_time
              self.#{datetime_field} = Time.now if self.#{datetime_field}.nil?
              "#\{padded_datetime_field(self.#{datetime_field}.hour)}:#\{padded_datetime_field(self.#{datetime_field}.min)}"
            end
            
            #sets the datefield date components based on a string such as "DD/MM/YYYY"
            def #{datetime_field}_date= datestring
              day, month, year = datestring.split("/")
              self.#{datetime_field} = Time.now if self.#{datetime_field}.nil?
              self.#{datetime_field} = Time.mktime(year, month, day, self.#{datetime_field}.hour, self.#{datetime_field}.min, self.#{datetime_field}.sec)
            end
            
            #sets the datefield date components based on a string such as HH::mm
            def #{datetime_field}_time= timestring
              hour, min, sec = timestring.split(":")
              sec = 0 if sec.nil?
              
              self.#{datetime_field} = Time.now if self.#{datetime_field}.nil?
              self.#{datetime_field} = Time.mktime(self.#{datetime_field}.year, self.#{datetime_field}.month, self.#{datetime_field}.day, hour, min, sec)
            end
  
            end_eval
            
            module_eval src, __FILE__, __LINE__
          end
        end
      end
      
      module InstanceMethods
        # returns a formatted string of an hour, min, sec, day or month
        # e.g.:
        # padded_datetime_field(1)  => "01"
        # padded_datetime_field(11) => "11"
        def padded_datetime_field field
          field.to_s.rjust(2, "0")
        end
      end
    end
  end
end