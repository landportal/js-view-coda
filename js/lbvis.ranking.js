'use strict';

var lbvisRanking = (function (args = {}) {
    var LBVIS = args.vis;
    var _options = {
        target:         args.target || '#ranking',
        indicator:      args.indicator || 'WB-SP.POP.TOTL',
        theme:          null
    };
    var _data = {
        values: []
    };

    // TODO: this is for all indicators, if a theme is provided, filter them
    var _setOptionsIndicators = function () {
        var el = $(_options.target + ' select[name="indicator"]');
        el.html('<option data-localize="inputs.sindicators">Select an indicator...</option>');
        var opts = LBVIS.generateOptions(LBVIS.cache('indicators'), _options.indicator);
        if (opts) {
            el.append(opts);
            el.prop( "disabled", false );
        }
    };
    var _setOptionsYears = function () {
        var str = '<option data-localize="inputs.years">Year...</option>';
        _data.years.forEach(function (y) {
            var selected = (_options.year == y ? ' selected="selected"' : '');
	    str += '<option value="' + y + '"' + selected + '>' + y + '</option>';
        });
        $(_options.target + ' select[name=year]').html(str);
	$(_options.target + ' select[name=year]').prop( "disabled", false );
    };

    var _getIndicator = function () {
        var query = LBVIS.DATA.queries.indicatorValues(
            _options.indicator, _options.year
        );
        _data.values = [];
        console.log('get indicator', _options, query);
        return $.getJSON(LBVIS.DATA.sparqlURL(query), function (data) {
            data.results.bindings.forEach(function (item) {
                var ind = {};
                Object.keys(item).forEach(function (prop) { ind[prop] = item[prop].value; });
                _data.values.push(ind);
            });
        });
    };
    var _getIndicatorYears = function () {
        var query_url = LBVIS.DATA.sparqlURL(LBVIS.DATA.queries.indicatorYears(_options.indicator));
        return $.getJSON(query_url, function (data) {
            _data.years = [];
	    data.results.bindings.forEach(function (item) {
                _data.years.push(item.year.value);
            });
            if (!_options.year) { // TODO also check _options.year exist!
                _options.year = Math.max.apply(Math, _data.years);
            }
            _setOptionsYears();
        });
    };

    var _bindUI = function () {
        $(_options.target).delegate("select", "change", function(e) {
            if (e.target.name == 'indicator') {
                _options.selected = e.target.value;
                _getIndicatorYears();
            }
            if (e.target.name == 'year') {
                _options.year = e.target.value;
                _getIndicator().done(function () { _draw(); });
            }
        });
    };
    var _formatRow = function (ind, pos) {
        var country = LBV.countries().find(function (v) { return v.iso3 == ind.iso3; });
        var flag = '<span class="rank">' + pos + '</span>',
            rank = '<span class="flag flag-' + ind.iso3 + '">' + ind.iso3 + '</span>';
        //console.log('Row : ', ind, country);
        return '<li><div class="col-xs-8">' + flag + rank + (country ? country.name : ind.iso3) + '</div>'
            + '<div class="col-xs-4">' + ind.value + '</div></li>';
    };
    var _draw = function () {
        var html = '<li><div class="col-xs-8">Country</div>'
                 + '<div class="col-xs-4">Value</div></li>';
        _data.values.forEach(function (ind, pos) {
            html += _formatRow(ind, pos);
        });
        var t = $(_options.target + '-wrapper');
        //console.log('draw', t);
        t.html(html);
	$(_options.target + ' [data-toggle="tooltip"]').tooltip();
    };

    return {
        debug: function () {
            console.log(_options, _data);
        },
        init: function () {
            _setOptionsIndicators();
            if (_options.indicator) {
                _getIndicatorYears().done(function () {
                    _getIndicator().done(function () {
                        _draw();
                    });
                });
            }
            _bindUI();
        }
    };
});
