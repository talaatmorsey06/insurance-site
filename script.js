const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=n=>Number(n).toLocaleString("ar-EG",{minimumFractionDigits:2,maximumFractionDigits:2})+" ج.م";
const today=()=>new Date().toISOString().slice(0,10);
const ld=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
let mem={};const sv=(k,v)=>{mem[k]=v;try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}};
async function sha(s){try{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("ins:"+s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}catch(e){let h=0;for(const c of "ins:"+s)h=(h*31+c.charCodeAt(0))|0;return"f"+h}}
let users=ld("ins_users",[]),docs=ld("ins_docs",[]),me=null,cur="gen",imgs=[],mode=users.length?"login":"setup";
const isAdmin=()=>me&&me.role=="مدير";
const PERMS=[["gen","التأمينات العامة"],["car:إجباري","سيارات — إجباري"],["car:خاص","سيارات — خاص"],["car:تجاري","سيارات — تجاري"]];
const can=k=>isAdmin()||(me.perm||PERMS.map(p=>p[0])).includes(k);
const permBoxes=s=>PERMS.map(([k,l])=>`<label><input type="checkbox" data-p="${k}"${s.includes(k)?" checked":""}> ${l}</label>`).join("");

/* ---------- auth ---------- */
function authUI(){
 $("aerr").textContent="";
 const setup=mode=="setup";
 $("atitle").textContent=setup?"إنشاء حساب المدير":"تسجيل الدخول";
 $("afields").innerHTML=(setup?'<div><label>الاسم الكامل</label><input id="a_n"></div>':'')+'<div><label>اسم المستخدم</label><input id="a_u" autocomplete="username"></div><div><label>كلمة المرور</label><input id="a_p" type="password" autocomplete="current-password"></div>';
 $("abtn").textContent=setup?"إنشاء حساب المدير":"دخول";
 $("anote").textContent=setup?"أول مرة: أنشئ حساب المدير، وسيتحكم بباقي الحسابات والتقارير.":"نسيت كلمة المرور؟ تواصل مع المدير لإعادة تعيينها.";
}
$("abtn").onclick=async()=>{
 const u=$("a_u").value.trim(),p=$("a_p").value;
 if(!u||!p){$("aerr").textContent="أدخل اسم المستخدم وكلمة المرور";return}
 if(mode=="setup"){
  const n=$("a_n").value.trim();
  if(!n||p.length<4){$("aerr").textContent="أدخل الاسم وكلمة مرور لا تقل عن 4 أحرف";return}
  users=[{n,u,h:await sha(p),role:"مدير"}];sv("ins_users",users);me=users[0];enter();return}
 const h=await sha(p),x=users.find(a=>a.u==u&&a.h==h);
 if(!x){$("aerr").textContent="اسم المستخدم أو كلمة المرور غير صحيحة";return}
 me=x;enter();
};
$("logout").onclick=()=>{me=null;$("app").hidden=true;$("auth").hidden=false;mode="login";authUI()};
function enter(){
 $("auth").hidden=true;$("app").hidden=false;
 $("who").textContent=me.n+" — "+me.role;
 const t=[];if(can("gen"))t.push(["gen","التأمينات العامة"]);if(PERMS.some(p=>p[0].startsWith("car")&&can(p[0])))t.push(["car","تأمين السيارات"]);
 if(isAdmin())t.push(["rep","التقارير"],["usr","المستخدمون"]);
 $("tabs").innerHTML=t.map(([k,l])=>`<button data-k="${k}">${l}</button>`).join("");
 $("tabs").querySelectorAll("button").forEach(b=>b.onclick=()=>show(b.dataset.k));
 if(t.length)show(t[0][0]);else{$("p-ins").hidden=true;$("tabs").innerHTML="<p>لا توجد صلاحيات إصدار لحسابك، تواصل مع المدير.</p>"}
}
function show(k){
 $("tabs").querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.k==k));
 const ins=k=="gen"||k=="car";
 $("p-ins").hidden=!ins;$("p-rep").hidden=k!="rep";$("p-usr").hidden=k!="usr";
 if(ins){cur=k;build();renderList()}
 if(k=="rep")report();if(k=="usr")renderUsers();
}

