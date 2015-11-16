// ==UserScript==
// @id             twitch-plays-control@meiguro.com
// @name           Twitch Plays Pokémon Touch Controller
// @version        0.3.4
// @author         Meiguro <meiguro@meiguro.com> http://meiguro.com/
// @namespace      https://github.com/Meiguro/twitch-plays-control
// @description    Add Touch controls to Twitch Plays Pokemon touch-enabled games.
// @include        /^https?://(www|beta)?\.?twitch.tv/twitch_?plays.*$/
// @require        http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js
// @require        http://ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/jquery-ui.min.js
// @grant          unsafeWindow, GM_addStyle, GM_info
// @run-at         document-start
// @updateURL      https://raw.githubusercontent.com/Meiguro/twitch-plays-control/master/twitch-plays-control.meta.js
// @installURL     https://raw.githubusercontent.com/Meiguro/twitch-plays-control/master/twitch-plays-control.user.js
// @downloadURL    https://raw.githubusercontent.com/Meiguro/twitch-plays-control/master/twitch-plays-control.user.js
// ==/UserScript==

/**
 *   v0.3.4 CHANGELOG ༼ つ ◕_◕ ༽つ
 *
 * - Fixed to support Greasemonkey's new sandbox security
 *
 *   v0.3.3
 *
 * - Fixed auto send to work with new Twitch UI
 *
 * Enjoy!
 *
 * - Meiguro
 */

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* globals GM_addStyle, GM_info */

var util2 = require('util2');

var dd = require('dd');
dd.ui = require('dd-ui');

var Entity = require('entity');
var Touch = require('touch');
var Chat = require('chat');
var Settings = require('settings');
var mywindow = require('window');

require('gm-shims');

var Control = function(def) {
  Entity.call(this, def);
  this.config = {};
};

util2.inherit(Control, Entity, Control.prototype);

Control.DefaultConfig = {
  delay: 50,
  screen: {
    aspect: 1280 / 720,
    position: [0.997, 0.977],
    scale: 0.392,
    size: [320, 240],
    barHeight: 30
  },
  enabled: true,
  showBorder: true,
  showCoordTooltip: true,
  showCross: true,
  autoSend: true,
  showDroplets: true,
  streamDelay: 15,
};

Control.PlayerSelector = '.dynamic-player, .player-container';

Control.prototype.updateLoad = function() {
  if (this.loaded) { return; }
  if (!this.loadable()) { return; }

  this.onload();
};

Control.prototype.update = function(force) {
  this.updateLoad();

  Entity.prototype.update.call(this, force);
};

Control.prototype.onClick = function(e) {
  this.component('touch').onClick(e);
};

Control.prototype.onMove = function(e) {
  this.component('touch').onMove(e);
};

Control.prototype.onPressReset = function(e) {
  $.extend(true, this.config, Control.DefaultConfig);

  this.eachComponent(function(component) {
    for (var k in component) {
      var $elem = component[k];
      if ($elem.$change) {
        $elem.$change();
      }
    }
  });

  this.update(true);
  this.saveConfig();
};

Control.prototype.onPressChangeChatServer = function(e) {
  this.component('chat').onPressChangeChatServer(e);
};

Control.prototype.saveConfig = function() {
  localStorage.TPControl = JSON.stringify(this.config);
};

Control.prototype.loadConfig = function() {
  if (!localStorage.TPControl) {
    localStorage.TPControl = this.config;
  } else {
    try {
      var lastConfig = JSON.parse(localStorage.TPControl);
      for (var k in lastConfig) {
        this.config[k] = lastConfig[k];
      }
    } catch(e) {
      console.log(e);
    }
  }
};

