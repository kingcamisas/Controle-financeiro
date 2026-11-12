(function(){
const KEY="dividas.v1",MN=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const NOMES=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const brl=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"});
const $=id=>document.getElementById(id);
const hoje=new Date();
let S={itens:[],pago:{},renda:0,tema:"",metas:[],entradas:[],cofre:[],contas:[],rendaNome:""};
let ano=hoje.getFullYear(),mes=hoje.getMonth()+1,chart=null,editId=null,lixo=null,tt=0;
try{const r=localStorage.getItem(KEY);if(r)S=Object.assign(S,JSON.parse(r))}catch(e){}
let ref=null,tmr=0,mexeu=false;
function status(t){$("st").textContent=t}
function empacotar(){return{itens:S.itens,pago:Object.keys(S.pago),renda:S.renda||0,tema:S.tema||"",metas:S.metas,entradas:S.entradas,cofre:S.cofre,contas:S.contas,rendaNome:S.rendaNome||""}}
function salvar(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}
 if(!ref){mexeu=true;return}clearTimeout(tmr);status("Salvando…");
 tmr=setTimeout(()=>ref.set(empacotar()).then(()=>status("Salvo na sua conta"),()=>status("Salvo só neste navegador")),500)}
const idx=ym=>{const[a,m]=ym.split("-").map(Number);return a*12+m-1};
const ymStr=(a,m)=>a+"-"+String(m).padStart(2,"0");
function ocorre(d,i){const s=idx(d.inicio);
 if(d.tipo==="fixa")return i>=s&&(!d.fim||i<=idx(d.fim));
 if(d.tipo==="parcelada")return i>=s&&i<s+d.parcelas;
 return i===s}
const doMes=(a,m)=>S.itens.filter(d=>ocorre(d,a*12+m-1));
const chave=(d,a,m)=>d.id+"|"+ymStr(a,m);
const soma=l=>l.reduce((t,d)=>t+d.valor,0);
const rendaMes=i=>(S.renda||0)+soma(S.entradas.filter(d=>ocorre(d,i)));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const somaPago=(l,a,m)=>l.reduce((t,d)=>t+(S.pago[chave(d,a,m)]?d.valor:0),0);
function rotulo(d,a,m){
 if(d.tipo==="parcelada")return"parcela "+(a*12+m-1-idx(d.inicio)+1)+" de "+d.parcelas;
 if(d.tipo==="unica")return"única";
 return d.fim?"fixa até "+MN[+d.fim.slice(5)-1]+"/"+d.fim.slice(0,4):"fixa"}
function el(t,c,x){const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function render(){
 $("ano").textContent=ano;$("renda").value=S.renda||"";$("rnome").value=S.rendaNome||"";
 const tot=[],pg=[];
 for(let m=1;m<=12;m++){const l=doMes(ano,m);tot.push(soma(l));pg.push(somaPago(l,ano,m))}
 const T=tot.reduce((a,b)=>a+b,0),P=pg.reduce((a,b)=>a+b,0),R=S.renda||0,rm=tot.map((_,i)=>rendaMes(ano*12+i));
 const acima=tot.map((t,i)=>t-rm[i]).filter(x=>x>0&&R>0),exc=acima.reduce((a,x)=>a+x,0);
 const sum=$("sum");sum.textContent="";
 [["Total do ano",brl.format(T)],["Já pago",brl.format(P)],["Falta pagar",brl.format(T-P)],
  ["Meses acima da renda",R>0?acima.length+" (excesso "+brl.format(exc)+")":"informe a renda"]].forEach(([k,v])=>{
  const d=el("div");d.append(el("small","",k),el("b","",v));sum.append(d)});
 const gm=$("meses");gm.textContent="";
 tot.forEach((t,i)=>{const m=i+1,b=el("button","m"+(R>0&&t>rm[i]?" over":"")+(m===mes?" sel":""));
  b.append(el("small","",MN[i]),el("b","",brl.format(t)));
  if(t>0){const p=el("i");p.style.width=Math.min(100,pg[i]/t*100)+"%";b.append(p)}
  b.onclick=()=>{mes=m;render()};gm.append(b)});
 detalhe(tot[mes-1],rm[mes-1]);grafico(tot,rm);metas(R);cofre();
}
function detalhe(t,R){
 $("mt").textContent=NOMES[mes-1]+" de "+ano;
 const L=$("lista");L.textContent="";const l=doMes(ano,mes);
 if(!l.length)L.append(el("div","vazio","Nenhuma dívida neste mês. Use “Nova dívida” para começar."));
 l.forEach(d=>{const p=!!S.pago[chave(d,ano,mes)];
  const r=el("div","row"+(p?" pago":"")),lb=el("label"),cb=document.createElement("input");
  cb.type="checkbox";cb.checked=p;cb.dataset.k=chave(d,ano,mes);cb.setAttribute("aria-label","Marcar como pago");
  const w=el("span");w.style.minWidth="0";w.append(el("div","nm",d.nome),el("small","",rotulo(d,ano,mes)));
  lb.append(cb,w);
  const v=el("span","v",brl.format(d.valor)),e=el("button","","Editar"),x=el("button","","Excluir");
  e.dataset.e=d.id;x.dataset.x=d.id;r.append(lb,v,e,x);L.append(r)});
 const en=[];if(S.renda)en.push([S.rendaNome||"Renda mensal",S.renda,"renda mensal"]);
 S.entradas.filter(d=>ocorre(d,ano*12+mes-1)).forEach(d=>en.push([d.nome,d.valor,d.tipo==="unica"?"entrada extra":"entrada mensal"]));
 if(en.length){L.append(sub("Entradas do mês"));en.forEach(([n,v,k])=>{const r=el("div","row"),w=el("span");w.style.flex="1";w.append(el("div","nm",n),el("small","",k));r.append(w,el("span","v pos","+"+brl.format(v)));L.append(r)})}
 const pg=somaPago(l,ano,mes),f=$("tot");f.textContent="";
 const add=(k,v,c)=>{const s=el("span","",k+" ");s.append(el("b",c||"",v));f.append(s)};
 if(R>0)add("Entradas",brl.format(R));add("Total",brl.format(t));add("Pago",brl.format(pg));add("Falta pagar",brl.format(t-pg));
 if(R>0)add(R>=t?"Sobra da renda":"Excede a renda",brl.format(Math.abs(R-t)),R>=t?"pos":"neg");
 if(R>0){const ym=ymStr(ano,mes),gd=S.cofre.find(x=>x.auto===ym);
  if(gd){const b=el("button","","Desfazer recebimento no banco ("+brl.format(gd.valor)+")");b.dataset.cu=gd.id;f.append(b)}
  else if(R>t){const b=el("button","pri","Receber "+brl.format(R-t)+" no banco");b.dataset.cg=ym;f.append(b)}}
}
function cor(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim()}
function grafico(tot,R){
 if(typeof Chart==="undefined")return;
 const ds=[{type:"bar",label:"Dívidas do mês",data:tot,backgroundColor:tot.map((t,i)=>R[i]>0&&t>R[i]?cor("--bad"):cor("--ac")),borderRadius:4}];
 if(R.some(x=>x>0))ds.push({type:"line",label:"Entradas",data:R,borderColor:cor("--ok"),borderDash:[6,4],pointRadius:0,borderWidth:2});
 const tc=cor("--mu"),gc=cor("--ln");
 if(chart){chart.data.datasets=ds;chart.options.scales.x.ticks.color=tc;chart.options.scales.y.ticks.color=tc;chart.options.scales.y.grid.color=gc;chart.options.plugins.legend.labels.color=tc;chart.update();return}
 chart=new Chart($("cv"),{data:{labels:MN,datasets:ds},options:{responsive:true,maintainAspectRatio:false,
  plugins:{legend:{labels:{color:tc}},tooltip:{callbacks:{label:c=>c.dataset.label+": "+brl.format(c.parsed.y)}}},
  scales:{x:{ticks:{color:tc},grid:{display:false}},y:{beginAtZero:true,ticks:{color:tc,callback:v=>brl.format(v)},grid:{color:gc}}}}});
}
function toast(msg,undo){$("tm").textContent=msg;$("un").style.display=undo?"":"none";$("toast").style.display="flex";clearTimeout(tt);tt=setTimeout(()=>{$("toast").style.display="none";lixo=null},6000)}
$("lista").addEventListener("change",e=>{const k=e.target.dataset.k;if(!k)return;if(e.target.checked)S.pago[k]=1;else delete S.pago[k];salvar();render()});
$("lista").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
 if(b.dataset.e)abrir(b.dataset.e);
 if(b.dataset.x){const i=S.itens.findIndex(d=>d.id===b.dataset.x);lixo={d:S.itens[i],i};S.itens.splice(i,1);salvar();render();toast("Dívida excluída.",true)}});
