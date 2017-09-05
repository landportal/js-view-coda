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
SELECT ?id ?label ?dataset \
" + query.from + " \
WHERE { \
?uri a cex:Indicator ; \
  skos:notation ?id ; \
  rdfs:label ?label ; \
  dct:source ?datasetURL . \
?datasetURL skos:notation ?dataset . \
} ORDER BY ?label";
    };
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

    /**************************************
     * Indicators-based queries
     */
    var _indicatorInfo = function (indicator) {
        return query.prefix + " \
SELECT ?id ?uri ?label ?description ?unit ?indicatorSeeAlso ?datasetURL ?dataset ?datasetSeeAlso ?sourceURL ?source ?sourceSeeAlso \
" + query.from + " \
WHERE { \
?uri rdfs:label ?label ; \
        dct:description ?description ; \
        sdmx-attribute:unitMeasure ?unit ; \
        dct:source ?datasetURL ; \
		rdfs:seeAlso ?indicatorSeeAlso .\
?datasetURL rdfs:label ?dataset ; \
        dct:publisher ?sourceURL ; \
		rdfs:seeAlso ?datasetSeeAlso . \
?sourceURL rdfs:label ?source . \
BIND( ?sourceURL AS ?sourceSeeAlso ) \
VALUES (?uri ?id) { (<" + lod.uri.indicator + indicator + "> '" + indicator + "') } \
}";
    };

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
SELECT ?iso3 ?year ?period ?value \
" + query.from + " \
WHERE { \
?obs cex:ref-indicator ?uri ; \
     cex:ref-area ?countryURL ; \
     cex:ref-time ?time ; \
     cex:value ?value. \
?time time:hasBeginning ?timeValue . \
?timeValue time:inXSDDateTime ?dateTime . \
 VALUES (" + filters.join(' ') + ") { ( "+values.join(' ') +" ) } \
 BIND (REPLACE(STR(?countryURL), '" + lod.uri.country + "','') AS ?iso3) \
 BIND (year(?dateTime) AS ?year) \
 BIND (REPLACE(STR(?time), '" + lod.uri.time + "', '') AS ?period) \
} ORDER BY ?dateTime DESC(?value)";
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
    var _countryIndicators = function(iso3) {
        return query.prefix + " \
SELECT DISTINCT ?id ?label \
" + query.from + " \
WHERE { \
?obs cex:ref-indicator ?uri ; \
cex:ref-area <" + lod.uri.country + iso3 +"> ; \
cex:value ?value . \
?uri rdfs:label ?label . \
BIND (REPLACE(STR(?uri), '" + lod.uri.indicator + "','') AS ?id) \
} ORDER BY ?label";
    };

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
     *  Specific 'graph' queries
     */
    var _line_chart = function (indicator, countries) {
        var str = query.prefix + " \
SELECT ?countryISO3 (year(?dateTime) as ?year) ?value \
" + query.from + " \
WHERE { \
?obs cex:ref-area ?countryURL ; \
     cex:ref-time ?time ; \
     cex:value ?value. \
     ?time time:hasBeginning ?timeValue . \
     ?timeValue time:inXSDDateTime ?dateTime . \
BIND (REPLACE(STR(?countryURL),'" + lod.uri.country + "','') AS ?countryISO3) \
{ \
SELECT ?obs \
" + query.from + " \
WHERE{ \
  ?obs cex:ref-indicator <" + lod.uri.indicator + indicator + "> . \
  ?obs cex:ref-area ?country . \
  VALUES ?country {";
        countries.forEach(function (country) {
	    str += " <" + lod.uri.country + country + ">";
	});
        str += '} \
} \
} \
    } ORDER BY ?dateTime ?countryURL';
        return str;
    };



    /**************************************
     * TODO Cleanup all those queries
     * remove HARDCODED variables!
     */

    var _lgaf_chart = function (iso3, year) {
        return query.prefix + " \
SELECT ?id (STR(?value) AS ?value) \
" + query.from + " \
WHERE { \
?obs cex:ref-area <" + lod.uri.country + iso3 + "> ; \
qb:dataSet <http://data.landportal.info/dataset/WB-LGAF" + year + "> ; \
cex:ref-indicator ?uri ; \
cex:value ?value. \
BIND (REPLACE(STR(?uri), '" + lod.uri.indicator + "','') AS ?id) \
} ORDER BY ?uri ";
    };

    // PIE : remove hardcoded vars, make computation dynamic
    var _pie_chart = function (iso3) {
        return query.prefix + " \
SELECT ?ArableLandPer ?PermanentCropsPer ?PermanentPasturesAndMedowsPer ?ForestLandPer ?mainInd ?other (year(?maxdateTime) as ?year) \
" + query.from_data + " \
WHERE { \
?obs1 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6621-5110> ; \
     cex:ref-area ?countryURI ; \
     cex:value ?ArableLandHa ; \
     cex:ref-time ?time . \
?obs2 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6650-5110> ; \
     cex:ref-area ?countryURI ; \
     cex:value ?PermanentCropsHa ; \
     cex:ref-time ?time . \
?obs3 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6655-5110> ; \
     cex:ref-area ?countryURI ; \
     cex:value ?PermanentPasturesAndMedowsHa; \
     cex:ref-time ?time . \
?obs4 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6661-5110> ; \
     cex:ref-area ?countryURI ; \
     cex:value ?ForestLandHa; \
     cex:ref-time ?time . \
?obs5 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6601-5110> ; \
     cex:ref-area ?countryURI ; \
     cex:value ?mainInd; \
     cex:ref-time ?time . \
     ?time time:hasBeginning ?timeValue . \
     ?timeValue time:inXSDDateTime ?maxdateTime . \
BIND ((xsd:double(xsd:float(?ArableLandHa)                      *100/xsd:float(?mainInd))) AS ?ArableLandPer) \
BIND ((xsd:double(xsd:float(?PermanentCropsHa)                  *100/xsd:float(?mainInd))) AS ?PermanentCropsPer) \
BIND ((xsd:double(xsd:float(?PermanentPasturesAndMedowsHa)      *100/xsd:float(?mainInd))) AS ?PermanentPasturesAndMedowsPer) \
BIND ((xsd:double(xsd:float(?ForestLandHa)                      *100/xsd:float(?mainInd))) AS ?ForestLandPer) \
BIND ((100 - ?ArableLandPer  - ?PermanentCropsPer - ?PermanentPasturesAndMedowsPer - ?ForestLandPer) AS ?other) \
{ \
 SELECT DISTINCT (max(?dateTime) as ?maxdateTime) ?countryURI \
 " + query.from_data + " \
 WHERE { \
  ?obs1 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6621-5110> ; \
     cex:ref-area ?countryURI ; \
     cex:ref-time ?time . \
  ?obs2 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6650-5110> ; \
     cex:ref-area ?countryURI ; \
     cex:ref-time ?time . \
  ?obs3 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6655-5110> ; \
     cex:ref-area ?countryURI ; \
     cex:ref-time ?time . \
  ?obs4 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6661-5110> ; \
     cex:ref-area ?countryURI ; \
     cex:ref-time ?time . \
  ?obs5 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6601-5110> ; \
     cex:ref-area ?countryURI ; \
     cex:ref-time ?time . \
  ?time time:hasBeginning ?timeValue . \
  ?timeValue time:inXSDDateTime ?dateTime . \
  VALUES ?countryURI {<" + lod.uri.country + iso3 + ">} \
 } \
} \
}";
    };

    // Spider : remove hardcoded vars, make computation dynamic
    var _spider_chart = function(iso3) {
        return query.prefix + " \
SELECT  ?sigi ?sigiTo100 ?sigiYear ?gini ?giniTo100 ?giniYear ?hdi ?hdiTo100 ?hdiYear ?ghi ?ghiTo100 ?ghiYear \
" + query.from + " \
WHERE { \
OPTIONAL{ \
SELECT ?sigi (year(?dateTime) as ?sigiYear) \
" + query.from + " \
WHERE { \
?obs cex:ref-area <" + lod.uri.country + iso3 + "> ; \
     cex:ref-indicator <http://data.landportal.info/indicator/OECD-SIGI-0> ; \
     cex:ref-time ?time ; \
     cex:value ?sigi . \
     ?time time:hasBeginning ?timeValue . \
     ?timeValue time:inXSDDateTime ?dateTime . \
} ORDER BY DESC(?dateTime) \
  LIMIT 1 \
} \
OPTIONAL{ \
SELECT ?hdi (year(?dateTime) as ?hdiYear) \
" + query.from + " \
WHERE { \
?obs cex:ref-area <" + lod.uri.country + iso3 + "> ; \
     cex:ref-indicator <http://data.landportal.info/indicator/UNDP-HDI-INDEX> ; \
     cex:ref-time ?time ; \
     cex:value ?hdi . \
     ?time time:hasBeginning ?timeValue . \
     ?timeValue time:inXSDDateTime ?dateTime . \
} ORDER BY DESC(?dateTime) \
  LIMIT 1 \
} \
OPTIONAL{ \
SELECT ?gini (year(?dateTime) as ?giniYear) \
" + query.from + " \
WHERE { \
?obs cex:ref-area <" + lod.uri.country + iso3 + "> ; \
     cex:ref-indicator <http://data.landportal.info/indicator/WB-SI.POV.GINI> ; \
     cex:ref-time ?time ; \
     cex:value ?gini . \
     ?time time:hasBeginning ?timeValue . \
     ?timeValue time:inXSDDateTime ?dateTime . \
} ORDER BY DESC(?dateTime) \
  LIMIT 1 \
} \
OPTIONAL{ \
SELECT ?ghi (year(?dateTime) as ?ghiYear) \
" + query.from + " \
WHERE { \
?obs cex:ref-area <" + lod.uri.country + iso3 + "> ; \
     cex:ref-indicator <http://data.landportal.info/indicator/IFPRI-GHI> ; \
     cex:ref-time ?time ; \
     cex:value ?ghi . \
     ?time time:hasBeginning ?timeValue . \
     ?timeValue time:inXSDDateTime ?dateTime . \
} ORDER BY DESC(?dateTime) \
  LIMIT 1 \
} \
BIND ((xsd:float(100) - (?sigi)*100)  AS ?sigiTo100) . \
BIND ((xsd:float(100) - (?gini))  AS ?giniTo100) . \
BIND ((?hdi)*100 AS ?hdiTo100) . \
BIND ((xsd:float(100) - (?ghi))  AS ?ghiTo100) . \
    }";
    };

    
    /**************************************
     * Public methods
     */
    return {
        sparqlURL: function (query) {
            return lod.sparql.prefix + encodeURIComponent(query) + lod.sparql.suffix;
        },
        ns: query.prefix,
        // Queries that do not have 'dynamic' arguments
        queries: {
            countries:  _countries(),
            datasets:   _datasets(),
            indicators: _indicators(),

            // List of available indicators for a given country
            countryIndicators: function (iso3) { return _countryIndicators(iso3); },
            countryIndicatorValues: function (iso3, indicator, year) { return _countryIndicatorValues(iso3, indicator, year); },
            // Indicator queries
            indicatorInfo: function (id) { return _indicatorInfo(id); },
            indicatorYears: function (indicator, iso3) { return _indicatorYears(indicator, iso3); },
            indicatorValues: function(indicator, years) { return _indicatorValues(indicator, years); },
            indicatorDetails: function(indicator) { return _indicatorDetails(indicator); },
            indicatorCountries: function(indicator, countries) { return _indicatorCountries(indicator, countries); },
            // TODO: check/cleanup queries
            line_chart: function(indicator, countries) { return _line_chart(indicator, countries); },
            spider_chart: function(iso3) { return _spider_chart(iso3); },
            pie_chart: function(iso3) { return _pie_chart(iso3); },
            lgaf_chart: function(iso3, year) { return _lgaf_chart(iso3, year); }
        }
    };
});
