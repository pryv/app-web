
 /* global $, window */
var RootNode = require('./RootNode.js');
var SIGNAL = require('../model/Messages').MonitorsHandler.SIGNAL;
var _ = require('underscore');

var TreeMap = module.exports = function (model, controller) {
  this.model = model;
  this.controller = controller;
  this.root = new RootNode($('#tree').width() -
    parseInt($('#tree').css('margin-left').split('px')[0], null) -
    parseInt($('#tree').css('margin-right').split('px')[0], null),
    $('#tree').height() -
    parseInt($('#tree').css('margin-bottom').split('px')[0], null) -
    parseInt($('#tree').css('margin-top').split('px')[0], null));
  this.root.x =  parseInt($('#tree').css('margin-left').split('px')[0], null);
  this.root.y =  parseInt($('#tree').css('margin-top').split('px')[0], null);

  this.root.focusOnStreams = function (stream) {
    this.model.activeFilter.focusOnStreams(stream);
  }.bind(this);
  var refreshTree = _.throttle(function () {
    var start = new Date().getTime();
    this.root._generateChildrenTreemap(this.root.x,
      this.root.y,
      this.root.width,
      this.root.height,
      true);
    this.root._refreshViewModel(true);
    this.root.renderView(true);
    var end = new Date().getTime();
    var time = end - start;
    console.log('refreshTree execution:', time);
  }.bind(this), 10);

  $(window).resize(_.debounce(function () {
    this.root.width = $('#tree').width() -
      parseInt($('#tree').css('margin-left').split('px')[0], null) -
      parseInt($('#tree').css('margin-right').split('px')[0], null);
    this.root.height = $('#tree').height() -
      parseInt($('#tree').css('margin-bottom').split('px')[0], null) -
      parseInt($('#tree').css('margin-top').split('px')[0], null);
    this.root.x =  parseInt($('#tree').css('margin-left').split('px')[0], null);
    this.root.y =  parseInt($('#tree').css('margin-top').split('px')[0], null);
    this.root._createView();
    this.root._generateChildrenTreemap(this.root.x,
      this.root.y,
      this.root.width,
      this.root.height,
      true);
    this.root._refreshViewModel(true);
    this.root.renderView(true);
  }.bind(this), 100));


  //----------- init the model with all events --------//
  this.eventEnterScope = function (content) {
    console.log('eventEnter', content);
    var start = new Date().getTime();
    _.each(content.events, function (event) {
      this.root.eventEnterScope(event, content.reason, function () {});
    }, this);
    this.root._createView();
    var end = new Date().getTime();
    var time = end - start;
    console.log('eventEnter execution:', time);
    refreshTree();
  }.bind(this);

  this.eventLeaveScope = function (content) {
    var start = new Date().getTime();
    _.each(content.events, function (event) {
      this.root.eventLeaveScope(event, content.reason, function () {});
    }, this);
    var end = new Date().getTime();
    var time = end - start;
    console.log('eventLeave execution:', time);
    refreshTree();
  }.bind(this);

  this.eventChange = function (/*context*/) {

  }.bind(this);

  this.model.activeFilter.triggerForAllCurrentEvents(this.eventEnterScope);
  //--------- register the TreeMap event Listener ----------//
  this.model.activeFilter.addEventListener(SIGNAL.EVENT_SCOPE_ENTER,
    this.eventEnterScope
  );
  this.model.activeFilter.addEventListener(SIGNAL.EVENT_SCOPE_LEAVE,
    this.eventLeaveScope);
  this.model.activeFilter.addEventListener(SIGNAL.EVENT_CHANGE,
    this.eventChange);
};

TreeMap.prototype.onDateHighLighted = function (time) {
  if (this.root) {
    this.root.onDateHighLighted(time);
  }
};

TreeMap.prototype.destroy = function () {
  this.model.activeFilter.removeEventListener(SIGNAL.EVENT_SCOPE_ENTER,
    this.eventEnterScope);
  this.model.activeFilter.removeEventListener(SIGNAL.EVENT_SCOPE_LEAVE,
    this.eventLeaveScope);
  this.model.activeFilter.removeEventListener(SIGNAL.EVENT_CHANGE,
    this.eventChange);
};



TreeMap.prototype.getNodeById = function (nodeId, streamId, connectionId) {
  var node = this.root;
  node = node.connectionNodes[connectionId];
  if (node === 'undefined') {
    throw new Error('RootNode: can\'t find path to requested event by connection' + connectionId);
  }
  node = node.streamNodes[streamId];
  if (node === 'undefined') {
    throw new Error('RootNode: can\'t find path to requested event by stream' + connectionId + streamId);
  }
  var that = _.find(node.getChildren(), function (node) { return node.uniqueId === nodeId; });

  if (node === 'undefined') {
    throw new Error('RootNode: can\'t find path to requested event by nodeId' +
      connectionId + ' ' + streamId + ' ' + nodeId);
  }
  return that;
};


