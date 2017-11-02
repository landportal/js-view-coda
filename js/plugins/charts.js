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
 * Plugin: Charts - for line & column based projections
 *
 * Usage:

new vis = lbvisCharts(new lbvis(), {indicators: ['XXX-1', 'YYY']});

 * Options:

ctype           Can be: 'line' or 'column'
indicators      (array) list of indicators (by code/id)
loadIndicators  Load a list of available indicators (UI)

 */

'use strict';

var lbvisCharts = (function (LBV, args) {
    var LBVIS = LBV;
    var _options = {
        indicators:     [],             // MANDATORY || loadIndicators
        target:         '#wrapper',
        ctype:          'line',         // Can be 'line' or 'column'
        legend:         true,
        main:           null,           // Default indicator to show
        iso3:           null,           // Show a serie by country: year-based serie?
        year:           null,           // Year to show by default: country-based serie?
        years:          { from: null, to: null },       // Years range to show
        tree:           null,           // Means we have indicators 'folded' (auto: stack?)
        observations:   [],
        // Indicators / Vis. state
        stack:          'tree',         // Stack by 'observations' or 'tree'
        colors:         ['#CA652D', '#13585D', '#9D9542', '#143D5D', '#E34A3A'],
    };
    $.extend(_options, args);

    var _data = {
        selected:       { countries: [] }, // 'indicators': [], 'observations': [] },
        cache:          {},     // Cache all data queries
        series:         [],     // Cache processed series (HC format)
        countries:      [],     // List of countries currently avail
        categories:     [],     // For stacked stuff
        indicators:     (_options.cache ? _options.cache : {}),
    };

    //
    // Data & queries
    //
    var _getCountries = function() {
        //console.log(' - Get countries for', _options.main);
        return LBVIS.getCountries(_options.main).done(function () {
            _data.countries = LBVIS.cache('countriesByIndicator')[_options.main].reduce(function (map, c) {
                map[c.iso3] = {id: c.iso3, label: c.name};
                return map;
            }, {});
            //console.log('   > got  countries for', _data.countries);
        });
    };
    // Return an array with selected indicator(s)
    // If the indicator a parent, load children
    var _getIndicators = function (lbid) {
        var indicators = [ _options.main ];

        // If selected indicator is on top of the tree ;)
        if (_options.tree) {
            $.extend(indicators, TreeFinder(_options.main));
        }
        return indicators;
    };

    // @TODO: should only load new (needed) data
    var _getData = function (indicators, iso3, year) {
        //console.log(' - Get data for', indicators , iso3, year);
        return LBVIS.loadData(indicators, iso3, year).done(function () {
            // grab data from cache
            // @TODO: check, may have collision?
            _data.cache = LBVIS.cache('data');
            //console.log('  > got', _data.cache);
            //if (_options.loadYears) _setOptionsYears();
            if (_options.loadCountries) _setOptionsCountries();
        });
    };

    //
    // Series
    //
    var _serieParams = function (sid, gid=null) {
        var name = _data.indicators[sid].label;
        return {
            type: _options.ctype,
            id: sid + (gid ? '-' + gid : ''),
            lbid: sid,
            gid: gid,
            data: [],
            name: name,
        };
    };

    // Data points
    var YearSerie = function (lbid) {
        var year = (_options.year ? _options.year : Object.keys(_data.cache[lbid])[0]);
        //console.log('  > YearSerie', lbid, year);
        var serie = _serieParams(lbid, year);
        serie.stype = 'year';
        //serie.gid = year;
        $.each(_data.cache[lbid][year], function (key, data) {
            serie.data.push({
                //name: data.country.value,
                name: LBVIS.countries().find(c => c.iso3 == data.country.value).name,
                //x: parseInt(year),
                y: parseFloat(data.value.value),
            });
        });
        return serie;
    };
    var CountrySerie = function (lbid, iso3) {
        //console.log('  > CountrySerie', lbid, iso3);
        var serie = _serieParams(lbid, iso3);
        serie.name = LBVIS.countries().find(c => c.iso3 == iso3).name;
        serie.stype = 'country';
        // serie.gid = lbid;
        // serie.id += '-' + iso3;
        $.each(_data.cache[lbid], function (key, data) {
            if (data[iso3]) { //data[iso3].value) {
                serie.data.push({
                    //id: iso3,
                    name: data[iso3].country.value,
                    x: parseInt(key),
                    y: parseFloat(data[iso3].value.value),// (data[iso3].value ? parseFloat(data[iso3].value.value) : 'NA'),
                });
            }
        });
        return serie;
    };

    // HC Series
    var BaseSeries = function (indicators, iso3=null) {
        //_data.series = [];
        //console.log('  Base series', indicators, main);
        indicators.forEach(function (lbid) {
            var serie = (iso3) ? CountrySerie(lbid, iso3) : YearSerie(lbid);
            _data.series.push(serie);
        });
    };

    var _loadSeries = function (indicators, iso3=_options.iso3, year=_options.year) {
        //console.log('Load series', indicators, iso3, year)//, ' // @TODO:', _options.years);//, _options.main);
        return _getData(indicators, iso3, year).done(function () {
            //console.log('> loaded, buildup series', _data.cache);
            // Buildup series
            if  (_data.cache[_options.main]) BaseSeries([ _options.main ], iso3);
            if (_options.tree) {
                var tm = TreeFinder(_options.main);
                BaseSeries(tm);
                StackedSeries(_options.main, tm);
            }
            //console.log('> done!', _data.series);
        });
    }

    var StackedSeries = function (main, series) {
        //console.log('StackedSeries ', series);
        if (_options.stack == 'tree' && _options.tree) {
            series.forEach(function (sid) {
                var s = _data.series.find(s => s.lbid == sid);
                //console.log(' > got ', sid, s);
                s.stack = main;
                s.stacking = 'bar';
                //_data.series.push(serie);
            });

            //StackedSeries(_options.main, tm);
            // generate stack categories
            if (_data.series.length) {
                _data.categories = _data.series[0].data.map(function (s) {
                    return s.name;
                });
            }
        }
    };

    var TreeFinder = function (id, tree=_options.tree) {
        var top = [];
        Object.keys(tree).forEach(function (main) {
            var indicators = tree[main];
            //console.log('s', main, indicators);
            if (indicators.constructor === Array) {
                if (main == id) {
                    //console.log('m', main, indicators);
                    top = indicators;
                }
            } else {
                var tt = TreeFinder(id, indicators);
                //console.log('g', id, tt);
                top = tt;
                //return tt;
            }
        }, top);
        //if (top) return 
        //console.log('t', id, top);
        return top;
    }


    //
    // Drawing charts
    //

    // var country = countries.find(function (lbc) { return (lbc.iso3 == d.country.value); });
    // _data.countries[d.country.value] = country;
    var _draw = function () {
        var HCopts = {
            credits: { enabled: false },
            chart: {
                renderTo: $(_options.target)[0],
                type: _options.ctype,
                backgroundColor: 'transparent',
            },
            exporting: {
                //allowHTML: true,
                buttons: { contextButton: { menuItems: ['downloadPNG', 'downloadJPEG', 'downloadPDF', 'downloadSVG'] } },
                chartOptions: {
                    chart: { backgroundColor: 'white' },
                },
            },
            title: {text: _options.main },
            plotOptions: {},
            colors: _options.colors,
            series: [],
        };
        // For country-based series (show years)
        if (_options.loadYears) {
            $.extend(true, HCopts, {
                xAxis: {
                    allowDecimals: false,
                },
                chart: {
                    resetZoomButton: { position: { verticalAlign: 'bottom', x: 0, y: 30 } },
                    zoomType: 'x',
                },
            });
        }

        //console.log('DRAW', HCopts);
        _data.chart = new Highcharts.Chart(HCopts);
        return _data.chart;
    };

    var _update = function () {
        //console.log('update chart series', _data.series);
        if (!_options.main) {
            console.warn('Nothing to do');
            return false;
        }
        // Load selected indicators
        _data.selected.indicators = _getIndicators(_options.main);
        //console.log('SHOW', _data.selected.countries, _data.selected.indicators, _data.series);
        // Add series in selected indicators
        _data.selected.indicators.forEach(function (sid) {
            var series = _data.series.filter(s => s.lbid == sid);
            // If we have countries selected, only add those not already in
            // if (_data.selected.countries.length) {
            //     series = series.filter(function (s) {
            //         return
            //     });
            // }
            //if (!series.find(s => s.gid == iso3) // OK
//            console.log(' > adding', series.map(x => x.id));
            series.forEach(function (s) { if (!_data.chart.get(s.id)) _data.chart.addSeries(s, false); });
        });
        var cleanup = _data.chart.series.filter(function (serie) {
            //console.log(' > check', serie.options.id); //, serie.options);
            var cc = _data.selected.indicators.indexOf(serie.options.lbid);
            if (cc === -1 || !serie.visible) {
                //var ss = _data.chart.get(serie.options.id);
                // console.log(' > remove', serie.options.id);
                // serie.remove();
                return true;
            }
        });
        cleanup.forEach(function (s) { s.remove(); });
//        if (cleanup.length) console.log(' > remove', cleanup);
        _data.chart.redraw();

        if (_data.chart.series.length) {
            //console.log('SHOWIN', _data.chart.series);
            _setTitle();
            _setAxis(_options.main);
        }
    };
        

    // Generic Vis. private method
    var _chartTitle = function() {
        var title=null;
        if (_options.main && _data.indicators[_options.main]) {
            //if (useHTML) {
            title = _data.indicators[_options.main].render;
            //} else {
            //title = _data.indicators[_options.main].label;
            //}
        }
        //title = '<span class="' + (_options.hideTitle ? 'hidden' : '') + '">' + title + '</span>';
        return title;
    };
    var _chartSubTitle = function() {
        var title=null;
        if (_options.main && _data.indicators[_options.main]) {
            title = window.location.origin + '/' + _data.indicators[_options.main].indicatorSeeAlso;
        }
        //title = '<span class="' + (_options.hideTitle ? 'hidden' : '') + '">' + title + '</span>';
        return title;
    };

    var _setTitle = function () {
        //console.log('setTitle', _data.chart);
       // if (!_data.chart.options.title.text) {
       //     return false;
       // }
        // if (_options.year) {
        //     subtitle = _options.year;
        // }
        // if (_options.iso3) {
        //     subtitle = (subtitle ? ' - ' : '') + _options.iso3;
        // }
        LBVIS.setTitle(_data.chart,
                       _chartTitle(),
                       null);//_chartSubTitle());
    };

    var _setOptionsIndicators = function () {
        var options = LBVIS.generateSelect(Object.values(_data.indicators), 'dataset', LBVIS.cache('datasets'));
        if (options) {
            var el = $(_options.target + '-form select[name="indicator"]');
            el.find('option:gt(0)').remove();
            el.append(options);
            el.prop("disabled", false);
        }
    };

    // var _setOptionsYears = function () {
    //     //console.log(' - Set years for', _options.main, Object.keys(_data.cache[_options.main]).length);
    //     // should happened after an indicator is shown/pulled
    //     ['from', 'to'].forEach(function (y) {
    //         var years = Object.keys(_data.cache[_options.main]);
    //         if (y == 'to') years.reverse();
    //         var el = $(_options.target + '-form select[name="' + y + '"]');
    //         el.find('option:gt(0)').remove();
    //         el.append(LBVIS.generateSelect(years));
    //         el.prop("disabled", false);
    //     });
    // };

    var _setOptionsCountries = function () {
        //console.log(' - Setting countries...');
        _getCountries().done(function () {
            //console.log('  > got ' + _data.countries.length + ' countries');
            var el = $(_options.target + '-form select[name="country"]');
            el.find('option:gt(0)').remove();
            el.append(LBVIS.generateSelect(Object.values(_data.countries)));
//            el.prop('disabled', (Object.values(_data.countries).length ? false : true));
        });
    };

    var _setAxis = function(main) {
        if (_options.tree) {// && _options.cache[Object.keys(_options.tree)[0]]) {
            var ind = _options.cache[Object.keys(_options.tree)[0]];
            if (ind.unit) {
                var axe = {};
                axe.title = { text: ind.unit };
                if (ind.unit.match(/^[Pp]ercent/)) { // @todo : better unit match
                    axe.min = 0; axe.max = 100;
                }
                _data.chart.yAxis[0].setOptions(axe);
            }
            if (_options.stack == 'tree') {
                _data.chart.xAxis[0].setCategories(Object.values(_data.series[0].data).map(function (x) {
                    return x.name;// LBVIS.countries().find(c => c.iso3 == x.name).name;
                }));
            }
        } else {
            var unit = LBVIS.indicators().find(i => i.id == main).unit
            _data.chart.yAxis[0].setTitle({text: unit});
        }
    };

    var _bindUI = function () {
        //console.log('Binding UI');
        $(_options.target + '-form').delegate('button', 'click', function(e) {
            console.log('Click add');
	    e.preventDefault();
        });
        $(_options.target + '-form').delegate("select", "change", function(e) {
	    e.preventDefault();
            //if (e.target.name == 'countries') _options.iso3 = e.target.value;
            if (e.target.name == 'indicator' && e.target.value) {
                _options.main = e.target.value;
                _data.selected.countries = [ _options.iso3 ]; // reset to default country
                if (_options.indicators.indexOf(e.target.value) == -1) {
                    _options.indicators.push(e.target.value);
                }
                //console.log('Change to', _options.main, _options.indicators);
                _loadSeries(_options.indicators).done(function() {
                    _update();
                });
            }
            // else if (['to', 'from'].indexOf(e.target.name) > -1 && e.target.value) {
            //     _options.years[e.target.name] = e.target.value;
            //     //console.log('Change to', _options.years);
            //     _update();
            // }
            else if (e.target.name == 'country' && e.target.value) {
                //_options.iso3 = e.target.value;
                _data.selected.countries.push(e.target.value);
                //console.log('Change to', _data.selected);
                _loadSeries(_options.indicators, e.target.value).done(function() {
                    _update();
                });
            }
            else {
                console.log('No changes', e.target.name, e.target.value);
            }
        });
    };

    return {
        debug: function () { return { options: _options, data: _data}; },
        draw: _data,
        init: function () {
            _bindUI();
            if (_options.iso3) {
                _data.selected.countries = [ _options.iso3 ];
            }
            _draw();

            _loadSeries(_options.indicators, _options.iso3, _options.year).done(function () {
                _update();
            });

            // put in bindUI / initUI
            // Load indicators list in the UI
            if (_options.loadIndicators) {
                if (_options.iso3) {
                    // Limit indicators to the ones available for that country
                    LBVIS.getIndicators(_options.iso3).done(function () {
                        _data.indicators = LBVIS.cache('indicatorsByCountry')[_options.iso3].reduce(function(map, i) {
                            map[i.id] = i;
                            return map;
                        }, {});
                        _setOptionsIndicators();
                    });
                } else {
                    _data.indicators = LBVIS.cache('indicators').reduce(function(map, i) {
                        map[i.id] = i;
                        return map;
                    }, {});;
                    _setOptionsIndicators();
                }
            }
        }
    };
});
