'use strict';
var lbvisVGGT = (function (LBV, args) {
    var LBVIS = LBV;
	var groupLabels = [{
		"id": "NKT-VGGT16-1",
		"label": "VGGT 16.1 Expropriation and Compensation Eligibility Indicators"
	}, {
		"id": "NKT-VGGT16-3",
		"label": "VGGT 16.3 Fair Valuation and Prompt Compensation Indicators"
	},{
		"id": "NKT-VGGT16-8",
		"label": "VGGT 16.8 Resettlement Process Indicators"
	},{
		"id": "NKT-VGGT16-9",
		"label": "VGGT 16.9 Resettlement and Rehabilitation Indicators"
	},{
		"id": "NKT-VGGT16-2",
		"label": "VGGT 16.2 Transparent, participatory and sensitiviness in expropiation Indicators"
	},{
		"id": "NKT-VGGT16-5",
		"label": "VGGT 16.5 First opportunity to re-acquire Indicators"
	}
	]

    var _options = {
        iso3: args.iso3,
        year: args.year          || '2016',
        target: args.target             || '#vggt',
        targetGraph: args.targetGraph   || (args.target ? args.target + '-wrapper' : '#vggt-wrapper'),
        panel: args.panel        || 'NKT-VGGT16-1',
        subpanel: args.indicator || 'NKT-VGGT16-1A',
        //jsonPath: args.jsonPath  || window.location.href.split('/').slice(0, -1).join('/') + '/json'

    };
    var _defer = null;
    var _data = {
        years: ['2016'],  // Until we can get proper struct/info from the LOD...
        panels: { 2016: [] },
        series: []  // Series / values
    };

    function _getLaws() {
        var vg = VGGT_laws.find(function(l) { return l.iso3 == _options.iso3 });
        if (typeof vg === "undefined") {
            _data.laws = [];
        } else {
            _data.laws = vg.laws;
        }
    }
    function _getGroupLabel(id){
	return groupLabels.find(item => { return item.id == id	}).label
    }
    function _getStruct() {
        LBVIS.cache('indicators').forEach(function (item) {
            if (item.id.startsWith('NKT-VGGT')) {
                var id = item.id.substr(0, 12);
                var panel = _data.panels[2016].find(function (i) { return i.id == id; });
                if (!panel) {
                    // Init panel staticly
                    // TODO : FIX once we have proper data struct
                    var l = _data.panels[2016].push({
                        id: id,
                        year: 2016,
                        label: _getGroupLabel(id),
                        subpanels: []
                    });
                    panel = _data.panels[2016][l -1];
                    
                }
                panel.subpanels.push(item);
            }
        });
        //console.log(_data.panels);
        _data.panels[2016].sort(function(a,b) {return (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0);})
    }

    function _getValues() {
        var query = LBVIS.DATA.query.prefix + "SELECT ?id ?year (STR(?value) AS ?value) (STR(?comment) as ?comment) \
FROM <http://data.landportal.info> \
FROM <http://countries.landportal.info> \
FROM <http://datasets.landportal.info> \
FROM <http://indicators.landportal.info> \
FROM <http://organizations.landportal.info> \
WHERE { \
    ?obs qb:dataSet <http://data.landportal.info/dataset/NKT-VGGT16> ; \
		cex:ref-indicator ?indicatorURL ; \
		cex:ref-area ?countryURL ; \
		cex:ref-time ?year ; \
		cex:value ?value . \
		OPTIONAL { ?obs rdfs:comment ?comment } \
	?indicatorURL skos:notation ?id ; \
				  rdfs:label ?indicatorLabel ; \
				  dct:description ?indicatorDescription . \
	VALUES ?countryURL {<http://data.landportal.info/geo/" + _options.iso3 + ">} \
} ORDER BY ?indicatorURL ?countryURL";
        var query_url = LBVIS.DATA.sparqlURL(query);
        _defer = $.getJSON(query_url, function (data) {
            data.results.bindings.forEach(function (item) {
                var i = {};
                Object.keys(item).forEach(function (prop) { i[prop] = item[prop].value; });
                _data.series.push(i);
            });
        });
        return _defer;
    }

    /* Build UI elements */
    function setOptionsYears() {
        var str = '<option data-localize="inputs.years">Select year...</option>';
        _data.years.forEach(function (y) {
            var selected = (_options.year == y ? ' selected="selected"' : '');
            str += '<option value="' + y + '"' + selected + '>' + y + '</option>';
        });
        $(_options.target + ' select[name="year"]').prop( "disabled", (str ? false : true));
        $(_options.target + ' select[name="year"]').html(str);
    }
    function setOptionsPanels() {
        var str = '<option data-localize="inputs.panels">Select a group of indicators...</option>';
        _data.panels[_options.year].forEach(function (item) {
            var selected = (_options.panel == item.id ? ' selected="selected"' : '');
            str += '<option value="' + item.id + '"'+selected+'>' + item.label + '</option>';
        });
        $(_options.target + ' select[name="panel"]').prop( "disabled", (str ? false : true));
        $(_options.target + ' select[name="panel"]').html(str);
    }
    function setOptionsSubpanels() {
        var str = '<option data-localize="inputs.subpanels">Select an indicator...</option>';
        var panel = _data.panels[_options.year].filter(function(p) {
            return (p.id == _options.panel ? p : null);
        })[0];
        if (panel) {
            panel.subpanels.forEach(function (item) {
                var selected = (_options.subpanel == item.id ? ' selected="selected"' : '');
                str += '<option value="' + item.id + '"'+selected+'>' + item.label + '</option>';
            });
        }
        $(_options.target + ' select[name="subpanel"]').prop( "disabled", (str ? false : true));
        $(_options.target + ' select[name="subpanel"]').html(str);
    }

    function updateInfo() {
            // SUCCESS
        var subpanel = _data.panels[_options.year]
                .filter(function (p) { return p.id == _options.panel; })[0]
                .subpanels.filter(function(s) { return s.id == _options.subpanel; })[0];
        //console.log('got values ', subpanel);
        // fill up some shit
        //return LBVIS.getIndicator(subpanel.id).done(function () {
        var indi = _data.series.filter(function (s) {
            return s.id == _options.subpanel;// && s.year == _options.year;
        });
        if (!indi.length) {
            indi.push({value: 'na'});
        }

        // Display panels
        _data.indicator = LBVIS.cache('indicators').find(i => i.id == subpanel.id);
        var panelVal = '<span class="value-'+indi[0].value.toLocaleLowerCase()+'"></span>'
            + _data.indicator.render;
        $(_options.targetGraph + ' .panelVal').html(panelVal);
        if (indi[0].comment)
            $(_options.targetGraph + ' .panelInfo').html(indi[0].comment);
        //$(_options.targetGraph).html('hello VGGT');
    }
    
    function _bindUI () {
        $(_options.target).delegate("select", "change", function(e) {
            // there isn't really anything to 'prevent' here, this is a select...
            e.preventDefault();
            if (e.target.name == 'year') {
                _options.year = e.target.value;
                _options.panel = null;
                _options.subpanel = null;
            }
            if (e.target.name == 'panel') {
                _options.panel = e.target.value;
                _options.subpanel = null;
                setOptionsSubpanels();
            }
            if (e.target.name == 'subpanel') {
                _options.subpanel = e.target.value;
                updateInfo();
            }
            //console.log('EVENT ' + e.target.name + ' = '+e.target.value);
            //$(_options.target + " .quality-list").html('<li class="item-q fos r-pos txt-c c-g40">Please, select year and panels to show the info.</li>');
        });
    }

    return {
        debug: function () {
            console.log(_options, _data);
        },
        init: function () {
            // Load indicators
            _getLaws();
            $(_options.targetGraph + ' .countryInfo').empty();
	    var law_list = $('<ul/>').appendTo(_options.targetGraph + ' .countryInfo');
	    $.each(_data.laws, function( index, law ) {
		if ("link" in law) {
		    law_list.append('<li><a href="'+law['link']+'">'+law['title']+'</a></li>');
		} else {
		    law_list.append('<li>'+law['title']+'</li>');
		}
	    });
            
            _getStruct();//.done(function () {
            setOptionsYears();
            if (_options.year) {
                setOptionsPanels();
                if (_options.panel) {
                //     // Load values & set panels
                    _getValues().done(function () {
                        setOptionsSubpanels();
                        if (_options.subpanel)
                            updateInfo();
                    });
                }
            }
            _bindUI();
        }
    };
});


