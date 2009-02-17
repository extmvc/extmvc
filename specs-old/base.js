describe('ExtMVC.behaveLikeRails()', {
  before_each: function() {
    params_mock = {key: 'value'};
    ExtMVC.params = params_mock;
  },
  'should make params a global variable': function() {
    // this ought to work but doesn't (at least on FF3)
    // value_of(params).should_be_undefined();
    
    value_of(typeof(params)).should_be('undefined');
    ExtMVC.behaveLikeRails();
    value_of(params).should_be(params_mock);
  }
});