(function() {

var config = window.TTOConfig = {
  delay: 250,
  screen: {
    aspect: 1920 / 1080,
    position: [0.357, 0.542],
    scale: 0.444,
    size: [256, 192],
    barHeight: 30
  }
};

var Control = window.TTOControl = {};

var $player = $('.dynamic-player');
var $mouseBox = $('<div/>').addClass('mouse-box');

Control.update = function() {
  if (!$.contains($player[0], $mouseBox[0])) {
    clearInterval(Control.interval);
  }

  var playerWidth = $player.width();
  var playerHeight = $player.height() - config.screen.barHeight;

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

Control.onClick = function(e) {
  var x = Math.round(e.offsetX / Control.scale);
  var y = Math.round(e.offsetY / Control.scale);
  $('.ember-text-area').val(x + ',' + y);
};

Control.init = function() {
  $player.find('.mouse-box').remove();
  $player.css({ position: 'relative' });
  $mouseBox.css({ border: '2px solid rgba(150, 150, 150, 0.2)' });
  $player.append($mouseBox);

  $mouseBox.on('click', Control.onClick);

  Control.interval = setInterval(Control.update, config.delay);
};

Control.init();

})();