$("un").onclick=()=>{if(lixo){S.itens.splice(lixo.i,0,lixo.d);lixo=null;salvar();render();$("toast").style.display="none"}};
const ymI=i=>ymStr(Math.floor(i/12),i%12+1);
const fmtYM=s=>MN[+s.slice(5)-1]+"/"+s.slice(0,4);
function resumo(){const t=$("ft").value,r=$("rs"),i=$("fi").value,f=$("ff").value,n=parseInt($("fp").value),v=parseFloat($("fv").value);
 r.hidden=!(t==="parcelada"&&i&&f&&n>0);if(r.hidden)return;
 r.textContent=n+(n===1?" parcela":" parcelas")+(v>0?" de "+brl.format(v)+" · total "+brl.format(v*n):"")+" (de "+fmtYM(i)+" até "+fmtYM(f)+")"}
function valida(){const t=$("ft").value,i=$("fi").value,f=$("ff").value;
 $("ff").required=t==="parcelada";
 $("ff").setCustomValidity(t!=="unica"&&i&&f&&idx(f)<idx(i)?"O mês final não pode ser antes do início.":"");resumo()}
function deFim(){const i=$("fi").value,f=$("ff").value;if($("ft").value==="parcelada"&&i&&f&&idx(f)>=idx(i))$("fp").value=idx(f)-idx(i)+1;valida()}
function dePar(){const i=$("fi").value,n=parseInt($("fp").value);if($("ft").value==="parcelada"&&i&&n>0)$("ff").value=ymI(idx(i)+n-1);valida()}
function tipoUI(){const t=$("ft").value;$("wp").hidden=t!=="parcelada";$("wf").hidden=t==="unica";
 $("lf").textContent=t==="fixa"?"Termina em (opcional)":"Termina em";
 $("li").textContent=t==="unica"?"Mês da dívida":"Começa em";if(t==="parcelada")dePar();valida()}
