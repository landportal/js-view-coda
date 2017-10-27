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
 * Plugin: Pie chart
 *
 */

'use strict';

var lbvisPie = (function (LBV, args) {
    var LBVIS = LBV; // Main lbvis object

    var _options = {
        target:         '#wrapper-piechart',
        legend:         false,
        iso3:           '',
        colors:         ['#CA652D', '#13585D', '#9D9542', '#143D5D', '#E34A3A'],
        // Default FAO pie chart
        main:           'FAO-6601-5110',
        loadMain:       true,
        mainDelta:      false,
        indicators:     ['FAO-6621-5110', 'FAO-6650-5110', 'FAO-6655-5110', 'FAO-6661-5110'],
        year:           '2014',
    };
    $.extend(_options, args);

    var _data = {
        series: [],
        cache: {},
        countries: [],
        country: {},
        //indicators: args.cache  || {}   // Indicators metadata cache
    };



    /*
     * Data & Series
     */
    var _loadData = function () {
        // If we don't load main indicator data, remove it from the serie
        var filters = { indicator: _options.indicators };
        if (!_options.loadMain) {
            filters.indicators.splice(filters.indicators.indexOf(_options.main), 1);
        }
        if (_options.iso3 && !_options.loadCountries) filters.country = [ _options.iso3 ];
        if (_options.year) filters.time = [ _options.year ];

        var qvalues = LBVIS.DATA.obsValues(
            ['indicator', 'country', 'time', 'value'],
            filters
        );
        return $.getJSON(LBVIS.DATA.sparqlURL(qvalues), function (data) {
            data.results.bindings.forEach(function (d, i) {
                var lbid = d.indicator.value;
                if (!_data.cache[d.country.value]) _data.cache[d.country.value] = {};
                _data.cache[d.country.value][lbid] = d; //parseFloat(d.value.value);
            });
            //console.log('GOTCHA', data.results.bindings);
            _data.countries = Object.keys(_data.cache);
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

    var TreeSerie = function (tree=_options.tree) {
        $.each(tree, function (main, inds) {
            if (inds.constructor === Array) {
                //console.log("TREE " + main, inds);
                HCseries(main, inds);
            } else {
                TreeSerie(inds);
                //console.log("ELSE " + main, inds);
            }
        });
    }
    
    var HCseries = function(main, indicators) {
        if (_options.mainDelta) {
            indicators.splice(indicators.indexOf(_options.main), 1);
        }
        //var cIso3 = _options.iso3 ? _options.iso3 : _data.countries[0];
        Object.keys(_data.cache).forEach(function(iso3) {
            var serie = {
                type: 'pie',
                name: (_options.cache[main] ? _options.cache[main].label : main),
                id: iso3 + '-' + main,
                data: [],
                visible: (main == _options.main && iso3 == _options.iso3 ? true : false),
                showInLegend: (_options.legend && main == _options.main && iso3 == _options.iso3 ? true : false),
            };
            serie.data = indicators.map(function(lbid) {
                //console.log(lbid + ' // ' + iso3, _data.cache[iso3][lbid].value);
                return {
                    id: lbid,
                    name: (_options.cache[lbid] ? _options.cache[lbid].label : lbid),
                    y: parseFloat(_data.cache[iso3][lbid].value.value),
                };
            });
            if (_options.mainDelta) {
                var miss = indicators.map(function(lbid) { return parseFloat(_data.cache[iso3][lbid].value.value); });
                var other = parseFloat(_data.cache[iso3][_options.main].value.value)
                    - miss.reduce(function(a, b) { return a + b; }, 0);
                serie.data.push({
                    id: other,
                    name: 'Other',
                    y: parseFloat(other.toFixed(2))
                });
            }
            _data.series.push(serie);
        });
    };



    /*
     * Drawing & UI
     */
    var _drawChart = function () {
        var ChartPieOp = {
            credits: { enabled: false },
            chart: {
                renderTo: $(_options.target)[0],
                type: 'pie',
                backgroundColor: 'transparent',
            },
            colors: _options.colors,
            title: { text: null },
            subtitle: { text: null },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                }
            },
            series: _data.series
        };
        $(_options.target + " .loading").addClass("hidden");
        _data.chart = new Highcharts.Chart(ChartPieOp);
        return _data.chart;
    };

    var _chartTitle = function  () {
        if (_options.hideTitle) return false;
        var title = { text: null };
        var subtitle = { text: null };
        if (_options.main && _options.cache[_options.main]) {
            title = {
                text: _options.cache[_options.main].render,
                useHTML: true, align: 'center'
            };
        }
        if (_options.iso3) {
            subtitle = {
                text: _data.countriesLabel[_options.iso3],
                useHTML: true, align: 'center'
            };
            if (_options.mainDelta) {
                var v = _data.cache[_options.iso3][_options.main];
                var i = _options.cache[_options.main];
                subtitle.text += ': ' + v.value.value + ' (' + i.unit + ')';
            }
        }
        if (title || subtitle) {
            _data.chart.setTitle(title, subtitle);
        }
    }

    var _bindUI = function () {
        $(_options.target + '-form .action').hide(true);
        $(_options.target + '-form').delegate("select", "change", function(e) {
            _data.chart.get(_options.iso3 + '-' + _options.main).hide();
            if (e.target.name == 'country') _options.iso3 = e.target.value;
            if (e.target.name == 'indicator') _options.main = e.target.value;
            //console.log('show: ' + _options.iso3 + '-' + _options.main);
            _data.chart.get(_options.iso3 + '-' + _options.main).show();
            _chartTitle();
        });
    };
        
    // Public interfaces
    return {
        debug: function () {
            console.log(_options, _data);
        },
        init: function () {
            // Get main indicator info, then load Pie data. It may not exists?
            // LBVIS.getIndicatorInfo(_options.main).done(function () {
            //     _data.indicator = LBVIS.cache('info')[_options.main][0];
            // });

            _data.countriesLabel = {};
            LBVIS.countries().forEach(function (c) { _data.countriesLabel[c.iso3] = c.name; });

            _loadData().done(function () {
                if (_options.tree) {
                    TreeSerie();
                } else {
                    HCseries(_options.main, _options.indicators);
                }
                if (_options.loadCountries) {
                    var cc = [];
                    LBVIS.cache('countries').forEach(function (c) {
                        if (_data.countries.indexOf(c.iso3) >= 0) {
                            _data.country[c.iso3] = c.name;
                            cc.push({id: c.iso3, label: c.name});
                        }
                    });
                    //console.log(cc);
                    var countr = LBVIS.generateOptions(cc, _options.iso3);
                    $(_options.target + '-country').html(countr);
                }
                _drawChart();
                _bindUI();
                _chartTitle();
            });
        }
    };
});
