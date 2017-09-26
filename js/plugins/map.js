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
var lbvisMap = (function (MAP, LBV, args) {
    var JSONMAP = MAP; // Geo-JSON map with countries obj 'id' as iso3
    var LBVIS = LBV;
    var _options = {
        width:          1004, // print hack, for wkhtmltopdf
        height:         500,  // print hack, for wkhtmltopdf
        target:         '#map',
        indicators:     [],     // ex: 'WB-SP.RUR.TOTL.ZS'
        series:         null,   // static series
        //type: args.type,                // map type: global or local
        // title:          args.title      || null,        // Chart title
        // subtitle:       args.subtitle   || null,        // Chart title
        // iso3:           null,   // iso3 of the country to select
        // year:
        colors: {
            background: 'transparent',
            hover: '#F5A623',
            select: '#F5A623',
            borders: '#FFFFFF',
            min: '#45551A',
            max: '#D9ED7E',
            na: '#BBD6D8'
        },
        // Map options
        map: {
            cursor:     null,
            events:     {},
            legend:     false,
            nav:        false,
            selectable: false,
            tooltip:    false,
            zoom:       false
        },
    };
    $.extend(true, _options, args); // true = deep merge

    // Map internal data
    var _data = {
        chart: null,            // Projection (ex: highchart)
        chartOptions: {},
        cache: {}, // by indicators / year / iso3
        years: {}, // by indicators
        // mapData: args.map_data || map_data,
        // chart: [],
        // // min: null,
        // // max: 0,
        // year: args.year || null,
        // years: [],
        // indicator: {},
        // indicators: {} // un-used
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

    // var _getChartData = function () {
    //     var query = LBVIS.DATA.queries.indicatorValues(_options.indicator, _data.year);
    //     return $.getJSON(LBVIS.DATA.sparqlURL(query), function (data) {
    //         _data.chart = [];
    //         data.results.bindings.forEach(function (item) {
    //             _data.chart.push({
    //                 id:  item.iso3.value,
    //                 value: parseFloat(item.value.value),
    //                 year:  item.period.value,
    //                 //year:  parseInt(item.year.value)
    //             });
    //         });
    //         //console.log(data.results, _data.chart[0], _data.chart[42]);
    //     });
    // };

    // var _getIndicatorDetails = function () {
    //     return LBVIS.getIndicatorDetails(_options.indicator, _options.iso3).done(function () {
    //         _data.indicator = LBVIS.cache('info')[_options.indicator][0];
    //         _data.years = LBVIS.cache('period')[_options.indicator];
    //         if (!_data.year) {
    //             //_data.year = Math.max.apply(Math, _data.years);
    //             _data.year = _data.years.sort().reverse()[0];
    //         }
    //         _setOptionsYears();
    //         _data.title = '<a href="'+_data.indicator.indicatorSeeAlso+'" target="_blank">' + _data.indicator.label + '</a>' 
    //         +' ('+ _data.indicator.unit +') in <a href="'+_data.indicator.datasetSeeAlso+'" target="_blank" class="txt-l">'
    //         + _data.indicator.dataset+'</a> (by <a href="'+ _data.indicator.sourceSeeAlso + '" target="_blank" class="txt-l">'+ _data.indicator.source +'</a>)';
    //         _data.subtitle = _data.indicator.description;

    //         _setTitles(_data.title,
    //                    _data.subtitle);
    //     });
    // };



    /*
     * Take this out of vis (for now) // 'actions' form are created 'outside' the #target
     * @TODO: this should feedback into vis. form ID
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


    
    // Series formatters
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
    // Returns HightChart map series
    var _mapSeries = function () {
        var series = [];
        $.each(_data.cache, function (lbid, sdata) {
            var serie = {
                name: _options.cache[lbid].label, // + '-' + _options.year,
                data: [],
                //visible: false,
            };
            _data.years[lbid] = Object.keys(sdata);
            // TODO latest year?
            $.each(sdata[_data.years[lbid][_data.years[lbid].length - 1]], function (c, d) {
                //categories.push(d.country.value);
                serie.data.push({
                    id: d.country.value,
                    //name: 
                    // desc: _data.indicators[lbid].desc,
                    // color: _options.colors[i],
                    // cc: d.country.value,
                    value: parseFloat(d.value.value),
                    //console.log(i + ' ' + lbid, d);
                });
            });
            series.push(serie);
        });
        _data.series  = series;
        return _data.series || [];
    }

    /*
     * Drawing
     */
    var _mapOptions = function () {
        _data.chartOptions = {
            chart: {
                width: _options.width,
                height: _options.height,
                backgroundColor: _options.colors.background,
                //margin: (_options.indicator ? null : [0, 0, 0, 0])
            },
            title:      { text: (_options.title ? _options.title : null) , useHTML: true},
            subtitle:   { text: (_options.subtitle ? _options.subtitle : null), useHTML: true},
            credits:    { enabled: false },
            legend:     { enabled: _options.map.legend, verticalAlign: 'bottom', },
            tooltip:    { enabled: (_options.map.tooltip ? true : false), valueDecimals: 2 }
        };
        _data.chartOptions.mapNavigation = {
            enabled: _options.map.nav,
            enableMouseWheelZoom: false,
            enableDoubleClickZoom: true,
            enableTouchZoom: false,
            buttonOptions: {
                align: 'right',
            },
        };
        _data.chartOptions.plotOptions = { map: {
            mapData: JSONMAP,
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
        _data.chartOptions.colorAxis = {
            min: 0,
            maxColor: _options.colors.max,
            minColor: _options.colors.min
        };
        if (_options.map.tooltip && _options.map.tooltip !== true) {
            _data.chartOptions.tooltip = {
                formatter: _options.map.tooltip
            };
        }
    };

    var _setTitles = function(title, subtitle) {
        _data.chartOptions
        _data.chart.setTitle(title, subtitle);
    };

    function _mapDraw() {
        _mapOptions();
        // var data = _options.data || null;
        // if (!data && !_options.indicator && _options.map.selectable) {
        //     data = _data.mapData.map(function (c) { return {id: c.id, value: 0}; }); // fake dataset based on mapData
        // }
        _data.chart = $(_options.target).highcharts('Map', $.extend(_data.chartOptions, {
            series: _mapSeries()
        }));
        //console.log('drawMap with ', _options, _data, _map);

        //$(_options.target + " .loading").removeClass("hidden");
        //_data.chart = $(_options.mapTarget).highcharts();
        return _data.chart;
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
     * Public methods
     */
    return {
        debug: function () {
            console.log(_options, _data);
            return _data.chart;
        },
        draw: _mapDraw,
        init: function () {
            _loadData().done(function () {
                //console.log('Map init', _options, _data);
                _mapDraw();
            });

            // 'Static serie'
            // if (_options.serie) {
            //     _data.map.series[0].remove();
            //     _data.map.addSeries(_options.serie);
            //     //_data.map.colorAxis[0].update(_map.colorAxis);
            // }
            // // Select and eventually zoom to country
            // if (_options.iso3) {
            //     $(_options.mapTarget).highcharts().get(_options.iso3).select();
            //     if (_options.map.zoom) {
            //         $(_options.mapTarget).highcharts().get(_options.iso3).zoomTo();
            //         $(_options.mapTarget).highcharts().mapZoom(_options.map.zoom);
            //     }
            // }
            // // Fills up Indicators select
            // if (_options.showIndicators) {
            //     // get indi
            //     LBVIS.getIndicators(_options.iso3).done(function () {
            //         _setOptionsIndicators();
            //     });
            // }
            // _bindUI();
            // // Get indicator details (meta + years)
            // if (_options.indicator) {
            //     _getIndicatorDetails().done(function () {
            //         // Get indicator values (all years)
            //         _getChartData().done(function () {
            //             _mapUpdate();
            //             $(_options.target + " .loading").addClass("hidden");
            //         });
            //     });
            // } else {
            //     $(_options.target + " .loading").addClass("hidden");
            // }
        }
    };
});
