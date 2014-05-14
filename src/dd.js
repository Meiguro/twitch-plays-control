var dd = {};

dd.last = function(a) {
  return a[a.length - 1];
};

dd.toKey = function(obj, key) {
  return obj instanceof Array ? parseInt(key) : key;
};

dd.getByKeys = function(obj, keys, offset) {
  for (var i = 0, ii = keys.length - (offset || 0); i < ii; ++i) {
    obj = obj[dd.toKey(obj, keys[i])];
  }
  return obj;
};

dd.setByKey = function(obj, key, value) {
  obj[dd.toKey(obj, key)] = value;
};

dd.set = function(obj, ref, value) {
  var keys = ref.split('.');
  dd.setByKey(dd.getByKeys(obj, keys, 1), dd.last(keys), value);
};

dd.get = function(obj, ref) {
  return dd.getByKeys(obj, ref.split('.'));
};

dd.bindGetSet = function($elem, get, set) {
  $elem.$get = get;
  $elem.$set = set || get;
};

dd.bindElement = function($elem, obj, ref, onChange) {
  $elem.$obj = obj;
  $elem.$ref = ref;
  $elem.$change = function(e) {
    if (e) {
      dd.set(obj, ref, $elem.$get());
    } else {
      $elem.$set(dd.get(obj, ref));
    }
    if (onChange) { onChange(e); }
    if (dd.onChange) { dd.onChange(e); }
  };
  $elem.$change();
  return $elem.$change;
};

module.exports = dd;
