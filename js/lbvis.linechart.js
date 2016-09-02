'use strict';

var lbvisLC = (function (args) {
    var LBVIS = args.vis;
    var _options = {
        target: args.target || '#compare',
        target_chart: args.target_chart || '#compare-chart',
        indicator: args.indicator || 'WB-SP.RUR.TOTL.ZS',
        iso3: args.iso3,
        compare: [args.iso3],
        colors: args.colors || ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"],
        max_countries: 20
    };
    var _data = {
        indicators: [],         // List of comparable indicators details
        indicator: {},          // Holds 'current' indicators info
        countries: [],          // List of comparable countries
        years: [],              // Current, available, years for the indicators + countries
        values: [],
        from: null,
        to: null,
        series: null
    };

    /* Get DATA */
    function _getCountries() {
        var query_url = LBVIS.DATA.sparqlURL(LBVIS.DATA.queries.indicatorCountries(_options.indicator));
        return $.getJSON(query_url, function (data) {
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
            // reset min, max if not avail
            if (_data.from < Math.min.apply(Math, _data.years)) {
                _data.from = Math.min.apply(Math, _data.years);
            }
            if (_data.to > Math.max.apply(Math, _data.years)) {
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

    function _prepareSeries() {
        _data.series = new Array();
        _options.compare.forEach(function (country, i) {
            _data.series[i] = {
                iso3: country,
                name: LBVIS.countries().find(function (c) { return c.iso3 === country; }).name,
                color: _options.colors[i],
                data:  _data.values.filter(function (val) {
                    return (val.country == country && val.year >= _data.from && val.year <= _data.to);
                }).map(function (val) { return val.value; })
            };
        });
        //_data.indicator = _data.indicators[_options.indicator];
        //console.log('Series', _data.series);
    }
    function _draw() {
        _prepareSeries();
        var chart_type = "column";
        //console.log(_data.indicator);
        if(_data.from != _data.to) chart_type = "line";
        var CharLineOp = {
            chart: {
                type: chart_type,
                backgroundColor: "transparent",
                renderTo: $(_options.target + ' ' + _options.target_chart)[0]
            },
            credits: {
                enabled: false
            },
            title: {
                text: '<a href="'+_data.indicator.uri+'" target="_blank">'
                    + _data.indicator.label + '</a>'
                    +' ('+ _data.indicator.unit +')',
                useHTML: true,
                x: -20 //center
            },
            subtitle: {
                text: '<a href="'+_data.indicator.datasetURL+'" target="_blank" class="txt-l">'
                    + _data.indicator.dataset+'</a> (<a href="'+ _data.indicator.sourceOrgURL
                    + '" target="_blank" class="txt-l">'+ _data.indicator.sourceOrg +'</a>)',
                useHTML: true,
                x: -20
            },
            xAxis: {
                categories: _data.years.filter(function (year) { return (year >= _data.from && year <= _data.to); })
            },
            yAxis: {
                title: {
                    text: _data.indicator.name
                }
            },
            legend: {
                align: 'center',
                verticalAlign: 'bottom',
                borderWidth: 0
            },
            series: _data.series
        };
        $(_options.target + " .loading").addClass("hidden");
        return new Highcharts.Chart(CharLineOp);
    }

    function _bindUI() {
        $(_options.target + ' select[name="country"]').prop('disabled', true);
        $(_options.target + ' select[name="year[from]"]').prop('disabled', true);
        $(_options.target + ' select[name="year[to]"]').prop('disabled', true);
        $(_options.target + ' form').delegate("select", "change", function(e) {
            if (e.target.name == 'indicator') {
                _options.indicator = e.target.value;
                //
                LBVIS.getIndicatorInfo(_options.indicator, _data.indicators).done(function () {
                    _data.indicator = LBVIS.cache(_options.indicator)[0];
                    _getCountries().done(function () {
                        _setOptionsCountries();
                    });
                });
            }
            else if (e.target.name == 'country') {
                _options.compare.push(e.target.value);
                _getIndicatorValues();
                _getYearsIndicator().done(function () {
                    _setOptionsYears();
                }).fail(function () {
                    console.error('FAILED', arguments);
                });
            }
            else if (e.target.name == 'year[to]' || e.target.name == 'year[from]') {
                // just keep XXX from year[XXX] ( 'from' or 'to' )
                _data[e.target.name.slice(5, -1)] = e.target.value;
                _draw();
                // TODO: switch values if from > to?
            }
        });
        $(_options.target + ' form').delegate('input[name="add"]', "click", function(e) {
            e.preventDefault();
            //console.log(_options, _data);
            // requery the data and draw chart
            _data.defer.done(function () {
                _draw();
            });
        });
    }

    var _setOptionsIndicators = function () {
        var el = $(_options.target + ' select[name="indicator"]');
        el.html('<option data-localize="inputs.sindicators">Select an indicator...</option>');
        _data.indicators = LBVIS.cache('indicators_' + _options.iso3);
        var opts = LBVIS.generateOptions(_data.indicators, _options.indicator);
        if (opts) {
            el.append(opts);
            el.prop( "disabled", false );
        }
    };

    return {
        OPTS: _options,
        draw: function () { return _draw(); },
        init: function () {
            //
            LBVIS.getIndicators(_options.iso3).done(function () {
                _setOptionsIndicators();
            });

            LBVIS.getIndicatorInfo(_options.indicator).done(function () {
                _data.indicator = LBVIS.cache(_options.indicator)[0];
                // @@@ If we have an indicator, load comparable countries
                _getCountries().done(function () {
                    _setOptionsCountries();
                    // Load available years for this indicator
                    _getYearsIndicator().done(function () {
                        // by default set serie years to min / max
                        // See: http://aaroncrane.co.uk/2008/11/javascript_max_api/ about min/max
                        _data.from = Math.min.apply(Math, _data.years);
                        _data.to = Math.max.apply(Math, _data.years);
                        _setOptionsYears();
                        _getIndicatorValues().done(function () {
                            _draw();
                        });
                    });
                });
            });
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
