'use strict';

var lbvisDATA = (function (args) {
    //var ISO3 = args.iso3;
    var lod = {
        uri: {
            time:       "http://data.landportal.info/time/",
            country:    "http://data.landportal.info/geo/",
            indicator:  "http://data.landportal.info/indicator/",
            dataset:    "http://data.landportal.info/dataset/"
        },
        sparql: {
            prefix: args.prefix || '//landportal.info/sparql?query=',
            suffix: args.suffix || '&should-sponge=&timeout=0&debug=on&format=json'
        }
    };
    var query = {
	prefix: " \
PREFIX cex: <http://purl.org/weso/ontology/computex#> \
PREFIX time: <http://www.w3.org/2006/time#> \
PREFIX qb: <http://purl.org/linked-data/cube#> \
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
PREFIX dct: <http://purl.org/dc/terms/> \
PREFIX sdmx-attribute: <http://purl.org/linked-data/sdmx/2009/attribute#> \
",
        from : " \
FROM <http://data.landportal.info> \
FROM <http://countries.landportal.info> \
FROM <http://datasets.landportal.info> \
FROM <http://indicators.landportal.info> \
FROM <http://organizations.landportal.info> \
",
        from_data : " \
FROM <http://data.landportal.info> \
"
    };



    /**************************************
     * Generic / basic queries
     */
    var _datasets = function () {
        return query.prefix + " \
PREFIX skos: <http://www.w3.org/2004/02/skos/core#> \
SELECT DISTINCT ?id ?label \
" + query.from + " \
WHERE { \
?dataset a qb:DataSet ; \
  skos:notation ?id ; \
  rdfs:label ?label . \
} ORDER BY ?label";
    };
    var _countries = function () {
        return query.prefix + " \
SELECT ?iso3 ?name \
" + query.from + " \
WHERE { \
?uri a <http://purl.org/weso/landbook/ontology#Country> ; \
  rdfs:label ?name . \
BIND (REPLACE(STR(?uri), '" + lod.uri.country + "','') AS ?iso3) \
} ORDER BY ?name";
    };


    var _indicators = function () {
        return query.prefix + " \
SELECT ?id ?label ?dataset ?unit ?description ?indicatorSeeAlso \
" + query.from + " \
WHERE { \
?uri a cex:Indicator ; \
  skos:notation ?id ; \
  rdfs:label ?label ; \
  dct:description ?description ; \
  sdmx-attribute:unitMeasure ?unit ; \
  dct:source ?datasetURL ; \
  rdfs:seeAlso ?indicatorSeeAlso .\
?datasetURL skos:notation ?dataset . \
} ORDER BY ?label";
    };

    var _countryIndicators = function(iso3) {
        return query.prefix + " \
SELECT DISTINCT ?id ?label ?dataset ?unit ?description ?indicatorSeeAlso \
" + query.from + " \
WHERE { \
?obs cex:ref-indicator ?uri ; \
  cex:ref-area <" + lod.uri.country + iso3 +"> ; \
  cex:value ?value . \
?uri a cex:Indicator ; \
  skos:notation ?id ; \
  rdfs:label ?label ; \
  dct:description ?description ; \
  sdmx-attribute:unitMeasure ?unit ; \
  dct:source ?datasetURL ; \
  rdfs:seeAlso ?indicatorSeeAlso .\
?datasetURL skos:notation ?dataset . \
} ORDER BY ?label";
    };

    // Available countries for a given indicator
    var _indicatorCountries = function (indicator) {
        return query.prefix + " \
SELECT DISTINCT ?iso3 ?name \
" + query.from + " \
WHERE { \
?obs cex:ref-indicator <" + lod.uri.indicator + indicator + "> ; \
cex:ref-area ?countryURL . \
?countryURL rdfs:label ?name. \
BIND (REPLACE(STR(?countryURL),'" + lod.uri.country + "','') AS ?iso3) \
} ORDER BY ?name ";
    };



    /**************************************
     * Public methods
     */
    return {
        sparqlURL: function (query) {
            return lod.sparql.prefix + encodeURIComponent(query) + lod.sparql.suffix;
        },
        lod: lod,
        query: query,
        // Queries that do not have 'dynamic' arguments
        queries: {
            countries:  _countries(),
            datasets:   _datasets(),
            indicators: _indicators(),
            // List of available indicators for a given country
            countryIndicators: function (iso3) { return _countryIndicators(iso3); },
            // List of available countries for a given indicator
            indicatorCountries: function(indicator) { return _indicatorCountries(indicator); },
        },

        //
        // NEW query method for Computex-based indicators
        //
        obsValues: function (columns, where) {
            //console.log('===', columns, where, '===');
            // Try to build a generic query, might get ugly
            var crit = {};
            var values = [];
            var bind = [];
            // Build up the VALUES conditions (WHERE)
            $.each(where, function(c, v) {
                //console.log(c, v);
                var prefix = lod.uri[c] || '';
                if ($.inArray(c, columns) != -1) c = 'b'+c; // for BIND
                values.push("VALUES ?" + c + ' { <' + prefix + v.join('> <' + prefix) + '> }');
            });
            //console.log('VALUES', values);

            var dirtyObsMapping = {
                indicator: 'cex:ref-indicator',
                country: 'cex:ref-area',
                value:   'cex:value',
                time:   'cex:ref-time',
            };
            // 'main' obs (cex: indicator)
            var obs = [];
            columns.forEach(function(c, i) {
                var prefix = lod.uri[c];
                if (prefix) {
                    obs.push(dirtyObsMapping[c] + ' ?b' + c);
                    bind.push("BIND (REPLACE(STR(?b" + c + "), '"+prefix+"', '') AS ?" + c + ")");
                    // if (c == 'time') {
                    //     // do something fuckedup
                    //     obs.push('?time time:hasBeginning ?timeValue . ?timeValue time:inXSDDateTime ?dateTime . ');
                    //     bind.push("BIND (REPLACE(STR(?b" + c + "), '"+prefix+"', '') AS ?" + c + ")");
                    // }
                } else {
                    obs.push(dirtyObsMapping[c] + ' ?' + c);
                }
            });

            var q = " SELECT ?" + columns.join(' ?')
                + query.from_data
                + " WHERE { ?obs " + obs.join('; ') + " . "
                + " " + values.join(' ')
                + " " + bind.join(' ')
                + " } ORDER BY ?time";
            // DEBUG
            //console.log(q);
            return query.prefix + q; // sparqlURL(query);
        }
    };
});
