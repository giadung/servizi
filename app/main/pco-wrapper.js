const PCO = require('pco-js');
const util = require('util');
const EventEmitter = require('events');
const electron = require('electron');
const config = require('../../config');
const utils = require('./utils');

let accounts;

if (utils.isRenderer()) {
  accounts = electron.remote.getGlobal('servizi').database.accounts;
} else {
  accounts = require('./database').accounts;
}

const eventEmitter = new EventEmitter();

class PCOWrapper {
  constructor() {
    const pcoConfig = {
      clientId: config.oauthClientId,
      clientSecret: config.oauthClientSecret,
    };

    this.apiClient = new PCO(pcoConfig);

    accounts.findOne({ selected: true }, (err, selectedAccountResult) => {
      if (selectedAccountResult) {
        this.apiClient.http.accessToken = selectedAccountResult.tokenInfo.token.access_token;
        this.apiClient.http.redirectUri = selectedAccountResult.tokenInfo.token.redirect_uri;
        this.ready = true;
        eventEmitter.emit('ready', null, this.apiClient);
      } else {
        accounts.findOne({ selected: true }, (err, accountResult) => {
          if (accountResult) {
            this.apiClient.http.accessToken = accountResult.tokenInfo.token.access_token;
            this.apiClient.http.redirectUri = accountResult.tokenInfo.token.redirect_uri;
            this.ready = true;
            eventEmitter.emit('ready', null, this.apiClient);
          } else {
            this.ready = true;
            eventEmitter.emit('ready', null, this.apiClient);
          }
        });
      }
    });
  }

  on(eventName, handler) {
    eventEmitter.on(eventName, handler);
  }

  sendReady() {
    eventEmitter.emit('ready', null, this.apiClient);
  }
}

util.inherits(PCOWrapper, EventEmitter);

module.exports = new PCOWrapper();
