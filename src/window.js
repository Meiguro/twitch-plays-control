/* global unsafeWindow */
module.exports = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