var VGGT_laws = [
    {
        "country": "Angola", 
        "iso3": "AGO", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject992/constitution-angola-2010", 
                "title": "Government of Angola. 2010. Constitution."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-act-no-904", 
                "title": "Government of Angola. 2004. Land Act No. 9/04."
            }, 
            {
                "link": "http://landportal.org/library/resources/government-angola-decree-no-5807-approving-general-regulation-land-concession", 
                "title": "Government of Angola. 2007. Decree No. 58/07 approving the General Regulation for Land Concession."
            }, 
            {
                "link": "http://landportal.org/library/resources/decree-regarding-resettlement-displaced-people-0", 
                "title": "Government of Angola. 2001. Decree Regarding Resettlement of Displaced People."
            }, 
            {
                "link": "http://landportal.org/library/resources/strengthening-land-tenure-and-property-rights-angola", 
                "title": "United States Agency for International Development (USAID). 2008. Strengthening Land Tenure and Property Rights in Angola: Land Law and Policy: Review of Legal Framework."
            }
        ]
    }, 
    {
        "country": "Afghanistan", 
        "iso3": "AFG", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject831/constitution-afghanistan-2004", 
                "title": "Government of Afghanistan. 2004. Constitution of Afghanistan."
            }, 
            {
                "link": "http://landportal.org/library/resources/law-land-expropriation", 
                "title": "Government of Afghanistan. 2000. Law on Land Expropriation (Amended 2005)."
            }, 
            {
                "link": "http://landportal.org/library/resources/presidential-decree-islamic-republic-afghanistan-concerning-modification-series", 
                "title": "Government of Afghanistan. 2005. Presidential Decree of the Islamic Republic of Afghanistan Concerning Modification of a Series of Articles of the Land Expropriation Law published in the official gazette # (794),1421 L.H."
            }, 
            {
                "link": "http://landportal.org/library/resources/law-managing-land-affairs", 
                "title": "Government of Afghanistan. 2008. Law on Managing Land Affairs."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-management-law-islamic-republic-afghanistan", 
                "title": "Government of Afghanistan. 2000. Land Management Law."
            }, 
            {
                "link": "http://landportal.org/library/resources/decree-83-president-transitional-islamic-state-afghanistan-immovable-property-land", 
                "title": "Government of Afghanistan. 2003. Decree of the President No. 83."
            }, 
            {
                "link": "http://landportal.org/library/resources/law-pasture-and-grazing-land", 
                "title": "Government of Afghanistan. 2000. Law and Pasture and Grazing Land."
            }, 
            {
                "link": "http://landportal.org/library/resources/law-land-survey-verification-and-registration", 
                "title": "Government of Afghanistan. 1976. Law of land survey, verification and registration."
            }, 
            {
                "link": "http://landportal.org/library/resources/irrigation-restoration-and-development-project-resettlement-policy-framework", 
                "title": "Afghanistan Ministry of Mineral and Water. 2010. Irrigation Restoration and Development Project Resettlement Policy Framework."
            },
            {
                "link": "http://landportal.org/library/resources/law-land-acquisition-2017",
                "title": "Government of Afghanistan. June 2017. Law on Land Acquisition"
            }
        ]
    }, 
    {
        "country": "Argentina", 
        "iso3": "ARG", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/ley-no-21499-nacional-de-expropiacionesm", 
                "title": "Government of Argentina. 1977 Ley No. 21.499 Nacional de Expropiaciones."
            }, 
            {
                "link": "http://landportal.org/library/resources/constituteproject306/constitution-argentina-1853-reinst-1983-rev-1994", 
                "title": "Government of Argentina. 1853 (Revised 1994). Constitution of Argentina."
            }
        ]
    }, 
    {
        "country": "Bangladesh", 
        "iso3": "BGD", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject871/constitution-bangladesh-1972-reinst-1986-rev-2014", 
                "title": "Government of Bangladesh. 1972. Constitution of Bangladesh (Amended 2011)."
            }, 
            {
                "link": "http://landportal.org/library/resources/acquisition-and-requisition-immovable-property-ordinance", 
                "title": "Government of Bangladesh. 1982. The Acquisition and Requisition of Immovable Property Ordinance."
            }, 
            {
                "link": "http://landportal.org/library/resources/acquisition-waste-land-act", 
                "title": "Government of Bangladesh. 1950. Acquisition of Waste Land Act."
            }, 
            {
                "link": "http://landportal.org/library/resources/usaid-country-profile-property-rights-and-resource-governance-bangladesh", 
                "title": "USAID. 2010. Property Rights and Resource Governance: Bangladesh."
            }, 
            {
                "link": "http://landportal.org/library/resources/development-project-land-acquisition-and-resettlement-bangladesh-quest-well", 
                "title": "Atahar, S. 2013. Development Project, Land Acquisition and Resettlement in Bangladesh: A Quest for Well Formulated National Resettlement and Rehabilitation Policy. International Journal of Humanities and Social Science 3(7),"
            }
        ]
    }, 
    {
        "country": "Belize", 
        "iso3": "BLZ", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject97/constitution-belize-1981-rev-2011", 
                "title": "Government of Belize. 1981 (amended 2011). Constitution of Belize."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-acquisition-public-purposes-act-cap-184", 
                "title": "Government of Belize. 2000. Land Acquisition (Public Purposes) Act CAP 184."
            }, 
            {
                "link": "http://landportal.org/library/resources/housing-and-town-planning-act;", 
                "title": "Government of Belize. 2000. Housing and Town Planning Act."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-acquisition-and-involuntary-resettlement-policy-framework", 
                "title": "Belize Social Investment Fund. 2010 Land Acquisition and Involuntary Resettlement Policy Framework."
            }
        ]
    }, 
    {
        "country": "Bhutan", 
        "iso3": "BTN", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject988/constitution-bhutan-2008", 
                "title": "Government of Bhutan. 2008. Constitution of Bhutan."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-act-bhutan-2007", 
                "title": "Government of Bhutan. 2007. The Land Act of Bhutan 2007."
            }
        ]
    }, 
    {
        "country": "Brazil", 
        "iso3": "BRA", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/act-no-45041964-regulating-rights-and-obligations-regarding-rural-real-estates", 
                "title": "Government of Brazil. 1964. Land Law, Law 4.504 of 1964."
            }, 
            {
                "link": "http://landportal.org/library/resources/law-expropriation-public-utility-decree-law-no-3365-june-21-194", 
                "title": "Government of Brazil. 1941. The Law of Expropriation for Public Utility, Decree-Law No. 3.365 of June 21, 1941."
            }, 
            {
                "title": "Government of Brazil. 1962. The Expropriation Law for Social Interest, Law 4.132 of Sept. 10, 1962"
            }, 
            {
                "title": "Rosenn, Keith. 1975. Expropriation in Argentina and Brazil: Theory and Practice. Virginia Journal of International Law. Vol. 15:2."
            }, 
            {
                "title": "World Bank. 2016. Land Governance Assessment Framework Synthesis Report (Brazil). World Bank: Washington, DC."
            }, 
            {
                "link": "http://landportal.org/library/resources/ministry-cities-involuntary-resettlement-policy", 
                "title": "Ministry of Cities. 2013. Involuntary Resettlement Policy (No. 317)."
            }
        ]
    }, 
    {
        "country": "Burkina Faso", 
        "iso3": "BFA", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject594/constitution-burkina-faso-1991-rev-2012", 
                "title": "Government of Burkina Faso. 1991. Constitution of Burkina Faso (Amended 2012)."
            }, 
            {
                "link": "http://landportal.org/library/resources/law-034-2012an-agrarian-reform-law", 
                "title": "Government of Burkina Faso. 2012. Law 034-2012/AN Agrarian Reform Law."
            }, 
            {
                "link": "http://landportal.org/library/resources/landwiserecord1599item1569/burkina-faso-rural-land-law-rural-land-law", 
                "title": "Government of Burkina Faso. 2009. Law 034-2009/AN on Rural Land Tenure."
            }
        ]
    }, 
    {
        "country": "Botswana", 
        "iso3": "BWA", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject726/constitution-botswana-1966-rev-2005", 
                "title": "Government of Botswana. 1966 (Rev. 2005). Constitution of Botswana."
            }, 
            {
                "link": "http://landportal.org/library/resources/acquisition-property-act-chapter-3210", 
                "title": "Government of Botswana. 1955. Acquisition of Property Act Chapter 32:10."
            }, 
            {
                "link": "http://landportal.org/library/resources/tribal-land-act-chapter-3202-amended-1994", 
                "title": "Government of Botswana. 1968. Tribal Land Act Chapter 32:02 (Amended 1994)."
            }, 
            {
                "link": "http://landportal.org/library/resources/tribal-land-act-chapter-3202-amended-1994", 
                "title": "Government of Botswana. 1970. Tribal Land Regulations (Chapter 32:02)."
            }, 
            {
                "title": "Ministry of Lands and Housing. 1977 (amended 2004). Compensation Guidelines"
            }
        ]
    }, 
    {
        "country": "Cambodia", 
        "iso3": "KHM", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject913/constitution-cambodia-1993-rev-2008", 
                "title": "Government of Cambodia. 1993. Constitution of Cambodia."
            }, 
            {
                "link": "http://landportal.org/library/resources/cambodia-law-expropriation", 
                "title": "Government of Cambodia. 2010. Law on Expropriation. (Unofficial Translation)."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-law-2001-chapter-3-part-2", 
                "title": "Government of Cambodia. 2001. Land Law of 2001, Chapter 3, Part 2. August 13."
            }, 
            {
                "link": "http://landportal.org/library/resources/sub-decree-procedures-registration-land-indigenous-communities", 
                "title": "Government of Cambodia. 2009. Sub Decree on Procedures of Registration of Land of Indigenous Communities of 2009. June 9."
            }, 
            {
                "link": "http://landportal.org/library/resources/sub-decree-no-146-economic-land-concessions", 
                "title": "Government of Cambodia. 2005. Sub-Decree No. 146 on Economic Land Concessions."
            }
        ]
    }, 
    {
        "country": "China", 
        "iso3": "CHN", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject849/constitution-china-1982-rev-2004", 
                "title": "Government of the People\u2019s Republic of China. 2004. Constitution of China."
            }, 
            {
                "link": "http://landportal.org/library/resources/law-land-administration-people%E2%80%99s-republic-china", 
                "title": "Government of the People\u2019s Republic of China. 1998. The Law of Land Administration of the People\u2019s Republic of China."
            }, 
            {
                "link": "http://landportal.org/library/resources/property-law-people%E2%80%99s-republic-china", 
                "title": "Government of China. 2007. Property Law of the People\u2019s Republic of China."
            }, 
            {
                "link": "http://landportal.org/library/resources/peoples-republic-china-regulation-expropriation-buildings-state-owned-land-and", 
                "title": "Government of China. 2011. Regulation on the Expropriation of Buildings on State-owned Land and Compensation."
            }, 
            {
                "link": "http://landportal.org/library/resources/regulation-implementation-land-administration-law", 
                "title": "Government of China. 1991. Regulations for the implementation of the Land Administration Law of the People's Republic of China."
            }, 
            {
                "link": "http://landportal.org/library/resources/regulations-compensation-and-resettlement-migrants-medium-and-large-water", 
                "title": "Government of China. 2006. Regulation on Land Requisition Compensation and Resettlement of Migrants for Large and Medium Water Conservation and Hydropower Construction Projects."
            }, 
            {
                "link": "http://landportal.org/library/resources/peoples-republic-china-urban-housing-demolition-and-relocation-management", 
                "title": "Government of China. 2001. Urban Housing Demolition and Relocation Management Regulations."
            }
        ]
    }, 
    {
        "country": "Ecuador", 
        "iso3": "ECU", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject978/constitution-ecuador-2008-rev-2015", 
                "title": "Government. 2010. Constitution of Ecuador."
            }, 
            {
                "link": "http://landportal.org/library/resources/ley-n%C2%BA-54-ley-de-desarrollo-agrario", 
                "title": "Government of Ecuador. 1997. Ley N\u00ba 54 - Ley de Desarrollo Agrario."
            }, 
            {
                "link": "http://landportal.org/library/resources/resoluci%C3%B3n-n%C2%BA-15-instructivo-para-sustanciar-el-proceso-de-expropiaci%C3%B3n-en-primera", 
                "title": "Government. 2013. Resoluci\u00f3n N\u00ba 15 - Instructivo para sustanciar el proceso de expropiaci\u00f3n en primera instancia."
            }
        ]
    }, 
    {
        "country": "Ethiopia", 
        "iso3": "ETH", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject698/constitution-ethiopia-1994", 
                "title": "Government of Ethiopia. 1994. Constitution of Ethiopia."
            }, 
            {
                "link": "http://landportal.org/library/resources/expropriation-landholdings-public-purposes-and-payment-compensation-proclamation", 
                "title": "Government of Ethiopia. 2005. Expropriation of Landholdings for Public Purposes and Payment of Compensation Proclamation."
            }, 
            {
                "link": "http://landportal.org/library/resources/civil-code-ethiopia", 
                "title": "Government of Ethiopia. 1960. Civil Code of Ethiopia."
            }, 
            {
                "link": "http://landportal.org/library/resources/proclamation-no-4562005-rural-land-administration-and-use", 
                "title": "Government of Ethiopia. 2005. Proclamation No. 456/2005 Rural Land Administration and Use Proclamation."
            }
        ]
    }, 
    {
        "country": "Eritrea", 
        "iso3": "ERI", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject699/constitution-eritrea-1997", 
                "title": "Government of Eritrea. 1997. Constitution oF Eritrea."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-proclamation-no-581994", 
                "title": "Government of Eritrea. 1994. Land Proclamation (No. 58/1994)."
            }
        ]
    }, 
    {
        "country": "Ghana", 
        "iso3": "GHA", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject611/constitution-ghana-1992-rev-1996", 
                "title": "Government of Ghana. 1992. The Constitution of the Republic of Ghana 1992."
            }, 
            {
                "link": "http://landportal.org/library/resources/state-lands-act", 
                "title": "Government of Ghana. 1962. State Lands Act."
            }, 
            {
                "link": "http://landportal.org/library/resources/administration-lands-act", 
                "title": "Government of Ghana. 1962. Administration of Lands Act, 1962."
            }
        ]
    }, 
    {
        "country": "Honduras", 
        "iso3": "HND", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject125/constitution-honduras-1982-rev-2013",
                "title": "Government of Honduras. 1982. Constitution of Honduras 1982 (rev. 2013)."
            },
            {
                "link": "http://landportal.org/library/resources/decreto-n%C2%BA-8204-ley-de-propiedad", 
                "title": "Government of Honduras. 2004. Decreto N\u00ba 82/04 - Ley de propiedad."
            }, 
            {
                "link": "http://landportal.org/library/resources/decreto-n%C2%BA-19105-reforma-la-ley-de-propiedad", 
                "title": "Government of Honduras. 2005. Decreto N\u00ba 191/05 - Reforma la Ley de Propiedad."
            }, 
            {
                "link": "http://landportal.org/library/resources/decreto-n%C2%BA-25805-reforma-la-ley-de-propiedad", 
                "title": "Government of Honduras. 2005. Decreto N\u00ba 258/05 - Reforma la Ley de propiedad."
            }
        ]
    }, 
    {
        "country": "Hong Kong", 
        "iso3": "HKG", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constitution-hong-kong", 
                "title": "Constitution of Hong Kong. 1990."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-resumption-ordinance", 
                "title": "Government of Hong Kong. 1998. Land Resumption Ordinance (CAP. 124)."
            }, 
            {
                "link": "http://landportal.org/library/resources/basic-law-hong-kong-special-administrative-region-peoples-republic-china", 
                "title": "Government of Hong Kong. 1990. Basic Law of the Hong Kong Special Administrative Region of the People\u2019s Republic of China."
            }
        ]
    }, 
    {
        "country": "India", 
        "iso3": "IND", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject862/constitution-india-1949-rev-2015", 
                "title": "Government of India. 2007. Constitution of India."
            }, 
            {
                "link": "http://landportal.org/library/resources/right-fair-compensation-and-transparency-land-acquisition-rehabilitation-and-1", 
                "title": "Government of India. 2013. The Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act."
            }, 
            {
                "link": "http://landportal.org/library/resources/scheduled-tribes-and-other-traditional-forest-dwellers-recognition-forest-rights", 
                "title": "Government of India. 2006. The Scheduled Tribes and Other Traditional Forest Dwellers (Recognition of Forest Rights) Act."
            }, 
            {
                "link": "http://landportal.org/library/resources/right-fair-compensation-and-transparency-land-acquisition-rehabilitation-and", 
                "title": "Government of India. 2014. The Right To Fair Compensation And Transparency in Land Acquisition, Rehabilitation and Resettlement (Amendment) Ordinance, 201 4."
            }, 
            {
                "link": "http://landportal.org/library/resources/right-fair-compensation-and-transparency-land-acquisition-rehabilitation-and-0", 
                "title": "Government of India. 2014. Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement (Social Impact Assessment and Consent) Rules, 2014."
            }
        ]
    }, 
    {
        "country": "Indonesia", 
        "iso3": "IDN", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject937/constitution-indonesia-1945-reinst-1959-rev-2002", 
                "title": "Government of Indonesia. 1945. Constitution of Indonesia."
            }, 
            {
                "link": "http://landportal.org/library/resources/acquisition-land-development-public-interest", 
                "title": "Government of Indonesia. Acquisition of Land for Development in the Public Interest (Law No. 2 of 2012)."
            }, 
            {
                "link": "http://landportal.org/library/resources/act-41-1999-forestry-affairs", 
                "title": "Government of Indonesia. 1999. Act. 41 of 1999 on Forestry Affairs."
            }, 
            {
                "link": "http://landportal.org/library/resources/basic-agrarian-act", 
                "title": "Government of Indonesia. 1960. Basic Agrarian Act."
            }, 
            {
                "link": "http://landportal.org/library/resources/constitutional-court-no-35puu-x2012", 
                "title": "Government of Indonesia. 2012. Constitutional Court Decision, PUTUSAN - Nomor 35/ PUU-X/2012."
            }
        ]
    }, 
    {
        "country": "Kazakhstan", 
        "iso3": "KAZ", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject838/constitution-kazakhstan-1995-rev-2011", 
                "title": "Government of Kazakhstan. 1995. Constitution of Kazakhstan, 1995."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-code-republic-kazakhstan", 
                "title": "Government of Kazakhstan. 2003. Land Code of the Republic of Kazakhstan, 2003."
            }, 
            {
                "link": "http://landportal.org/library/resources/kazakhstan-law-state-owned-property-no-413-iv-zrk", 
                "title": "Government of Kazakhstan. 2011. Law on State-Owned Property (No. 413-IV ZRK)."
            }, 
            {
                "link": "http://landportal.org/library/resources/kazakhstan-civil-code", 
                "title": "Government of Kazakhstan. 1994. Civil Code."
            }
        ]
    }, 
    {
        "country": "Kenya", 
        "iso3": "KEN", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject989/constitution-kenya-2010", 
                "title": "Government of Kenya. 2010 Constitution of Kenya."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-act", 
                "title": "Government of Kenya. 2012. Land Act."
            }, 
            {
                "link": "http://landportal.org/library/resources/kenya-community-land-act", 
                "title": "Government of Kenya. 2016. Community Land Act."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-acquisition-act-1", 
                "title": "Government of Kenya. 2010. Land Acquisition Act (Repealed by Land Act 2012)."
            }, 
            {
                "link": "http://landportal.org/library/resources/lex-faoc112131/land-act-2012-no-6-2012", 
                "title": "Government of Kenya. 2012. Land Act."
            }
        ]
    }, 
    {
        "country": "Laos", 
        "iso3": "LAO", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/laos-decree-compensation-and-resettlement-management-development-projects", 
                "title": "Government of Laos. 2016. Decree on Compensation and Resettlement Management in Development Projects."
            }, 
            {
                "link": "http://landportal.org/library/resources/decree-compensation-and-resettlement-development-project-no-192pm", 
                "title": "Government of Laos. 2005. Decree on the Compensation and Resettlement of the Development Project."
            }, 
            {
                "link": "http://landportal.org/library/resources/decree-implementation-land-law-no-88pm", 
                "title": "Government of Laos. 2008. Decree on the Implementation of the Land Law No. 88/PM."
            }, 
            {
                "link": "http://landportal.org/library/resources/laos-land-law-no-4", 
                "title": "Government of Laos. 2003. Land Law No. 04 /NA ."
            }, 
            {
                "link": "http://landportal.org/library/resources/decree-compensation-and-resettlement-development-project-no-192pm", 
                "title": "Government of Laos. 2003. Decree on the Compensation and Resettlement of the Development Project No. 192/PM."
            }
        ]
    }, 
    {
        "country": "Lesotho", 
        "iso3": "LSO", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject725/constitution-lesotho-1993-rev-1998", 
                "title": "Government of Lesotho. 1993. Constitution of Lesotho."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-act-0", 
                "title": "Government of Lesotho. 2010. Land Act (Act No. 8 of 2010)."
            }
        ]
    }, 
    {
        "country": "Liberia", 
        "iso3": "LBR", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject597/constitution-liberia-1986", 
                "title": "Government of Liberia. 1986. Constitution of Liberia 1986."
            }, 
            {
                "link": "http://landportal.org/library/resources/liberia-draft-land-rights-act-2013-pending", 
                "title": "Government of Liberia. 2013. Draft Land Rights Act 2013 (pending)."
            }
        ]
    }, 
    {
        "country": "Malawi", 
        "iso3": "MWI", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/land-act-cap-5701", 
                "title": "Government of Malawi. 1965. Land Act (Cap. 57:01)."
            }, 
            {
                "link": "http://landportal.org/library/resources/constituteproject712/constitution-malawi-1994-rev-1999", 
                "title": "Government of Malawi. 1994 (rev 1999). Constitution of Malawi."
            }
        ]
    }, 
    {
        "country": "Malaysia", 
        "iso3": "MYS", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject924/constitution-malaysia-1957-rev-2007", 
                "title": "Government of Malaysia. 1957. Federal Constitution (rev. 2007)."
            }, 
            {
                "link": "http://landportal.org/library/resources/landwiserecord772item822/malaysia-land-acquisition-act-land-acquisition-act-1960", 
                "title": "Government of Malaysia. 1960. Land Acquisition Act No. 486. (Amended 1992)."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-acquisition-rules-1988", 
                "title": "Government of Malaysia. 1998. Land Acquisition Rules."
            }, 
            {
                "link": "http://landportal.org/library/resources/landwiserecord774item824/malaysia-national-land-code-validation-act-national-land", 
                "title": "Government of Malaysia. 2008. National Land Code 1965 (Amended 2008)."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-development-act-1956", 
                "title": "Government of Malaysia. 1956. Land Development Act, 1956."
            }
        ]
    }, 
    {
        "country": "Mexico", 
        "iso3": "MEX", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject96/constitution-mexico-1917-rev-2015", 
                "title": "Government of Mexico. 1917 (amended 2007). Constitution of Mexico."
            }, 
            {
                "link": "http://landportal.org/library/resources/ley-de-expropiaci%C3%B3n", 
                "title": "Government of Mexico. 1936 (amended 2011 ). Expropriation Law."
            }, 
            {
                "link": "http://landportal.org/library/resources/decreto-por-el-que-se-reforman-el-art%C3%ADculo-6%C2%BA-y-el-segundo-p%C3%A1rrafo-del-art%C3%ADculo-20", 
                "title": "Government of Mexico. 2011. Decree that Article 6 and the second paragraph of Article 20(a) of the Expropriation Act are amended."
            }, 
            {
                "link": "http://landportal.org/library/resources/ley-agraria-1992", 
                "title": "Government of Mexico. 1992. Agrarian Law."
            }, 
            {
                "title": "Government of Mexico. 1996. Regulations of the Agrarian Law on Matters of Organization of Rural Property"
            }, 
            {
                "title": "Government of Mexico. 1992. Regulations of the Institute for Administration of National Properties."
            }, 
            {
                "link": "http://landportal.org/library/resources/usaid-land-tenure-country-profile-mexico", 
                "title": "United States Agency for International Development (USAID). 2011. USAID Country Profile Property Rights and Resource Governance: Mexico."
            }
        ]
    }, 
    {
        "country": "Mongolia", 
        "iso3": "MNG", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject855/constitution-mongolia-1992-rev-2001", 
                "title": "Government of Mongolia. Constitution of Mongolia. 1992."
            }, 
            {
                "link": "http://landportal.org/library/resources/landwiserecord1715item1711/mongolia-law-allocation-land-mongolian-citizens", 
                "title": "Government of Mongolia. 2002. Law on Allocation of Land to Mongolian Citizens for Ownership."
            }, 
            {
                "link": "http://landportal.org/library/resources/landwiserecord1716item1712/mongolia-law-land-law-land", 
                "title": "Government of Mongolia. 2002. Law on Land."
            }
        ]
    }, 
    {
        "country": "Myanmar", 
        "iso3": "MMR", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/land-acquisition-act-1894", 
                "title": "Government of Myanmar. 1894. Land Acquisition Act."
            }, 
            {
                "link": "http://landportal.org/library/resources/vacant-fallow-and-virgin-lands-management-law", 
                "title": "Government of Myanmar. 2012. The Vacant, Fallow and Virgin Lands Management Law."
            }
        ]
    }, 
    {
        "country": "Namibia", 
        "iso3": "NAM", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject722/constitution-namibia-1990-rev-2010", 
                "title": "Government of Namibia. 1990. Constitution of the Republic of Namibia."
            }, 
            {
                "link": "http://landportal.org/library/resources/communal-land-reform-act-2002", 
                "title": "Government of Namibia. 2002 (Amended 2013). Communal Land Reform Act 2002 (Amended 2013)."
            }, 
            {
                "link": "http://landportal.org/library/resources/agricultural-commercial-land-reform-act-1995", 
                "title": "Government of Namibia. 1955. Agricultural (Commercial) Land Reform Act 6 of 1995."
            }, 
            {
                "link": "http://landportal.org/library/resources/agricultural-commercial-land-reform-amendment-act-2014", 
                "title": "Government of Namibia. 2014. Agricultural (Commercial) Land Reform Amendment Act, 2014 (No. 1 of 2014)."
            }
        ]
    }, 
    {
        "country": "Nepal", 
        "iso3": "NPL", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject1144/constitution-nepal-2015", 
                "title": "Government of Nepal. 2015. Constitution of Nepal."
            }, 
            {
                "link": "http://landportal.org/library/resources/landwiserecord784item834/nepal-land-acquisition-act-land-acquisition-act-nepal", 
                "title": "Government of Nepal. 1977. Land Acquisition Act, 2034 (1977)."
            }, 
            {
                "link": "http://landportal.org/library/resources/guthi-corporation-act-1976", 
                "title": "Government of Nepal. 1976. Guthi Corporation Act 1976."
            }
        ]
    }, 
    {
        "country": "Nicaragua", 
        "iso3": "NIC", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/ley-n%C2%BA-278-ley-sobre-propiedad-reformada-urbana-y-agraria", 
                "title": "Government of Nicaragua. Ley N\u00ba 278 - Ley sobre propiedad reformada urbana y agraria."
            }, 
            {
                "link": "http://landportal.org/library/resources/c%C3%B3digo-civil-rep%C3%BAblica-de-nicaragua", 
                "title": "Government of Nicaragua. 1904. Civil Code."
            }, 
            {
                "link": "http://landportal.org/library/resources/ley-n%C2%BA-445-ley-de-r%C3%A9gimen-de-propiedad-comunal-de-los-pueblos-ind%C3%ADgenas-y", 
                "title": "Government of Nicaragua. 2003. Ley N\u00ba 445 - Ley de r\u00e9gimen de propiedad comunal de los pueblos ind\u00edgenas y comunidades \u00e9tnicas."
            },
            {
                "link": "http://landportal.org/library/resources/law-445-law-communal-property-regime-indigenous-peoples-and-ethnic-communities",
                "title": "Government of Nicaragua. 2003. Law 445: Law of Communal Property Regime of the Indigenous Peoples and Ethnic Communities of the Autonomous Regions of the Atlantic Coast of Nicaragua and of the Rivers Bocay, Coco, Indio and Maiz."
            }
        ]
    }, 
    {
        "country": "Nigeria", 
        "iso3": "NGA", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject627/constitution-nigeria-1999", 
                "title": "Government of Nigeria. 1999. Constitution of Nigeria."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-use-act-1978", 
                "title": "Government of Nigeria. 1978. Land Use Act 1978."
            },
            {
                "link": "http://landportal.org/library/resources/land-acquisition-compensation-and-resettlement-developing-economies-nigeria-case", 
                "title": "Kayode, D. Land Acquisition, Compensation, and Resettlement in Developing Economies: Nigeria as a Case Study."
            }
        ]
    }, 
    {
        "country": "Pakistan", 
        "iso3": "PAK", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject974/constitution-pakistan-1973-reinst-2002-rev-2015", 
                "title": "Government of Pakistan. 2015. Constitution of Pakistan."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-acquisition-act-1894-0", 
                "title": "Government of Pakistan. 1894. Land Acquisition Act."
            }
        ]
    }, 
    {
        "country": "Papua New Guinea", 
        "iso3": "PNG", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject940/constitution-papua-new-guinea-1975-rev-2014", 
                "title": "Government of Papua New Guinea. 1975 (rev. 2014). Constitution of Papua New Guinea."
            }, 
            {
                "link": "http://landportal.org/library/resources/landwiserecord1351item1379/papua-new-guinea-land-act-land-act-papua-new-guinea", 
                "title": "Government of Papua New Guinea. 1996. Land Act."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-regulation-1999", 
                "title": "Government of Papua New Guinea. 1999. Land Regulations."
            }
        ]
    }, 
    {
        "country": "Peru", 
        "iso3": "PER", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject255/constitution-peru-1993-rev-2009", 
                "title": "Government of Peru. 1993. Constitution of Peru."
            }, 
            {
                "link": "http://landportal.org/library/resources/decreto-legislativo-n%C2%B0-1192", 
                "title": "Government of Peru. 2015. Decreto Legislativo N\u00ba 1.192 - Ley Marco de Adquisici\u00f3n y Expropiaci\u00f3n de inmuebles, transferencia de inmuebles de propiedad del Estado, liberaci\u00f3n de Interferencias y dicta otras medidas para la ejecuci\u00f3n de obras de infraestructura."
            }, 
            {
                "link": "http://landportal.org/library/resources/ley-general-de-expropiaciones", 
                "title": "Government of Peru. 1999. Ley N\u00ba 27.117 - Ley General de Expropiaciones (Repealed)."
            }, 
            {
                "link": "http://landportal.org/library/resources/ley-que-facilita-la-adquisici%C3%B3n-expropiaci%C3%B3n-y-posesi%C3%B3n-de-bienes-inmuebles-para", 
                "title": "Government of Peru. 2013. Ley N\u00ba 30.025 - Ley que facilita la adquisici\u00f3n, expropiaci\u00f3n y posesi\u00f3n de bienes inmuebles para obras de infraestructura."
            }, 
            {
                "link": "http://landportal.org/library/resources/decree-1210", 
                "title": "Government of Peru. 2015. Decree 1210 Decreto legislativo que modifica la décima disposición complementaria final del decreto legislativo nº 1192, que aprueba la ley marco de adquisición y expropiación de inmuebles, transferencia de inmuebles de propiedad del estado, liberación de interferencias y dicta otras medidas para la ejecución de obras de infraestructura"
            },
            {
                "link": "http://landportal.org/library/resources/ley-de-la-inversion-privada-en-el-desarrollo-de-las-actividades-economicas-en-las",
                "title": "Government of Peru. 1995. Ley de la inversion privada en el desarrollo de las actividades economicas en las tierras del territorio nacional y de las comunidades campesinas y nativas."
            },
            {
                "link": "http://landportal.org/library/resources/law-right-prior-consultation-indigenous-or-native-peoples-recognized-convention",
                "title": "Government of Peru. 2011. Law of the Right to Prior Consultation to Indigenous or Native Peoples, recognized in the Convention 169 of the International Labour Convention (ILO)"
            }
        ]
    }, 
    {
        "country": "Philippines", 
        "iso3": "PHL", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject932/constitution-philippines-1987", 
                "title": "Government of the Philippines. 1987. Constitution of the Philippines."
            }, 
            {
                "link": "http://landportal.org/library/resources/landwiserecord1642item1622/philippines-indigenous-peoples-rights-act-indigenous", 
                "title": "Government of the Philippines. 1997. The Indigenous Peoples\u2019 Rights Act of 1997."
            }, 
            {
                "link": "http://landportal.org/library/resources/supreme-court-decision-gr-no-150640", 
                "title": "Government of the Philippines. 2007. Supreme Court Decision G.R. No. 150640."
            }, 
            {
                "link": "http://landportal.org/library/resources/republic-act-no-8974", 
                "title": "Government of the Philippines. 2000. Republic Act, No. 8974, An Act to Facilitate the Acquisition of Right-of-Way, Site or Location for National Government Infrastructure Projects and For Other Purpose."
            }, 
            {
                "link": "http://landportal.org/library/resources/landwiserecord1640item1620/philippines-comprehensive-agrarian-reform-law-amended", 
                "title": "Government of the Philippines. 1988. Comprehensive Agrarian Reform Law of 1988 (Amended 2009)."
            }, 
            {
                "link": "http://landportal.org/library/resources/republic-act-9700", 
                "title": "Government of the Philippines. 2009. Republic Act No. 9700 amending Republic Act No. 6657 on the Comprehensive Agrarian Reform Law 1988."
            }, 
            {
                "link": "http://landportal.org/library/resources/supreme-court-philippines-2012-g-r-no-185124", 
                "title": "Supreme Court of the Philippines. 2012. NIA v. Rural Bank, G. R. No. 185124."
            }, 
            {
                "link": "http://landportal.org/library/resources/civil-procedure-rule-67", 
                "title": "Government of the Philippines. Civil Procedure Rule 67."
            }
        ]
    }, 
    {
        "country": "Rwanda", 
        "iso3": "RWA", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject687/constitution-rwanda-2003-rev-2015", 
                "title": "Government of Rwanda. 2003. Constitution of Rwanda."
            }, 
            {
                "link": "http://landportal.org/library/resources/landwiserecord1723item1719/rwanda-expropriation-law-expropriation-law", 
                "title": "Government of Rwanda. 2007. Law No. 18/2007 Relating to Expropriation in the Public Interest (Amended 2015)."
            }, 
            {
                "link": "http://landportal.org/library/resources/landwiserecord1740item1736/rwanda-organic-law-determining-use-and-management-land", 
                "title": "Government of Rwanda. 2005. Organic Law No. 08/2005 Determining the Use and Management of Land in Rwanda."
            }, 
            {
                "link": "http://landportal.org/library/resources/usaid-land-tenure-policy-research-brief-no-2-rwanda", 
                "title": "Ikirezi Mireille, Dr. Fid\u00e8le Masengo and Anna Knox. July 2014. Implementation of Expropriation Law in Rwanda: Challenges and Ways Forward, LAND Project Policy Research Brief No.2, Kigali, Rwanda: USAID LAND Project. Research Brief No.2, Kigali, Rwanda: USAID LAND Project."
            },
            {
                "link": "http://landportal.org/library/resources/law-n%C2%B0-322015-11062015-relating-expropriation-public-interest",
                "title": "Government of Rwanda. April 2015. Law n° 32/2015 of 11/06/2015 relating to expropriation in the public interest"
            }
        ]
    }, 
    {
        "country": "Sierra Leone", 
        "iso3": "SLE", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject983/constitution-sierra-leone-1991-reinst-1996-rev-2008", 
                "title": "Government of Sierra Leone. 1991. Constitution of Sierra Leone."
            }, 
            {
                "link": "http://landportal.org/library/resources/draft-national-land-policy-sierra-leone", 
                "title": "Government of Sierra Leone. 2014. Draft National Land Policy of Sierra Leone."
            }, 
            {
                "link": "http://landportal.org/library/resources/crown-lands-amendment-act-1961", 
                "title": "Government of Sierra Leone. 1960. Public Lands Ordinance Cap. 116."
            }
        ]
    }, 
    {
        "country": "South Africa", 
        "iso3": "ZAF", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject717/constitution-south-africa-1996-rev-2012", 
                "title": "Government of South Africa. 1996. Constitution of South Africa."
            }, 
            {
                "link": "http://landportal.org/library/resources/expropriation-act", 
                "title": "Government of South Africa. 1975. Expropriation Act 1975."
            }, 
            {
                "link": "http://landportal.org/library/resources/landwiserecord1547item1505/south-africa-communal-land-rights-act-communal-land", 
                "title": "Government of South Africa. 2004. Communal Land Rights Act (No. 11 of 2004)."
            }, 
            {
                "link": "http://landportal.org/library/resources/promotion-administrative-justice-act-2000", 
                "title": "Government of South Africa. 2000. Promotion of Administrative Justice Act 3 of 2000."
            }, 
            {
                "link": "http://landportal.org/library/resources/prevention-illegal-eviction-and-unlawful-occupation-land-act", 
                "title": "Government of South Africa. 1998. Prevention from and Illegal Eviction and Unlawful Occupation Act."
            }, 
            {
                "link": "http://landportal.org/ru/library/resources/restitution-land-rights-act-1994",
                "title": "Government of South Africa. 1994. Restitution of Land Rights Act."
            }, 
            {
                "link": "http://landportal.org/library/resources/interim-protection-information-land-rights-act-1996", 
                "title": "Government of South Africa. 1996. Interim Protection of Information Land Rights Act (IPILRA)."
            },
            {
                "link": "http://landportal.org/library/resources/case-cct-5-1-12-constitutional-court-south-africa",
                "title": "Government of South Africa. 2013. Constitutional Court Decision. Agri South Africa v. Minister of Minerals and Energy (CCT 51/12) [2013]."
            },
            {
                "link": "http://landportal.org/library/resources/property-valuation-act", 
                "title": "Property Valuation Act, 2014 (No. 17 of 2014)."
            }, 
            {
                "link": "http://landportal.org/library/resources/bartsch-consult-pty-ltd-v-mayoral-committee-maluti-phofung-municipality", 
                "title": "Bartsch Consult (Pty) Limited v Mayoral Committee of the Maluti-A-Phofung Municipality [2010] ZAFSHC 11."
            }
        ]
    }, 
    {
        "country": "South Sudan", 
        "iso3": "SSD", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject1003/constitution-south-sudan-2011-rev-2013", 
                "title": "Government of South Sudan. 2011. Transitional Constitution."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-act-2009", 
                "title": "Government of South Sudan. 2009. Land Act."
            }
        ]
    }, 
    {
        "country": "Sri Lanka", 
        "iso3": "LKA", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject881/constitution-sri-lanka-1978-rev-2015", 
                "title": "Government of Sri Lanka. 1978 (Rev. 2015). Constitution of Sri Lanka."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-acquisition-act-1950", 
                "title": "Government of Sri Lanka. 1950. Land Acquisition Act CAP. 295 (Amended 1994)."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-acquisition-amendment-act-no-13-1986", 
                "title": "Government of Sri Lanka. 1986. Land Acquisition (Amendment) Act (No. 13 of 1986)."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-acquisition-regulations-2009", 
                "title": "Government of Sri Lanka. 2009. Land Acquisition Regulations."
            }, 
            {
                "link": "http://landportal.org/library/resources/water%E2%80%99s-edge-judgement-sc-fr-no-3522007", 
                "title": "Government of Sri Lanka. 2007. Water\u2019s Edge Judgement S.C. (F/R) No. 352/2007."
            }, 
            {
                "link": "http://landportal.org/library/resources/sri-lanka-national-involuntary-resettlement-policy-nirp", 
                "title": "Government of Sri Lanka. 2001. National Involuntary Resettlement Policy."
            }, 
            {
                "link": "http://landportal.org/library/resources/temple-lands-compensation-ordinance-1944-no-28-1944", 
                "title": "Government of Sri Lanka. 1944. Temple Lands (Compensation) Ordinance."
            }
        ]
    }, 
    {
        "country": "Swaziland", 
        "iso3": "SWZ", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject729/constitution-swaziland-2005", 
                "title": "Government of Swaziland. 2005. Constitution of Swaziland."
            }, 
            {
                "link": "http://landportal.org/library/resources/acquisition-property-act-1961", 
                "title": "Government of Swaziland. 1961. Acquisition of Property Act, 1961 (No. 10 of 1961)."
            }
        ]
    }, 
    {
        "country": "Tanzania", 
        "iso3": "TZA", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject675/constitution-united-republic-tanzania-1977-rev-1995", 
                "title": "Government of Tanzania. 1977. Constitution of Tanzania."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-acquisition-act-1967", 
                "title": "Government of Tanzania. 1967. Land Acquisition Act (Act No. 47 of 1967)."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-act-1999", 
                "title": "Government of Tanzania. 1999. The Land Act."
            }, 
            {
                "link": "http://landportal.org/library/resources/village-land-act-1999", 
                "title": "Government of Tanzania. 1999. Village Land Act."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-assessment-value-land-compensation-regulations", 
                "title": "Government of Tanzania. 2001. The Land (Assessment of the Value of Land for Compensation) Regulations."
            }, 
            {
                "link": "http://landportal.org/library/resources/village-land-regulations", 
                "title": "Government of Tanzania. 2002. Village Land Regulations."
            }
        ]
    }, 
    {
        "country": "Taiwan", 
        "iso3": "TWN", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject856/constitution-taiwan-1947-rev-2005", 
                "title": "Government of Taiwan. 1947. Constitution of Taiwan (Amended 2000)."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-act-amended-2006", 
                "title": "Government of Taiwan. 1930. The Land Act (Amended 2006)."
            }, 
            {
                "link": "http://landportal.org/library/resources/indigenous-people-basic-law", 
                "title": "Government of Taiwan. 2005. Indigenous People\u2019s Basic Law."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-expropriation-act-2000", 
                "title": "Government of Taiwan. 2000. Expropriation Act."
            }
        ]
    }, 
    {
        "country": "Thailand", 
        "iso3": "THA", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject1031/constitution-thailand-2014", 
                "title": "Government of Thailand. 2014. Constitution of Thailand."
            }, 
            {
                "link": "http://landportal.org/library/resources/immovable-property-expropration-act", 
                "title": "Government of Thailand. 1987. Immovable Property Expropriation Act, B.E. 2530."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-code-promulgating-act-1954", 
                "title": "Government of Thailand. 2008. Act promulgating the Land Code B.E. 2497."
            }
        ]
    }, 
    {
        "country": "Trinidad and Tobago", 
        "iso3": "TTO", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject77/constitution-trinidad-and-tobago-1976-rev-2007", 
                "title": "Government of Trinidad and Tobago.1976 (amended 2000). Constitution of Trinidad and Tobago."
            }, 
            {
                "link": "http://landportal.org/library/resources/valuation-land-act", 
                "title": "Government of Trinidad and Tobago. 1969 (amended 2009) Valuation of Land Act (Cap. 58:03)."
            }, 
            {
                "link": "http://landportal.org/library/resources/landwiserecord557item599/trinidad-and-tobago-land-acquisition-act-land-acquisition", 
                "title": "Government of Trinidad and Tobago. 1994 (amended 2000). Land Acquisition Act (Cap. 58:01)."
            }
        ]
    }, 
    {
        "country": "Uganda", 
        "iso3": "UGA", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject669/constitution-uganda-1995-rev-2005", 
                "title": "Government of Uganda. 1995. Constitution of Uganda."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-acquisition-act-1965", 
                "title": "Government of Uganda. 1965. Land Acquisition Act 1965 (ch. 226)."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-act-cap-227", 
                "title": "Government of Uganda. 1998. Land Act (No. 16 of 1998) (amended 2010)."
            }, 
            {
                "link": "http://landportal.org/library/resources/pyrali-abdul-rasul-esmail-v-adrian-sibo", 
                "title": "Government of Uganda. 1997. Supreme Court Decision Pyrali Abdul Rasul Esmail v. Adrian Sibo (Constitutional Petition No. 9 of 1997)."
            }
        ]
    }, 
    {
        "country": "Vietnam", 
        "iso3": "VNM", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject919/constitution-viet-nam-1992-rev-2013", 
                "title": "Government of Vietnam. 2014. Constitution of Vietnam."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-law-no452013qh13", 
                "title": "Government of Vietnam. 2013. Land Law No. 45/2013/QH13."
            }, 
            {
                "link": "http://landportal.org/library/resources/regulations-compensation-support-and-resettlement-upon-land-expropriation-state", 
                "title": "Government of Vietnam. 2014. Regulations on Compensation, Support, and Resettlement Upon Land Expropriation By the State."
            }
        ]
    }, 
    {
        "country": "Zambia", 
        "iso3": "ZMB", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject706/constitution-zambia-1991-rev-2009", 
                "title": "Government of Zambia. 2016. Constitution of Zambia."
            }, 
            {
                "link": "http://landportal.org/library/resources/lands-act-1995", 
                "title": "Government of Zambia. 1995. Land Act No. 29 of 1995."
            }, 
            {
                "link": "http://landportal.org/library/resources/lands-acquisition-act1970", 
                "title": "Government of Zambia. 1970. Land Acquisition Act."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-acquisition-prescribed-forms-regulations", 
                "title": "Land Acquisition (Prescribed Forms) Regulations (Cap. 189)."
            }
        ]
    }, 
    {
        "country": "Zimbabwe", 
        "iso3": "ZWE", 
        "laws": [
            {
                "link": "http://landportal.org/library/resources/constituteproject1011/constitution-zimbabwe-2013", 
                "title": "Government of Zimbabwe. 2013. Constitution of Zimbabwe."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-acquisition-act-1992", 
                "title": "Government of Zimbabwe. 1992. Land Acquisition Act (CAP 20:10)."
            }, 
            {
                "link": "http://landportal.org/library/resources/land-acquisition-disposal-rural-land-regulations", 
                "title": "Government of Zimbabwe. 1999. Land Acquisition (Disposal of Rural Land) Regulations (S.I. No. 287 of 1999)."
            }, 
            {
                "link": "http://landportal.org/library/resources/communal-land-act", 
                "title": "Government of Zimbabwe. 1982. Communal Land Act, No. 2 of 1982 (2002)."
            }
        ]
    }
];
