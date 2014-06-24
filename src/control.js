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
    aspect: 1920 / 1080,
    position: [0.538, 0.9815],
    scale: 0.443,
    size: [256, 192],
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

  window.$ = mywindow.jQuery;

  $.extend(true, this.config, Control.DefaultConfig);

  this.loadConfig();
  this.saveConfig();

  dd.onChange = this.saveConfig.bind(this);

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
