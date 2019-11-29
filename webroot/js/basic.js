/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

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
      var DesktopToggler = document.querySelector('.t-header-desk-toggler');
      var MobileToggler = document.querySelector('.t-header-mobile-toggler');
      var HeaderToggle = document.querySelector('.t-header-toggler');      
      
      // SIDEBAR TOGGLE FUNCTION FOR LARGE SCREENS (SCREEN "LG" AND UP)
      if(DesktopToggler) {
        DesktopToggler.addEventListener('click', function () 
        {
          //$(Body).toggleClass("sidebar-minimized");
          document.body.classList.toggle('sidebar-minimized');
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