/* ---------- insurance ---------- */
const GEN={"حريق":.0015,"سرقة":.002,"مسؤولية مدنية":.003,"نقل بضائع":.0025,"حوادث شخصية":.004,"أعمال هندسية":.0035};
const COVER={"ضد الغير":.012,"شامل":.035},KINDS={"إجباري":1,"خاص":1,"تجاري":1.3};
const BRANDS=["أبارث","أستون مارتن","ألفا روميو","أودي","أوبل","إنفينيتي","أم جي (MG)","أيون (GAC Aion)","إكسبنج (Xpeng)","إيسوزو","بايك (BAIC)","بنتلي","بورش","بوجاتي","بويك","بونتياك","بيجو","بي إم دبليو","بي واي دي (BYD)","بروتون","بولستار","تاتا","تويوتا","تيسلا","جاك (JAC)","جاكوار","جريت وول","جنيسيس","جيب","جيتور","جيلي (Geely)","جي إم سي","جي إيه سي (GAC)","داسيا","دايو","دايهاتسو","دودج","دونج فينج","دي إس (DS)","دي إف إس كيه (DFSK)","ديفا","رام","رينو","رولز رويس","ريفيان","زيكر (Zeekr)","ساب","سانج يونج","سمارت","سوبارو","سوزوكي","سيات","سيتروين","سيرس (Seres)","سكودا","شانجان","شيري (Chery)","شيفروليه","فاو (FAW)","فورد","فولفو","فولكس فاجن","فيات","فيراري","كاديلاك","كاوا (Kaiyi)","كرايسلر","كوبرا (Cupra)","كيا","لادا","لامبورجيني","لاند روفر","لانسيا","لكزس","لوسيد","ليبموتور (Leapmotor)","لينكولن","لينك آند كو","مازدا","مازيراتي","ماكلارين","ماهيندرا","مرسيدس بنز","ميتسوبيشي","ميني","نيسان","نيو (NIO)","هافال","هامر","هوندا","هونشي (Hongqi)","هيونداي","أخرى"];
const MODELS={"تويوتا":"كورولا،يارس،كامري،راف فور،لاند كروزر،هايلكس،فورتشنر،بريفيا،كراون","هيونداي":"إلنترا،أكسنت،توسان،كريتا،سوناتا،سانتا في،i10،i20،فيرنا","كيا":"سيراتو،سبورتاج،بيكانتو،ريو،سورينتو،سيلتوس،بيجاس،كارنيفال","نيسان":"صني،سنترا،قاشقاي،جوك،إكس تريل،كيكس،باترول،ألتيما","شيفروليه":"أفيو،لانوس،أوبترا،كروز،كابتيفا،ماليبو،سبارك،كروز","مرسيدس بنز":"A200،C180،C200،E200،E300،S500،CLA،GLA،GLC،GLE","بي إم دبليو":"316،320،520،X1،X3،X5،X6","أودي":"A3،A4،A6،Q3،Q5،Q7","فولكس فاجن":"جيتا،باسات،تيجوان،بولو،جولف،تي روك","سكودا":"أوكتافيا،فابيا،سوبيرب،كودياك،كاروك،كامك","رينو":"لوجان،ميجان،داستر،كابتشر،فلوانس،سانديرو،كويد","بيجو":"301،508،2008،3008،408،5008","ميتسوبيشي":"لانسر،أوتلاندر،إكليبس كروس،باجيرو،أتراج،إل 200","سوزوكي":"سويفت،ديزاير،فيتارا،إرتيجا،بالينو،سيليريو","فيات":"تيبو،500،دوبلو،بونتو","فورد":"فوكس،فييستا،إكسبلورر،إيكو سبورت،رينجر","هوندا":"سيفيك،أكورد،CR-V،سيتي،HR-V","مازدا":"3،6،CX-3،CX-5،CX-9","أم جي (MG)":"MG5،MG6،ZS،HS،RX5،MG4،Marvel R","شيري (Chery)":"تيجو 3،تيجو 4،تيجو 7،تيجو 8،أريزو 5،أريزو 6","جيلي (Geely)":"كولراي،إمجراند،أزكارا،توجيلا،مونجارو","بي واي دي (BYD)":"F3،سونج،هان،دولفين،أتو 3،سيجل","بايك (BAIC)":"X7،X55،BJ40،U5","جيتور":"X70،X90،داش،T2","هافال":"H6،جوليان،H9،دارجو","جيب":"رانجلر،شيروكي،جراند شيروكي،كومباس،رينيجيد","لاند روفر":"ديسكفري،رينج روفر،رينج روفر سبورت،ديفندر،إيفوك","لكزس":"ES،IS،RX،NX،LX","فولفو":"XC40،XC60،XC90،S60،S90","ميني":"كوبر،كنتري مان،كلوبمان","دايهاتسو":"تيريوس،سيريون","شانجان":"CS35،CS75،CS95،ألسفين،إيدو","سيات":"ليون،إبيزا،أتيكا،أروناه","أوبل":"أسترا،كورسا،موكا،فيكترا","سيتروين":"C3،C4،C5،C-Elysee،بيرلينجو","دودج":"تشارجر،دورانجو،تشالنجر","تيسلا":"Model 3،Model Y،Model S،Model X","دونج فينج":"AX7،S30،H30 كروس","بورش":"كايين،ماكان،باناميرا،911","جي إيه سي (GAC)":"GS3،GS8،GN6،إمباو","سوبارو":"إمبريزا،فورستر،XV،ليجاسي","ايسوزو":"D-Max،MU-X","إيسوزو":"D-Max،MU-X"};
let lastB=null;
const common=[["name","اسم المؤمَّن له","text"],["nid","الرقم القومي / السجل التجاري","text"],["phone","رقم الهاتف","tel"],["addr","العنوان","text"]];
const F={
gen:[...common,["kind","نوع التأمين","select",Object.keys(GEN)],["item","وصف الشيء المؤمَّن عليه","text"],["place","موقع الخطر","text"],["sum","مبلغ التأمين (ج.م)","number"],["start","بداية التأمين","date"],["months","المدة (شهر)","number"],["bene","المستفيد (اختياري)","text"]],
car:[...common,["plate","رقم اللوحة","text"],["brand","الماركة","select",BRANDS],["model","الموديل","text"],["year","سنة الصنع","number"],["chassis","رقم الشاسيه","text"],["motor","رقم الموتور","text"],["color","اللون","text"],["use","نوع التأمين","select",Object.keys(KINDS)],["cover","مستوى التغطية (للخاص والتجاري)","select",Object.keys(COVER)],["sum","قيمة السيارة (ج.م)","number"],["start","بداية التأمين","date"],["months","المدة (شهر)","number"]]};
const T={gen:"بيانات وثيقة التأمينات العامة",car:"بيانات وثيقة تأمين السيارة"};
const v=id=>$("f_"+id).value.trim();
function build(){
 $("ftitle").textContent=T[cur];$("ltitle").textContent="وثائق "+(cur=="car"?"تأمين السيارات":"التأمينات العامة")+" الصادرة";
 $("form").innerHTML=F[cur].map(([id,l,t,o])=>`<div><label for="f_${id}">${l}</label>`+(t=="select"?`<select id="f_${id}">${o.map(x=>`<option>${x}</option>`).join("")}</select>`:`<input id="f_${id}" type="${t}"${t=="number"?' min="0"':''}>`)+`</div>`).join("");
 if(cur=="car")[...$("f_use").options].forEach(o=>{if(!can("car:"+o.value))o.remove()});$("f_start").value=today();$("f_months").value=12;if(cur=="car")$("f_year").value=new Date().getFullYear();
 if(cur=="car"){$("f_brand").insertAdjacentHTML("afterbegin",'<option value="">— اختر الماركة —</option>');$("f_brand").value="";$("form").insertAdjacentHTML("beforeend",'<datalist id="mdl"></datalist>');$("f_model").setAttribute("list","mdl");$("f_model").placeholder="اكتب أو اختر الموديل";lastB=null}$("form").oninput=calc;calc();$("err").textContent="";imgs=[];thumbs();$("img").value="";$("doc").hidden=true;$("docbtns").hidden=true;
}
function compute(r){
 const sum=+r.sum||0,m=+r.months||0;let p=0;
 if(cur=="gen"||r.cur=="gen")p=sum*GEN[r.kind]*m/12;
 else{p=r.use=="إجباري"?600:sum*COVER[r.cover]*KINDS[r.use];if(+r.year&&+r.year<2015)p*=1.1;p*=m/12}
 const stamp=p*.01,sup=p*.005,fee=p>0?25:0;return{prem:p,stamp,sup,fee,tot:p+stamp+sup+fee};
}
const vals=()=>{const o=Object.fromEntries(F[cur].map(([id])=>[id,v(id)]));if(cur=="car"&&o.use=="إجباري")o.cover="—";return o};
function calc(){
 if(cur=="car"){$("f_cover").disabled=$("f_use").value=="إجباري";const b=$("f_brand").value;if(b!==lastB){lastB=b;$("mdl").innerHTML=(MODELS[b]||"").split("،").filter(Boolean).map(m=>`<option value="${m}">`).join("")}}
 const c=compute({...vals(),cur});
 $("calc").innerHTML=[["القسط الصافي",c.prem],["رسم الدمغة",c.stamp],["رسوم الإشراف",c.sup],["مصاريف الإصدار",c.fee]].map(([a,b])=>`<div>${a}<b>${fmt(b)}</b></div>`).join("")+`<div class="tot">الإجمالي المستحق<b>${fmt(c.tot)}</b></div>`;return c;
}
function packImg(f){return new Promise(res=>{const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,700/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=im.width*k;c.height=im.height*k;c.getContext("2d").drawImage(im,0,0,c.width,c.height);res(c.toDataURL("image/jpeg",.6))};im.onerror=()=>res(null);im.src=fr.result};fr.onerror=()=>res(null);fr.readAsDataURL(f)})}
$("img").onchange=async e=>{for(const f of e.target.files){const d=await packImg(f);if(d&&imgs.length<6)imgs.push(d)}e.target.value="";thumbs()};
function thumbs(){$("thumbs").innerHTML=imgs.map((s,i)=>`<div><img src="${s}" alt=""><button data-i="${i}" title="حذف">×</button></div>`).join("");$("thumbs").querySelectorAll("button").forEach(b=>b.onclick=()=>{imgs.splice(+b.dataset.i,1);thumbs()})}
const addMonths=(d,m)=>{const x=new Date(d);x.setMonth(x.getMonth()+m);return x.toISOString().slice(0,10)};
$("gen").onclick=()=>{
 const miss=F[cur].filter(([id])=>id!="bene"&&!v(id)).map(x=>x[1]);
 if(miss.length){$("err").textContent="من فضلك أكمل الحقول: "+miss.join("، ");return}
 if(!(+v("sum")>0)||!(+v("months")>0)){$("err").textContent="تأكد من إدخال مبلغ ومدة صحيحين";return}
 $("err").textContent="";
 const f=vals(),c=compute({...f,cur}),no=(cur=="car"?"MOT-":"GEN-")+new Date().getFullYear()+"-"+String(docs.length+1).padStart(5,"0");
 const r={no,cur,f,c,imgs:[...imgs],end:addMonths(f.start,+f.months),date:today(),by:me.n,byU:me.u};
 docs.unshift(r);
 if(!sv("ins_docs",docs.slice(0,60))){const lite=docs.map(d=>({...d,imgs:[]}));sv("ins_docs",lite.slice(0,60));$("err").textContent="تعذر حفظ الصور في السجل (المساحة ممتلئة)، تم حفظ الوثيقة بدونها."}
 renderDoc(r);renderList();
};
$("reset").onclick=build;
function renderDoc(r){
 const f=r.f,k=r.cur,title=k=="car"?"وثيقة تأمين سيارة":"وثيقة تأمين عام — "+f.kind;
 const rows=F[k].filter(([id])=>!["name","nid","phone","addr","sum","start","months"].includes(id)).map(([id,l])=>`<tr><th>${l}</th><td colspan="3">${esc(f[id])||"—"}</td></tr>`).join("");
 const terms=k=="car"?["تسري الوثيقة على السيارة الموضحة بياناتها خلال مدة التأمين المحددة.","يلتزم المؤمَّن له بإبلاغ الشركة بأي حادث خلال 48 ساعة.","نوع التأمين «"+esc(f.use)+"»"+(f.cover!="—"?" بمستوى تغطية «"+esc(f.cover)+"»":"")+" وفق الشروط العامة والاستثناءات المرفقة.","لا تسري الوثيقة إذا استُخدمت السيارة في غير الغرض المبيَّن بها.","يحق للشركة إلغاء الوثيقة عند ثبوت تقديم بيانات غير صحيحة."]:["تغطي الوثيقة الأخطار المؤمَّن ضدها فقط خلال مدة التأمين.","يلتزم المؤمَّن له باتخاذ الاحتياطات المعقولة لمنع وقوع الخسارة.","يجب إخطار الشركة فور وقوع أي حادث أو خسارة.","يُحدد التعويض على أساس القيمة الفعلية بما لا يتجاوز مبلغ التأمين.","يحق للشركة إلغاء الوثيقة عند ثبوت تقديم بيانات غير صحيحة."];
 const c=r.c;$("doc").hidden=false;$("docbtns").hidden=false;
 $("doc").innerHTML=`<h3>${title}</h3><div class="sub">رقم الوثيقة: ${r.no} &nbsp;|&nbsp; تاريخ الإصدار: ${r.date} &nbsp;|&nbsp; المُصدِر: ${esc(r.by)}</div>
 <table><tr><th>المؤمَّن له</th><td>${esc(f.name)}</td><th>الرقم القومي/السجل</th><td>${esc(f.nid)}</td></tr>
 <tr><th>الهاتف</th><td>${esc(f.phone)}</td><th>العنوان</th><td>${esc(f.addr)}</td></tr>${rows}
 <tr><th>${k=="car"?"قيمة السيارة":"مبلغ التأمين"}</th><td>${fmt(f.sum)}</td><th>مدة التأمين</th><td>${esc(f.months)} شهر</td></tr>
 <tr><th>من تاريخ</th><td>${esc(f.start)}</td><th>إلى تاريخ</th><td>${r.end}</td></tr></table>
 <h4>الأقساط والرسوم</h4><table><tr><th>القسط الصافي</th><td>${fmt(c.prem)}</td><th>رسم الدمغة</th><td>${fmt(c.stamp)}</td></tr>
 <tr><th>رسوم الإشراف</th><td>${fmt(c.sup)}</td><th>مصاريف الإصدار</th><td>${fmt(c.fee)}</td></tr>
 <tr><th>الإجمالي</th><td colspan="3"><b>${fmt(c.tot)}</b></td></tr></table>
 ${r.imgs&&r.imgs.length?`<h4>المرفقات</h4><div class="thumbs">${r.imgs.map(s=>`<img src="${s}" alt="مرفق">`).join("")}</div>`:""}
 <h4>الشروط العامة</h4><ol>${terms.map(t=>`<li>${t}</li>`).join("")}</ol>
 <div class="sig"><div><span>توقيع المؤمَّن له</span></div><div><span>توقيع وختم الشركة</span></div></div>`;
 $("doc").scrollIntoView({behavior:"smooth"});
}
function renderList(){
 const l=docs.filter(d=>d.cur==cur&&(isAdmin()||d.byU==me.u));
 $("rows").innerHTML=l.length?l.map(d=>`<tr><td>${esc(d.no)}</td><td>${esc(d.f.name)}</td><td>${fmt(d.c.tot)}</td><td>${d.date}</td><td>${esc(d.by)}</td><td><button class="btn sm alt" data-n="${esc(d.no)}">عرض</button></td></tr>`).join(""):'<tr><td colspan="6">لا توجد وثائق صادرة بعد</td></tr>';
 $("rows").querySelectorAll("button").forEach(b=>b.onclick=()=>renderDoc(docs.find(d=>d.no==b.dataset.n)));
}

