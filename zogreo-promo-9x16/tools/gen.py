#!/usr/bin/env python3
"""Generate index.html for the Zogreo channels promo (v2).

Every cue is keyed to a spoken word from build/words.json (forced alignment of the
unedited narration). Run: python3 -I tools/gen.py  (from the project folder).
"""
import json, os, re

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fonts = open(os.path.join(HERE, "..", "zogreo-intro-9x16", "src", "fonts.css")).read()
d = json.load(open(os.path.join(HERE, "build", "words.json")))
words = [{"w": w["word"], "s": w["start"], "e": w["end"], "l": w["line"]} for w in d["words"]]

def sig(c):  # phone signal + battery, in a given colour
    return (f'<svg width="38" height="24" viewBox="0 0 38 24"><rect x="0" y="16" width="6" height="8" rx="2" fill="{c}"/>'
            f'<rect x="10" y="11" width="6" height="13" rx="2" fill="{c}"/><rect x="20" y="6" width="6" height="18" rx="2" fill="{c}"/>'
            f'<rect x="30" y="0" width="6" height="24" rx="2" fill="{c}" opacity=".45"/></svg>'
            f'<svg width="50" height="24" viewBox="0 0 50 24"><rect x="1" y="1" width="42" height="22" rx="7" fill="none" stroke="{c}" stroke-width="2" opacity=".7"/>'
            f'<rect x="5" y="5" width="22" height="14" rx="4" fill="{c}"/><rect x="45" y="8" width="4" height="8" rx="2" fill="{c}" opacity=".7"/></svg>')

PERSON = '<svg viewBox="0 0 70 70" width="{w}" height="{w}"><circle cx="35" cy="24" r="13" fill="{c}"/><path d="M10 64c2-18 12-26 25-26s23 8 25 26z" fill="{c}"/></svg>'

# lock-screen notifications (illustrative; names invented)
NOTES = [
    ("wa", "assets/logos/whatsapp.png", "WHATSAPP", "Amir", "Hi, can I ask you something about Jesus?"),
    ("ig", "assets/logos/instagram.png", "INSTAGRAM", "Lena", "Saw your post. Who was Jesus, really?"),
    ("tg", "assets/logos/telegram.png", "TELEGRAM", "Daniel", "Is it okay to ask questions here?"),
]
notes_html = "".join(
    f'<div class="ncard" id="n-{k}"><div data-layout-ignore class="nrow"><img class="nic" src="{src}"><span>{app}</span><span class="nwhen">now</span></div>'
    f'<div class="nname">{name}</div><div class="nprev">{msg}</div></div>'
    for k, src, app, name, msg in NOTES)

# inbox rows: (id, initials-name, channel icon, journey position 1..5), in arrival order
ROWS = [
    ("lena", "Lena", "assets/logos/instagram.png", 2),
    ("daniel", "Daniel", "assets/logos/telegram.png", 3),
    ("amir", "Amir", "assets/logos/whatsapp.png", 5),
    ("sami", "Sami", "assets/logos/extra/line.png", 1),
    ("mei", "Mei", "assets/logos/extra/kakaotalk.png", 4),
    ("yusuf", "Yusuf", "assets/logos/extra/messenger.png", 2),
]
rows_html = ""
for i, (rid, name, icon, pos) in enumerate(ROWS):
    dots = "".join(f'<i class="jd" data-on="{1 if k < pos else 0}"></i>' for k in range(5))
    rows_html += (f'<div class="irow" id="r-{rid}" data-pos="{pos}" style="top:{240 + i * 200}px">'
                  f'<div class="iav">{name[0]}</div><div class="iname">{name}<img class="ich" src="{icon}"></div>'
                  f'<div class="itrack">{dots}</div></div>')

FAN = ["line", "discord", "messenger", "kakaotalk", "qq"]
fan_html = "".join(f'<img class="fan" id="f-{k}" src="assets/logos/extra/{k}.png">' for k in FAN)

