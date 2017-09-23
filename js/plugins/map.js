'use strict';

/**
 * JS View CODA - map module
 *

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
var lbvisMap = (function (LBV, args) {
    var LBVIS = LBV;
    var _options = {
        width:          args.width      || 1004, // print hack, for wkhtmltopdf
        height:         args.height     || 500,  // print hack, for wkhtmltopdf
        //type: args.type,                // map type: global or local
        title:          args.title      || null,        // Chart title
        subtitle:       args.subtitle   || null,        // Chart title
        iso3:           args.iso3       || null,        // iso3 of the country to select
        target:         args.target     || '#map',
        mapTarget:      args.mapTarget  || (args.target ? args.target + '-wrapper' : '#map-wrapper'),
        showYears:      args.years      || false,       // year select form
        showIndicators: args.indicators || false,       // indicators select form
        indicator:      args.indicator  || null,        // ex: 'WB-SP.RUR.TOTL.ZS'
        data:           args.data       || null,        // static data, array of objects (id/value) where id is iso3
        serie:          args.serie      || null,        // static serie
        map: {
            cursor:     args.cursor     || null,
            events:     args.events     || {},
            legend:     args.legend     || false,
            nav:        args.nav        || false,
            selectable: args.selectable || false,
            tooltip:    args.tooltip    || false,
            zoom:       args.zoom       || false
        },
        colors: args.colors || {}
    };
    if (!_options.colors.background) _options.colors.background = '#FFFFFF';
    if (!_options.colors.hover) _options.colors.hover = '#F5A623';
    if (!_options.colors.select) _options.colors.select = '#F5A623';
    if (!_options.colors.borders) _options.colors.borders = '#FFFFFF';

    if (!_options.colors.min) _options.colors.min = '#45551A';
    if (!_options.colors.max) _options.colors.max = '#D9ED7E';
    if (!_options.colors.na) _options.colors.na = '#BBD6D8';

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

    var _getChartData = function () {
        var query = LBVIS.DATA.queries.indicatorValues(_options.indicator, _data.year);
        return $.getJSON(LBVIS.DATA.sparqlURL(query), function (data) {
            _data.chart = [];
            data.results.bindings.forEach(function (item) {
                _data.chart.push({
                    id:  item.iso3.value,
                    value: parseFloat(item.value.value),
                    year:  item.period.value,
                    //year:  parseInt(item.year.value)
                });
            });
            //console.log(data.results, _data.chart[0], _data.chart[42]);
        });
    };

    var _getIndicatorDetails = function () {
        return LBVIS.getIndicatorDetails(_options.indicator, _options.iso3).done(function () {
            _data.indicator = LBVIS.cache('info')[_options.indicator][0];
            _data.years = LBVIS.cache('period')[_options.indicator];
            if (!_data.year) {
                //_data.year = Math.max.apply(Math, _data.years);
                _data.year = _data.years.sort().reverse()[0];
            }
            _setOptionsYears();
            _data.title = '<a href="'+_data.indicator.indicatorSeeAlso+'" target="_blank">' + _data.indicator.label + '</a>' 
            +' ('+ _data.indicator.unit +') in <a href="'+_data.indicator.datasetSeeAlso+'" target="_blank" class="txt-l">'
            + _data.indicator.dataset+'</a> (by <a href="'+ _data.indicator.sourceSeeAlso + '" target="_blank" class="txt-l">'+ _data.indicator.source +'</a>)';
            _data.subtitle = _data.indicator.description;

            _setTitles(_data.title,
                       _data.subtitle);
        });
    };

    var _setTitles = function(title, subtitle) {
        //console.log('T: ', _options.title + '/'+title , _options.subtitle + '/'+subtitle);
        // Check that _options.title/subtitle are true (not Strings) and have a value
        if (_options.title === true && title) {
            _map.title.text = title;
        }
        if (_options.subtitle === true && subtitle) {
            _map.subtitle.text = subtitle;
        }
        _data.map.setTitle(_map.title, _map.subtitle);
    };

    var _setOptionsYears = function () {
        var el = $(_options.target + ' select[name="year"]');
        var str = '';
        _data.years.forEach(function(year) {
            str += '<option value="'+year+'"'
                + (year == _data.year ? ' selected="selected"' : '')
                + '>'+year+'</option>';
        });
        el.html('<option data-localize="inputs.syear">Select a year...</option>');
        if(str.length) {
            el.append(str);
            el.prop( "disabled", false );
        }
        return str;
    };

    var _setOptionsIndicators = function () {
        var el = $(_options.target + ' select[name="indicator"]');
        el.html('<option data-localize="inputs.sindicators">Select an indicator...</option>');
        if (_options.iso3) {
            _data.indicators = LBVIS.cache('indicatorsByCountry')[_options.iso3];
        } else {
            _data.indicators = LBVIS.cache('indicators');
        }
        var opts = LBVIS.indicatorsSelect(_options.indicator);
        if (opts) {
            el.append(opts);
            el.prop( "disabled", false );
        }
    };

    var _mapOptions = function () {
        _map = {
            chart: {
                // width: _options.width,
                height: _options.height,
                backgroundColor: _options.colors.background,
                margin: (_options.indicator ? null : [0, 0, 0, 0])
            },
            title:      { text: (_options.title ? _options.title : null) , useHTML: true},
            subtitle:   { text: (_options.subtitle ? _options.subtitle : null), useHTML: true},
            credits:    { enabled: false },
            legend:     { enabled: _options.map.legend, verticalAlign: 'bottom', },
            tooltip:    { enabled: (_options.map.tooltip ? true : false), valueDecimals: 2 }
        };
        _map.mapNavigation = {
            enabled: _options.map.nav,
            enableMouseWheelZoom: false,
            enableDoubleClickZoom: true,
            enableTouchZoom: false,
            buttonOptions: {
                align: 'right',
            },
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
            min: 0,
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
            // Filter down map data by year or send all data
            if (_data.year && _data.chart[0].year) {
                dataset = _data.chart.filter(function (i) { return i.year == _data.year; });
            } else {
                dataset = _data.chart;
            }
            // Get min/max values for this dataset
            // TODO: borken colorAxis / refresh options?
            var d = dataset.map(function (i) { return i.value; });
            _map.colorAxis.min = Math.min.apply(Math, d);
            _map.colorAxis.max = Math.max.apply(Math, d);
        }
        return dataset;
    };

    var _mapSerie = function(data) {
//        console.log('data', data);
        data = data || [];
        return {
            data: data,
            name: _data.indicator.label + (_data.year ? ' - ' + _data.year : ''),
            events: _options.map.events,
            cursor: _options.map.cursor
        };
    };



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
        // Update series with (new) data
        var dataset = _mapDataset();
        //console.log('Indicator changed', JSON.stringify(dataset));
        // failsafe
        if (!_data.year) return;

        // Method 1: update/replace values in series[0]
        //map.series[0].setData(dataset);
        // Method 2: remove series[0], add a new one
        _data.map.series[0].remove();
        _data.map.addSeries(_mapSerie(dataset));
        // Borken config? (sort of, legend doesn't show min/max values)
        _data.map.colorAxis[0].update(_map.colorAxis);
        if (_options.iso3) {
            // Re-select country, update selected point(s)
            // Otherwise selected color isn't (re)set properly. Highchart (re)coloring bug?
            _data.map.get(_options.iso3).select();
            _data.map.getSelectedPoints().forEach(function (p) {
                p.update();
            });
        }
    }



    /*
     * Events
     */
    var _bindUI = function () {
        // Country Indicators select
        if (_options.showIndicators) {
            $(_options.target + ' select[name="indicator"]').parent().removeClass("hidden");
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
                        //console.log('Indicator changed', _data);
                    });
                }
            });
        }
        if (_options.showYears) {
            $(_options.target + ' select[name="year"]').parent().removeClass("hidden");
            $(_options.target).delegate('select[name="year"]', "change", function(e){
                e.preventDefault();
                if (e.target.value) {
                    _data.year = e.target.value;
                    _getChartData().done(function () {
                        _setTitles(_data.indicator.label + ' - ' + _data.year);
                        _mapUpdate();
                    });
                    //_mapUpdate();
                }
            });
        }
    };



    /*
     * Public methods
     */
    return {
        debug: function () {
            console.log(_options, _data, _map);
        },
        map: function () { return _data.map; },
        draw: _mapDraw,
        init: function () {
            //console.log('Map init', _options, _data);
            //$(_options.target + " .loading").removeClass("hidden");
            _mapDraw();
            // 'Static serie'
            if (_options.serie) {
                _data.map.series[0].remove();
                _data.map.addSeries(_options.serie);
                //_data.map.colorAxis[0].update(_map.colorAxis);
            }

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
                // get indi
                LBVIS.getIndicators(_options.iso3).done(function () {
                    _setOptionsIndicators();
                });
            }
            _bindUI();
            // Get indicator details (meta + years)
            if (_options.indicator) {
                _getIndicatorDetails().done(function () {
                    // Get indicator values (all years)
                    _getChartData().done(function () {
                        _mapUpdate();
                        $(_options.target + " .loading").addClass("hidden");
                    });
                });
            } else {
                $(_options.target + " .loading").addClass("hidden");
            }
        }
    };
});
