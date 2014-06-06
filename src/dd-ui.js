var dd = require('dd');

dd.ui = dd.ui || {};

dd.ui.checkbox = function(id, label, obj, ref, onChange) {
  var $elem = $('<p><label for="'+id+'"><input id="'+id+'" type="checkbox"> '+label+'</label></p>');
  var $input = $elem.find('input');
  dd.bindGetSet($elem, $input.prop.bind($input, 'checked'));
  $input.on('change', dd.bindElement($elem, obj, ref, onChange));
  return $elem;
};

dd.ui.slider = function(klass, label, options, obj, ref, onChange) {
  var $elem = $('<p><label>'+label+'</label></p>');
  var $slider = $('<div class="'+klass+'"></div>');
  $slider.slider(options);
  $elem.prepend($slider);
  dd.bindGetSet($elem, $slider.slider.bind($slider, 'value'));
  $slider.slider({ slide: dd.bindElement($elem, obj, ref, onChange) });
  return $elem;
};

dd.ui.button = function(klass, label, onPress) {
  var $elem = $('<button class="'+klass+'">'+label+'</button>');
  $elem.on('click', onPress);
  return $elem;
};

module.exports = dd.ui;
