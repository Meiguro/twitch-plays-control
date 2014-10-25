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
