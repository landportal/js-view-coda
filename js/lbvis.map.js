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
 - year         # Load this year (TODO: default to latest)


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
        title:          args.title      || false,       // Chart title
        iso3:           args.iso3       || null,        // iso3 of the country to select
        target:         args.target     || '#map',
        mapTarget:      args.mapTarget  || '#map-wrapper',
        showIndicators: false,                          // indicators + year select form
        indicator:      args.indicator  || null,        // ex: 'WB-SP.RUR.TOTL.ZS'
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
            if (!_data.year) _data.year = Math.max.apply(Math, _data.years);
            setOptionsYears();
        });
    };

    var _getChartData = function () {
        var query = LBVIS.DATA.queries.indicatorValues(_options.indicator);
        return $.getJSON(LBVIS.DATA.sparqlURL(query), function (data) {
            _data.chart = [];
            data.results.bindings.forEach(function (item) {
                _data.chart.push({
                    code:  item.iso3.value,
                    value: parseFloat(item.value.value),
                    year:  parseFloat(item.year.value)
                });
            });
        });
    };

    var _getIndicatorDetails = function () {
        var df = [];
        // Get indicator metadata
        df[0] = LBVIS.getIndicatorInfo(_options.indicator).done(function () {
            _data.indicator = LBVIS.cache('infoTmp')[0];
        });
        // Get Years for which this indicator is available
        df[1] = _getYears();
        return $.when(df[0], df[1]);
    };

    // UI / build options for years selection
    var setOptionsYears = function () {
        var str = '';
        _data.years.forEach(function(year) {
            str += '<option value="'+year+'"'
                + (year == _options.year ? ' selected="selected"' : '')
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
                margin: 0
            },
            title:      _options.title,
            credits:    { enabled: false },
            legend:     { enabled: _options.map.legend },
            tooltip:    { enabled: true }//(_options.map.tooltip ? true : false) }
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
            joinBy: ['id', 'code'],
            mapData: _data.mapData,
            name: _data.indicator.name
        };
    }

    /*
     * Drawing
     */
    function _mapDraw() {
        _mapOptions();
        $(_options.mapTarget).highcharts('Map', $.extend(_map, {
            series: [_mapSerie()]
        }));
        console.log('drawMap with ', _options, _data, _map, $(_options.mapTarget).highcharts());
    }
    function _mapUpdate() {
        // Update series with (new) data, refresh map
        var map = $(_options.mapTarget).highcharts();

        map.series[0].setData(_mapDataset());
        // TODO : borken
        map.colorAxis[0].update(_map.colorAxis, true);
        console.log('update', map, _map.colorAxis);
        //$(_options.mapTarget).highcharts().addSeries(_mapSerie(d));
        if (_options.iso3) {
            $(_options.mapTarget).highcharts().get(_options.iso3).select();
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
                _options.indicator = e.target.value;
                _getIndicatorDetails();
            }
        });
        $(_options.target).delegate('select[name="year"]', "change", function(e){
            e.preventDefault();
            if (e.target.value) {
                _options.year = e.target.value;
                //_initMapGlobal();
                // TODO : prep serie(s)
            }
        });
    };



    /*
     * Public methods
     */
    return {
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
                LBVIS.defers.indicators.done(function () {
                    var opts = LBVIS.getOptionsIndicators(_options.indicator);
                    $(_options.target + ' select[name="indicator"]').html(opts);
                });
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
