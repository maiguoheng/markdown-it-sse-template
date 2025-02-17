/* eslint-disable */

(function (doc, win) {
  function setRemByWidth(width) {
    // 避免文字太大
    if (width >= 600) {
      let size = 100 * (width - 600) / 375 / 1.8 + 136
      docEl.style.fontSize = '' + size + 'px';
    } else if (width > 450) {
      let size = 100 * (width - 450) / 375 / 2.5 + 120
      docEl.style.fontSize = size + 'px';

    } else {
      docEl.style.fontSize = 100 * (width / 375) + 'px';
    }
  }
  var docEl = doc.documentElement,
    resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize',
    recalc = function () {
      var clientWidth = docEl.clientWidth;
      if (!clientWidth) return;
      setRemByWidth(clientWidth);
    };

  if (!doc.addEventListener) return;
  win.addEventListener(resizeEvt, recalc, false);
  doc.addEventListener('DOMContentLoaded', recalc, false);
})(document, window);