DUR = {"notification": 2.4555, "pop-hi": 0.7314, "ping": 1.32, "pop-lo": 0.9143, "whoosh-short": 0.5747, "click-soft": 0.3657, "pop": 0.72}

html = r'''<!doctype html>
<html lang="en" data-resolution="portrait">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<script src="assets/vendor/gsap.min.js"></script>
<style>
__FONTS__
html, body { margin:0; width:1080px; height:1920px; overflow:hidden; background:#163017; }
#root { position:relative; width:1080px; height:1920px; overflow:hidden; background:radial-gradient(110% 70% at 50% 38%, #24492A 0%, #1D3D1E 55%, #152D16 100%); }
#root * { box-sizing:border-box; }
.abs { position:absolute; }
#rings, #erings { position:absolute; left:0; top:0; width:1080px; height:1920px; }
#tag { position:absolute; left:0; top:68px; width:1080px; text-align:center; font:600 28px/1 "ZG Inter"; letter-spacing:.3em; color:#F3F0E8; opacity:.62; }

/* phone (native 860x1780, scaled from its top centre) */
#phone { position:absolute; left:110px; top:140px; width:860px; height:1780px; transform-origin:430px 0; border-radius:124px; background:#0A150B; box-shadow: inset 0 0 0 3px rgba(232,228,227,.16), 0 30px 80px rgba(0,0,0,.28); }
#screen { position:absolute; left:14px; top:14px; width:832px; height:1752px; border-radius:110px; overflow:hidden; background:#F7F4EC; }
.island { position:absolute; left:326px; top:26px; width:180px; height:54px; border-radius:27px; background:#000; z-index:9; }
.status { position:absolute; top:40px; right:64px; display:flex; gap:12px; align-items:center; z-index:8; }
.stime { position:absolute; left:92px; top:36px; font:600 30px/1 "ZG Inter"; z-index:8; }
.layer { position:absolute; inset:0; }

#lock { background: radial-gradient(110% 70% at 50% 22%, #2A5530 0%, #173419 55%, #0E2010 100%); }
#clock { position:absolute; left:0; top:130px; width:832px; text-align:center; font:600 200px/1 "ZG Inter"; letter-spacing:-.03em; color:#F3F0E8; }
#date { position:absolute; left:0; top:350px; width:832px; text-align:center; font:500 44px/1 "ZG Inter"; color:#F3F0E8; opacity:.8; }
.ncard { position:absolute; left:30px; top:430px; width:772px; border-radius:40px; background:rgba(247,244,236,.96); padding:24px 30px; color:#1B241A; }
.nrow { display:flex; align-items:center; gap:14px; font:600 30px/1 "ZG Inter"; letter-spacing:.08em; color:#6B7468; }
.nic { width:52px; height:52px; border-radius:13px; }
.nwhen { margin-left:auto; letter-spacing:.02em; font-weight:500; }
.nname { font:700 44px/1.2 "ZG Inter"; margin-top:16px; }
.nprev { font:400 43px/1.25 "ZG Inter"; color:#3E473C; margin-top:6px; }

#inbox { background:#F7F4EC; }
#ititle { position:absolute; left:56px; top:120px; font:700 64px/1 "ZG Inter"; color:#1B241A; letter-spacing:-.01em; }
.irow { position:absolute; left:30px; width:772px; height:178px; border-radius:36px; background:#FFFFFF; box-shadow: 0 2px 0 rgba(29,61,30,.06); }
.irow.hot { background:#E5EDDD; box-shadow: inset 8px 0 0 #4E8A4F; }
.iav { position:absolute; left:28px; top:39px; width:100px; height:100px; border-radius:50px; background:#D9E0D2; color:#1D3D1E; font:600 44px/100px "ZG Inter"; text-align:center; }
.iname { position:absolute; left:156px; top:34px; font:700 46px/1 "ZG Inter"; color:#1B241A; display:flex; align-items:center; gap:14px; }
.ich { width:46px; height:46px; border-radius:12px; }
.itrack { position:absolute; left:158px; top:108px; display:flex; gap:12px; align-items:center; }
.jd { display:block; width:58px; height:12px; border-radius:6px; background:#DCE3D5; }

#thread { background:#F7F4EC; }
#thead { position:absolute; left:0; top:96px; width:832px; height:138px; border-bottom:2px solid #E3DFD3; }
#tback { position:absolute; left:44px; top:44px; }
#tav { position:absolute; left:96px; top:22px; width:84px; height:84px; border-radius:42px; background:#D9E0D2; font:600 38px/84px "ZG Inter"; text-align:center; color:#1D3D1E; }
#tname { position:absolute; left:200px; top:16px; font:700 44px/1.2 "ZG Inter"; color:#1B241A; }
#tsub { position:absolute; left:200px; top:72px; font:500 38px/1.2 "ZG Inter"; color:#5F6E5F; display:flex; gap:10px; align-items:center; }
#tsub img { width:40px; height:40px; border-radius:10px; }
.msg { position:absolute; }
.b { border-radius:36px; padding:22px 32px; font:400 40px/52px "ZG Inter"; max-width:700px; }
.in { left:36px; background:#FFFFFF; color:#1B241A; border-bottom-left-radius:10px; box-shadow:0 2px 0 rgba(29,61,30,.06); }
.out { right:36px; background:#1D3D1E; color:#F7F4EC; border-bottom-right-radius:10px; }
.meta { position:absolute; right:44px; font:500 38px/1 "ZG Inter"; color:#6B7A6A; white-space:nowrap; }
#typing { right:36px; width:132px; height:88px; border-radius:36px; border-bottom-right-radius:10px; background:#1D3D1E; }
.tdot { position:absolute; top:37px; width:14px; height:14px; border-radius:7px; background:#F7F4EC; }
#chip { left:0; width:832px; text-align:center; }
#chip span { display:inline-block; font:600 38px/1 "ZG Inter"; letter-spacing:.04em; color:#1D3D1E; background:#DDE6D6; padding:18px 28px; border-radius:31px; }
#believer { left:36px; width:760px; height:200px; border-radius:40px; background:#FFFFFF; box-shadow: inset 0 0 0 4px #1D3D1E; }
#bav { position:absolute; left:30px; top:36px; width:128px; height:128px; border-radius:64px; background:#1D3D1E; display:flex; align-items:center; justify-content:center; }
#bname { position:absolute; left:186px; top:44px; font:700 46px/1.1 "ZG Inter"; color:#1B241A; }
#bsub { position:absolute; left:186px; top:104px; font:500 40px/1.2 "ZG Inter"; color:#4B5245; }

/* fan */
.fan { position:absolute; width:132px; height:132px; left:474px; top:1330px; }
#more { position:absolute; left:0; top:1392px; width:1080px; text-align:center; font:600 28px/1 "ZG Inter"; letter-spacing:.3em; color:#F3F0E8; }

/* tools */
#s4, #s5 { position:absolute; left:0; top:0; width:1080px; height:1920px; visibility:hidden; transform-origin:540px 900px; }
.vline { position:absolute; left:538px; width:4px; background:rgba(243,240,232,.55); border-radius:2px; transform-origin:top; }
.trav { position:absolute; left:531px; top:0; width:18px; height:18px; border-radius:9px; background:#F3F0E8; opacity:0; }

/* end card */
#elabel { position:absolute; left:0; top:742px; width:1080px; text-align:center; font:600 25px/1 "ZG Inter"; letter-spacing:.26em; color:#B4C4AE; }
#elabel b { display:inline-block; width:44px; height:2px; background:#B4C4AE; vertical-align:middle; margin-right:22px; position:relative; top:-3px; }
.pill { position:absolute; left:200px; width:680px; height:108px; border-radius:54px; text-align:center; font:600 40px/108px "ZG Inter"; }
#p1 { top:880px; color:#F3F0E8; box-shadow: inset 0 0 0 3px rgba(243,240,232,.85); }
#p2 { top:1018px; background:#F3F0E8; color:#1D3D1E; }
#url { position:absolute; left:0; top:1196px; width:1080px; text-align:center; font:300 140px/1 "Cormorant Garamond"; color:#F3F0E8; }

/* captions */
#cap { position:absolute; left:80px; top:1600px; width:920px; height:240px; }
.cap { position:absolute; left:0; top:0; width:920px; text-align:center; opacity:0; }
.cap > span { display:inline-block; max-width:920px; font:600 42px/1.3 "ZG Inter"; color:#F3F0E8; background:rgba(11,26,12,.9); padding:16px 34px; border-radius:36px; }
.cw { opacity:.74; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="33.03" data-width="1080" data-height="1920">
  <svg id="rings" viewBox="0 0 1080 1920"><g fill="none" stroke="#F3F0E8" stroke-opacity=".06" stroke-width="2"><circle cx="540" cy="-60" r="420"/><circle cx="540" cy="-60" r="620"/><circle cx="540" cy="-60" r="820"/><circle cx="540" cy="1980" r="520"/><circle cx="540" cy="1980" r="720"/></g></svg>
  <div id="tag">ILLUSTRATIVE CONVERSATION</div>

  <div id="phone">
    <div id="screen">
      <div class="island"></div>
      <div class="layer" id="lock">
        <div data-layout-ignore class="stime" style="color:#F3F0E8;opacity:0"></div>
        <div data-layout-ignore class="status">__SIGL__</div>
        <div id="clock">8:14</div><div id="date">Thursday</div>
        __NOTES__
      </div>
      <div class="layer" id="inbox">
        <div data-layout-ignore class="stime" style="color:#1B241A">8:14</div><div data-layout-ignore class="status">__SIGD__</div>
        <div id="ititle">Inbox</div>
        __ROWS__
      </div>
      <div class="layer" id="thread">
        <div data-layout-ignore class="stime" style="color:#1B241A">8:15</div><div data-layout-ignore class="status">__SIGD__</div>
        <div id="thead">
          <svg id="tback" width="30" height="50" viewBox="0 0 30 50"><path d="M24 4 L6 25 L24 46" fill="none" stroke="#1D3D1E" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <div id="tav">A</div><div id="tname">Amir</div>
          <div id="tsub"><img src="assets/logos/whatsapp.png">via WhatsApp</div>
        </div>
        <div class="msg b in" id="m1" style="top:290px">Does God really listen to people like me?</div>
        <div class="msg" id="typing" style="top:470px"><i class="tdot" style="left:30px"></i><i class="tdot" style="left:59px"></i><i class="tdot" style="left:88px"></i></div>
        <div class="msg b out" id="m2" style="top:470px">Yes. A lot of people ask that. Can I show you what the Bible says?</div>
        <div class="meta" id="m2meta" style="top:700px">In your ministry&#8217;s voice</div>
        <div class="msg b in" id="m3" style="top:768px">Yes, I&#8217;d like that.</div>
        <div class="msg" id="chip" style="top:906px"><span>A missionary joined the conversation</span></div>
        <div class="msg" id="believer" style="top:1000px"><div id="bav">__PERSONW__</div><div id="bname">Joseph</div><div id="bsub">Missionary</div></div>
        <div class="msg b in" id="m4" style="top:1232px">Hi Amir, I&#8217;d love to keep talking.</div>
      </div>
    </div>
  </div>

  __FAN__
  <div id="more">AND MORE</div>

  <div id="s4">
    <img class="abs" id="l-cw" src="assets/logos/chatwoot-white.svg" style="left:190px;top:430px;width:700px;height:148px">
    <div class="vline" id="ln1" style="top:604px;height:150px"></div>
    <div class="trav" id="t1"></div>
    <img class="abs" id="l-zg" src="assets/logos/zogreo-wordmark.svg" style="left:360px;top:772px;width:360px;height:128px">
    <div class="vline" id="ln2" style="top:922px;height:150px"></div>
    <div class="trav" id="t2"></div>
    <img class="abs" id="l-tb" src="assets/logos/turumba-white.svg" style="left:220px;top:1092px;width:640px;height:168px">
  </div>

  <div id="s5">
    <svg id="erings" viewBox="0 0 1080 1920"><g fill="none" stroke="#F3F0E8" stroke-opacity=".08" stroke-width="2"><circle cx="200" cy="420" r="460"/><circle cx="930" cy="250" r="560"/><circle cx="640" cy="760" r="300"/><circle cx="-80" cy="1500" r="620"/><circle cx="1150" cy="1650" r="520"/></g></svg>
    <img class="abs" id="l-end" src="assets/logos/zogreo-wordmark.svg" style="left:170px;top:380px;width:740px;height:263px">
    <div id="elabel"><b></b>A PROGRAM OF THE APOLOGIST PROJECT</div>
    <div class="pill" id="p1">Book a free demo call</div>
    <div class="pill" id="p2">Make a donation</div>
    <div id="url">zogreo.org</div>
  </div>

  <div id="cap"></div>

  <audio id="vo" class="clip" src="assets/vo/narration.mp3" data-start="0" data-duration="32.03" data-track-index="4" data-volume="1" data-audio-group="voiceover"></audio>
  __SFX__
</div>
<script>
const WORDS = __WORDS__;
const norm = s => s.replace(/[^A-Za-z']/g,'').toLowerCase();
const wd = (l, t, nth=0) => { const m = WORDS.filter(w => w.l===l && norm(w.w)===t.toLowerCase()); if(!m[nth]) throw new Error("no word "+l+" "+t); return m[nth]; };
const S = (l,t,n) => wd(l,t,n).s, E = (l,t,n) => wd(l,t,n).e;
const tl = gsap.timeline({ paused:true });
window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;
const POP = "back.out(1.6)", OUT = "power3.out", INOUT = "power3.inOut";
const pop = (el, t, from=.86) => tl.fromTo(el, { scale:from, opacity:0, transformOrigin:"50% 50%" }, { scale:1, opacity:1, duration:.42, ease:POP }, t);
const fadeUp = (el, t, y=20, d=.4) => tl.fromTo(el, { y, opacity:0 }, { y:0, opacity:1, duration:d, ease:OUT }, t);

/* ---------- initial state ---------- */
gsap.set(".ncard, .fan, #more, #inbox, #thread, #typing, #m1, #m2, #m2meta, #m3, #chip, #believer, #m4", { opacity:0 });
gsap.set("#inbox", { x:832, opacity:1, visibility:"hidden" }); gsap.set("#thread", { x:832, opacity:1, visibility:"hidden" });
gsap.set("#phone", { scale:.66 });
const L1end = E(1,"use"), L3end = E(3,"missionary");

/* ---------- Line 1: messages arrive on the lock screen ---------- */
tl.fromTo("#phone", { y:40, opacity:0 }, { y:0, opacity:1, duration:.6, ease:OUT }, 0);
tl.fromTo("#tag", { opacity:0 }, { opacity:.62, duration:.6 }, .2);
const cards = ["#n-wa","#n-ig","#n-tg"], cueW = ["WhatsApp","Instagram","Telegram"];
cards.forEach((c,i)=>{
  const t = S(1,cueW[i]) - .08;
  for (let k=0; k<i; k++) tl.to(cards[k], { y:"+=" + (document.querySelector(c).offsetHeight + 18), duration:.38, ease:OUT }, t);  // older cards slide down
  tl.fromTo(c, { y:-40, scale:.94, opacity:0 }, { y:0, scale:1, opacity:1, duration:.42, ease:POP }, t);
});
/* "or another platform": the rest of the supplied icons fan out from behind the phone */
const FAN = __FANLIST__;
const R = 390, CX = 540, CY = 1590, A = [-166,-128,-90,-52,-14];
FAN.forEach((k,i)=>{
  const a = A[i]*Math.PI/180, x = CX + R*Math.cos(a) - 66, y = CY + R*Math.sin(a) - 66;
  tl.fromTo("#f-"+k, { x:0, y:0, rotation:0, scale:.5, opacity:0 },
    { x:x-474, y:y-1330, rotation:(A[i]+90)*.28, scale:1, opacity:1, duration:.55, ease:"back.out(1.4)" }, S(1,"another") + i*.07);
});
fadeUp("#more", S(1,"platform")+.1, 12);
/* push in: into the inbox */
tl.to(".fan, #more", { opacity:0, scale:.8, duration:.3, ease:"power2.in" }, L1end + .05);
tl.to("#phone", { scale:.74, duration:.7, ease:INOUT }, L1end + .05);
tl.set("#inbox", { visibility:"visible" }, L1end + .3);
tl.to("#inbox", { x:0, duration:.45, ease:OUT }, L1end + .3);
tl.set("#lock", { visibility:"hidden" }, L1end + .8);

/* ---------- Line 2: the inbox learns where each person is, then re-sorts ---------- */
const rows = Array.from(document.querySelectorAll(".irow"));
let k = 0;
rows.forEach((r,i)=> r.querySelectorAll('.jd[data-on="1"]').forEach((d,j)=>{
  tl.to(d, { backgroundColor:"#2F6034", duration:.18 }, S(2,"finds") + .1 + i*.12 + j*.07);
}));
tl.to("#phone", { scale:.76, duration:6, ease:"none" }, S(2,"our"));        // slow drift
const order = rows.slice().sort((a,b)=> (+b.dataset.pos) - (+a.dataset.pos));  // stable sort keeps arrival order on ties
order.forEach((r,i)=> tl.to(r, { y: (i - rows.indexOf(r))*200, duration:.6, ease:INOUT }, S(2,"people") + .02));
tl.add(()=>{}, S(2,"people"));
[[0,"most"],[1,"open"]].forEach(([i,w])=>{
  tl.set(order[i], { className:"irow hot" }, S(2,w));
  tl.fromTo(order[i], { scale:1 }, { scale:1.03, duration:.2, yoyo:true, repeat:1, ease:"sine.inOut" }, S(2,w));
});
tl.fromTo(order[0], { x:0 }, { x:10, duration:.16, yoyo:true, repeat:1, ease:"sine.inOut" }, S(2,"first"));

/* ---------- Line 3: the conversation, then the handoff ---------- */
tl.to(order[0], { backgroundColor:"#D3E1CC", duration:.12 }, E(2,"first") + .1);
tl.set("#thread", { visibility:"visible" }, E(2,"first") + .18);
tl.to("#thread", { x:0, duration:.45, ease:OUT }, E(2,"first") + .18);
tl.set("#inbox", { visibility:"hidden" }, E(2,"first") + .66);
fadeUp("#m1", S(3,"it") - .05, 16, .35);
tl.set("#typing", { opacity:1 }, S(3,"their"));
tl.fromTo("#typing .tdot", { y:0 }, { y:-9, duration:.2, yoyo:true, repeat:1, stagger:.08, ease:"sine.inOut" }, S(3,"their"));
tl.set("#typing", { opacity:0 }, E(3,"questions"));
fadeUp("#m2", E(3,"questions"), 16, .35);
fadeUp("#m2meta", S(3,"voice") - .1, 8, .3);
fadeUp("#m3", S(3,"time") - .1, 16, .35);
pop("#chip", S(3,"missionary") - .1, .9);
fadeUp("#believer", S(3,"missionary") + .05, 24, .42);
fadeUp("#m4", S(3,"missionary") + .4, 16, .35);
/* pull back: the phone leaves, the tools arrive */
const L4 = S(4,"already");
tl.to("#phone", { scale:.5, y:-60, opacity:0, duration:.5, ease:"power2.in" }, S(4,"using"));
tl.to("#tag", { opacity:0, duration:.4 }, S(4,"using"));

/* ---------- Line 4: Chatwoot and Turumba ---------- */
gsap.set(["#l-cw","#l-zg","#l-tb"], { opacity:0 }); gsap.set([".vline"], { scaleY:0 });
tl.set("#s4", { visibility:"visible" }, L4 - .05);
tl.fromTo("#s4", { scale:1 }, { scale:1.025, duration:6.6, ease:"none" }, L4 - .05);
pop("#l-cw", S(4,"Chatwoot") - .05, .9);
pop("#l-tb", S(4,"Turumba") - .05, .9);
pop("#l-zg", S(4,"platform") - .1, .9);
tl.to("#ln1", { scaleY:1, transformOrigin:"50% 100%", duration:.45, ease:OUT }, S(4,"connects"));
tl.to("#ln2", { scaleY:1, transformOrigin:"50% 0%", duration:.45, ease:OUT }, S(4,"connects"));
const trav = (id, y0, y1, t) => { tl.fromTo(id, { y:y0, opacity:0 }, { y:y1, opacity:1, duration:.7, ease:"power1.inOut" }, t); tl.to(id, { opacity:0, duration:.15 }, t+.7); };
[.45, 1.6].forEach(o=>{ trav("#t1", 762, 598, S(4,"connects")+o); trav("#t2", 904, 1070, S(4,"connects")+o); });
tl.to("#s4", { opacity:0, duration:.3, ease:"power2.in" }, E(4,"know") + .05);
tl.set("#s4", { visibility:"hidden" }, E(4,"know") + .36);

/* ---------- Line 5: end card in the brochure's style ---------- */
const L5 = S(5,"book");
gsap.set(["#l-end","#elabel","#p1","#p2","#url"], { opacity:0 }); gsap.set("#erings", { opacity:0 });
tl.set("#s5", { visibility:"visible" }, L5 - .15);
tl.fromTo("#s5", { scale:1 }, { scale:1.015, duration:5.2, ease:"none" }, L5 - .15);
tl.to("#erings", { opacity:1, duration:.8 }, L5 - .15);
tl.fromTo("#l-end", { opacity:0, filter:"blur(6px)", y:12 }, { opacity:1, filter:"blur(0px)", y:0, duration:.6, ease:OUT }, L5 - .1);
fadeUp("#elabel", L5 + .35, 10, .45);
pop("#p1", S(5,"demo") - .05, .92);
pop("#p2", S(5,"make") - .05, .92);
tl.fromTo("#url", { opacity:0, filter:"blur(6px)", y:14 }, { opacity:1, filter:"blur(0px)", y:0, duration:.5, ease:OUT }, S(5,"Zogreo"));

/* ---------- Captions: verbatim chunks; each word brightens as it is spoken ---------- */
const CHUNKS = {
 1:["A person messages your ministry","on WhatsApp, Instagram, Telegram,","or another platform you already use."],
 2:["Our AI finds out where they are on their spiritual journey,","so you can focus on the people most open to the gospel first."],
 3:["It answers their questions in your ministry's content and voice,","and when it's time, it hands the conversation to a missionary."],
 4:["Already using Chatwoot or Turumba?","Our platform connects with both,","so your team keeps working in the tools they know."],
 5:["Book a free demo call, or make a donation,","at zogreo.org."]
};
const cap = document.getElementById("cap");
const all = [];
for (let l=1; l<=5; l++) { const ws = WORDS.filter(w=>w.l===l); let i=0;
  CHUNKS[l].forEach(c => { const toks = c.split(" ").map(t => { const n = t.toLowerCase().startsWith("zogreo.org") ? 3 : 1; const o = { text:t, s:ws[i].s, e:ws[i+n-1].e }; i+=n; return o; });
    all.push({ toks, s:toks[0].s, e:toks[toks.length-1].e }); });
  if (i!==ws.length) throw new Error("caption/word mismatch on line "+l+": "+i+" vs "+ws.length); }
all.forEach((c,k)=>{ const d=document.createElement("div"); d.className="cap"; d.id="cap"+k; const sp=document.createElement("span"); d.appendChild(sp); cap.appendChild(d);
  c.toks.forEach((t,j)=>{ const w=document.createElement("span"); w.className="cw"; w.id=`cw${k}_${j}`; w.textContent=t.text; sp.appendChild(w); if (j<c.toks.length-1) sp.appendChild(document.createTextNode(" "));
    tl.to("#"+w.id, { opacity:1, duration:.1 }, t.s); });
  const nx = all[k+1]; let end = c.e + .25; if (nx && nx.s - c.e < .45) end = nx.s;
  tl.fromTo("#cap"+k, { opacity:0, y:8 }, { opacity:1, y:0, duration:.14, ease:OUT }, c.s - .06);
  if (nx) tl.to("#cap"+k, { opacity:0, duration:.12 }, Math.max(c.s+.25, end-.12)); });
tl.set({}, {}, 33.03);
</script>
</body>
</html>'''


