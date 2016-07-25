'use strict';

var lbvisDATA = (function (args = {}) {
    var ISO3 = args.iso3;
    var lod = {
        uri: {
            country: "http://data.landportal.info/geo/",
            indicator: "http://data.landportal.info/indicator/"
        }
    };
    var sparql = {
        prefix: args.prefix || 'http://landportal.info/sparql?default-graph-uri=&query=',
        suffix: args.suffix || '&should-sponge=&format=json&timeout=0&debug=on'
    };
    var query = {
	prefix: "PREFIX cex: <http://purl.org/weso/ontology/computex#> \
PREFIX time: <http://www.w3.org/2006/time#> \
PREFIX ex: <http://www.example.org/rdf#>",
        prefix_lgaf: "PREFIX cex: <http://purl.org/weso/ontology/computex#> \
PREFIX qb: <http://purl.org/linked-data/cube#>"
    };
    var _indicator_info = function (indicator_id) {
	return "PREFIX ex: <http://www.example.org/rdf#> \
SELECT ?indicatorLabel ?indicatorDescription ?indicatorUnit ?datasetURL ?datasetLabel ?sourceOrgURL ?sourceOrgLabel \
FROM <http://data.landportal.info> \
WHERE { \
<" + lod.uri.indicator + indicator_id + "> ex:label ?indicatorLabel ; \
ex:description ?indicatorDescription ; \
ex:unit ?indicatorUnit ; \
ex:dataset ?datasetURL . \
?datasetURL ex:label ?datasetLabel ; \
ex:org ?sourceOrgURL . \
?sourceOrgURL ex:label ?sourceOrgLabel. \
}";
    };

    var _countries_per_indicator = function (selected_indicator) {
        return query.prefix + " \
SELECT DISTINCT ?countryURL ?countryISO3 ?countryLabel \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-indicator <" + lod.uri.indicator + selected_indicator + "> ; \
cex:ref-area ?countryURL . \
?countryURL ex:label ?countryLabel. \
 BIND (REPLACE(STR(?countryURL),'http://data.landportal.info/geo/','') AS ?countryISO3) \
} ORDER BY ?countryLabel ";
    };

    // ELGAF
    var _lgaf_values = function (year) {
        return query.prefix_lgaf + " \
SELECT ?indicatorURL (STR(?value) AS ?value) \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-area <http://data.landportal.info/geo/" + ISO3 + "> ; \
qb:dataSet <http://data.landportal.info/dataset/WB-LGAF" + year + "> ; \
cex:ref-indicator ?indicatorURL ; \
cex:value ?value. \
} ORDER BY ?indicatorURL ";
    };

    var _getObs = function (indicator) {
        var str = "SELECT ?obs FROM <http://data.landportal.info> WHERE { ?obs cex:ref-area <" + lod.uri.country + ISO3 + "> ; cex:ref-indicator <"+ lod.uri.indicator + indicator +"> ; cex:ref-time ?time . ?time time:hasBeginning ?timeValue . ?timeValue time:inXSDDateTime ?dateTime } ORDER BY DESC(?dateTime) LIMIT 1";
        return str;
    };

    // Table
    // TODO cleanup , this is horrible + remove HARDCODED values ,
    // DO: loop through default args to generate the subselect!
    var _default_table_indicators = function (indicators) {
        return query.prefix + " \
SELECT ?obs ?indicator ?indicatorURL ?indicatorDescription (year(?dateTime) as ?year) ?value ?unit ?datasetURL ?dataset ?sourceOrgURL ?sourceOrg \
FROM <http://data.landportal.info> \
WHERE { \
 ?obs cex:ref-indicator ?indicatorURL ; cex:ref-time ?time ; cex:value ?value. \
 ?indicatorURL ex:label ?indicator ; ex:description ?indicatorDescription ; ex:unit ?unit ; ex:dataset ?datasetURL . \
 ?datasetURL ex:label ?dataset ; ex:org ?sourceOrgURL . \
 ?sourceOrgURL ex:label ?sourceOrg . \
 ?time time:hasBeginning ?timeValue . \
 ?timeValue time:inXSDDateTime ?dateTime \
{ \
SELECT ?obs FROM <http://data.landportal.info> WHERE { \
?obs cex:ref-area <" + lod.uri.country + ISO3 + "> ; cex:ref-indicator <http://data.landportal.info/indicator/WB-SP.POP.TOTL> ; cex:ref-time ?time . ?time time:hasBeginning ?timeValue . ?timeValue time:inXSDDateTime ?dateTime } \
ORDER BY DESC(?dateTime) LIMIT 1 \
} \
UNION \
{ \
SELECT ?obs \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
     cex:ref-indicator <http://data.landportal.info/indicator/WB-SP.RUR.TOTL.ZS> ; \
     cex:ref-time ?time . \
?time time:hasBeginning ?timeValue . \
?timeValue time:inXSDDateTime ?dateTime } \
ORDER BY DESC(?dateTime) \
LIMIT 1 \
} \
UNION \
{ \
SELECT ?obs \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
     cex:ref-indicator <http://data.landportal.info/indicator/WB-NY.GDP.PCAP.PP.KD> ; \
     cex:ref-time ?time . \
?time time:hasBeginning ?timeValue . \
?timeValue time:inXSDDateTime ?dateTime } \
ORDER BY DESC(?dateTime) \
LIMIT 1 \
} \
UNION \
{ \
SELECT ?obs \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
     cex:ref-indicator <http://data.landportal.info/indicator/FAO-6601-5110> ; \
     cex:ref-time ?time . \
?time time:hasBeginning ?timeValue . \
?timeValue time:inXSDDateTime ?dateTime } \
ORDER BY DESC(?dateTime) \
LIMIT 1 \
} \
UNION \
{ \
SELECT ?obs \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
     cex:ref-indicator <http://data.landportal.info/indicator/FAO-23045-6083> ; \
     cex:ref-time ?time . \
?time time:hasBeginning ?timeValue . \
?timeValue time:inXSDDateTime ?dateTime } \
ORDER BY DESC(?dateTime) \
LIMIT 1 \
} \
UNION \
{ \
SELECT ?obs \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
     cex:ref-indicator <http://data.landportal.info/indicator/DP-MOD-O-F> ; \
     cex:ref-time ?time . \
?time time:hasBeginning ?timeValue . \
?timeValue time:inXSDDateTime ?dateTime } \
ORDER BY DESC(?dateTime) \
LIMIT 1 \
} \
UNION \
{ \
SELECT ?obs \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
     cex:ref-indicator <http://data.landportal.info/indicator/DP-MOD-O-N> ; \
     cex:ref-time ?time . \
?time time:hasBeginning ?timeValue . \
?timeValue time:inXSDDateTime ?dateTime } \
ORDER BY DESC(?dateTime) \
LIMIT 1 \
} \
UNION \
{ \
SELECT ?obs \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
     cex:ref-indicator <http://data.landportal.info/indicator/FAO-LG.1FB> ; \
     cex:ref-time ?time . \
?time time:hasBeginning ?timeValue . \
?timeValue time:inXSDDateTime ?dateTime } \
ORDER BY DESC(?dateTime) \
LIMIT 1 \
} \
}";
    };

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

    var _years_indicator_country = function (indicator) {
        return query.prefix + " \
SELECT (year(?dateTime) as ?year) \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-area <" + lod.uri.country + ISO3 + "> ; \
     cex:ref-indicator <" +  lod.uri.indicator + indicator + "> ; \
     cex:ref-time ?time . \
?time time:hasBeginning ?timeValue . \
?timeValue time:inXSDDateTime ?dateTime \
} \
ORDER BY DESC(?dateTime)";
    };    

    var _line_chart = function (indicator, countries_iso3) {
        var sparql = query.prefix + " \
SELECT ?countryISO3 (year(?dateTime) as ?year) ?value \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-area ?countryURL ; \
     cex:ref-time ?time ; \
     cex:value ?value. \
     ?time time:hasBeginning ?timeValue . \
     ?timeValue time:inXSDDateTime ?dateTime . \
     BIND (REPLACE(STR(?countryURL),'http://data.landportal.info/geo/','') AS ?countryISO3) \
{ \
SELECT ?obs \
FROM <http://data.landportal.info> \
WHERE{ \
  ?obs cex:ref-indicator <" + lod.uri.indicator + indicator + "> . \
  ?obs cex:ref-area ?country . \
  VALUES ?country { \
   <" + lod.uri.country + ISO3 + ">";
        for(var i=0; i<countries_iso3.length; i++){
		sparql += " <" + lod.uri.country + countries_iso3[i] + ">";
	}
	return sparql + '} \
} \
} \
} ORDER BY ?dateTime ?countryURL';
    };

    var _map_chart =  function (indicator) {
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
BIND (REPLACE(STR(?countryURL), 'http://data.landportal.info/geo/','') AS ?countryISO3) \
} ORDER BY ?dateTime ?countryURL";
    };
    

    
    //
    // Public methods
    //
    return {
        lod: lod,
        sparqlURL: function (query) {
            return sparql.prefix + encodeURIComponent(query) + sparql.suffix;
        },
        // Queries that do not have 'dynamic' arguments
        queries: {
            countries_iso3: "PREFIX ex: <http://www.example.org/rdf#> \
SELECT ?countryURL ?countryISO3 ?countryLabel \
FROM <http://data.landportal.info> \
WHERE { \
  ?countryURL a <http://purl.org/weso/landbook/ontology#Country> ; \
  ex:label ?countryLabel . \
  BIND (REPLACE(STR(?countryURL), 'http://data.landportal.info/geo/','') AS ?countryISO3) \
} ORDER BY ?countryURL",

	    indicators: query.prefix + "\
SELECT * FROM <http://data.landportal.info> \
WHERE { \
 ?indicatorUrl a cex:Indicator ; \
 ex:label ?label ; \
 ex:description ?description . \
} ORDER BY ?label",

	    country_indicators: query.prefix + " \
SELECT DISTINCT ?indicatorURL ?indicatorLabel \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-indicator ?indicatorURL ; \
cex:ref-area <http://data.landportal.info/geo/"+ ISO3 +"> ; \
cex:value ?value. \
?indicatorURL ex:label ?indicatorLabel . \
} \
ORDER BY ?indicatorURL",

            // TODO remove HARDCODED VAR
            lgaf_country_years: query.prefix_lgaf + " \
SELECT DISTINCT ?dataset \
FROM <http://data.landportal.info> \
WHERE { \
?obs cex:ref-area <http://data.landportal.info/geo/" + ISO3 + "> ; \
qb:dataSet ?dataset. \
VALUES ?dataset {<http://data.landportal.info/dataset/WB-LGAF2013> <http://data.landportal.info/dataset/WB-LGAF2016>}\
}",
            // TODO remove HARDCODED VAR, make this query dynamic
	    pie_chart: query.prefix + " \
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
BIND ((xsd:double(xsd:float(?ArableLandHa)*100/xsd:float(?mainInd))) AS ?ArableLandPer) \
BIND ((xsd:double(xsd:float(?PermanentCropsHa)*100/xsd:float(?mainInd))) AS ?PermanentCropsPer) \
BIND ((xsd:double(xsd:float(?PermanentPasturesAndMedowsHa)*100/xsd:float(?mainInd))) AS ?PermanentPasturesAndMedowsPer) \
BIND ((xsd:double(xsd:float(?ForestLandHa)*100/xsd:float(?mainInd))) AS ?ForestLandPer) \
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
}",

	    spider_chart: query.prefix + " \
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
}"

            // End of 'static' query (aside of ISO3)
        },

        
        // Queries that require a parameters (or should)
        query_default_table_indicators: function (indicators) {
            return _default_table_indicators();
        },
        query_years_indicator_country: function (indicator) {
            return _years_indicator_country(indicator);
        },
        query_get_indicator_info: function (info) {
            return _indicator_info(info);
        },
        query_lgaf_values: function (year) {
            return _lgaf_values(year);
        },
        query_countries_per_indicator: function (indicator) {
            return _countries_per_indicator(indicator);
        },
        query_line_chart: function (line_selected_indicator_URL, current_compared_countries_iso3) {
            return _line_chart(line_selected_indicator_URL, current_compared_countries_iso3);
        },
        query_info_indicator_country_year: function (indicator, year) {
            return _info_indicator_country_year(indicator, year);
        },
        query_map_chart: function (map_selected_indicator_URL) {
            return _map_chart (map_selected_indicator_URL);
        }
    };
    
    function setDataURLs() {

    }

});
