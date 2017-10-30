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
//BIND (REPLACE(STR(?uri), '" + lod.uri.indicator + "','') AS ?id) \

    /**************************************
     * Indicators-based queries
     */
//     var _indicatorInfo = function (indicator) {
//         return query.prefix + " \
// SELECT ?id ?uri ?label ?description ?unit ?indicatorSeeAlso ?datasetURL ?dataset ?datasetSeeAlso ?sourceURL ?source ?sourceSeeAlso \
// " + query.from + " \
// WHERE { \
// ?uri rdfs:label ?label ; \
//         dct:description ?description ; \
//         sdmx-attribute:unitMeasure ?unit ; \
//         dct:source ?datasetURL ; \
// 		rdfs:seeAlso ?indicatorSeeAlso .\
// ?datasetURL rdfs:label ?dataset ; \
//         dct:publisher ?sourceURL ; \
// 		rdfs:seeAlso ?datasetSeeAlso . \
// ?sourceURL rdfs:label ?source . \
// BIND( ?sourceURL AS ?sourceSeeAlso ) \
// VALUES (?uri ?id) { (<" + lod.uri.indicator + indicator + "> '" + indicator + "') } \
// }";
//     };

    // Available years for a given indicator, optionally filter by country
    var _indicatorYears = function (indicator, iso3) {
        var filters = [ "?indicator" ],
            values  = [ "<" + lod.uri.indicator + indicator + ">" ];
        if (iso3) {
            filters.push("?country");
            values.push("<" + lod.uri.country + iso3 + ">");
        }
        return query.prefix + " \
SELECT DISTINCT (year(?dateTime) as ?year) ?period \
" + query.from + " \
WHERE { \
?obs cex:ref-indicator ?indicator ; \
     cex:ref-area ?country ; \
     cex:ref-time ?time . \
?time time:hasBeginning ?timeValue . \
?timeValue time:inXSDDateTime ?dateTime \
VALUES (" + filters.join(' ') + ") { ( "+values.join(' ') +" ) } \
 BIND (REPLACE(STR(?time), '" + lod.uri.time + "', '') AS ?period) \
} ORDER BY DESC(?dateTime)";
    };    

    // Get all indicator values (aka obs), optionally filter by year
    var _indicatorValues = function (indicator, year) {
        var filters = [ "?uri", "?id" ],
            values  = [ "<" + lod.uri.indicator + indicator + ">", "'"+ indicator +"'" ];
        if (year) {
            filters.push('?time');
            values.push("<" + lod.uri.time + year + ">");
        }
        return query.prefix + " \
SELECT ?iso3 ?year ?period ?value ?note \
" + query.from_data + " \
WHERE { \
?obs cex:ref-indicator ?uri ; \
     cex:ref-area ?countryURL ; \
     cex:ref-time ?time ; \
     cex:value ?value. \
     OPTIONAL {?obs rdfs:comment ?note } \
?time time:hasBeginning ?timeValue . \
?timeValue time:inXSDDateTime ?dateTime . \
 VALUES (" + filters.join(' ') + ") { ( "+values.join(' ') +" ) } \
 BIND (REPLACE(STR(?countryURL), '" + lod.uri.country + "','') AS ?iso3) \
 BIND (year(?dateTime) AS ?year) \
 BIND (REPLACE(STR(?time), '" + lod.uri.time + "', '') AS ?period) \
} ORDER BY ?dateTime DESC(?value)";
    };

    // Get all dataset values (aka obs), optionally filter by year
    var _datasetValues = function (dataset, year) {
        var filters = [ "?datasetURL", "?id" ], // uri = indicatorURL
            values  = [ "<" + lod.uri.dataset + dataset + ">", "'"+ dataset +"'" ];
        if (year) {
            filters.push('?time');
            values.push("<" + lod.uri.time + year + ">");
        }
        return query.prefix + " \
SELECT ?uri ?iso3 ?year str(?value) as ?value str(?note) as ?note \
" + query.from_data + " \
WHERE { \
?obs cex:ref-indicator ?indicatorURL ; \
     cex:ref-area ?countryURL ; \
     qb:dataSet ?datasetURL ; \
     cex:ref-time ?time ; \
     cex:value ?value. \
     OPTIONAL {?obs rdfs:comment ?note } \
?time time:hasBeginning ?timeValue . \
?timeValue time:inXSDDateTime ?dateTime . \
 VALUES (" + filters.join(' ') + ") { ( "+values.join(' ') +" ) } \
 BIND (REPLACE(STR(?indicatorURL), '" + lod.uri.indicator + "','') AS ?indicator) \
 BIND (REPLACE(STR(?countryURL), '" + lod.uri.country + "','') AS ?iso3) \
 BIND (year(?dateTime) AS ?year) \
} ORDER BY ?indicator DESC(?year) ?iso3";
    };


    // Get an indicator details
    var _indicatorDetails = function (indicator) {
        var filters = [ "?uri", "?id" ],
            values  = [ "<" + lod.uri.indicator + indicator + ">", "'"+ indicator +"'" ];
        return query.prefix + " \
SELECT DISTINCT ?id ?indicator ?indicatorDescription ?indicatorSeeAlso ?minYear ?maxYear ?unit ?nObs ?nYears ?nCountryWithValue ?perMissingValue ?minValue ?maxValue ?dataset ?datasetSeeAlso ?source ?sourceSeeAlso \
" + query.from + " \
WHERE { \
?obs cex:ref-indicator ?indicatorURL . \
?uri rdfs:label ?indicator ; \
        sdmx-attribute:unitMeasure ?unit ; \
        dct:description ?indicatorDescription ; \
        dct:source ?datasetURL ; \
		rdfs:seeAlso ?indicatorSeeAlso .\
?datasetURL rdfs:label ?dataset ; \
        dct:publisher ?sourceURL ; \
		rdfs:seeAlso ?datasetSeeAlso . \
?sourceURL rdfs:label ?source . \
BIND( ?sourceURL AS ?sourceSeeAlso ) \
{ \
SELECT DISTINCT \
?uri \
year(min(?dateTime)) AS ?minYear \
year(max(?dateTime)) AS ?maxYear \
COUNT(?obs) AS ?nObs \
COUNT(DISTINCT(year(?dateTime))) AS ?nYears \
COUNT(DISTINCT ?country) AS ?nCountryWithValue \
min(?value) AS ?minValue \
max(?value) AS ?maxValue \
?id \
" + query.from + " \
WHERE{ \
?obs cex:ref-indicator ?uri  ; \
    cex:ref-area ?country ; \
    cex:value ?value; \
    cex:ref-time ?time . \
?time time:hasBeginning ?timeValue . \
    ?timeValue time:inXSDDateTime ?dateTime . \
VALUES (" + filters.join(' ') + ") { ( "+values.join(' ') +" ) } \
} \
} \
BIND ((1-((xsd:float(?nObs))/xsd:float((?nYears*?nCountryWithValue))))*100 AS ?perMissingValue) \
}";
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
     * Countries-based queries
     */

//     var _countryIndicators = function(iso3) {
//         return query.prefix + " \
// SELECT DISTINCT ?id ?label \
// " + query.from + " \
// WHERE { \
// ?obs cex:ref-indicator ?uri ; \
// cex:ref-area <" + lod.uri.country + iso3 +"> ; \
// cex:value ?value . \
// ?uri rdfs:label ?label . \
// BIND (REPLACE(STR(?uri), '" + lod.uri.indicator + "','') AS ?id) \
// } ORDER BY ?label";
//     };

    var _countryIndicatorValues = function (iso3, indicator, year) {
        var filters = [ "?country", "?indicatorURI", "?id" ],
            values  = [ "<" + lod.uri.country + iso3 + ">", "<" + lod.uri.indicator + indicator + ">", "'"+ indicator +"'" ];
        if (year) {
            filters.push('?year');
            values.push("'" + year + "'");
        }
        return query.prefix + " \
SELECT ?id ?indicator ?indicatorURI ?indicatorSeeAlso ?indicatorDescription ?year ?value ?unit ?datasetURL ?dataset ?datasetSeeAlso ?sourceURL ?source ?sourceSeeAlso \
" + query.from + " \
WHERE { \
?obs cex:ref-area ?country ; cex:ref-indicator ?indicatorURI ; cex:value ?value ; cex:ref-time ?time . \
?time time:hasBeginning ?timeValue . \
?timeValue time:inXSDDateTime ?dateTime . \
?indicatorURI sdmx-attribute:unitMeasure ?unit ; dct:source ?datasetURL . \
?datasetURL rdfs:label ?dataset ; dct:publisher ?sourceURL ; rdfs:seeAlso ?datasetSeeAlso. \
?sourceURL rdfs:label ?source . \
?indicatorURI rdfs:label ?indicator ; dct:description ?indicatorDescription ; rdfs:seeAlso ?indicatorSeeAlso. \
BIND( ?sourceURL AS ?sourceSeeAlso ) \
BIND (STR(YEAR(?dateTime)) AS ?year) \
VALUES (" + filters.join(' ') + ") { ( "+values.join(' ') +" ) } \
} ORDER BY DESC(?time) LIMIT 1";
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
            countryIndicatorValues: function (iso3, indicator, year) { return _countryIndicatorValues(iso3, indicator, year); },
            // Indicator queries
            //indicatorInfo: function (id) { return _indicatorInfo(id); },
            indicatorYears: function (indicator, iso3) { return _indicatorYears(indicator, iso3); },
            indicatorValues: function(indicator, years) { return _indicatorValues(indicator, years); },
            indicatorDetails: function(indicator) { return _indicatorDetails(indicator); },
            indicatorCountries: function(indicator) { return _indicatorCountries(indicator); },
            datasetValues: function(dataset, years) { return _datasetValues(dataset, years); },
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
