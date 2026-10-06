/* FinanceBilldesk shared script. Each tool starts only if its elements exist on the page. */
(function(){
  var $ = function(id){return document.getElementById(id)};
  var num = function(id){var e=$(id);if(!e)return 0;var v=parseFloat(e.value);return isFinite(v)&&v>0?v:0};
  var esc = function(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};

  /* currency, remembered across pages */
  var LOC = {USD:'en-US',CAD:'en-CA',GBP:'en-GB',EUR:'de-DE',AUD:'en-AU',INR:'en-IN',AED:'en-AE',SGD:'en-SG'};
  var cur = $('currency');
  try{var saved=localStorage.getItem('fbd-cur');if(saved&&LOC[saved]&&cur)cur.value=saved}catch(e){}
  var code = function(){return cur?cur.value:'USD'};
  var money = function(n,d){
    try{return new Intl.NumberFormat(LOC[code()]||'en-US',{style:'currency',currency:code(),maximumFractionDigits:d,minimumFractionDigits:d}).format(n)}
    catch(e){return code()+' '+n.toFixed(d)}
  };
  var fmt = function(n){return money(n,2)};
  var fmt0 = function(n){return money(n,0)};
  var pct = function(n){return (isFinite(n)?n:0).toFixed(1)+'%'};
  var dur = function(m){var y=Math.floor(m/12),r=m%12;return y+' yr '+r+' mo'};

  /* pure formulas */
  function amort(P,apr,years,extra){
    var n=Math.round(years*12), r=apr/1200;
    if(!P||!n) return {pay:0,months:0,interest:0,total:0,n:n};
    var pay = r ? P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1) : P/n;
    var bal=P,m=0,intr=0,x=extra>0?extra:0;
    while(bal>0.005&&m<n){
      var i=bal*r, princ=pay+x-i;
      if(princ>bal)princ=bal;
      bal-=princ;intr+=i;m++;
    }
    return {pay:pay,months:m,interest:intr,total:P+intr,n:n};
  }
  function mortgage(price,downPct,rate,years,taxPct,insYr,hoaMo){
    var down=price*Math.min(downPct,100)/100, loan=price-down, a=amort(loan,rate,years,0);
    var tax=price*taxPct/100/12, ins=insYr/12;
    return {down:down,loan:loan,pi:a.pay,tax:tax,ins:ins,hoa:hoaMo,total:a.pay+tax+ins+hoaMo,interest:a.interest};
  }
  function compound(P,M,rate,years){
    var n=Math.round(years*12), r=rate/1200, g=Math.pow(1+r,n);
    var fv = r ? P*g+M*((g-1)/r) : P+M*n, contrib=P+M*n;
    return {fv:fv,contrib:contrib,interest:fv-contrib};
  }
  function goal(G,P,rate,years){
    var n=Math.round(years*12), r=rate/1200;
    if(!n) return {monthly:0,deposits:0,interest:0,hit:false};
    var g=Math.pow(1+r,n), grown=P*g, need=G-grown;
    var m = need<=0 ? 0 : (r ? need*r/(g-1) : need/n);
    var fv = grown+(r ? m*((g-1)/r) : m*n);
    return {monthly:m,deposits:m*n,interest:fv-P-m*n,hit:need<=0};
  }
  function tax(a,rate,add){
    var k=rate/100;
    if(add){return {base:a,tax:a*k,total:a+a*k}}
    var base=a/(1+k);return {base:base,tax:a-base,total:a};
  }
  function margin(c,s){
    var p=s-c;
    return {profit:p,margin:s?p/s*100:0,markup:c?p/c*100:0};
  }
  window.__tk={amort:amort,mortgage:mortgage,compound:compound,goal:goal,tax:tax,margin:margin};

  var renders=[];
  function renderAll(){renders.forEach(function(f){f()})}
  var row = function(k,v,big){return '<div'+(big?' class="big"':'')+'><dt>'+k+'</dt><dd>'+v+'</dd></div>'};

  /* ---------- invoice ---------- */
  var items=[{d:'Brand identity design',q:1,r:1200},{d:'Social media kit (10 posts)',q:2,r:180},{d:'Revision rounds',q:3,r:40}];
  if($('paper')){
    var today=function(add){var d=new Date();d.setDate(d.getDate()+add);return d.toISOString().slice(0,10)};
    $('in-date').value=today(0);$('in-due').value=today(30);
    var drawItems=function(){
      $('items').innerHTML=items.map(function(it,i){
        return '<div class="row" data-i="'+i+'">'+
          '<input class="it-d" type="text" aria-label="Description" value="'+esc(it.d)+'">'+
          '<input class="it-q" type="number" inputmode="decimal" min="0" aria-label="Quantity" value="'+esc(it.q)+'">'+
          '<input class="it-r" type="number" inputmode="decimal" min="0" aria-label="Rate" value="'+esc(it.r)+'">'+
          '<button type="button" class="x" data-del="'+i+'" aria-label="Remove line">×</button></div>';
      }).join('');
    };
    var invoiceData=function(){
      var sub=0;items.forEach(function(it){sub+=(parseFloat(it.q)||0)*(parseFloat(it.r)||0)});
      var disc=sub*Math.min(num('in-disc'),100)/100, taxable=sub-disc, t=taxable*num('in-tax')/100;
      return {sub:sub,disc:disc,tax:t,total:taxable+t};
    };
    var drawPaper=function(){
      var d=invoiceData(), rows=items.filter(function(it){return it.d||it.r}).map(function(it){
        var q=parseFloat(it.q)||0,r=parseFloat(it.r)||0;
        return '<tr><td>'+esc(it.d)+'</td><td class="r">'+q+'</td><td class="r">'+fmt(r)+'</td><td class="r">'+fmt(q*r)+'</td></tr>';
      }).join('');
      var tr=num('in-tax'), dr=num('in-disc');
      $('paper').innerHTML=
        '<div class="top"><h2>Invoice</h2><div class="meta">No. '+esc($('in-no').value||'-')+'<br>Date '+esc($('in-date').value||'-')+'<br>Due '+esc($('in-due').value||'-')+'</div></div>'+
        '<div class="parties"><div><div class="k">From</div><strong>'+esc($('in-from').value||'Your business')+'</strong>'+($('in-taxid').value?'<br><span class="mono">EIN '+esc($('in-taxid').value)+'</span>':'')+'</div>'+
        '<div><div class="k">Bill to</div><strong>'+esc($('in-to').value||'Client')+'</strong></div></div>'+
        '<div class="tbl"><table><thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
        '<div class="totals mono"><div><span>Subtotal</span><span>'+fmt(d.sub)+'</span></div>'+
        (dr?'<div><span>Discount ('+dr+'%)</span><span>-'+fmt(d.disc)+'</span></div>':'')+
        '<div><span>Sales tax ('+tr+'%)</span><span>'+fmt(d.tax)+'</span></div>'+
        '<div class="grand"><span>Total due</span><span>'+fmt(d.total)+'</span></div></div>'+
        ($('in-notes').value?'<div class="notes">'+esc($('in-notes').value)+'</div>':'');
    };
    var invoiceText=function(){
      var d=invoiceData(),L=[];
      L.push('INVOICE '+($('in-no').value||''));
      L.push('From: '+$('in-from').value+($('in-taxid').value?' (EIN '+$('in-taxid').value+')':''));
      L.push('Bill to: '+$('in-to').value);
      L.push('Date: '+$('in-date').value+'   Due: '+$('in-due').value);
      L.push('');
      items.forEach(function(it){var q=parseFloat(it.q)||0,r=parseFloat(it.r)||0;L.push(it.d+' | '+q+' x '+fmt(r)+' = '+fmt(q*r))});
      L.push('');
      L.push('Subtotal: '+fmt(d.sub));
      if(num('in-disc'))L.push('Discount ('+num('in-disc')+'%): -'+fmt(d.disc));
      L.push('Sales tax ('+num('in-tax')+'%): '+fmt(d.tax));
      L.push('TOTAL DUE: '+fmt(d.total));
      if($('in-notes').value){L.push('');L.push($('in-notes').value)}
      return L.join('\n');
    };
    renders.push(drawPaper);
    $('add-item').onclick=function(){items.push({d:'',q:1,r:0});drawItems();renderAll()};
    var pb=$('print-inv');if(pb)pb.onclick=function(){try{window.print()}catch(e){}};
    $('copy-inv').onclick=function(){
      var txt=invoiceText(),msg=$('copy-msg');
      var ok=function(){msg.textContent='Invoice text copied.'};
      var fail=function(){
        var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();
        try{document.execCommand('copy');ok()}catch(e){msg.textContent='Copy was blocked. Select the invoice on the right and copy it manually.'}
        document.body.removeChild(ta);
      };
      try{navigator.clipboard.writeText(txt).then(ok,fail)}catch(e){fail()}
    };
    drawItems();
  }

  /* ---------- budget ---------- */
  var exp=[
    {n:'Rent',g:'need',a:1500},{n:'Groceries',g:'need',a:450},{n:'Utilities & internet',g:'need',a:220},{n:'Car & gas',g:'need',a:380},{n:'Insurance',g:'need',a:250},
    {n:'Dining out',g:'want',a:400},{n:'Streaming & subscriptions',g:'want',a:90},{n:'Shopping',g:'want',a:350},{n:'Entertainment',g:'want',a:260},
    {n:'401(k) / Roth IRA',g:'save',a:800},{n:'Emergency fund',g:'save',a:200}
  ];
  if($('b-rows')){
    var GN={need:'Needs',want:'Wants',save:'Savings'}, GT={need:50,want:30,save:20};
    var drawExp=function(){
      $('b-rows').innerHTML=exp.map(function(e,i){
        return '<div class="row b" data-i="'+i+'">'+
          '<input class="e-n" type="text" aria-label="Expense name" value="'+esc(e.n)+'">'+
          '<select class="e-g" aria-label="Type">'+['need','want','save'].map(function(g){return '<option value="'+g+'"'+(g===e.g?' selected':'')+'>'+GN[g]+'</option>'}).join('')+'</select>'+
          '<input class="e-a" type="number" inputmode="decimal" min="0" aria-label="Amount" value="'+esc(e.a)+'">'+
          '<button type="button" class="x" data-bdel="'+i+'" aria-label="Remove expense">×</button></div>';
      }).join('');
    };
    var drawBudget=function(){
      var inc=num('b-income'),tot={need:0,want:0,save:0},sum=0;
      exp.forEach(function(e){var a=parseFloat(e.a)||0;tot[e.g]+=a;sum+=a});
      var left=inc-sum;
      $('b-sum').innerHTML=
        '<div class="stat"><div class="k">Income</div><div class="v">'+fmt0(inc)+'</div></div>'+
        '<div class="stat"><div class="k">Planned</div><div class="v">'+fmt0(sum)+'</div></div>'+
        '<div class="stat"><div class="k">'+(left>=0?'Left over':'Over by')+'</div><div class="v '+(left>=0?'good':'bad')+'">'+fmt0(Math.abs(left))+'</div></div>';
      $('b-grp').innerHTML=['need','want','save'].map(function(g){
        var p=inc?tot[g]/inc*100:0, over=(g!=='save')&&p>GT[g];
        return '<div><div class="line"><span><strong>'+GN[g]+'</strong> <span class="hint">target '+GT[g]+'%</span></span><span class="mono">'+fmt0(tot[g])+' · '+pct(p)+'</span></div>'+
          '<div class="track"><div class="fill'+(over?' over':'')+'" style="width:'+Math.min(p,100)+'%"></div><div class="tick" style="left:calc('+GT[g]+'% - 1px)"></div></div></div>';
      }).join('');
    };
    renders.push(drawBudget);
    $('b-add').onclick=function(){exp.push({n:'',g:'need',a:0});drawExp();renderAll()};
    drawExp();
  }

  /* ---------- calculators ---------- */
  if($('ln-out')) renders.push(function(){
    var a=amort(num('ln-p'),num('ln-r'),num('ln-y'),0), b=amort(num('ln-p'),num('ln-r'),num('ln-y'),num('ln-x'));
    var h=row('Monthly payment',fmt(a.pay),1)+row('Total interest',fmt(b.interest))+row('Total paid',fmt(b.total))+row('Payoff time',dur(b.months));
    if(num('ln-x')>0) h+=row('Interest saved',fmt(a.interest-b.interest))+row('Time saved',dur(a.months-b.months));
    $('ln-out').innerHTML=h;
  });
  if($('mt-out')) renders.push(function(){
    var m=mortgage(num('mt-price'),num('mt-down'),num('mt-rate'),num('mt-term'),num('mt-tax'),num('mt-ins'),num('mt-hoa'));
    $('mt-out').innerHTML=row('Monthly payment',fmt(m.total),1)+row('Principal &amp; interest',fmt(m.pi))+row('Property tax',fmt(m.tax))+row('Home insurance',fmt(m.ins))+(m.hoa?row('HOA dues',fmt(m.hoa)):'')+row('Down payment',fmt0(m.down))+row('Loan amount',fmt0(m.loan))+row('Total interest',fmt0(m.interest));
  });
  if($('ci-out')) renders.push(function(){
    var c=compound(num('ci-p'),num('ci-m'),num('ci-r'),num('ci-y'));
    $('ci-out').innerHTML=row('Future value',fmt0(c.fv),1)+row('Total contributed',fmt0(c.contrib))+row('Interest earned',fmt0(c.interest));
  });
  if($('sg-out')) renders.push(function(){
    var g=goal(num('sg-g'),num('sg-p'),num('sg-r'),num('sg-y'));
    $('sg-out').innerHTML=(g.hit?row('Monthly deposit needed',fmt(0),1)+row('Status','Goal reached by growth alone'):row('Monthly deposit needed',fmt(g.monthly),1)+row('Total deposits',fmt0(g.deposits)))+row('Interest earned',fmt0(g.interest));
  });
  var addTax=true;
  if($('tx-out')){
    var drawTax=function(){
      var t=tax(num('tx-a'),num('tx-r'),addTax);
      $('tx-out').innerHTML=row(addTax?'Total with tax':'Price before tax',fmt(addTax?t.total:t.base),1)+row('Sales tax amount',fmt(t.tax))+row('Pre-tax price',fmt(t.base))+row('After-tax price',fmt(t.total));
    };
    renders.push(drawTax);
    var setMode=function(a){addTax=a;$('tx-add').setAttribute('aria-pressed',a);$('tx-rem').setAttribute('aria-pressed',!a);drawTax()};
    $('tx-add').onclick=function(){setMode(true)};
    $('tx-rem').onclick=function(){setMode(false)};
  }
  if($('mg-out')) renders.push(function(){
    var m=margin(num('mg-c'),num('mg-s'));
    $('mg-out').innerHTML=row('Profit margin',pct(m.margin),1)+row('Markup',pct(m.markup))+row('Profit per unit',fmt(m.profit));
  });

  /* events */
  document.addEventListener('input',function(ev){
    var t=ev.target,r=t.closest&&t.closest('.row');
    if(r&&$('items')&&r.parentNode===$('items')){
      var i=+r.dataset.i;
      if(t.classList.contains('it-d'))items[i].d=t.value;
      if(t.classList.contains('it-q'))items[i].q=t.value;
      if(t.classList.contains('it-r'))items[i].r=t.value;
    }
    if(r&&$('b-rows')&&r.parentNode===$('b-rows')){
      var j=+r.dataset.i;
      if(t.classList.contains('e-n'))exp[j].n=t.value;
      if(t.classList.contains('e-g'))exp[j].g=t.value;
      if(t.classList.contains('e-a'))exp[j].a=t.value;
    }
    renderAll();
  });
  document.addEventListener('change',function(ev){if(ev.target.classList.contains('e-g'))renderAll()});
  document.addEventListener('click',function(ev){
    var t=ev.target;
    if(t.dataset&&t.dataset.del!==undefined){items.splice(+t.dataset.del,1);drawItems();renderAll()}
    if(t.dataset&&t.dataset.bdel!==undefined){exp.splice(+t.dataset.bdel,1);drawExp();renderAll()}
  });
  if(cur)cur.addEventListener('change',function(){
    try{localStorage.setItem('fbd-cur',cur.value)}catch(e){}
    renderAll();
  });

  renderAll();
})();
