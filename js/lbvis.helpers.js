//Funcion para recoger las variables de la URL
function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    	vars[key] = value;
    });
    return vars;
}


function truncateString (string, limit, breakChar, rightPad) {
    if (string.length <= limit) return string;
    
    var substr = string.substr(0, limit);
    if ((breakPoint = substr.lastIndexOf(breakChar)) >= 0) {
        if (breakPoint < string.length -1) {
            return string.substr(0, breakPoint) + rightPad;
        }
    }
}

// // un-used?
// Array.prototype.containsIndicator = function(indicatorURL) {
//     var i = this.length;
//     while (i--) {
//         if (this[i].url == indicatorURL) {
//             return i;
//         }
//     }
//     return -1;
// };

function setNameCountry(iso3) {
    for(var i = 0; i < countrieNameIso3.length; i++ ){
	if (countrieNameIso3[i].iso3 == iso3){
	    return countrieNameIso3[i].name;
	}
    }
    return false;
}
