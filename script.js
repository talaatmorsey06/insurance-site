const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=n=>Number(n).toLocaleString("ar-EG",{minimumFractionDigits:2,maximumFractionDigits:2})+" ج.م";
const today=()=>new Date().toISOString().slice(0,10);
const ld=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
let mem={};const sv=(k,v)=>{mem[k]=v;try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}};
async function sha(s){try{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("ins:"+s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}catch(e){let h=0;for(const c of "ins:"+s)h=(h*31+c.charCodeAt(0))|0;return"f"+h}}
let users=ld("ins_users",[]),docs=ld("ins_docs",[]),me=null,cur="gen",imgs=[],mode=users.length?"login":"setup";
const isAdmin=()=>me&&(me.role=="مدير"||me.u=="admin");
const PERMS=[["gen","التأمينات العامة"],["car:إجباري","سيارات — إجباري"],["car:خاص","سيارات — خاص"],["car:تجاري","سيارات — تجاري"],["clm","إنشاء تعويض"]];
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
 $("who").textContent=me.tmp?"مدير مؤقت (لم يُحدَّد مدير بعد)":me.n+" ("+me.role+")";$("logout").hidden=!!me.tmp;$("tmpb").hidden=!(me.tmp||me.def);$("tmpt").textContent=me.def?"⚠ كلمة مرور المدير ما زالت الافتراضية، غيّرها الآن من «المستخدمون والصلاحيات».":"⚠ لم يتم تحديد مدير للنظام بعد.";
 $("dt").textContent=new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}).replace(/ /g,"-");
 const hasCar=PERMS.some(p=>p[0].startsWith("car")&&can(p[0])),ins=[],dep=[];
 if(can("gen")){dep.push("التأمينات العامة");ins.push(["sgen","وثائق التأمينات العامة"])}
 if(hasCar){dep.push("تأمين السيارات");ins.push(["scar","وثائق تأمين السيارات"])}
 $("dep").textContent=dep.join(" + ")||"—";
 $("hnote").textContent=ins.length?"اختر من القائمة العلوية: وثيقة ← نوع الوثيقة المراد إصدارها":"لا توجد صلاحيات إصدار لحسابك، تواصل مع المدير.";
 const M=[["وثيقة",ins],["الملاحق",ins.length?[["end_chg","ملحق تغييرات عامة"],["end_add","ملحق إضافة"],["end_ext","ملحق تمديد الفترة التأمينية"]].concat(isAdmin()?[["end_cls","إلغاء بالتصفية"]]:[]).concat([["end_list","سجل الملاحق"]]):[]],["التعويضات",(ins.length&&can("clm")?[["clm","إنشاء تعويض"]]:[]).concat(isAdmin()?[["crep","تقارير التعويضات"]]:[])],["التقارير",isAdmin()?[["rep","عرض التقرير"]]:[]],["أشياء أخرى",isAdmin()?[["usr","المستخدمون والصلاحيات"]]:[]],["إعادة التأمين",isAdmin()?[["ri","إضافة اتفاقية"]]:[]]];
 $("menu").innerHTML='<div class="mi"><button class="d" data-k="home">المنزل</button></div>'+M.filter(m=>m[1].length).map(([t,it])=>`<div class="mi"><button>${t}</button><div class="dd">${it.map(([k,l])=>`<button data-k="${k}"${k?"":" disabled"}>${l}</button>`).join("")}</div></div>`).join("");
 $("menu").querySelectorAll(".mi>button").forEach(b=>b.onclick=e=>{e.stopPropagation();if(b.dataset.k){closeM();show(b.dataset.k);return}const p=b.parentNode,o=p.classList.contains("open");closeM();if(!o)p.classList.add("open")});
 $("menu").querySelectorAll(".dd button").forEach(b=>b.onclick=()=>{closeM();show(b.dataset.k)});
 show("home");
}
const closeM=()=>$("menu").querySelectorAll(".mi").forEach(x=>x.classList.remove("open"));
document.addEventListener("click",closeM);
$("ttl").onclick=$("logo").onclick=()=>{if(me)show("home")};
function show(k){
 edit=null;const sr=k=="sgen"||k=="scar",ins=k=="gen"||k=="car";
 $("p-home").hidden=k!="home";$("p-search").hidden=!sr;$("p-ins").hidden=!ins;$("p-rep").hidden=k!="rep";$("p-usr").hidden=k!="usr";$("p-producers").hidden=k!="producers";$("p-clm").hidden=k!="clm";$("p-crep").hidden=k!="crep";$("p-ri").hidden=k!="ri";$("p-end").hidden=!k.startsWith("end_");$("p-terms").hidden=true;$("p-prem").hidden=true;
 if(sr){cur=k.slice(1);searchUI()}
 if(ins){cur=k;build()}
 if(k=="rep")report();if(k=="usr")renderUsers();if(k=="producers")renderProducers();if(k.startsWith("end_"))endUI(k.slice(4));if(k=="clm")clmUI();if(k=="ri")riUI();if(k=="crep")crep();
 window.scrollTo(0,0);
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
F.car.push(["fuel","الوقود","select",["","بنزين","سولار","غاز طبيعي","كهرباء","هجين"]],["cyl","عدد السلندرات","number"],["body","شكل الهيكل","select",["","سيدان","هاتشباك","ستيشن","SUV","كروس أوفر","كوبيه","كشف","بيك أب","ميكروباص","أخرى"]],["cond","جديدة / مستعملة","select",["","جديدة","مستعملة"]],["cc","السعة اللترية (cc)","number"],["pax","عدد الركاب","number"],["prev","شركة التأمين السابقة","text"],["gov","المحافظة","select",["","القاهرة","الجيزة","الإسكندرية","القليوبية","الشرقية","الدقهلية","الغربية","المنوفية","البحيرة","كفر الشيخ","دمياط","بورسعيد","الإسماعيلية","السويس","شمال سيناء","جنوب سيناء","الفيوم","بني سويف","المنيا","أسيوط","سوهاج","قنا","الأقصر","أسوان","البحر الأحمر","الوادي الجديد","مطروح"]],["dedt","نوع التحمل","select",["","بدون تحمل","عن كل حادث (مبلغ)","نسبة من الخسارة"]],["dedp","نسبة التحمل %","number"],["dedv","قيمة التحمل (ج.م)","number"]);
["gen","car"].forEach(k=>F[k].push(["insured","اسم المؤمَّن عليه","text"],["ptype","نوع العميل","select",["","فردي","شركة"]],["prod","الحالة الإنتاجية","text"]));
const OPT=["insured","ptype","prod","fuel","cyl","body","cond","cc","pax","prev","gov","dedt","dedp","dedv","bene"];
const REQ={gen:["name","nid","phone","addr","kind","item","place","sum","start","months"],car:["name","nid","phone","addr","use","brand","model","year","plate","chassis","motor","color","sum","start","months"]};
const LAY={hd:["months","name","nid","phone","addr","start"],body:{gen:["insured","ptype","prod","kind","item","place","sum","bene"],car:["insured","ptype","prod","use","cover","brand","model","year","plate","chassis","motor","color","fuel","cyl","body","cond","cc","pax","prev","gov","dedt","dedp","dedv","sum"]}};
const dedText=f=>{if(!f.dedt||f.dedt=="بدون تحمل")return"";return f.dedt+(+f.dedp?" — "+f.dedp+"% من قيمة الخسارة":"")+(+f.dedv?" — "+f.dedv+" ج.م":"")};
const T={gen:"بيانات وثيقة التأمينات العامة",car:"بيانات وثيقة تأمين السيارة"};
const v=id=>$("f_"+id).value.trim();
function build(){
 $("ftitle").textContent=T[cur];
 $("form").innerHTML=F[cur].map(([id,l,t,o])=>`<div><label for="f_${id}">${l}</label>`+(t=="select"?`<select id="f_${id}">${o.map(x=>`<option>${x}</option>`).join("")}</select>`:`<input id="f_${id}" type="${t}"${t=="number"?' min="0"':''}>`)+`</div>`).join("");
 layoutForm();
 if(cur=="car")[...$("f_use").options].forEach(o=>{if(!can("car:"+o.value))o.remove()});$("f_start").value=today();$("f_months").value=12;if(cur=="car")$("f_year").value=new Date().getFullYear();
 if(cur=="car"){$("f_brand").insertAdjacentHTML("afterbegin",'<option value="">— اختر الماركة —</option>');$("f_brand").value="";$("form").insertAdjacentHTML("beforeend",'<datalist id="mdl"></datalist>');$("f_model").setAttribute("list","mdl");$("f_model").placeholder="اكتب أو اختر الموديل";lastB=null}$("form").oninput=calc;calc();$("err").textContent="";imgs=[];thumbs();$("img").value="";$("doc").hidden=true;$("docbtns").hidden=true;
}
function compute(r){
 const sum=+r.sum||0,m=+r.months||0;let p=0;
 if(cur=="gen"||r.cur=="gen")p=sum*GEN[r.kind]*m/12;
 else{p=r.use=="إجباري"?600:sum*COVER[r.cover]*KINDS[r.use];if(+r.year&&+r.year<2015)p*=1.1;p*=m/12}
 const stamp=p*.01,sup=p*.005,fee=p>0?25:0;return{prem:p,stamp,sup,fee,tot:p+stamp+sup+fee};
}
const vals=()=>{const o=Object.fromEntries(F[cur].map(([id])=>[id,v(id)]));if(cur=="car"&&o.use=="إجباري")o.cover="—";if(!isAdmin()){o.nid="";o.phone=""}return o};
function calc(){
 if(cur=="car"){$("f_cover").disabled=$("f_use").value=="إجباري";const b=$("f_brand").value;if(b!==lastB){lastB=b;$("mdl").innerHTML=(MODELS[b]||"").split("،").filter(Boolean).map(m=>`<option value="${m}">`).join("")}}
 hdUpd();
}
function packImg(f){return new Promise(res=>{const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,700/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=im.width*k;c.height=im.height*k;c.getContext("2d").drawImage(im,0,0,c.width,c.height);res(c.toDataURL("image/jpeg",.6))};im.onerror=()=>res(null);im.src=fr.result};fr.onerror=()=>res(null);fr.readAsDataURL(f)})}
$("img").onchange=async e=>{for(const f of e.target.files){const d=await packImg(f);if(d&&imgs.length<6)imgs.push(d)}e.target.value="";thumbs()};
function thumbs(){$("thumbs").innerHTML=imgs.map((s,i)=>`<div><img src="${s}" alt=""><button data-i="${i}" title="حذف">×</button></div>`).join("");$("thumbs").querySelectorAll("button").forEach(b=>b.onclick=()=>{imgs.splice(+b.dataset.i,1);thumbs()})}
const addMonths=(d,m)=>{const x=new Date(d);x.setMonth(x.getMonth()+m);return x.toISOString().slice(0,10)};
$("gen").onclick=()=>{
 const miss=F[cur].filter(([id])=>REQ[cur].includes(id)&&!(!isAdmin()&&(id=="nid"||id=="phone"))&&!v(id)).map(x=>x[1]);
 if(miss.length){$("err").textContent="من فضلك أكمل الحقول: "+miss.join("، ");return}
 if(!(+v("sum")>0)||!(+v("months")>0)){$("err").textContent="تأكد من إدخال مبلغ ومدة صحيحين";return}
 $("err").textContent="";
 const f=vals();pend={f,imgs:[...imgs],m:+f.months};termsUI();
};
$("reset").onclick=build;
function layoutForm(){
 const w=id=>$("f_"+id).parentNode,hd=$("hd"),fm=$("form");
 hd.innerHTML="";
 LAY.hd.forEach(id=>hd.appendChild(w(id)));
 hd.insertAdjacentHTML("beforeend",'<div><label>تاريخ النهاية</label><input id="h_end" readonly></div><div><label>العملة</label><input value="جنيه مصري" readonly></div><div><label>العملية</label><input id="h_op" readonly></div><div><label>المنتج</label><input id="h_prod" readonly></div><div><label>حالة الوثيقة</label><input value="قيد الإصدار" readonly></div><div><label>رقم الوثيقة</label><input value="يُولَّد تلقائيًا عند الإصدار" readonly></div>');
 LAY.body[cur].forEach(id=>fm.appendChild(w(id)));
 const mi=$("f_months");w("months").querySelector("label").textContent="الدورة";
 mi.insertAdjacentHTML("beforebegin",'<select id="f_cyc"><option value="12">سنوي</option><option value="6">نصف سنوي</option><option value="3">ربع سنوي</option><option value="1">شهري</option><option value="0">مدة أخرى (بالأشهر)</option></select>');
 mi.hidden=true;
 $("f_cyc").onchange=()=>{const x=+$("f_cyc").value;if(x){mi.value=x;mi.hidden=true}else{mi.hidden=false;mi.focus()}hdUpd()};
 REQ[cur].forEach(id=>{const e=$("f_"+id);if(e)e.classList.add("req")});if(!isAdmin())["nid","phone"].forEach(id=>{w(id).hidden=true;$("f_"+id).classList.remove("req")});$("f_cyc").classList.add("req");
}
function cycSync(){const m=+$("f_months").value||0,o=[12,6,3,1].includes(m);$("f_cyc").value=o?String(m):"0";$("f_months").hidden=o}
function hdUpd(){
 if(!$("h_end"))return;
 const m=+$("f_months").value||0,s=$("f_start").value;
 $("h_end").value=s&&m>0?addMonths(s,m):"";
 $("h_op").value="إصدار جديد — "+(cur=="car"?"سيارات":"تأمينات عامة");
 $("h_prod").value=cur=="car"?"تأمين سيارات — "+($("f_use").value||"")+($("f_use").value=="إجباري"?"":" — "+$("f_cover").value):"تأمينات عامة — "+($("f_kind").value||"");
}
$("hd").addEventListener("input",hdUpd);$("hd").addEventListener("change",hdUpd);
function renderDoc(r){
 const f=r.f,k=r.cur,title=k=="car"?"وثيقة تأمين سيارة":"وثيقة تأمين عام — "+f.kind;
 const rows=F[k].filter(([id])=>!["name","nid","phone","addr","sum","start","months"].includes(id)&&!(OPT.includes(id)&&!f[id])).map(([id,l])=>`<tr><th>${l}</th><td colspan="3">${esc(f[id])||"—"}</td></tr>`).join("");
 const terms=k=="car"?["تسري الوثيقة على السيارة الموضحة بياناتها خلال مدة التأمين المحددة.","يلتزم المؤمَّن له بإبلاغ الشركة بأي حادث خلال 48 ساعة.","نوع التأمين «"+esc(f.use)+"»"+(f.cover!="—"?" بمستوى تغطية «"+esc(f.cover)+"»":"")+" وفق الشروط العامة والاستثناءات المرفقة.","لا تسري الوثيقة إذا استُخدمت السيارة في غير الغرض المبيَّن بها.","يحق للشركة إلغاء الوثيقة عند ثبوت تقديم بيانات غير صحيحة."]:["تغطي الوثيقة الأخطار المؤمَّن ضدها فقط خلال مدة التأمين.","يلتزم المؤمَّن له باتخاذ الاحتياطات المعقولة لمنع وقوع الخسارة.","يجب إخطار الشركة فور وقوع أي حادث أو خسارة.","يُحدد التعويض على أساس القيمة الفعلية بما لا يتجاوز مبلغ التأمين.","يحق للشركة إلغاء الوثيقة عند ثبوت تقديم بيانات غير صحيحة."];
 const c=r.c;$("doc").hidden=false;$("docbtns").hidden=false;curDoc=r;$("doc_edit").hidden=$("doc_del").hidden=!isAdmin();$("doc_del").textContent="🗑 حذف الوثيقة";$("doc_del").dataset.s="";prnSt();
 $("doc").innerHTML=`<h3>${title}</h3><div class="sub">رقم الوثيقة: ${r.no} &nbsp;|&nbsp; تاريخ الإصدار: ${r.date} &nbsp;|&nbsp; المُصدِر: ${esc(r.by)}${r.edited?" &nbsp;|&nbsp; آخر تعديل: "+r.edited+" ("+esc(r.editedBy)+")":""}${r.closed?" &nbsp;|&nbsp; ⛔ مغلقة بتاريخ "+r.closed.date:""}</div>
 <table><tr><th>المؤمَّن له</th><td>${esc(f.name)}</td><th>الرقم القومي/السجل</th><td>${esc(f.nid)||"—"}</td></tr>
 <tr><th>الهاتف</th><td>${esc(f.phone)||"—"}</td><th>العنوان</th><td>${esc(f.addr)}</td></tr>${rows}
 <tr><th>${k=="car"?"قيمة السيارة":"مبلغ التأمين"}</th><td>${fmt(f.sum)}</td><th>مدة التأمين</th><td>${esc(f.months)} شهر</td></tr>
 <tr><th>من تاريخ</th><td>${esc(f.start)}</td><th>إلى تاريخ</th><td>${r.end}</td></tr></table>
 ${premHtml(r)}
 ${r.imgs&&r.imgs.length?`<h4>المرفقات</h4><div class="thumbs">${r.imgs.map(s=>`<img src="${s}" alt="مرفق">`).join("")}</div>`:""}
 ${termsHtml(r,terms)}
 <div class="sig"><div><span>توقيع المؤمَّن له</span></div><div><span>توقيع وختم الشركة</span></div></div>`;
 $("doc").scrollIntoView({behavior:"smooth"});
}

