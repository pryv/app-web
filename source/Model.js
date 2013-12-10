/* global $ */
var MonitorsHandler = require('./model/MonitorsHandler.js');
var _ = require('underscore');
var ConnectionsHandler = require('./model/ConnectionsHandler.js');

var SIGNAL = require('./model/Messages').MonitorsHandler.SIGNAL;
var TreeMap = require('./tree/TreeMap.js');
var Controller = require('./orchestrator/Controller.js');
var Pryv = require('pryv');
var TimeLine = require('./timeframe-selector/timeframe-selector.js');

var Model = module.exports = function (DEVMODE) {

  // create connection handler and filter
  this.onFiltersChanged = function () {
    console.log('onFiltersChanged', arguments);
    this.activeFilter.timeFrameLT = [arguments[0].from, arguments[0].to];
  };


  this.onDateHighlighted = _.throttle(function () {
    if (this.treemap) {
      this.treemap.onDateHighLighted(arguments[0].getTime() / 1000);
    }
  }, 100);
  // Singin
  Pryv.Access.config.registerURL = { host: 'reg.pryv.io', 'ssl': true};
  var requestedPermissions = [
    {
      'streamId' : '*',
      'level' : 'manage'
    }
  ];
  this.initBrowser = function (username, token) {
    this.connections = new ConnectionsHandler(this);
    this.activeFilter = new MonitorsHandler(this);
    this.activeFilter.addEventListener(SIGNAL.BATCH_BEGIN, function () {
      $('#logo-reload').addClass('loading');
    });
    this.activeFilter.addEventListener(SIGNAL.BATCH_DONE, function () {
      $('#logo-reload').removeClass('loading');
    });
    this.timeView = new TimeLine();
    this.timeView.render();
    initTimeAndFilter(this.timeView, this.activeFilter);
    this.timeView.on('filtersChanged', this.onFiltersChanged, this);
    this.timeView.on('dateHighlighted', this.onDateHighlighted, this);
    this.timeView.on('dateMasked', this.onDateMasked, this);

    this.onDateMasked = function () {
     // console.log('onDateMasked', arguments);
    };

    Pryv.eventTypes.loadExtras(function () {});


    var userConnection =
      this.connections.add((new Pryv.Connection(username, token, {staging: false})));

    var batch = this.activeFilter.startBatch('adding connections');

    batch.addOnDoneListener('connloading', function () {}.bind(this));

    // tell the filter we want to show this connection
    this.activeFilter.addConnection(userConnection, batch);
    batch.done();
    // create the TreeMap
    this.controller = new Controller();
    this.treemap = new TreeMap(this);
    this.controller.setTreeMap(this.treemap);


  };
  // ----------------------- //
  var settings = {
    requestingAppId : 'browser',
    requestedPermissions : requestedPermissions,
    returnURL : 'auto#', // set this if you don't want a popup
    spanButtonID : 'pryvButton', // (optional)
    callbacks : {
      initialization : function () {},
      needSignin : function () {},
      needValidation : function () {},
      accepted : function (username, appToken, languageCode) {
        console.log('** SUCCESS! username:' + username +
          ' appToken:' + appToken +
          ' lang:' + languageCode);
        this.initBrowser(username, appToken);
      }.bind(this),
      refused: function (reason) {
        console.log('** REFUSED! ' + reason);
      },
      error: function (code, message) {
        console.log('** ERROR! ' + code + ' ' + message);
      }
    }
  };
  if (!DEVMODE) {
    Pryv.Access.setup(settings);
  }  else {
    this.initBrowser('fredos71', 'VVTi1NMWDM');
  }


};


/**
 * demo utility that set the timeFrame boundaries to the events displayed.
 */
Model.prototype.updateTimeFrameLimits = function () {
  (_.debounce(function () {
    var stats = this.activeFilter.stats(),
      currentLimit = {from: this.timeView.limitFrom, to: this.timeView.limitTo};
    console.log('updateLimits', stats, currentLimit);
    this.timeView.setLimit(stats.timeFrameLT[0], stats.timeFrameLT[1]);
  }.bind(this), 100))();
};


function initTimeAndFilter(timeView, filter) {
  var spanTime = 86400000,
    fromTime = new Date(),
    start = new Date(fromTime.getFullYear(), fromTime.getMonth(), fromTime.getDate());

  fromTime = new Date(start.getTime() - (spanTime * 365));
  var toTime = new Date(start.getTime() + spanTime - 1);
  filter.timeFrameLT = [fromTime, toTime];
  filter.set({
    limit: 5000
  });

  timeView.onFiltersChanged({
    from:     fromTime,
    to:       toTime
  });
}

