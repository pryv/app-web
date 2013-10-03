var TreeNode = require('./TreeNode'),
    NodeModel = require('../model/NodeModel.js'),
  NotesView = require('../view/NotesView.js'),
    _ = require('underscore');

/**
 * Holder for EventsNode
 * @type {*}
 */
var EventsNode = module.exports = TreeNode.implement(
  function (parentStreamNode) {
    TreeNode.call(this, parentStreamNode);
    this.events = {};

    this.eventDisplayed = null;
    this.eventModel = null;
    this.eventsNbr = 0;
    this.eventView = null;

  },
  {
    className: 'EventsNode',

    getChildren: function () {
      return null;
    },

    eventEnterScope: function (event, reason, callback) {
      this.events[event.id] = event;
      this.eventsNbr++;
      this.eventDisplayed = event;
      this._refreshEventModel();
      if (callback) {
        callback(null);
      }
    },

    eventLeaveScope: function (event, reason, callback) {
      delete this.events[event.id];
      this.eventsNbr--;
      if (this.eventDisplayed === event) {
        this.eventDisplayed = _.first(_.values(this.events));
      }
      this._refreshEventModel();
      if (_.size(this.events) === 0) {
        this.view.close();
      }
      if (callback) {
        callback(null, this);
      }
    },

    eventChange: function (event, reason, callback) {
      throw new Error('EventsNode.eventChange No yet implemented' + event.id);
    },
    _refreshEventModel: function () {
      if (!this.eventModel) {
        this.eventModel = new NodeModel({
          content: this.eventDisplayed.content,
          description: this.eventDisplayed.description,
          id: this.eventDisplayed.id,
          modified: this.eventDisplayed.modified,
          streamId: this.eventDisplayed.streamId,
          tags: this.eventDisplayed.tags,
          time: this.eventDisplayed.time,
          type: this.eventDisplayed.type,
          eventsNbr: this.eventsNbr
        });
        if (this.className === 'NotesEventsNode')  {
          this.eventView = new NotesView({model: this.eventModel});
        }
      }
      this.eventModel.set('content', this.eventDisplayed.content);
      this.eventModel.set('description', this.eventDisplayed.description);
      this.eventModel.set('id', this.eventDisplayed.id);
      this.eventModel.set('modified', this.eventDisplayed.modified);
      this.eventModel.set('streamId', this.eventDisplayed.streamId);
      this.eventModel.set('tags', this.eventDisplayed.tags);
      this.eventModel.set('time', this.eventDisplayed.time);
      this.eventModel.set('type', this.eventDisplayed.type);
      this.eventModel.set('eventsNbr', this.eventsNbr);
    }
  });


EventsNode.acceptThisEventType = function () {
  throw new Error('EventsNode.acceptThisEventType nust be overriden');
};

