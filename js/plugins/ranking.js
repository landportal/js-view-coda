'use strict';

var lbvisRanking = (function (LBV, args) {
    var LBVIS = LBV;
    var _options = {
        target:         '#ranking',
        indicators:     [ 'WB-SP.POP.TOTL' ],
        expand:         5,
        expandThreshold: 20,
        //year:           null,
    };
    $.extend(true, _options, args); // true = deep merge

    var _data = {
        years: [],
        cache: {},
        values: [] // contains displayed values
    };

    var _loadData = function (indicators) {
        return LBVIS.loadData(indicators).done(function () {
            _data.cache = LBVIS.cache('data');
            _data.years = Object.keys(_data.cache[_options.main])
            _data.years.sort(function (a, b) { return b - a; });
            _setOptionsYears();
            _options.year = Object.keys(_data.cache[_options.main])[0];
            //console.log('GOT', _data.cache, _data.years);
        });
    };

    var _setOptionsIndicators = function () {
        var opts = LBVIS.generateSelect(LBVIS.cache('indicators'), 'dataset', LBVIS.cache('datasets'));
        if (opts) {
        var el = $(_options.target + '-form select[name="indicator"]');
            el.find('option:gt(0)').remove();
            el.append(opts);
            el.prop( "disabled", false );
        }
    };
    var _setOptionsYears = function () {
        var opts = LBVIS.generateSelect(_data.years);
        if (opts) {
            var el = $(_options.target + '-form select[name="year"]');
            el.find('option:gt(0)').remove();
            el.append(opts);
            el.prop( "disabled", false );
        }
    };

    var _bindUI = function () {
        _setOptionsIndicators();
        $(_options.target + '-form').delegate("select", "change", function(e) {
            if (e.target.name == 'indicator') {
                _options.main = e.target.value;
                _loadData([_options.main]).done(function () {
                    _draw();
                });
            }
            if (e.target.name == 'year') {
                _options.year = e.target.value;
                _draw();
            }
        });
    };
    
    var _formatRow = function (ind, pos, length) {
        var country = LBV.countries().find(function (v) { return v.iso3 == ind.country; });
        var flag = '<span class="rank">' + (pos + 1) + '</span>',
            rank = '<span class="flag-icon flag-icon-' + ind.country.toLowerCase() + '"/>';
        //console.log('Row : ', ind, country);
        var rowClass = (_data.values.length > _options.expandThreshold && pos >= _options.expand && pos + _options.expand < length ? ' class="hidden"' : '');
        return '<li'+rowClass+'><div class="col-xs-8">' + flag + rank + (country ? country.name : ind.country) + '</div>'
            + '<div class="value col-xs-4 text-right"'
            + (parseFloat(ind.value) && ind.value.toString().indexOf('.') > -1 ? ' title="'+ind.value+'"' : '') + '>'
            + (parseFloat(ind.value) ? LBVIS.round(ind.value, 2) : ind.value)
            + '</div></li>';
    };
    var _expandRow = function () {
        return '<li class="hidden-print text-center expand"><a name="show">Expand</a><a name="hide" class="hidden">Hide</a></li>';
    };

    var _formatList = function () {
        var main = LBVIS.indicators().find(i => i.id == _options.main);
        // List header
        var html = '<li><div class="col-xs-9"><h4>' + main.render + '</h4><p>Country / Rank</p></div>'
                 + '<div class="col-xs-3 text-right"><h4>'+ _options.year + '</h4><i>in ' + main.unit + '</i></div></li>';
        // Quickly test data values (first one) to see if it's numeric, NaN, reverse array
        if (!parseFloat(_data.values[0])) _data.values = _data.values.reverse();
        // Fill up rows
        _data.values.forEach(function (ind, pos) {
            if (pos == _options.expand && _data.values.length > _options.expandThreshold) html += _expandRow();
            html += _formatRow(ind, pos, _data.values.length);
        });
        $(_options.target).html(html);
	$(_options.target + ' [data-toggle="tooltip"]').tooltip();
        $(_options.target + ' .expand a').on('click', function(e) {
            e.preventDefault();
            $(e.target.parentElement.children).toggleClass('hidden');
            if (e.target.name == 'show') {
                $(_options.target + ' li').removeClass('hidden');
            } else {
                $(_options.target + '-wrapper li:nth-child(n+8):nth-last-child(n+6)').addClass('hidden');
            }
        });
    };

    var _draw = function () {
        _data.values = Object.values(_data.cache[_options.main][_options.year]);
        _data.values.sort(function (a, b) { // sort descending
            return parseFloat(b) - parseFloat(a);
        });
        if (!_data.values) {
            console.warn('OWWW!');
            return false;
        }
        _formatList();
    };

    return {
        debug: function () {
            console.log(_options, _data);
        },
        init: function () {
            if (_options.indicators) {
                if (!_options.main) _options.main = _options.indicators[0];
                _loadData(_options.indicators).done(function () {
                    if (!_options.year) _options.year = Object.keys(_data.cache[_options.main])[0];
                    _draw();
                });
            }
            _bindUI();
        }
    };
});
