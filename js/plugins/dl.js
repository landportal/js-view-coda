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
        lbid:           null,   // LP id for IND or DS
        year:           null,
        //tree:           true,
    };
    $.extend(_options, args);
    // Internal cache
    var _data = {
        cache: {},
        countries: {},
        meta: {},
        indicators: {},
    };

    var _getMetaQuery = function () {
        var inds = _data.cache[_options.lbid].map(i => i.indicatorID).filter(function(ind, i, arr) {
            return arr.indexOf(ind) == i;
        });
        _data.meta[_options.lbid] = {};
        inds.forEach(function (id) {
            var stuff = $.extend(
                true,
                LBVIS.cache('indicators').find(i => i.id == id),
                LBVIS.cache('indicatorsInfo').find(i => i.id == id));
            delete stuff.render;
            _data.meta[_options.lbid][id] = stuff;

        });
    };

    var _getQuery = function () {
        var q = null;
        var inds = [_options.lbid];
        if (_options.type == 'dataset') {
            q = LBVIS.DATA.queries.datasetData(_options.lbid);
        } else {
            if (_options.tree && _options.tree[_options.lbid] && _options.tree[_options.lbid].length != 0) {
                inds = LBVIS.flattenTree(_options.tree[_options.lbid]);
            }
            // more generic query (works only on Computex-based data)
            q = LBVIS.DATA.obsValues(['indicator', 'indicatorName', 'country', 'countryName', 'time', 'value'], { indicator: inds });
            //q = LBVIS.DATA.obsValues(['indicator' => 'code', 'indicatorName' => 'indicator', 'country' => 'iso3', 'countryName' => 'Country', 'time' => 'year', 'value' => 'value'], { indicator: _data.indicators });
            //console.log(q);
        }
        q = LBVIS.DATA.sparqlURL(q);
        q = q.replace('format=json', 'format=html');
        return q;
    };

    var _getData = function () {
        var defer = $.when();
        var inds = [_options.lbid];
        if (_options.type == 'indicator') {
            if (_options.tree && _options.tree[_options.lbid] && _options.tree[_options.lbid].length != 0) {
                inds = LBVIS.flattenTree(_options.tree[_options.lbid]);
            }
            //console.log(inds, _options.tree[_options.lbid]);
            defer = LBVIS.loadData(inds).done(function() {
                _data.countries = LBVIS.cache('countries');
                inds.forEach(function (i) {
                    // stuff in meta info about indicators + country name
                    _data.indicators[i] = LBVIS.cache('indicators').find(d => d.id == i); // by lbid
                    var d = LBVIS.cache('data')[i];
                    _data.cache[i] = {};
                    //console.log(i, inds);
                    Object.keys(d).forEach(function(y) { // year
                        _data.cache[i][y] = {};
                        Object.keys(d[y]).forEach(function(c) { // country
                            _data.cache[i][y][c] = {};
                            Object.keys(d[y][c]).forEach(function(a) { // attr
                                if (a == 'country') {
                                    _data.cache[i][y][c]['Country name'] = _data.countries.find(cc => cc.iso3 == c).name;
                                }
                                if (a == 'indicator') {
                                    _data.cache[i][y][c]['Indicator name'] = _data.indicators[i].label;
                                }
                                _data.cache[i][y][c][a] = d[y][c][a];
                            });
                        });
                    });
                    //console.log(_data.cache[i]);
                });
            });
            //}
            // else {
            // }
        } else if (_options.type == 'dataset') {
            defer = LBVIS.loadDataset([_options.lbid]).done(function() {
                _data.cache[_options.lbid] = LBVIS.cache('dataset')[_options.lbid];
            });
        }
        return defer;
    };

    // Quick 'n dirty CSV formater
    var _buildCSV = function(data) {
        var csv = [];
        var first = null; // used to set header, based on 1st row obj keys
        if (_options.type == 'indicator') {
            if (!Object.keys(_data.indicators).length) return '';
            Object.keys(_data.indicators).forEach(function (lbid) {
                // work by year + iso3
                //console.log(lbid, data);
                Object.keys(data[lbid]).forEach(function (y) {
                    Object.keys(data[lbid][y]).forEach(function (c) {
                        if (!first) {
                            first = Object.keys(data[lbid][y][c]);
                            csv.push(first);
                        }
                        csv.push(Object.values(data[lbid][y][c]));
                    });
                });
            });
        } else {
            Object.values(data[_options.lbid]).forEach(function (row) {
                if (!first) {
                    first = Object.keys(row);
                    csv.push(first);
                }
                csv.push(Object.values(row));
            });
        }
        //_data.csv = csv;
        //var file = _dlCSV(csv);
        //console.log('CSV', csv);
        var str = '';
        csv.forEach(function(row) {
            //Replace single quotes with double quotes.
            replaceQuotes = function (v) {
                return v.toString().replace(/"/g, '""');
            }
            row = row.map(replaceQuotes)
            str += '"' + row.join('";"'); // foreach col replace " by \"
            str += '"' + "\n";
        });
        return str;
    };

    var _linkCSV = function () {
        //console.log(csv);
        var link = $('<a/>', {
            "target": "_blank",
            "title": "Get the data in tabular format",
            "download": 'landportal-' + _options.lbid + '.csv',
            "href": 'data:text/csv;charset=utf-8,' + encodeURI(_buildCSV(_data.cache))
        });
        link.addClass('label label-default link-csv');
        link.html('CSV');
        return link;
    };

    var _linkJSON = function () {
        //console.log(_data.cache);
        var link = $('<a/>', {
            "target": "_blank",
            "title": "Re-use this data in your apps",
            "download": 'landportal-' + _options.lbid + '.json',
            "href": 'data:text/json;charset=utf-8,' + encodeURI(JSON.stringify(_data.cache))
        });
        link.addClass('label label-default link-json');
        link.html('JSON');
        return link;
    };

    var _linkSPARQL = function () {
        //console.log(_data.cache);
        var link = $('<a/>', {
            "target": "_blank",
            "title": "Direct query to our LOD endpoint, HTML table",
            "rel": "nofollow",
            //"download": 'landportal-' + _options.lbid + '.json',
            "href": _getQuery()
        });
        link.addClass('label label-default link-html');
        link.html('HTML');
        return link;
    };

    var _linkMetaJSON = function () {
        //console.log(_data.cache);
        var link = $('<a/>', {
            "target": "_blank",
            "rel": "nofollow",
            "download": 'landportal-' + _options.lbid + '.json',
            "href": 'data:text/json;charset=utf-8,' + encodeURI(JSON.stringify(_data.meta))
        });
        link.addClass('label label-default link-html');
        link.html('JSON');
        return link;
    };

    var _linkMetaCSV = function () {
        //console.log(_data.cache);
        var link = $('<a/>', {
            "target": "_blank",
            "rel": "nofollow",
            "download": 'landportal-' + _options.lbid + '.csv',
            "href": 'data:text/csv;charset=utf-8,' + encodeURI(_buildCSV(_data.meta))
        });
        link.addClass('label label-default link-html');
        link.html('CSV');
        return link;
    };

    var _buildLinks = function () {
        // DL
        var links = $('<div/>');
        links.append('<h3>Get all the data</h3>');
        links.append('<p>Choose your format:</p>');
        links.append(_linkCSV());
        links.append(' ');
        links.append(_linkJSON());
        links.append(' ');
        links.append(_linkSPARQL());
        return links;
        //return 'data not available';b
    };

    var _bindUI = function () {
        var $el = $(_options.target);
        //console.log($el);
        w = $el.find(_options.target + '-wrapper');
        w.append(_buildLinks());
        //console.log(_options);
        if (_options.type == 'dataset') {
            LBVIS.getIndicatorsInfo().done(function () {
                _getMetaQuery();
                var links = $('<div/>');
                links.append('<h3>Get the metadata</h3>');
                links.append('<p>All the information about this dataset and indicators</p>');
                links.append(_linkMetaCSV());
                links.append(' ');
                links.append(_linkMetaJSON());
                w.append(links);
            });
        }
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
