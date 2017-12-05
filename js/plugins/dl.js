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
    };
    $.extend(_options, args);
    // Internal cache
    var _data = {
        cache: {},
        meta: {},
    };

    var _getMetaQuery = function () {
        var inds = _data.cache.map(i => i.indicator).filter(function(ind, i, arr) {
            return arr.indexOf(ind) == i;
        });
        //console.log(_data.cache, inds);
        inds.forEach(function (id) {
            _data.meta[id] = $.extend(
                true,
                LBVIS.cache('indicators').find(i => i.id == id),
                LBVIS.cache('indicatorsInfo').find(i => i.id == id));
        });
    };

    var _getQuery = function () {
        var q = null;
        if (_options.type == 'dataset') {
            //q = LBV.DATA.lod.sparql.prefix +
            q = LBVIS.DATA.queries.datasetData(_options.lbid);
        } else {
            // more generic query (works only on Computex-based data)
            q = LBVIS.DATA.obsValues(['indicator', 'country', 'time', 'value'], { indicator: [_options.lbid] });
        }
        q = LBVIS.DATA.sparqlURL(q);
        q = q.replace('format=json', 'format=html');
        //console.log(q);
        return q;
    };

    var _getData = function () {
        var defer;
        if (_options.type == 'indicator') {
            defer = LBVIS.loadData([_options.lbid]).done(function() {
                _data.cache = LBVIS.cache('data')[_options.lbid];
            });
        } else if (_options.type == 'dataset') {
            defer = LBVIS.loadDataset([_options.lbid]).done(function() {
                _data.cache = LBVIS.cache('dataset')[_options.lbid];
            });
        }
        return defer;
    };

    // Quick 'n dirty CSV formater
    var _buildCSV = function(data) {
        var csv = [];
        var first = null; // used to set header, based on 1st row obj keys
        if (_options.type == 'indicator') {
            // work by year + iso3
            Object.keys(data).forEach(function (y) {
                Object.keys(data[y]).forEach(function (c) {
                    if (!first) {
                        first = Object.keys(data[y][c]);
                        csv.push(first);
                    }
                    csv.push(Object.values(data[y][c]));
                });
            });
        } else {
            Object.values(data).forEach(function (row) {
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
        console.log(_options);
        if (_options.type == 'dataset') {
            console.log('gogo dataset');
            console.log(this);
            LBVIS.getIndicatorsInfo().done(function () {
                _getMetaQuery();
                var links = $('<div/>');
                links.append('<h3>Get the meta data</h3>');
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
