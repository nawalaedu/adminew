/* ==========================================================
   GITHUB PAGES -> GOOGLE APPS SCRIPT COMPATIBILITY LAYER
   Mempertahankan API google.script.run yang dipakai HTML lama.
   Transport: JSONP GET agar GitHub Pages tidak terkena CORS.
========================================================== */

const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbyKiFoHDndz1UKjfaUdqCu-Ws8vhmOwEjzQljfQkFZb-kU28csjZgt4bvSL5IqhklUnRA/exec';
const GAS_API_KEY = 'ADMIN-515KA';

(function(){
  let successHandler = null;
  let failureHandler = null;

  function currentPage(){
    const p=(location.pathname||'').toLowerCase();
    if(p.includes('artikel')) return 'artikel';
    if(p.includes('ijp')) return 'ijp';
    if(p.includes('data')) return 'data';
    return 'buku';
  }

  function normalizeCall(method,args){
    let payload = args && args.length ? args.slice() : [];

    if(method === 'simpanOrder'){
      payload=[Object.assign({},payload[0]||{}, {_page:currentPage()})];
    }
    if(method === 'simpanAuthor'){
      payload=[Object.assign({},payload[0]||{}, {_page:currentPage()})];
    }
    if(method === 'ambilDaftarOrder'){
      payload=[currentPage()];
    }
    if(method === 'ambilDetailOrder'){
      payload=[Object.assign({}, (typeof payload[0]==='object'?payload[0]:{idOrder:payload[0]}), {_page:currentPage()})];
    }
    return payload;
  }

  function callGas(method,args){
    const payload=normalizeCall(method,args);
    return new Promise(function(resolve,reject){
      const cb='__gas_cb_'+Date.now()+'_'+Math.floor(Math.random()*100000);
      const script=document.createElement('script');
      let timer=null;

      function cleanup(){
        if(timer) clearTimeout(timer);
        try{delete window[cb];}catch(e){window[cb]=undefined;}
        if(script.parentNode) script.parentNode.removeChild(script);
      }

      window[cb]=function(result){
        cleanup();
        if(result && result.success===false){
          reject(new Error(result.message||'Google Apps Script error'));
          return;
        }
        resolve(result);
      };

      script.onerror=function(){cleanup();reject(new Error('Tidak dapat menghubungi Google Apps Script. Pastikan Web App GAS sudah di-deploy sebagai akses publik.'));};
      timer=setTimeout(function(){cleanup();reject(new Error('Request ke Google Apps Script timeout (30 detik).'));},30000);

      const params=new URLSearchParams();
      params.set('key',GAS_API_KEY);
      params.set('method',method);
      params.set('callback',cb);
      params.set('data',JSON.stringify(payload));
      script.src=GAS_API_URL+'?'+params.toString();
      document.head.appendChild(script);
    });
  }

  const runProxy=new Proxy({}, {
    get:function(_,method){
      if(method==='withSuccessHandler') return function(fn){successHandler=fn;return runProxy;};
      if(method==='withFailureHandler') return function(fn){failureHandler=fn;return runProxy;};
      return function(){
        const args=Array.prototype.slice.call(arguments);
        const s=successHandler, f=failureHandler;
        successHandler=null; failureHandler=null;
        callGas(method,args).then(function(result){if(typeof s==='function')s(result);}).catch(function(error){if(typeof f==='function')f(error);else console.error(error);});
      };
    }
  });

  window.google=window.google||{};
  window.google.script=window.google.script||{};
  window.google.script.run=runProxy;
})();
