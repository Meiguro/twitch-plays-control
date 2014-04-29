// ==UserScript==
// @id             twitch-plays-control@meiguro.com
// @name           Twitch Plays Pokémon Touch Controller
// @version        0.1.3
// @author         Meiguro <meiguro@meiguro.com> http://meiguro.com/
// @description    Add Touch controls to Twitch Plays Pokemon touch-enabled games.
// @include        /^https?://(www|beta)?\.?twitch.tv/twitchplayspokemon.*$/
// @grant          unsafeWindow, GM_addStyle, GM_info
// @run-at         document-start
// @updateURL      https://rawgit.com/Meiguro/twitch-plays-control/master/twitch-plays-control.user.js
// @installURL     https://rawgit.com/Meiguro/twitch-plays-control/master/twitch-plays-control.user.js
// @downloadURL    https://rawgit.com/Meiguro/twitch-plays-control/master/twitch-plays-control.user.js
// ==/UserScript==


if (typeof GM_addStyle === 'undefined') {
  GM_addStyle = function(style) {
    $('head:first').append($('<style>').text(style));
  };
}

var Control = unsafeWindow.TPControl = {};

var config = Control.config = {
  delay: 100,
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
  streamDelay: 15
};

var State = Control.State = {};

Control.getBorderSize = function() {
  return parseInt(State.$mouseBox.css('borderTop'));
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

  Control.scale = [
    config.screen.scale * playerHeight / config.screen.size[1]
  ];

  var borderSize = Control.getBorderSize();
  var width = Control.scale * config.screen.size[0];
  var height = Control.scale * config.screen.size[1];

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

  var $child = $chatSettings.find(':first');
  var minWidth = Math.max(200, $child.width());
  var offset = minWidth + 5;
  var chatSettingsLeft = $chatSettings.offset().left;
  var isSlim = chatSettingsLeft > 0 && chatSettingsLeft < minWidth;

  $controlSettings.css({
    position: 'absolute',
    minWidth: Math.max(minWidth, $child.width()),
    left: isSlim ? offset : 'none',
    right: isSlim ? 'none' : offset,
    bottom: 0
  });
};

Control.isChatVisible = function() {
  return $('.ember-text-area').length && !$('.chat-hidden-overlay').is(':visible');
};

