/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



var SECONDS_TO_YEAR = 31536000;
var SECONDS_TO_DAY = 86400;
var SECONDS_TO_HOUR = 3600;
var SECONDS_TO_MINUTE = 60;
SECONDS_TO = {
  YEAR: SECONDS_TO_YEAR,
  DAY: SECONDS_TO_DAY,
  HOUR: SECONDS_TO_HOUR,
  MINUTE: SECONDS_TO_MINUTE
};
      
  

function getReadableAge(timestamp) {
  if(timestamp === undefined) {
    return "no timestamp"
  }
  var ageSeconds = ((new Date()).getTime()/1000) - timestamp;
  if(ageSeconds < SECONDS_TO_MINUTE) {
    return Math.round(ageSeconds) + " seconds";
  } else if(ageSeconds < SECONDS_TO_HOUR) {
    return "~ " + Math.round(ageSeconds / SECONDS_TO_MINUTE) + " minutes";
  } else if(ageSeconds < SECONDS_TO_DAY) {
    return "~ " + Math.round(ageSeconds / SECONDS_TO_HOUR) + " hours";
  } else if(ageSeconds < SECONDS_TO_YEAR) {
    return "~ " + Math.round(ageSeconds / SECONDS_TO_DAY) + " days";
  } else {
    return "~ " + Math.round(ageSeconds / SECONDS_TO_YEAR) + " years";
  }
}

function getExactTimeDuration(durationSeconds) {
  var parts = {
    seconds: durationSeconds,
    minutes: 0,
    hours: 0,
    days: 0,
    years: 0
  };
  var durationString = '';
  for(var i in SECONDS_TO) {
    if(parts.seconds > SECONDS_TO[i]) {
      var partIndexName = i.toLowerCase() + 's';
      parts[partIndexName] = Math.floor(parts.seconds / SECONDS_TO[i]);
      parts.seconds -= parts[partIndexName] * SECONDS_TO[i];
      if(durationString.length > 0) {
        durationString += ', ';
      }
      var unitName = partIndexName;
      if(parts[partIndexName] === 1) {
        unitName = partIndexName.substring(0, partIndexName.length-1);
      }
      durationString += parts[partIndexName] + ' ' + unitName;
      break;
    }
    
  }
  return durationString;
  
}