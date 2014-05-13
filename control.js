var dd = require('dd');

dd.ui = require('dd-ui');

require('gm-shims');

unsafeWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

var Control = unsafeWindow.TPControl = {};

var config = Control.config = {
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

var State = Control.State = {
  playerSelector: '.dynamic-player, .player-container',
  chatSettingsSelector: '.js-chat-settings',
  settingsButtonSelector: '.settings.button',
  chatInputSelector: '.ember-text-area',
  chatButtonSelector: '.send-chat-button button',
  chatHiddenSelector: '.chat-hidden-overlay',
  chatLogSelector: '.chat-messages .tse-content',
};

Control.getBorderSize = function() {
  return parseInt(State.$mouseBox.css('borderTopWidth'));
};

Control.updateMouseBox = function(force) {
  var $player = State.$player;
  var $mouseBox = State.$mouseBox;
  var $chatSettings = State.$chatSettings;

  var playerWidth = $player.width();
  var playerHeight = $player.height() - config.screen.barHeight;

  if ((Control.lastPlayerWidth === playerWidth &&
       Control.lastPlayerHeight === playerHeight) && force !== true) {
    return;
  }

  Control.lastPlayerWidth = playerWidth;
  Control.lastPlayerHeight = playerHeight;

  var aspect = playerWidth / playerHeight;

  var excessWidth = 0;
  if (aspect > config.screen.aspect) {
    excessWidth = playerWidth - playerHeight * config.screen.aspect;
  }

  State.scale = config.screen.scale * playerHeight / config.screen.size[1];

  var borderSize = Control.getBorderSize();
  var width = State.scale * config.screen.size[0];
  var height = State.scale * config.screen.size[1];

  $mouseBox.css({
    position: 'absolute',
    left: excessWidth / 2 + (playerWidth - width - excessWidth) * config.screen.position[0] - borderSize,
    top: (playerHeight - height) * config.screen.position[1] - borderSize,
    width: width,
    height: height
  });

  if (!$chatSettings.is(':visible')) {
    $mouseBox.stop(true, true).css({ background: 'transparent' });
    return;
  }

  $mouseBox
    .stop(true, true)
    .animate({ backgroundColor: 'rgba(255, 255, 255, 0.5)' }, 100)
    .delay(1000)
    .animate({ backgroundColor: 'rgba(255, 255, 255, 0)' })
    .animate({ background: 'transparent' }, 0);
};

Control.updateControlSettings = function(force) {
  var $chatSettings = State.$chatSettings;
  var $controlSettings = State.$controlSettings;

  if (!$chatSettings.length) { return; }
  if (!$chatSettings.is(':visible') && force !== true) { return; }

  var overflow = $chatSettings.css('overflowY') || '';

  if (overflow.match(/(auto|scroll)/)) {
    $controlSettings.css({ position: 'static', left: 'none', top: 'none' });
    return;
  }

  var minWidth = Math.max(200, $chatSettings.width());
  var position = { left: 0, top: 0 };
  var offset = $chatSettings.offset();
  var isSlim = offset.left > 0 && offset.left < minWidth;

  $controlSettings.css({
    position: 'absolute',
    minWidth: minWidth,
    left: position.left + (minWidth + 5) * (isSlim ? 1 : -1),
    top: position.top + $chatSettings.height() - $controlSettings.height()
  });
};

Control.isChatVisible = function() {
  return $(State.chatInputSelector).length && !$(State.chatHiddenSelector).is(':visible');
};

Control.updateInput = function() {
  if (!Control.isChatVisible()) { return; }

  var input = localStorage.TPCInput;
  delete localStorage.TPCInput;
  if (typeof input === 'string' && input.length > 0) {
    Control.setInput(input, false);
  }
};

Control.connectChat = function(address) {
  var addr = address.split(':');
  var chatSession = Control.getChatSession();
  var eventCluster = chatSession._connections.event;

  eventCluster.close();
  eventCluster._addrs = [{ host: addr[0], port: addr[1] }];
  eventCluster._currentAddressIndex = 0;
  eventCluster._numSocketConnectAttempts = 0;
  eventCluster.open();

  var msg = 'connecting to chat server ' + address + '...';
  $(State.chatLogSelector + ' .ember-view:last')
    .before('<div class="chat-line admin"><span class="message">' + msg + '</span></div>');
};

Control.getChatSession = function() {
  if (State.chatSession) {
    return State.chatSession;
  }

  var App = unsafeWindow.App;
  if (App && App.Room) {
    return State.chatSession = App.Room._getTmiSession().fulfillmentValue;
  }
};

Control.updateChat = function() {
  if (State.chatSession) { return; }

  var TMI = unsafeWindow.TMI;
  if (!TMI) { return; }

  if (State.loaded) {
    Control.getChatSession();
  }
};

Control.updateLoad = function() {
  if (State.loaded) { return; }
  if (!Control.loadable()) { return; }

  try {
    Control.onload();
  } catch (e) {
    console.log(e.message);
    console.log(e.stack);
  }
};

Control.update = function() {
  Control.updateChat();

  if (!State.loaded) {
    Control.updateLoad();
    return;
  }

  var $player = State.$player;
  var $mouseBox = State.$mouseBox;

  if (!config.enabled) { return; }

  Control.updateInput();
  Control.updateControlSettings();
  Control.updateMouseBox();
};

Control.setInput = function(input, broadcast) {
  $(State.chatInputSelector).val(input)
    .focus().change().blur();
  if (config.autoSend) {
    $(State.chatButtonSelector).click();
  }
  if (!Control.isChatVisible() && broadcast !== false) {
    localStorage.TPCInput = input;
  }
};

Control.spawnDroplet = function(position) {
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
  State.$mouseBox.append($drop);
  $drop
    .animate({
      left: position[0],
      top: position[1],
      width: 0,
      height: 0
    }, config.streamDelay * 1000)
    .queue(function() {
      $drop.remove();
      $drop.dequeue();
    });
};

Control.getTouchPosition = function(e) {
  var $mouseBox = State.$mouseBox;
  var offset = $mouseBox.offset();
  var borderSize = Control.getBorderSize();
  var x = e.clientX - offset.left - 2 * borderSize;
  var y = e.clientY - offset.top - 2 * borderSize;
  var touchX = Math.ceil(x / State.scale);
  var touchY = Math.ceil(y / State.scale);
  var valid = (touchX > 0 && touchX <= config.screen.size[0]) &&
              (touchY > 0 && touchY <= config.screen.size[1]);
  return {
    mouse: [x, y],
    position: [touchX, touchY],
    input: touchX + ',' + touchY,
    valid: valid
  };
};

Control.onClick = function(e) {
  var touch = Control.getTouchPosition(e);
  if (!touch.valid) { return; }
  Control.setInput(touch.input);
  if (config.showDroplets) {
    Control.spawnDroplet(touch.mouse);
  }
};

Control.onMove = function(e) {
  if (!config.showCoordTooltip) { return; }
  var touch = Control.getTouchPosition(e);
  var borderSize = Control.getBorderSize();
  var $coordTooltip = State.$coordTooltip;
  $coordTooltip
    .text(touch.valid ? touch.input : '')
    .css({
      position: 'absolute',
      left: touch.mouse[0] + borderSize + 15,
      top: touch.mouse[1] + borderSize - $coordTooltip.outerHeight() / 2
    });
};

Control.onPressReset = function(e) {
  config = Control.config = $.extend(true, {}, Control.configDefault);
  for (var k in State) {
    var $elem = State[k];
    if ($elem.$change) {
      $elem.$change();
    }
  }
  Control.update(true);
  Control.saveConfig();
};

Control.onPressChangeChatServer = function(e) {
  var address = window.prompt('Enter chat server address:\nExample 199.9.250.239:6667') || '';
  address = address.replace(/\s/, '');
  if (address.length === 0) {
    return;
  }
  if (!address.match(':')) {
    address += ':6667';
  }
  Control.connectChat(address);
};

Control.saveConfig = function() {
  localStorage.TPControl = JSON.stringify(config);
};

Control.loadConfig = function() {
  if (!localStorage.TPControl) {
    localStorage.TPControl = Control.config;
  } else {
    try {
      lastConfig = JSON.parse(localStorage.TPControl);
      for (var k in lastConfig) {
        config[k] = lastConfig[k];
      }
    } catch(e) {
      console.log(e);
    }
  }
};

Control.init = function() {
  window.$ = unsafeWindow.jQuery;

  Control.configDefault = $.extend(true, {}, config);

  Control.loadConfig();
  Control.saveConfig();

  dd.onChange = Control.saveConfig;

  $('.tpc-mouse-box').remove();
  $('.tpc-control-settings').remove();

  var $player = State.$player = $(State.playerSelector);
  var $chatSettings = State.$chatSettings = $(State.chatSettingsSelector);
  var $mouseBox = State.$mouseBox = $('<div/>').addClass('tpc-mouse-box');
  var $coordTooltip = State.$coordTooltip = $('<div/>').addClass('tpc-coord-tooltip');
  var $controlSettings = State.$controlSettings = $('<div/>').addClass('tpc-control-settings');

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
    .append(State.xSlider = dd.ui.slider(
      'tpc-x-slider tpc-slider', 'Touch-box x-position', { min: 0, max: 1, step: 0.0005 },
      config, 'screen.position.0', function() { Control.updateMouseBox(true); }))
    .append(State.ySlider = dd.ui.slider(
      'tpc-y-slider tpc-slider', 'Touch-box y-position', { min: 0, max: 1, step: 0.0005 },
      config, 'screen.position.1', function() { Control.updateMouseBox(true); }))
    .append(State.scaleSlider = dd.ui.slider(
      'tpc-scale-slider tpc-slider', 'Touch-box scale', { min: 0, max: 1, step: 0.0005 },
      config, 'screen.scale', function() { Control.updateMouseBox(true); }));

  $controlSettings.find('.tpc-control-checkboxes')
    .append(State.enabledCheckbox = dd.ui.checkbox(
      'tpc-enabled-checkbox', 'Enable touch control', config, 'enabled',
      function() {
        $mouseBox.css({ display: config.enabled ? 'block' : 'none' }); }))
    .append(State.borderCheckbox = dd.ui.checkbox(
      'tpc-border-checkbox', 'Show border box', config, 'showBorder',
      function() {
        $mouseBox.css({ border: config.showBorder ? '2px solid rgba(255, 255, 255, 0.5)' : 'none' });
      }))
    .append(State.coordTooltipCheckbox = dd.ui.checkbox(
      'tpc-tooltip-checkbox', 'Show coord tooltip', config, 'showCoordTooltip',
      function() {
        if (config.showCoordTooltip) {
          State.$mouseBox.append(State.$coordTooltip);
        } else {
          State.$coordTooltip.remove();
        }
      }))
    .append(State.crossCheckbox = dd.ui.checkbox(
      'tpc-cross-checkbox', 'Use cross pointer', config, 'showCross',
      function() {
        State.$mouseBox.css({ cursor: config.showCross ? 'crosshair' : 'default' });
      }))
    .append(State.autoSendCheckbox = dd.ui.checkbox(
      'tpc-auto-send-checkbox', 'Auto-send touches', config, 'autoSend'))
    .append(State.dropletsCheckbox = dd.ui.checkbox(
      'tpc-droplet-checkbox', 'Show touch droplets', config, 'showDroplets'));

  $controlSettings.find('.tpc-control-last')
    .append(State.resetButton = dd.ui.button(
      'tpc-reset-button', 'Reset controller settings', Control.onPressReset));

  $controlSettings.find('.tpc-control-chat')
    .append(State.chatServerButton = dd.ui.button(
      'tpc-chat-server-button', 'Change chat server', Control.onPressChangeChatServer));

  $player.append($mouseBox);
  $chatSettings.append($controlSettings);

  $mouseBox.on('click', Control.onClick);
  $mouseBox.on('mousemove', Control.onMove);

  Control.updateControlSettings(true);

  State.loaded = true;

  setTimeout(function() {
    $('.chat-room .loading-mask').remove();
  }, 5000);
};

Control.loadable = function() {
  var $ = unsafeWindow.jQuery;
  if (typeof $ !== 'function') { return false; }

  var hasPlayer = $(State.playerSelector).length;
  var hasChatSettings = $(State.chatSettingsSelector).length;
  return hasPlayer || hasChatSettings;
};

Control.onload = function() {
  Control.init();
  if (typeof GM_info === 'object') {
    console.log(GM_info.script.name + ' v' + GM_info.script.version + ' loaded!');
  } else {
    console.log('Twitch Plays Control loaded!');
  }
};

Control.interval = setInterval(Control.update, config.delay);
Control.update();
