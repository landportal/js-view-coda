'use strict';

var lbvisLC = (function (args) {
    var LBVIS = args.vis;
    var _options = {
        width:          args.width      || 1004, // print hack, for wkhtmltopdf
        height:         args.height     || 500,  // print hack, for wkhtmltopdf
        target:         args.target || '#compare',
        graphTarget:    args.graphTarget || (args.target ? args.target + '-wrapper' : '#compare-wrapper'),
        indicator:      args.indicator || 'WB-SP.RUR.TOTL.ZS',
        iso3:           args.iso3,
        compare:        [args.iso3],
        colors:         args.colors || ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"],
        max_countries:  20
    };
    var _data = {
        indicators: [],         // List of comparable indicators details
        indicator: {},          // Holds 'current' indicators info
        countries: [],          // List of comparable countries
        years: [],              // Current, available, years for the indicators + countries
        values: [],
        from: null,
        to: null,
        series: null,
        chart: null             // Highchart chart/object
    };

    /* Get DATA */
    function _getCountries() {
        var query_url = LBVIS.DATA.sparqlURL(LBVIS.DATA.queries.indicatorCountries(_options.indicator));
        return $.getJSON(query_url, function (data) {
            _data.countries = [];
            data.results.bindings.forEach(function (item) {
                //console.log('Countries', item);
                _data.countries.push({iso3: item.iso3.value, name: item.name.value});
            });
        });
    }
    function _getYearsIndicator() { //?
        $(_options.target + ' select.years').prop('disabled', true);
        var query_url = LBVIS.DATA.sparqlURL(
            LBVIS.DATA.queries.indicatorYears(_options.indicator));
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
    }

    function _getIndicatorValues() {
        //console.log(_options.indicator, _options.compare, _options);
        var query = LBVIS.DATA.queries.line_chart(
            _options.indicator, _options.compare
        );
        var query_URL = LBVIS.DATA.sparqlURL(query);
        _data.defer = $.getJSON(query_URL, function (data) {
            _data.values = data.results.bindings.map(function (item) {
                return {
                    'country': item.countryISO3.value,
                    'value': parseFloat(item.value.value),
                    'year': parseInt(item.year.value)
                };
            });
        });
        return _data.defer;
    }

    function _setOptionsCountries() {
        var str = '';
        //console.log('For : ' + _options.indicator + ' - ' + _data.countries.length + ' countries');
        _data.countries.forEach(function (item) {
            str += '<option value="'+item.iso3+'">' + item.name + '</option>';
        });
        $(_options.target + ' select[name="country"]').prop('disabled', (str ? false : true));
        $(_options.target + ' select[name="country"]').html(
            '<option data-localize="inputs.countries">Select a country...</option>'
                + str);
        return str;
    }
    function _setOptionsYears() {
        var str = '';
        _data.years.forEach(function (item) {
            str += '<option value="'+item+'">' + item + '</option>';
        });
        $(_options.target + ' select[name="year[from]"]').prop('disabled', (str ? false : true));
        $(_options.target + ' select[name="year[from]"]').html(
            '<option data-localize="inputs.countries">From year...</option>'+ str);
        if (_data.from) $(_options.target + ' select[name="year[from]"]').val(_data.from);
        $(_options.target + ' select[name="year[to]"]').prop('disabled', (str ? false : true));
        $(_options.target + ' select[name="year[to]"]').html(
            '<option data-localize="inputs.countries">To year...</option>'+ str);
        if (_data.to) $(_options.target + ' select[name="year[to]"]').val(_data.to);
        return str;
    }
    var _setOptionsIndicators = function () {
        var el = $(_options.target + ' select[name="indicator"]');
        el.html('<option data-localize="inputs.sindicators">Select an indicator...</option>');
        if (_options.iso3) {
            _data.indicators = LBVIS.cache('indicatorsByCountry')[_options.iso3];
        } else {
            _data.indicators = LBVIS.cache('indicators');
        }
        //console.log(_options, _data);
        var opts = LBVIS.indicatorsSelect(_options.indicator);
        if (opts) {
            el.append(opts);
            el.prop( "disabled", false );
        }
    };

    function _setTitle() {
        return {
            text: '<a href="'+_data.indicator.indicatorSeeAlso+'" target="_blank">'
                + _data.indicator.label + '</a>' +' ('+ _data.indicator.unit +') in <a href="'+_data.indicator.datasetSeeAlso+'" target="_blank" class="txt-l">'
                + _data.indicator.dataset+'</a> (by <a href="'+ _data.indicator.sourceSeeAlso
                + '" target="_blank" class="txt-l">'+ _data.indicator.source +'</a>)',

            useHTML: true,
            x: -20 //center
        };
    }
    function _setSubTitle() {
        return {
            text: _data.indicator.description,
            useHTML: true,
            x: -20
        };
    }

    function _prepareSeries() {
        if (_data.chart) {
            _data.chart.series.map(function (s) {
                if (s.visible == false) {
                    var p = _options.compare.indexOf(s.options.iso3);
                    _options.compare.splice(p, 1);
                }
            });
        }
        // console.log('prepSeries', _options.compare);
        _data.series = [];
        _options.compare.forEach(function (country, i) {
            _data.series[i] = {
                iso3: country,
                name: LBVIS.countries().filter(function (c) { return c.iso3 === country; })[0].name,
                color: _options.colors[i],
                data:  _data.values.filter(function (val) {
                    return (val.country == country && val.year >= _data.from && val.year <= _data.to);
                }).map(function (val) { return [Date.UTC(val.year, 0, 1), val.value]; })
            };
        });
        //_data.indicator = _data.indicators[_options.indicator];
        if (_data.chart) {
            //console.log('Series', _data.chart.series, _data.chart.series.length);

            // NOTE: this is a weird (surely not the best) way to iterate over the chart
            // series. It is done this way (with array pop() ) so if we remove a serie
            // from the chart this should still go over all of them.
            var nb =  _data.chart.series.length;
            for (var i=0; i < nb; i++) {
                var s = _data.chart.series.pop();
                //console.log('  serie '+ i + ' ' + s.options.iso3 + ': ' +s.visible, s);
                //TODO: update it with new data (same ISO3, different years boundaries
                // OR remove if not present
                //if (_options.compare.indexOf(s.iso3) === -1)
                s.remove();
                // else
                //     s.data = _data.series.filter(function (ss) { return ss.id == s.iso3; });
            }
            // var chartSeries = _data.chart.series.map(function (item) { return item.options.iso3; });
            // console.log('ChartS ', chartSeries);
            _data.series.forEach(function (s) {
                //if (chartSeries.indexOf(s.iso3) === -1)
                _data.chart.addSeries(s);
            });
            //console.log('Chart is now ', _data.chart.series);
        }
    }

    function _draw() {
        //_prepareSeries();
        var chart_type = "line";
        //console.log(_data.indicator);
        //if(_data.from != _data.to) chart_type = "line";
        var CharLineOp = {
            chart: {
                // width: _options.width,
                // height: _options.height,
                type: chart_type,
                backgroundColor: "transparent",
                renderTo: $(_options.target + ' ' + _options.graphTarget)[0]
            },
            credits: {
                enabled: false
            },
            title: _setTitle(),
            subtitle: _setSubTitle(),
            xAxis: {
                type: 'datetime',
                title: {
                    text: 'Years'
                },
                //categories: _data.years.filter(function (year) { return (year >= _data.from && year <= _data.to); })
            },
            // yAxis: {
            //     title: {
            //         text: _data.indicator.name
            //     }
            // },
            legend: {
                align: 'center',
                verticalAlign: 'bottom',
                borderWidth: 0
            },
            series: _data.series
        };
        $(_options.target + " .loading").addClass("hidden");
        _data.chart = new Highcharts.Chart(CharLineOp);
        return _data.chart;
    }

    function _bindUI() {
        $(_options.target + ' select[name="country"]').prop('disabled', true);
        $(_options.target + ' select[name="year[from]"]').prop('disabled', true);
        $(_options.target + ' select[name="year[to]"]').prop('disabled', true);
        $(_options.target + ' form').delegate("select", "change", function(e) {
            e.preventDefault();
            if (e.target.name == 'indicator') {
                _options.indicator = e.target.value;
                //
                LBVIS.getIndicatorInfo(_options.indicator, _data.indicators).done(function () {
                    _data.indicator = LBVIS.cache('info')[_options.indicator][0];
                    _loadIndicatorDefault();
                });
            }
            else if (e.target.name == 'country') {
            }
            else if (e.target.name == 'year[to]' || e.target.name == 'year[from]') {
                // just keep 'XXX' in 'year[XXX]' (likely: 'from' or 'to' )
                _data[e.target.name.slice(5, -1)] = e.target.value;
                _prepareSeries();
            }
        });
        $(_options.target + ' form').delegate('input[name="add"]', "click", function(e) {
            e.preventDefault();
            // TODO: better jquery select
            _options.compare.push($('select[name="country"]').val());
            console.log("ADD", e, _options.compare);

            _getYearsIndicator().done(function () {
                //console.error('new Year set', _data.years);
                _setOptionsYears();
                _getIndicatorValues().done(function () {
                    _prepareSeries();
                    _data.chart.hideLoading();
                });
            }).fail(function () {
                console.error('FAILED', arguments);
            });
        });
    }

    // This function loads an indicator and show 'default' values
    //  1) Get the countries list, reload select
    //  2) Get valid years for this indicator, reload 'from' and 'to' selects
    //  3) Finally get indicator values for years ( + selected countries )
    var _loadIndicatorDefault = function() {
        _data.chart.setTitle(_setTitle(), _setSubTitle());
        _data.chart.showLoading();
        // 1)
        _getCountries().done(function () {
            _setOptionsCountries();
            // 2)
            // reset from and to
            _data.from = null;
            _data.to = null;
            _getYearsIndicator().done(function () {
                _setOptionsYears();
                // 3)
                _getIndicatorValues().done(function () {
                    _prepareSeries();
                    _data.chart.hideLoading();
                });
            });
        });
    };

    return {
        debug: function () { console.log(_options, _data); },
        prepareSeries: function () { return _prepareSeries(); },
        chart: function () { return _data.chart; },
        init: function () {
            // Get indicators list and load it
            LBVIS.getIndicators(_options.iso3).done(function () {
                _setOptionsIndicators();
            });
            // For selected indicators, get details and load 'defaults'
            LBVIS.getIndicatorInfo(_options.indicator).done(function () {
                _data.indicator = LBVIS.cache('info')[_options.indicator][0];
                _draw();
                _loadIndicatorDefault();
            });
            // Bind interface (form)
            _bindUI();
            //console.log('LBLC', _options, _data);
        }
    };
});

// On add
// var label = '<span class="label-compare displayib fos txt-s">'+$("#lscountry option:selected").text()+' <a href="#" class="close-label" data-iso3="'+$("#lscountry option:selected").val()+'"><img src="img/close-label.svg"></a></span>';
// $("#labels-compare").append(label)

// $(document).delegate(".close-label", "click", function(e){
//     e.preventDefault();
//     var stringToArray = LBLC.compared_countries;
//     var removeItem = $(this).attr("data-iso3");
//     stringToArray = jQuery.grep(stringToArray, function(value) {
//         return value != removeItem;
//     });
//     //Refrescamos el array existente donde se anaden
//     $(this).parent().remove();
//     if($("#labels-compare > span.label-compare").length == 0) {
//     }
//     LBLC.compared_countries = stringToArray;
//     //setDataURLs();
//     loadLineChart();
// });
