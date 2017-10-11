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
    };
    $.extend(_options, args);

    var _data = {
        cache: {},
        series: [],
        years: [],
        categories: [],
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
                name: d.country.value + '-' + _options.year,
                y: parseFloat(d.value.value),
            });
        });
        return data;
    }

    var CountrySerie = function (sdata) {
        var data = [];
        console.log('Cserie', sdata);
        $.each(sdata, function (year, cdata) {
            if (_data.categories.indexOf(year) == -1) {
                _data.categories.push(year);
            }
            data.push({
                id: _options.iso3 + '-' + year,
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
                id: lbid,
                name: _options.cache[lbid].label,//main + '-' + lbid,
                data: [],
                visible: (main == _options.main ? true : false),
                showInLegend: (main == _options.main ? true : false),
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
                useHTML: true,
                text: (_options.main ? _options.cache[_options.main].render : ''),
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


    // Generic Vis. private method
    var _chartTitle = function  () {
        //_options.iso3 + '-' + _options.main;
        _data.chart.setTitle({text: _options.cache[_options.main].label}, {text: _options.year});
    }

    var _bindUI = function () {
        $(_options.target + '-form').delegate("select", "change", function(e) {
            //if (e.target.name == 'countries') _options.iso3 = e.target.value;
            if (e.target.name == 'observations') _options.main = e.target.value;
            var sid = _options.main;
            _data.series.forEach(function(serie, id) {
                if (serie.sgid == sid) {
                    _data.chart.series[id].show();
                } else {
                    _data.chart.series[id].hide();
                }
            });
            _chartTitle();
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
                    var main = _options.main ? _options.main : Object.keys(_data.cache)[0];
                    HCseries(main, _options.indicators);
                }
                _drawChart();
                _bindUI();
                _chartTitle();
                //console.log(_options, _data);
            });
        }
    };
});
