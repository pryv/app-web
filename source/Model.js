/* global $, window */
var MonitorsHandler = require('./model/MonitorsHandler.js'),
  _ = require('underscore'),
  ConnectionsHandler = require('./model/ConnectionsHandler.js'),
  SIGNAL = require('./model/Messages').MonitorsHandler.SIGNAL,
  TreeMap = require('./tree/TreeMap.js'),
  Controller = require('./orchestrator/Controller.js'),
  Pryv = require('pryv'),
  TimeLine = require('./timeframe-selector/timeframe-selector.js'),
  PUBLIC_TOKEN = 'public',
  STAGING,
  toShowWhenLoggedIn = ['.logo-sharing', '.logo-add', '.logo-create-sharing'],
  toShowSubscribe = ['.logo-subscribe'];
var Model = module.exports = function (staging) {  //setup env with grunt
  STAGING = !!staging;
  window.Pryv = Pryv;
  this.urlUsername = Pryv.utility.getUsernameFromUrl();
  this.urlSharings = Pryv.utility.getSharingsFromUrl();
  this.publicConnection = null;
  this.loggedConnection = null;
  this.sharingsConnections = null;
  this.bookmakrsConnections = null;
  this.hideLoggedInElement();
  if (this.urlSharings.length > 0) {
    this.sharingsConnections = [];
    this.urlSharings.forEach(function (token) {
      this.sharingsConnections.push(new Pryv.Connection(
        this.urlUsername, token, {staging: STAGING}));
    }.bind(this));
  } else if (this.urlUsername) {
    this.publicConnection =  new Pryv.Connection(
      this.urlUsername, PUBLIC_TOKEN, {staging: STAGING});
  }
  // create connection handler and filter
  this.onFiltersChanged = function () {
    this.activeFilter.timeFrameLT = [arguments[0].from, arguments[0].to];
  };


  this.onDateHighlighted = _.throttle(function () {
    if (this.treemap) {
      this.treemap.onDateHighLighted(arguments[0].getTime() / 1000);
    }
  }, 100);
  this.initBrowser = function () {
    this.connections = new ConnectionsHandler(this);
    this.activeFilter = new MonitorsHandler(this);
    var batchCount = 0;
    this.activeFilter.addEventListener(SIGNAL.BATCH_BEGIN, function () {
      batchCount++;
      $('#logo-reload').addClass('loading');
    });
    this.activeFilter.addEventListener(SIGNAL.BATCH_DONE, function () {
      batchCount--;
      if (batchCount === 0) {
        $('#logo-reload').removeClass('loading');
      }
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

    // create the TreeMap
    this.controller = new Controller();
    this.treemap = new TreeMap(this);
    this.controller.setTreeMap(this.treemap);


  };
  // ----------------------- //

  // Singin
  //Pryv.Auth.config.registerURL = { host: 'reg.pryv.in', 'ssl': true};

  var settings = {
    appId : 'pryv-browser',
    username: this.urlUsername,
    callbacks : {
      signedIn: this.signedIn.bind(this),
      signedOut: function (connection) {
        this.hideLoggedInElement();
        this.removeConnection(connection);
        this.removeConnections(this.bookmakrsConnections);
        if (this.publicConnection) {
          this.addConnection(this.publicConnection);
        }
        $('#login-button').html('<i class="fa fa-sign-in"></i> Sign In');
        this.loggedConnection = null;
      }.bind(this),
      refused: function (reason) {
        console.log('** REFUSED! ' + reason);
      },
      error: function (code, message) {
        console.log('** ERROR! ' + code + ' ' + message);
      }
    }
  };
  if (this.publicConnection) {
    this.addConnection(this.publicConnection);
  } else if (this.sharingsConnections) {
    this.sharingsConnections.forEach(function (connection) {
      this.addConnection(connection);
    }.bind(this));
  }
  Pryv.Auth.whoAmI(settings);
  $('#sign-out').click(function () {
    if (this.loggedConnection) {
      Pryv.Auth.trustedLogout();
    }
  }.bind(this));
  $('#login-button').click(function (e) {
    if (this.loggedConnection) {
      $('#login-button').dropdown();
      e.stopPropagation();
      $('#login-dropdown .dropdown-menu').css('opacity', 1);
    } else {
      $('#login-dropdown .dropdown-menu').css('opacity', 0);
      $('#login').css('display', 'block');
      $('#login').removeClass('animated slideOutRight');
      $('#tree').removeClass('animated slideInLeft');
      $('#login').addClass('animated slideInRight');
      $('#tree').addClass('animated slideOutLeft');
      if (detectIE()) {
        $('#tree').fadeOut('slow', function () {
          $('#login').fadeIn('slow');
        });
      }
    }
  }.bind(this));
  $('#login-caret').click(function () {
    $('#login').removeClass('animated slideInRight');
    $('#tree').removeClass('animated slideOutLeft');
    $('#login').addClass('animated slideOutRight');
    $('#tree').addClass('animated slideInLeft');
    if (detectIE()) {
      $('#login').fadeOut('slow', function () {
        $('#tree').fadeIn('slow');
      });
    }
  });
  $('#login form').submit(function (e) {
    e.preventDefault();
    if (this.loggedConnection) {
      console.warn('You are already logged in, please log out');
      return;
    }
    settings.username = $('#login-username').val();
    settings.password = $('#login-password').val();
    Pryv.Auth.login(settings);
  }.bind(this));



};
Model.prototype.signedIn = function (connection) {
  console.log('Successfully signed in', connection);
  this.loggedConnection = connection;
  $('#login-button').html(connection.username + ' <i class="fa fa-chevron-down"></i>');
  if (!this.urlUsername || this.urlUsername === connection.username) {// logged into your page
    this.showLoggedInElement();
    if (!this.sharingsConnections) {
      this.addConnection(connection);
      if (this.publicConnection) {
        this.removeConnection(this.publicConnection);
      }
      connection.bookmarks.get(function (error, result) {
        if (!error) {
          this.bookmakrsConnections = result;
          this.addConnections(this.bookmakrsConnections);
        }
      }.bind(this));
    }
    this.treemap.isOnboarding();
  } else {
    if (!this.sharingsConnections && this.publicConnection) {
      this.sharingsConnections = [];
      this.sharingsConnections.push(this.publicConnection);
    }

    this.showSubscribeElement();
  }
  $('#login').removeClass('animated slideInRight');
  $('#tree').removeClass('animated slideOutLeft');
  $('#login').addClass('animated slideOutRight');
  $('#tree').addClass('animated slideInLeft');
  if (detectIE()) {
    $('#login').fadeOut('slow', function () {
      $('#tree').fadeIn('slow');
    });
  }
};

Model.prototype.addConnection = function (connection) {
  if (!this.treemap) {
    this.initBrowser();
  }
  if (!connection._accessInfo) {
    connection.accessInfo();
  }
  if (!connection._privateProfile) {
    connection.privateProfile();
  }
  var userConnection = this.connections.add(connection),
    batch = this.activeFilter.startBatch('adding connections');
  this.activeFilter.addConnection(userConnection, batch);
  batch.done();
};
Model.prototype.addConnections = function (connections) {
  _.each(connections, function (conn) {
    this.addConnection(conn);
  }.bind(this));
};
Model.prototype.removeConnection = function (connection) {
  this.activeFilter.removeConnections(connection.serialId);
};

Model.prototype.removeConnections = function (connections) {
  _.each(connections, function (conn) {
    this.removeConnection(conn);
  }.bind(this));
};
/**
 * demo utility that set the timeFrame boundaries to the events displayed.
 */
Model.prototype.updateTimeFrameLimits = function () {
  (_.debounce(function () {
    var stats = this.activeFilter.stats();
    this.timeView.setLimit(stats.timeFrameLT[0] - 3600, stats.timeFrameLT[1] + 3600);
  }.bind(this), 100))();
};



Model.prototype.showLoggedInElement = function () {
  $(toShowWhenLoggedIn.join(',')).show();
};
Model.prototype.showSubscribeElement = function () {
  $(toShowSubscribe.join(',')).show();
};

Model.prototype.hideLoggedInElement = function () {
  $(toShowWhenLoggedIn.join(',')).hide();
  $(toShowSubscribe.join(',')).hide();
};
function initTimeAndFilter(timeView, filter) {
  var spanTime = 86400000,
    fromTime = new Date(),
    start = new Date(fromTime.getFullYear(), fromTime.getMonth(), fromTime.getDate());

  fromTime = new Date(start.getTime() - (spanTime * 365));
  var toTime = new Date(start.getTime() + spanTime - 1);
  filter.timeFrameLT = [fromTime, toTime];
  filter.set({
    limit: 50000
  });

  timeView.onFiltersChanged({
    from:     fromTime,
    to:       toTime
  });
}

var detectIE = function detectIE() {
  var ua = window.navigator.userAgent;
  var msie = ua.indexOf('MSIE ');
  var trident = ua.indexOf('Trident/');

  if (msie > 0) {
    // IE 10 or older => return version number
    return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
  }

  if (trident > 0) {
    // IE 11 (or newer) => return version number
    var rv = ua.indexOf('rv:');
    return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
  }

  // other browser
  return false;
};