/* ---------- reports (admin) ---------- */
function report(){
 if(!isAdmin())return;
 const a=$("rf").value||"0000-00-00",b=$("rt").value||"9999-99-99";
 const l=docs.filter(d=>d.date>=a&&d.date<=b);
 const grp=fn=>{const m={};l.forEach(d=>{const k=fn(d);m[k]=m[k]||{n:0,t:0};m[k].n++;m[k].t+=d.c.tot});return Object.entries(m)};
 const tot=l.reduce((s,d)=>s+d.c.tot,0),mx=x=>Math.max(1,...x.map(e=>e[1].t));
 const tbl=(h,g)=>{const m=mx(g);return`<h2 style="margin-top:18px">${h}</h2><div class="scroll"><table><thead><tr><th>البند</th><th>العدد</th><th>الإجمالي</th><th style="width:35%"></th></tr></thead><tbody>${g.length?g.map(([k,x])=>`<tr><td>${esc(k)}</td><td>${x.n}</td><td>${fmt(x.t)}</td><td><div class="bar" style="width:${Math.round(x.t/m*100)}%"></div></td></tr>`).join(""):'<tr><td colspan="4">لا توجد بيانات</td></tr>'}</tbody></table></div>`};
 $("rout").innerHTML=`<div class="calc"><div>عدد الوثائق<b>${l.length}</b></div><div>إجمالي الأقساط<b>${fmt(tot)}</b></div><div>تأمين عام<b>${l.filter(d=>d.cur=="gen").length}</b></div><div>تأمين سيارات<b>${l.filter(d=>d.cur=="car").length}</b></div></div>`
  +tbl("حسب النوع",grp(d=>d.cur=="car"?"تأمين السيارات":"عام — "+d.f.kind))+tbl("حسب الموظف",grp(d=>d.by))+tbl("حسب الشهر",grp(d=>d.date.slice(0,7)).sort());
}
$("rgo").onclick=report;