$("ft").onchange=tipoUI;
$("fi").onchange=()=>{if($("ft").value==="parcelada"&&!$("ff").value)dePar();else deFim()};
$("ff").onchange=deFim;$("fp").oninput=dePar;$("fv").oninput=resumo;
function abrir(id){editId=id||null;const d=id?S.itens.find(x=>x.id===id):null;
 $("dt").textContent=d?"Editar dívida":"Nova dívida";$("mais").hidden=!!d;$("ok").hidden=true;$("ok").style.color="var(--ok)";
 $("fn").value=d?d.nome:"";$("fv").value=d?d.valor:"";$("ft").value=d?d.tipo:"fixa";
 $("fi").value=d?d.inicio:ymStr(ano,mes);$("fp").value=d&&d.parcelas?d.parcelas:2;$("ff").value=d&&d.fim?d.fim:"";
 tipoUI();$("dlg").showModal()}
$("novo").onclick=()=>abrir();$("cx").onclick=()=>$("dlg").close();
function gravar(){const t=$("ft").value,o={id:editId||Date.now().toString(36)+Math.random().toString(36).slice(2,6),
 nome:$("fn").value.trim(),valor:Math.round(parseFloat($("fv").value)*100)/100,tipo:t,inicio:$("fi").value};
 if(t==="parcelada")o.parcelas=Math.max(1,idx($("ff").value)-idx(o.inicio)+1);
 if(t==="fixa"&&$("ff").value&&idx($("ff").value)>=idx(o.inicio))o.fim=$("ff").value;
 if(editId){const i=S.itens.findIndex(d=>d.id===editId);S.itens[i]=o}else S.itens.push(o);
 const[a,m]=o.inicio.split("-").map(Number);ano=a;mes=m;salvar();render();return o}
$("fm").onsubmit=e=>{e.preventDefault();try{gravar();$("dlg").close()}catch(err){$("ok").style.color="var(--bad)";$("ok").textContent="Não foi possível salvar: "+err.message;$("ok").hidden=false}};
$("mais").onclick=()=>{if(!$("fm").reportValidity())return;
 try{const o=gravar();editId=null;$("dt").textContent="Nova dívida";$("ok").style.color="var(--ok)";$("ok").textContent="Adicionada: "+o.nome+". Pode lançar a próxima.";$("ok").hidden=false;
  $("fn").value="";$("fv").value="";$("rs").hidden=true;$("fn").focus()}catch(e){$("ok").textContent="Não foi possível adicionar. Confira os campos.";$("ok").hidden=false}};
$("ant").onclick=()=>{ano--;render()};$("prox").onclick=()=>{ano++;render()};
$("renda").oninput=e=>{S.renda=parseFloat(e.target.value)||0;salvar();render()};
$("rnome").oninput=e=>{S.rendaNome=e.target.value;salvar();render()};
$("tema").onclick=()=>{const esc=document.documentElement.dataset.theme==="dark"||(!document.documentElement.dataset.theme&&matchMedia("(prefers-color-scheme: dark)").matches);
 S.tema=esc?"light":"dark";document.documentElement.dataset.theme=S.tema;salvar();render()};
if(S.tema)document.documentElement.dataset.theme=S.tema;
// metas: simula em qual mês começar a pagar uma compra
const totIdx=i=>soma(S.itens.filter(d=>ocorre(d,i)));
function nper(pv,pmt,j){if(pv<=0)return 0;if(!j)return Math.ceil(pv/pmt-1e-9);if(pmt<=pv*j)return Infinity;return Math.ceil(-Math.log(1-pv*j/pmt)/Math.log(1+j)-1e-9)}
function simular(g){const n=nper(g.total-(g.entrada||0),g.parcela,(g.juros||0)/100),R=S.renda||0,h0=hoje.getFullYear()*12+hoje.getMonth(),L=[];
 if(!isFinite(n)||n<1)return{n,L};
 const T=[];for(let i=0;i<48+n;i++)T[i]=rendaMes(h0+i)-totIdx(h0+i);
 for(let s=0;s<48;s++){let pior=Infinity;for(let k=s;k<s+n;k++)pior=Math.min(pior,T[k]);
  const sobra=pior-g.parcela;L.push({i:h0+s,sobra,st:sobra>=folgaDe(g)?"ok":sobra>=0?"aperto":"nao"})}
 return{n,L,best:L.find(x=>x.st==="ok")||L.find(x=>x.st==="aperto")}}
