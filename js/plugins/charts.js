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
        year:           '',
        indicators:     [],
    };
    $.extend(_options, args);

    var _data = {
        cache: {},
        years: [],
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
        var cYear = (_options.year ? _options.year : _data.years[0]);
        var data = [];
        $.each(sdata[cYear], function (c, d) {
            categories.push(d.country.value);
            data.push({
                id: d.country.value,
                //name: 
                // desc: _data.indicators[lbid].desc,
                // color: _options.colors[i],
                // cc: d.country.value,
                y: parseFloat(d.value.value),
                //console.log(i + ' ' + lbid, d);
            });
        });
        return data;
    }
    var CountrySerie = function (sdata) {
        var data = [];
        $.each(sdata, function (c, d) {
            //categories.push(d[_options.iso3].value);
            data.push({
                id: c,
                x: parseFloat(c),
                //name: 
                // desc: _data.indicators[lbid].desc,
                // color: _options.colors[i],
                // cc: d.country.value,
                y: parseFloat(d[_options.iso3].value.value),
                //console.log(i + ' ' + lbid, d);
            });
        });
        return data;
    }    
    // Column series, by country
    var HCseries = function () {
        var series = [];
        var categories = [];
        var lbid = _options.main ? _options.main : _options.indicators[0];
        var cName = _options.cache[lbid].label + (_options.year ? ' - ' + _options.year : '');
        $.each(_data.cache, function (lbid, sdata) {
            var serie = {
                type: _options.ctype ? _options.ctype : 'column',
                name: cName,
                data: [],
                //visible: false,
            };
            if (_options.iso3) {
                serie.data = CountrySerie(sdata);
            } else {
                serie.data = YearSerie(sdata);
            }
            // $.each(sdata[cYear], function (c, d) {
            //     categories.push(d.country.value);
            //     serie.data.push({
            //         id: d.country.value,
            //         //name: 
            //         // desc: _data.indicators[lbid].desc,
            //         // color: _options.colors[i],
            //         // cc: d.country.value,
            //         y: parseFloat(d.value.value),
            //         //console.log(i + ' ' + lbid, d);
            //     });
            // });
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
                text: (_options.main ? _options.cache[_options.main].render : ''),
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
