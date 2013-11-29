/* global $ */
var Marionette = require('backbone.marionette'),
  Pryv = require('pryv'),
  _ = require('underscore');

module.exports = Marionette.ItemView.extend({
  template: '#template-fusion-graph',
  container: null,
  options: null,
  data: null,
  plot: null,
  chartContainer: null,
  useExtras: null,
  waitExtras: null,

  initialize: function () {
    this.listenTo(this.model, 'change', this.render);
    this.listenTo(this.model, 'change:dimensions', this.resize);
    this.container = this.model.get('container');
    this.useExtras = true;
  },

  onRender: function () {
    if (
      !this.model.get('events') ||
      !this.model.get('dimensions') ||
      !this.model.get('container')) {
      return;
    }

    try {
      Pryv.eventTypes.extras('mass/kg');
    } catch (e) {
      console.log(this.container, 'No extras');
      this.useExtras = false;
    }

    this.makePlot();
    this.onDateHighLighted(0);
  },

  makePlot: function () {
    var myModel = this.model.get('events');
    this.container = this.model.get('container');

    this.options = {};
    this.data = [];

    this.makeOptions();
    this.setUpContainer();

    var dataMapper = function (d) {
      return _.map(d, function (e) {
        return [e.time * 1000, e.content];
      });
    };

    var dataSorter = function (d) {
      return _.sortBy(d, function (e) {
        return e.time;
      });
    };

    for (var i = 0; i < myModel.length; ++i) {
      console.log(this.container, myModel[i].type, this.useExtras);
      this.addSeries({
        data: dataSorter(dataMapper(myModel[i].elements)),
        label: this.useExtras ? Pryv.eventTypes.extras(myModel[i].type).symbol : myModel[i].type,
        type: myModel[i].style
      }, i);
    }
    var eventsNbr = 0;
    _.each(this.data, function (d) {
      eventsNbr += d.data.length;
    });
    $(this.container).append('<span class="aggregated-nbr-events">' + eventsNbr + '</span>');
    this.plot = $.plot($(this.chartContainer), this.data, this.options);
    this.createEventBindings();
    myModel = null;
  },

  resize: function () {
    if (!this.model.get('dimensions')) {
      return;
    }
    this.render();
  },

  /**
   * Generates the general plot options based on the model
   */
  makeOptions: function () {
    var seriesCounts = this.model.get('events').length;
    this.options = {};
    this.options.grid = {
      hoverable: true,
      clickable: true,
      borderWidth: 0,
      minBorderMargin: 5
    };
    this.options.xaxes = [ {
      show: this.model.get('xaxis') && (this.model.get('events').length !== 0),
      mode: 'time',
      timeformat: '%y/%m/%d',
      ticks: this.getExtremeTimes()
    } ];
    this.options.yaxes = [];
    console.log('show label', (this.model.get('dimensions').width >= 80 &&
      this.model.get('dimensions').height >= (19 * seriesCounts) + 15),
      this.model.get('dimensions').width, this.model.get('dimensions').height);
    this.options.legend = {
      show: (this.model.get('dimensions').width >= 80 &&
        this.model.get('dimensions').height >= (19 * seriesCounts) + 15)
      //labelFormatter: null or (fn: string, series object -> string)
      //labelBoxBorderColor: color
      //noColumns: number
      //position: "ne" or "nw" or "se" or "sw"
      //margin: number of pixels or [x margin, y margin]
      //backgroundColor: null or color
      //backgroundOpacity: 0.3
      //container: null or jQuery object/DOM element/jQuery expression
    };
    seriesCounts = null;
  },

  getExtremeTimes: function () {
    var events = this.model.get('events');
    var min = Infinity, max = 0;
    for (var i = 0; i < events.length; ++i) {
      var el = events[i].elements;
      for (var j = 0; j < el.length; ++j) {
        min = (el[j].time < min) ? el[j].time : min;
        max = (el[j].time > max) ? el[j].time : max;
      }
    }
    return [min * 1000, max * 1000];
  },

  /**
   * Adds a series to the plot and configures it based on the model.
   * @param series, the series to add (a single one)
   * @param seriesIndex, its index
   */
  addSeries: function (series, seriesIndex) {

    // Configures series
    this.data.push({
      data: series.data,
      label: series.label,
      yaxis: (seriesIndex + 1)
    });

    // Configures the axis
    this.options.yaxes.push({ show: false});

    // Configures the series' style
    switch (series.type) {
    case 0:
      this.data[seriesIndex].lines = { show: true };
      this.data[seriesIndex].points = { show: true };
      break;
    case 1:
      this.data[seriesIndex].bars = { show: true };
      break;
    default:
      this.data[seriesIndex].lines = { show: true };
      this.data[seriesIndex].points = { show: true };
      break;
    }
  },

  setUpContainer: function () {
    // Setting up the chart container

    this.chartContainer = this.container + ' .chartContainer';
    $(this.container).html('<div class="chartContainer"></div>');
    $(this.chartContainer).css({
      top: 0,
      left: 0,
      width: this.model.get('dimensions').width + 'px',
      height: this.model.get('dimensions').height + 'px'
    });
  },

  showTooltip: function (x, y, content) {
    if ($('#chart-tooltip').length === 0) {
      $('body').append('<div id="chart-tooltip" class="tooltip">' + content + '</div>');
    }
    if ($('#chart-tooltip').text() !== content) {
      $('#chart-tooltip').text(content);
    }
    $('#chart-tooltip').css({
      top: x + this.plot.offset().top,
      left: y + this.plot.offset().left
    }).fadeIn(500);
  },

  removeTooltip: function () {
    $('#chart-tooltip').remove();
  },


  onDateHighLighted: function (date) {
    if (!this.plot) {
      return;
    }

    this.plot.unhighlight();
    var data = this.plot.getData();
    for (var k = 0; k < data.length; k++) {
      var distance = null;
      var best = 0;
      for (var m = 0; m < data[k].data.length; m++) {
        if (distance === null || Math.abs(date - data[k].data[m][0] / 1000) < distance) {
          distance = Math.abs(date - data[k].data[m][0] / 1000);
          best = m;
        } else { break; }
      }
      this.plot.highlight(k, best);
    }
  },

  onClose: function () {
    $(this.chartContainer).empty();
    $(this.container).unbind();
    $(this.container).empty();
    this.container = null;
    this.chartContainer = null;
    this.options = null;
    this.data = null;
    this.plot = null;
  },

  createEventBindings: function () {
    $(this.container).unbind();

    $(this.container).bind('resize', function () {
      this.trigger('chart:resize', this.model);
    });

    if (this.model.get('onClick')) {
      $(this.container).bind('plotclick', this.onClick.bind(this));
    }
    if (this.model.get('onHover')) {
      $(this.container).bind('plothover', this.onHover.bind(this));
    }
    if (this.model.get('onDnD')) {
      $(this.container).attr('draggable', true);
      $(this.container).bind('dragstart', this.onDragStart.bind(this));
      $(this.container).bind('dragenter', this.onDragEnter.bind(this));
      $(this.container).bind('dragover', this.onDragOver.bind(this));
      $(this.container).bind('dragleave', this.onDragLeave.bind(this));
      $(this.container).bind('drop', this.onDrop.bind(this));
      $(this.container).bind('dragend', this.onDragEnd.bind(this));
      $(this.container + ' .aggregated-nbr-events').bind('click',
        function () {
          this.trigger('nodeClicked');
        }.bind(this));
    }
  },


  /* ***********************
   * Click and Point hover Functions
   */
  onClick: function () {
    this.trigger('chart:clicked', this.model);
  },

  onHover: function (event, pos, item) {
    if (item) {
      var labelValue = item.datapoint[1].toFixed(2);
      var coords = this.computeCoordinates(0, item.seriesIndex, item.datapoint[1],
        item.datapoint[0]);
      this.showTooltip(coords.top + 5, coords.left + 5, labelValue);
    } else {
      this.removeTooltip();
    }
  },


  computeCoordinates: function (xAxis, yAxis, xPoint, yPoint) {
    var yAxes = this.plot.getYAxes();
    var xAxes = this.plot.getXAxes();
    var coordY = yAxes[yAxis].p2c(xPoint);
    var coordX = xAxes[xAxis].p2c(yPoint);
    return { top: coordY, left: coordX};
  },



  /* ***********************
   * Drag and Drop Functions
   */

  /* Called when this object is starts being dragged */
  onDragStart: function (e) {
    e.originalEvent.dataTransfer.setData('nodeId', this.container.substr(1));
    e.originalEvent.dataTransfer.setData('streamId', $(this.container).attr('data-streamid'));
    e.originalEvent.dataTransfer.setData('connectionId',
      $(this.container).attr('data-connectionid'));
    $('.chartContainer').addClass('animated shake');
  },

  /* Fires when a dragged element enters this' scope */
  onDragEnter: function () {
  },

  /* Fires when a dragged element is over this' scope */
  onDragOver: function (e) {
    e.preventDefault();
  },

  /* Fires when a dragged element leaves this' scope */
  onDragLeave: function () {
  },

  /* Called when this object is stops being dragged */
  onDragEnd: function () {
    $('.chartContainer').removeClass('animated shake');
  },

  /* Called when an element is dropped on it */
  onDrop: function (e) {
    e.stopPropagation();
    e.preventDefault();
    var droppedNodeID = e.originalEvent.dataTransfer.getData('nodeId');
    var droppedStreamID = e.originalEvent.dataTransfer.getData('streamId');
    var droppedConnectionID = e.originalEvent.dataTransfer.getData('connectionId');
    this.trigger('chart:dropped', droppedNodeID, droppedStreamID, droppedConnectionID);
  }
});
