
var BrowserFilter = require('./browser/BrowserFilter.js');

var ConnectionsHandler = require('./browser/ConnectionsHandler.js');

var TreeMap = require('./tree/TreeMap.js');
var Pryv = require('pryv');


var Browser = module.exports = function () {
  // create connection handler and filter
  this.connections = new ConnectionsHandler(this);
  this.activeFilter = new BrowserFilter(this);

  // add fredos to Connections
  var fredosSerial =
    this.connections.add(new Pryv.Connection('fredos71', 'VVTi1NMWDM', {domain : 'pryv.in'}));

  // tell the filter we want to show this connection
  this.activeFilter.showConnection(fredosSerial);

  // create the TreeMap
  this.treemap = new TreeMap(this);

  // create streams and add them to filter
  //this.connections.add(new Pryv.Connection('jordane', 'eTpAijAyD5', {domain : 'pryv.in'}));
  var perki1Serial =
    this.connections.add(new Pryv.Connection('perkikiki', 'Ve-U8SCASM', {domain : 'pryv.in'}));
  var perki2Serial =
    this.connections.add(new Pryv.Connection('perkikiki', 'PVriN2MuJ9', {domain : 'pryv.in'}));

  // activate them in batch in the filter
  var batch = this.activeFilter.startBatch();
  this.activeFilter.showConnection(perki1Serial);
  this.activeFilter.showConnection(perki2Serial);
  batch.done();


  var streams = [];
  var perki2 =  this.connections.get(perki2Serial);
  perki2.useLocalStorage(function () {
    streams.push(perki2.streams.getById('diary'));
  });

  this.activeFilter.showOnlyStreams(streams);

};