function metas(R){const box=$("lm");box.textContent="";
 if(!S.metas.length){box.append(el("div","vazio","Nenhuma meta ainda. Ex.: uma moto de R$ 20.000 pagando R$ 500 por mês."));return}
 S.metas.forEach(g=>{if(g.modo==="avista"){box.append(cardVista(g,R));return}const r=simular(g),c=el("div","meta");
  c.append(el("b","",g.nome),el("div","",brl.format(g.total)+(g.entrada?" · entrada "+brl.format(g.entrada):"")+" · "+(isFinite(r.n)?r.n+" × "+brl.format(g.parcela):"parcela menor que os juros")+(g.juros?" · "+g.juros+"% a.m.":"")));
  const m=el("div","res");
  if(!R)m.textContent="Informe a renda mensal lá em cima para descobrir o melhor mês.";
  else if(!isFinite(r.n))m.textContent="Aumente a parcela: ela não cobre os juros do mês.";
  else if(!r.best)m.textContent="Nos próximos 4 anos nenhum mês comporta essa parcela junto com as dívidas atuais.";
  else m.append(document.createTextNode(r.best.st==="ok"?"Melhor mês para começar: ":"Primeiro mês possível (apertado): "),el("b","",fmtYM(ymI(r.best.i))),document.createTextNode(" · termina em "+fmtYM(ymI(r.best.i+r.n-1))+" · sobra mínima "+brl.format(r.best.sobra)));
  c.append(m);
  if(R&&r.L.length){const dt=document.createElement("details"),tb=el("div","mm");dt.append(el("summary","","Ver os próximos meses"));
   r.L.slice(0,12).forEach(x=>tb.append(el("span","ch "+x.st,fmtYM(ymI(x.i))+" · sobra "+brl.format(x.sobra))));
   dt.append(tb,el("small","","Sobra no mês mais pesado se você começar naquele mês. Verde: cabe com a folga. Amarelo: apertado. Vermelho: não cabe."));c.append(dt)}
  const ac=el("div","acts");
  if(R&&r.best){const lb=el("button","pri","Lançar em "+fmtYM(ymI(r.best.i)));lb.dataset.l=g.id;ac.append(lb)}
  const e=el("button","","Editar"),x=el("button","","Excluir");e.dataset.me=g.id;x.dataset.mx=g.id;ac.append(e,x);c.append(ac);box.append(c)})}
// meta à vista: o mês em que a sobra livre do próprio mês paga a compra
function folgaDe(g){return g.folga!=null?g.folga:(g.margem||0)*(S.renda||0)/100}
function simularVista(g){const h0=hoje.getFullYear()*12+hoje.getMonth(),f=folgaDe(g),L=[];
 for(let s=0;s<36;s++){const i=h0+s,livre=rendaMes(i)-totIdx(i)-f;L.push({i,livre,st:livre>=g.total?"ok":"nao"})}
 return{L,best:L.find(x=>x.st==="ok")}}
function fundos(g){const o={bancos:[],fluxo:[],juntar:[]};
 S.contas.forEach(c=>{const s=saldoDe(c.id);if(s<=0.001)return;(c.tipo==="banco"?o.bancos:c.fluxo?o.fluxo:o.juntar).push({nome:c.nome,s,cobre:s>=g.total})});
 o.soma=o.bancos.reduce((a,x)=>a+x.s,0);return o}
