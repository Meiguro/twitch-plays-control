# Twitch Plays Touch Controller

This adds touch input for Firefox and Chrome to [TwitchPlaysPokemon](http://www.twitch.tv/twitchplayspokemon)! You can use it as either a Userscript or Bookmarklet.

## Use it as a Userscript

- If you use Firefox, install [Scriptish](https://addons.mozilla.org/en-US/firefox/addon/scriptish/).
- If you use Chrome, install [Tampermonkey](https://chrome.google.com/webstore/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo).

Then visit the user script below and you will be prompted to install it.

Userscript: https://raw.githubusercontent.com/Meiguro/twitch-plays-control/master/twitch-plays-control.user.js

## Use it as a Bookmarklet

- Create a new bookmark with the entire code below as the URL:

   `javascript:(function() { var script = document.createElement('script'); script.src = 'http://meiguro.github.io/twitch-plays-control/twitch-plays-control.user.js'; document.head.appendChild(script); })();`

When viewing the stream, open the bookmark and the touch controller will load for supported browsers.

## Features

Click the chat settings box in order to access controller settings.

The following settings are supported:

- Position and scale sliders in case the stream's touch screen changes
- Enable/disable the controller
- Show/hide the border box
- Show/hide a tooltip with a coordinates readout
- Use either the default cursor or the crosshair
- Enable/disable auto-sending commands
- Enable/disable touch droplets which visualize the approximate stream delay
- Change chat server

Have fun!

