/*
 * util2.js by Meiguro - MIT License
 */

var util2 = (function(){

var util2 = {};

util2.noop = function() {};

util2.copy = function(a, b) {
  b = b || (a instanceof Array ? [] : {});
  for (var k in a) { b[k] = a[k]; }
  return b;
};

util2.inherit = function(child, parent, proto) {
  child.prototype = Object.create(parent.prototype);
  child.prototype.constructor = child;
  if (proto) {
    util2.copy(proto, child.prototype);
  }
  return child.prototype;
};

if (typeof module !== 'undefined') {
  module.exports = util2;
}

return util2;

})();
