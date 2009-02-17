describe('String methods', {
  'should capitalise a word': function() {
    word = 'test';
    value_of(String.capitalize(word)).should_be('Test');
  },
  'should capitalise only the first word in a sentence': function() {
    sentence = "the sentence";
    value_of(String.capitalize(sentence)).should_be("The sentence");
  },
  'should titleize a sentence': function() {
    sentence = "this is a sentence";
    value_of(String.titleize(sentence)).should_be("This Is A Sentence");
  },
  'should camelize a simple string': function() {
    underscored_string = 'classname';
    value_of(String.camelize(underscored_string)).should_be('Classname');
  },
  'should camelize a long string': function() {
    underscored_string = 'long_class_name';
    value_of(String.camelize(underscored_string)).should_be('LongClassName');
  }
});