/* ---------- users (admin) ---------- */
function renderUsers(){
 $("uperm").innerHTML=permBoxes(PERMS.map(p=>p[0]));
 $("urows").innerHTML=users.map((u,i)=>`<tr><td>${esc(u.n)}</td><td>${esc(u.u)}</td><td>${esc(u.role)}</td><td class="perms" data-u="${i}">${u.role=="مدير"?"الكل":permBoxes(u.perm||PERMS.map(p=>p[0]))}</td><td><input type="password" id="np${i}" placeholder="كلمة مرور جديدة" autocomplete="new-password"></td><td style="white-space:nowrap"><button class="btn sm" data-r="${i}">إعادة تعيين</button> ${u.u==me.u?"":`<button class="btn sm red" data-d="${i}">حذف</button>`}<div class="err" id="ue${i}"></div></td></tr>`).join("");
 $("urows").querySelectorAll("[data-r]").forEach(b=>b.onclick=async()=>{const i=+b.dataset.r,p=$("np"+i).value;if(p.length<4){$("ue"+i).textContent="4 أحرف على الأقل";return}users[i].h=await sha(p);sv("ins_users",users);$("ue"+i).innerHTML='<span class="ok">تم التغيير</span>';$("np"+i).value=""});
 $("urows").querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{if(b.dataset.s){users.splice(+b.dataset.d,1);sv("ins_users",users);renderUsers()}else{b.dataset.s=1;b.textContent="تأكيد الحذف؟"}});
 $("urows").querySelectorAll("td[data-u] input").forEach(c=>c.onchange=()=>{const td=c.closest("td");users[+td.dataset.u].perm=[...td.querySelectorAll("input:checked")].map(x=>x.dataset.p);sv("ins_users",users)});
}
$("uadd").onclick=async()=>{
 const n=$("un").value.trim(),u=$("uu").value.trim(),p=$("up").value,role=$("ur").value;
 if(!n||!u||p.length<4){$("uerr").textContent="أكمل الاسم واسم المستخدم وكلمة مرور (4 أحرف على الأقل)";return}
 if(users.some(x=>x.u==u)){$("uerr").textContent="اسم المستخدم موجود بالفعل";return}
 users.push({n,u,h:await sha(p),role,perm:[...$("uperm").querySelectorAll("input:checked")].map(x=>x.dataset.p)});sv("ins_users",users);["un","uu","up"].forEach(i=>$(i).value="");$("uerr").innerHTML='<span class="ok">تمت إضافة المستخدم</span>';renderUsers();
};
authUI();
