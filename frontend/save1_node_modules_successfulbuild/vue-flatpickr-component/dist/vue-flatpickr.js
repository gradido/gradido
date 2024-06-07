(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("flatpickr"));
	else if(typeof define === 'function' && define.amd)
		define("VueFlatpickr", ["flatpickr"], factory);
	else if(typeof exports === 'object')
		exports["VueFlatpickr"] = factory(require("flatpickr"));
	else
		root["VueFlatpickr"] = factory(root["flatpickr"]);
})(typeof self !== 'undefined' ? self : this, function(__WEBPACK_EXTERNAL_MODULE__0__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE__0__;

/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, "Component", function() { return /* reexport */ component; });
__webpack_require__.d(__webpack_exports__, "Plugin", function() { return /* binding */ src_Plugin; });

// EXTERNAL MODULE: external "flatpickr"
var external_flatpickr_ = __webpack_require__(0);
var external_flatpickr_default = /*#__PURE__*/__webpack_require__.n(external_flatpickr_);

// CONCATENATED MODULE: ./src/events.js
// Events to emit, copied from flatpickr source
var includedEvents = ['onChange', 'onClose', 'onDestroy', 'onMonthChange', 'onOpen', 'onYearChange']; // Let's not emit these events by default

var excludedEvents = ['onValueUpdate', 'onDayCreate', 'onParseConfig', 'onReady', 'onPreCalendarPosition', 'onKeyDown'];

// CONCATENATED MODULE: ./src/util.js
function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var camelToKebab = function camelToKebab(string) {
  return string.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
};

var arrayify = function arrayify(obj) {
  return obj instanceof Array ? obj : [obj];
};

var cloneObject = function cloneObject(obj) {
  return _extends({}, obj);
};


// CONCATENATED MODULE: ./src/component.js


 // You have to import css yourself
// Keep a copy of all events for later use

var allEvents = includedEvents.concat(excludedEvents); // Passing these properties in `set()` method will cause flatpickr to trigger some callbacks

var configCallbacks = ['locale', 'showMonths'];
/* harmony default export */ var component = ({
  name: 'flat-pickr',
  render: function render(el) {
    return el('input', {
      attrs: {
        type: 'text',
        'data-input': true
      },
      props: {
        disabled: this.disabled
      },
      on: {
        input: this.onInput
      }
    });
  },
  props: {
    value: {
      "default": null,
      required: true,
      validator: function validator(value) {
        return value === null || value instanceof Date || typeof value === 'string' || value instanceof String || value instanceof Array || typeof value === 'number';
      }
    },
    // https://chmln.github.io/flatpickr/options/
    config: {
      type: Object,
      "default": function _default() {
        return {
          wrap: false,
          defaultDate: null
        };
      }
    },
    events: {
      type: Array,
      "default": function _default() {
        return includedEvents;
      }
    },
    disabled: {
      type: Boolean,
      "default": false
    }
  },
  data: function data() {
    return {
      /**
       * The flatpickr instance
       */
      fp: null
    };
  },
  mounted: function mounted() {
    var _this = this;

    // Return early if flatpickr is already loaded

    /* istanbul ignore if */
    if (this.fp) return; // Don't mutate original object on parent component

    var safeConfig = cloneObject(this.config);
    this.events.forEach(function (hook) {
      // Respect global callbacks registered via setDefault() method
      var globalCallbacks = external_flatpickr_default.a.defaultConfig[hook] || []; // Inject our own method along with user callback

      var localCallback = function localCallback() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        _this.$emit.apply(_this, [camelToKebab(hook)].concat(args));
      }; // Overwrite with merged array


      safeConfig[hook] = arrayify(safeConfig[hook] || []).concat(globalCallbacks, localCallback);
    }); // Set initial date without emitting any event

    safeConfig.defaultDate = this.value || safeConfig.defaultDate; // Init flatpickr

    this.fp = new external_flatpickr_default.a(this.getElem(), safeConfig); // Attach blur event

    this.fpInput().addEventListener('blur', this.onBlur);
    this.$on('on-close', this.onClose); // Immediate watch will fail before fp is set,
    // so need to start watching after mount

    this.$watch('disabled', this.watchDisabled, {
      immediate: true
    });
  },
  methods: {
    /**
     * Get the HTML node where flatpickr to be attached
     * Bind on parent element if wrap is true
     */
    getElem: function getElem() {
      return this.config.wrap ? this.$el.parentNode : this.$el;
    },

    /**
     * Watch for value changed by date-picker itself and notify parent component
     *
     * @param event
     */
    onInput: function onInput(event) {
      var _this2 = this;

      var input = event.target; // Lets wait for DOM to be updated

      this.$nextTick(function () {
        _this2.$emit('input', input.value);
      });
    },

    /**
     * @return HTMLElement
     */
    fpInput: function fpInput() {
      return this.fp.altInput || this.fp.input;
    },

    /**
     * Blur event is required by many validation libraries
     *
     * @param event
     */
    onBlur: function onBlur(event) {
      this.$emit('blur', event.target.value);
    },

    /**
     * Flatpickr does not emit input event in some cases
     */
    onClose: function onClose(selectedDates, dateStr) {
      this.$emit('input', dateStr);
    },

    /**
     * Watch for the disabled property and sets the value to the real input.
     *
     * @param newState
     */
    watchDisabled: function watchDisabled(newState) {
      if (newState) {
        this.fpInput().setAttribute('disabled', newState);
      } else {
        this.fpInput().removeAttribute('disabled');
      }
    }
  },
  watch: {
    /**
     * Watch for any config changes and redraw date-picker
     *
     * @param newConfig Object
     */
    config: {
      deep: true,
      handler: function handler(newConfig) {
        var _this3 = this;

        var safeConfig = cloneObject(newConfig); // Workaround: Don't pass hooks to configs again otherwise
        // previously registered hooks will stop working
        // Notice: we are looping through all events
        // This also means that new callbacks can not passed once component has been initialized

        allEvents.forEach(function (hook) {
          delete safeConfig[hook];
        });
        this.fp.set(safeConfig); // Workaround: Allow to change locale dynamically

        configCallbacks.forEach(function (name) {
          if (typeof safeConfig[name] !== 'undefined') {
            _this3.fp.set(name, safeConfig[name]);
          }
        });
      }
    },

    /**
     * Watch for changes from parent component and update DOM
     *
     * @param newValue
     */
    value: function value(newValue) {
      // Prevent updates if v-model value is same as input's current value
      if (newValue === this.$el.value) return; // Make sure we have a flatpickr instance

      this.fp && // Notify flatpickr instance that there is a change in value
      this.fp.setDate(newValue, true);
    }
  },

  /**
   * Free up memory
   */
  beforeDestroy: function beforeDestroy() {
    /* istanbul ignore else */
    if (this.fp) {
      this.fpInput().removeEventListener('blur', this.onBlur);
      this.fp.destroy();
      this.fp = null;
    }
  }
});
// CONCATENATED MODULE: ./src/index.js


var src_Plugin = function Plugin(Vue, params) {
  var name = 'flat-pickr';
  /* istanbul ignore else */

  if (typeof params === 'string') name = params;
  Vue.component(name, component);
};

component.install = src_Plugin;
/* harmony default export */ var src = __webpack_exports__["default"] = (component);


/***/ })
/******/ ])["default"];
});