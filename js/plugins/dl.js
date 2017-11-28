/*
 * JS View CODA Library
 *
 * A visualization library for the Land Portal Land Book / LOD
 *
 * MIT License
 * Copyright (c) 2016 - Land Portal Foundation - http://www.landportal.info
 * Copyright (c) 2016-2017 - Jules Clement <jules@ker.bz>
 *
 * Author: Jules Clement <jules@ker.bz>
 *
 * Plugin: Download
 */
lbvis.dl = (function (LBV, args) {
    var LBVIS = LBV;
    var _options = {
        target:         '#wrapper',
        type:           null,   // 'indicator' or 'dataset'
        year:           null,
    };
    $.extend(_options, args);
    // Internal cache
    var _data = {};

    var _getData = function () {
        return LBV.loadData([_options.lbid]).done(function() {
            var d = LBV.cache('data');
            //console.log(' > got ', d);
            _data.indicator = d[_options.lbid];
            if (_data.indicator) {
                _buildCSV(_data.indicator);
            }
        });
    };

    // Quick 'n dirty CSV formater
    var _buildCSV = function(data) {
        var csv = [];
        var first = null;
        
        Object.keys(data).forEach(function (y) {
            Object.keys(data[y]).forEach(function (c) {
                if (!first) {
                    first = Object.keys(data[y][c]);
                    csv.push(first);
                }
                csv.push(Object.values(data[y][c]));
            });
        });
        _data.csv = csv;
        //var file = _dlCSV(csv);
        //console.log('CSV', first, csv);
    };

    var _linkCSV = function () {
        var csv = '';
        _data.csv.forEach(function(row) {
            csv += row.join(';');
            csv += "\n";
        });

        //console.log(csv);
        var link = document.createElement('a');
        link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
        link.target = '_blank';
        link.download = _options.lbid + '-lb.csv';
        link.innerHTML = 'CSV file';
        return link;
        //hiddenElement.click();
    };

    var _buildLinks = function () {
        if (_data.indicator) {
            return _linkCSV();
        }
        return 'data not available';b
    };

    var _bindUI = function () {
        var $el = $(_options.target);
        //console.log($el);
        w = $el.find(_options.target + '-wrapper');
        w.html(_buildLinks());
    };
    
    // Public methods
    return {
        debug: function () { console.log(_options, _data); },
        init: function () {
            //console.log('DL ' + _options.lbid);//, _options, _data);
            _getData().done(function () {
                _bindUI();
            });
        }
    };
});