Control.updateInput = function() {
  if (!Control.isChatVisible()) { return; }

  var input = localStorage.TPCInput;
  delete localStorage.TPCInput;
  if (typeof input === 'string' && input.length > 0) {
    Control.setInput(input, false);
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
  $('.ember-text-area').val(input).focus().trigger('change').change().blur();
  if (config.autoSend) {
    $('.send-chat-button button').click();
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
  var touchX = Math.ceil(x / Control.scale);
  var touchY = Math.ceil(y / Control.scale);
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

var makeCheckbox = function(id, label, onChange, value) {
  var $elem = $('<p><label for="'+id+'"><input id="'+id+'" type="checkbox">'+label+'</label></p>');
  var $input = $elem.find('input').prop('checked', value).on('change', onChange);
  onChange.call($input, onChange);
  $elem.$control = $input;
  return $elem;
};

var makeSlider = function(klass, label, options) {
  var $slider = $('<div class="'+klass+'"></div>');
  $slider.slider(options);
  var $elem = $('<p><label>'+label+'</label></p>');
  $elem.prepend($slider);
  $elem.$control = $slider;
  return $elem;
};

var makeButton = function(klass, label, onPress) {
  var $elem = $('<button class="'+klass+'">'+label+'</button>');
  $elem.on('click', onPress);
  return $elem;
};

Control.saveConfig = function() {
  localStorage.TPControl = JSON.stringify(config);
};

Control.onChangeXPosition = function(e) {
  if (e) {
    config.screen.position[0] = $(this).slider('value');
  } else {
    $(this).slider('value', config.screen.position[0]);
  }
  Control.updateMouseBox(true);
  Control.saveConfig();
};

Control.onChangeYPosition = function(e) {
  if (e) {
    config.screen.position[1] = $(this).slider('value');
  } else {
    $(this).slider('value', config.screen.position[1]);
  }
  Control.updateMouseBox(true);
  Control.saveConfig();
};

Control.onChangeScale = function(e) {
  if (e) {
    config.screen.scale = $(this).slider('value');
  } else {
    $(this).slider('value', config.screen.scale);
  }
  Control.updateMouseBox(true);
  Control.saveConfig();
};

Control.onChangeEnabled = function(e) {
  if (e) {
    config.enabled = $(this).is(':checked');
  } else {
    $(this).prop('checked', config.enabled);
  }
  State.$mouseBox.css({
    display: config.enabled ? 'block' : 'none'
  });
  Control.saveConfig();
};

Control.onChangeBorder = function(e) {
  if (e) {
    config.showBorder = $(this).is(':checked');
  } else {
    $(this).prop('checked', config.showBorder);
  }
  State.$mouseBox.css({
    border: config.showBorder ? '2px solid rgba(255, 255, 255, 0.5)' : 'none'
  });
  Control.saveConfig();
};

Control.onChangeCoordTooltip = function(e) {
  if (e) {
    config.showCoordTooltip = $(this).is(':checked');
  } else {
    $(this).prop('checked', config.showCoordTooltip);
  }
  if (config.showCoordTooltip) {
    State.$mouseBox.append(State.$coordTooltip);
  } else {
    State.$coordTooltip.remove();
  }
  Control.saveConfig();
};

Control.onChangeCross = function(e) {
  if (e) {
    config.showCross = $(this).is(':checked');
  } else {
    $(this).prop('checked', config.showCross);
  }
  State.$mouseBox.css({
    cursor: config.showCross ? 'crosshair' : 'default',
  });
  Control.saveConfig();
};

Control.onChangeAutoSend = function(e) {
  if (e) {
    config.autoSend = $(this).is(':checked');
  } else {
    $(this).prop('checked', config.autoSend);
  }
  Control.saveConfig();
};

Control.onChangeDroplets = function(e) {
  if (e) {
    config.showDroplets = $(this).is(':checked');
  } else {
    $(this).prop('checked', config.showDroplets);
  }
  Control.saveConfig();
};

Control.onPressReset = function(e) {
  config = Control.config = $.extend(true, {}, Control.configDefault);
  Control.onChangeXPosition.call(State.xSlider.$control);
  Control.onChangeYPosition.call(State.ySlider.$control);
  Control.onChangeScale.call(State.scaleSlider.$control);
  Control.onChangeEnabled.call(State.enabledCheckbox.$control);
  Control.onChangeBorder.call(State.borderCheckbox.$control);
  Control.onChangeCoordTooltip.call(State.coordTooltipCheckbox.$control);
  Control.onChangeCross.call(State.crossCheckbox.$control);
  Control.onChangeAutoSend.call(State.autoSendCheckbox.$control);
  Control.onChangeDroplets.call(State.dropletsCheckbox.$control);
  Control.update(true);
  Control.saveConfig();
};

Control.init = function() {
  window.$ = unsafeWindow.jQuery;

  Control.configDefault = $.extend(true, {}, config);

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
  Control.saveConfig();

  $('.tpc-mouse-box').remove();
  $('.tpc-control-settings').remove();

  var $player = State.$player = $('.dynamic-player');
  if ($player.length) {
    Control.isRegular = true;
  } else {
    $player = State.$player = $('.player-container');
    if ($player.length) {
      Control.isPopout = true;
    }
  }

  var $chatSettings = State.$chatSettings = $('.js-chat-settings');
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
    '.tpc-mouse-box .tpc-coord-tooltip { display: none } ' +
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
    '<div class="chat-menu">' +
      '<div class="chat-menu-header">Touch Control Settings</div>' +
      '<div class="chat-menu-content tpc-control-sliders"></div>' +
      '<div class="chat-menu-content tpc-control-checkboxes"></div>' +
      '<div class="chat-menu-content tpc-control-last"></div>' +
    '</div>');

  $controlSettings.find('.tpc-control-sliders')
    .append(State.xSlider = makeSlider(
      'tpc-x-slider tpc-slider', 'Touch-box x-position', {
        slide: Control.onChangeXPosition, value: config.screen.position[0], min: 0, max: 1, step: 0.0005 }))
    .append(State.ySlider = makeSlider(
      'tpc-y-slider tpc-slider', 'Touch-box y-position', {
        slide: Control.onChangeYPosition, value: config.screen.position[1], min: 0, max: 1, step: 0.0005 }))
    .append(State.scaleSlider = makeSlider(
      'tpc-scale-slider tpc-slider', 'Touch-box scale', {
        slide: Control.onChangeScale, value: config.screen.scale, min: 0, max: 1, step: 0.0005 }));

  $controlSettings.find('.tpc-control-checkboxes')
    .append(State.enabledCheckbox = makeCheckbox(
      'tpc-enabled-checkbox', 'Enable touch control', Control.onChangeEnabled, config.enabled))
    .append(State.borderCheckbox = makeCheckbox(
      'tpc-border-checkbox', 'Show border box', Control.onChangeBorder, config.showBorder))
    .append(State.coordTooltipCheckbox = makeCheckbox(
      'tpc-tooltip-checkbox', 'Show coord tooltip', Control.onChangeCoordTooltip, config.showCoordTooltip))
    .append(State.crossCheckbox = makeCheckbox(
      'tpc-cross-checkbox', 'Use cross pointer', Control.onChangeCross, config.showCross))
    .append(State.autoSendCheckbox = makeCheckbox(
      'tpc-auto-send-checkbox', 'Auto-send touches', Control.onChangeAutoSend, config.autoSend))
    .append(State.dropletsCheckbox = makeCheckbox(
      'tpc-droplet-checkbox', 'Show touch droplets', Control.onChangeDroplets, config.showDroplets));

  $controlSettings.find('.tpc-control-last')
    .append(State.resetButton = makeButton(
      'tpc-reset-button', 'Reset to default controls', Control.onPressReset));

  $player.append($mouseBox);
  $chatSettings.append($controlSettings);

  $mouseBox.on('click', Control.onClick);
  $mouseBox.on('mousemove', Control.onMove);

  Control.updateControlSettings(true);

  State.loaded = true;
};

Control.loadable = function() {
  var $ = unsafeWindow.jQuery;
  if (typeof $ !== 'function') { return false; }

  var hasPlayer = $('.dynamic-player').length || $('.player-container').length;
  var hasChatSettings = $('.chat-settings').length;
  return hasPlayer || hasChatSettings;
};

Control.onload = function() {
  Control.init();
  console.log(GM_info.script.name + ' v' + GM_info.script.version + ' loaded!');
};

Control.interval = setInterval(Control.update, config.delay);