function cardVista(g,R){const r=simularVista(g),f=fundos(g),c=el("div","meta"),txt=t=>document.createTextNode(t);
 c.append(el("b","",g.nome+" · à vista"),el("div","",brl.format(g.total)+(folgaDe(g)?" · folga mínima de "+brl.format(folgaDe(g))+" no mês":"")));
 const cob=f.bancos.filter(x=>x.cobre).concat(f.fluxo.filter(x=>x.cobre)),soma=f.bancos.length>1&&f.soma>=g.total&&!f.bancos.some(x=>x.cobre);
 if(cob.length||soma){const a=el("div","al");a.append(el("b","","Alerta: você já tem esse dinheiro disponível. "),txt(cob.length?"Cobre a compra: "+cob.map(x=>x.nome+" ("+brl.format(x.s)+")").join(", ")+".":"Somando os bancos você tem "+brl.format(f.soma)+"."));c.append(a)}
 const m=el("div","res");
 if(!R&&!S.entradas.length)m.textContent="Informe a renda mensal para descobrir o melhor mês.";
 else if(!r.best)m.textContent="Nos próximos 3 anos nenhum mês tem sobra livre para pagar "+brl.format(g.total)+" (sobra do mês menos a folga).";
 else m.append(txt("Melhor mês de compra: "),el("b","",fmtYM(ymI(r.best.i))),txt(" · sobra livre naquele mês: "+brl.format(r.best.livre)));
 c.append(m);
 const ln=t=>{const d=el("small","",t);d.style.display="block";c.append(d)};
 f.bancos.forEach(x=>ln("Banco "+x.nome+": "+brl.format(x.s)+(x.cobre?" · cobre a compra":" · não cobre sozinho")));
 f.fluxo.forEach(x=>ln("Cofrinho de fluxo "+x.nome+": "+brl.format(x.s)+(x.cobre?" · pode ser usado":" · não cobre")));
 f.juntar.filter(x=>x.cobre).forEach(x=>ln("O cofrinho "+x.nome+" tem "+brl.format(x.s)+", mas é só para juntar dinheiro: não é recomendado usar nesta compra."));
 if((R||S.entradas.length)&&r.L.length){const dt=document.createElement("details"),tb=el("div","mm");dt.append(el("summary","","Ver os próximos meses"));
  r.L.slice(0,12).forEach(x=>tb.append(el("span","ch "+x.st,fmtYM(ymI(x.i))+" · livre "+brl.format(x.livre))));
  dt.append(tb,el("small","","Livre = renda e entradas do mês, menos as dívidas, menos a folga. Verde: paga a compra. Vermelho: não paga."));c.append(dt)}
 const ac=el("div","acts"),e=el("button","","Editar"),x=el("button","","Excluir");e.dataset.me=g.id;x.dataset.mx=g.id;ac.append(e,x);c.append(ac);return c}
let metaId=null;
function gmUI(){const a=$("gm").value==="avista";$("gwp").hidden=a;$("gwj").hidden=a;$("gwe").hidden=a;$("gp").required=!a}
$("gm").onchange=gmUI;
function abrirMeta(id){metaId=id||null;const g=id?S.metas.find(x=>x.id===id):null;$("gerr").hidden=true;
 $("gdt").textContent=g?"Editar meta":"Nova meta";
 $("gn").value=g?g.nome:"";$("gt").value=g?g.total:"";$("ge").value=g&&g.entrada?g.entrada:"";$("gp").value=g&&g.parcela?g.parcela:"";$("gj").value=g&&g.juros?g.juros:"";$("gg").value=g?Math.round(folgaDe(g)*100)/100:0;$("gm").value=g&&g.modo?g.modo:"parc";gmUI();$("dg").showModal()}
$("nmeta").onclick=()=>abrirMeta();$("gcx").onclick=()=>$("dg").close();
$("fg").onsubmit=e=>{e.preventDefault();
 const g={id:metaId||Date.now().toString(36)+Math.random().toString(36).slice(2,6),nome:$("gn").value.trim(),total:parseFloat($("gt").value),entrada:$("gm").value==="avista"?0:parseFloat($("ge").value)||0,modo:$("gm").value,parcela:$("gm").value==="avista"?0:parseFloat($("gp").value),juros:$("gm").value==="avista"?0:parseFloat($("gj").value)||0,folga:parseFloat($("gg").value)||0};
 if(g.entrada>=g.total){$("gerr").textContent="A entrada precisa ser menor que o valor total.";$("gerr").hidden=false;return}
 if(metaId){const i=S.metas.findIndex(x=>x.id===metaId);S.metas[i]=g}else S.metas.push(g);
 $("dg").close();salvar();render()};
$("lm").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
 if(b.dataset.me)abrirMeta(b.dataset.me);
 if(b.dataset.mx){S.metas=S.metas.filter(x=>x.id!==b.dataset.mx);salvar();render()}
 if(b.dataset.l){const g=S.metas.find(x=>x.id===b.dataset.l),r=g&&simular(g);if(!r||!r.best)return;
  S.itens.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),nome:g.nome,valor:g.parcela,tipo:"parcelada",inicio:ymI(r.best.i),parcelas:r.n});
  S.metas=S.metas.filter(x=>x.id!==g.id);ano=Math.floor(r.best.i/12);mes=r.best.i%12+1;salvar();render();toast("Lançada como dívida parcelada em "+fmtYM(ymI(r.best.i))+".",false)}});
// entradas extras, bancos e cofrinhos
const BANCO="banco";
const saldoDe=id=>S.cofre.filter(x=>x.conta===id).reduce((a,x)=>a+x.valor,0);
const nomeConta=id=>(S.contas.find(c=>c.id===id)||{nome:id===BANCO?"Banco":"Conta excluída"}).nome;
const bancos=()=>S.contas.filter(c=>c.tipo==="banco");
function migrar(){S.contas=S.contas||[];S.cofre=S.cofre||[];
 S.contas.forEach(c=>{if(!c.tipo){c.tipo="cofrinho";c.fluxo=false}});
 const sem=S.cofre.filter(x=>!x.conta);
 if(sem.length){let c=S.contas.find(x=>x.tipo==="cofrinho");if(!c){c={id:uid(),nome:"Principal",tipo:"cofrinho",fluxo:false};S.contas.push(c)}sem.forEach(x=>{x.conta=c.id})}
 if(!bancos().length)S.contas.unshift({id:BANCO,nome:"Banco",tipo:"banco"})}
