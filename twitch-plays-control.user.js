// ==UserScript==
// @id             twitch-plays-control@meiguro.com
// @name           Twitch Plays Pokémon Touch Controller
// @version        0.1
// @author         Meiguro <meiguro@meiguro.com> http://meiguro.com/
// @namespace      http://meiguro.com/userscripts/twitch-plays-control
// @description    Add Touch controls to Twitch Plays Pokemon touch-enabled games.
// @include        /^https?://(www\.)?twitch\.tv/twitchplayspokemon
// @grant          GM_addStyle
// @run-at         document-start
// ==/UserScript==

var Control = window.TPControl = {};

var config = Control.config = {
  delay: 250,
  screen: {
    aspect: 1920 / 1080,
    position: [0.534, 0.979],
    scale: 0.444,
    size: [256, 192],
    barHeight: 30
  },
  enabled: true,
  showBorder: true,
  showHand: true,
  autoSend: false
};

var State = Control.State = {};

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

  var width = Control.scale * config.screen.size[0];
  var height = Control.scale * config.screen.size[1];

  $mouseBox.css({
    position: 'absolute',
    left: excessWidth / 2 + (playerWidth - width - excessWidth) * config.screen.position[0],
    top: (playerHeight - height) * config.screen.position[1],
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

  if (!$chatSettings.is(':visible') && force !== true) {
    return;
  }

  var $child = $chatSettings.find(':first');
  var minWidth = 200;

  $controlSettings.css({
    position: 'absolute',
    minWidth: Math.max(minWidth, $child.width()),
    right: Math.max(minWidth, $child.outerWidth()) + 5,
    bottom: 0
  });
};

Control.update = function() {
  var $player = State.$player;
  var $mouseBox = State.$mouseBox;

  if (!$.contains($player[0], $mouseBox[0])) {
    clearInterval(Control.interval);
  }

  Control.updateMouseBox();
  Control.updateControlSettings();
};

Control.onClick = function(e) {
  var x = Math.round(e.offsetX / Control.scale);
  var y = Math.round(e.offsetY / Control.scale);
  $('.ember-text-area').val(x + ',' + y).focus().blur();
  if (config.autoSend) {
    $('.send-chat-button button').click();
  }
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

Control.onChangeHand = function(e) {
  if (e) {
    config.showHand = $(this).is(':checked');
  } else {
    $(this).prop('checked', config.showHand);
  }
  State.$mouseBox.css({
    cursor: config.showHand ? 'pointer' : 'default',
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

Control.onPressReset = function(e) {
  config = Control.config = $.extend(true, {}, Control.configDefault);
  Control.onChangeXPosition.call(State.xSlider.$control);
  Control.onChangeYPosition.call(State.ySlider.$control);
  Control.onChangeScale.call(State.scaleSlider.$control);
  Control.onChangeEnabled.call(State.enabledCheckbox.$control);
  Control.onChangeBorder.call(State.borderCheckbox.$control);
  Control.onChangeHand.call(State.handCheckbox.$control);
  Control.onChangeAutoSend.call(State.autoSendCheckbox.$control);
  Control.update(true);
  Control.saveConfig();
};

Control.init = function(refresh) {
  window.$ = unsafeWindow.$;

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
  var $chatSettings = State.$chatSettings = $('.js-chat-settings');
  var $mouseBox = State.$mouseBox = $('<div/>').addClass('tpc-mouse-box');
  var $controlSettings = State.$controlSettings = $('<div/>').addClass('tpc-control-settings');

  $player.css({ position: 'relative' });
  $chatSettings.css({ position: 'absolute' });

  $mouseBox.css({
    cursor: 'pointer',
    border: '2px solid rgba(150, 150, 150, 0.2)'
  });

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
    .append(State.handCheckbox = makeCheckbox(
      'tpc-hand-checkbox', 'Use hand pointer', Control.onChangeHand, config.showHand))
    .append(State.autoSendCheckbox = makeCheckbox(
      'tpc-auto-send-checkbox', 'Auto-send touches', Control.onChangeAutoSend, config.autoSend));

  $controlSettings.find('.tpc-control-last')
    .append(State.resetButton = makeButton(
      'tpc-reset-button', 'Reset to default controls', Control.onPressReset));

  $player.append($mouseBox);
  $chatSettings.append($controlSettings);

  $mouseBox.on('click', Control.onClick);

  Control.interval = setInterval(Control.update, config.delay);

  Control.updateControlSettings(true);
};

window.onload = function() {
  Control.init();
  console.log(GM_info.script.name + ' v' + GM_info.script.version + ' loaded!');
};