def S(l, t, n=0):
    m = [w for w in words if w["l"] == l and re.sub(r"[^A-Za-z']", "", w["w"]).lower() == t.lower()]
    return m[n]["s"]


def E(l, t, n=0):
    m = [w for w in words if w["l"] == l and re.sub(r"[^A-Za-z']", "", w["w"]).lower() == t.lower()]
    return m[n]["e"]


SFXT = [  # (file, start, volume): quiet, placed on word times, never on top of a stressed word
    ("notification", S(1, "WhatsApp"), 0.13), ("pop-hi", S(1, "Instagram"), 0.12), ("ping", S(1, "Telegram"), 0.09),
    ("pop-lo", S(1, "another"), 0.14), ("whoosh-short", E(1, "use") + .08, 0.08), ("click-soft", E(1, "use") + .3, 0.32),
    ("pop", S(2, "people"), 0.11), ("click-soft", E(2, "first") + .12, 0.32), ("pop-lo", E(3, "questions"), 0.10),
    ("ping", S(3, "missionary") - .1, 0.10), ("whoosh-short", S(4, "using"), 0.08),
    ("pop", S(4, "Chatwoot") - .05, 0.11), ("pop", S(4, "Turumba") - .05, 0.11),
    ("click-soft", S(5, "demo") - .05, 0.24), ("click-soft", S(5, "make") - .05, 0.24), ("pop-hi", S(5, "Zogreo"), 0.09),
]
lanes, tags = [], []  # greedy lanes so no two effects overlap on one track
for i, (f, t, v) in enumerate(SFXT, 1):
    d = min(DUR[f], 33.03 - t)
    lane = next((k for k, end in enumerate(lanes) if end <= t), None)
    if lane is None:
        lanes.append(0); lane = len(lanes) - 1
    lanes[lane] = t + d
    tags.append(f'<audio id="sfx-{i:02d}" class="clip" src="assets/sfx/{f}.mp3" data-start="{t:.3f}" data-duration="{d:.3f}" '
                f'data-track-index="{5 + lane}" data-volume="{v}" data-audio-group="sfx"></audio>')
sfx_html = "\n  ".join(tags)

out = (html.replace("__FONTS__", fonts).replace("__WORDS__", json.dumps(words))
       .replace("__SIGL__", sig("#F3F0E8")).replace("__SIGD__", sig("#1B241A"))
       .replace("__NOTES__", notes_html).replace("__ROWS__", rows_html)
       .replace("__FAN__", fan_html).replace("__FANLIST__", json.dumps(FAN))
       .replace("__PERSONW__", PERSON.format(w=84, c="#F3F0E8")).replace("__SFX__", sfx_html))
assert not re.search(r"__[A-Z]+__", out), "unreplaced placeholder"
open(os.path.join(HERE, "index.html"), "w").write(out)
print("wrote index.html", len(out))
