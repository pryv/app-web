var  Marionette = require('backbone.marionette');
 /* TODO This a the view for each node, with dynamic animation
 we can't re-render on change because animation would no be done
 If the model is a event Node we must include a new typed view
 */
var NodeView = module.exports = Marionette.ItemView.extend({
  template: '#nodeView',
  initialize: function () {
    var eventView, className = this.model.get('className');
    if (className === 'NotesEventsNode') {
      console.log('create Notes view');
    } else if (className === 'PicturesEventsNode') {
      console.log('create Pictures view');
    } else if (className === 'PositionsEventsNode') {
      console.log('create Position view');
    } else if (className === 'GenericEventsNode') {
      console.log('create Generic view');
    }
    this.listenTo(this.model, 'change', this.change);
    //this.$el.css('background-color', this.getRandomColor());
    if (this.model.get('content')) {
      if (this.model.get('content').clientData) {
        this.$el.addClass(this.model.get('content').clientData.color);
      }
    }
    this.$el.attr('id', this.model.get('id'));
    this.$el.addClass('node animated  fadeIn');
    this.$el.addClass(this.model.get('className'));

  },
  triggers: {
    'click': 'click'
  },
  change: function () {

    this._refreshStyle();
  },
  renderView: function () {

    this.render();
  },
  render: function () {
    if (this.beforeRender) { this.beforeRender(); }
    this.trigger('before:render', this);
    this.trigger('item:before:render', this);
    this._refreshStyle();
    var data = this.serializeData();
    var template = this.getTemplate();
    var html = Marionette.Renderer.render(template, data);
    this.$el.html(html);
    $('#' + this.model.get('containerId')).append(this.$el);
    this.bindUIElements();

    if (this.onRender) { this.onRender(); }
    this.trigger('render', this);
    this.trigger('item:rendered', this);
    return this;
  //  this.$el.css('z-index', this.model.get('depth'));
  /*  this._refreshStyle();
    this.$el.html(this.model.get('className'));
    $('#' + this.model.get('containerId')).append(this.$el);
    this.$el.addClass('animated  fadeIn');    */

  },
  _refreshStyle: function () {
    if (this.model.get('height') === 0 || this.model.get('width') === 0) {
      this.close();
      return;
    }
    if (this.model.get('display')) {
      this.$el.css('display', 'block');
    }  else {
      this.$el.css('display', 'none');
    }
    this.$el.attr('weight', this.model.get('weight'));
    this.$el.attr('className', this.model.get('className'));
    this.$el.css('width', this.model.get('width'));
    this.$el.css('height', this.model.get('height'));
    this.$el.css('left', this.model.get('x'));
    this.$el.css('top', this.model.get('y'));

  },
  close: function () {
    this.remove();
  }
});