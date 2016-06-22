//console.log(j)
					//console.log(window.ELGAF_indicators[j]);

					

					
					var base = window.LGAF_year_value[j];
					var baseJ = base.substr(0, base.lastIndexOf('.'));
					//console.log(baseJ);
					//$.each(LGAF_year_value, function( i, val ) {
					for(var x=0; x < LGAF_year_value.length; x++) {	
						
						var idData = LGAF_year_value[x].id;
						var idDataX = idData.substr(0, idData.lastIndexOf('.'));
						//console.log("idData: "+idData+"-"+idDataX+" "+baseJ);

						if(base == idDataX) {
							//console.log(idData);
							console.log("base: "+base+"-"+idDataX);
						}

						// var idPanel = val.id;
						// var idPanel = idPanel.substr(0, idPanel.lastIndexOf('.')); //Extraemos el valor antes del último "."

						// if(idPanel == subpanel) {
						// 	if(iValue=="" || iValue==undefined)iValue='na';
						// 	//console.log("nvalores: "+iValue.length);
						// 	//console.log("Indicador: "+val.name+" Id: "+iValue);
						// 	//console.log("Indicador: "+val.id+" Id: "+id);
						// 	console.log("Panel: "+idPanel+" subpanel: "+subpanel);
						// 	if(iValue.length <= 1) {
						// 		row += '<li class="item-q fos r-pos"><span class="txt-s cqdata cqdata-'+iValue.toLowerCase()+'"></span> '+val.name+'</li>';
						// 	}else{
						// 		var split = iValue.split("-");
						// 		row += '<li class="item-q fos r-pos"><span class="txt-s cqdata-il-sml cqdata-'+split[0].toLowerCase()+'"></span><span class="txt-s cqdata-il-smr cqdata-'+split[1].toLowerCase()+'"></span> '+val.name+'</li>';
						// 	}
							
						// 	//row += '<li class="item-q fos r-pos"><span class="txt-s cqdata cqdata-'+iValue.toLowerCase()+'"></span> '+val.name+'</li>';
						// 	//row += '<li class="item-q fos r-pos"><span class="txt-s cqdata cqdata-'+iValue.toLowerCase()+'">'+iValue+'</span> '+val.name+'</li>';
						// }
						
					}