function sub(t){const h=el("small","",t);h.style.cssText="display:block;margin:14px 0 4px";return h}
function fillSel(s,sel){s.textContent="";S.contas.forEach(c=>{const o=document.createElement("option");o.value=c.id;o.textContent=(c.tipo==="banco"?"Banco · ":"Cofrinho · ")+c.nome;s.append(o)});if(sel)s.value=sel}
function tipoConta(c){return c.tipo==="banco"?"banco":c.fluxo?"cofrinho de fluxo (pode usar em compras)":"cofrinho só para juntar"}
function cofre(){const h0=hoje.getFullYear()*12+hoje.getMonth(),box=$("cs");box.textContent="";
 let proj=0;for(let m=1;m<=12;m++){const i=ano*12+m-1;if(i<h0||S.cofre.some(x=>x.auto===ymStr(ano,m)))continue;proj+=Math.max(0,rendaMes(i)-totIdx(i))}
 const sb=bancos().reduce((a,c)=>a+saldoDe(c.id),0),cards=[];
 S.contas.forEach(c=>cards.push([(c.tipo==="banco"?"Banco":"Cofrinho")+" · "+c.nome,brl.format(saldoDe(c.id))]));
 if(bancos().length>1)cards.push(["Bancos somados",brl.format(sb)]);
 cards.push(["Bancos em dez/"+ano+" recebendo toda a sobra",brl.format(sb+proj)]);
 cards.forEach(([k,v])=>{const d=el("div");d.append(el("small","",k),el("b","",v));box.append(d)});
 const L=$("lc");L.textContent="";L.append(sub("Contas: bancos e cofrinhos"));
 S.contas.forEach(c=>{const r=el("div","row"),w=el("span");w.style.flex="1";w.append(el("div","nm",c.nome),el("small","",tipoConta(c)));
  const e=el("button","","Editar"),x=el("button","","Excluir");e.dataset.ke=c.id;x.dataset.kx=c.id;r.append(w,el("span","v",brl.format(saldoDe(c.id))),e,x);L.append(r)});
 L.append(sub("Movimentos"));
 const mv=S.cofre.slice().sort((a,b)=>b.ym.localeCompare(a.ym));
 if(!mv.length)L.append(el("div","vazio","Nada ainda. Abra um mês e use “Receber … no banco”, ou o botão Depositar."));
 mv.forEach(x=>{const r=el("div","row"),w=el("span");w.style.flex="1";w.append(el("div","nm",x.nota||(x.valor>0?"Depósito":"Retirada")),el("small","",nomeConta(x.conta)+" · "+fmtYM(x.ym)));
  const b=el("button","","Excluir");b.dataset.cd=x.id;r.append(w,el("span","v"+(x.valor<0?" neg":""),(x.valor>0?"+":"")+brl.format(x.valor)),b);L.append(r)});
 L.append(sub("Entradas extras (além da renda mensal)"));
 if(!S.entradas.length)L.append(el("div","vazio","Nenhuma. Use para 13º, bônus, vendas ou um período em que você recebe mais."));
 S.entradas.forEach(x=>{const r=el("div","row"),w=el("span");w.style.flex="1";
  w.append(el("div","nm",x.nome),el("small","",x.tipo==="unica"?fmtYM(x.inicio):"todo mês desde "+fmtYM(x.inicio)+(x.fim?" até "+fmtYM(x.fim):"")));
  const e=el("button","","Editar"),b=el("button","","Excluir");e.dataset.ee=x.id;b.dataset.ex=x.id;r.append(w,el("span","v pos","+"+brl.format(x.valor)),e,b);L.append(r)})}
function removerMov(id){const x=S.cofre.find(m=>m.id===id);if(!x)return;const antes=S.cofre;
 S.cofre=antes.filter(m=>m.id!==id&&!(x.par&&m.par===x.par));
 if(S.contas.some(c=>saldoDe(c.id)<-0.001)){S.cofre=antes;toast("Não dá para excluir: algum saldo ficaria negativo.",false);return}
 salvar();render()}
// entradas
let entId=null;
function entUI(){$("ewf").hidden=$("et").value!=="fixa";$("eli").textContent=$("et").value==="unica"?"Mês da entrada":"Começa em"}
function abrirEnt(id){entId=id||null;const x=id?S.entradas.find(e=>e.id===id):null;$("edt").textContent=x?"Editar entrada":"Nova entrada";
 $("en").value=x?x.nome:"";$("ev").value=x?x.valor:"";$("et").value=x?x.tipo:"unica";$("ei").value=x?x.inicio:ymStr(ano,mes);$("ef").value=x&&x.fim?x.fim:"";entUI();$("de").showModal()}
