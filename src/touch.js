var util2 = require('util2');
var Component = require('component');

var Touch = function(def) {
  Component.call(this, def);
};

util2.inherit(Touch, Component, Touch.prototype);

Touch.SizeEdge = [false, false];

Touch.prototype.name = 'touch';

Touch.prototype.start = function() {
};

Touch.prototype.getBorderSize = function() {
  return parseInt(this.$mouseBox.css('borderTopWidth'));
};

Touch.prototype.getTouchPosition = function(e) {
  var offset = this.$mouseBox.offset();
  var borderSize = this.getBorderSize();
  var x = e.clientX - offset.left - 2 * borderSize;
  var y = e.clientY - offset.top - 2 * borderSize;

  var minX = 0 + (Touch.SizeEdge[0] ? 0 : 1);
  var minY = 0 + (Touch.SizeEdge[1] ? 0 : 1);
  var maxX = this.config.screen.size[0] - (Touch.SizeEdge[0] ? 0 : 1);
  var maxY = this.config.screen.size[1] - (Touch.SizeEdge[1] ? 0 : 1);

  var touchX = Math.ceil(x / this.scale);
  var touchY = Math.ceil(y / this.scale);
  var valid = (touchX >= minX && touchX <= maxX) &&
              (touchY >= minY && touchY <= maxY);
  return {
    mouse: [x, y],
    position: [touchX, touchY],
    input: touchX + ',' + touchY,
    valid: valid
  };
};

Touch.prototype.spawnDroplet = function(position) {
  var $drop = $('<div/>').addClass('tpc-droplet');
  var size = 10;
  $drop.css({
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: size,
    position: 'absolute',
    left: position[0] - size / 2,
    top: position[1] - size / 2,
    width: size,
    height: size
  });
  this.$mouseBox.append($drop);
  $drop
    .animate({
      left: position[0],
      top: position[1],
      width: 0,
      height: 0
    }, this.config.streamDelay * 1000)
    .queue(function() {
      $drop.remove();
      $drop.dequeue();
    });
};

Touch.prototype.updateMouseBox = function(force) {
  var playerWidth = this.$player.width();
  var playerHeight = this.$player.height() - this.config.screen.barHeight;

  if ((this.playerWidth === playerWidth &&
       this.playerHeight === playerHeight) && force !== true) {
    return;
  }

  this.playerWidth = playerWidth;
  this.playerHeight = playerHeight;

  var aspect = playerWidth / playerHeight;

  var excessWidth = 0;
  if (aspect > this.config.screen.aspect) {
    excessWidth = playerWidth - playerHeight * this.config.screen.aspect;
  }

  this.scale = this.config.screen.scale * playerHeight / this.config.screen.size[1];

  var borderSize = this.getBorderSize();
  var width = this.scale * this.config.screen.size[0];
  var height = this.scale * this.config.screen.size[1];

  this.$mouseBox.css({
    position: 'absolute',
    left: excessWidth / 2 + (playerWidth - width - excessWidth) * this.config.screen.position[0] - borderSize,
    top: (playerHeight - height) * this.config.screen.position[1] - borderSize,
    width: width,
    height: height
  });

  if (!this.component('settings').$chatSettings.is(':visible')) {
    this.$mouseBox.stop(true, true).css({ background: 'transparent' });
    return;
  }

  this.$mouseBox
    .stop(true, true)
    .animate({ backgroundColor: 'rgba(255, 255, 255, 0.5)' }, 100)
    .delay(1000)
    .animate({ backgroundColor: 'rgba(255, 255, 255, 0)' })
    .animate({ background: 'transparent' }, 0);
};

Touch.prototype.update = function(force) {
  if (!this.entity.loaded) { return; }
  if (!this.config.enabled) { return; }

  this.updateMouseBox(force);
};

Touch.prototype.onClick = function(e) {
  var touch = this.getTouchPosition(e);
  if (!touch.valid) { return; }
  this.component('chat').setInput(touch.input);
  if (this.config.showDroplets) {
    this.spawnDroplet(touch.mouse);
  }
};

Touch.prototype.onMove = function(e) {
  if (!this.config.showCoordTooltip) { return; }
  var touch = this.getTouchPosition(e);
  var borderSize = this.getBorderSize();
  this.$coordTooltip
    .text(touch.valid ? touch.input : '')
    .css({
      position: 'absolute',
      left: touch.mouse[0] + borderSize + 15,
      top: touch.mouse[1] + borderSize - this.$coordTooltip.outerHeight() / 2
    });
};

module.exports = Touch;
