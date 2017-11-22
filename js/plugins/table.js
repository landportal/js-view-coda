'use strict';

var lbvisTable = (function (LBV, args) {
    var LBVIS = LBV;
    var _options = {
        target:         '#table',
        iso3:           null,
        indicators:     [],
        selected:       null,
        year:           null,
        allowAdd:       null
    };
    $.extend(true, _options, args); // true = deep merge

    var _data = {
        // defers: [],
        // years: [],
        indicators: [],
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
        ['from', 'to'].forEach(function (y) {
            var years = Object.keys(_data.cache[_options.main]);
            if (y == 'to') years.reverse();
            var el = $(_options.target + '-form select[name="' + y + '"]');
            el.find('option:gt(0)').remove();
            el.append(LBVIS.generateSelect(years));
            el.prop("disabled", false);
        });
    };

    var _latestYear = function (data) {
        return data[Object.keys(data).sort().reverse()[0]][_options.iso3];
    }
    
    var _updateRow = function (id, data, cols) {
        var el = $(_options.target + ' tr[lbid="' + id + '"]');
        el.find('td:gt(0)').remove();
        //console.log(id, data);
        var str = '';//'<td class="empty">-</td><td class="empty">-</td>';
        cols.forEach(function (c) {
            str += '<td>' + data[c] + '</td>';
        });
        el.append(str);
    }
    
    var _getData = function (indicators) {
        return LBVIS.getIndicatorsInfo(indicators).done(function () {
            _data.cache = LBVIS.cache('indicatorsInfo');
            console.log(_data.cache);
        });
    };

    var _getDataCountry = function (indicators, iso3) {
        return LBVIS.loadData(indicators, iso3).done(function () {
            // grab data from cache
            // @TODO: check, may have collision?
            _data.cache = LBVIS.cache('data');
            //console.log('  > got', _data.cache);
        });
    };

    return {
        debug: function () {
            return {options: _options, data: _data};
        },
        init: function () {

            if (_options.iso3) {
                _getDataCountry(_options.indicators, _options.iso3).done(function () {
                    Object.keys(_data.cache).forEach(function (id) {
                        var last = _latestYear(_data.cache[id]);
                        // Update row with [indicator, year, value]
                        _updateRow(id, last, ['time', 'value']);
                    });
                });
            } else {
                _getData(_options.indicators).done(function () {
                    // yoohoo
                    console.log('all done!');
                    _options.indicators.forEach(function (ind) {
                        _updateRow(ind, _data.cache.find(c => c.id == ind), ['minYear', 'maxYear']);
                    });
                });
            }
            
            if (_options.loadIndicators) {
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
            }
        }
    };
});



//     var _header = function () {
//         var cols;
// 	if (_options.iso3) {
// 	    cols = ['indicator', 'year', 'value'];//, 'unit', 'dataset', 'source'];
//             if (_options.allowAdd) {
//                 cols.push('Remove');
//             }
// 	} else {
// 	    cols = ['Indicator', 'First, Last years<br/>Coverage', 'Countries / Observations<br/>Missing values', 'Min/Max values']
//             if (_options.allowAdd) {
//                 cols.push('Remove');
//             }
// 	}
//         return cols;
//     }

//     var _columns = function () {
//         var cols;
// 	if (_options.iso3) {
// 	    cols = ['indicator', 'year', 'value'];//, 'unit', 'dataset', 'source'];
// 	} else {
// 	    cols = [
//                 ['indicator'], //, ' (', 'unit', ')', '<br/>', 'dataset', ' (', 'source', ')'],
//                 ['minYear', '-', 'maxYear', '<br/>', 'nYears', '&nbsp;', 'years covered'],
//                 ['nCountryWithValue', '/', 'nObs', '<br/>', 'perMissingValue'],
//                 ['minValue' , '/', 'maxValue']];
// 	}
//         return cols;
//     }

//     var _formatCol = function (col, ind) {
//         if (! ind[col]) {
//             return col;
//         }
//         var str = '';
//         if (col == 'indicator') {
//             if (_options.cache[ind.id]) {
//                 str = _options.cache[ind.id].render;
//             } else {
//                 str = LBVIS.cache('indicators').find(i => i.id == ind.id).render;//[col];
//             }
//             //console.log(ind, _options.cache[ind.id], LBVIS.cache('indicators').find(i => i.id == ind.id));
//         } else {
//             str = ind[col];
//         }
//         return '<span class="' +  col + '">' + str + '</span>';
//     };

//     var _formatRow = function (ind) {
//         var cols = _columns();
//         var row = '<tr id=' + _options.target + '-' + ind['id'] + '">';
//         cols.forEach(function (col) {
//             var str = '';
//             if (typeof col === 'string') {
//                 str = _formatCol(col, ind);
//             } else {
//                 col.forEach(function (cc) {
//                     str += _formatCol(cc, ind);
//                 });
//             }
//             row += '<td>' + str + '</td>';
//         });
//         if (_options.allowAdd) {
//             // Add delete column 
//             row += '<td class="delete"><a href="#"><span class="glyphicon glyphicon-trash text-danger"></span></a></td></tr>';
//         }
//         return row;
//     };
//     var _draw = function () {
//         var thead = '';
//         var row = '<tr>';
//         var cols = _header();
//         cols.forEach(function (col) {
//             var str = '';
//             if (typeof col === 'string') {
//                 str = col;
//             } else {
//                 col.forEach(function (cc) {
//                     str += cc;
//                 });
//             }
//             row += '<th>' + str + '</th>';
//         });
//         $(_options.target + ' table thead').html(row);

//         var tbody = '';
// @@        _data.indicatorValues.forEach(function (ind) {
//             tbody += _formatRow(ind);
//         });
//         $(_options.target + ' table tbody').html(tbody);
// 	$(_options.target + ' [data-toggle="tooltip"]').tooltip();
//     };

//     var _bindUI = function () {
//         $(_options.target + '-form').delegate("select", "change", function(e) {
//             if (e.target.name == 'indicator') {
//                 _options.selected = e.target.value;
// @@@                _getIndicatorYears();
//             }
//             if (e.target.name == 'year') {
//                 _options.year = e.target.value;
//                 //_getIndicator().done(function () { _draw(); });
//             }
//         });
//         // Add row
//         $(_options.target + '-form').delegate(' [name="add"]', "click", function(e) {
// 	    e.preventDefault();
//             // TODO: add loading feedback
//             _getIndicator(_options.selected, _options.year).done(function () {
//                 //console.log('add', _options, _data);
//                 var tr = _formatRow(_data.series[_options.selected]);
//                 $(_options.target + " table tbody").append(tr);
//             });
//         });

//         // Delete row
//         $(_options.target).delegate("td.delete a","click", function(e) {
// 	    e.preventDefault();
// 	    $(this).parents('tr').remove().fadeOut("fast");
//         });
//     };


