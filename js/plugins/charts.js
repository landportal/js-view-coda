/*
 * LB vis. Pie chart
 *
 NOTE from (original) dev.

 Lot of hardcoded stuff to remove
 Make this truely dynamic. Need to fix the query

 */

'use strict';
var lbvisCharts = (function (LBV, args) {
    var LBVIS = LBV; // Main lbvis object
    var _options = {
        target:         '#wrapper',
        legend:         false,
        iso3:           'PER', // dummy country , works for PRIndex
        year:           '2017',
        indicators:     [],
    };
    $.extend(_options, args);

    var _data = {
        cache: {},
    };
    var _loadData = function () {
        var qvalues = LBVIS.DATA.obsValues(
            ['indicator', 'country', 'time', 'value'], // 'year'
            { indicator: _options.indicators } //country: [_options.iso3], time: [_options.year] }
        );
        //console.log('G', qvalues);
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
            //console.log('GOTCHA', data.results.bindings);
        });
    };

    var HCseries = function () {
        var series = [];
        var categories = [];
        $.each(_data.cache, function (lbid, sdata) {
            var serie = {
                type: 'column',
                name: _options.cache[lbid].label + '-' + _options.year,
                data: [],
                //visible: false,
            };
            $.each(sdata[_options.year], function (c, d) {
                categories.push(d.country.value);
                serie.data.push({
                    id: d.country.value,
                    //name: 
                    // desc: _data.indicators[lbid].desc,
                    // color: _options.colors[i],
                    // cc: d.country.value,
                    y: parseFloat(d.value.value),
                    //console.log(i + ' ' + lbid, d);
                });
            });
            series.push(serie);
        });
        _data.series = series;
        _data.categories = categories;
    }

    var _drawChart = function (series) {
        //console.log('Draw Pie', _data.series);
        var HCopts = {
            credits: { enabled: false },
            title: {
                useHTML: true,
                text: _options.cache[_options.main].render,
                align: 'center'
            },
            chart: {
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

    return {
        debug: function () {
            console.log(_options, _data);
        },
        init: function () {
            _loadData().done(function () {
                //console.log(_options, _data);
                HCseries();
                //console.log(_data);
                _drawChart([]);
                //_data.chart.series[0].visible = true;
            });
        }
    };
});
