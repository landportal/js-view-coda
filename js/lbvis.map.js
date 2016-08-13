'use strict';

/* LB vis map class/module
 *
 * Params:
 - vis          # mandatory MUST be a <lbvis> instance
 - map_data     # mandatory MUST contain display data for the highchart map

 * Options:
 - iso3         # country
 - showIndicators       # load indicators and fill up select menu
 - indicator    # Load this indicator
 - year         # Load this year


Examples
========

Click
-----
To enable click action on a country, pass an 'events' hash to options:
events: {
  click: function () {
    console.log('click on', this);
    window.location.href = '/book/countries/'+this.id;
  }
}
(See: http://api.highcharts.com/highmaps#plotOptions.map.events)

Tooltip
-------
To show and control the (mouseover) tooltip on countries, pass a callback function 'tooltip' to options.

tooltip: function () {
  return this.point.name;
}

(See: http://api.highcharts.com/highmaps#plotOptions.map.tooltip.pointFormatter)


 */
var lbvisMap = (function (args = {}) {
    var LBVIS = args.vis;
    var _options = {
        //type: args.type,                // map type: global or local
        title:          args.title      || null,       // Chart title
        subtitle:       args.subtitle   || null,       // Chart title
        iso3:           args.iso3       || null,        // iso3 of the country to select
        target:         args.target     || '#map',
        mapTarget:      args.mapTarget  || args.target + '-wrapper' || '#map-wrapper',
        showIndicators: args.indicators || false,       // indicators + year select form
        indicator:      args.indicator  || null,        // ex: 'WB-SP.RUR.TOTL.ZS'
        data:           args.data       || null,        // static data, array of objects (id/value) where id is iso3
        map: {
            events:     args.events     || {},
            legend:     args.legend     || false,
            nav:        args.nav        || false,
            selectable: args.selectable || false,
            tooltip:    args.tooltip    || false,
            zoom:       args.zoom       || false
        },
        colors: args.colors || {
            background: '#FFFFFF',
            hover:      '#F5A623',
            select:     '#F5A623',
            borders:    '#FFFFFF',
            max:        '#45551A',
            min:        '#D9ED7E',
            na:         '#BBD6D8'
        }
    };
    // Map internal data
    var _data = {
        mapData: args.map_data || map_data,
        chart: [],
        // min: null,
        // max: 0,
        year: args.year || null,
        years: [],
        indicator: {},
        indicators: {} // un-used
    };
    // Highchart parameters
    var _map = {};

    var _getYears = function () {
        $(_options.target + ' select[name="year"]').html("");
        _data.years = [];
        var query = LBVIS.DATA.queries.indicatorYears(_options.indicator, _options.iso3);

        return $.getJSON(LBVIS.DATA.sparqlURL(query), function (data) {
            data.results.bindings.forEach(function (item) {
                _data.years.push(parseFloat(item.year.value) || item.year.value);
            });
            if (!_data.year) {
                _data.year = Math.max.apply(Math, _data.years);
                // TODO: set select option
            }
            setOptionsYears();
        });
    };

    var _getChartData = function () {
        var query = LBVIS.DATA.queries.indicatorValues(_options.indicator, _data.year);
        return $.getJSON(LBVIS.DATA.sparqlURL(query), function (data) {
            _data.chart = [];
            data.results.bindings.forEach(function (item) {
                _data.chart.push({
                    id:  item.iso3.value,
                    value: parseFloat(item.value.value),
                    year:  parseFloat(item.year.value)
                });
            });
            //console.log(_data.chart[0], _data.chart[42]);
        });
    };

    var _getIndicatorDetails = function () {
        var df = [];
        // Get indicator metadata
        df[0] = LBVIS.getIndicatorInfo(_options.indicator).done(function () {
            _data.indicator = LBVIS.cache(_options.indicator)[0];
        });
        // Get Years for which this indicator is available
        df[1] = _getYears();
        return $.when(df[0], df[1]).done(function () {
            _data.map.setTitle(
                {text: _data.indicator.label + ' - ' + _data.year },
                {text: _data.indicator.description}
            );
        });
    };

    // UI / build options for years selection
    var setOptionsYears = function () {
        var str = '';
        _data.years.forEach(function(year) {
            str += '<option value="'+year+'"'
                + (year == _data.year ? ' selected="selected"' : '')
                + '>'+year+'</option>';
        });
        $(_options.target + ' select[name="year"]').html('<option data-localize="inputs.syear">Select year ...</option>');
        if(str.length) {
            $(_options.target + ' select[name="year"]').append(str);
            $(_options.target + ' select[name="year"]').prop( "disabled", false );
        }
        return str;
    };

    var _mapOptions = function () {
        _map = {
            chart: {
                backgroundColor: _options.colors.background,
                margin: (_options.indicator ? [40, 0, 0, 0] : 0)
            },
            title:      { text: _options.title },
            subtitle:   { text: _options.subtitle },
            credits:    { enabled: false },
            legend:     { enabled: _options.map.legend, y: 20 },
            tooltip:    { enabled: true, valueDecimals: 2 }//(_options.map.tooltip ? true : false) }
        };
        _map.mapNavigation = {
            enabled: _options.map.nav,
            // enableMouseWheelZoom: true,
            // enableDoubleClickZoom: false,
            // enableTouchZoom: false,
            buttons: {
                zoomIn:  { y: 20, x: 20 },
                zoomOut: { y: 50, x: 20 }
            }
        };
        _map.plotOptions = { map: {
            mapData: _data.mapData,
            joinBy: 'id',
            allowPointSelect: _options.map.selectable,
            nullColor: _options.colors.na,
            borderColor: _options.colors.borders,
            states: {
                hover:  { color: _options.colors.hover },
                select: { color: _options.colors.select }
            },
            point: { events: _options.map.events }
        }};
        _map.colorAxis = {
            // startOnTick: false,
            // endOnTick: false,
            tickLength: 0,
            minorTickInterval: 0.1,
            maxColor: _options.colors.max,
            minColor: _options.colors.min
        };
        if (_options.map.tooltip && _options.map.tooltip !== true) {
            _map.tooltip = {
                formatter: _options.map.tooltip
            };
        }
    };

    var _mapDataset = function () {
        var dataset = [];
        if (_data.chart.length) {
            dataset = _data.chart.filter(function (i) { return i.year == _data.year; });
            var d = dataset.map(function (i) { return i.value; });
            _map.colorAxis.min = Math.min.apply(Math, d);
            _map.colorAxis.max = Math.max.apply(Math, d);
        }
        return dataset;
    };

    function _mapSerie(data) {
        data = data || [];
        return {
            data: data,
            //joinBy: 'id',
            name: _data.indicator.label + ' - ' + _data.year
        };
    }

    /*
     * Drawing
     */
    function _mapDraw() {
        _mapOptions();
        var data = _options.data || null;
        if (!data && !_options.indicator && _options.map.selectable) {
            data = _data.mapData.map(function (c) { return {id: c.id, value: 0}; }); // fake dataset based on mapData
        }
        $(_options.mapTarget).highcharts('Map', $.extend(_map, {
            series: [_mapSerie(data)]
        }));
        //console.log('drawMap with ', _options, _data, _map);
        _data.map = $(_options.mapTarget).highcharts();
    }
    function _mapUpdate() {
        // Update series with (new) data, refresh map
        var dataset = _mapDataset();
        // map.series[0].setData(dataset);

        _data.map.series[0].remove();
        _data.map.addSeries(_mapSerie(dataset));
        //console.log('update serie', dataset);

        _data.map.colorAxis[0].update(_map.colorAxis);
        //console.log('Borken update', map, JSON.stringify(_map.colorAxis));
        if (_options.iso3) {
            // Borken? wait after setData / map update finished?
            //var cc = $(_options.mapTarget).highcharts().get(_options.iso3).select();
            //console.log(dataset);
        }
    }



    /*
     * Events
     */
    var _bindUI = function () {
        // Country Indicators select
        $(_options.target).delegate('select[name="indicator"]', "change", function(e) {
            e.preventDefault();
            if (e.target.value) {
                _data.year = null,
                _data.indicator = null,
                _options.indicator = e.target.value;
                _getIndicatorDetails().done(function () {
                    _getChartData().done(function () {
                        _mapUpdate();
                    });
                    console.log('Indicator changed', _data);
                });
            }
        });
        $(_options.target).delegate('select[name="year"]', "change", function(e){
            e.preventDefault();
            if (e.target.value) {
                _data.year = e.target.value;
                    _getChartData().done(function () {
                        _mapUpdate();
                    });
                //_mapUpdate();
            }
        });
    };



    /*
     * Public methods
     */
    return {
        debug: function () {
            console.log(_options, _data, _map);
        },
        draw: _mapDraw,
        init: function () {
            //console.log('Map init', _options, _data);
            // $(_options.target + " .loading").removeClass("hidden");
            _mapDraw();
            // Select and eventually zoom to country
            if (_options.iso3) {
                $(_options.mapTarget).highcharts().get(_options.iso3).select();
                if (_options.map.zoom) {
                    $(_options.mapTarget).highcharts().get(_options.iso3).zoomTo();
                    $(_options.mapTarget).highcharts().mapZoom(_options.map.zoom);
                }
            }
            // Fills up Indicators select
            if (_options.showIndicators) {
                _data.indicators = LBVIS.cache('indicators');
                var opts = LBVIS.generateOptions(_data.indicators, _options.indicator);
                $(_options.target + ' select[name="indicator"]').html(opts);
                $(_options.target + ' select[name="indicator"]').prop( "disabled", false );
                _bindUI();
            }
            // Get indicator details (meta + years)
            if (_options.indicator) {
                _getIndicatorDetails().done(function () {
                    // Get indicator values (all years)
                    _getChartData().done(function () {
                        _mapUpdate();
                    });
                });
            }
            // $(_options.target + " .loading").addClass("hidden");
        }
    };
});