Control.prototype.init = function() {
  var self = this;

  window.$ = window.$ || mywindow.jQuery;

  $.extend(true, this.config, Control.DefaultConfig);

  this.loadConfig();
  this.saveConfig();

  dd.onChange = this.saveConfig.bind(this);

  if (this.config.screen.size[0] != Control.DefaultConfig.screen.size[0]) {
    $.extend(true, this.config.screen, Control.DefaultConfig.screen);
  }

  $('.tpc-mouse-box').remove();
  $('.tpc-control-settings').remove();

  var touch = new Touch();
  var chat = new Chat();
  var settings = new Settings();

  this.addComponent(touch);
  this.addComponent(chat);
  this.addComponent(settings);

  var $player = touch.$player = $(Control.PlayerSelector);
  var $mouseBox = touch.$mouseBox = $('<div/>').addClass('tpc-mouse-box');
  var $coordTooltip = touch.$coordTooltip = $('<div/>').addClass('tpc-coord-tooltip');

  var $chatSettings = settings.$chatSettings = $(Settings.ChatSelector);
  var $controlSettings = settings.$controlSettings = $('<div/>').addClass('tpc-control-settings');

  $player.css({ position: 'relative' });
  $chatSettings.css({ position: 'absolute' });

  $mouseBox.css({
    cursor: 'pointer',
    border: '2px solid rgba(150, 150, 150, 0.2)',
    borderRadius: '5px'
  });

  GM_addStyle(
    '.tpc-mouse-box .tpc-coord-tooltip { display: none; color: #444; font-weight: normal } ' +
    '.tpc-mouse-box:hover .tpc-coord-tooltip { display: block }');

  $coordTooltip.css({
    padding: '0px 5px',
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '2px'
  });

  $mouseBox.empty();
  $mouseBox.append($coordTooltip);

  $controlSettings.empty();
  $controlSettings.append(
    '<div class="chat-menu tpc-touch-menu">' +
      '<div class="chat-menu-header">Touch Control Settings</div>' +
      '<div class="chat-menu-content tpc-control-sliders"></div>' +
      '<div class="chat-menu-content tpc-control-checkboxes"></div>' +
      '<div class="chat-menu-content tpc-control-last"></div>' +
    '</div>' +
    '<div class="chat-menu tpc-chat-menu">' +
      '<div class="chat-menu-header">Chat Server</div>' +
      '<div class="chat-menu-content tpc-control-chat"></div>' +
    '</div>');

  $controlSettings.find('.tpc-control-sliders')
    .append(touch.xSlider = dd.ui.slider(
      'tpc-x-slider tpc-slider', 'Touch-box x-position', { min: 0, max: 1, step: 0.0005 },
      this.config, 'screen.position.0', function() { touch.updateMouseBox(true); }))
    .append(touch.ySlider = dd.ui.slider(
      'tpc-y-slider tpc-slider', 'Touch-box y-position', { min: 0, max: 1, step: 0.0005 },
      this.config, 'screen.position.1', function() { touch.updateMouseBox(true); }))
    .append(touch.scaleSlider = dd.ui.slider(
      'tpc-scale-slider tpc-slider', 'Touch-box scale', { min: 0, max: 1, step: 0.0005 },
      this.config, 'screen.scale', function() { touch.updateMouseBox(true); }));

  $controlSettings.find('.tpc-control-checkboxes')
    .append(touch.enabledCheckbox = dd.ui.checkbox(
      'tpc-enabled-checkbox', 'Enable touch control', this.config, 'enabled',
      function() {
        touch.$mouseBox.css({ display: self.config.enabled ? 'block' : 'none' });
      }))
    .append(touch.borderCheckbox = dd.ui.checkbox(
      'tpc-border-checkbox', 'Show border box', this.config, 'showBorder',
      function() {
        touch.$mouseBox.css({ border: self.config.showBorder ? '2px solid rgba(255, 255, 255, 0.5)' : 'none' });
      }))
    .append(touch.coordTooltipCheckbox = dd.ui.checkbox(
      'tpc-tooltip-checkbox', 'Show coord tooltip', this.config, 'showCoordTooltip',
      function() {
        if (self.config.showCoordTooltip) {
          touch.$mouseBox.append(touch.$coordTooltip);
        } else {
          touch.$coordTooltip.remove();
        }
      }))
    .append(touch.crossCheckbox = dd.ui.checkbox(
      'tpc-cross-checkbox', 'Use cross pointer', this.config, 'showCross',
      function() {
        touch.$mouseBox.css({ cursor: self.config.showCross ? 'crosshair' : 'default' });
      }))
    .append(touch.autoSendCheckbox = dd.ui.checkbox(
      'tpc-auto-send-checkbox', 'Auto-send touches', this.config, 'autoSend'))
    .append(touch.dropletsCheckbox = dd.ui.checkbox(
      'tpc-droplet-checkbox', 'Show touch droplets', this.config, 'showDroplets'));

  $controlSettings.find('.tpc-control-last')
    .append(touch.resetButton = dd.ui.button(
      'tpc-reset-button', 'Reset controller settings', this.onPressReset.bind(this)));

  $controlSettings.find('.tpc-control-chat')
    .append('<p><label>Current <span class="tpc-chat-server"></span></label></p>')
    .append(chat.chatServerButton = dd.ui.button(
      'tpc-chat-server-button', 'Change chat server', this.onPressChangeChatServer.bind(this)));

  $player.append($mouseBox);
  $chatSettings.append($controlSettings);

  $mouseBox.on('click', this.onClick.bind(this));
  $mouseBox.on('mousemove', this.onMove.bind(this));

  settings.update(true);

  this.loaded = true;

  this.start();

  setTimeout(function() {
    $('.chat-room .loading-mask').remove();
  }, 5000);
};

Control.prototype.loadable = function() {
  var $ = mywindow.jQuery;
  if (typeof $ !== 'function') { return false; }

  var hasPlayer = $(Control.PlayerSelector).length;
  var hasChatSettings = $(Settings.ChatSelector).length;
  return hasPlayer || hasChatSettings;
};

Control.prototype.onload = function() {
  this.init();
  if (typeof GM_info === 'object') {
    console.log(GM_info.script.name + ' v' + GM_info.script.version + ' loaded!');
  } else {
    console.log('Twitch Plays Control loaded!');
  }
};

