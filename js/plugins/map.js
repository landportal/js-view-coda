/*
 * JS View CODA Library
 *
 * A visualization library for the Land Portal Land Book / LOD
 *
 * MIT License
 * Copyright (c) 2016 - Land Portal Foundation - http://www.landportal.info
 * Copyright (c) 2016-2017 - Jules Clement <jules@ker.bz>
 *
 * Author: Jules Clement <jules@ker.bz>
 *
 * Plugin: Map
 */

'use strict';

var lbvisMap = (function (MAP, LBV, args) {
    var JSONMAP = MAP; // Geo-JSON map with countries obj 'id' as iso3
    var LBVIS = LBV;
    var _options = {
        target:         '#map',
        indicators:     [],     // ex: 'WB-SP.RUR.TOTL.ZS'
        main:           null,   // indicator selected by default
        series:         null,   // for static series
        title:          null,
        subtitle:       null,
        iso3:           null,   // iso3 of the country to select
        year:           null,
        colors: {
            background: 'transparent',
            hover: '#F5A623',
            select: '#F5A623',
            borders: '#FFFFFF',
            min: '#D9ED7E',
            max: '#45551A',
            na: '#BBD6D8'
        },
        // Map options
        map: {
            width:      1004, // print hack, for wkhtmltopdf
            height:     500,  // print hack, for wkhtmltopdf
            cursor:     null,
            events:     {},
            legend:     false,
            nav:        false,
            selectable: false,
            tooltip:    true,
            zoom:       false
        },
    };
    $.extend(true, _options, args); // true = deep merge

    // Internal data
    var _data = {
        chart: null,            // Projection (ex: highchart)
        chartOptions: {},
        cache: {},              // by indicators / year / iso3
        years: {},              // by indicators
        series: [],
        seriesAxis: [],
    };



    /*
     * Data
     */
    var _loadData = function (inds=_options.indicators) {
        var qvalues = LBVIS.DATA.obsValues(
            ['indicator', 'country', 'time', 'value'], // 'year'
            { indicator: inds } //country: [_options.iso3], time: [_options.year] }
        );
        return $.getJSON(LBVIS.DATA.sparqlURL(qvalues), function (data) {
            data.results.bindings.forEach(function (d, i) {
                var lbid = d.indicator.value;
                var time = d.time.value;
                var iso3 = d.country.value;
                if (!_data.cache[lbid]) _data.cache[lbid] = {};
                if (!_data.cache[lbid][time]) _data.cache[lbid][time] = {};
                if (!_data.cache[lbid][time][iso3]) _data.cache[lbid][time][iso3] = {};
                _data.cache[lbid][time][iso3] = d; //parseFloat(d.value.value);
            });
            // (re)Compute available years per serie
            // @TODO: should be based on inds?
            $.each(_data.cache, function (lbid, data) {
                _data.years[lbid] = Object.keys(data).map(function (d) { return parseInt(d); });
            });
            //console.log('GOTCHA', data.results.bindings);
        });
    };

    var _loadIndicator = function (lbid) {
        var ind = {
            id: lbid,
            label: lbid,
        };
        if (_options.cache[lbid]) {
            return _options.cache[lbid];
        } else {
            ind = LBVIS.getIndicatorInfo(lbid);
        }
        console.log(lbid + ' info', ind);
        return ind;
    };

    /*
     * UI related
     */
    var _bindUI = function () {
        // Country Indicators select
        if (_options.loadIndicators) {
            //$(_options.target + ' select[name="indicator"]').parent().removeClass("hidden");
            $(_options.target + '-form').delegate('select[name="indicator"]', "change", function(e) {
                e.preventDefault();
                if (e.target.value) {
                    _options.main = e.target.value;
                    //console.log(e.target.value + ' loaded', e);
                    _loadData([e.target.value]).done(function () {
                        console.log(e.target.value + ' loaded', _data.cache[e.target.value]);
                        _options.year  = null;
                        _mapSeries();
                        _mapDraw();//_data.series);
                        _chartTitle();
                        _setOptionsYears();
//                        _chartTitle();
                    });
                }
            });
        }
    };

    var _setOptionsYears = function () {
        var el = $(_options.target + '-form select[name="year"]');
        var str = '';
        _data.years[_options.main].forEach(function(year) {
            str += '<option value="'+year+'"'
                + (year == _data.year ? ' selected="selected"' : '')
                + '>'+year+'</option>';
        });
        el.html('<option value>Select a year...</option>');
        if(str.length) {
            el.append(str);
            el.prop( "disabled", false );
        }
        return str;
    };

    var _setOptionsIndicators = function () {
        var el = $(_options.target + '-form select[name="indicator"]');
        el.html('<option value>Select an indicator...</option>');
        if (_options.iso3) {
            _data.indicators = LBVIS.cache('indicatorsByCountry')[_options.iso3];
        } else {
            _data.indicators = LBVIS.cache('indicators');
        }
        var opts = LBVIS.indicatorsSelect(_options.main);
        if (opts) {
            el.append(opts);
            el.prop( "disabled", false );
        }
    };

    // Re-process all series (cached in _data.cache)
    // returns HightChart map series
    var _mapSeries = function () {
        _data.series = [];
        var visibleSerie = null;
        $.each(_data.cache, function (lbid, dataset) {
            var indicator = _loadIndicator(lbid);
            $.each(dataset, function (year, data) {
                var serie = {
                    id: lbid + '-' + year,
                    colorIndex: 0,
                    name: indicator.label + ' (' + year + ')',
                    data: [],
                    visible: (lbid == _options.main && year == _options.year ? true : false),
                    showInLegend: (_options.legend && lbid == _options.main && year == _options.year ? true : false),
                };
                serie.data = Object.keys(data).map(function (iso3) {
                    return {
                        id: data[iso3].country.value,
                        value: parseFloat(data[iso3].value.value),
                    };
                });
                if (lbid == _options.main && year == _options.year) visibleSerie = serie;
                _data.series.push(serie);
            });
        });
        return visibleSerie; // _data.series || [];
    };



    /*
     * Drawing
     */
    var _mapOptions = function () {
        var chartOptions = {
            credits:    { enabled: false },
            chart: {
                //width: _options.map.width,
                renderTo: $(_options.target)[0],
                height: _options.map.height,
                backgroundColor: _options.colors.background,
                margin: [0, 0, 0, 0]
            },
            title: { text: null },
            subtitle: { text: null },
            legend:     _chartLegend(null),
            tooltip:    { enabled: (_options.map.tooltip ? true : false), valueDecimals: 2 },
            // Map-specific
            mapNavigation: {
                enabled: _options.map.nav,
                enableMouseWheelZoom: false,
                enableDoubleClickZoom: true,
                enableTouchZoom: false,
                buttonOptions: { align: 'right' }
            },
            plotOptions: {
                map: {
                    mapData: JSONMAP,
                    joinBy: 'id',
                    allowPointSelect: _options.map.selectable,
                    nullColor: _options.colors.na,
                    borderColor: _options.colors.borders,
                    states: {
                        hover:  { color: _options.colors.hover },
                        select: { color: _options.colors.select }
                    },
                    point: { events: _options.map.events },
                    showInLegend: false,
                }
            },
        };
        return chartOptions;
    };

    var _mapDraw = function(series=_data.series) {
        var chartOptions = _mapOptions();
        chartOptions.series = series;
        chartOptions.colorAxis = _chartAxis(series[0]);
        _data.chart = new Highcharts.mapChart(chartOptions);
        return _data.chart;
    };

    var _chartTitle = function  () {
        var title = (_options.main && _options.cache[_options.main] ? _options.cache[_options.main].render : _options.main);
        var subtitle = (_options.year ? _options.year : '');
        if (title || subtitle) {
            _data.chart.setTitle({text: title, align: 'center', useHTML: true}, {text: subtitle, align: 'center', useHTML: true});
        }
    };

    var _chartLegend = function (text) {
        if (!_options.map.legend || !text) return { enable: false };
        var legend = {
            verticalAlign: 'bottom',
            floating: true,
            text: text
        };
        return legend;
    };

    var _chartAxis = function (serie) {
        // pick selected DS
        var data = serie.data.map(function (i) { return i.value; });
        var axis = {
            min: Math.min.apply(Math, data),//.map(function (d) { return d.value; })),
            max: Math.max.apply(Math, data),
            type: 'logarithmic',
            maxColor: _options.colors.max,
            minColor: _options.colors.min
        };
        return axis;
    };



    /*
     * Public methods
     */
    return {
        debug: function () {
            console.log(_options, _data);
            return {options: _options, data: _data};
        },
        //draw: _mapDraw,
        init: function () {
            // If we have a 'static' serie(s) provided, show it
            if (_options.series) {
                _mapDraw(_options.series);
            } else {
                // If there is no 'main' indicator set, pick the first one from the list
                if (!_options.main && _options.indicators) _options.main = _options.indicators[0];

                // Fetch data
                _loadData().done(function () {
                    //console.log('Map init', _options, _data);
                    // If 'year' is not set, pick latest one
                    if (!_options.year) {
                        _options.year = Math.max.apply(Math, _data.years[_options.main]);
                    }
                    var visible = _mapSeries();
                    _mapDraw();
                    //_chartAxis(_data.cache[_options.main][_options.year]);
                    _chartTitle();
                    _setOptionsYears();
                });
                // _getIndicatorDetails().done(function () {
                //     _chartTitle();
                // });
            }

            // If we have an init zoom option + iso3, zoom on that country
            if (_options.map.zoom) {
                _data.chart.get(_options.iso3).zoomTo();
                _data.chart.mapZoom(_options.map.zoom);
            }

            // Fills up the Indicators select menu
            if (_options.loadIndicators) {
                // Only with indicators that have data for this country...
                LBVIS.getIndicators(_options.iso3).done(function () {
                    _setOptionsIndicators();
                });
            }
            _bindUI();
        }
    };
});
