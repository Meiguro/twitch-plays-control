(function() {

var Control = window.TPControl = {};

var config = Control.config = {
  delay: 250,
  screen: {
    aspect: 1920 / 1080,
    position: [0.357, 0.542],
    scale: 0.444,
    size: [256, 192],
    barHeight: 30
  },
  enabled: true,
  showBorder: true,
  autoSend: false
};

var $player = $('.dynamic-player');
var $chatSettings = $('.js-chat-settings');
var $mouseBox = $('<div/>').addClass('tpc-mouse-box');
var $controlSettings = $('<div/>').addClass('tpc-control-settings');

var State = Control.State = {};

Control.updateMouseBox = function() {
  var playerWidth = $player.width();
  var playerHeight = $player.height() - config.screen.barHeight;

  if (Control.lastPlayerWidth === playerWidth &&
      Control.lastPlayerHeight === playerHeight) {
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
    left: excessWidth / 2 + (playerWidth - excessWidth) * config.screen.position[0],
    top: playerHeight * config.screen.position[1],
    width: width,
    height: height
  });
};

Control.updateControlSettings = function() {
  if (!$chatSettings.is(':visible')) {
    return;
  }

  var $child = $chatSettings.find(':first');

  $controlSettings.css({
    position: 'absolute',
    minWidth: $child.width(),
    right: $child.outerWidth() + 5,
    bottom: 0
  });
};

Control.update = function() {
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
  return $elem;
};

Control.saveConfig = function() {
  localStorage.TPControl = JSON.stringify(config);
};

Control.onChangeEnable = function(e) {
  var newValue = config.enabled = $(this).is(':checked');
  $mouseBox.css({
    display: newValue ? 'block' : 'none'
  });
  Control.saveConfig();
};

Control.onChangeBorder = function(e) {
  var newValue = config.showBorder = $(this).is(':checked');
  $mouseBox.css({
    border: newValue ? '2px solid rgba(255, 255, 255, 0.5)' : 'none'
  });
  Control.saveConfig();
};

Control.onChangeAutoSend = function(e) {
  var newValue = config.autoSend = $(this).is(':checked');
  Control.saveConfig();
};

Control.init = function() {
  $('.tpc-mouse-box').remove();
  $('.tpc-control-settings').remove();

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

  $player.css({ position: 'relative' });
  $chatSettings.css({ position: 'absolute' });

  $mouseBox.css({
    cursor: 'pointer',
    border: '2px solid rgba(150, 150, 150, 0.2)'
  });

  $controlSettings.append(
    '<div class="chat-menu">' +
      '<div class="chat-menu-header">Touch Control Settings</div>' +
      '<div class="chat-menu-content tpc-control-checkboxes"></div>' +
    '</div>');

  $controlSettings.find('.tpc-control-checkboxes')
    .append(State.enabledCheckbox = makeCheckbox(
      'tpc-enabled-checkbox', 'Enable touch control', Control.onChangeEnable, config.enabled))
    .append(State.borderCheckbox = makeCheckbox(
      'tpc-border-checkbox', 'Show border box', Control.onChangeBorder, config.showBorder))
    .append(State.borderCheckbox = makeCheckbox(
      'tpc-auto-send-checkbox', 'Auto-send touch commands', Control.onChangeAutoSend, config.autoSend));

  $player.append($mouseBox);
  $chatSettings.append($controlSettings);

  $mouseBox.on('click', Control.onClick);

  Control.interval = setInterval(Control.update, config.delay);
};

Control.init();

})();

