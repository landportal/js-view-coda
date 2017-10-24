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
        legend:         true,
        iso3:           null,
        year:           null,
        tree:           null,
        indicators:     [],
        stack:          'observations', // observations or tree
        // Indicators / Vis. state
        main:           null,
        selected:       [],
        obs:            ['all'],
        colors:         ['#CA652D', '#13585D', '#9D9542', '#143D5D', '#E34A3A'],
    };
    $.extend(_options, args);

    var _data = {
        cache: {},
        series: [],
        years: [],
        countries: [],
        categories: [],
        active: { 'indicators': [], 'observations': [] },
    };

    /* Get DATA */
    var _getCountries = function() {
        var query_url = LBVIS.DATA.sparqlURL(LBVIS.DATA.queries.indicatorCountries(_options.main));
        return $.getJSON(query_url, function (data) {
            _data.countries = [];
            data.results.bindings.forEach(function (item) {
                //console.log('Countries', item);
                _data.countries.push({iso3: item.iso3.value, name: item.name.value});
            });
        });
    };
    var _getYearsIndicator = function() { //?
        $(_options.target + ' select.years').prop('disabled', true);
        var query_url = LBVIS.DATA.sparqlURL(
            LBVIS.DATA.queries.indicatorYears(_options.main));
        return $.getJSON(query_url, function (data) {
            var years = [];
            _data.years = data.results.bindings.map(function (item) {
                return parseInt(item.year.value);
                //console.log('Indicators', item);
            }).reverse();
            // Reset 'from' if before min avail. year, 'to' if after max year
            // OR if not available (null)
            // Set years to min / max, see: http://aaroncrane.co.uk/2008/11/javascript_max_api/
            if (!_data.from || _data.from < Math.min.apply(Math, _data.years)) {
                _data.from = Math.min.apply(Math, _data.years);
            }
            if (!_data.to || _data.to > Math.max.apply(Math, _data.years)) {
                _data.to = Math.max.apply(Math, _data.years);
            }
        });
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
        if (!_options.year) _options.year = _data.years[0];
        var data = [];
        var countries = LBVIS.countries();
        $.each(sdata[_options.year], function (c, d) {
            var cm = countries.find(function (lbc) { return (lbc.iso3 == d.country.value); });
            _data.countries[d.country.value] = cm;
            data.push({
                name: cm.name,
                y: parseFloat(d.value.value),
            });
        });
        return data;
    };

    var CountrySerie = function (sdata) {
        var data = [];
        //console.log('Cserie', sdata);
        $.each(sdata, function (year, cdata) {
            // if (_data.categories.indexOf(year) == -1) {
            //     _data.categories.push(year);
            // }
            data.push({
                id: _options.iso3 + '-' + _options.main, // + year,
                x: parseFloat(year),
                y: parseFloat(cdata[_options.iso3].value.value),
            });
        });
        return data;
    };

    var TreeSerie = function (tree=_options.tree) {
        $.each(tree, function (main, inds) {
            if (inds.constructor === Array) {
                if (_options.stack == 'observations') {// && _options.cache[main].obs) {
                    console.log('no HC', main, inds);
                    // @TODO: if shown
                    //_data.categories = inds;
                    // var cdata = {};
                    inds.forEach(function (lbid) {
                        _data.series.push({
                            type: _options.ctype,
                            sgid: main,
                            stack: main,
                            //soid: _options.observations[lbid] ? _options.observations[lbid] : [],
                            //linkedTo: main,
                            id: lbid,//_options.cache[lbid].obs[0],
                            name: _options.cache[main].label + ' - ' + _options.cache[lbid].label,
                            data: YearSerie(_data.cache[lbid]),
                            visible: (main == _options.main ? true : false),
                            //showInLegend: (main == _options.main ? true : false),
            colors: _options.colors,
                        });
                        //console.log(main, lbid);
                    }, main);
                    _data.categories = _data.countries;
                } else {
                    HCseries(main, inds);
                }
            } else {
                TreeSerie(inds);
            }
        });
    };

    var HCseries = function (main, indicators=_options.indicators) {
        indicators.forEach(function (lbid) {
            var sdata = _data.cache[lbid];
            var data = [];
            if (_options.iso3) {
                data = CountrySerie(sdata);
            } else {
                data = YearSerie(sdata);
            }
            var serie = {
                type: _options.ctype,
                sgid: main,
                //soid: _options.observations[lbid] ? _options.observations[lbid] : [],
                id: lbid,
                //linkedTo: 
                name: _options.cache[lbid].label,//main + '-' + lbid,
                data: data,
                visible: (main == _options.main ? true : false),
                //showInLegend: (main == _options.main ? true : false),
            };
            _data.series.push(serie);
        });
    };

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
            yAxis: {
                min: 0,
                max: 100,
            },
            series: _data.series,
            plotOptions: {},
            colors: _options.colors,
        };
        HCopts.plotOptions[_options.ctype] = {
            stacking: 'normal',
        };
        _data.chart = new Highcharts.Chart(HCopts);
        console.log('chart data', _data.chart, _data.series);
        return _data.chart;
    };

    var _updateSeries = function () {
        console.log('update chart series', _data.series);
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
                } else {
                    show = true;
                }
                if (show) {
                    _data.chart.series[id].show();
                }
                else {
                    _data.chart.series[id].hide();
                }
            }
        });
        //console.log(_data.series);
    };

    // Generic Vis. private method
    var _chartTitle = function  () {
        //_options.iso3 + '-' + _options.main;
        _data.chart.setTitle({text: _options.cache[_options.main].render}, {text: _options.year});
    };

    var _setOptionsIndicators = function () {
        var el = $(_options.target + '-form select[name="indicator"]');
        el.html('<option value>Select an indicator...</option>');
        if (_options.iso3) {
            _data.indicators = LBVIS.cache('indicatorsByCountry')[_options.iso3];
        } else {
            _data.indicators = LBVIS.cache('indicators');
        }
        console.log(_options, _data);
        var opts = LBVIS.indicatorsSelect(_options.main);
        if (opts) {
            el.append(opts);
            el.prop( "disabled", false );
        }
    };

    var _setOptionsCountries = function () {
        _getCountries().done (function () {
            var el = $(_options.target + '-form select[name="country"]');
            var str = '';
            //console.log('For : ' + _options.indicator + ' - ' + _data.countries.length + ' countries');
            _data.countries.forEach(function (item) {
                str += '<option value="'+item.iso3+'">' + item.name + '</option>';
            });
            el.prop('disabled', (str ? false : true));
            el.html('<option value>Select a country...</option>' + str);
        });
    };

    var _setOptionsYears = function () {
        var str = '';
        var el = {
            from: $(_options.target + '-form select[name="year[from]"]'),
            to: $(_options.target + '-form select[name="year[to]"]')
        }
        _data.years.forEach(function (item) {
            str += '<option value="'+item+'">' + item + '</option>';
        });
        el.from.prop('disabled', (str ? false : true));
        el.from.html('<option value>From year...</option>' + str);
        if (_data.from) el.from.val(_data.from);
        el.to.prop('disabled', (str ? false : true));
        el.to.html('<option data-localize="inputs.countries">To year...</option>' + str);
        if (_data.to) el.to.val(_data.to);
        return str;
    };

    var _bindUI = function () {
        $(_options.target + '-form .action').hide(true);
        // tmp do in 1 line what is a nightmare in druf*^&pal
        $(_options.target + '-form select[name="indicator"]').val(_options.main);
        if (_options.loadIndicators) {
            _setOptionsIndicators();
        }
        if (_options.loadCountries) {
            _setOptionsCountries();
        }
        // for PRindex
        $(_options.target + '-form').delegate("select", "change", function(e) {
            //if (e.target.name == 'countries') _options.iso3 = e.target.value;
            if (e.target.name == 'indicator') {
                _options.selected = [];
                if (_options.tree[e.target.value]) {
                    _options.selected = Object.keys(_options.tree[e.target.value]);
                }
                else _options.selected.push(e.target.value);
            }
            console.log('change to : ', _options.obs, _options.selected);
            _updateSeries();
            _chartTitle();
        });
        $(_options.target + '-form').delegate("input", "change", function(e) {
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
        // if (_options.observations) {
        //     var e = $(_options.target + '-observations');
        //     console.log(_options.main, _options.observations[_options.main]);
        //      .main, _options.observations);//[_options.main]);
        //     Object.keys(_options.observations).forEach(function(k) {
        //     //    console.log(k, _options.observations[k]);
        //     });
        // }
    };

    return {
        debug: function () {
            console.log(_options, _data);
        },
        draw: function () { _drawChart(); },
        init: function () {
            _loadData().done(function () {
                if (_options.main) {
                    if (_options.tree && _options.tree[_options.main] > -1) {
                        _options.selected = Object.keys(_options.tree[_options.main]);
                    } else {
                        _options.selected.push(_options.main);
                    }
                }
                if (_options.tree) {
                    TreeSerie();
                } else {
                    // Pick first indicator with data
                    if (!_options.main) _options.main = Object.keys(_data.cache)[0];
                    HCseries(_options.main, _options.indicators);
                }
                _drawChart();
                _chartTitle();
                _bindUI();
                //console.log(_options, _data);
            });
        }
    };
});
