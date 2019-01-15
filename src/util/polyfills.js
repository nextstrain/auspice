/* eslint-disable */

import "babel-polyfill";

import "whatwg-fetch";

window.Promise = require('es6-promise-polyfill').Promise;

require('es6-object-assign/auto');

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith#Polyfill
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(search, pos) {
    return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
  };
}
