/*
 * LB vis. Pie chart
 *
 NOTE from (original) dev.

 Lot of hardcoded stuff to remove
 Make this truely dynamic. Need to fix the query

 */

'use strict';
var lbvisCharts = (function (LBV, args) {
    var LBVIS = LBV;
    var _options = {
        target:         '#wrapper',
        ctype:          'line',         // Can be 'line' or 'column'
        legend:         false,
        iso3:           null,
        year:           null,
        indicators:     [],
        // Indicators / Vis. state
        main:           null,
        selected:       [],
        obs:            ['all'],
    };
    $.extend(_options, args);

    var _data = {
        cache: {},
        series: [],
        years: [],
        categories: [],
        active: { 'indicators': [], 'observations': [] },
    };

    var _loadData = function () {
        var filters = { indicator: _options.indicators } //country: [_options.iso3], time: [_options.year] }
        if (_options.iso3) filters.country = [ _options.iso3 ];
        if (_options.year) filters.time = [ _options.year ];
        var qvalues = LBVIS.DATA.obsValues(
            ['indicator', 'country', 'time', 'value'], // 'year'
            filters
        );
        //console.log('G', qvalues);
        return $.getJSON(LBVIS.DATA.sparqlURL(qvalues), function (data) {
            data.results.bindings.forEach(function (d, i) {
                var lbid = d.indicator.value;
                var time = d.time.value;
                var iso3 = d.country.value;
                if (_data.years.indexOf(time) === -1) _data.years.push(time);
                if (!_data.cache[lbid]) _data.cache[lbid] = {};
                if (!_data.cache[lbid][time]) _data.cache[lbid][time] = {};
                if (!_data.cache[lbid][time][iso3]) _data.cache[lbid][time][iso3] = {};
                _data.cache[lbid][time][iso3] = d; //parseFloat(d.value.value);
            });
            //console.log('GOTCHA', data.results.bindings);
        });
    };

    // Line series, by year
    var YearSerie = function (sdata) {
        //var cYear = (_options.year ? _options.year : _data.years[0]);
        if (!_options.year) _options.year = _data.years[0];
        var data = [];
        $.each(sdata[_options.year], function (c, d) {
            if (_data.categories.indexOf(d.country.value) == -1) {
                _data.categories.push(d.country.value);
            }
            data.push({
                id: d.country.value,
                name: d.country.value + '-' + d.indicator.value,
                y: parseFloat(d.value.value),
            });
        });
        return data;
    }

    var CountrySerie = function (sdata) {
        var data = [];
        //console.log('Cserie', sdata);
        $.each(sdata, function (year, cdata) {
            if (_data.categories.indexOf(year) == -1) {
                _data.categories.push(year);
            }
            data.push({
                id: _options.iso3 + '-' + _options.main, // + year,
                x: parseFloat(year),
                y: parseFloat(cdata[_options.iso3].value.value),
            });
        });
        return data;
    }    

    var TreeSerie = function (tree=_options.tree) {
        $.each(tree, function (main, inds) {
            if (inds.constructor === Array) {
                HCseries(main, inds);
            } else {
                TreeSerie(inds);
            }
        });
    }

    var HCseries = function (main, indicators=_options.indicators) {
        //var series = [];
//        var cName = _options.cache[lbid].label;// + (_options.year ? ' - ' + _options.year : '');
        indicators.forEach(function (lbid) {
            var sdata = _data.cache[lbid];
            var serie = {
                type: _options.ctype,
                sgid: main,
                //soid: _options.observations[lbid] ? _options.observations[lbid] : [],
                id: lbid,
                name: _options.cache[lbid].label,//main + '-' + lbid,
                data: [],
                visible: (main == _options.main ? true : false),
                showInLegend: false,//(main == _options.main ? true : false),
            };
            if (_options.iso3) {
                serie.data = CountrySerie(sdata);
            } else {
                serie.data = YearSerie(sdata);
            }
            _data.series.push(serie);
        });
        //console.log(main + ' serie', series, _options.main);
        //_data.series.concat(series);
   }

    var _drawChart = function () {
        var HCopts = {
            credits: { enabled: false },
            title: {
                text: (_options.main ? _options.cache[_options.main].render : ''),
                useHTML: true,
                align: 'center'
            },
            subtitle: {
                useHTML: true,
                align: 'center'
            },
            chart: {
                backgroundColor: 'transparent',//_options.colors.background,
                //type: 'charts'
                renderTo: $(_options.target)[0],
            },
            xAxis: {
                categories: _data.categories,
            },
            series: _data.series,
        };
        _data.chart = new Highcharts.Chart(HCopts);
        return _data.chart;
    };

    var _updateSeries = function () {
        _data.series.forEach(function(serie, id) {
            if (_options.selected && _options.selected.indexOf(serie.sgid) < 0) {
                _data.chart.series[id].hide();
            } else {
                var show = false;
                if (_options.obs && _options.cache[serie.id].obs) {
                    //console.log('OoOoo', ind.obs, _options.obs);
                    // for each ind.obs
                    if (_options.obs.indexOf('all') >= 0) show=true;
                    if (_options.obs.indexOf(_options.cache[serie.id].obs[0]) >= 0) {
                        //console.log('YES');
                        show = true;
                    }
                }
                if (show) _data.chart.series[id].show();
                else _data.chart.series[id].hide();
            }
        });
        console.log(_data.series);
    };

    // Generic Vis. private method
    var _chartTitle = function  () {
        //_options.iso3 + '-' + _options.main;
        _data.chart.setTitle({text: _options.cache[_options.main].render}, {text: _options.year});
    }

    var _bindUI = function () {
        $(_options.target + '-form').delegate("input", "change", function(e) {
            //if (e.target.name == 'countries') _options.iso3 = e.target.value;
            if (e.target.name == 'indicators') {
                _options.selected = [];
                // if (!e.target.checked) {
                // }
                $('input[name="'+e.target.name+'"]').each(function(i, el) {
                    if (el.checked) _options.selected.push(el.value);
                    // if one is unchecked, remove top / global one from the selected list
                    else {
                        // find stuff
                    }
                });
//                _options.main = e.target.value;
            }
            if (e.target.name == 'observations') {
                _options.obs = [];
                if (e.target.value == 'all') {
                    if (e.target.checked) $.extend(_options.obs, Object.keys(_options.observations));
                    $('input[name="'+e.target.name+'"]').attr('checked', e.target.checked);
                } else {
                    $('input[name="'+e.target.name+'"][value="all"]').attr('checked', false);
                }
                $('input[name="'+e.target.name+'"]').each(function(i, el) {
                    if (el.checked) _options.obs.push(el.value);
                });
            }
            //var sid = _options.main;
            console.log('change to : ', _options.obs, _options.selected);
            _updateSeries();
            _chartTitle();
        });

        if (_options.observations) {
            var e = $(_options.target + '-observations');
            //console.log(_options.main, _options.observations[_options.main]);//.main, _options.observations);//[_options.main]);
            Object.keys(_options.observations).forEach(function(k) {
            //    console.log(k, _options.observations[k]);
            });
        }
    };
    // @TODO dev
    var _findStuff = function (id) {
        // Only for 2-level deep
        _options.tree.each(function (t) {
            if (_options.tree[t] !== Array) {
                console.log(t);
                _options.tree[t].each(function (s) {
                    if (s == id) return t;
                });
            }
        });
    };
    return {
        debug: function () {
            console.log(_options, _data);
        },
        init: function () {
            _loadData().done(function () {
                if (_options.tree) {
                    TreeSerie();
                } else {
                    // Pick first indicator with data
                    if (!_options.main) _options.main = Object.keys(_data.cache)[0];
                    HCseries(_options.main, _options.indicators);
                }
                if (_options.main) _options.selected.push(_options.main);
                _drawChart();
                _chartTitle();
                _bindUI();
                //console.log(_options, _data);
            });
        }
    };
});
