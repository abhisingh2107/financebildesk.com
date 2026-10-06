/* Fills every .ad-slot from ads-config.js. Safe to run with no ads configured. */
(function(){
  var C = window.TK_ADS || {};
  var libLoaded = false;
  var preview = /[?&]adpreview/.test(location.search);

  function loadLib(){
    if(libLoaded||!C.client) return;
    if(document.querySelector('script[src*="adsbygoogle.js"]')){libLoaded=true;return;}
    libLoaded = true;
    var s = document.createElement('script');
    s.async = true; s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(C.client);
    document.head.appendChild(s);
  }

  var slots = document.querySelectorAll('.ad-slot');
  for(var i=0;i<slots.length;i++){
    (function(el){
      var name = el.getAttribute('data-slot');
      var box = el.querySelector('.ad-box');
      var custom = C.custom && C.custom[name];

      if(custom){
        box.appendChild(document.createRange().createContextualFragment(custom));
        return;
      }
      if(C.enabled && C.client && C.slots && C.slots[name]){
        var ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.display = 'block';
        ins.setAttribute('data-ad-client', C.client);
        ins.setAttribute('data-ad-slot', C.slots[name]);
        ins.setAttribute('data-ad-format', 'auto');
        ins.setAttribute('data-full-width-responsive', 'true');
        box.appendChild(ins);
        loadLib();
        try{ (window.adsbygoogle = window.adsbygoogle || []).push({}); }catch(e){}
        return;
      }
      if(C.showPlaceholders || preview){
        box.innerHTML = '<div class="ad-ph"><b>Ad space</b><span>slot: ' + name + '</span></div>';
        return;
      }
      el.hidden = true;
    })(slots[i]);
  }
})();
