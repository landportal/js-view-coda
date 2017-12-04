'use strict';

var lbvisTable = (function (LBV, args) {
    var LBVIS = LBV;
    var _options = {
        target:         '#table',
        iso3:           null,
        indicators:     [],
        selected:       null,
        year:           null,
        loadIndicators:       null
    };
    $.extend(true, _options, args); // true = deep merge

    var _data = {
        indicators: [],
        cache: {},
        // defers: [],
        // years: [],
        // indicatorValues: [],
        // series: {},
    };

    var _setOptionsIndicators = function () {
        var options = LBVIS.generateSelect(Object.values(_data.indicators), 'dataset', LBVIS.cache('datasets'));
        if (options) {
            var el = $(_options.target + '-form select[name="indicator"]');
            el.find('option:gt(0)').remove();
            el.append(options);
            el.prop("disabled", false);
        }
    };

    var _setOptionsYears = function () {
        console.log(' - Set years for', _options.main, Object.keys(_data.cache[_options.main]).length);
        // should happened after an indicator is shown/pulled
        var years = Object.keys(_data.cache[_options.main]);
        years.reverse();
        var el = $(_options.target + '-form select[name="year"]');
        el.find('option:gt(0)').remove();
        el.append(LBVIS.generateSelect(years));
        el.prop("disabled", false);
    };

    var _latestYear = function (data) {
        if (!data) return;
        return data[Object.keys(data).sort().reverse()[0]][_options.iso3];
    };

    var _cols = function () {
        if (_options.iso3) return ['time', 'value'];
        return [
            ['minYear', 'maxYear', 'nYears'],
            ['nCountryWithValue', 'nObs'],
            ['minValue', 'maxValue'],
        ];
    };

    var _updateCell = function (cell, data) {
        var str = '';
        if ($.isArray(cell)) {
            cell.forEach(function (c) {
                if (str) str += ' / ';
                str += _updateCell(c, data);
            });
        } else if (data && data[cell]) {
            str = '<span class="' + data[cell] + '">' + data[cell] + '</span>';
        } else {
            str = '<span class="data-empty">N/A<span>';
        }
        return str;
    };

    var _updateRow = function (id, data) {
        var el = $(_options.target + ' tbody');
        var tr = null;
        // only at first run
        if ((tr =  el.find('tr[lbid="' + id + '"]'))[0]) {
            //console.log(' have ' + id + ' row', tr);
            tr.find('td:gt(0)').remove();
        } else {
            tr = $('<tr></tr>');
            tr.append('<td>' + _data.indicators[id].render + '</td>');
            el.append(tr);
            //console.log(id, data, tr);
        }
        var str = '';//'<td class="empty">-</td><td class="empty">-</td>';
        _cols().forEach(function (c) {
            str += '<td>' +  _updateCell(c, data) + '</td>';
        });
        tr.append(str);
    };

    var _getData = function (indicators) {
        return LBVIS.getIndicatorsInfo(indicators).done(function () {
            var cache = LBVIS.cache('indicatorsInfo');
            indicators.forEach(function (ind) {
                _data.cache[ind] = cache.find(c => c.id == ind);
            });
            //console.log(_data.cache);
        });
    };

    var _getDataCountry = function (indicators, iso3) {
        return LBVIS.loadData(indicators, iso3).done(function () {
            var cache = LBVIS.cache('data');
            indicators.forEach(function (ind) {
                //console.log(ind, iso3, cache);
                if (!cache[ind]) {
                    console.warn('No data for ', ind);
                } else {
                    _data.cache[ind] = cache[ind];
                }
            });
            //console.log(_data.cache);
        });
    };

    var _bindUI = function () {
        $(_options.target + '-form').delegate('button', 'click', function(e) {
            console.log('Click add');
	    e.preventDefault();
        });
        $(_options.target + '-form').delegate("select", "change", function(e) {
	    e.preventDefault();
            //console.log(e.target.name, e.target.value);
            if (e.target.name == 'indicator' && e.target.value) {
                _options.main = e.target.value;
                _loadData([_options.main]).done(function () {
                    //console.log(_data.cache[_options.main]);
                    _setOptionsYears();
                    //_updateRow(_options,main);
                });
            }
            // With iso3
            else if (e.target.name == 'year' && e.target.value) {
                //console.log(_data.cache[_options.main][e.target.value]);
                _updateRow(_options.main, _data.cache[_options.main][e.target.value][_options.iso3]);
            }
        });
        if (_options.iso3) {
            // Limit indicators to the ones available for that country
            LBVIS.getIndicators(_options.iso3).done(function () {
                _data.indicators = LBVIS.cache('indicatorsByCountry')[_options.iso3].reduce(function(map, i) {
                    map[i.id] = i;
                    return map;
                }, {});
                _setOptionsIndicators();
            });
        } else {
            _data.indicators = LBVIS.cache('indicators').reduce(function(map, i) {
                map[i.id] = i;
                return map;
            }, {});;
            _setOptionsIndicators();
        }
    };

    var _loadData = function (indicators) {
        // Table with a country
        if (_options.iso3) {
            return _getDataCountry(indicators, _options.iso3);
        } else {
            return _getData(indicators);
        }
    };

    return {
        debug: function () {
            return {options: _options, data: _data};
        },
        init: function () {
            _loadData(_options.indicators).done(function () {
                //_data.cache = LBVIS.cache('data');
                _options.indicators.forEach(function (ind) {
                    var data = _data.cache[ind];
                    if (_options.iso3) {
                        var last = _latestYear(_data.cache[ind]);
                        data = last;
                    }
                    //console.log(_data.cache[ind], data);
                    _updateRow(ind, data);
                });

            });
            if (_options.loadIndicators) {
                _bindUI();
            }
        }
    };
});
