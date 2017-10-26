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
 *
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

    // ASYNC
    var _loadIndicator = function (lbid) {
        if (_options.cache[lbid]) return $.Defered;
        return LBVIS.getIndicatorInfo(lbid).done(function() {
            _options.cache[lbid] = LBVIS.cache('info')[lbid][0];
        });;
    };

    var _mapSerie = function (indicator, year, data) {
        var serie = {
            id: indicator.id + '-' + year,
            colorIndex: 0,
            name: indicator.label + ' (' + year + ')',
            data: [],
            // visible: (lbid == _options.main && year == _options.year ? true : false),
            // showInLegend: (_options.legend && lbid == _options.main && year == _options.year ? true : false),
        };
        serie.data = Object.keys(data).map(function (iso3) {
            return {
                id: data[iso3].country.value,
                value: parseFloat(data[iso3].value.value),
            };
        });
        return serie;
    };

    // Re-process all series (cached in _data.cache)
    // returns HightChart map series
    var _mapSeries = function () {
        if (!_options.year && _options.main) {
            _options.year = Math.max.apply(Math, _data.years[_options.main]);
        }
        if (Object.keys(_data.cache).length == 0) {
            console.log('no series');
            _data.series = null;
            return null;
        }
        _data.series = [];
        var visibleSerie = null;
        // should be _data.indicators (not cache)?
        $.each(_data.cache, function (lbid, dataset) {
            var indicator = LBV.cache('indicators').filter(function (i) { return i.id == lbid; })[0];
            $.each(dataset, function (year, data) {
                var serie = _mapSerie(indicator, year, data);
                // If serie is visible
                if (lbid == _options.main && year == _options.year) {
                    serie.visible = true;
                    if (_options.legend) serie.showInLegend = true;
                    visibleSerie = serie;
                    _data.series.push(serie);
                }
            });
        });
        return visibleSerie; // _data.series || [];
    };



    /*
     * Drawing & Highchart
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
            colors: [ _options.colors.min, _options.colors.max ],
            // Map-specific
            mapNavigation: {
                enabled: _options.map.nav,
                enableMouseWheelZoom: false,
                enableDoubleClickZoom: true,
                enableTouchZoom: false,
                buttonOptions: { align: 'right' }
            },
            tooltip: { enabled: (_options.map.tooltip ? true : false) },
            plotOptions: {
                // series: {
                // },
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
                    // tooltip:    {
                    //     enabled: (_options.map.tooltip ? true : false),
                    //     formatter: (LBVIS.isString(_options.map.tooltip) ? _options.map.tooltip : undefined),
                    //     valueDecimals: 2
                    // },
                    showInLegend: false,
                }
            },
        };
        return chartOptions;
    };

    var _mapDraw = function(series=_data.series) {
        // if (_data.chart) { // Redraw?
        //     console.log('Map already drawn', _data.chart);
        // }
        var chartOptions = _mapOptions();
        chartOptions.series = series;
        if (_options.legend) chartOptions.colorAxis = _chartAxis(series[0]);
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

    var _chartAxis = function (serie=null) {
        var axis = {
            maxColor: _options.colors.max,
            minColor: _options.colors.min
        };
        if (serie) {
            // pick selected DS
            var data = serie.data.map(function (i) { return i.value; });
            axis.min = Math.min.apply(Math, data);
            axis.max = Math.max.apply(Math, data);
            //if (axis.min == 0) axis.min = 1;
            if (axis.min > 0) {
                axis.type = 'logarithmic';
            }
        }
        return axis;
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
                        //console.log(e.target.value + ' loaded', _data.cache[e.target.value]);
                        _options.year = Math.max.apply(Math, _data.years[_options.main]);
                        _setOptionsYears();
                        _loadIndicator(_options.main).done(function () {
                            _chartTitle();
                        });
                        var s = _mapSeries();
                        _data.chart.colorAxis = _chartAxis(s);
                        _mapDraw();//_data.series);
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
                    var visible = _mapSeries();
                    _mapDraw();
                    //_data.chart.colorAxis = _chartAxis(visible);//_data.cache
                    _chartTitle();
                    if (_options.loadYears) _setOptionsYears();
                    //console.log('show ' + _options.main + '-' +_options.year, visible);
                });
                // _getIndicatorDetails().done(function () {
                //     _chartTitle();
                // });
            }

            if (_options.iso3 && _data.chart) {
                //console.log(_data.chart);
                _data.chart.get(_options.iso3).select();
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
