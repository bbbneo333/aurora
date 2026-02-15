/**
 * MIT License

 Copyright (c) 2018 Lindsay Evans

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 outline.js v1.2.0 - https://github.com/lindsayevans/outline.js
 */

const debug = require('debug')('aurora:vendor:js:outline');

(function (d) {

  var style_element = d.createElement('STYLE'),
    dom_events = 'addEventListener' in d,
    add_event_listener = function (type, callback) {
      // Basic cross-browser event handling
      if (dom_events) {
        d.addEventListener(type, callback);
      } else {
        d.attachEvent('on' + type, callback);
      }
    },
    set_css = function (css_text) {
      // Handle setting of <style> element contents in IE8
      !!style_element.styleSheet ? style_element.styleSheet.cssText = css_text : style_element.innerHTML = css_text;
    };

  d.getElementsByTagName('HEAD')[0].appendChild(style_element);

  debug('adding listeners');

  // Using mousedown instead of mouseover, so that previously focused elements don't lose focus ring on mouse move
  add_event_listener('mousedown', function () {
    set_css(':focus{outline:0}::-moz-focus-inner{border:0;}');
  });

  // This is slightly different from the original implementation
  // We are only enabling outlines when Tab is pressed
  add_event_listener('keydown', function (event) {
    if (event.code === 'Tab') {
      set_css('');
    }
  });
})(document);
