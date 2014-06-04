var util2 = require('util2');
var Component = require('component');

var Settings = function(def) {
  Component.call(this, def);
};

util2.inherit(Settings, Component, Settings.prototype);

Settings.ChatSelector = '.js-chat-settings';
Settings.ButtonSelector = '.settings.button';

Settings.prototype.name = 'settings';

Settings.prototype.start = function() {
};

Settings.prototype.updateServerLabel = function() {
  var $chatServer = this.$chatSettings.find('.tpc-chat-server');

  var labelAddress = $chatServer.text();
  var currentAddress = this.component('chat').getCurrentChatAddress();
  if (currentAddress !== labelAddress) {
    $chatServer.text(currentAddress);
  }
};

Settings.prototype.updatePosition = function(force) {
  var overflow = this.$chatSettings.css('overflowY') || '';

  if (overflow.match(/(auto|scroll)/)) {
    this.$controlSettings.css({ position: 'static', left: 'none', top: 'none' });
    return;
  }

  var minWidth = Math.max(200, this.$chatSettings.width());
  var position = { left: 0, top: 0 };
  var offset = this.$chatSettings.offset();
  var isSlim = offset.left > 0 && offset.left < minWidth;

  this.$controlSettings.css({
    position: 'absolute',
    minWidth: minWidth,
    left: position.left + (minWidth + 5) * (isSlim ? 1 : -1),
    top: position.top + this.$chatSettings.height() - this.$controlSettings.height()
  });
};

Settings.prototype.update = function(force) {
  if (!this.entity.loaded) { return; }

  if (!this.$chatSettings.length) { return; }
  if (!this.$chatSettings.is(':visible') && force !== true) { return; }

  this.updateServerLabel();
  this.updatePosition();
};

module.exports = Settings;
