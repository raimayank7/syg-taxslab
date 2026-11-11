(function(){'use strict';
var d=document,S=window.SYG,$=function(s){return d.querySelector(s)};
var RULES={"2026-27":{"new":{"slabs":[[400000,0],[800000,5],[1200000,10],[1600000,15],[2000000,20],[2400000,25],[1000000000000000,30]],"std":75000,"rebate_upto":1200000,"rebate_max":60000,"rebate_marginal":true,"surcharge":[[5000000,10],[10000000,15],[20000000,25]]},"old":{"slabs":{"a":[[250000,0],[500000,5],[1000000,20],[1000000000000000,30]],"b":[[300000,0],[500000,5],[1000000,20],[1000000000000000,30]],"c":[[500000,0],[1000000,20],[1000000000000000,30]]},"std":50000,"rebate_upto":500000,"rebate_max":12500,"rebate_marginal":false,"surcharge":[[5000000,10],[10000000,15],[20000000,25],[50000000,37]]},"cess":4,"label":"Tax year 2026-27 (1 April 2026 to 31 March 2027)"},"2025-26":{"new":{"slabs":[[400000,0],[800000,5],[1200000,10],[1600000,15],[2000000,20],[2400000,25],[1000000000000000,30]],"std":75000,"rebate_upto":1200000,"rebate_max":60000,"rebate_marginal":true,"surcharge":[[5000000,10],[10000000,15],[20000000,25]]},"old":{"slabs":{"a":[[250000,0],[500000,5],[1000000,20],[1000000000000000,30]],"b":[[300000,0],[500000,5],[1000000,20],[1000000000000000,30]],"c":[[500000,0],[1000000,20],[1000000000000000,30]]},"std":50000,"rebate_upto":500000,"rebate_max":12500,"rebate_marginal":false,"surcharge":[[5000000,10],[10000000,15],[20000000,25],[50000000,37]]},"cess":4,"label":"Financial year 2025-26 (assessment year 2026-27)"}},INF=1e15;
function slabTax(inc,slabs){var tax=0,prev=0,parts=[];slabs.forEach(function(s){if(inc>prev){var amt=Math.min(inc,s[0])-prev,t=amt*s[1]/100;parts.push([prev,s[0],s[1],amt,t]);tax+=t}prev=s[0]});return [tax,parts]}
function surRate(inc,tb){var r=0;tb.forEach(function(x){if(inc>x[0])r=x[1]});return r}
function compute(year,regime,age,gross,salaried,deductions){var R=RULES[year][regime],slabs=regime==='old'?R.slabs[age]:R.slabs;
 var std=salaried?Math.min(R.std,gross):0,ded=regime==='old'?Math.min(Math.max(deductions,0),Math.max(gross-std,0)):0,taxable=Math.max(gross-std-ded,0);
 var st=slabTax(taxable,slabs),base=st[0],rebate=0;
 if(taxable<=R.rebate_upto)rebate=Math.min(base,R.rebate_max);else if(R.rebate_marginal&&base>taxable-R.rebate_upto)rebate=base-(taxable-R.rebate_upto);
 var tax=base-rebate,s=surRate(taxable,R.surcharge),sur=tax*s/100,relief=0;
 if(s){var limit=0;R.surcharge.forEach(function(x){if(taxable>x[0])limit=x[0]});var cap=slabTax(limit,slabs)[0]*(1+surRate(limit,R.surcharge)/100)+(taxable-limit);if(tax+sur>cap){relief=tax+sur-cap;sur-=relief}}
 var cess=(tax+sur)*RULES[year].cess/100;
 return {gross:gross,std:std,ded:ded,taxable:taxable,base:base,rebate:rebate,tax:tax,srate:s,sur:sur,relief:relief,cess:cess,total:Math.round(tax+sur+cess),parts:st[1]}}
window.TAXSLAB={compute:compute,RULES:RULES};
function inr(n){n=Math.round(n);return (n<0?'-':'')+'₹'+Math.abs(n).toLocaleString('en-IN')}
function words(n){if(!(n>0))return '';if(n>=1e7)return '= '+(Math.round(n/1e5)/100)+' crore';if(n>=1e5)return '= '+(Math.round(n/1e3)/100)+' lakh';return '= '+(Math.round(n/10)/100)+' thousand'}
var form=$('#tx-form');if(!form)return;
var yr=$('#tx-y'),inc=$('#tx-i'),sal=$('#tx-s'),age=$('#tx-a'),ded=$('#tx-d'),res=$('#tx-res');
function rows(r,old){var h='<tr><td>Income entered</td><td class="tx-n">'+inr(r.gross)+'</td></tr>';
 if(r.std)h+='<tr><td>Less: standard deduction</td><td class="tx-n">'+inr(-r.std)+'</td></tr>';
 if(old)h+='<tr><td>Less: other deductions you entered</td><td class="tx-n">'+inr(-r.ded)+'</td></tr>';
 h+='<tr><td>Taxable income</td><td class="tx-n">'+inr(r.taxable)+'</td></tr>';
 r.parts.forEach(function(p){h+='<tr><td>'+(p[2]?p[2]+'% on ':'Nil on ')+inr(p[3])+' <small>('+(p[0]?'above '+inr(p[0]):'first slab')+')</small></td><td class="tx-n">'+inr(p[4])+'</td></tr>'});
 if(r.rebate)h+='<tr><td>Less: rebate'+(r.taxable>RULES[yr.value][old?'old':'new'].rebate_upto?' (marginal relief)':'')+'</td><td class="tx-n">'+inr(-r.rebate)+'</td></tr>';
 if(r.srate)h+='<tr><td>Surcharge at '+r.srate+'%'+(r.relief?' after marginal relief of '+inr(r.relief):'')+'</td><td class="tx-n">'+inr(r.sur)+'</td></tr>';
 h+='<tr><td>Health and education cess at '+RULES[yr.value].cess+'%</td><td class="tx-n">'+inr(r.cess)+'</td></tr><tr class="tx-total"><td>Income tax for the year</td><td class="tx-n">'+inr(r.total)+'</td></tr>';
 return '<div class="tbl"><table><tbody>'+h+'</tbody></table></div>'}
function calc(){var g=parseFloat(inc.value),dd=parseFloat(ded.value)||0;$('#tx-iw').textContent=words(g);$('#tx-dw').textContent=words(dd);
 if(!(g>=0)||inc.value===''){res.hidden=true;return}
 if(g>1e11){res.hidden=false;res.innerHTML='<h2>Check the income</h2><p>Type the yearly income in rupees, without commas.</p>';return}
 var y=yr.value,N=compute(y,'new',age.value,g,sal.checked,0),O=compute(y,'old',age.value,g,sal.checked,dd),diff=O.total-N.total;
 var line=diff===0?'For these figures the tax is the same under both regimes.':'For these figures the tax is lower under the <b>'+(diff>0?'new':'old')+' regime</b> by '+inr(Math.abs(diff))+'.';
 var be='';
 if(N.total<compute(y,'old',age.value,g,sal.checked,0).total){var lo=0,hi=g;for(var i=0;i<50;i++){var mid=(lo+hi)/2;if(compute(y,'old',age.value,g,sal.checked,mid).total>N.total)lo=mid;else hi=mid}
  be=hi>=g-1?'':'<p>The two regimes give the same tax when the old regime deductions (besides the standard deduction) are about '+inr(Math.ceil(hi/100)*100)+'. Below that, the new regime is lower; above it, the old one.</p>'}
 var eff=function(r){return g>0?(Math.round(r.total/g*1000)/10)+'% of the income entered':''};
 var txt='Income tax, '+RULES[y].label+', income '+inr(g)+': new regime '+inr(N.total)+', old regime '+inr(O.total)+' (with deductions of '+inr(O.ded)+').';
 res.hidden=false;res.className='result rise';
 res.innerHTML='<h2>Income tax on '+inr(g)+'</h2><div class="tx-two"><div class="tx-box'+(diff>=0?' low':'')+'"><h3>New regime</h3><p class="big">'+inr(N.total)+'</p><small>'+inr(N.total/12)+' a month. '+eff(N)+'</small></div>'+
  '<div class="tx-box'+(diff<=0?' low':'')+'"><h3>Old regime</h3><p class="big">'+inr(O.total)+'</p><small>'+inr(O.total/12)+' a month. '+eff(O)+'</small></div></div><p>'+line+'</p>'+be+
  '<details open><summary>How the new regime figure is worked out</summary>'+rows(N,false)+'</details><details><summary>How the old regime figure is worked out</summary>'+rows(O,true)+'</details>'+
  '<div class="acts"><button class="btn sm" type="button" data-copy="'+S.esc(txt)+'">Copy result</button><button class="btn sm ghost" type="button" data-wa="'+S.esc(txt+' Worked out at '+location.origin+'/')+'">WhatsApp</button><button class="btn sm ghost" type="button" onclick="print()">Print</button></div>'+
  '<p class="hint">For a resident individual with ordinary income such as salary, pension, interest or business income. Capital gains and other income taxed at special rates are not handled. This is arithmetic on the published rates, not tax advice: check your own case with the Income Tax Department or a tax professional before you file or invest.</p>'}
form.addEventListener('submit',function(e){e.preventDefault();calc()});
[yr,inc,sal,age,ded].forEach(function(el){el.addEventListener('input',calc);el.addEventListener('change',calc)});
var m=location.hash.match(/income=(\d+)/);if(m){inc.value=m[1];calc()}
})();