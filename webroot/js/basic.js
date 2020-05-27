// cross browser dom is ready module from:
// https://www.competa.com/blog/cross-browser-document-ready-with-vanilla-javascript/
var domIsReady = (function(domIsReady) {
   var isBrowserIeOrNot = function() {
      return (!document.attachEvent || typeof document.attachEvent === "undefined" ? 'not-ie' : 'ie');
   }

   domIsReady = function(callback) {
      if(callback && typeof callback === 'function'){
         if(isBrowserIeOrNot() !== 'ie') {
            document.addEventListener("DOMContentLoaded", function() {
               return callback();
            });
         } else {
            document.attachEvent("onreadystatechange", function() {
               if(document.readyState === "complete") {
                  return callback();
               }
            });
         }
      } else {
         console.error('The callback is not a function!');
      }
   }

   return domIsReady;
})(domIsReady || {});


// vanilla ajax request, json get
function getJson(basisUrl, method, successFunction, errorFunction, timeoutFunction) {
  var xhr = new XMLHttpRequest();

  xhr.onload = function(e) {
    var xhr = e.target;
    //console.log(xhr);
    var jsonReturn = [];
    if (xhr.responseType === 'json') {
        jsonReturn = xhr.response;
    } else {
        jsonReturn = JSON.parse(xhr.responseText);
    }
    successFunction(jsonReturn);
  }
  xhr.onerror = function(e) {
    errorFunction(e);
  }
  xhr.ontimeout = function(e) {
    timeoutFunction(e);
  }

  var bustCache =  '&' + new Date().getTime();
  //oReq.open('GET', e.target.dataset.url + bustCache, true);
  xhr.open('GET', basisUrl + '?method='+method + bustCache, true);
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xhr.responseType = 'json';
  xhr.send();
}


/*
 * var el = document.querySelector('.toggle-me');

el.onclick = function() {
  el.classList.toggle('active');
}
 */

// cross browser dom is ready
(function(document, window, domIsReady, undefined) {
   domIsReady(function() {
      //console.log('My DOM is ready peeps!');
      //document.querySelector('#page').style.background = 'blue';

      //var Body = $("body");
      var DesktopToggler = document.querySelector('.nav-main-button');
      var MobileToggler = document.querySelector('.t-header-mobile-toggler');
      var HeaderToggle = document.querySelector('.t-header-toggler');

      // SIDEBAR TOGGLE FUNCTION FOR LARGE SCREENS (SCREEN "LG" AND UP)
      if(DesktopToggler) {
        DesktopToggler.addEventListener('click', function ()
        {
          console.log('toggler clicked / Desktop');
          //$(Body).toggleClass("sidebar-minimized");
          document.querySelector('.nav-menu').classList.toggle('nav-menu-minimized');
          document.querySelector('.nav-menu').classList.toggle('nav-menu-maximized');
          let big = document.querySelectorAll('.logo.big');
          big.forEach(function(el) {
            el.classList.toggle('visible');
          });
          let small = document.querySelectorAll('.logo.small');
          small.forEach(function(el) {
            el.classList.toggle('visible');
          });
        });
      }

      // SIDEBAR TOGGLE FUNCTION FOR MOBILE (SCREEN "MD" AND DOWN)
      if(MobileToggler) {
        MobileToggler.addEventListener('click', function () {
          document.querySelector('.page-body').classList.toggle('sidebar-collpased');
        });
      }
      if(HeaderToggle) {
        HeaderToggle.addEventListener('click', function () {
          HeaderToggle.classList.toggle('arrow');
        });
      }
   });
})(document, window, domIsReady);