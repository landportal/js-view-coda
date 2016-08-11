'use strict';

var lbvisDATA = (function (args = {}) {
    var ISO3 = args.iso3;
    var lod = {
        uri: {
            country: "http://data.landportal.info/geo/",
            indicator: "http://data.landportal.info/indicator/"
        },
        sparql: {
            prefix: args.prefix || '//landportal.info/sparql?default-graph-uri=&query=',
            suffix: args.suffix || '&should-sponge=&format=json&timeout=0&debug=on'
        }
    };
    var query = {
	prefix: "PREFIX ex: <http://www.example.org/rdf#> \
PREFIX cex: <http://purl.org/weso/ontology/computex#> \
PREFIX time: <http://www.w3.org/2006/time#> ",

        prefix_lgaf: "PREFIX cex: <http://purl.org/weso/ontology/computex#> \
PREFIX qb: <http://purl.org/linked-data/cube#>"
    };

    var _country = function () {
    };
    var _indicators = function () {
    };
    
    /* Indicators-based queries */
    var _indicatorInfo = function (indicator) {
	return "PREFIX ex: <http://www.example.org/rdf#> \
SELECT ?id ?uri ?label ?description ?unit ?datasetURL ?dataset ?sourceOrgURL ?sourceOrg \
FROM <http://data.landportal.info> \
WHERE { \
?uri ex:label ?label ; \
        ex:description ?description ; \
        ex:unit ?unit ; \
        ex:dataset ?datasetURL . \
?datasetURL ex:label ?dataset ; \
        ex:org ?sourceOrgURL . \
?sourceOrgURL ex:label ?sourceOrg . \
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
SELECT DISTINCT (year(?dateTime) as ?year) \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-indicator ?indicator ; \
     cex:ref-area ?country ; \
     cex:ref-time ?time . \
?time time:hasBeginning ?timeValue . \
?timeValue time:inXSDDateTime ?dateTime \
VALUES (" + filters.join(' ') + ") { ( "+values.join(' ') +" ) } \
} ORDER BY DESC(?dateTime)";
    };    
    // Get all indicator values (aka obs), optionally filter by year
    var _indicatorValues = function (indicator, year) {
        var filters = [ "?uri", "?id" ],
            values  = [ "<" + lod.uri.indicator + indicator + ">", "'"+ indicator +"'" ];
        if (year) {
            filters.push('?year');
            values.push("'" + year + "'");
        }
        return query.prefix + " \
SELECT ?iso3 ?year ?value \
FROM <http://data.landportal.info> \
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
} ORDER BY ?dateTime ?countryURL";
    };

    // Available countries for a given indicator
    var _indicatorCountries = function (indicator) {
        return query.prefix + " \
SELECT DISTINCT ?iso3 \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-indicator <" + lod.uri.indicator + indicator + "> ; \
cex:ref-area ?countryURL . \
?countryURL ex:label ?countryLabel. \
 BIND (REPLACE(STR(?countryURL),'" + lod.uri.country + "','') AS ?iso3) \
} ORDER BY ?countryLabel ";
    };




    
        var _indicator_values =  function (indicator) {
        return query.prefix + " \
SELECT ?countryISO3 (year(?dateTime) as ?year) ?value \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-indicator ?indicatorURL ; \
     cex:ref-area ?countryURL ; \
     cex:ref-time ?time ; \
     cex:value ?value. \
?time time:hasBeginning ?timeValue . \
?timeValue time:inXSDDateTime ?dateTime . \
VALUES ?indicatorURL {<" + lod.uri.indicator + indicator + ">} \
BIND (REPLACE(STR(?countryURL), '" + lod.uri.country + "','') AS ?countryISO3) \
} ORDER BY ?dateTime ?countryURL";
    };

    
    
    /* Countries-based queries */
    var _countryIndicators = function(iso3) {
	    return query.prefix + " SELECT DISTINCT ?id ?label \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-indicator ?uri ; \
 cex:ref-area <" + lod.uri.country + iso3 +"> ; \
 cex:value ?value . \
 ?uri ex:label ?label . \
 BIND (REPLACE(STR(?uri), '" + lod.uri.indicator + "','') AS ?id) \
} ORDER BY ?label";
    };


    
    // un-used
    var _getObs = function (indicator) {
        var str = "SELECT ?obs FROM <http://data.landportal.info> WHERE { ?obs cex:ref-area <" + lod.uri.country + ISO3 + "> ; cex:ref-indicator <" + lod.uri.indicator + indicator + "> ; cex:ref-time ?time . ?time time:hasBeginning ?timeValue . ?timeValue time:inXSDDateTime ?dateTime } ORDER BY DESC(?dateTime) LIMIT 1";
        return str;
    };


    // WTF, use indicatorInfo
    var _info_indicator_country_year = function (indicator, year) {
        return query.prefix + " \
SELECT ?indicator ?indicatorURL ?indicatorDescription ?value ?unit ?datasetURL ?dataset ?sourceOrgURL ?sourceOrg \
FROM <http://data.landportal.info> WHERE { \
 ?obs cex:ref-area <" + lod.uri.country + ISO3 + "> ; cex:ref-indicator ?indicatorURL ; cex:value ?value ; cex:ref-time ?time . \
 ?time time:hasBeginning ?timeValue . \
 ?timeValue time:inXSDDateTime '" + year + "-01-01T00:00:00Z'^^xsd:dateTime . \
 ?indicatorURL ex:unit ?unit ; ex:dataset ?datasetURL . \
 ?datasetURL ex:label ?dataset ; ex:org ?sourceOrgURL . \
 ?sourceOrgURL ex:label ?sourceOrg. \
 ?indicatorURL ex:label ?indicator ; ex:description ?indicatorDescription . \
VALUES ?indicatorURL {<" + lod.uri.indicator + indicator + ">} \
}";
    };


    var _line_chart = function (indicator, countries) {
        var str = query.prefix + " \
SELECT ?countryISO3 (year(?dateTime) as ?year) ?value \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-area ?countryURL ; \
     cex:ref-time ?time ; \
     cex:value ?value. \
     ?time time:hasBeginning ?timeValue . \
     ?timeValue time:inXSDDateTime ?dateTime . \
     BIND (REPLACE(STR(?countryURL),'" + lod.uri.country + "','') AS ?countryISO3) \
{ \
SELECT ?obs \
FROM <http://data.landportal.info> \
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

    // LGAF specific : move to vis. module?
    var _lgaf_country_years = function () {
        return query.prefix_lgaf + " \
SELECT DISTINCT ?dataset \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
qb:dataSet ?dataset. \
VALUES ?dataset {<http://data.landportal.info/dataset/WB-LGAF2013> <http://data.landportal.info/dataset/WB-LGAF2016>}\
}";
    };

    var _lgaf_values = function (year) {
        return query.prefix_lgaf + " \
SELECT ?indicatorURL (STR(?value) AS ?value) \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
qb:dataSet <http://data.landportal.info/dataset/WB-LGAF" + year + "> ; \
cex:ref-indicator ?indicatorURL ; \
cex:value ?value. \
} ORDER BY ?indicatorURL ";
    };

    // PIE : remove hardcoded vars, make computation dynamic
    var _pie_chart = function () {
        return query.prefix + " \
SELECT ?ArableLandPer ?PermanentCropsPer ?PermanentPasturesAndMedowsPer ?ForestLandPer ?mainInd ?other (year(?maxdateTime) as ?year) \
FROM <http://data.landportal.info> \
WHERE { \
?obs1 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6621-5110> ; \
     cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
     cex:value ?ArableLandHa ; \
     cex:ref-time ?time . \
?obs2 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6650-5110> ; \
     cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
     cex:value ?PermanentCropsHa ; \
     cex:ref-time ?time . \
?obs3 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6655-5110> ; \
     cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
     cex:value ?PermanentPasturesAndMedowsHa; \
     cex:ref-time ?time . \
?obs4 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6661-5110> ; \
     cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
     cex:value ?ForestLandHa; \
     cex:ref-time ?time . \
?obs5 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6601-5110> ; \
     cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
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
 SELECT DISTINCT max(?dateTime) as ?maxdateTime \
 FROM <http://data.landportal.info> \
 WHERE { \
  ?obs1 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6621-5110> ; \
     cex:ref-area <" + lod.uri.country + ISO3 + ">; \
     cex:ref-time ?time . \
  ?obs2 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6650-5110> ; \
     cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
     cex:ref-time ?time . \
  ?obs3 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6655-5110> ; \
     cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
     cex:ref-time ?time . \
  ?obs4 cex:ref-indicator <http://data.landportal.info/indicator/FAO-6661-5110> ; \
     cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
     cex:ref-time ?time . \
  ?time time:hasBeginning ?timeValue . \
  ?timeValue time:inXSDDateTime ?dateTime . \
 } \
} \
}";
    };

    // Spider : remove hardcoded vars, make computation dynamic
    var spider_chart = function() {
        return query.prefix + " \
SELECT  ?sigi ?sigiTo100 ?sigiYear ?gini ?giniTo100 ?giniYear ?hdi ?hdiTo100 ?hdiYear ?ghi ?ghiTo100 ?ghiYear \
FROM <http://data.landportal.info> \
WHERE { \
OPTIONAL{ \
SELECT ?sigi (year(?dateTime) as ?sigiYear) \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
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
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
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
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
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
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
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
        // Queries that do not have 'dynamic' arguments
        queries: {
            countries: "SELECT ?iso3 ?name FROM <http://data.landportal.info> \
WHERE { \
?uri a <http://purl.org/weso/landbook/ontology#Country> ; \
  <http://www.example.org/rdf#label> ?name . \
BIND (REPLACE(STR(?uri), '" + lod.uri.country + "','') AS ?iso3) \
} ORDER BY ?name",

	    indicators: query.prefix + " SELECT * FROM <http://data.landportal.info> \
WHERE { \
?uri a cex:Indicator ; \
  ex:label ?label ; \
  ex:description ?description . \
BIND (REPLACE(STR(?uri), '" + lod.uri.indicator + "','') AS ?id) \
} ORDER BY ?label",
            // List of available indicators for a given country
            countryIndicators: function (iso3) { return _countryIndicators(iso3); },

            indicatorInfo: function (id) { return _indicatorInfo(id); },
            indicatorYears: function (indicator, iso3) {
                return _indicatorYears(indicator, iso3);
            },
            indicatorValues: function(indicator, years) { return _indicatorValues(indicator, years); }
        },

        
        // Queries that require a parameters (or should)
        query_default_table_indicators: function (indicators) {
            return _default_table_indicators();
        },
        // TODO : cleanup / move away in specific vis. module
        query_lgaf_values: function (year) {
            return _lgaf_values(year);
        }

    };
    
    function setDataURLs() {

    }

});