$("et").onchange=entUI;$("nent").onclick=()=>abrirEnt();$("ecx").onclick=()=>$("de").close();
$("fe").onsubmit=e=>{e.preventDefault();const t=$("et").value,o={id:entId||uid(),nome:$("en").value.trim(),valor:Math.round(parseFloat($("ev").value)*100)/100,tipo:t,inicio:$("ei").value};
 if(t==="fixa"&&$("ef").value&&idx($("ef").value)>=idx(o.inicio))o.fim=$("ef").value;
 if(entId){const i=S.entradas.findIndex(x=>x.id===entId);S.entradas[i]=o}else S.entradas.push(o);
 $("de").close();salvar();render()};
// contas (bancos e cofrinhos)
let kid=null;
function kUI(){$("kwu").hidden=$("kt").value!=="cofrinho"}
function abrirK(id,tipo){kid=id||null;const c=id?S.contas.find(x=>x.id===id):null;$("kdt").textContent=c?"Editar conta":(tipo==="banco"?"Novo banco":"Novo cofrinho");
 $("kn").value=c?c.nome:"";$("kt").value=c?c.tipo:(tipo||"cofrinho");$("kt").disabled=!!c;$("ku").value=c&&c.fluxo?"fluxo":"juntar";kUI();$("dk").showModal()}
$("kt").onchange=kUI;$("nk").onclick=()=>abrirK(null,"cofrinho");$("nb").onclick=()=>abrirK(null,"banco");$("kcx").onclick=()=>$("dk").close();
$("fk").onsubmit=e=>{e.preventDefault();const t=$("kt").value,o={nome:$("kn").value.trim(),tipo:t,fluxo:t==="cofrinho"&&$("ku").value==="fluxo"};
 if(kid)Object.assign(S.contas.find(x=>x.id===kid),o);else S.contas.push(Object.assign({id:uid()},o));$("dk").close();salvar();render()};
// movimentos: depósito, retirada e transferência
let autoYm=null;
function movUI(){const t=$("mtp").value;$("mwp").hidden=t!=="trf";$("mcl").textContent=t==="trf"?"De":"Conta";$("cdt").textContent=t==="dep"?"Depositar":t==="ret"?"Retirar":"Transferir"}
function abrirMov(t){autoYm=null;$("mtp").value=t;const a=(bancos()[0]||S.contas[0]).id;fillSel($("mco"),a);fillSel($("mpa"),(S.contas.find(c=>c.id!==a)||S.contas[0]).id);movUI();$("mval").value="";$("cn").value="";$("ci").value=ymStr(hoje.getFullYear(),hoje.getMonth()+1);$("cerr").hidden=true;$("dc").showModal()}
$("mtp").onchange=movUI;
$("dep").onclick=()=>abrirMov("dep");$("ret").onclick=()=>abrirMov("ret");
$("trf").onclick=()=>{if(S.contas.length<2){toast("Crie outra conta (banco ou cofrinho) antes de transferir.",false);return}abrirMov("trf")};
$("ccx").onclick=()=>$("dc").close();
$("fmv").onsubmit=e=>{e.preventDefault();const t=$("mtp").value,c=$("mco").value,v=Math.round(parseFloat($("mval").value)*100)/100,ym=$("ci").value,nota=$("cn").value.trim(),err=m=>{$("cerr").textContent=m;$("cerr").hidden=false};
 if(t!=="dep"&&v>saldoDe(c)+0.001)return err("Saldo insuficiente em "+nomeConta(c)+" ("+brl.format(saldoDe(c))+").");
 if(t==="trf"){const p=$("mpa").value;if(p===c)return err("Escolha contas diferentes.");const par=uid();
  S.cofre.push({id:uid(),conta:c,ym,valor:-v,nota:nota||"Transferência para "+nomeConta(p),par},{id:uid(),conta:p,ym,valor:v,nota:nota||"Transferência de "+nomeConta(c),par})}
 else{const o={id:uid(),conta:c,ym,valor:t==="dep"?v:-v,nota};if(autoYm&&t==="dep")o.auto=autoYm;S.cofre.push(o)}
 autoYm=null;$("dc").close();salvar();render()};
$("lc").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
 if(b.dataset.cd)return removerMov(b.dataset.cd);
 if(b.dataset.ee)return abrirEnt(b.dataset.ee);
 if(b.dataset.ke)return abrirK(b.dataset.ke);
 if(b.dataset.kx){const c=S.contas.find(x=>x.id===b.dataset.kx);
  if(Math.abs(saldoDe(c.id))>0.001){toast("Transfira o saldo dessa conta antes de excluir.",false);return}
  if(c.tipo==="banco"&&bancos().length<2){toast("Mantenha pelo menos um banco.",false);return}
  S.contas=S.contas.filter(x=>x.id!==c.id)}
 else if(b.dataset.ex)S.entradas=S.entradas.filter(x=>x.id!==b.dataset.ex);
 else return;
 salvar();render()});