var control = new Control();

setInterval(control.update.bind(control), Control.DefaultConfig.delay);

control.update();

mywindow.TPControl = control;

},{"chat":2,"dd":5,"dd-ui":4,"entity":6,"gm-shims":7,"settings":8,"touch":9,"util2":10,"window":11}],2:[function(require,module,exports){
var util2 = require('util2');
var Component = require('component');

var mywindow = require('window');

var Chat = function(def) {
  Component.call(this, def);
};

util2.inherit(Chat, Component, Chat.prototype);

Chat.InputSelector = '.ember-text-area';
Chat.ButtonSelector = '.send-chat-button';
Chat.HiddenSelector = '.chat-hidden-overlay';
Chat.LogSelector = '.chat-messages .tse-content';
Chat.ServerAddress = '199.9.252.26:6667';

Chat.prototype.name = 'chat';

Chat.prototype.start = function() {
};

Chat.prototype.getChatSession = function() {
  if (this.chatSession) {
    return this.chatSession;
  }

  var App = mywindow.App;
  if (App && App.Room) {
    return (this.chatSession = App.Room._getTmiSession().fulfillmentValue);
  }
};

Chat.prototype.getChatConnection = function() {
  var chatSession = this.getChatSession();
  var connections = chatSession._connections;
  var cluster = connections.prod || connections.event;
  if (cluster) { return cluster; }
  for (var k in connections) {
    return connections[k];
  }
};

Chat.prototype.getCurrentChatAddress = function() {
  var chatSession = this.getChatSession();
  if (!chatSession) { return; }
  var connection = this.getChatConnection();
  if (!connection) { return; }
  var addr = connection._addrs[connection._currentAddressIndex];
  if (!addr) { return; }
  return addr.host + ':' + addr.port;
};

Chat.prototype.connectServer = function(address) {
  var addr = address.split(':');
  var chatSession = this.getChatSession();
  var connection = this.getChatConnection();
  if (!connection) {
    window.alert('TPC: Couldn\'t obtain a chat connection to manipulate!');
    return;
  }

  connection.close();
  connection._addrs = [{ host: addr[0], port: addr[1] }];
  connection._currentAddressIndex = 0;
  connection._numSocketConnectAttempts = 0;
  connection.open();

  var msg = 'connecting to chat server ' + address + '...';
  $(Chat.LogSelector + ' .ember-view:last')
      .before('<div class="chat-line admin"><span class="message">' + msg + '</span></div>');
};

Chat.prototype.isChatVisible = function() {
  return $(Chat.InputSelector).length && !$(Chat.HiddenSelector).is(':visible');
};

Chat.prototype.setInput = function(input, broadcast) {
  $(Chat.InputSelector).val(input).focus().change().blur();
  if (this.config.autoSend) {
    $(Chat.ButtonSelector).click();
  }
  if (!this.isChatVisible() && broadcast !== false) {
    localStorage.TPCInput = input;
  }
};

Chat.prototype.updateInput = function() {
  if (!this.entity.loaded) { return; }
  if (!this.config.enabled) { return; }

  if (!this.isChatVisible()) { return; }

  var input = localStorage.TPCInput;
  delete localStorage.TPCInput;
  if (typeof input === 'string' && input.length > 0) {
    this.setInput(input, false);
  }
};

Chat.prototype.updateChatSession = function() {
  if (this.chatSession) { return; }

  var TMI = mywindow.TMI;
  if (!TMI) { return; }

  if (this.entity.loaded) {
    this.getChatSession();
  }
};

Chat.prototype.update = function() {
  this.updateChatSession();
  this.updateInput();
};

Chat.prototype.onPressChangeChatServer = function(e) {
  var defaultAddress = Chat.ServerAddress;
  var currentAddress = this.getCurrentChatAddress();
  var address = window.prompt(
      'Enter chat server address:' +
      (currentAddress ?
        '\nCurrent ' + currentAddress :
        '\nExample ' + defaultAddress),
      defaultAddress) || '';
  address = address.replace(/\s/, '');
  if (address.length === 0) {
    return;
  }
  if (!address.match(':')) {
    address += ':6667';
  }
  this.connectServer(address);
};

module.exports = Chat;

},{"component":3,"util2":10,"window":11}],3:[function(require,module,exports){
var Component = function(def) {
  this.state = def || {};
};

Component.prototype.component = function(name) {
  return this.entity.component(name);
};

Component.prototype.start = function() {};

Component.prototype.update = function() {};

module.exports = Component;

},{}],4:[function(require,module,exports){
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

},{"dd":5}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
(function (global){

if (typeof GM_addStyle === 'undefined') {
  global.GM_addStyle = function(style) {
    $('head:first').append($('<style>').text(style));
  };
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],8:[function(require,module,exports){
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

},{"component":3,"util2":10}],9:[function(require,module,exports){
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

},{"component":3,"util2":10}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
/* global unsafeWindow */
module.exports = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

},{}]},{},[1])