/* ---------- نافذة طباعة الوثيقة ---------- */
const printTypes={
 original:"A. جدول الوثيقة - عربي - ORIGINAL",
 endorsement:"C. رسالة الملحق - عربي",
 debit:"E. إشعار الدائن / المدين للمشترك أو المنتج",
 closing:"G. فك كلوزنج سليب",
 optional:"H. إشعار دائن / مدين للاختياري",
 distribution:"Policy Distribution Report"
};
let selectedPrintType="original",printTarget=null;
function openPrintWindow(){
 if(!curDoc)return;
 selectedPrintType="original";printTarget=curDoc;
 $("printName").value=printTypes.original;
 $("printNo").value=curDoc.no;
 $("printDocList").innerHTML=docs.filter(d=>isAdmin()||d.byU==me.u).map(d=>`<option value="${esc(d.no)}">${esc(d.f.name)} — ${esc(d.date)}</option>`).join("");
 $("printTypes").querySelectorAll("[data-type]").forEach(b=>b.classList.toggle("selected",b.dataset.type==="original"));
 $("printModal").hidden=false;
 buildPrintPreview();
}
function choosePrintDocument(){
 const no=$("printNo").value.trim(),r=docs.find(d=>d.no===no&&(isAdmin()||d.byU==me.u));
 if(!r){$("printPreviewArea").textContent="لم يتم العثور على وثيقة بهذا الرقم أو ليست لديك صلاحية الاطلاع عليها.";return false}
 printTarget=r;return true;
}
function makePrintHtml(r,type){
 const f=r.f||{},kind=r.cur==="car"?"تأمين السيارات":"التأمينات العامة";
 const amount=fmt(r.c&&r.c.tot||0),sum=fmt(f.sum||0);
 const head=printTypes[type]||printTypes.original;
 const summary=`<table><tr><th>رقم الوثيقة</th><td>${esc(r.no)}</td><th>تاريخ الإصدار</th><td>${esc(r.date)}</td></tr><tr><th>المؤمَّن له</th><td>${esc(f.name||"—")}</td><th>نوع التأمين</th><td>${kind}</td></tr><tr><th>مبلغ التأمين</th><td>${sum}</td><th>إجمالي القسط</th><td>${amount}</td></tr><tr><th>بداية التأمين</th><td>${esc(f.start||"—")}</td><th>نهاية التأمين</th><td>${esc(r.end||"—")}</td></tr><tr><th>المنتج</th><td>${esc(r.producerName||f.prod||"—")}</td><th>كود الهيئة</th><td>${esc(r.producerCode||"—")}</td></tr><tr><th>المُصدِر</th><td colspan="3">${esc(r.by||"—")}</td></tr></table>`;
 let note="";
 if(type==="endorsement") note="السادة / "+esc(f.name||"العميل")+"، نحيطكم علمًا ببيانات الوثيقة الموضحة أعلاه. يرجى الرجوع إلى الشركة عند طلب أي تعديل أو إصدار ملحق.";
 if(type==="debit") note=`إشعار مالي خاص بالوثيقة رقم ${esc(r.no)}. إجمالي القسط المسجل بالنظام: <b>${amount}</b>.`;
 if(type==="closing") note="بيان إغلاق / تسوية للوثيقة وفق الحالة المسجلة بالنظام. لا يُعد هذا المستند إثباتًا لإغلاق الوثيقة ما لم تكن حالة الوثيقة مسجلة كمغلقة.";
 if(type==="optional") note=`إشعار دائن / مدين للاختياري — الوثيقة رقم ${esc(r.no)}. القيمة المسجلة: <b>${amount}</b>.`;
 if(type==="distribution") note=`تقرير توزيع الوثيقة رقم ${esc(r.no)} — ${kind}.`;
 if(type==="original") return $("doc").innerHTML;
 return `<h3>${head}</h3><div class="sub">رقم الوثيقة: ${esc(r.no)} | تاريخ الطباعة: ${today()}</div>${summary}<p style="margin-top:18px;line-height:2">${note}</p><div class="sig"><div><span>إعداد ومراجعة</span></div><div><span>توقيع وختم الشركة</span></div></div><p style="font-size:.75rem;color:#555;margin-top:18px">مستند مستخرج من منظومة إصدار وثائق التأمين.</p>`;
}
function buildPrintPreview(){
 if(!choosePrintDocument())return;
 const html=makePrintHtml(printTarget,selectedPrintType);
 $("printPreviewArea").innerHTML=html;
}
$("open_print").onclick=openPrintWindow;
$("print_x").onclick=$("printCancel").onclick=()=>{$("printModal").hidden=true};
$("printTypes").addEventListener("click",e=>{
 const b=e.target.closest("[data-type]");if(!b)return;
 selectedPrintType=b.dataset.type;
 $("printName").value=printTypes[selectedPrintType];
 $("printTypes").querySelectorAll("[data-type]").forEach(x=>x.classList.toggle("selected",x===b));
 buildPrintPreview();
});
$("printPreview").onclick=buildPrintPreview;
$("printNo").addEventListener("change",()=>{if(choosePrintDocument())buildPrintPreview()});
$("printFind").onclick=()=>{if(choosePrintDocument()){show(printTarget.cur);renderDoc(printTarget);buildPrintPreview()}};
$("printExport").onclick=()=>{
 if(!choosePrintDocument())return;
 const html=makePrintHtml(printTarget,selectedPrintType);
 $("printArea").innerHTML=html;
 $("printModal").hidden=true;
 document.body.classList.add("printing");
 window.print();
};
window.addEventListener("afterprint",()=>document.body.classList.remove("printing"));

