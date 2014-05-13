
if (typeof unsafeWindow === 'undefined') {
  global.unsafeWindow = window;
}

if (typeof GM_addStyle === 'undefined') {
  global.GM_addStyle = function(style) {
    $('head:first').append($('<style>').text(style));
  };
}
