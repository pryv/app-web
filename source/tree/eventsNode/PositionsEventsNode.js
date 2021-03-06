/* global window */
var EventsNode = require('../EventsNode'),
  EventsView = require('../../view/events-views/positions/Model.js'),
  _ = require('underscore'),
  DEFAULT_WEIGHT = 1;

/**
 * Holder for EventsNode
 * @type {*}
 */
var PositionsEventsNode = module.exports = EventsNode.implement(
  function (parentStreamNode) {
    EventsNode.call(this, parentStreamNode);
  },
  {
    className: 'PositionsEventsNode EventsNode',
    pluginView: EventsView,
    getWeight: function () {
      return DEFAULT_WEIGHT;
    }

  });

// we accept all kind of events
PositionsEventsNode.acceptThisEventType = function (eventType) {
  return (eventType === 'position/wgs84');
};
try {
  Object.defineProperty(window.PryvBrowser, 'positionWeight', {
    set: function (value) {
      value = +value;
      if (_.isFinite(value)) {
        this.customConfig = true;
        DEFAULT_WEIGHT = value;
        if (_.isFunction(this.refresh)) {
          this.refresh();
        }
      }
    },
    get: function () {
      return DEFAULT_WEIGHT;
    }
  });
} catch (err) {
  console.warn('cannot define window.PryvBrowser');
}

