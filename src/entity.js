var Entity = function(def) {
  this.state = def || {};
  this._components = [];
  this._componentsByName = {};
};

Entity.prototype.component = function(name) {
  return this._componentsByName[name];
};

Entity.prototype.eachComponent = function(callback) {
  this._components.forEach(callback.bind(this));
};

Entity.prototype.addComponent = function(component) {
  if (component.entity) {
    component.entity.removeComponent(component);
  }
  this._componentsByName[component.name] = component;
  this._components.push(component);
  component.entity = this;
  component.config = this.config;
};

Entity.prototype.removeComponent = function(component) {
  var index = this._components.indexOf(component);
  if (index === -1) { return; }
  this._components.splice(index, 1);
  delete this._componentsByName[component.name];
  delete component.entity;
  delete component.config;
};

Entity.prototype.start = function() {
  for (var i = 0, ii = this._components.length; i < ii; ++i) {
    this._components[i].start();
  }
};

Entity.prototype.update = function(force) {
  for (var i = 0, ii = this._components.length; i < ii; ++i) {
    this._components[i].update(force);
  }
};

module.exports = Entity;