$("tot").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
 if(b.dataset.cg){const ym=b.dataset.cg,[a,m]=ym.split("-").map(Number),i=a*12+m-1,v=Math.round((rendaMes(i)-totIdx(i))*100)/100,nota="Sobra de "+NOMES[m-1].toLowerCase();
  if(v>0&&!S.cofre.some(x=>x.auto===ym)){const bs=bancos();
   if(bs.length===1){S.cofre.push({id:uid(),conta:bs[0].id,ym,valor:v,nota,auto:ym});salvar();render()}
   else{abrirMov("dep");$("mval").value=v;$("ci").value=ym;$("cn").value=nota;autoYm=ym}}}
 if(b.dataset.cu)removerMov(b.dataset.cu)});
// backup e importação (aceita também o dividas.json do programa antigo)
$("bk").onclick=()=>{$("tx").value=JSON.stringify({itens:S.itens,pago:S.pago,renda:S.renda,metas:S.metas,entradas:S.entradas,cofre:S.cofre,contas:S.contas,rendaNome:S.rendaNome||""},null,1);$("msg").textContent="";$("dbk").showModal()};
$("fc").onclick=()=>$("dbk").close();
$("cp").onclick=async()=>{try{await navigator.clipboard.writeText($("tx").value);$("msg").textContent="Copiado."}catch(e){$("tx").select();$("msg").textContent="Selecione e copie o texto manualmente."}};
$("fl").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{$("tx").value=r.result};r.readAsText(f)};
function converter(a){return a.map(d=>{
 const o={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),nome:String(d.nome||"").trim(),valor:Number(d.valor)||0};
 if(d.tipo==="parcelada"){o.tipo="parcelada";o.inicio=ymStr(ano,d.mes_inicio);o.parcelas=d.mes_fim-d.mes_inicio+1}
 else if(d.tipo==="mensal_unica"||d.tipo==="unica"){o.tipo="unica";o.inicio=ymStr(ano,d.mes)}
 else{o.tipo="fixa";o.inicio=ymStr(ano,1)}
 return o})}
$("im").onclick=()=>{try{const j=JSON.parse($("tx").value);
 if(Array.isArray(j)){S.itens=S.itens.concat(converter(j));$("msg").textContent=j.length+" dívidas importadas para "+ano+" (fixas começam em janeiro)."}
 else if(j&&Array.isArray(j.itens)){S.itens=j.itens;S.metas=j.metas||[];S.entradas=j.entradas||[];S.cofre=j.cofre||[];S.contas=j.contas||[];S.rendaNome=j.rendaNome||"";migrar();S.pago=j.pago||{};S.renda=j.renda||0;$("msg").textContent="Backup restaurado."}
 else throw 0;
 salvar();render()}catch(e){$("msg").textContent="Texto inválido. Cole o JSON completo."}};
migrar();render();
// dados privados por pessoa: cada visitante grava só na própria área
(async()=>{try{
 status("Salvo só neste navegador");
 if(!window.claude)return;
 const [u,db]=await Promise.all([claude.use("user"),claude.use("db")]);
 if(!u||!db)return;
 const id=await u.id();if(!id)return;
 const r=db.doc("data/users/"+id+"/app"),s=await r.get();
 if(s.exists){const d=s.data(),loc=mexeu?{itens:S.itens,pago:S.pago,renda:S.renda,metas:S.metas,entradas:S.entradas,cofre:S.cofre,contas:S.contas}:null;
  S.itens=JSON.parse(JSON.stringify(d.itens||[]));S.metas=JSON.parse(JSON.stringify(d.metas||[]));S.entradas=JSON.parse(JSON.stringify(d.entradas||[]));S.cofre=JSON.parse(JSON.stringify(d.cofre||[]));S.contas=JSON.parse(JSON.stringify(d.contas||[]));S.rendaNome=d.rendaNome||"";S.pago={};(d.pago||[]).forEach(k=>S.pago[k]=1);S.renda=d.renda||0;S.tema=d.tema||"";
  if(loc){const ids=new Set(S.itens.map(x=>x.id));loc.itens.forEach(x=>{if(!ids.has(x.id))S.itens.push(x)});const mi=new Set(S.metas.map(x=>x.id));(loc.metas||[]).forEach(x=>{if(!mi.has(x.id))S.metas.push(x)});["entradas","cofre","contas"].forEach(k=>{const q=new Set(S[k].map(x=>x.id));(loc[k]||[]).forEach(x=>{if(!q.has(x.id))S[k].push(x)})});Object.assign(S.pago,loc.pago);if(loc.renda)S.renda=loc.renda;ref=r;salvar()}
  try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}
  migrar();try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}if(S.tema)document.documentElement.dataset.theme=S.tema;render()}
 else if(S.itens.length||S.renda)await r.set(empacotar());
 ref=r;status("Salvo na sua conta")
}catch(e){}})();
})();