function renderList(){}
const SF={
 gen:[["no","رقم البوليصة"],["name","اسم العميل / الشركة"],["nid","الرقم القومي / السجل"],["phone","الهاتف"],["kind","نوع التأمين","select",["",...Object.keys(GEN)]],["st","وضع الوثيقة","select",["","سارية","منتهية","مغلقة"]],["df","تاريخ الإصدار من","date"],["dt","تاريخ الإصدار إلى","date"]],
 car:[["no","رقم البوليصة"],["name","اسم العميل / الشركة"],["nid","الرقم القومي / السجل"],["phone","الهاتف"],["plate","رقم لوحة السيارة"],["chassis","رقم الشاسيه"],["motor","رقم الموتور"],["use","نوع التأمين","select",["",...Object.keys(KINDS)]],["st","وضع الوثيقة","select",["","سارية","منتهية","مغلقة"]],["df","تاريخ الإصدار من","date"],["dt","تاريخ الإصدار إلى","date"]]};
function searchUI(){
 $("sh").textContent="ادخل معيار البحث لوثيقة "+(cur=="car"?"تأمين السيارات":"التأمينات العامة");
 const fs=SF[cur].filter(x=>isAdmin()||(x[0]!="nid"&&x[0]!="phone"));if(isAdmin())fs.push(["by","المُصدِر (الموظف)"]);
 $("sform").innerHTML=fs.map(([id,l,t,o])=>`<div><label>${l}</label>`+(t=="select"?`<select data-s="${id}">${o.map(x=>`<option value="${x}">${x||"الرجاء الاختيار"}</option>`).join("")}</select>`:`<input data-s="${id}" type="${t||"text"}">`)+`</div>`).join("");
 $("sform").onkeydown=e=>{if(e.key=="Enter")runSearch()};
 runSearch();
}
function runSearch(){
 const q={};$("sform").querySelectorAll("[data-s]").forEach(e=>q[e.dataset.s]=e.value.trim());
 const has=(a,b)=>String(a??"").toLowerCase().includes(b.toLowerCase()),st=d=>d.closed?"مغلقة":d.end>=today()?"سارية":"منتهية",car=cur=="car";
 const l=docs.filter(d=>d.cur==cur&&(isAdmin()||d.byU==me.u)).filter(d=>
  (!q.no||has(d.no,q.no))&&["name","nid","phone","plate","chassis","motor"].every(k=>!q[k]||has(d.f[k],q[k]))&&
  (!q.kind||d.f.kind==q.kind)&&(!q.use||d.f.use==q.use)&&(!q.st||st(d)==q.st)&&(!q.df||d.date>=q.df)&&(!q.dt||d.date<=q.dt)&&(!q.by||has(d.by,q.by)));
 $("shead").innerHTML="<tr><th>رقم البوليصة</th><th>العميل</th><th>نوع التأمين</th><th>"+(car?"رقم اللوحة":"الشيء المؤمَّن")+"</th><th>المدة (شهر)</th><th>تاريخ النفاذ</th><th>الوضع</th><th>الإجمالي</th><th>المُصدِر</th><th>عرض</th><th>نسخ</th><th>ملحق</th>"+(isAdmin()?"<th>إدارة</th>":"")+"</tr>";
 $("srows").innerHTML=l.length?l.map(d=>`<tr><td>${esc(d.no)}</td><td>${esc(d.f.name)}</td><td>${esc(car?d.f.use:d.f.kind)}</td><td>${esc(car?d.f.plate:d.f.item)}</td><td>${esc(d.f.months)}</td><td>${esc(d.end)}</td><td>${st(d)}</td><td>${fmt(d.c.tot)}</td><td>${esc(d.by)}</td><td><button class="btn sm alt" data-v="${esc(d.no)}">عرض</button></td><td><button class="btn sm alt" data-c="${esc(d.no)}">نسخ</button></td><td>${d.closed?"—":`<button class="btn sm alt" data-end="${esc(d.no)}">＋ ملحق</button>`}</td>${isAdmin()?`<td><button class="btn sm alt" data-e="${esc(d.no)}">تعديل</button> <button class="btn sm red" data-del="${esc(d.no)}">حذف</button></td>`:""}</tr>`).join(""):'<tr><td colspan="13">لا توجد وثائق مطابقة</td></tr>';
 $("scount").textContent="عدد الوثائق: "+l.length;
 $("srows").querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{const r=docs.find(d=>d.no==b.dataset.v);show(r.cur);renderDoc(r)});
 $("srows").querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>copyDoc(b.dataset.c));
 $("srows").querySelectorAll("[data-e]").forEach(b=>b.onclick=()=>editDoc(b.dataset.e));
 $("srows").querySelectorAll("[data-end]").forEach(b=>b.onclick=()=>openEnd(b.dataset.end));
 $("srows").querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>delDoc(b.dataset.del,b,runSearch));
}
function copyDoc(no){
 const r=docs.find(d=>d.no==no);show(r.cur);
 F[cur].forEach(([id])=>{if(id=="start"||id=="months")return;const e=$("f_"+id);if(e&&r.f[id]&&r.f[id]!=="—")e.value=r.f[id]});
 calc();$("err").innerHTML='<span class="ok">تم نسخ بيانات الوثيقة '+esc(r.no)+' — راجع البيانات ثم أصدر وثيقة جديدة.</span>';
}
$("sgo").onclick=runSearch;$("sclr").onclick=searchUI;$("snew").onclick=openWiz;$("back").onclick=()=>show("s"+cur);

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

/* ---------- Producer directory: admin-only maintenance ---------- */
let producers=ld("ins_producers",[]),editingProducer=null;
function renderProducers(){
 if(!isAdmin()){show("home");return;}
 $("producerRows").innerHTML=producers.map((x,i)=>`<tr><td>${esc(x.name)}</td><td>${esc(x.code)}</td><td><button class="btn sm" data-edit-producer="${i}">تعديل</button> <button class="btn sm red" data-delete-producer="${i}">حذف</button></td></tr>`).join("")||'<tr><td colspan="3">لا توجد أسماء منتجين مسجلة</td></tr>';
 $("producerRows").querySelectorAll("[data-edit-producer]").forEach(b=>b.onclick=()=>{editingProducer=+b.dataset.editProducer;$("producerName").value=producers[editingProducer].name;$("producerCode").value=producers[editingProducer].code;$("producerSave").textContent="حفظ التعديلات";$("producerErr").textContent="";});
 $("producerRows").querySelectorAll("[data-delete-producer]").forEach(b=>b.onclick=()=>{const i=+b.dataset.deleteProducer;if(b.dataset.confirmed){producers.splice(i,1);sv("ins_producers",producers);resetProducer();renderProducers();}else{b.dataset.confirmed="1";b.textContent="تأكيد الحذف؟";}});
}
function resetProducer(){editingProducer=null;$("producerName").value="";$("producerCode").value="";$("producerSave").textContent="إضافة المنتج";$("producerErr").textContent="";}
$("producerReset").onclick=resetProducer;
$("producerSave").onclick=()=>{
 if(!isAdmin())return;
 const name=$("producerName").value.trim(),code=$("producerCode").value.trim();
 if(!name||!code){$("producerErr").textContent="أدخل اسم المنتج وكود الهيئة";return;}
 if(producers.some((x,i)=>i!==editingProducer&&(x.name.toLowerCase()===name.toLowerCase()||x.code===code))){$("producerErr").textContent="اسم المنتج أو كود الهيئة مسجل بالفعل";return;}
 const item={name,code};if(editingProducer===null)producers.push(item);else producers[editingProducer]=item;
 sv("ins_producers",producers);resetProducer();renderProducers();
};
function refreshProducerOptions(){
 const dl=$("producerList");if(dl)dl.innerHTML=producers.map(x=>`<option value="${esc(x.name)}"></option>`).join("");
}
$("w_pn").addEventListener("input",()=>{const x=producers.find(p=>p.name===$("w_pn").value.trim());$("w_producer_code").value=x?x.code:"";});

