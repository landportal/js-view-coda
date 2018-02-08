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
        graphs: {
            data:               'http://data.landportal.info',
            countries:          'http://countries.landportal.info',
            indicators:         'http://indicators.landportal.info',
            datasets:           'http://datasets.landportal.info',
            organizations:      'http://organizations.landportal.info',
            // data:               'http://data.landportal.info/lod',
            // countries:          'http://data.landportal.info/lod/countries',
            // indicators:         'http://data.landportal.info/lod/indicators',
            // datasets:           'http://data.landportal.info/lod/datasets',
            // organizations:      'http://data.landportal.info/lod/organizations',
        },
    };

    var _from = function (graphs) {
        return ' FROM <' + graphs.join('> FROM <') + '>' ;
    };

    /**************************************
     * Generic / basic queries
     */
    var _datasets = function () {
        return query.prefix + " \
PREFIX skos: <http://www.w3.org/2004/02/skos/core#> \
SELECT DISTINCT ?id ?label ?source \
" + _from([query.graphs.datasets, query.graphs.organizations]) + " \
WHERE { \
?dataset a qb:DataSet ; \
  skos:notation ?id ; \
  rdfs:label ?label ; \
  dct:publisher ?pubURI . \
?pubURI rdfs:label ?source . \
} ORDER BY ?label";
    };
    var _countries = function () {
        return query.prefix + " \
SELECT ?iso3 ?name \
" + _from([query.graphs.countries]) + " \
WHERE { \
?uri a <http://purl.org/weso/landbook/ontology#Country> ; \
  rdfs:label ?name . \
BIND (REPLACE(STR(?uri), '" + lod.uri.country + "','') AS ?iso3) \
} ORDER BY ?name";
    };


    var _indicators = function () {
        return query.prefix + " \
SELECT ?id ?label ?dataset ?unit ?description ?indicatorSeeAlso \
" + _from([query.graphs.indicators, query.graphs.datasets]) + " \
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
" + _from([query.graphs.data,
           query.graphs.indicators,
           query.graphs.datasets,
           query.graphs.countries]) + " \
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
" + _from([query.graphs.data, query.graphs.countries]) + " \
WHERE { \
?obs cex:ref-indicator <" + lod.uri.indicator + indicator + "> ; \
cex:ref-area ?countryURL . \
?countryURL rdfs:label ?name. \
BIND (REPLACE(STR(?countryURL),'" + lod.uri.country + "','') AS ?iso3) \
} ORDER BY ?name ";
    };

    var _indicatorsInfo = function () {
        return query.prefix + " \
SELECT DISTINCT ?id \
year(min(?dateTime)) AS ?minYear \
year(max(?dateTime)) AS ?maxYear \
COUNT(?obs) AS ?nObs \
COUNT(DISTINCT(year(?dateTime))) AS ?nYears \
COUNT(DISTINCT ?country) AS ?nCountryWithValue \
min(?value) AS ?minValue \
max(?value) AS ?maxValue \
" + _from([query.graphs.data]) + " \
WHERE{ \
\
?obs cex:ref-indicator ?indicatorURL  ; \
cex:ref-area ?country ; \
cex:value ?value; \
cex:ref-time ?time . \
\
?time time:hasBeginning ?timeValue . \
?timeValue time:inXSDDateTime ?dateTime . \
FILTER(?value != 'N/A'^^<http://www.w3.org/2001/XMLSchema#string>) \
BIND (REPLACE(STR(?indicatorURL), '" + lod.uri.indicator + "','') AS ?id) \
}";
    };

    // Download a dataset data
    var _datasetData = function (datasetID) {
        return query.prefix + " \
SELECT DISTINCT ?indicatorID (str(?indicatorLabel) as ?indicatorLabel) ?country_iso3 (str(?countryLabel) as ?countryLabel) (year(?dateTime) as ?year) ?value (str(?note) as ?note) \
" + _from([query.graphs.data]) + " \
" + _from([query.graphs.countries]) + " \
" + _from([query.graphs.indicators]) + " \
WHERE { \
?obs cex:ref-indicator ?indicatorURI ; \
cex:ref-area ?country ; \
cex:ref-time ?time ; \
cex:value ?rawValue ; \
qb:dataSet ?dataset. \
?time time:hasBeginning ?timeValue . \
?timeValue time:inXSDDateTime ?dateTime . \
?country rdfs:label ?countryLabel .\
?indicatorURI rdfs:label ?indicatorLabel .\
OPTIONAL{ ?obs rdfs:comment ?note} \
VALUES ?dataset {<" + lod.uri.dataset + datasetID + ">} \
BIND (REPLACE(STR(?country),'" + lod.uri.country + "','') AS ?country_iso3) \
BIND (REPLACE(STR(?indicatorURI), '" + lod.uri.indicator + "','') AS ?indicatorID) \
BIND(if(datatype(?rawValue)=xsd:string, str(?rawValue), ?rawValue) as ?value) \
} ORDER BY ?indicatorID ?year ?country_iso3";
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
            indicatorsInfo: _indicatorsInfo(),
            datasetData: function(x) { return _datasetData(x); },
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
                + " FROM <" + query.graphs.data + ">"
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
