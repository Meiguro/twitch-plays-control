var Component = function(def) {
  this.state = def || {};
};

Component.prototype.component = function(name) {
  return this.entity.component(name);
};

Component.prototype.start = function() {};

Component.prototype.update = function() {};

module.exports = Component;