/* ---------- users (admin) ---------- */
function renderUsers(){
 $("uperm").innerHTML=permBoxes(PERMS.map(p=>p[0]));
 const noM=!users.length;$("mgr").hidden=!noM;$("ucard").hidden=noM;$("utbl").hidden=noM;
 $("urows").innerHTML=users.map((u,i)=>`<tr><td>${esc(u.n)}</td><td>${esc(u.u)}</td><td>${esc(u.role)}</td><td class="perms" data-u="${i}">${u.role=="مدير"?"الكل":permBoxes(u.perm||PERMS.map(p=>p[0]))}</td><td><input type="password" id="np${i}" placeholder="كلمة مرور جديدة" autocomplete="new-password"></td><td style="white-space:nowrap"><button class="btn sm" data-r="${i}">إعادة تعيين</button> ${u.u==me.u||u.u=="admin"?"":`<button class="btn sm red" data-d="${i}">حذف</button>`}<div class="err" id="ue${i}"></div></td></tr>`).join("");
 $("urows").querySelectorAll("[data-r]").forEach(b=>b.onclick=async()=>{const i=+b.dataset.r,p=$("np"+i).value;if(p.length<4){$("ue"+i).textContent="4 أحرف على الأقل";return}users[i].h=await sha(p);sv("ins_users",users);if(users[i].def){delete users[i].def;sv("ins_users",users);$("tmpb").hidden=true}$("ue"+i).innerHTML='<span class="ok">تم التغيير</span>';$("np"+i).value=""});
 $("urows").querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{if(b.dataset.s){users.splice(+b.dataset.d,1);sv("ins_users",users);renderUsers()}else{b.dataset.s=1;b.textContent="تأكيد الحذف؟"}});
 $("urows").querySelectorAll("td[data-u] input").forEach(c=>c.onchange=()=>{const td=c.closest("td");users[+td.dataset.u].perm=[...td.querySelectorAll("input:checked")].map(x=>x.dataset.p);sv("ins_users",users)});
}
$("uadd").onclick=async()=>{
 const n=$("un").value.trim(),u=$("uu").value.trim(),p=$("up").value,role=$("uu").value.trim()=="admin"?"مدير":$("ur").value;
 if(!n||!u||p.length<4){$("uerr").textContent="أكمل الاسم واسم المستخدم وكلمة مرور (4 أحرف على الأقل)";return}
 if(users.some(x=>x.u==u)){$("uerr").textContent="اسم المستخدم موجود بالفعل";return}
 users.push({n,u,h:await sha(p),role,perm:[...$("uperm").querySelectorAll("input:checked")].map(x=>x.dataset.p)});sv("ins_users",users);["un","uu","up"].forEach(i=>$(i).value="");$("uerr").innerHTML='<span class="ok">تمت إضافة المستخدم</span>';renderUsers();
};
let edit=null,curDoc=null;
function editDoc(no){
 if(!isAdmin())return;
 const r=docs.find(d=>d.no==no);if(!r)return;
 show(r.cur);
 F[cur].forEach(([id])=>{const e=$("f_"+id);if(e&&r.f[id]!=null&&r.f[id]!=="—")e.value=r.f[id]});
 imgs=[...(r.imgs||[])];thumbs();cycSync();calc();
 edit={no:r.no,orig:r};
 $("err").innerHTML='<span class="ok">وضع تعديل الوثيقة '+esc(r.no)+' — عدّل البيانات ثم تابع حتى حفظ التعديلات</span>';
}
function delDoc(no,b,after){
 if(!isAdmin())return;
 const n=claims.filter(c=>c.pno==no).length;
 if(n){b.textContent="لا يمكن الحذف: للوثيقة "+n+" مطالبة";b.dataset.s="";return}
 if(!b.dataset.s){b.dataset.s=1;b.textContent="تأكيد الحذف؟";return}
 docs=docs.filter(d=>d.no!=no);sv("ins_docs",docs);after();
}
$("doc_edit").onclick=()=>editDoc(curDoc.no);
/* ---------- copy mark on re-print ---------- */
function prnSt(){
 const n=(curDoc&&curDoc.printed)||0,b=$("doc_rm");
 b.dataset.s="";b.textContent="إزالة علامة COPY";b.hidden=!(isAdmin()&&n>0);$("doc_end").hidden=!curDoc||!!curDoc.closed;
 $("prn_st").textContent=n?"طُبعت "+n+" مرة — الطباعة التالية بعلامة COPY":"لم تُطبع بعد — أول طباعة تُعتبر الأصل";
}
const docShown=()=>curDoc&&!$("p-ins").hidden&&!$("doc").hidden;
window.addEventListener("beforeprint",()=>{if(docShown())$("doc").classList.toggle("iscopy",(curDoc.printed||0)>0)});
window.addEventListener("afterprint",()=>{
 if(!docShown())return;
 $("doc").classList.remove("iscopy");
 curDoc.printed=(curDoc.printed||0)+1;curDoc.lastPrint=today();
 sv("ins_docs",docs);prnSt();
});
$("doc_rm").onclick=()=>{
 if(!isAdmin()||!curDoc)return;
 const b=$("doc_rm");
 if(!b.dataset.s){b.dataset.s=1;b.textContent="تأكيد إزالة العلامة؟";return}
 curDoc.printed=0;curDoc.copyRemoved=today();curDoc.copyRemovedBy=me.n;
 sv("ins_docs",docs);prnSt();
};
$("doc_del").onclick=()=>delDoc(curDoc.no,$("doc_del"),()=>show("s"+curDoc.cur));
/* ---------- terms ---------- */
const KEEP=" تبقى باقي الشروط والاشتراطات الواردة بالوثيقة كما هي دون أي تعديل أو تغيير.";
const CAR_X=[
"خدمة مساعدة الطريق (شركة الصقر المصري): تشمل الوثيقة تغطية خدمة مساعدة الطريق من شركة الصقر المصري، وهي كالآتي: المساعدات الضرورية التي يحتاجها العميل، وذلك بتقديم الخدمات التالية: (نقل السيارة في حالة الحادث بحد أقصى 300 كم - نقل السيارة في حالة العطل بحد أقصى 50 كم - إعادة السيارة للطريق المعتاد - توصيل الوقود اللازم (بمقابل مادي) - الشحن الإضافي للبطارية - خدمة تبديل الإطارات). برجاء التواصل على الأرقام الآتية: (0223103494 - 0223103495 - 01010606666).",
"شرط الترخيص (للسيارات الزيرو - غير المرخصة): من المعلوم والمتفق عليه صراحة أنه إذا تبين أن تاريخ ترخيص السيارة المؤمن عليها بموجب هذه الوثيقة قبل تاريخ بدء التأمين، فلا يحق للمشترك المطالبة بأية تعويضات قد تستحق عن هذه السيارة، والشركة غير مسئولة عن أي تلفيات تكون موجودة بالسيارة قبل تاريخ بدء سريان التأمين."+KEEP,
"شرط الصلاحية: من المعلوم والمتفق عليه صراحة أنه لا يجوز إجراء أي تعديل أو إلغاء في هذه الوثيقة إلا بعد الحصول على موافقة كتابية من المستفيد، وتدفع التعويضات الكلية والجزئية المستحقة إلى المستفيد."+KEEP,
"شرط محضر الشرطة بدون حد أقصى: من المعلوم والمتفق عليه صراحة أنه لا يشترط تقديم محضر شرطة إلا للحالات الآتية: حوادث الهلاك الكلي - حوادث السرقة سواء كانت جزئية أو كلية - حوادث الحريق سواء كانت جزئية أو كلية - الرجوع على الغير - المسئولية المدنية تجاه الطرف الثالث."+KEEP,
"شرط النسبية: من المعلوم والمتفق عليه صراحة أنه إذا ما ثبت أن القيمة السوقية للأشياء المؤمن عليها بمقتضى هذه الوثيقة وقت وقوع الحادث تزيد عن المبلغ المؤمن به عليها، اعتبر المشترك بمثابة مؤمن لنفسه بالفرق، وبناءً على ذلك فلا تدفع الشركة من هذه الخسائر إلا بقدر النسبة بين المبلغ المؤمن به وبين قيمة الأشياء السوقية وقت وقوع الحادث، وإذا تضمنت الوثيقة عدة بنود فإن كل بند منها يخضع على حدة لهذا الشرط."+KEEP,
"شرط السداد: لا تعتبر هذه الوثيقة سارية إلا إذا تم سداد الاشتراك المستحق عنها والمبين بمطالبة السداد المرفقة.",
"المعاينة قبل الإصلاح: يجب على المشترك في حالة وقوع حادث للسيارة المؤمن عليها عدم البدء في الإصلاح إلا بعد معاينة السيارة بمعرفة الشركة.",
"تقييم السيارة: من المعلوم والمتفق عليه أنه يقع على عاتق المشترك تقييم سعر السيارة بمعرفته طبقًا للقيمة السوقية للسيارة وقت طلب الإصدار، مع المراجعة الدورية لقيمة السيارة خلال مدة التأمين تفاديًا لتطبيق شرط النسبية في حالة وقوع حادث.",
"يعتبر باطلًا كل تعديل أو إضافة ما لم يوقع رسميًا عليها من قبل الشركة، وتعتبر الشروط العامة المرفقة وأية ملاحق أخرى إن وجدت جزءًا لا يتجزأ من هذه الوثيقة."];
const CAR_P=[
"شرط الأجزاء غير المثبتة: من المعلوم والمتفق عليه صراحة أن أجزاء السيارة غير المثبتة بها، والتي يمكن للمشترك حملها أثناء مغادرته للسيارة، غير مغطاة تأمينيًا."+KEEP,
"شرط التجديد: من المعلوم والمتفق عليه أنه في حالة وقوع حادث خلال الفترة من تاريخ تحرير التجديد وتاريخ بداية سريان التجديد، والذي يخص فترة التأمين السابقة، سيتم تعديل شروط وأسعار التأمين وفقًا لنسبة الخسارة المحققة."+KEEP,
"شرط الوسائد الهوائية (إيرباج): من المعلوم والمتفق عليه صراحة أنه في حالة وقوع حادث للسيارة المؤمن عليها يؤدي إلى تلف الإيرباج ومشتملاتها، يتحمل المشترك نسبة 25% من قيمة الإيرباج ومشتملاتها في حالة الخسارة الجزئية فقط، ولا يطبق هذا التحمل في حالة الهلاك الكلي للسيارة."+KEEP,
"شرط زجاج فتحة السقف / الزجاج البانوراما: من المعلوم والمتفق عليه صراحة أنه في حالة وقوع حادث للسيارة المؤمن عليها يؤدي إلى تلف / كسر / نقر زجاج فتحة السقف / الزجاج البانوراما ومشتملاتها في حالة الخسارة الكلية والجزئية، يتحمل المؤمن له نسبة 25% من قيمة زجاج فتحة السقف / الزجاج البانوراما."+KEEP];
function defTerms(c,f){
 const base=c=="car"?["تسري الوثيقة على السيارة الموضحة بياناتها خلال مدة التأمين المحددة.","يلتزم المؤمَّن له بإبلاغ الشركة بأي حادث خلال 48 ساعة.","نوع التأمين «"+f.use+"»"+(f.cover&&f.cover!="—"?" بمستوى تغطية «"+f.cover+"»":"")+" وفق الشروط العامة والاستثناءات المرفقة.","لا تسري الوثيقة إذا استُخدمت السيارة في غير الغرض المبيَّن بها.","يحق للشركة إلغاء الوثيقة عند ثبوت تقديم بيانات غير صحيحة."]:["تغطي الوثيقة الأخطار المؤمَّن ضدها فقط خلال مدة التأمين.","يلتزم المؤمَّن له باتخاذ الاحتياطات المعقولة لمنع وقوع الخسارة.","يجب إخطار الشركة فور وقوع أي حادث أو خسارة.","يُحدد التعويض على أساس القيمة الفعلية بما لا يتجاوز مبلغ التأمين.","يحق للشركة إلغاء الوثيقة عند ثبوت تقديم بيانات غير صحيحة."];
 return base.concat(c=="car"&&f.use!="إجباري"?CAR_X.concat(f.use=="خاص"?CAR_P:[]):[],["تسري الوثيقة داخل جمهورية مصر العربية ما لم يُنص على غير ذلك."]);
}
function tmCnt(){const r=[...$("tm_list").querySelectorAll(".trow")];$("tm_cnt").textContent=" — المحدد "+r.filter(x=>x.querySelector("[data-c]").checked).length+" من "+r.length}
const tmSet=v=>{$("tm_list").querySelectorAll(".trow").forEach(r=>{r.querySelector("[data-c]").checked=v;r.classList.toggle("off",!v)});tmCnt()};
const termRow=(t,on=true)=>`<div class="trow${on?"":" off"}"><input type="checkbox" data-c title="تضمين الشرط في الوثيقة"${on?" checked":""}><input data-t value="${esc(t)}"><button class="btn sm red" type="button" data-x>حذف</button></div>`;
function termsUI(){
 const f=pend.f;
 $("tm_info").textContent=f.name+" — "+(cur=="car"?f.use+" — "+f.plate:f.kind);
 const T=edit&&edit.orig.tm;
 {const D=defTerms(cur,f);$("tm_list").innerHTML=T?T.list.map(x=>termRow(x,true)).join("")+D.filter(x=>!T.list.includes(x)).map(x=>termRow(x,false)).join(""):D.map(x=>termRow(x,true)).join("")}
 $("tm_ded").value=T?T.ded||"":dedText(f);$("tm_sp").value=T?T.sp||"":"";$("tm_ex").value=T?T.ex||"":"";
 tmCnt();$("p-ins").hidden=true;$("p-terms").hidden=false;window.scrollTo(0,0);
}
$("tm_list").onclick=e=>{const b=e.target.closest("[data-x]");if(b){b.parentNode.remove();tmCnt()}};
$("tm_list").onchange=e=>{if(e.target.matches("[data-c]"))e.target.closest(".trow").classList.toggle("off",!e.target.checked);tmCnt()};
$("tm_add").onclick=()=>{$("tm_list").insertAdjacentHTML("beforeend",termRow(""));tmCnt();$("tm_list").lastElementChild.querySelector("[data-t]").focus()};
$("tm_reset").onclick=()=>{$("tm_list").innerHTML=defTerms(cur,pend.f).map(x=>termRow(x)).join("");tmCnt()};
$("tm_all").onclick=()=>tmSet(true);$("tm_none").onclick=()=>tmSet(false);
$("tm_back").onclick=()=>{$("p-terms").hidden=true;$("p-ins").hidden=false;window.scrollTo(0,0)};
$("tm_close").onclick=()=>show("s"+cur);
$("tm_next").onclick=()=>{
 pend.tm={list:[...$("tm_list").querySelectorAll(".trow")].filter(r=>r.querySelector("[data-c]").checked).map(r=>r.querySelector("[data-t]").value.trim()).filter(Boolean),ded:$("tm_ded").value.trim(),sp:$("tm_sp").value.trim(),ex:$("tm_ex").value.trim()};
 premUI();
};
function termsHtml(r,legacy){
 const t=r.tm,L=a=>`<ol>${a.map(x=>`<li>${x}</li>`).join("")}</ol>`;
 if(!t)return`<h4>الشروط العامة</h4>${L(legacy)}`;
 const P=(h,x)=>x?`<h4>${h}</h4><p style="font-size:.85rem;margin:0;white-space:pre-line">${esc(x)}</p>`:"";
 return`<h4>الشروط العامة</h4>${L(t.list.map(esc))}${P("التحمل",t.ded)}${P("الشروط الخاصة",t.sp)}${P("الاستثناءات",t.ex)}`;
}
/* ---------- premium calculation ---------- */
const FEES=[["اشتراك ضمان حملة الوثائق",.2],["رسوم الإشراف والرقابة",.6],["رسوم صندوق تكريم الشهداء",0,5],["ضريبة الدمغة النوعية",0,14.5],["مقابل اعتماد ومراجعة",.1],["نصف الدمغة النسبية",5.5]],ISSUE=25;
const GCOV={
"حريق":[["الحريق والصاعقة (أساسي)",1],["الانفجار",.4],["الأخطار الطبيعية",.5],["شغب وإضرابات",.3],["إزالة الأنقاض",.2]],
"سرقة":[["السرقة بالكسر والعنف (أساسي)",1],["السطو المسلح",.5],["خيانة الأمانة",.3],["أضرار الشروع في السرقة",.2]],
"مسؤولية مدنية":[["المسؤولية تجاه الغير (أساسي)",1],["إصابات الأفراد",.5],["أضرار الممتلكات",.5],["مصاريف قانونية",.2]],
"نقل بضائع":[["نقل بضائع (أساسي)",1],["أخطار الحرب والإضرابات",.3],["التخزين أثناء النقل",.4],["السرقة والفقد",.5]],
"حوادث شخصية":[["الوفاة والعجز الكلي (أساسي)",1],["العجز الجزئي",.5],["مصاريف علاج",.4],["بدل إقامة",.2]],
"أعمال هندسية":[["أخطار المقاولين (أساسي)",1],["مسؤولية الغير",.4],["فترة الصيانة",.3],["الأخطار الطبيعية",.4]]};
let pend=null;
const n2=x=>Number(x).toLocaleString("ar-EG",{minimumFractionDigits:2,maximumFractionDigits:2});
function premRows(f,c){
 const sum=+f.sum;
 if(c=="gen"){const b=GEN[f.kind]*100;return GCOV[f.kind].map(([n,k],i)=>({n,on:i==0,sum,rate:+(b*k).toFixed(4),man:false,ann:0,d:0,l:0,t:0,cp:i==0?10:5,basic:i==0}))}
 const k=KINDS[f.use],cmp=f.use!="إجباري",old=+f.year&&+f.year<2015;
 const R=(n,s,rate,o={})=>({n,on:false,sum:s,rate,man:false,ann:0,d:0,l:0,t:0,cp:5,basic:false,...o});
 return[
  R("التأمين الإجباري",sum,0,{on:!cmp,man:true,ann:600,cp:10,basic:true}),
  R("خدمة مساعدة الطريق",0,0,{on:cmp,man:true,ann:150}),
  R("التأمين التكميلي",sum,+((COVER[f.cover]||0)*100*k).toFixed(4),{on:cmp,cp:10,basic:true,l:old?10:0}),
  R("شغب واضطرابات",sum,+(.15*k).toFixed(4)),
  R("المسؤولية المدنية",100000,+(.8*k).toFixed(4),{on:cmp}),
  R("حوادث شخصية للركاب",50000,+(.5*k).toFixed(4)),
  R("الحوادث الشخصية (السائق)",50000,+(.4*k).toFixed(4)),
  R("الأخطار الطبيعية",sum,+(.1*k).toFixed(4)),
  R("هلاك كلي",sum,+(.2*k).toFixed(4))];
}
const gv=(i,k)=>{const e=$("pr_grid").querySelector(`[data-i="${i}"] [data-f="${k}"]`);return e.type=="checkbox"?e.checked:(+e.value||0)};
const readRows=()=>pend.rows.map((r,i)=>({...r,...Object.fromEntries(["on","sum","rate","man","ann","d","l","t","cp","cman","cm"].map(k=>[k,gv(i,k)]))}));
function premCompute(st,m,mc,mv){
 const k=m/12,out=[];let P=0,D=0,L=0,T=0,CB=0,CC=0;
 st.forEach(r=>{
  if(!r.on){out.push({...r,annual:0,net:0,tax:0,comm:0,due:0});return}
  const annual=r.man?r.ann:r.sum*r.rate/100,dd=annual*r.d/100*k,ll=annual*r.l/100*k,p=annual*k,net=p-dd+ll,tax=net*r.t/100,comm=r.cman?r.cm:net*r.cp/100;
  P+=p;D+=dd;L+=ll;T+=tax;if(r.basic)CB+=comm;else CC+=comm;
  out.push({...r,annual,net,tax,comm,due:net+tax});
 });
 const net=P-D+L,due=mc?mv:net+T,fees=FEES.map(([n,p,f])=>[n,due>0?(p?due*p/100:(f||0)):0]),feesSub=fees.reduce((a,x)=>a+x[1],0),admin=due>0?ISSUE:0;
 return{rows:out,annual:out.reduce((a,r)=>a+r.annual,0),P,D,L,net,tax:T,due,comm:CB+CC,commB:CB,commC:CC,fees,feesSub,admin,total:due+feesSub+admin};
}
function premUI(){
 const f=pend.f,car=cur=="car",o=edit&&edit.orig,same=!!(o&&o.pm&&o.pm.rows&&o.pm.rows[0]&&o.pm.rows[0].d!==undefined&&["sum","months","use","kind","cover","year"].every(k=>String(o.f[k]??"")==String(f[k]??"")));pend.rows=same?o.pm.rows.map(r=>({...r})):premRows(f,cur);
 $("pr_info").textContent=f.name+" — "+(car?f.use+" — "+f.plate:f.kind)+" | من "+f.start+" إلى "+addMonths(f.start,pend.m);
 $("pr_d").textContent=car?(f.brand+" "+f.model+" — "+f.chassis):f.item;$("pr_s").textContent=fmt(f.sum);
 const H=["","التغطية","مبلغ التأمين","النسبة %","يدوي","القسط السنوي","خصم %","تحميل %","ضريبة %","عمولة %","يدوي","العمولة","القسط المستحق للمدة"];
 const I=(k,v)=>`<input type="number" data-f="${k}" value="${v}" step="any" min="0">`,C=(k,v)=>`<input type="checkbox" data-f="${k}"${v?" checked":""}>`;
 $("pr_grid").innerHTML="<tr>"+H.map(h=>`<th>${h}</th>`).join("")+"</tr>"+pend.rows.map((r,i)=>`<tr data-i="${i}"><td>${C("on",r.on)}</td><td>${esc(r.n)}</td><td>${I("sum",r.sum)}</td><td>${I("rate",r.rate)}</td><td>${C("man",r.man)}</td><td>${I("ann",r.ann)}</td><td>${I("d",r.d)}</td><td>${I("l",r.l)}</td><td>${I("t",r.t)}</td><td>${I("cp",r.cp)}</td><td>${C("cman",r.cman)}</td><td>${I("cm",r.cm||0)}</td><td class="dc">0.00</td></tr>`).join("");
 $("pr_mc").checked=!!(same&&o.pm.mc);$("pr_mv").value=same&&o.pm.mc?o.pm.mv:"";$("pr_err").textContent="";
 $("p-ins").hidden=true;$("p-terms").hidden=true;$("p-prem").hidden=false;premCalc();window.scrollTo(0,0);
}
function premCalc(){
 const mc=$("pr_mc").checked;$("pr_mv").disabled=!mc;
 const s=premCompute(readRows(),pend.m,mc,+$("pr_mv").value||0);
 s.rows.forEach((r,i)=>{
  const tr=$("pr_grid").querySelector(`[data-i="${i}"]`),q=k=>tr.querySelector(`[data-f="${k}"]`);
  ["sum","rate","man","ann","d","l","t","cp","cman","cm"].forEach(k=>q(k).disabled=!r.on);
  if(r.on){q("rate").disabled=r.man;q("ann").disabled=!r.man;q("cm").disabled=!r.cman}
  if(!r.man)q("ann").value=r.on?r.annual.toFixed(2):"";
  if(!r.cman)q("cm").value=r.on?r.comm.toFixed(2):"";
  tr.querySelector(".dc").textContent=n2(r.due);
 });
 $("pr_due").textContent=fmt(s.due);
 const sec=cur=="car"?"سيارات":pend.f.kind,z=n2(0),row=(c,a)=>`<tr class="${c}">${a.map(x=>`<td>${x}</td>`).join("")}</tr>`;
 $("pr_sum").innerHTML="<tr>"+["القسط المستحق","مصاريف إدارية","مبلغ الزيادة","مبلغ التخفيض","العمولة","صافي القسط","القسط السنوي","ضريبة","إضافة","القسم"].map(h=>`<th>${h}</th>`).join("")+"</tr>"
  +row("sb",[n2(s.due),z,n2(s.L),n2(s.D),z,n2(s.net),n2(s.annual),n2(s.tax),"المجموع الفرعي",esc(sec)])
  +row("yl",["","","","",n2(s.commB),"","","","","عمولة أساسية"])+row("yl",["","","","",n2(s.commC),"","","","","عمولة تكميلية"])
  +row("sb",["","","","",n2(s.comm),"","","","المجموع الفرعي",""])
  +s.fees.map(([n,x])=>row("yl",["","","","","","","",n2(x),"",n])).join("")
  +row("yl",["",n2(s.admin),"","","","","","","","مصاريف الإصدار"])
  +row("sb",["","","","","","","",n2(s.feesSub),"المجموع الفرعي",""])
  +row("gr",[n2(s.total),n2(s.admin),n2(s.L),n2(s.D),n2(s.comm),n2(s.net),n2(s.annual),n2(s.feesSub),"","المجموع"]);
 return s;
}
$("pr_grid").addEventListener("input",premCalc);$("pr_grid").addEventListener("change",premCalc);
$("pr_mc").onchange=$("pr_mv").oninput=$("pr_go").onclick=$("pr_calc").onclick=premCalc;
$("pr_back").onclick=()=>{$("p-prem").hidden=true;$("p-terms").hidden=false;window.scrollTo(0,0)};
$("pr_close").onclick=()=>show("s"+cur);
$("pr_issue").onclick=()=>{
 const s=premCalc(),e=$("pr_err");
 if(!s.rows.some(r=>r.on)){e.textContent="اختر تغطية واحدة على الأقل";return}
 if(!(s.due>0)){e.textContent="القسط المستحق يجب أن يكون أكبر من صفر";return}
 const f=pend.f,pre=cur=="car"?"MOT-":"GEN-",y=new Date().getFullYear(),mx=Math.max(0,...docs.filter(d=>d.no.startsWith(pre+y)).map(d=>+d.no.split("-")[2]||0)),no=edit?edit.no:pre+y+"-"+String(mx+1).padStart(5,"0");
 const r={no,cur,f,producerName:producers.find(x=>x.name===( $("w_pn")?$("w_pn").value.trim():""))?.name||"",producerCode:$("w_producer_code")?$("w_producer_code").value:"",c:{tot:s.total,prem:s.due,stamp:0,sup:0,fee:s.admin},pm:{rows:s.rows.map(x=>({n:x.n,on:x.on,sum:x.sum,rate:x.rate,annual:x.annual,net:x.net,man:x.man,ann:x.ann,d:x.d,l:x.l,t:x.t,cp:x.cp,cman:x.cman,cm:x.cm,basic:x.basic})),mc:$("pr_mc").checked,mv:+$("pr_mv").value||0,due:s.due,fees:s.fees,admin:s.admin,total:s.total},tm:pend.tm,imgs:pend.imgs,end:addMonths(f.start,+f.months),date:today(),by:me.n,byU:me.u};
 if(edit){const o=edit.orig;Object.assign(r,{date:o.date,by:o.by,byU:o.byU,edited:today(),editedBy:me.n,printed:o.printed,lastPrint:o.lastPrint});docs[docs.findIndex(d=>d.no==edit.no)]=r}else docs.unshift(r);
 if(!sv("ins_docs",docs.slice(0,60))){sv("ins_docs",docs.map(d=>({...d,imgs:[]})).slice(0,60))}
 show(cur);renderDoc(r);
};
function premHtml(r){
 const p=r.pm,c=r.c;
 if(!p)return`<h4>الأقساط والرسوم</h4><table><tr><th>القسط الصافي</th><td>${fmt(c.prem)}</td><th>رسم الدمغة</th><td>${fmt(c.stamp)}</td></tr><tr><th>رسوم الإشراف</th><td>${fmt(c.sup)}</td><th>مصاريف الإصدار</th><td>${fmt(c.fee)}</td></tr><tr><th>الإجمالي</th><td colspan="3"><b>${fmt(c.tot)}</b></td></tr></table>`;
 return`<h4>التغطيات المختارة</h4><table><tr><th style="width:auto">التغطية</th><th style="width:auto">مبلغ التأمين</th><th style="width:auto">النسبة</th><th style="width:auto">القسط السنوي</th><th style="width:auto">صافي القسط للمدة</th></tr>${p.rows.filter(x=>x.on).map(x=>`<tr><td>${esc(x.n)}</td><td>${fmt(x.sum)}</td><td>${x.annual&&x.sum&&!x.rate?"—":esc(x.rate)+"%"}</td><td>${fmt(x.annual)}</td><td>${fmt(x.net)}</td></tr>`).join("")}</table>
 <h4>الأقساط والرسوم</h4><table><tr><th>القسط المستحق</th><td colspan="3">${fmt(p.due)}</td></tr>${p.fees.filter(x=>x[1]>0).map(([n,x])=>`<tr><th>${esc(n)}</th><td colspan="3">${fmt(x)}</td></tr>`).join("")}<tr><th>مصاريف الإصدار</th><td colspan="3">${fmt(p.admin)}</td></tr><tr><th>الإجمالي المستحق</th><td colspan="3"><b>${fmt(p.total)}</b></td></tr></table>`;
}
/* ---------- claims ---------- */
let claims=ld("ins_claims",[]),cimgs=[];
const CST=["قيد الدراسة","معتمدة","مدفوعة","مرفوضة"],CTY=["حادث / تصادم","سرقة","حريق","أضرار للغير","إصابات جسدية","كسر زجاج","أخرى"];
const myDocs=()=>docs.filter(d=>isAdmin()||d.byU==me.u);
const saveC=()=>{if(!sv("ins_claims",claims))sv("ins_claims",claims.map(x=>({...x,imgs:[]})))};
function cth(){$("c_th").innerHTML=cimgs.map((s,i)=>`<div><img src="${s}" alt=""><button data-i="${i}" title="حذف">×</button></div>`).join("");$("c_th").querySelectorAll("button").forEach(b=>b.onclick=()=>{cimgs.splice(+b.dataset.i,1);cth()})}
function clmUI(){
 $("c_no").value="CLM-"+new Date().getFullYear()+"-"+String(claims.length+1).padStart(5,"0");
 ["c_pno","c_cl","c_pi","c_am","c_ds"].forEach(i=>$(i).value="");$("c_ad").value=today();
 $("c_ty").innerHTML=CTY.map(x=>`<option>${x}</option>`).join("");
 $("c_pl").innerHTML=myDocs().map(d=>`<option value="${esc(d.no)}">${esc(d.f.name)}</option>`).join("");
 cimgs=[];cth();$("c_img").value="";$("c_err").textContent="";clmList();
}
function clmList(){
 const l=claims.filter(c=>isAdmin()||c.byU==me.u);
 $("c_rows").innerHTML=l.length?l.map(c=>`<tr><td>${esc(c.no)}</td><td>${esc(c.pno)}</td><td>${esc(c.client)}</td><td>${esc(c.type)}</td><td>${esc(c.ad)}</td><td>${fmt(c.am)}</td><td>${esc(c.st)}</td><td>${esc(c.by)}</td></tr>`).join(""):'<tr><td colspan="8">لا توجد مطالبات</td></tr>';
}
$("c_pno").oninput=()=>{const d=myDocs().find(x=>x.no==$("c_pno").value.trim());$("c_cl").value=d?d.f.name:"";$("c_pi").value=d?(d.cur=="car"?"سيارة — "+d.f.use+" — "+d.f.plate:"عام — "+d.f.kind)+" | من "+d.f.start+" إلى "+d.end:""};
$("c_img").onchange=async e=>{for(const f of e.target.files){const x=await packImg(f);if(x&&cimgs.length<6)cimgs.push(x)}e.target.value="";cth()};
$("c_clr").onclick=clmUI;
$("c_save").onclick=()=>{
 const d=myDocs().find(x=>x.no==$("c_pno").value.trim()),am=+$("c_am").value,ad=$("c_ad").value,ds=$("c_ds").value.trim(),e=$("c_err");
 if(!d){e.textContent="اختر رقم وثيقة صحيح من القائمة";return}
 if(!ad||!ds||!(am>0)){e.textContent="أكمل تاريخ الحادث ووصف الحادث ومبلغ المطالبة";return}
 if(ad>today()){e.textContent="تاريخ الحادث لا يمكن أن يكون في المستقبل";return}
 {const ee=d.closed?d.closed.date:d.end;if(ad<d.f.start||ad>ee){e.textContent="تاريخ الحادث خارج مدة سريان الوثيقة ("+d.f.start+" إلى "+ee+")"+(d.closed?" — الوثيقة مغلقة":"");return}}
 const c={no:$("c_no").value,pno:d.no,cur:d.cur,client:d.f.name,type:$("c_ty").value,ad,rd:today(),ds,am,ap:0,st:"قيد الدراسة",imgs:[...cimgs],by:me.n,byU:me.u};
 claims.unshift(c);saveC();clmUI();$("c_err").innerHTML='<span class="ok">تم حفظ المطالبة '+esc(c.no)+'</span>';
};
function crep(){
 if(!isAdmin())return;
 if(!$("cs").options.length){$("cs").innerHTML=["",...CST].map(x=>`<option value="${x}">${x||"الكل"}</option>`).join("");$("cty").innerHTML=["",...CTY].map(x=>`<option value="${x}">${x||"الكل"}</option>`).join("")}
 const a=$("cf").value||"0000-00-00",b=$("ct").value||"9999-99-99",s=$("cs").value,t=$("cty").value;
 const l=claims.filter(c=>c.ad>=a&&c.ad<=b&&(!s||c.st==s)&&(!t||c.type==t));
 const ok=c=>c.st=="معتمدة"||c.st=="مدفوعة",sum=(x,f)=>x.reduce((n,c)=>n+f(c),0);
 const grp=fn=>{const m={};l.forEach(c=>{const k=fn(c);m[k]=m[k]||{n:0,a:0,p:0};m[k].n++;m[k].a+=c.am;m[k].p+=ok(c)?c.ap||0:0});return Object.entries(m)};
 const tbl=(h,g)=>`<h2 style="margin-top:18px">${h}</h2><div class="scroll"><table><thead><tr><th>البند</th><th>العدد</th><th>المبلغ المطالب به</th><th>المبلغ المعتمد</th></tr></thead><tbody>${g.length?g.map(([k,x])=>`<tr><td>${esc(k)}</td><td>${x.n}</td><td>${fmt(x.a)}</td><td>${fmt(x.p)}</td></tr>`).join(""):'<tr><td colspan="4">لا توجد بيانات</td></tr>'}</tbody></table></div>`;
 const rows=l.map(c=>{const i=claims.indexOf(c);return`<tr><td>${esc(c.no)}</td><td>${esc(c.pno)}</td><td>${esc(c.client)}</td><td>${esc(c.type)}</td><td>${esc(c.ad)}</td><td>${fmt(c.am)}</td><td><select data-st="${i}">${CST.map(x=>`<option${x==c.st?" selected":""}>${x}</option>`).join("")}</select></td><td><input type="number" min="0" data-ap="${i}" value="${c.ap||0}" style="width:110px"></td><td><button class="btn sm" data-sv="${i}">حفظ</button><div class="err" id="ce${i}"></div></td></tr>`}).join("");
 $("cout").innerHTML=`<div class="calc"><div>عدد المطالبات<b>${l.length}</b></div><div>إجمالي المطالب به<b>${fmt(sum(l,c=>c.am))}</b></div><div>إجمالي المعتمد<b>${fmt(sum(l.filter(ok),c=>c.ap||0))}</b></div><div>إجمالي المدفوع<b>${fmt(sum(l.filter(c=>c.st=="مدفوعة"),c=>c.ap||0))}</b></div><div>عدد المرفوضة<b>${l.filter(c=>c.st=="مرفوضة").length}</b></div></div>`
  +tbl("حسب الحالة",grp(c=>c.st))+tbl("حسب نوع التعويض",grp(c=>c.type))+tbl("حسب نوع الوثيقة",grp(c=>c.cur=="car"?"تأمين السيارات":"التأمينات العامة"))+tbl("حسب الموظف المُسجِّل",grp(c=>c.by))
  +`<div class="np"><h2 style="margin-top:18px">تفاصيل المطالبات وتحديث الحالة</h2><div class="scroll"><table><thead><tr><th>رقم المطالبة</th><th>الوثيقة</th><th>العميل</th><th>النوع</th><th>تاريخ الحادث</th><th>المطالب به</th><th>الحالة</th><th>المبلغ المعتمد</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="9">لا توجد مطالبات</td></tr>'}</tbody></table></div></div>`;
 $("cout").querySelectorAll("[data-sv]").forEach(b=>b.onclick=()=>{
  const i=+b.dataset.sv,c=claims[i],st=$("cout").querySelector('[data-st="'+i+'"]').value,ap=+$("cout").querySelector('[data-ap="'+i+'"]').value||0,e=$("ce"+i);
  if((st=="معتمدة"||st=="مدفوعة")&&!(ap>0)){e.textContent="أدخل المبلغ المعتمد";return}
  if(ap>c.am){e.textContent="المعتمد أكبر من المطالب به";return}
  c.st=st;c.ap=st=="مرفوضة"?0:ap;saveC();crep();
 });
}
$("cgo").onclick=crep;
/* ---------- policy wizard (basic data popup) ---------- */
const codeOf=n=>{const i=[...new Set(docs.slice().reverse().map(d=>d.f.name))].indexOf(n);return i<0?"0":String(10001+i)};
function openWiz(){
 const car=cur=="car",t=car?"سيارات":"تأمينات عامة";
 $("w_op").innerHTML=["فردي","شركة"].map(x=>`<option>إصدار جديد - ${t} - ${x}</option>`).join("");
 const prods=car?["إجباري","خاص","تجاري"].filter(x=>can("car:"+x)).map(x=>[x,"سيارات — "+(x=="إجباري"?"إجباري":x+" (تكميلي)")]):Object.keys(GEN).map(x=>[x,"تأمينات عامة — "+x]);
 $("w_pr").innerHTML='<option value="">الرجاء الاختيار</option>'+prods.map(([v,l])=>`<option value="${v}">${l}</option>`).join("");
 $("w_cn").value="";$("w_cc").value="0";$("w_pn").value="";$("w_producer_code").value="";refreshProducerOptions();$("w_ps").value="مباشر";$("w_cu").value="جنيه مصري";
 $("w_in").value="";$("w_in").readOnly=true;$("w_pick").hidden=true;$("w_err").textContent="";
 $("w_s").value=today();$("w_e").value=addMonths(today(),12);$("w_e").dataset.t="";$("w_i").value=today();
 $("wiz").hidden=false;$("w_cn").focus();
}
const closeWiz=()=>{$("wiz").hidden=true};
function wCust(){const n=$("w_cn").value.trim();$("w_cc").value=codeOf(n);if($("w_in").readOnly)$("w_in").value=n}
function wPick(){
 const q=$("w_cn").value.trim(),seen=new Set(),L=[];
 myDocs().forEach(d=>{const n=d.f.name;if(!seen.has(n)&&(!q||n.includes(q))){seen.add(n);L.push(n)}});
 $("w_pick").innerHTML=L.length?L.map(n=>`<div data-n="${esc(n)}">${esc(codeOf(n))} — ${esc(n)}</div>`).join(""):'<div style="color:#777">لا يوجد عملاء سابقون</div>';
 $("w_pick").hidden=false;
 $("w_pick").querySelectorAll("[data-n]").forEach(x=>x.onclick=()=>{$("w_cn").value=x.dataset.n;wCust();$("w_pick").hidden=true});
}
$("w_cn").addEventListener("input",wCust);
$("w_cb").onclick=()=>{$("w_pick").hidden?wPick():$("w_pick").hidden=true};
$("w_ib").onclick=()=>{$("w_in").readOnly=false;$("w_in").focus()};
$("w_s").addEventListener("change",()=>{if(!$("w_e").dataset.t&&$("w_s").value)$("w_e").value=addMonths($("w_s").value,12)});
$("w_e").addEventListener("input",()=>{$("w_e").dataset.t=1});
$("w_x").onclick=$("w_no").onclick=closeWiz;
$("wiz").onclick=e=>{if(e.target===$("wiz"))closeWiz()};
document.addEventListener("keydown",e=>{if(e.key=="Escape"&&!$("wiz").hidden)closeWiz()});
$("w_ok").onclick=()=>{
 const e=$("w_err"),name=$("w_cn").value.trim(),s=$("w_s").value,en=$("w_e").value,pr=$("w_pr").value;
 if(!name){e.textContent="أدخل اسم العميل";return}
 if(!s||!en||en<=s){e.textContent="تاريخ النهاية يجب أن يكون بعد تاريخ البداية";return}
 if(!pr){e.textContent="اختر المنتج";return}
 if(!$("w_cu").value){e.textContent="اختر عملة البوليصة";return}
 const m=Math.max(1,Math.round((new Date(en)-new Date(s))/864e5/30.4375)),ptype=$("w_op").value.split(" - ").pop(),ins=$("w_in").value.trim(),pn=$("w_pn").value.trim(),producer=producers.find(x=>x.name===pn);
 const old=myDocs().find(d=>d.f.name==name),ps=$("w_ps").value;
 closeWiz();show(cur);
 const st=(id,v)=>{const x=$("f_"+id);if(x&&v!=null&&v!=="")x.value=v};
 st("name",name);st("start",s);st("months",m);cycSync();
 st(cur=="car"?"use":"kind",pr);st("ptype",ptype);st("prod",ps+(pn?" — "+pn:""));
 if(ins&&ins!=name)st("insured",ins);
 if(old){st("addr",old.f.addr);if(isAdmin()){st("nid",old.f.nid);st("phone",old.f.phone)}}
 calc();
};
/* ---------- endorsements ---------- */
let ends=ld("ins_end",[]),et=null;
const ET={chg:"ملحق تغييرات عامة",add:"ملحق إضافة",ext:"ملحق تمديد الفترة التأمينية",cls:"إلغاء بالتصفية"};
const pctFees=FEES.reduce((n,x)=>n+(x[1]||0),0);
const FLD={all:[["name","اسم المؤمَّن له"],["nid","الرقم القومي / السجل"],["phone","الهاتف"],["addr","العنوان"]],car:[["plate","رقم اللوحة"],["chassis","رقم الشاسيه"],["motor","رقم الموتور"],["color","اللون"],["model","الموديل"],["year","سنة الصنع"]],gen:[["item","وصف الشيء المؤمَّن عليه"],["place","موقع الخطر"],["bene","المستفيد"]]};
const eDocs=()=>myDocs().filter(d=>!d.closed);
const eDoc=()=>eDocs().find(d=>d.no==$("e_p").value.trim());
function endUI(t){
 et=ET[t]&&(t!="cls"||isAdmin())?t:null;
 $("e_tabs").querySelectorAll("button").forEach(b=>{b.classList.toggle("sel",b.dataset.t===et);if(b.dataset.t=="cls")b.hidden=!isAdmin()});
 $("e_form").hidden=!et;$("e_chg").hidden=et!="chg";$("e_add").hidden=et!="add";$("e_ext").hidden=et!="ext";$("e_cls").hidden=et!="cls";
 $("edoc").hidden=true;$("edbtns").hidden=true;
 if(et){
  $("e_h").textContent=ET[et];
  $("e_pl").innerHTML=eDocs().map(d=>`<option value="${esc(d.no)}">${esc(d.f.name)}</option>`).join("");
  ["e_p","e_cl","e_pi","e_new","e_old","e_av","e_ar","e_ap","e_ac","e_n","e_pb","e_rf","e_ext_from","e_ext_to","e_ext_old","e_ext_new"].forEach(i=>$(i).value="");
  $("e_d").value=today();$("e_dd").value=0;$("e_am").checked=false;$("e_upd").checked=true;$("e_fld").innerHTML="";$("e_err").textContent="";
  $("e_at").value="زيادة مبلغ التأمين";$("e_acw").hidden=true;eCalc();
 }
 endList();
}
function eOld(){const d=eDoc(),k=$("e_fld").value;$("e_old").readOnly=k!="_";$("e_old").value=d&&k&&k!="_"?(d.f[k]||"—"):""}
function eCalc(){
 const d=eDoc(),eff=$("e_d").value;let fin="";
 if(d&&eff){
  const S=new Date(d.f.start),E=new Date(d.end),X=new Date(eff),tot=Math.max(1,(E-S)/864e5),rem=Math.min(1,Math.max(0,(E-X)/864e5/tot));
  if(et=="add"){
   const man=$("e_am").checked;$("e_ap").readOnly=!man;
   if(!man)$("e_ap").value=((+$("e_av").value||0)*(+$("e_ar").value||0)/100*rem).toFixed(2);
   const p=+$("e_ap").value||0,f=p*pctFees/100;
   fin=`<div>القسط الإضافي<b>${fmt(p)}</b></div><div>الرسوم والدمغات<b>${fmt(f)}</b></div><div class="tot">الإجمالي المستحق<b>${fmt(p+f)}</b></div><div>المدة المتبقية<b>${Math.round(rem*100)}%</b></div>`;
  }
  if(et=="ext"){
   const oldEnd=d.end, newEnd=$("e_ext_to").value;
   $("e_ext_old").value=oldEnd;$("e_ext_new").value=newEnd;
   fin=`<div>تاريخ الانتهاء الحالي<b>${oldEnd}</b></div><div>تاريخ الانتهاء الجديد<b>${newEnd||"—"}</b></div>`;
  }
  if(et=="cls"){
   const base=+$("e_pb").value||0,dd=Math.min(100,Math.max(0,+$("e_dd").value||0)),rf=base*rem*(1-dd/100);
   $("e_rf").value=rf.toFixed(2);
   fin=`<div>القسط المسدد<b>${fmt(base)}</b></div><div>المدة المنقضية<b>${Math.round((1-rem)*100)}%</b></div><div class="tot">القسط المسترد<b>${fmt(rf)}</b></div>`;
  }
 }
 $("e_fin").innerHTML=fin;
}
$("e_p").oninput=()=>{
 const d=eDoc();
 $("e_cl").value=d?d.f.name:"";
 $("e_pi").value=d?(d.cur=="car"?"سيارة — "+d.f.use+" — "+d.f.plate:"عام — "+d.f.kind)+" | "+d.f.start+" ← "+d.end:"";
 const L=d?[...FLD.all.filter(x=>isAdmin()||(x[0]!="nid"&&x[0]!="phone")),...FLD[d.cur]]:[];
 $("e_fld").innerHTML=L.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join("")+(d?'<option value="_">أخرى (وصف حر)</option>':"");
 eOld();
 if(d){
  const r=(d.pm&&d.pm.rows||[]).find(x=>x.on&&x.rate);$("e_ar").value=r?r.rate:"";
  const names=d.cur=="car"?["خدمة مساعدة الطريق","شغب واضطرابات","حوادث شخصية للركاب","الحوادث الشخصية (السائق)","الأخطار الطبيعية","هلاك كلي"]:(GCOV[d.f.kind]||[]).slice(1).map(x=>x[0]);
  $("e_acl").innerHTML=names.map(n=>`<option value="${esc(n)}">`).join("");
  $("e_pb").value=+((d.pm?d.pm.due:d.c.prem)||0).toFixed(2);
 }else{$("e_pb").value=""}
 eCalc();
};
$("e_fld").onchange=eOld;
$("e_at").onchange=()=>{$("e_acw").hidden=$("e_at").value!="إضافة تغطية";eCalc()};
["e_d","e_av","e_ar","e_ap","e_am","e_dd","e_ext_from","e_ext_to"].forEach(i=>{$(i).addEventListener("input",eCalc);$(i).addEventListener("change",eCalc)});
$("e_tabs").querySelectorAll("button").forEach(b=>b.onclick=()=>b.dataset.go?show("s"+cur):endUI(b.dataset.t));
$("e_clr").onclick=()=>endUI(et);
function openEnd(no){show("end_chg");const p=$("e_p");p.value=no;p.dispatchEvent(new Event("input"))}
$("st_end").onclick=()=>show("end_list");$("snewe").onclick=()=>show("end_chg");
$("doc_end").onclick=()=>{if(curDoc&&!curDoc.closed)openEnd(curDoc.no)};
$("e_save").onclick=()=>{
 const e=$("e_err"),d=eDoc(),eff=$("e_d").value;
 if(!et)return;
 if(et=="cls"&&!isAdmin()){e.textContent="إلغاء بالتصفية للمدير فقط";return}
 if(!d){e.textContent="اختر رقم وثيقة صحيح (غير مغلقة) من القائمة";return}
 if(!eff||eff<d.f.start||eff>d.end){e.textContent="تاريخ سريان الملحق خارج مدة الوثيقة ("+d.f.start+" إلى "+d.end+")";return}
 const rec={no:"",type:et,pno:d.no,cur:d.cur,client:d.f.name,eff,notes:$("e_n").value.trim(),by:me.n,byU:me.u,date:today(),data:{},amt:0,fees:0};
 if(et=="chg"){
  const k=$("e_fld").value,nv=$("e_new").value.trim();
  if(!k){e.textContent="اختر البيان المراد تغييره";return}
  if(!nv){e.textContent="أدخل القيمة الجديدة";return}
  if(k!="_"&&nv==String(d.f[k]||"")){e.textContent="القيمة الجديدة مطابقة للقيمة الحالية";return}
  rec.data={k,lab:k=="_"?"بيان آخر":$("e_fld").selectedOptions[0].textContent,old:$("e_old").value.trim()||"—",nw:nv,upd:k!="_"&&$("e_upd").checked};
 }
 if(et=="add"){
  const av=+$("e_av").value,p=+$("e_ap").value||0,isCov=$("e_at").value=="إضافة تغطية",ac=$("e_ac").value.trim();
  if(!(av>0)){e.textContent="أدخل المبلغ المضاف";return}
  if(isCov&&!ac){e.textContent="أدخل اسم التغطية المضافة";return}
  if(!(p>0)){e.textContent="القسط الإضافي يجب أن يكون أكبر من صفر (أدخل النسبة أو القسط اليدوي)";return}
  rec.data={at:$("e_at").value,ac:isCov?ac:"",av,rate:+$("e_ar").value||0};
  rec.amt=p;rec.fees=p*pctFees/100;
 }
 if(et=="ext"){
  const from=$("e_ext_from").value,to=$("e_ext_to").value;
  if(!from||!to||from>d.end||to<=d.end||to<from){e.textContent="أدخل فترة تمديد صحيحة: بداية التمديد من تاريخ الانتهاء الحالي أو بعده، وتاريخ نهاية جديد لاحق لتاريخ الانتهاء الحالي";return}
  rec.data={oldStart:d.f.start,oldEnd:d.end,from,to};rec.eff=from;rec.amt=0;
 }
 if(et=="cls"){
  const base=+$("e_pb").value||0,rf=+$("e_rf").value||0;
  rec.data={reason:$("e_cr").value,base,dd:+$("e_dd").value||0};
  rec.amt=-rf;
 }
 const y=new Date().getFullYear(),mx=Math.max(0,...ends.filter(x=>x.no.startsWith("END-"+y)).map(x=>+x.no.split("-")[2]||0));
 rec.no="END-"+y+"-"+String(mx+1).padStart(5,"0");
 if(et=="chg"&&rec.data.upd)d.f[rec.data.k]=rec.data.nw;
 if(et=="ext"){d.originalEnd=d.originalEnd||d.end;d.end=rec.data.to;d.extensions=d.extensions||[];d.extensions.push({no:rec.no,from:rec.data.from,to:rec.data.to,date:rec.date});}
 if(et=="cls")d.closed={date:eff,reason:rec.data.reason,refund:-rec.amt,end:rec.no};
 ends.unshift(rec);sv("ins_end",ends);if(et!="add"&&(rec.data.upd||et=="cls"||et=="ext"))sv("ins_docs",docs);
 const t=et;endUI(t);renderEnd(rec);$("e_err").innerHTML='<span class="ok">تم إصدار الملحق '+esc(rec.no)+'</span>';
};
function endList(){
 const l=ends.filter(x=>isAdmin()||x.byU==me.u);
 $("e_rows").innerHTML=l.length?l.map(x=>`<tr><td>${esc(x.no)}</td><td>${esc(ET[x.type])}</td><td>${esc(x.pno)}</td><td>${esc(x.client)}</td><td>${esc(x.eff)}</td><td>${x.amt>0?"+"+fmt(x.amt+x.fees):x.amt<0?"−"+fmt(-x.amt):"—"}</td><td>${esc(x.by)}</td><td><button class="btn sm alt" data-v="${esc(x.no)}">عرض / طباعة</button></td></tr>`).join(""):'<tr><td colspan="8">لا توجد ملاحق بعد</td></tr>';
 $("e_rows").querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>renderEnd(ends.find(x=>x.no==b.dataset.v)));
}
function renderEnd(r){
 const d=docs.find(x=>x.no==r.pno),f=d?d.f:{};
 let det="";
 if(r.type=="chg")det=`<tr><th>البيان المُعدَّل</th><td colspan="3">${esc(r.data.lab)}</td></tr><tr><th>القيمة السابقة</th><td>${esc(r.data.old)}</td><th>القيمة الجديدة</th><td>${esc(r.data.nw)}</td></tr>`;
 if(r.type=="add")det=`<tr><th>نوع الإضافة</th><td>${esc(r.data.at)}</td><th>${r.data.ac?"التغطية المضافة":"مبلغ التأمين المضاف"}</th><td>${r.data.ac?esc(r.data.ac)+" — ":""}${fmt(r.data.av)}</td></tr><tr><th>نسبة القسط</th><td>${esc(r.data.rate)}%</td><th>القسط الإضافي</th><td>${fmt(r.amt)}</td></tr><tr><th>الرسوم والدمغات</th><td>${fmt(r.fees)}</td><th>الإجمالي المستحق</th><td><b>${fmt(r.amt+r.fees)}</b></td></tr>`;
 if(r.type=="ext")det=`<tr><th>تاريخ الانتهاء الأصلي</th><td>${esc(r.data.oldEnd)}</td><th>بداية التمديد</th><td>${esc(r.data.from)}</td></tr><tr><th>تاريخ الانتهاء الجديد</th><td colspan="3"><b>${esc(r.data.to)}</b></td></tr>`;
 if(r.type=="cls")det=`<tr><th>سبب الإغلاق</th><td>${esc(r.data.reason)}</td><th>القسط المسدد</th><td>${fmt(r.data.base)}</td></tr><tr><th>خصم المصاريف</th><td>${esc(r.data.dd)}%</td><th>القسط المسترد للعميل</th><td><b>${fmt(-r.amt)}</b></td></tr>`;
 const stmt=r.type=="ext"?"تم تمديد الفترة التأمينية للوثيقة حتى تاريخ الانتهاء الجديد الموضح بهذا الملحق، مع الاحتفاظ بتاريخ الوثيقة الأصلي وسجل التمديدات السابقة.":r.type=="cls"?"تُغلق الوثيقة المذكورة وتُصفّى اعتبارًا من تاريخ سريان هذا الملحق، ولا تُقبل أي مطالبات عن حوادث تقع بعد هذا التاريخ.":"يُعتبر هذا الملحق جزءًا لا يتجزأ من الوثيقة الأصلية، وتبقى باقي الشروط والاشتراطات الواردة بالوثيقة كما هي دون أي تعديل أو تغيير.";
 $("edoc").innerHTML=`<h3>${esc(ET[r.type])}</h3><div class="sub">رقم الملحق: ${esc(r.no)} &nbsp;|&nbsp; تاريخ الإصدار: ${esc(r.date)} &nbsp;|&nbsp; المُصدِر: ${esc(r.by)}</div>
 <table><tr><th>رقم الوثيقة الأصلية</th><td>${esc(r.pno)}</td><th>المؤمَّن له</th><td>${esc(r.client)}</td></tr>
 <tr><th>نوع التأمين</th><td>${d?(d.cur=="car"?"سيارات — "+esc(f.use):"عام — "+esc(f.kind)):"—"}</td><th>مدة الوثيقة</th><td>${esc(f.start||"—")} ← ${esc(d?d.end:"—")}</td></tr>
 <tr><th>تاريخ سريان الملحق</th><td colspan="3">${esc(r.eff)}</td></tr>${det}</table>
 ${r.notes?`<h4>ملاحظات</h4><p style="font-size:.85rem;margin:0">${esc(r.notes)}</p>`:""}
 <h4>إقرار</h4><p style="font-size:.85rem;margin:0">${stmt}</p>
 <div class="sig"><div><span>توقيع المؤمَّن له</span></div><div><span>توقيع وختم الشركة</span></div></div>`;
 $("edoc").hidden=false;$("edbtns").hidden=false;$("edoc").scrollIntoView({behavior:"smooth"});
}
/* ---------- reinsurance ---------- */
let ris=ld("ins_ri",[]);
function riUI(){
 $("ri_no").value="RI-"+new Date().getFullYear()+"-"+String(Math.max(0,...ris.map(r=>+r.no.split("-")[2]||0))+1).padStart(4,"0");
 ["ri_n","ri_r","ri_c","ri_k","ri_l","ri_m","ri_o"].forEach(i=>$(i).value="");$("ri_s").value=today();$("ri_e").value="";$("ri_err").textContent="";riList();
}
function riList(){
 const st=r=>r.e<today()?"منتهية":r.s>today()?"لم تبدأ":"سارية";
 $("ri_rows").innerHTML=ris.length?ris.map((r,i)=>`<tr><td>${esc(r.no)}</td><td>${esc(r.n)}</td><td>${esc(r.t)}</td><td>${esc(r.r)}</td><td>${esc(r.d)}</td><td>${esc(r.s)} → ${esc(r.e)}</td><td>${esc(r.c)}%</td><td>${fmt(r.k)}</td><td>${fmt(r.l)}</td><td>${esc(r.m)}%</td><td>${st(r)}</td><td><button class="btn sm red" data-ri="${i}">حذف</button></td></tr>`).join(""):'<tr><td colspan="12">لا توجد اتفاقيات بعد</td></tr>';
 $("ri_rows").querySelectorAll("[data-ri]").forEach(b=>b.onclick=()=>{if(b.dataset.s){ris.splice(+b.dataset.ri,1);sv("ins_ri",ris);riList()}else{b.dataset.s=1;b.textContent="تأكيد الحذف؟"}});
}
$("ri_clr").onclick=riUI;
$("ri_save").onclick=()=>{
 const g=i=>$(i).value.trim(),e=$("ri_err"),c=+g("ri_c"),k=+g("ri_k")||0,l=+g("ri_l"),m=+g("ri_m")||0;
 if(!g("ri_n")||!g("ri_r")||!g("ri_s")||!g("ri_e")){e.textContent="أكمل اسم الاتفاقية ومعيد التأمين وتاريخي البداية والنهاية";return}
 if(g("ri_e")<=g("ri_s")){e.textContent="تاريخ النهاية يجب أن يكون بعد تاريخ البداية";return}
 if(g("ri_c")===""||c<0||c>100){e.textContent="نسبة الإسناد يجب أن تكون من 0 إلى 100";return}
 if(!(l>0)||k<0){e.textContent="أدخل الحد الأقصى للاتفاقية بقيمة أكبر من صفر";return}
 if(m<0||m>100){e.textContent="العمولة يجب أن تكون من 0 إلى 100";return}
 const r={no:$("ri_no").value,n:g("ri_n"),t:$("ri_t").value,r:g("ri_r"),d:$("ri_d").value,s:g("ri_s"),e:g("ri_e"),c,k,l,m,o:g("ri_o"),by:me.n,date:today()};
 ris.unshift(r);sv("ins_ri",ris);riUI();$("ri_err").innerHTML='<span class="ok">تم حفظ الاتفاقية '+esc(r.no)+'</span>';
};
$("tmpgo").onclick=()=>show("usr");
$("madd").onclick=async()=>{
 const n=$("mn").value.trim(),u=$("mu").value.trim(),p=$("mp").value,e=$("merr");
 if(!n||!u||p.length<4){e.textContent="أدخل الاسم واسم المستخدم وكلمة مرور لا تقل عن 4 أحرف";return}
 if(users.length){e.textContent="تم تحديد المدير مسبقًا";return}
 const m={n,u,h:await sha(p),role:"مدير"};users=[m];sv("ins_users",users);
 docs.forEach(d=>{if(!d.byU){d.by=n;d.byU=u}});claims.forEach(c=>{if(!c.byU){c.by=n;c.byU=u}});
 if(!sv("ins_docs",docs))sv("ins_docs",docs.map(d=>({...d,imgs:[]})));saveC();
 me=m;["mn","mu","mp"].forEach(i=>$(i).value="");enter();
};
(async()=>{
 if(!users.length){users=[{n:"مدير النظام",u:"admin",h:await sha("admin123"),role:"مدير",def:true}];sv("ins_users",users)}
 users.forEach(u=>{if(u.u=="admin")u.role="مدير"});mode="login";authUI();
})();
