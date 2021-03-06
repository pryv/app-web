/* global $ */
var Marionette = require('backbone.marionette'),
  _ = require('underscore'),
  //Model = require('../../../numericals/TimeSeriesModel.js'),
  ChartModel = require('../../../numericals/ChartModel.js'),
  ChartView = require('../../../numericals/ChartView.js');


module.exports = Marionette.ItemView.extend({
  type: 'Numerical',
  template: '#template-detail-content-numerical-general',
  itemViewContainer: '#detail-content',
  chartView: null,
  rendered: false,
  initialize: function () {
    this.listenTo(this.model, 'change:collection', this.render.bind(this));
    this.listenTo(this.model, 'change:event', this.highlightEvent.bind(this));
  },
  onRender: function () {
    $(this.itemViewContainer).html(this.el);

    if (this.chartView) {
      this.chartView.model.set('collection', this.model.get('collection'));
    } else {
      this.chartView = new ChartView({model:
        new ChartModel({
          container: '#detail-chart-container-general',
          view: null,
          requiresDim: false,
          collection: this.model.get('collection'),
          highlighted: false,
          highlightedTime: null,
          allowPieChart: false,
          singleNumberAsText: false,
          dimensions: null,
          showLegend: true,
          legendActions: this.model.get('virtual') ? [ 'edit', 'remove' ] : ['edit'],
          onClick: false,
          onHover: true,
          onDnD: false,
          enableNavigation: true,
          xaxis: true,
          editPoint: false,
          showNodeCount: false
        })});

      this.chartView.on('remove', function (m) {
        this.trigger('remove', m);
      }.bind(this));

      this.chartView.on('edit', function (m) {
        this.trigger('edit', m);
      }.bind(this));

      this.chartView.on('duplicate', function (m) {
        this.trigger('duplicate', m);
      }.bind(this));
    }

    if ($('#detail-chart-container-general').length !== 0) {
      this.chartView.render();
      this.highlightEvent();
      this.rendered = true;
    }
    $('body').i18n();
  },
  debounceRender: _.debounce(function () {
    if (!this.rendered) {
      this.render();
      this.highlightEvent();
    }
  }, 1000),

  highlightEvent: function () {
    if (this.chartView && this.model.get('event')) {
      this.chartView.highlightEvent(this.model.get('event'));
    }
  },
  onClose: function () {
    if (this.chartView) {
      this.chartView.close();
    }
    this.chartView = null;
    $(this.itemViewContainer).empty();
  }
});
