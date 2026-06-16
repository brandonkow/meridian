import React, { useState, useEffect, useRef, useCallback } from "react";

const Framework=React.lazy(()=>import("./Framework.jsx"));
const Playbook=React.lazy(()=>import("./Playbook.jsx"));
const Standards=React.lazy(()=>import("./Standards.jsx"));
const SampleReport=React.lazy(()=>import("./Landing.jsx"));

// ── PALETTE ───────────────────────────────────────────────────────────────────
const BG="#FAF9F6", SURFACE="#FFFFFF", SURFACE_S="#F3F1EC";
const NAVY_SECTION="#1B3356";
const BORDER="#E2DDD6", BORDER_L="#EBE8E2";
const INK="#1A2130", INK_S="#485870", INK_M="#8B98A8", INK_F="#C4CAD4";
const NAVY="#1B3356", NAVY_L="#24406C", NAVY_DIM="rgba(27,51,86,.07)";
const GOLD="#A87928", GOLD_B="#C09520", GOLD_DIM="rgba(168,121,40,.08)";
const UP="#276749", DOWN="#B0392D", AMBER="#9A6B18";

// ── TIMING ────────────────────────────────────────────────────────────────────
const SCATTER_DUR=240, ASSEMBLE_DUR=360, SCROLL_DUR=580;

// ── DOMAIN COLOR MAP ──────────────────────────────────────────────────────────
const DC={
  "Scope":     {bg:"rgba(27,51,86,.06)",  bd:"rgba(27,51,86,.18)",  tx:NAVY},
  "Evidence":  {bg:GOLD_DIM,             bd:"rgba(168,121,40,.2)", tx:GOLD},
  "AI Use":    {bg:"rgba(39,103,73,.07)", bd:"rgba(39,103,73,.2)",  tx:UP},
  "Disclosure":{bg:"rgba(176,57,45,.06)", bd:"rgba(176,57,45,.2)",  tx:DOWN},
  "Process":   {bg:"rgba(154,107,24,.06)",bd:"rgba(154,107,24,.2)", tx:AMBER},
};

// ── DATA ──────────────────────────────────────────────────────────────────────
const MER_TYPES=[
  {code:"MER-MKT",type:"Market Entry / Market Study",pages:"15–30",sections:[1,2,3,4,5,6,8],tag:"Most Used",
   desc:"End-to-end market entry study. Covers primary market area delineation, supply/demand analysis, competitive landscape, macro & regulatory environment, financial analysis, and implementation roadmap."},
  {code:"MER-HBU",type:"Highest & Best Use Advisory",pages:"10–20",sections:[1,2,3,4,5,7,8],tag:"Technical",
   desc:"Four-test HBU determination: legally permissible, physically possible, financially feasible, maximally productive. AI-assisted analysis in 7.1 and 7.2 requires licensed planner/legal review."},
  {code:"MER-DEV",type:"Development Feasibility Opinion",pages:"20–40",sections:[1,2,3,4,5,6,7,8],tag:"Comprehensive",
   desc:"Full eight-section development feasibility. Includes NPV/IRR modelling, HBU determination, risk register, and phased implementation roadmap. Highest scope of all MER types."},
  {code:"MER-INV",type:"Investment Advisory Memo",pages:"8–15",sections:[1,2,4,5,6,8],tag:"Executive",
   desc:"Executive-format investment memo. Financial analysis, returns (NPV/IRR), risk register, and implementation roadmap. Designed for investment committee or board-level presentation."},
  {code:"MER-POS",type:"Asset Repositioning Strategy",pages:"12–25",sections:[1,2,3,5,7,8],tag:"Strategic",
   desc:"Repositioning-focused advisory. Market context, HBU-based repositioning options, findings and strategic alternatives considered. Excludes financial modelling section."},
  {code:"MER-PORT",type:"Portfolio Advisory",pages:"20–50",sections:[1,2,4,5,6,8],tag:"Multi-Asset",
   desc:"Multi-asset portfolio advisory. Financial analysis and implementation roadmap across asset classes. Excludes site-specific HBU and individual market sections — aggregate analysis only."},
  {code:"MER-SITE",type:"Site Selection Assessment",pages:"10–20",sections:[1,2,3,4,5,8],tag:"Site-Level",
   desc:"Concise site assessment. Primary market area, supply/demand analysis, indicative financial assessment, and findings with site-selection recommendation. Focused, practical scope."},
];

const GUARDRAILS=[
  {code:"G-SCOPE-01",domain:"Scope",  sev:"Critical",title:"Consultancy vs. Certified Valuation"},
  {code:"G-SCOPE-02",domain:"Scope",  sev:"High",   title:"Engagement Scope Creep"},
  {code:"G-SCOPE-03",domain:"Scope",  sev:"High",   title:"Asset Class Competence"},
  {code:"G-EVID-01", domain:"Evidence",sev:"Critical",title:"Source Attribution"},
  {code:"G-EVID-02", domain:"Evidence",sev:"High",   title:"Transaction Comparables"},
  {code:"G-EVID-03", domain:"Evidence",sev:"Critical",title:"Forward-Looking Statements"},
  {code:"G-EVID-04", domain:"Evidence",sev:"High",   title:"Site Visit Requirement"},
  {code:"G-EVID-05", domain:"Evidence",sev:"Medium", title:"Data Currency"},
  {code:"G-AI-01",   domain:"AI Use",  sev:"Critical",title:"AI Disclosure (Non-Negotiable)"},
  {code:"G-AI-02",   domain:"AI Use",  sev:"Critical",title:"AI Limitation Zones"},
  {code:"G-AI-03",   domain:"AI Use",  sev:"High",   title:"No Black-Box Outputs"},
  {code:"G-AI-04",   domain:"AI Use",  sev:"Medium", title:"Historical Bias Alert"},
  {code:"G-AI-05",   domain:"AI Use",  sev:"Critical",title:"No AI Value Opinions"},
  {code:"G-DISC-01", domain:"Disclosure",sev:"Critical",title:"Conflict of Interest"},
  {code:"G-DISC-02", domain:"Disclosure",sev:"High",  title:"Reliance Limitation"},
  {code:"G-DISC-03", domain:"Disclosure",sev:"High",  title:"Regulatory Compliance (MY)"},
  {code:"G-DISC-04", domain:"Disclosure",sev:"Medium",title:"ESG and Climate Risk"},
  {code:"G-PROC-01", domain:"Process",  sev:"Critical",title:"Dual Sign-Off"},
  {code:"G-PROC-02", domain:"Process",  sev:"Medium", title:"Version Control"},
  {code:"G-PROC-03", domain:"Process",  sev:"High",   title:"Retention (7 years)"},
  {code:"G-PROC-04", domain:"Process",  sev:"Medium", title:"Client Instruction Changes"},
  {code:"G-PROC-05", domain:"Process",  sev:"High",   title:"Escalation Triggers"},
];

const LP_SECTIONS=[
  {id:"lp-s0",num:"S00",label:"ACCESS"},
  {id:"lp-s1",num:"S01",label:"REPORT SUITE"},
  {id:"lp-s2",num:"S02",label:"GUARDRAILS"},
  {id:"lp-s3",num:"S03",label:"METHODOLOGY"},
  {id:"lp-s4",num:"S04",label:"DEPLOY"},
];

const REPORT_SECTIONS=[
  {n:1,title:"Engagement Header",     cond:false,desc:"Client, engagement ref, subject, date, prepared-by, reviewed-by, classification, conflict statement, reliance limitation"},
  {n:2,title:"Executive Summary",     cond:false,desc:"Purpose (2–3 sentences), key findings (3–5 bullets, ≤25 words each), primary recommendation, decision-maker caveats"},
  {n:3,title:"Market Analysis",       cond:true, desc:"§3.1 PMA definition · §3.2 Supply analysis · §3.3 Demand analysis · §3.4 Competitive landscape · §3.5 Macro & regulatory"},
  {n:4,title:"Financial Analysis",    cond:true, desc:"§4.1 Revenue projections · §4.2 Cost build-up · §4.3 Returns (NPV/IRR/EM) · §4.4 Scenario analysis · §4.5 Assumptions register"},
  {n:5,title:"Findings & Recommendation",cond:false,desc:"§5.1 Evidence summary · §5.2 Risk register (≥5 risks, L×I scored) · §5.3 Go/No-Go verdict · §5.4 Alternatives considered"},
  {n:6,title:"Implementation Roadmap",cond:true, desc:"Phasing plan with milestones · Key dependencies & critical path · Stakeholder map · KPIs and success metrics"},
  {n:7,title:"HBU Determination",     cond:true, desc:"Test 1: Legally permissible · Test 2: Physically possible · Test 3: Financially feasible · Test 4: Maximally productive"},
  {n:8,title:"Disclaimers & Sign-Off",cond:false,desc:"Mandatory disclaimer block · Guardrail compliance checklist · Dual sign-off (Lead Consultant + Reviewing Advisor)"},
];

const G_CHECKS=[
  "G-01 Report type code assigned; section structure matches MER suite table",
  "G-02 Executive Summary findings each traceable to a body section",
  "G-03 All quantitative claims attributed to a named Tier 1 or Tier 2 source",
  "G-04 AI limitation flags reviewed by human consultant for §3.4, §3.5, §7.1, §7.2",
  "G-05 Risk Register contains ≥ 5 risks, each scored Likelihood × Impact (1–5)",
  "G-06 Mandatory Disclaimer Block (§8) present and fully populated",
  "G-07 No certified value language used anywhere in the report",
  "G-08 Financial projections carry forward-looking statement language",
  "G-09 Key Assumptions Register numbered and complete",
  "G-10 Report classified CONFIDENTIAL with correct client name and engagement ref",
  "G-11 Reviewed-by field populated — different person from Lead Consultant",
  "G-12 AI disclosure statement included in Section 8",
];
const G_HUMAN=[3,10];

const ROUTES=[
  {id:"landing",label:"Home",eyebrow:"Overview",desc:"Meridian Advisory OS and its operating model.",keys:"home overview advisory"},
  {id:"dashboard",label:"Report Library",eyebrow:"Build",desc:"Seven MAS-GUARD-001 compliant report families.",keys:"templates reports library mer"},
  {id:"framework",label:"Advisory Framework",eyebrow:"Learn",desc:"The strategic structure behind needs-based advisory.",keys:"framework strategy consultancy"},
  {id:"playbook",label:"Implementation Playbook",eyebrow:"Deliver",desc:"How to build, sell, price, and deliver the work.",keys:"playbook implementation delivery pricing"},
  {id:"standards",label:"Operating Standard",eyebrow:"Govern",desc:"Scope, evidence, AI, disclosure, and process rules.",keys:"standard guardrails compliance mas"},
  {id:"sample",label:"Sample Market Study",eyebrow:"Explore",desc:"Interactive sample of a completed advisory report.",keys:"sample report market study melaka"},
  {id:"checker",label:"Guardrail Checker",eyebrow:"Tool",desc:"Complete and retain the 12-point release checklist.",keys:"tool checklist compliance guardrail"},
  {id:"risk",label:"Risk Register",eyebrow:"Tool",desc:"Build, score, and export an engagement risk register.",keys:"tool risk register score"},
  {id:"fee",label:"Fee Calculator",eyebrow:"Tool",desc:"Indicative engagement fee range by report type and scope.",keys:"tool fee calculator pricing estimate"},
  {id:"assumptions",label:"Assumptions Register",eyebrow:"Tool",desc:"Build and export the numbered key assumptions register (G-09).",keys:"tool assumptions register a01 a02"},
];

// ── NEW DATA CONSTANTS ────────────────────────────────────────────────────────
const G_CHECK_GROUPS=[
  {label:"Report Structure",color:NAVY,indices:[0,1]},
  {label:"Evidence & Sources",color:GOLD,indices:[2,3]},
  {label:"Risk & Compliance",color:AMBER,indices:[4,5,6,7,8]},
  {label:"Process & Sign-Off",color:UP,indices:[9,10,11]},
];

const RISK_PRESETS=[
  {name:"Planning / regulatory approval delay",l:3,i:4,category:"Legal/Regulatory",notes:""},
  {name:"Construction cost overrun",l:3,i:4,category:"Construction",notes:""},
  {name:"Market absorption below forecast",l:3,i:4,category:"Market",notes:""},
  {name:"Interest rate (OPR) increase",l:2,i:4,category:"Financial",notes:""},
  {name:"Key competitor new launch in micro-market",l:3,i:3,category:"Market",notes:""},
  {name:"Land acquisition above budget threshold",l:3,i:5,category:"Financial",notes:""},
  {name:"Regulatory/compliance change (Act 242)",l:2,i:5,category:"Legal/Regulatory",notes:""},
];
const RISK_CATEGORIES=["Market","Financial","Legal/Regulatory","Construction","Environmental","Operational","Other"];

const FEE_BASE={
  "MER-SITE":[8000,15000],"MER-MKT":[15000,30000],"MER-HBU":[12000,22000],
  "MER-DEV":[25000,50000],"MER-INV":[10000,18000],"MER-POS":[18000,35000],"MER-PORT":[30000,80000],
};
const FEE_SCOPE_MULT={standard:1,enhanced:1.35,premium:1.7};
const FEE_ADDON_PCT={digital:.15,strategy:.20,rush:.25};
const FEE_ADDON_LABELS={digital:"Digital Intelligence Hub",strategy:"90-min Strategy Session",rush:"Rush Delivery (50% faster)"};

function downloadText(filename,text,type="text/plain"){
  const blob=new Blob([text],{type:`${type};charset=utf-8`});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),500);
}

function usePersistentState(key,initial){
  const[value,setValue]=useState(()=>{
    try{
      const saved=window.localStorage.getItem(key);
      return saved===null?(typeof initial==="function"?initial():initial):JSON.parse(saved);
    }catch{return typeof initial==="function"?initial():initial;}
  });
  useEffect(()=>{
    try{window.localStorage.setItem(key,JSON.stringify(value));}catch{}
  },[key,value]);
  return[value,setValue];
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
@keyframes bootFadeOut{0%{opacity:1;visibility:visible}100%{opacity:0;visibility:hidden}}
@keyframes bootReveal{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes dotPulse{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes hintFloat{0%,100%{transform:translateX(-50%) translateY(0px)}50%{transform:translateX(-50%) translateY(5px)}}
body{margin:0;font-family:'Inter',sans-serif;color:${INK};background:${BG};-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:${SURFACE_S}}
::-webkit-scrollbar-thumb{background:${BORDER};border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:rgba(168,121,40,.45)}
.card,.mer-card{transition:box-shadow .25s,transform .25s}
.card:hover,.mer-card:hover{box-shadow:0 8px 30px rgba(26,33,48,.1);transform:translateY(-2px)}
.lp-card{transition:box-shadow .25s,border-color .25s,transform .25s;cursor:default}
.lp-card:hover{box-shadow:0 8px 30px rgba(26,33,48,.1);border-color:${GOLD}!important;transform:translateY(-2px)}
.lp-card:hover .lp-num{color:${GOLD_B}!important}
.gr-row{transition:background .15s;cursor:pointer}
.gr-row:hover{background:${GOLD_DIM}!important}
.btn-primary{transition:background .15s;cursor:pointer}
.btn-primary:hover{background:${NAVY_L}!important}
.btn-outline{transition:border-color .15s,color .15s;cursor:pointer}
.btn-outline:hover{border-color:${GOLD}!important;color:${GOLD}!important}
input:focus{outline:none;border-color:${NAVY}!important;box-shadow:0 0 0 3px ${NAVY_DIM}!important}
input::placeholder{color:${INK_F}}
.lp-fit{height:calc(100vh - 60px);max-height:calc(100vh - 60px);display:flex;flex-direction:column;overflow:hidden}
#lp-s0{height:calc(100vh - 60px);max-height:calc(100vh - 60px)}
.lp-fit>section{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;justify-content:flex-start;width:100%;box-sizing:border-box;padding:clamp(24px,3.5vh,52px) 0!important}
button,a,input,[role="button"]{font:inherit}
button:focus-visible,a:focus-visible,input:focus-visible,[role="button"]:focus-visible{outline:2px solid ${GOLD_B}!important;outline-offset:3px}
.skip-link{position:fixed;top:-60px;left:16px;z-index:12000;background:${NAVY};color:#fff;padding:10px 16px;border-radius:0 0 4px 4px;font-size:12px;font-weight:700;text-decoration:none;transition:top .2s}
.skip-link:focus{top:0}
.command-backdrop{position:fixed;inset:0;z-index:10000;background:rgba(15,25,40,.6);backdrop-filter:blur(8px);display:flex;align-items:flex-start;justify-content:center;padding:10vh 20px 20px;box-sizing:border-box}
.command-panel{width:min(680px,100%);max-height:78vh;overflow:hidden;background:${SURFACE};border:1px solid ${BORDER};border-radius:8px;box-shadow:0 24px 80px rgba(15,25,40,.28);display:flex;flex-direction:column}
.command-input{width:100%;box-sizing:border-box;border:0!important;border-bottom:1px solid ${BORDER}!important;padding:19px 20px;font-size:16px;color:${INK};background:${SURFACE}}
.command-list{overflow:auto;padding:8px}
.command-item{width:100%;border:0;background:transparent;text-align:left;padding:12px;border-radius:5px;display:flex;gap:14px;align-items:flex-start;cursor:pointer;color:${INK}}
.command-item:hover,.command-item.active{background:${NAVY_DIM}}
.command-kbd{font-family:'IBM Plex Mono',monospace;font-size:9px;padding:3px 6px;border:1px solid ${BORDER};border-radius:3px;color:${INK_M};background:${SURFACE_S}}
.launcher{position:fixed;right:22px;bottom:22px;z-index:8500;display:flex;align-items:center;gap:8px;background:${NAVY};color:#fff;border:1px solid rgba(255,255,255,.16);border-radius:30px;padding:10px 13px 10px 16px;box-shadow:0 10px 28px rgba(15,25,40,.22);cursor:pointer;font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase}
.launcher:hover{background:${NAVY_L}}
.route-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.route-card{border:1px solid ${BORDER};background:${SURFACE};border-radius:4px;padding:18px;text-align:left;cursor:pointer;transition:transform .2s,border-color .2s,box-shadow .2s}
.route-card:hover{transform:translateY(-2px);border-color:${GOLD};box-shadow:0 8px 24px rgba(26,33,48,.08)}
.tool-actions{display:flex;gap:8px;flex-wrap:wrap}
.mobile-risk-header{display:grid}
.page-loader{min-height:100vh;display:flex;align-items:center;justify-content:center;background:${BG};color:${INK_M};font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase}
@media(max-width:760px){
  .launcher{right:12px;bottom:12px;padding:11px;border-radius:50%;width:46px;height:46px;justify-content:center}
  .launcher-label,.launcher .command-kbd{display:none}
  .route-grid{grid-template-columns:1fr 1fr}
  .command-backdrop{padding:6vh 10px 10px}
  .mobile-risk-header{display:none!important}
  .risk-row{grid-template-columns:1fr 1fr!important;gap:12px!important}
  .risk-name{grid-column:1/-1}
  .risk-delete{position:absolute;right:12px;top:12px}
  .risk-row{position:relative;padding:16px!important}
  .report-grid{grid-template-columns:1fr!important;padding:24px 14px!important}
}
@media(max-width:520px){.route-grid{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
@media print{
  .launcher,.command-backdrop,nav,.skip-link,.no-print{display:none!important}
  body{background:#fff!important}
  @page{margin:16mm}
}
@keyframes pageFade{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}
.page-fade{animation:pageFade .4s cubic-bezier(.22,1,.36,1) both}
.back-to-top{position:fixed;right:22px;bottom:86px;z-index:8400;width:40px;height:40px;
  border-radius:50%;background:${SURFACE};border:1px solid ${BORDER};
  display:flex;align-items:center;justify-content:center;cursor:pointer;
  box-shadow:0 4px 16px rgba(26,33,48,.1);transition:opacity .25s,transform .25s,box-shadow .25s}
.back-to-top:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(26,33,48,.15)}
.kbd-backdrop{position:fixed;inset:0;z-index:10200;background:rgba(15,25,40,.6);
  backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box}
.kbd-panel{background:${SURFACE};border:1px solid ${BORDER};border-radius:6px;
  width:min(560px,100%);max-height:85vh;overflow:auto;
  box-shadow:0 24px 80px rgba(15,25,40,.28)}
.mob-menu-backdrop{position:fixed;inset:0;z-index:250;background:rgba(15,25,40,.45);backdrop-filter:blur(4px)}
.mob-menu{position:fixed;top:60px;left:0;right:0;z-index:260;
  background:${SURFACE};border-bottom:1px solid ${BORDER};
  padding:16px 20px;animation:slideUp .22s ease both;
  box-shadow:0 8px 24px rgba(26,33,48,.12)}
.hm-cell{height:44px;border-radius:3px;display:flex;align-items:center;
  justify-content:center;font-size:9px;font-weight:700;cursor:default;
  transition:transform .15s,box-shadow .15s;flex-direction:column;gap:2px}
.hm-cell:hover{transform:scale(1.06);box-shadow:0 4px 12px rgba(26,33,48,.12)}
.notes-area{width:100%;box-sizing:border-box;resize:vertical;min-height:60px;
  font-family:'Inter',sans-serif;font-size:12px;color:${INK_S};
  background:${SURFACE_S};border:1px solid ${BORDER_L};border-radius:2px;
  padding:8px 10px;line-height:1.5;transition:border-color .15s}
.notes-area:focus{outline:none;border-color:${NAVY}!important;box-shadow:0 0 0 3px ${NAVY_DIM}!important}
.fav-btn{background:none;border:none;cursor:pointer;padding:4px;display:flex;align-items:center;
  justify-content:center;transition:transform .15s;border-radius:50%}
.fav-btn:hover{transform:scale(1.2)}
.tag-select{fontFamily:'Inter',sans-serif;font-size:11px;background:${SURFACE};
  border:1px solid ${BORDER};color:${INK_S};border-radius:2px;
  padding:3px 6px;cursor:pointer}
@media(max-width:768px){
  .mob-hamburger{display:flex!important}
  .nav-back-btn{display:none!important}
}
@media(min-width:769px){.mob-hamburger{display:none!important}}
*::selection{background:rgba(168,121,40,.2);color:${INK}}
.mer-nav{box-shadow:0 1px 0 rgba(168,121,40,.1),0 2px 14px rgba(26,33,48,.06)}
.mer-stat{transition:box-shadow .25s,transform .25s;cursor:default}
.mer-stat:hover{box-shadow:0 8px 24px rgba(26,33,48,.1);transform:translateY(-3px)}
.mer-fee-output{transition:box-shadow .3s}
.mer-fee-output:hover{box-shadow:0 14px 44px rgba(27,51,86,.3)}
.launcher:hover{background:${NAVY_L};box-shadow:0 8px 24px rgba(27,51,86,.25)!important}
`;

// ── HELPERS ───────────────────────────────────────────────────────────────────
function useInView(t=.05){
  const r=useRef(null),[v,sv]=useState(false);
  useEffect(()=>{
    if(!r.current)return;
    const o=new IntersectionObserver(([e])=>{if(e.isIntersecting)sv(true);},{threshold:t});
    o.observe(r.current);return()=>o.disconnect();
  },[]);
  return[r,v];
}
function useWide(bp=960){
  const[w,sw]=useState(()=>window.innerWidth>=bp);
  useEffect(()=>{
    const fn=()=>sw(window.innerWidth>=bp);
    window.addEventListener("resize",fn,{passive:true});
    return()=>window.removeEventListener("resize",fn);
  },[bp]);
  return w;
}

function useScrollY(){
  const[y,sy]=useState(0);
  useEffect(()=>{
    const fn=()=>sy(window.scrollY);
    window.addEventListener("scroll",fn,{passive:true});
    return()=>window.removeEventListener("scroll",fn);
  },[]);
  return y;
}

function useCountUp(target,dur=750){
  const[val,setVal]=useState(0);
  useEffect(()=>{
    const n=parseInt(target,10);
    if(isNaN(n))return;
    const start=Date.now();
    const tick=()=>{
      const p=Math.min((Date.now()-start)/dur,1);
      const ease=1-Math.pow(1-p,3);
      setVal(Math.round(n*ease));
      if(p<1)requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },[target,dur]);
  return val;
}
function StatNum({v}){
  const n=parseInt(v,10);
  const c=useCountUp(isNaN(n)?0:n,720);
  return<>{isNaN(n)?v:String(c).padStart(String(n).length,"0")}</>;
}
function getMorphBlocks(s){return s?Array.from(s.querySelectorAll("[data-morph]")).slice(0,12):[]}
function clearMorph(el){el.style.transition=el.style.transform=el.style.opacity=el.style.willChange="";}

// ── SECTION LABEL ─────────────────────────────────────────────────────────────
function SectionLabel({num,label}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:28}}>
      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:GOLD,fontWeight:700,letterSpacing:"1.5px"}}>{num}</span>
      <span style={{width:20,height:1,background:GOLD,opacity:.6,display:"inline-block"}}/>
      <span style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_M,fontWeight:600,letterSpacing:"2.5px",textTransform:"uppercase"}}>{label}</span>
    </div>
  );
}

// ── SEV PILL ──────────────────────────────────────────────────────────────────
function SevPill({sev}){
  const map={
    "Critical":{bg:"rgba(176,57,45,.07)",bd:"rgba(176,57,45,.2)",tx:DOWN},
    "High":    {bg:GOLD_DIM,            bd:"rgba(168,121,40,.2)",tx:GOLD},
    "Medium":  {bg:"rgba(154,107,24,.06)",bd:"rgba(154,107,24,.18)",tx:AMBER},
  };
  const s=map[sev]||map["Medium"];
  return(
    <span style={{fontSize:10.5,fontWeight:600,padding:"3px 10px",borderRadius:2,
      border:`1px solid ${s.bd}`,background:s.bg,color:s.tx,whiteSpace:"nowrap"}}>
      {sev}
    </span>
  );
}

// ── BOOT SCREEN ───────────────────────────────────────────────────────────────
function Boot({onDone}){
  const[leaving,setLeaving]=useState(false),[pct,setPct]=useState(0);
  const finRef=useRef(false),rafRef=useRef(0),tgtRef=useRef(0);
  const finish=useCallback(()=>{
    if(finRef.current)return;finRef.current=true;
    tgtRef.current=100;setLeaving(true);setTimeout(onDone,620);
  },[onDone]);
  useEffect(()=>{
    const start=Date.now();
    const tick=()=>{
      const elapsed=Date.now()-start;
      if(!finRef.current){
        const natural=Math.min(elapsed/2200,1)*92;
        tgtRef.current=natural;
      }
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(rafRef.current);
  },[]);
  useEffect(()=>{
    const lerp=()=>{
      setPct(p=>{const t=tgtRef.current,np=p+(t-p)*.1;return Math.abs(t-np)<.3?t:np;});
      rafRef.current=requestAnimationFrame(lerp);
    };
    const id=requestAnimationFrame(lerp);return()=>cancelAnimationFrame(id);
  },[]);
  useEffect(()=>{
    const t=setTimeout(finish,2500);
    return()=>clearTimeout(t);
  },[finish]);
  useEffect(()=>{
    const k=()=>finish();
    window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k);
  },[finish]);
  const delay=(n)=>({animation:`bootReveal .5s ease ${n*0.1}s both`});
  return(
    <div onClick={finish} style={{position:"fixed",inset:0,zIndex:9000,background:SURFACE,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      cursor:"pointer",gap:0,
      animation:leaving?"bootFadeOut .6s ease forwards":"none"}}>
      <div style={{...delay(0),display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:NAVY,
          boxShadow:"0 8px 32px rgba(27,51,86,.2)",
          display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,color:"#fff",fontWeight:700,lineHeight:1}}>M</span>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:700,letterSpacing:"4px",color:INK,textTransform:"uppercase",marginBottom:6}}>MERIDIAN RE ADVISORY</div>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_M}}>Consultancy Platform · MAS-GUARD-001 v1.0</div>
        </div>
        <div style={{width:"100%",maxWidth:280,height:2,background:BORDER_L,borderRadius:1,overflow:"hidden",marginTop:4}}>
          <div style={{height:"100%",background:GOLD,width:`${pct}%`,transition:"width .12s ease",borderRadius:1}}/>
        </div>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:INK_F,letterSpacing:"0.5px"}}>Click or press any key to continue</div>
      </div>
    </div>
  );
}

// ── NAV ───────────────────────────────────────────────────────────────────────
function Nav({page,onBack,onNavigate,onOpenCommand}){
  const[mobOpen,setMobOpen]=useState(false);
  const pathLabel=page==="dashboard"?"/ report-library":page==="checker"?"/ guardrail-checker":page==="risk"?"/ risk-scorer":page==="fee"?"/ fee-calculator":page==="assumptions"?"/ assumptions-register":"";
  const navPages=ROUTES.filter(r=>!["landing"].includes(r.id));
  return(
    <>
      <nav className="mer-nav" style={{position:"fixed",top:0,left:0,right:0,height:60,zIndex:300,
        background:"rgba(250,249,246,.97)",backdropFilter:"blur(14px)",
        WebkitBackdropFilter:"blur(14px)",borderBottom:`1px solid ${BORDER}`,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"0 28px",boxSizing:"border-box"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:NAVY,
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer"}}
            onClick={()=>onNavigate&&onNavigate("landing")}>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"#fff",fontWeight:700,lineHeight:1}}>M</span>
          </div>
          <div>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:INK,lineHeight:1.2}}>
              <span style={{fontWeight:700}}>MERIDIAN</span>
              <span style={{color:INK_M,fontWeight:400}}> RE ADVISORY</span>
            </div>
            {pathLabel&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:INK_M,lineHeight:1,marginTop:2}}>{pathLabel}</div>}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {page!=="landing"&&(
            <button onClick={onBack} className="btn-outline nav-back-btn"
              style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:INK_S,
                border:`1px solid ${BORDER}`,background:"transparent",
                padding:"7px 14px",borderRadius:2,cursor:"pointer",letterSpacing:".3px"}}>
              {page==="dashboard"?"← Home":"← Library"}
            </button>
          )}
          <button className="mob-hamburger" onClick={()=>setMobOpen(v=>!v)}
            aria-label="Toggle menu"
            style={{width:36,height:36,border:`1px solid ${BORDER}`,background:"transparent",
              borderRadius:2,cursor:"pointer",display:"flex",flexDirection:"column",
              alignItems:"center",justifyContent:"center",gap:4,padding:0}}>
            {[0,1,2].map(i=>(
              <span key={i} style={{width:16,height:1.5,background:INK,borderRadius:1,
                transition:"all .2s",
                transform:mobOpen&&i===0?"rotate(45deg) translate(4px,4px)":
                          mobOpen&&i===1?"scaleX(0)":
                          mobOpen&&i===2?"rotate(-45deg) translate(4px,-4px)":"none",
                opacity:mobOpen&&i===1?0:1}}/>
            ))}
          </button>
        </div>
      </nav>
      {mobOpen&&(
        <>
          <div className="mob-menu-backdrop" onClick={()=>setMobOpen(false)}/>
          <div className="mob-menu no-print">
            {navPages.map(r=>(
              <button key={r.id} onClick={()=>{onNavigate&&onNavigate(r.id);setMobOpen(false);}}
                style={{display:"flex",alignItems:"center",gap:10,width:"100%",
                  background:"transparent",border:"none",padding:"11px 8px",
                  borderRadius:2,cursor:"pointer",textAlign:"left",
                  borderBottom:`1px solid ${BORDER_L}`}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:GOLD,
                  minWidth:56,textTransform:"uppercase",letterSpacing:"1px"}}>{r.eyebrow}</span>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:600,color:INK}}>{r.label}</span>
                {r.id===page&&<span style={{marginLeft:"auto",fontFamily:"'IBM Plex Mono',monospace",
                  fontSize:9,color:UP}}>CURRENT</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function Toast({msg,onClose}){
  return(
    <div style={{position:"fixed",bottom:28,right:28,zIndex:9999,
      background:SURFACE,border:`1px solid ${BORDER}`,padding:"16px 20px",
      boxShadow:"0 8px 40px rgba(26,33,48,.15)",borderRadius:3,
      animation:"toastIn .3s ease both",minWidth:260}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:UP,marginTop:4,flexShrink:0}}/>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,color:INK,letterSpacing:"1px",textTransform:"uppercase",marginBottom:4}}>Template Ready</div>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:INK_S}}>{msg}</div>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",color:INK_M,cursor:"pointer",fontSize:16,lineHeight:1,padding:0,marginTop:-2}}>×</button>
      </div>
    </div>
  );
}

// ── BACK TO TOP ───────────────────────────────────────────────────────────────
function BackToTop(){
  const y=useScrollY();
  if(y<400)return null;
  return(
    <button className="back-to-top no-print"
      onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}
      aria-label="Back to top">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke={NAVY} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

// ── KEYBOARD HELP ─────────────────────────────────────────────────────────────
function KeyboardHelp({onClose}){
  useEffect(()=>{
    const fn=e=>{if(e.key==="Escape")onClose();};
    window.addEventListener("keydown",fn);
    return()=>window.removeEventListener("keydown",fn);
  },[onClose]);
  const shortcuts=[
    {keys:"⌘ / Ctrl + K",desc:"Open command center"},
    {keys:"SPACE",desc:"Next section (landing page)"},
    {keys:"⇧ SPACE",desc:"Previous section"},
    {keys:"?",desc:"Show keyboard shortcuts"},
    {keys:"ESC",desc:"Close modals & overlays"},
    {keys:"↑ ↓",desc:"Navigate command center"},
    {keys:"ENTER",desc:"Open selected result"},
    {keys:"↵ in risk input",desc:"Add risk item"},
  ];
  return(
    <div className="kbd-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="kbd-panel">
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${BORDER}`,
          display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,
            color:INK,letterSpacing:"1.5px",textTransform:"uppercase"}}>Keyboard Shortcuts</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:INK_M,
            cursor:"pointer",fontSize:18,lineHeight:1,padding:2}}>×</button>
        </div>
        <div style={{padding:"8px 20px 16px"}}>
          {shortcuts.map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"10px 0",borderBottom:i<shortcuts.length-1?`1px solid ${BORDER_L}`:"none"}}>
              <span style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:INK_S}}>{s.desc}</span>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,
                background:SURFACE_S,border:`1px solid ${BORDER}`,padding:"4px 8px",
                borderRadius:3,color:INK_M,whiteSpace:"nowrap",marginLeft:16}}>{s.keys}</span>
            </div>
          ))}
        </div>
        <div style={{padding:"10px 20px",borderTop:`1px solid ${BORDER}`,
          textAlign:"center",fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_F}}>
          Press <kbd style={{fontFamily:"'IBM Plex Mono',monospace",background:SURFACE_S,
            border:`1px solid ${BORDER}`,padding:"2px 6px",borderRadius:2,fontSize:10}}>ESC</kbd> to close
        </div>
      </div>
    </div>
  );
}

// ── HOLD BAR ──────────────────────────────────────────────────────────────────
function CommandCenter({open,onClose,onNavigate,current}){
  const[query,setQuery]=useState("");
  const[active,setActive]=useState(0);
  const inputRef=useRef(null);
  const results=ROUTES.filter(r=>
    `${r.label} ${r.eyebrow} ${r.desc} ${r.keys}`.toLowerCase().includes(query.trim().toLowerCase())
  );
  useEffect(()=>{
    if(!open)return;
    setQuery("");setActive(0);
    const t=setTimeout(()=>inputRef.current?.focus(),30);
    return()=>clearTimeout(t);
  },[open]);
  useEffect(()=>setActive(0),[query]);
  useEffect(()=>{
    if(!open)return;
    const onKey=e=>{
      if(e.key==="Escape")onClose();
      if(e.key==="ArrowDown"){e.preventDefault();setActive(v=>Math.min(v+1,results.length-1));}
      if(e.key==="ArrowUp"){e.preventDefault();setActive(v=>Math.max(v-1,0));}
      if(e.key==="Enter"&&results[active]){e.preventDefault();onNavigate(results[active].id);onClose();}
    };
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[open,results,active,onClose,onNavigate]);
  if(!open)return null;
  return(
    <div className="command-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="command-panel" role="dialog" aria-modal="true" aria-label="Explore Meridian">
        <input ref={inputRef} className="command-input" value={query}
          onChange={e=>setQuery(e.target.value)} placeholder="Search pages, tools, and reports..."
          aria-label="Search pages and tools"/>
        <div className="command-list" role="listbox">
          {results.map((r,i)=>(
            <button key={r.id} className={`command-item${i===active?" active":""}`}
              role="option" aria-selected={i===active} onMouseEnter={()=>setActive(i)}
              onClick={()=>{onNavigate(r.id);onClose();}}>
              <span style={{width:74,fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:GOLD,
                textTransform:"uppercase",letterSpacing:"1px",paddingTop:3,flexShrink:0}}>{r.eyebrow}</span>
              <span style={{flex:1}}>
                <span style={{display:"block",fontSize:13,fontWeight:700,color:INK,marginBottom:3}}>
                  {r.label}{r.id===current&&<span style={{color:UP,fontSize:10,marginLeft:8}}>CURRENT</span>}
                </span>
                <span style={{display:"block",fontSize:11.5,color:INK_S,lineHeight:1.5}}>{r.desc}</span>
              </span>
              <span style={{color:INK_F,fontSize:16}} aria-hidden="true">→</span>
            </button>
          ))}
          {results.length===0&&(
            <div style={{padding:"28px 16px",textAlign:"center",fontSize:13,color:INK_M}}>
              No matching destination. Try "risk", "sample", or "standard".
            </div>
          )}
        </div>
        <div style={{borderTop:`1px solid ${BORDER}`,padding:"9px 12px",display:"flex",gap:12,
          fontSize:10,color:INK_M,alignItems:"center"}}>
          <span><span className="command-kbd">↑↓</span> navigate</span>
          <span><span className="command-kbd">ENTER</span> open</span>
          <span><span className="command-kbd">ESC</span> close</span>
        </div>
      </div>
    </div>
  );
}

function GlobalLauncher({onOpen}){
  return(
    <button className="launcher no-print" onClick={onOpen} aria-label="Explore Meridian pages and tools">
      <span className="launcher-label">Explore Meridian</span>
      <span aria-hidden="true">⌘</span>
      <span className="command-kbd" style={{background:"rgba(255,255,255,.1)",borderColor:"rgba(255,255,255,.25)",color:"#fff"}}>K</span>
    </button>
  );
}

function HoldBar({onComplete,label="Access the report library",width=520,inverted=false}){
  const[pct,setPct]=useState(0),[holding,setHolding]=useState(false);
  const rafRef=useRef(0),startRef=useRef(0),holdDur=2000;
  const startHold=useCallback(()=>{
    setHolding(true);startRef.current=Date.now();
    const tick=()=>{
      const elapsed=Date.now()-startRef.current;
      const p=Math.min(elapsed/holdDur*100,100);
      setPct(p);
      if(p<100)rafRef.current=requestAnimationFrame(tick);
      else onComplete();
    };
    rafRef.current=requestAnimationFrame(tick);
  },[onComplete]);
  const stopHold=useCallback(()=>{
    setHolding(false);cancelAnimationFrame(rafRef.current);setPct(0);
  },[]);
  useEffect(()=>()=>cancelAnimationFrame(rafRef.current),[]);

  const borderColor=inverted?"rgba(255,255,255,.35)":NAVY;
  const fillColor=inverted?SURFACE:NAVY;
  const textColor=inverted?SURFACE:INK;
  const textColorFill=inverted?NAVY:SURFACE;

  return(
    <div onMouseDown={startHold} onMouseUp={stopHold} onMouseLeave={stopHold}
      onTouchStart={startHold} onTouchEnd={stopHold}
      style={{position:"relative",width:"100%",maxWidth:width,height:48,
        background:inverted?"rgba(255,255,255,.08)":SURFACE,
        border:`1.5px solid ${borderColor}`,borderRadius:2,cursor:"pointer",
        overflow:"hidden",userSelect:"none",
        boxShadow:holding?"0 4px 20px rgba(27,51,86,.15)":"none",
        transition:"box-shadow .2s"}}>
      <div style={{position:"absolute",top:0,left:0,height:"100%",width:`${pct}%`,
        background:fillColor,transition:holding?"none":"width .15s ease",zIndex:1}}/>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
        justifyContent:"space-between",padding:"0 18px",zIndex:2}}>
        <span style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:600,
          letterSpacing:"2px",textTransform:"uppercase",color:textColor}}>{label}</span>
        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:textColor,opacity:.6}}>
          {pct>1?`${Math.round(pct)}%`:"PRESS & HOLD →"}
        </span>
      </div>
      {pct>0&&(
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
          justifyContent:"space-between",padding:"0 18px",zIndex:3,
          clipPath:`inset(0 ${100-pct}% 0 0)`}}>
          <span style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:600,
            letterSpacing:"2px",textTransform:"uppercase",color:textColorFill}}>{label}</span>
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:textColorFill}}>
            {pct>1?`${Math.round(pct)}%`:"PRESS & HOLD →"}
          </span>
        </div>
      )}
    </div>
  );
}

// ── HERO SECTION (S00) ────────────────────────────────────────────────────────
function HeroSection({onEnter}){
  const wide=useWide(900);
  const heroGuardrails=GUARDRAILS.slice(0,7);
  return(
    <section id="lp-s0" style={{background:BG,borderBottom:`1px solid ${BORDER}`,
      display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
      <div style={{maxWidth:1400,width:"100%",margin:"0 auto",
        padding:`0 clamp(24px,4vw,52px)`,
        display:"grid",gridTemplateColumns:wide?"1fr 1fr":"1fr",gap:wide?60:40,
        alignItems:"center"}}>
        <div style={{display:"flex",flexDirection:"column",gap:0}}>
          <div data-morph style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:UP,animation:"dotPulse 2s ease-in-out infinite"}}/>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:GOLD,fontWeight:600,letterSpacing:"0.5px"}}>MER.ADV.MY · MAS-GUARD-001</span>
          </div>
          <h1 data-morph style={{fontFamily:"'Cormorant Garamond',serif",
            fontSize:"clamp(44px,5.2vw,72px)",fontWeight:700,lineHeight:.96,
            color:INK,margin:"0 0 24px",letterSpacing:"-1px"}}>
            Real Estate<br/>Advisory,<br/><span style={{color:NAVY}}>institutionalised</span>
            <span style={{display:"inline-block",width:10,height:10,borderRadius:"50%",
              background:GOLD,marginLeft:6,verticalAlign:"middle",transform:"translateY(-2px)"}}/>
          </h1>
          <p data-morph style={{fontFamily:"'Inter',sans-serif",fontSize:15,color:INK_S,
            lineHeight:1.7,maxWidth:480,margin:"0 0 32px"}}>
            A structured consultancy framework for Malaysian real estate advisory. Seven report families, 22 guardrails, five compliance domains — built for institutional-grade outputs.
          </p>
          <div data-morph style={{marginBottom:10}}>
            <HoldBar onComplete={onEnter} label="Access the platform" width={460}/>
          </div>
          <p data-morph style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_M,margin:"8px 0 32px"}}>Press and hold to enter the platform</p>
          <div data-morph style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0,
            borderTop:`1px solid ${BORDER}`,paddingTop:24}}>
            {[["07","Report Families"],["22","Guardrails"],["05","Domains"],["MY","Region"]].map(([v,l],i)=>(
              <div key={i} style={{padding:"0 16px 0 0",borderRight:i<3?`1px solid ${BORDER}`:"none",
                paddingRight:i<3?16:0,paddingLeft:i>0?16:0}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:700,color:INK,lineHeight:1}}><StatNum v={v}/></div>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:INK_M,textTransform:"uppercase",letterSpacing:"1.5px",marginTop:4}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        {wide&&(
          <div data-morph>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:INK_M}}>Guardrail Matrix — Excerpt</span>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,color:GOLD}}>MAS-GUARD-001</span>
            </div>
            <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,
              boxShadow:"0 4px 20px rgba(26,33,48,.06)",overflow:"hidden"}}>
              {heroGuardrails.map((g,i)=>(
                <div key={g.code} style={{display:"flex",alignItems:"center",gap:12,
                  padding:"10px 16px",
                  background:i%2===0?"transparent":SURFACE_S,
                  borderBottom:i<heroGuardrails.length-1?`1px solid ${BORDER_L}`:"none"}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,color:NAVY,minWidth:96,flexShrink:0}}>{g.code}</span>
                  <span style={{fontFamily:"'Inter',sans-serif",fontSize:12.5,color:INK_S,flex:1}}>{g.title}</span>
                  <SevPill sev={g.sev}/>
                </div>
              ))}
              <div style={{padding:"12px 16px",borderTop:`1px solid ${BORDER_L}`,textAlign:"center"}}>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:GOLD,fontWeight:600}}>+ 15 more guardrails · Press SPACE to continue</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ── REPORT SUITE SECTION (S01) ────────────────────────────────────────────────
function ReportSuiteSection(){
  return(
    <section style={{background:SURFACE_S,borderBottom:`1px solid ${BORDER}`,display:"flex",
      alignItems:"flex-start",justifyContent:"center",width:"100%",boxSizing:"border-box"}}>
      <div style={{maxWidth:1400,width:"100%",padding:"0 40px",boxSizing:"border-box"}}>
        <SectionLabel num="S01" label="The Seven Report Families"/>
        <h2 data-morph style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(30px,4vw,50px)",
          fontWeight:700,color:INK,margin:"0 0 12px",lineHeight:1.1}}>
          The Seven Report Families
        </h2>
        <p data-morph style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,color:INK_S,margin:"0 0 28px",maxWidth:620,lineHeight:1.6}}>
          Every engagement is classified into one of seven MER report types. Each type carries a defined section structure, scope boundary, and guardrail checklist.
        </p>
        <div data-morph style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
          {MER_TYPES.map((t)=>(
            <div key={t.code} className="lp-card"
              style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,padding:"18px 22px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10.5,color:NAVY,
                  background:NAVY_DIM,border:"1px solid rgba(27,51,86,.15)",
                  padding:"3px 8px",borderRadius:2}}>{t.code}</span>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:INK_M,
                  border:`1px solid ${BORDER}`,padding:"3px 8px",borderRadius:2}}>{t.tag}</span>
              </div>
              <div className="lp-num" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,
                fontWeight:700,color:INK,margin:"8px 0 4px",transition:"color .2s"}}>{t.type}</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,color:INK_M,marginBottom:10}}>{t.pages} pages</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {[1,2,3,4,5,6,7,8].map(n=>{
                  const inc=t.sections.includes(n);
                  return(
                    <div key={n} style={{width:24,height:24,display:"flex",alignItems:"center",
                      justifyContent:"center",fontSize:9.5,fontWeight:600,borderRadius:2,
                      border:`1px solid ${inc?"rgba(168,121,40,.3)":BORDER_L}`,
                      background:inc?GOLD_DIM:"transparent",
                      color:inc?GOLD_B:INK_F}}>§{n}</div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── GUARDRAIL SECTION (S02) ───────────────────────────────────────────────────
function GuardrailSection(){
  const domainCounts={};
  GUARDRAILS.forEach(g=>{domainCounts[g.domain]=(domainCounts[g.domain]||0)+1;});
  return(
    <section style={{background:BG,borderBottom:`1px solid ${BORDER}`,display:"flex",
      alignItems:"flex-start",justifyContent:"center",width:"100%",boxSizing:"border-box"}}>
      <div style={{maxWidth:1400,width:"100%",padding:"0 40px",boxSizing:"border-box"}}>
        <SectionLabel num="S02" label="Guardrail Matrix"/>
        <h2 data-morph style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(30px,4vw,50px)",
          fontWeight:700,color:INK,margin:"0 0 12px",lineHeight:1.1}}>
          22 Guardrails Across 5 Domains
        </h2>
        <p data-morph style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,color:INK_S,margin:"0 0 20px",maxWidth:620,lineHeight:1.6}}>
          Each advisory engagement is assessed against a structured compliance matrix. Guardrails are categorised by domain and severity to ensure consistent, defensible outputs.
        </p>
        <div data-morph style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:24}}>
          {Object.entries(DC).map(([domain,c])=>(
            <span key={domain} style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:600,
              padding:"5px 12px",borderRadius:2,background:c.bg,border:`1px solid ${c.bd}`,color:c.tx}}>
              {domain} ({domainCounts[domain]||0})
            </span>
          ))}
        </div>
        <div data-morph style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,
          boxShadow:"0 2px 16px rgba(26,33,48,.05)",overflow:"hidden"}}>
          {GUARDRAILS.map((g,i)=>{
            const dc=DC[g.domain]||{};
            return(
              <div key={g.code} className="gr-row"
                style={{display:"flex",alignItems:"center",gap:14,padding:"11px 18px",
                  background:i%2===0?"transparent":SURFACE_S,
                  borderBottom:i<GUARDRAILS.length-1?`1px solid ${BORDER_L}`:"none"}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,color:NAVY,minWidth:100,flexShrink:0}}>{g.code}</span>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:600,
                  padding:"3px 9px",borderRadius:2,background:dc.bg,border:`1px solid ${dc.bd}`,color:dc.tx,
                  whiteSpace:"nowrap",minWidth:80,textAlign:"center"}}>{g.domain}</span>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:INK_S,flex:1}}>{g.title}</span>
                <SevPill sev={g.sev}/>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── METHODOLOGY SECTION (S03) ─────────────────────────────────────────────────
function MethodologySection(){
  const aiTable=[
    {task:"Market Data Aggregation",     ai:true, hr:true,  hl:false},
    {task:"Comparable Transaction Search",ai:true,hr:true,  hl:false},
    {task:"Financial Model Construction", ai:false,hr:true,  hl:true},
    {task:"HBU Test Conclusions",         ai:false,hr:false, hl:true},
    {task:"Risk Register Scoring",        ai:false,hr:true,  hl:true},
    {task:"Executive Summary Drafting",   ai:true, hr:true,  hl:false},
    {task:"Regulatory Compliance Review", ai:false,hr:false, hl:true},
    {task:"Final Sign-Off",              ai:false,hr:false, hl:true},
  ];
  return(
    <section style={{background:SURFACE_S,borderBottom:`1px solid ${BORDER}`,display:"flex",
      alignItems:"flex-start",justifyContent:"center",width:"100%",boxSizing:"border-box"}}>
      <div style={{maxWidth:1400,width:"100%",padding:"0 40px",boxSizing:"border-box"}}>
        <SectionLabel num="S03" label="Report Structure"/>
        <h2 data-morph style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(30px,4vw,50px)",
          fontWeight:700,color:INK,margin:"0 0 12px",lineHeight:1.1}}>
          Eight-Section Report Framework
        </h2>
        <p data-morph style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,color:INK_S,margin:"0 0 28px",maxWidth:620,lineHeight:1.6}}>
          All MER advisory reports follow a standardised eight-section structure. Conditional sections are included based on report type classification.
        </p>
        <div data-morph style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:12,marginBottom:32}}>
          {REPORT_SECTIONS.map(s=>(
            <div key={s.n} style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,
              padding:"16px 20px",boxShadow:"0 2px 12px rgba(26,33,48,.05)",
              display:"flex",gap:14,alignItems:"flex-start"}}>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:GOLD,
                opacity:.35,fontWeight:700,lineHeight:1,flexShrink:0,marginTop:2}}>§{s.n}</span>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:700,color:INK}}>{s.title}</span>
                  {s.cond&&<span style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:600,
                    color:AMBER,background:"rgba(154,107,24,.06)",border:`1px solid rgba(154,107,24,.2)`,
                    padding:"2px 6px",borderRadius:2,letterSpacing:"0.5px"}}>COND</span>}
                </div>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:INK_M,margin:0,lineHeight:1.6}}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div data-morph>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_M,textTransform:"uppercase",
            letterSpacing:"2px",marginBottom:12}}>AI Role Boundaries</div>
          <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,
            boxShadow:"0 2px 12px rgba(26,33,48,.05)",overflow:"hidden"}}>
            {aiTable.map((row,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr repeat(3,90px)",
                padding:"10px 18px",borderBottom:i<aiTable.length-1?`1px solid ${BORDER_L}`:"none",
                background:i%2===0?"transparent":SURFACE_S,alignItems:"center",gap:10}}>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:12.5,color:INK_S}}>{row.task}</span>
                <span style={{textAlign:"center",fontSize:13}}>{row.ai?"✓":"—"}</span>
                <span style={{textAlign:"center",fontSize:13}}>{row.hr?"✓":"—"}</span>
                <span style={{textAlign:"center",fontSize:13}}>{row.hl?"✓":"—"}</span>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr repeat(3,90px)",
              padding:"8px 18px",borderTop:`1px solid ${BORDER}`,background:SURFACE_S,gap:10}}>
              <span/>
              {["AI may lead","Human review","Human leads"].map(l=>(
                <span key={l} style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:INK_M,
                  textTransform:"uppercase",letterSpacing:"0.5px",textAlign:"center"}}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── DEPLOY SECTION (S04) ──────────────────────────────────────────────────────
function DeploySection({onEnter}){
  const stats=[
    {v:"07",l:"Report Families"},
    {v:"22",l:"Guardrails"},
    {v:"05",l:"Domains"},
    {v:"12",l:"Compliance Checks"},
    {v:"MY",l:"Jurisdiction"},
  ];
  return(
    <section style={{background:NAVY_SECTION,display:"flex",
      alignItems:"flex-start",justifyContent:"center",width:"100%",boxSizing:"border-box"}}>
      <div style={{maxWidth:1400,width:"100%",padding:"0 40px",boxSizing:"border-box"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:28}}>
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:GOLD,fontWeight:700,letterSpacing:"1.5px"}}>S04</span>
          <span style={{width:20,height:1,background:GOLD,opacity:.6,display:"inline-block"}}/>
          <span style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"rgba(255,255,255,.55)",fontWeight:600,letterSpacing:"2.5px",textTransform:"uppercase"}}>DEPLOY</span>
        </div>
        <h2 data-morph style={{fontFamily:"'Cormorant Garamond',serif",
          fontSize:"clamp(40px,5vw,68px)",fontWeight:700,color:"#fff",
          margin:"0 0 20px",lineHeight:1.05,letterSpacing:"-1px"}}>
          The advisory library<br/>is ready.
        </h2>
        <p data-morph style={{fontFamily:"'Inter',sans-serif",fontSize:15,
          color:"rgba(255,255,255,.7)",margin:"0 0 36px",maxWidth:520,lineHeight:1.7}}>
          Access the complete report template library, guardrail compliance tools, and risk scoring engine. Structured for institutional-grade consultancy engagements.
        </p>
        <div data-morph style={{marginBottom:8}}>
          <HoldBar onComplete={onEnter} label="Enter the library" width={460} inverted/>
        </div>
        <p data-morph style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"rgba(255,255,255,.4)",margin:"8px 0 40px"}}>Press and hold to access the platform</p>
        <div data-morph style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          {stats.map(s=>(
            <div key={s.l} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",
              borderRadius:3,padding:"18px 24px",minWidth:100}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:700,
                color:GOLD_B,lineHeight:1,marginBottom:6}}><StatNum v={s.v}/></div>
              <div style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"rgba(255,255,255,.55)",
                textTransform:"uppercase",letterSpacing:"1.5px"}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── LANDING PAGE ──────────────────────────────────────────────────────────────
function LandingPage({onEnter,scrollRef,active}){
  const[sIdx,setSIdx]=useState(0);
  const morphing=useRef(false);
  const totalSections=LP_SECTIONS.length;

  const morphTo=useCallback((newIdx)=>{
    if(morphing.current||!scrollRef.current)return;
    const container=scrollRef.current;
    const allSections=Array.from(container.querySelectorAll(".lp-fit > section"));
    if(!allSections[newIdx])return;
    const oldSection=allSections[sIdx];
    const newSection=allSections[newIdx];
    const dir=newIdx>sIdx?1:-1;
    const oldBlocks=getMorphBlocks(oldSection);
    const newBlocks=getMorphBlocks(newSection);
    morphing.current=true;
    // Scatter out current
    oldBlocks.forEach((el,i)=>{
      el.style.willChange="transform,opacity";
      el.style.transition=`transform ${SCATTER_DUR}ms ease,opacity ${SCATTER_DUR}ms ease`;
      el.style.transitionDelay=`${i*18}ms`;
      el.style.opacity="0";
      el.style.transform=`translateY(${dir>0?-10:10}px)`;
    });
    setTimeout(()=>{
      if(newSection.scrollIntoView)newSection.scrollIntoView({behavior:"smooth",block:"start"});
      setSIdx(newIdx);
      oldBlocks.forEach(el=>clearMorph(el));
      newBlocks.forEach(el=>{
        el.style.opacity="0";
        el.style.transform=`translateY(${dir<0?-10:10}px)`;
        el.style.willChange="transform,opacity";
      });
      setTimeout(()=>{
        newBlocks.forEach((el,i)=>{
          el.style.transition=`transform ${ASSEMBLE_DUR}ms ease,opacity ${ASSEMBLE_DUR}ms ease`;
          el.style.transitionDelay=`${i*28}ms`;
          el.style.opacity="1";
          el.style.transform="";
        });
        setTimeout(()=>{
          newBlocks.forEach(el=>clearMorph(el));
          morphing.current=false;
        },ASSEMBLE_DUR+newBlocks.length*28+100);
      },SCROLL_DUR);
    },SCATTER_DUR+oldBlocks.length*18+40);
  },[sIdx,scrollRef]);

  useEffect(()=>{
    if(!active)return;
    const handler=(e)=>{
      if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")return;
      if(e.code==="Space"){
        e.preventDefault();
        if(e.shiftKey)morphTo(Math.max(0,sIdx-1));
        else morphTo(Math.min(totalSections-1,sIdx+1));
      }
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[active,sIdx,morphTo,totalSections]);

  return(
    <div className="lp-fit" ref={scrollRef}
      style={{position:"relative",overflowY:"scroll",scrollSnapType:"y mandatory"}}>
      <HeroSection onEnter={onEnter}/>
      <ReportSuiteSection/>
      <GuardrailSection/>
      <MethodologySection/>
      <DeploySection onEnter={onEnter}/>
      {active&&(
        <div style={{position:"fixed",bottom:24,left:"50%",zIndex:200,
          animation:"hintFloat 2.8s ease-in-out infinite",pointerEvents:"none"}}>
          <div style={{background:SURFACE,border:`1px solid ${BORDER}`,
            padding:"8px 16px",borderRadius:20,
            boxShadow:"0 4px 16px rgba(26,33,48,.09)"}}>
            <span style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_S,letterSpacing:"0.2px"}}>
              SPACE — next section · ⇧ SPACE — previous
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── REPORT CARD ───────────────────────────────────────────────────────────────
function ReportCard({t,onDL,downloading,idx,isFav,onToggleFav}){
  const[ref,vis]=useInView(.08);
  return(
    <div ref={ref} className="mer-card"
      style={{background:SURFACE,border:`1px solid ${isFav?"rgba(168,121,40,.4)":BORDER}`,borderRadius:4,
        overflow:"hidden",opacity:vis?1:0,
        transform:vis?"translateY(0)":"translateY(18px)",
        transition:`opacity .5s ease ${idx*60}ms, transform .5s ease ${idx*60}ms, box-shadow .25s, transform .25s`}}>
      <div style={{height:2,background:isFav?GOLD_B:GOLD}}/>
      <div style={{background:NAVY_DIM,padding:"18px 24px 14px",borderBottom:`1px solid ${BORDER}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10.5,color:NAVY,
            background:NAVY_DIM,border:"1px solid rgba(27,51,86,.15)",padding:"3px 8px",borderRadius:2}}>{t.code}</span>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,color:INK_M}}>{t.pages} pp.</span>
            <button className="fav-btn no-print" onClick={e=>{e.stopPropagation();onToggleFav&&onToggleFav(t.code);}}
              aria-label={isFav?"Remove from favourites":"Add to favourites"}
              title={isFav?"Remove from favourites":"Add to favourites"}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill={isFav?GOLD_B:"none"} stroke={isFav?GOLD_B:INK_F} strokeWidth="1.4">
                <path d="M7.5 1.5l1.72 3.49 3.85.56-2.78 2.71.65 3.83L7.5 10.34l-3.44 1.81.65-3.83L1.93 5.55l3.85-.56z"/>
              </svg>
            </button>
          </div>
        </div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,
          color:INK,lineHeight:1.15,marginBottom:5}}>{t.type}</div>
        <div style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:INK_M}}>{t.tag}</div>
      </div>
      <div style={{padding:"16px 24px"}}>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14}}>
          {[1,2,3,4,5,6,7,8].map(n=>{
            const inc=t.sections.includes(n);
            return(
              <div key={n} style={{width:24,height:24,display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:9.5,fontWeight:600,borderRadius:2,
                border:`1px solid ${inc?"rgba(168,121,40,.3)":BORDER_L}`,
                background:inc?GOLD_DIM:"transparent",
                color:inc?GOLD_B:INK_F}}>§{n}</div>
            );
          })}
        </div>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:INK_S,
          lineHeight:1.6,margin:"0 0 16px"}}>{t.desc}</p>
        <button onClick={()=>onDL(t)} className="btn-primary"
          style={{width:"100%",background:NAVY,color:"#fff",border:"none",
            padding:"11px 0",borderRadius:2,fontFamily:"'Inter',sans-serif",
            fontSize:11,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",
            cursor:"pointer"}}>
          {downloading===t.code?"Preparing...":"Download Template"}
        </button>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({onTool,onNavigate,favorites,onToggleFavorite,recentPages}){
  const[toast,setToast]=useState(null),[dlg,setDlg]=useState(null),[query,setQuery]=useState("");
  const[sortBy,setSortBy]=useState("default");

  const getFiltered=()=>{
    let list=MER_TYPES.filter(t=>`${t.code} ${t.type} ${t.tag} ${t.desc}`.toLowerCase().includes(query.toLowerCase()));
    if(sortBy==="pages-asc")list=[...list].sort((a,b)=>parseInt(a.pages)-parseInt(b.pages));
    else if(sortBy==="pages-desc")list=[...list].sort((a,b)=>parseInt(b.pages)-parseInt(a.pages));
    else if(sortBy==="code")list=[...list].sort((a,b)=>a.code.localeCompare(b.code));
    else if(sortBy==="fav"){
      list=[...list].sort((a,b)=>{
        const af=favorites.includes(a.code)?1:0,bf=favorites.includes(b.code)?1:0;
        return bf-af;
      });
    }
    return list;
  };
  const filtered=getFiltered();

  const dl=(t)=>{
    setDlg(t.code);
    const content=[
      "MERIDIAN RE ADVISORY",
      `${t.code} — ${t.type}`,
      "",
      `Typical length: ${t.pages} pages`,
      `Included sections: ${t.sections.map(n=>`§${n}`).join(", ")}`,
      "",
      t.desc,
      "",
      "MANDATORY RELEASE CONTROLS",
      ...G_CHECKS.map((x,i)=>`[ ] ${String(i+1).padStart(2,"0")} ${x}`),
    ].join("\n");
    setTimeout(()=>{
      downloadText(`${t.code}-template.txt`,content);
      setDlg(null);setToast(`${t.code} template downloaded`);
    },450);
  };

  const recentRoutes=recentPages
    .filter(id=>ROUTES.some(r=>r.id===id)&&id!=="dashboard"&&id!=="landing")
    .slice(0,4)
    .map(id=>ROUTES.find(r=>r.id===id));

  return(
    <div style={{background:BG,minHeight:"100vh"}}>
      <div style={{height:60}}/>
      <div style={{background:SURFACE,borderBottom:`1px solid ${BORDER}`,padding:"22px 32px",
        display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
        <div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,color:GOLD,
            textTransform:"uppercase",letterSpacing:"2px",marginBottom:6}}>MERIDIAN · REPORT LIBRARY</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:700,
            color:INK,margin:"0 0 4px",lineHeight:1.1}}>Report Template Library</h1>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:INK_S,margin:0}}>
            Seven MER advisory report families — MAS-GUARD-001 compliant
            {favorites.length>0&&<span style={{marginLeft:10,fontFamily:"'IBM Plex Mono',monospace",
              fontSize:10,color:GOLD_B,background:GOLD_DIM,border:`1px solid rgba(168,121,40,.2)`,
              padding:"2px 7px",borderRadius:2}}>★ {favorites.length} starred</span>}
          </p>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <input value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Find a report family..."
            aria-label="Find a report family"
            style={{fontFamily:"'Inter',sans-serif",fontSize:12,background:SURFACE,
              border:`1px solid ${BORDER}`,color:INK,borderRadius:2,padding:"9px 12px",minWidth:200}}/>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
            aria-label="Sort report families"
            style={{fontFamily:"'Inter',sans-serif",fontSize:12,background:SURFACE,
              border:`1px solid ${BORDER}`,color:INK_S,borderRadius:2,padding:"9px 10px",cursor:"pointer"}}>
            <option value="default">Default order</option>
            <option value="fav">★ Starred first</option>
            <option value="pages-asc">Pages: low → high</option>
            <option value="pages-desc">Pages: high → low</option>
            <option value="code">Code A → Z</option>
          </select>
          <button onClick={()=>onTool("checker")} className="btn-outline"
            style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:INK_S,
              border:`1px solid ${BORDER}`,background:"transparent",
              padding:"9px 14px",borderRadius:2,cursor:"pointer",fontWeight:500}}>
            Checklist
          </button>
          <button onClick={()=>onTool("risk")} className="btn-outline"
            style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:INK_S,
              border:`1px solid ${BORDER}`,background:"transparent",
              padding:"9px 14px",borderRadius:2,cursor:"pointer",fontWeight:500}}>
            Risk
          </button>
          <button onClick={()=>onTool("fee")} className="btn-outline"
            style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:INK_S,
              border:`1px solid ${BORDER}`,background:"transparent",
              padding:"9px 14px",borderRadius:2,cursor:"pointer",fontWeight:500}}>
            Fee Calc
          </button>
        </div>
      </div>

      {recentRoutes.length>0&&(
        <div style={{background:SURFACE_S,borderBottom:`1px solid ${BORDER}`,
          padding:"14px 32px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:INK_M,
            textTransform:"uppercase",letterSpacing:"1.5px",flexShrink:0}}>Recently visited</span>
          {recentRoutes.map(r=>(
            <button key={r.id} onClick={()=>onNavigate(r.id)}
              style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_S,
                background:SURFACE,border:`1px solid ${BORDER}`,padding:"5px 12px",
                borderRadius:2,cursor:"pointer",transition:"border-color .15s,color .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;e.currentTarget.style.color=GOLD;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.color=INK_S;}}>
              {r.label}
            </button>
          ))}
        </div>
      )}

      <div style={{maxWidth:1400,margin:"0 auto",padding:"30px 32px 0"}}>
        <SectionLabel num="START" label="Advisory Knowledge System"/>
        <div className="route-grid">
          {ROUTES.filter(r=>["framework","playbook","standards","sample"].includes(r.id)).map(r=>(
            <button key={r.id} className="route-card" onClick={()=>onNavigate(r.id)}>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:GOLD,
                letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:10}}>{r.eyebrow}</span>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,
                color:INK,display:"block",marginBottom:6}}>{r.label}</span>
              <span style={{fontSize:11.5,lineHeight:1.55,color:INK_S,display:"block"}}>{r.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {favorites.length>0&&query===""&&sortBy==="default"&&(
        <div style={{maxWidth:1400,margin:"0 auto",padding:"28px 32px 0"}}>
          <SectionLabel num="★" label="Starred Reports"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:18}}>
            {MER_TYPES.filter(t=>favorites.includes(t.code)).map((t,i)=>(
              <ReportCard key={t.code} t={t} onDL={dl} downloading={dlg} idx={i}
                isFav={true} onToggleFav={onToggleFavorite}/>
            ))}
          </div>
          <div style={{borderBottom:`1px solid ${BORDER_L}`,margin:"28px 0 0"}}/>
        </div>
      )}

      <div style={{maxWidth:1400,margin:"0 auto",padding:"28px 32px 40px",
        display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:18}}>
        {filtered.map((t,i)=>(
          <ReportCard key={t.code} t={t} onDL={dl} downloading={dlg} idx={i}
            isFav={favorites.includes(t.code)} onToggleFav={onToggleFavorite}/>
        ))}
        {filtered.length===0&&(
          <div style={{gridColumn:"1/-1",padding:"44px",border:`1px dashed ${BORDER}`,
            borderRadius:3,textAlign:"center"}}>
            <div style={{fontSize:13,color:INK_M,marginBottom:12}}>No report families match "{query}".</div>
            <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
              {["Market","Investment","Feasibility"].map(s=>(
                <button key={s} onClick={()=>setQuery(s)}
                  style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:GOLD,
                    background:GOLD_DIM,border:`1px solid rgba(168,121,40,.2)`,
                    padding:"5px 12px",borderRadius:2,cursor:"pointer"}}>Try "{s}"</button>
              ))}
            </div>
          </div>
        )}
      </div>
      {toast&&<Toast msg={toast} onClose={()=>setToast(null)}/>}
    </div>
  );
}

// ── GUARDRAIL CHECKER ─────────────────────────────────────────────────────────
function GuardrailChecker(){
  const[checked,setChecked]=usePersistentState("meridian-checks",{});
  const[ref_code,setRef]=usePersistentState("meridian-ref","");
  const[itemNotes,setItemNotes]=usePersistentState("meridian-check-notes",{});
  const[expandedNotes,setExpandedNotes]=useState(new Set());
  const[history,setHistory]=usePersistentState("meridian-eng-history",[]);
  const[activeGroup,setActiveGroup]=useState(null);

  const toggle=i=>setChecked(c=>({...c,[i]:!c[i]}));
  const toggleNote=i=>setExpandedNotes(s=>{const n=new Set(s);n.has(i)?n.delete(i):n.add(i);return n;});
  const setNote=(i,v)=>setItemNotes(n=>({...n,[i]:v}));

  const visibleIndices=activeGroup===null
    ?G_CHECKS.map((_,i)=>i)
    :G_CHECK_GROUPS.find(g=>g.label===activeGroup)?.indices||[];

  const done=Object.values(checked).filter(Boolean).length;
  const allDone=done===G_CHECKS.length;
  const pct=Math.round(done/G_CHECKS.length*100);

  const autoRef=()=>{
    const year=new Date().getFullYear();
    const seq=String(history.length+1).padStart(3,"0");
    setRef(`MER-${year}-${seq}`);
  };

  const exportChecklist=()=>{
    const lines=[
      "MERIDIAN RE ADVISORY — GUARDRAIL COMPLIANCE RECORD",
      `Engagement reference: ${ref_code||"Not provided"}`,
      `Compliance score: ${done}/${G_CHECKS.length} (${pct}%)`,
      `Exported: ${new Date().toLocaleString()}`,
      "",
      ...G_CHECKS.map((text,i)=>{
        const note=itemNotes[i];
        return`${checked[i]?"[x]":"[ ]"} ${text}${note?`\n   Note: ${note}`:""}`;
      }),
    ];
    downloadText(`${ref_code||"meridian"}-compliance-record.txt`,lines.join("\n"));
    if(ref_code){
      setHistory(h=>[{ref:ref_code,date:new Date().toLocaleDateString(),pct,done},...h].slice(0,5));
    }
  };

  return(
    <div style={{background:BG,minHeight:"100vh"}}>
      <div style={{height:60}}/>
      <div style={{maxWidth:960,margin:"0 auto",padding:"48px 32px"}}>
        <SectionLabel num="TOOL" label="Guardrail Compliance Checker"/>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(28px,4vw,44px)",
          fontWeight:700,color:INK,margin:"0 0 12px",lineHeight:1.1}}>
          Compliance Verification
        </h1>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:14,color:INK_S,margin:"0 0 28px",lineHeight:1.6,maxWidth:560}}>
          Work through the 12-point compliance checklist before finalising any MER advisory report. Items marked HUMAN REQ. require explicit advisor sign-off.
        </p>

        {history.length>0&&(
          <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,
            padding:"14px 18px",marginBottom:20}}>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:INK_M,
              textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:10}}>Recent Engagements</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {history.map((h,i)=>(
                <button key={i} onClick={()=>setRef(h.ref)}
                  title={`${h.date} · ${h.done}/${G_CHECKS.length} checks`}
                  style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:NAVY,
                    background:NAVY_DIM,border:"1px solid rgba(27,51,86,.15)",
                    padding:"4px 10px",borderRadius:2,cursor:"pointer",
                    display:"flex",alignItems:"center",gap:6}}>
                  {h.ref}
                  <span style={{fontFamily:"'Inter',sans-serif",fontSize:9,
                    color:h.pct===100?UP:AMBER}}>{h.pct}%</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,marginBottom:24,alignItems:"end"}}>
          <div>
            <label style={{display:"block",fontFamily:"'Inter',sans-serif",fontSize:11,
              color:INK_M,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:8}}>
              Engagement Reference
            </label>
            <input value={ref_code} onChange={e=>setRef(e.target.value)}
              placeholder="e.g. MER-2025-001"
              style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,
                background:SURFACE,border:`1px solid ${BORDER}`,color:INK,
                borderRadius:2,padding:"11px 14px",width:"100%",
                boxSizing:"border-box",transition:"border-color .15s"}}/>
          </div>
          <button onClick={autoRef} className="btn-outline"
            style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_S,
              border:`1px solid ${BORDER}`,background:"transparent",
              padding:"11px 14px",borderRadius:2,cursor:"pointer",whiteSpace:"nowrap"}}>
            Auto-generate
          </button>
        </div>

        <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,
          padding:"16px 20px",marginBottom:20,display:"flex",
          alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_M,
              textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:8}}>Compliance Score</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:allDone?UP:INK}}>
              {done}/{G_CHECKS.length} — {pct}%
            </div>
          </div>
          <div style={{flex:1,minWidth:200,maxWidth:320}}>
            <div style={{height:4,background:BORDER_L,borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct}%`,
                background:allDone?UP:NAVY,borderRadius:2,transition:"width .3s ease"}}/>
            </div>
          </div>
        </div>

        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
          <button onClick={()=>setActiveGroup(null)}
            style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:600,
              padding:"5px 12px",borderRadius:2,cursor:"pointer",border:"1px solid",
              background:activeGroup===null?NAVY:"transparent",
              color:activeGroup===null?"#fff":INK_M,
              borderColor:activeGroup===null?NAVY:BORDER}}>
            All ({G_CHECKS.length})
          </button>
          {G_CHECK_GROUPS.map(g=>{
            const groupDone=g.indices.filter(i=>checked[i]).length;
            const isActive=activeGroup===g.label;
            return(
              <button key={g.label} onClick={()=>setActiveGroup(isActive?null:g.label)}
                style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:600,
                  padding:"5px 12px",borderRadius:2,cursor:"pointer",border:"1px solid",
                  background:isActive?g.color:"transparent",
                  color:isActive?"#fff":g.color,
                  borderColor:`${g.color}44`}}>
                {g.label} ({groupDone}/{g.indices.length})
              </button>
            );
          })}
        </div>

        <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,overflow:"hidden",marginBottom:24}}>
          {visibleIndices.map((i,rank)=>{
            const text=G_CHECKS[i];
            const isChecked=!!checked[i];
            const needsHuman=G_HUMAN.includes(i);
            const noteOpen=expandedNotes.has(i);
            const hasNote=!!itemNotes[i];
            return(
              <div key={i} style={{borderBottom:rank<visibleIndices.length-1?`1px solid ${BORDER_L}`:"none"}}>
                <div onClick={()=>toggle(i)} role="checkbox" tabIndex={0} aria-checked={isChecked}
                  onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();toggle(i);}}}
                  style={{display:"flex",alignItems:"flex-start",gap:14,padding:"13px 18px",
                    background:isChecked?"rgba(39,103,73,.03)":"transparent",
                    cursor:"pointer",transition:"background .15s"}}
                  onMouseEnter={e=>{if(!isChecked)e.currentTarget.style.background=GOLD_DIM;}}
                  onMouseLeave={e=>{e.currentTarget.style.background=isChecked?"rgba(39,103,73,.03)":"transparent";}}>
                  <div style={{width:18,height:18,border:`1.5px solid ${isChecked?NAVY:BORDER}`,
                    borderRadius:3,background:isChecked?NAVY:"transparent",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    flexShrink:0,marginTop:2,transition:"all .15s"}}>
                    {isChecked&&<span style={{color:"#fff",fontSize:11,lineHeight:1,fontWeight:700}}>✓</span>}
                  </div>
                  <div style={{flex:1}}>
                    <span style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,
                      color:isChecked?INK_M:INK,
                      textDecoration:isChecked?"line-through":"none",
                      lineHeight:1.5}}>{text}</span>
                    {needsHuman&&(
                      <span style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:600,
                        color:AMBER,background:"rgba(154,107,24,.06)",
                        border:`1px solid rgba(154,107,24,.2)`,
                        padding:"2px 6px",borderRadius:2,marginLeft:10,
                        letterSpacing:"0.5px"}}>HUMAN REQ.</span>
                    )}
                  </div>
                  <button onClick={e=>{e.stopPropagation();toggleNote(i);}}
                    title="Toggle note"
                    style={{background:"none",border:"none",cursor:"pointer",
                      padding:"2px 6px",borderRadius:2,flexShrink:0,marginTop:1,
                      color:hasNote?GOLD:INK_F,fontSize:11,fontWeight:600,
                      fontFamily:"'IBM Plex Mono',monospace"}}>
                    {noteOpen?"▾":"▸"}
                  </button>
                </div>
                {noteOpen&&(
                  <div style={{padding:"0 18px 12px 50px"}} onClick={e=>e.stopPropagation()}>
                    <textarea className="notes-area"
                      placeholder="Add a note or evidence reference for this check..."
                      value={itemNotes[i]||""}
                      onChange={e=>setNote(i,e.target.value)}/>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {allDone&&(
          <div style={{border:`1px solid rgba(39,103,73,.3)`,background:"rgba(39,103,73,.05)",
            borderRadius:3,padding:"16px 20px",marginBottom:20,
            fontFamily:"'Inter',sans-serif",fontSize:13.5,color:UP,lineHeight:1.5}}>
            All {G_CHECKS.length} compliance checks verified. This report meets MAS-GUARD-001 requirements.
            {ref_code&&<span style={{fontFamily:"'IBM Plex Mono',monospace",marginLeft:8,fontSize:12}}>Ref: {ref_code}</span>}
          </div>
        )}
        <div className="tool-actions no-print">
          <button onClick={exportChecklist} className="btn-primary"
            style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#fff",border:"none",
              background:NAVY,padding:"10px 20px",borderRadius:2,cursor:"pointer",fontWeight:600}}>
            Export Record
          </button>
          <button onClick={()=>window.print()} className="btn-outline"
            style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:INK_S,
              border:`1px solid ${BORDER}`,background:"transparent",
              padding:"10px 20px",borderRadius:2,cursor:"pointer",fontWeight:500}}>Print</button>
          <button onClick={()=>{setChecked({});setRef("");}} className="btn-outline"
            style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:INK_S,
              border:`1px solid ${BORDER}`,background:"transparent",
              padding:"10px 20px",borderRadius:2,cursor:"pointer",fontWeight:500}}>
            Reset Checklist
          </button>
        </div>
      </div>
    </div>
  );
}

// ── RISK HEAT MAP ─────────────────────────────────────────────────────────────
function RiskHeatMap({risks}){
  const getZoneColor=(l,impact)=>{
    const s=l*impact;
    if(s>=15)return"rgba(176,57,45,.18)";
    if(s>=9)return"rgba(168,121,40,.14)";
    if(s>=4)return"rgba(154,107,24,.08)";
    return"rgba(39,103,73,.07)";
  };
  const getZoneText=(l,impact)=>{
    const s=l*impact;
    if(s>=15)return DOWN;
    if(s>=9)return GOLD;
    if(s>=4)return AMBER;
    return UP;
  };
  return(
    <div style={{marginBottom:24}}>
      <div style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:INK_M,textTransform:"uppercase",
        letterSpacing:"1.5px",marginBottom:12}}>Risk Heat Map — Likelihood × Impact</div>
      <div style={{display:"flex",gap:4}}>
        <div style={{display:"flex",flexDirection:"column",justifyContent:"space-around",
          paddingBottom:28,width:36,flexShrink:0}}>
          {[5,4,3,2,1].map(imp=>(
            <div key={imp} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,
              color:INK_M,textAlign:"right",height:44,display:"flex",alignItems:"center",justifyContent:"flex-end"}}>
              I={imp}
            </div>
          ))}
        </div>
        <div style={{flex:1}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:3}}>
            {[5,4,3,2,1].map(imp=>
              [1,2,3,4,5].map(l=>{
                const inCell=risks.filter(r=>r.l===l&&r.i===imp);
                const bg=getZoneColor(l,imp);
                const tc=getZoneText(l,imp);
                return(
                  <div key={`${l}-${imp}`} className="hm-cell"
                    style={{background:bg,border:`1px solid ${BORDER_L}`}}>
                    {inCell.length>0&&(
                      <div style={{display:"flex",flexWrap:"wrap",gap:2,justifyContent:"center"}}>
                        {inCell.map(r=>(
                          <span key={r.id} title={r.name}
                            style={{width:18,height:18,borderRadius:"50%",
                              background:tc,color:"#fff",fontSize:8,fontWeight:700,
                              display:"flex",alignItems:"center",justifyContent:"center",
                              flexShrink:0}}>
                            {risks.indexOf(r)+1}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:3,marginTop:4}}>
            {[1,2,3,4,5].map(l=>(
              <div key={l} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,
                color:INK_M,textAlign:"center"}}>L={l}</div>
            ))}
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap"}}>
        {[["≥15 Critical",DOWN,"rgba(176,57,45,.18)"],["9–14 High",GOLD,"rgba(168,121,40,.14)"],["4–8 Medium",AMBER,"rgba(154,107,24,.08)"],["1–3 Low",UP,"rgba(39,103,73,.07)"]].map(([l,tc,bg])=>(
          <span key={l} style={{fontFamily:"'Inter',sans-serif",fontSize:10,display:"flex",
            alignItems:"center",gap:5,color:INK_M}}>
            <span style={{width:12,height:12,borderRadius:1,background:bg,
              border:`1px solid ${BORDER_L}`,display:"inline-block"}}/>
            <span style={{color:tc,fontWeight:600}}>{l}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── RISK SCORER ───────────────────────────────────────────────────────────────
function RiskScorer(){
  const[risks,setRisks]=usePersistentState("meridian-risks-v2",[
    {id:1,name:"Planning approval delay",l:3,i:4,category:"Legal/Regulatory",notes:""},
    {id:2,name:"Market absorption slower than forecast",l:4,i:3,category:"Market",notes:""},
    {id:3,name:"Construction cost overrun",l:3,i:5,category:"Construction",notes:""},
    {id:4,name:"Interest rate increase",l:2,i:4,category:"Financial",notes:""},
    {id:5,name:"Regulatory change (Act 242)",l:2,i:5,category:"Legal/Regulatory",notes:""},
  ]);
  const[input,setInput]=useState(""),nextId=useRef(20);
  const[sortMode,setSortMode]=useState("default");
  const[expandedNotes,setExpandedNotes]=useState(new Set());
  const[showHeatMap,setShowHeatMap]=useState(false);
  const[showPresets,setShowPresets]=useState(false);
  const toggleNoteRow=id=>setExpandedNotes(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
  const addRisk=()=>{
    if(!input.trim())return;
    setRisks(r=>[...r,{id:nextId.current++,name:input.trim(),l:3,i:3,category:"Market",notes:""}]);
    setInput("");
  };
  const loadPresets=()=>{
    const existing=new Set(risks.map(r=>r.name));
    const toAdd=RISK_PRESETS.filter(p=>!existing.has(p.name));
    if(!toAdd.length){setShowPresets(false);return;}
    setRisks(r=>[...r,...toAdd.map(p=>({...p,id:nextId.current++}))]);
    setShowPresets(false);
  };
  const updateRisk=(id,field,val)=>{
    setRisks(r=>r.map(x=>x.id===id?{...x,[field]:val}:x));
  };
  const updateRiskDelta=(id,field,delta)=>{
    setRisks(r=>r.map(x=>x.id===id?{...x,[field]:Math.max(1,Math.min(5,x[field]+delta))}:x));
  };
  const delRisk=(id)=>setRisks(r=>r.filter(x=>x.id!==id));
  const getSev=(score)=>score>=15?"Critical":score>=9?"High":score>=4?"Medium":"Low";
  const getSevColor=(score)=>score>=15?DOWN:score>=9?GOLD:score>=4?AMBER:UP;

  const getSorted=()=>{
    const r=[...risks];
    if(sortMode==="score-desc")return r.sort((a,b)=>b.l*b.i-a.l*a.i);
    if(sortMode==="score-asc")return r.sort((a,b)=>a.l*a.i-b.l*b.i);
    if(sortMode==="name")return r.sort((a,b)=>a.name.localeCompare(b.name));
    return r;
  };
  const sorted=getSorted();

  const g05ok=risks.length>=5;
  const critical=risks.filter(r=>r.l*r.i>=15).length;
  const totalScore=risks.reduce((s,r)=>s+r.l*r.i,0);

  const exportCSV=()=>{
    const csv=[
      ["#","Risk Factor","Category","Likelihood","Impact","Score","Severity","Notes"],
      ...risks.map((r,i)=>[i+1,r.name,r.category||"",r.l,r.i,r.l*r.i,getSev(r.l*r.i),r.notes||""]),
    ].map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
    downloadText("meridian-risk-register.csv",csv,"text/csv");
  };
  const exportJSON=()=>{
    const data={exportedAt:new Date().toISOString(),totalRisks:risks.length,risks:risks.map((r,i)=>({
      index:i+1,name:r.name,category:r.category||"",likelihood:r.l,impact:r.i,
      score:r.l*r.i,severity:getSev(r.l*r.i),notes:r.notes||"",
    }))};
    downloadText("meridian-risk-register.json",JSON.stringify(data,null,2),"application/json");
  };
  const Stepper=({val,onMinus,onPlus})=>(
    <div style={{display:"flex",alignItems:"center",gap:0,border:`1px solid ${BORDER}`,borderRadius:2,overflow:"hidden"}}>
      <button onClick={onMinus} aria-label="Decrease" style={{width:28,height:32,background:"transparent",
        border:"none",cursor:"pointer",color:INK_S,fontSize:14,fontWeight:600,
        borderRight:`1px solid ${BORDER}`,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
      <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:700,
        color:NAVY,width:24,textAlign:"center"}}>{val}</span>
      <button onClick={onPlus} aria-label="Increase" style={{width:28,height:32,background:"transparent",
        border:"none",cursor:"pointer",color:INK_S,fontSize:14,fontWeight:600,
        borderLeft:`1px solid ${BORDER}`,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
    </div>
  );
  return(
    <div style={{background:BG,minHeight:"100vh"}}>
      <div style={{height:60}}/>
      <div style={{maxWidth:960,margin:"0 auto",padding:"48px 32px"}}>
        <SectionLabel num="TOOL" label="Risk Register Builder"/>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(28px,4vw,44px)",
          fontWeight:700,color:INK,margin:"0 0 12px",lineHeight:1.1}}>
          Risk Register
        </h1>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:14,color:INK_S,margin:"0 0 28px",lineHeight:1.6,maxWidth:560}}>
          Build and score your engagement risk register. G-05 requires a minimum of 5 risks, each scored Likelihood × Impact (1–5 scale).
        </p>

        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          <input value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")addRisk();}}
            placeholder="Describe a new risk factor..."
            style={{flex:1,minWidth:200,fontFamily:"'Inter',sans-serif",fontSize:13,
              background:SURFACE,border:`1px solid ${BORDER}`,color:INK,
              borderRadius:2,padding:"11px 14px",boxSizing:"border-box"}}/>
          <button onClick={addRisk} className="btn-primary"
            style={{background:NAVY,color:"#fff",border:"none",padding:"11px 20px",borderRadius:2,
              cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:600,
              letterSpacing:"1px",textTransform:"uppercase",whiteSpace:"nowrap"}}>
            + Add
          </button>
          <button onClick={()=>setShowPresets(true)} className="btn-outline"
            style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:INK_S,
              border:`1px solid ${BORDER}`,background:"transparent",
              padding:"11px 16px",borderRadius:2,cursor:"pointer",whiteSpace:"nowrap"}}>
            Load Presets
          </button>
        </div>

        {showPresets&&(
          <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,
            padding:"16px 20px",marginBottom:20}}>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_M,
              textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:12}}>Standard Real Estate Risks</div>
            {RISK_PRESETS.map((p,i)=>(
              <div key={i} style={{fontFamily:"'Inter',sans-serif",fontSize:12.5,color:INK_S,
                padding:"6px 0",borderBottom:i<RISK_PRESETS.length-1?`1px solid ${BORDER_L}`:"none",
                display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                <span>{p.name}</span>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:INK_F,
                  flexShrink:0}}>{p.category} · L={p.l} I={p.i}</span>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button onClick={loadPresets} className="btn-primary"
                style={{background:NAVY,color:"#fff",border:"none",padding:"9px 18px",
                  borderRadius:2,cursor:"pointer",fontFamily:"'Inter',sans-serif",
                  fontSize:12,fontWeight:600}}>Add All Presets</button>
              <button onClick={()=>setShowPresets(false)} className="btn-outline"
                style={{background:"transparent",border:`1px solid ${BORDER}`,color:INK_S,
                  padding:"9px 16px",borderRadius:2,cursor:"pointer",
                  fontFamily:"'Inter',sans-serif",fontSize:12}}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:10,marginBottom:20}}>
          {[
            ["Registered",risks.length,INK],
            ["Critical",critical,critical?DOWN:UP],
            ["Total Score",totalScore,NAVY],
            ["G-05",g05ok?"Met":"Pending",g05ok?UP:AMBER],
          ].map(([label,value,color])=>(
            <div key={label} className="mer-stat" style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,padding:"13px 16px"}}>
              <div style={{fontSize:9.5,color:INK_M,textTransform:"uppercase",letterSpacing:"1px",marginBottom:5}}>{label}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,color}}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          marginBottom:12,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setShowHeatMap(v=>!v)} className="btn-outline"
              style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:showHeatMap?GOLD:INK_S,
                border:`1px solid ${showHeatMap?"rgba(168,121,40,.4)":BORDER}`,
                background:showHeatMap?GOLD_DIM:"transparent",
                padding:"6px 12px",borderRadius:2,cursor:"pointer"}}>
              {showHeatMap?"Hide":"Show"} Heat Map
            </button>
          </div>
          <select value={sortMode} onChange={e=>setSortMode(e.target.value)}
            style={{fontFamily:"'Inter',sans-serif",fontSize:11,background:SURFACE,
              border:`1px solid ${BORDER}`,color:INK_S,borderRadius:2,padding:"6px 10px",cursor:"pointer"}}>
            <option value="default">Default order</option>
            <option value="score-desc">Score: high → low</option>
            <option value="score-asc">Score: low → high</option>
            <option value="name">Name A → Z</option>
          </select>
        </div>

        {showHeatMap&&<RiskHeatMap risks={sorted}/>}

        <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,
          overflow:"hidden",marginBottom:20}}>
          <div className="mobile-risk-header" style={{gridTemplateColumns:"1fr 120px 110px 110px 80px 80px 32px",
            padding:"10px 18px",background:SURFACE_S,borderBottom:`1px solid ${BORDER}`,gap:8}}>
            {["Risk Factor","Category","Likelihood (1–5)","Impact (1–5)","Score","Severity",""].map((h,i)=>(
              <span key={i} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,
                color:INK_M,textTransform:"uppercase",letterSpacing:"0.5px",
                textAlign:i>1?"center":"left"}}>{h}</span>
            ))}
          </div>
          {sorted.length===0&&(
            <div style={{padding:"32px 18px",textAlign:"center",
              fontFamily:"'Inter',sans-serif",fontSize:13,color:INK_F}}>
              No risks added yet. Add at least 5 to meet G-05.
            </div>
          )}
          {sorted.map((r,i)=>{
            const score=r.l*r.i;
            const sev=getSev(score);
            const col=getSevColor(score);
            const noteOpen=expandedNotes.has(r.id);
            return(
              <div key={r.id} style={{borderBottom:i<sorted.length-1?`1px solid ${BORDER_L}`:"none"}}>
                <div className="risk-row"
                  style={{display:"grid",gridTemplateColumns:"1fr 120px 110px 110px 80px 80px 32px",
                    padding:"11px 18px",
                    background:i%2===0?"transparent":SURFACE_S,
                    alignItems:"center",gap:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <button onClick={()=>toggleNoteRow(r.id)}
                      title="Toggle notes"
                      style={{background:"none",border:"none",cursor:"pointer",
                        color:r.notes?GOLD:INK_F,fontSize:10,fontFamily:"'IBM Plex Mono',monospace",
                        padding:"1px 4px",flexShrink:0}}>
                      {noteOpen?"▾":"▸"}
                    </button>
                    <span className="risk-name" style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:INK}}>{r.name}</span>
                  </div>
                  <div>
                    <select value={r.category||"Market"}
                      onChange={e=>updateRisk(r.id,"category",e.target.value)}
                      className="tag-select"
                      style={{width:"100%",fontFamily:"'Inter',sans-serif",fontSize:10,
                        background:SURFACE,border:`1px solid ${BORDER}`,color:INK_S,
                        borderRadius:2,padding:"3px 4px",cursor:"pointer"}}>
                      {RISK_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{display:"flex",justifyContent:"center"}}>
                    <Stepper val={r.l} onMinus={()=>updateRiskDelta(r.id,"l",-1)} onPlus={()=>updateRiskDelta(r.id,"l",1)}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"center"}}>
                    <Stepper val={r.i} onMinus={()=>updateRiskDelta(r.id,"i",-1)} onPlus={()=>updateRiskDelta(r.id,"i",1)}/>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:col}}>{score}</span>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <SevPill sev={sev}/>
                  </div>
                  <button onClick={()=>delRisk(r.id)} className="risk-delete" aria-label={`Delete ${r.name}`}
                    style={{background:"none",border:"none",color:INK_F,cursor:"pointer",
                      fontSize:16,lineHeight:1,padding:0,
                      display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                </div>
                {noteOpen&&(
                  <div style={{padding:"0 18px 12px 42px",background:i%2===0?"transparent":SURFACE_S}}>
                    <textarea className="notes-area"
                      placeholder="Add mitigation strategy or evidence notes..."
                      value={r.notes||""}
                      onChange={e=>updateRisk(r.id,"notes",e.target.value)}/>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{border:`1px solid ${g05ok?"rgba(39,103,73,.3)":"rgba(154,107,24,.2)"}`,
          background:g05ok?"rgba(39,103,73,.05)":"rgba(154,107,24,.05)",
          borderRadius:3,padding:"14px 18px",marginBottom:20,
          display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:g05ok?UP:AMBER,flexShrink:0}}/>
          <span style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:g05ok?UP:AMBER}}>
            G-05 Compliance: {risks.length}/{5} risks registered
            {g05ok?" — requirement met":" — minimum 5 required"}
          </span>
        </div>
        <div className="tool-actions no-print">
          <button onClick={exportCSV} className="btn-primary"
            style={{background:NAVY,color:"#fff",border:"none",padding:"10px 20px",borderRadius:2,
              cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:600}}>Export CSV</button>
          <button onClick={exportJSON} className="btn-outline"
            style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:INK_S,border:`1px solid ${BORDER}`,
              background:"transparent",padding:"10px 20px",borderRadius:2,cursor:"pointer"}}>Export JSON</button>
          <button onClick={()=>window.print()} className="btn-outline"
            style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:INK_S,border:`1px solid ${BORDER}`,
              background:"transparent",padding:"10px 20px",borderRadius:2,cursor:"pointer"}}>Print</button>
          <button onClick={()=>{if(window.confirm("Reset all risks to defaults?"))setRisks([]);}}
            className="btn-outline"
            style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:DOWN,
              border:`1px solid rgba(176,57,45,.25)`,
              background:"transparent",padding:"10px 20px",borderRadius:2,cursor:"pointer"}}>Reset</button>
        </div>
      </div>
    </div>
  );
}

// ── FEE CALCULATOR ───────────────────────────────────────────────────────────
function FeeCalculator(){
  const[merType,setMerType]=useState("MER-MKT");
  const[scope,setScope]=useState("standard");
  const[addons,setAddons]=useState({digital:false,strategy:false,rush:false});
  const toggleAddon=k=>setAddons(a=>({...a,[k]:!a[k]}));
  const merInfo=MER_TYPES.find(t=>t.code===merType);
  const base=FEE_BASE[merType]||[10000,20000];
  const scopeMult=FEE_SCOPE_MULT[scope];
  const addonMult=1+Object.entries(addons).reduce((s,[k,v])=>s+(v?FEE_ADDON_PCT[k]:0),0);
  const low=Math.round(base[0]*scopeMult*addonMult/500)*500;
  const high=Math.round(base[1]*scopeMult*addonMult/500)*500;
  const mid=Math.round((low+high)/2/500)*500;
  const fmt=n=>`RM ${n.toLocaleString()}`;
  const copyQuote=()=>{
    const txt=[
      "MERIDIAN RE ADVISORY — FEE INDICATION",
      `Report Type: ${merType} — ${merInfo?.type}`,
      `Scope Level: ${scope.charAt(0).toUpperCase()+scope.slice(1)}`,
      `Add-ons: ${Object.entries(addons).filter(([,v])=>v).map(([k])=>FEE_ADDON_LABELS[k]).join(", ")||"None"}`,
      ``,
      `Fee Indication: ${fmt(low)} – ${fmt(high)}`,
      `Typical Midpoint: ${fmt(mid)}`,
      ``,
      `This is an indicative range only. Final fees are subject to formal engagement letter.`,
      `Generated: ${new Date().toLocaleDateString()}`,
    ].join("\n");
    navigator.clipboard?.writeText(txt).catch(()=>{});
    downloadText("meridian-fee-indication.txt",txt);
  };
  const scopes=[
    {k:"standard",label:"Standard",desc:"Core deliverable — full report PDF"},
    {k:"enhanced",label:"Enhanced",desc:"+ Briefing deck, executive summary"},
    {k:"premium",label:"Premium",desc:"+ All deliverables, deep-dive research"},
  ];
  return(
    <div style={{background:BG,minHeight:"100vh"}}>
      <div style={{height:60}}/>
      <div style={{maxWidth:900,margin:"0 auto",padding:"48px 32px"}}>
        <SectionLabel num="TOOL" label="Engagement Fee Calculator"/>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(28px,4vw,44px)",
          fontWeight:700,color:INK,margin:"0 0 12px",lineHeight:1.1}}>
          Fee Indication
        </h1>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:14,color:INK_S,margin:"0 0 32px",lineHeight:1.6,maxWidth:540}}>
          Generate an indicative engagement fee range by report type, scope, and add-ons. For strategic pricing guidance — not a formal quotation.
        </p>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:28}}>
          <div>
            <label style={{display:"block",fontFamily:"'Inter',sans-serif",fontSize:11,
              color:INK_M,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:10}}>
              Report Type
            </label>
            <select value={merType} onChange={e=>setMerType(e.target.value)}
              style={{width:"100%",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,
                background:SURFACE,border:`1px solid ${BORDER}`,color:INK,
                borderRadius:2,padding:"11px 12px",cursor:"pointer",boxSizing:"border-box"}}>
              {MER_TYPES.map(t=>(
                <option key={t.code} value={t.code}>{t.code} — {t.type}</option>
              ))}
            </select>
            {merInfo&&(
              <div style={{marginTop:8,fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_M,lineHeight:1.5}}>
                Typical: {merInfo.pages} pages · §{merInfo.sections.join(",")}
              </div>
            )}
          </div>
          <div>
            <label style={{display:"block",fontFamily:"'Inter',sans-serif",fontSize:11,
              color:INK_M,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:10}}>
              Scope Level
            </label>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {scopes.map(s=>(
                <label key={s.k} style={{display:"flex",alignItems:"flex-start",gap:10,
                  padding:"10px 12px",border:`1px solid ${scope===s.k?NAVY:BORDER}`,
                  borderRadius:2,cursor:"pointer",
                  background:scope===s.k?NAVY_DIM:"transparent",transition:"all .15s"}}>
                  <input type="radio" name="scope" value={s.k} checked={scope===s.k}
                    onChange={()=>setScope(s.k)} style={{marginTop:2,accentColor:NAVY}}/>
                  <div>
                    <div style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:600,
                      color:scope===s.k?NAVY:INK}}>{s.label}
                      {s.k==="enhanced"&&<span style={{marginLeft:6,fontFamily:"'IBM Plex Mono',monospace",
                        fontSize:9,color:GOLD,background:GOLD_DIM,
                        border:"1px solid rgba(168,121,40,.2)",padding:"2px 5px",borderRadius:1}}>×1.35</span>}
                      {s.k==="premium"&&<span style={{marginLeft:6,fontFamily:"'IBM Plex Mono',monospace",
                        fontSize:9,color:GOLD,background:GOLD_DIM,
                        border:"1px solid rgba(168,121,40,.2)",padding:"2px 5px",borderRadius:1}}>×1.70</span>}
                    </div>
                    <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_M,marginTop:2}}>{s.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div style={{marginBottom:28}}>
          <label style={{display:"block",fontFamily:"'Inter',sans-serif",fontSize:11,
            color:INK_M,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:10}}>
            Optional Add-ons
          </label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
            {Object.entries(FEE_ADDON_LABELS).map(([k,label])=>(
              <label key={k} style={{display:"flex",alignItems:"center",gap:10,
                padding:"11px 14px",border:`1px solid ${addons[k]?"rgba(168,121,40,.4)":BORDER}`,
                borderRadius:2,cursor:"pointer",
                background:addons[k]?GOLD_DIM:"transparent",transition:"all .15s"}}>
                <input type="checkbox" checked={addons[k]} onChange={()=>toggleAddon(k)}
                  style={{accentColor:GOLD}}/>
                <div>
                  <div style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:600,
                    color:addons[k]?GOLD_B:INK}}>{label}</div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,
                    color:addons[k]?GOLD:INK_M}}>+{Math.round(FEE_ADDON_PCT[k]*100)}%</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="mer-fee-output" style={{background:`linear-gradient(135deg,${NAVY} 0%,#152540 100%)`,borderRadius:3,padding:"28px 32px",marginBottom:20}}>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9.5,color:"rgba(255,255,255,.45)",
            textTransform:"uppercase",letterSpacing:"2px",marginBottom:16}}>Fee Indication</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:20}}>
            {[["Low End",fmt(low)],[`Midpoint`,fmt(mid)],["High End",fmt(high)]].map(([l,v])=>(
              <div key={l}>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:"rgba(255,255,255,.45)",
                  textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:6}}>{l}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:700,
                  color:GOLD_B,lineHeight:1}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"rgba(255,255,255,.35)",
            lineHeight:1.5,borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:14}}>
            Indicative range only · Subject to formal engagement letter · Excludes disbursements & GST
          </div>
        </div>

        <button onClick={copyQuote} className="btn-primary"
          style={{background:NAVY,color:"#fff",border:"none",padding:"11px 24px",borderRadius:2,
            cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:600,
            letterSpacing:"1px",textTransform:"uppercase"}}>
          Download Fee Indication
        </button>
      </div>
    </div>
  );
}

// ── ASSUMPTIONS REGISTER ──────────────────────────────────────────────────────
function AssumptionsRegister(){
  const[items,setItems]=usePersistentState("meridian-assumptions",[]);
  const[form,setForm]=useState({desc:"",source:"",vintage:"",confidence:"High",category:"Market",notes:""});
  const[editing,setEditing]=useState(null);
  const nextNum=useRef(items.length+1);

  const id=(n)=>`A-${String(n).padStart(2,"0")}`;
  const isComplete=(item)=>item.desc&&item.source&&item.vintage;
  const g09ok=items.length>0&&items.every(isComplete);
  const pct=items.length?Math.round(items.filter(isComplete).length/items.length*100):0;

  const addItem=()=>{
    if(!form.desc.trim())return;
    setItems(a=>[...a,{...form,id:id(nextNum.current++)}]);
    setForm({desc:"",source:"",vintage:"",confidence:"High",category:"Market",notes:""});
  };
  const updateItem=(idx,field,val)=>setItems(a=>a.map((x,i)=>i===idx?{...x,[field]:val}:x));
  const delItem=idx=>setItems(a=>a.filter((_,i)=>i!==idx));
  const exportCSV=()=>{
    const csv=[
      ["ID","Category","Description","Source","Data Vintage","Confidence","Notes"],
      ...items.map(a=>[a.id,a.category,a.desc,a.source,a.vintage,a.confidence,a.notes||""]),
    ].map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
    downloadText("meridian-assumptions-register.csv",csv,"text/csv");
  };
  const confColors={High:UP,Medium:AMBER,Indicative:DOWN};

  return(
    <div style={{background:BG,minHeight:"100vh"}}>
      <div style={{height:60}}/>
      <div style={{maxWidth:960,margin:"0 auto",padding:"48px 32px"}}>
        <SectionLabel num="TOOL" label="Assumptions Register"/>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(28px,4vw,44px)",
          fontWeight:700,color:INK,margin:"0 0 12px",lineHeight:1.1}}>
          Key Assumptions Register
        </h1>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:14,color:INK_S,margin:"0 0 28px",lineHeight:1.6,maxWidth:540}}>
          G-09 requires a numbered, complete assumptions register. Each assumption must carry a source, data vintage, and confidence rating.
        </p>

        <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,
          padding:"16px 20px",marginBottom:24,display:"flex",
          alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:INK_M,
              textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:6}}>G-09 Status</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,
              color:g09ok?UP:items.length===0?INK_M:AMBER}}>
              {items.length===0?"No assumptions registered":g09ok?"Complete — all assumptions sourced":`${items.filter(isComplete).length}/${items.length} complete`}
            </div>
          </div>
          {items.length>0&&(
            <div style={{flex:1,minWidth:160,maxWidth:260}}>
              <div style={{height:4,background:BORDER_L,borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct}%`,
                  background:g09ok?UP:AMBER,borderRadius:2,transition:"width .3s"}}/>
              </div>
            </div>
          )}
        </div>

        <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,
          padding:"18px 20px",marginBottom:24}}>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_M,
            textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:14}}>Add Assumption</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div style={{gridColumn:"1/-1"}}>
              <input value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))}
                placeholder="Assumption description *"
                style={{width:"100%",fontFamily:"'Inter',sans-serif",fontSize:13,
                  background:SURFACE_S,border:`1px solid ${BORDER}`,color:INK,
                  borderRadius:2,padding:"10px 12px",boxSizing:"border-box"}}/>
            </div>
            <input value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))}
              placeholder="Source (e.g. JPPH, Rahim & Co) *"
              style={{fontFamily:"'Inter',sans-serif",fontSize:13,background:SURFACE_S,
                border:`1px solid ${BORDER}`,color:INK,borderRadius:2,padding:"10px 12px",boxSizing:"border-box"}}/>
            <input value={form.vintage} onChange={e=>setForm(f=>({...f,vintage:e.target.value}))}
              placeholder="Data vintage (e.g. Q3 2025) *"
              style={{fontFamily:"'Inter',sans-serif",fontSize:13,background:SURFACE_S,
                border:`1px solid ${BORDER}`,color:INK,borderRadius:2,padding:"10px 12px",boxSizing:"border-box"}}/>
            <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}
              style={{fontFamily:"'Inter',sans-serif",fontSize:12,background:SURFACE_S,
                border:`1px solid ${BORDER}`,color:INK_S,borderRadius:2,padding:"10px 12px",cursor:"pointer"}}>
              {["Market","Financial","Legal","Construction","Macro","Other"].map(c=><option key={c}>{c}</option>)}
            </select>
            <select value={form.confidence} onChange={e=>setForm(f=>({...f,confidence:e.target.value}))}
              style={{fontFamily:"'Inter',sans-serif",fontSize:12,background:SURFACE_S,
                border:`1px solid ${BORDER}`,color:INK_S,borderRadius:2,padding:"10px 12px",cursor:"pointer"}}>
              {["High","Medium","Indicative"].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={addItem} className="btn-primary"
            style={{background:NAVY,color:"#fff",border:"none",padding:"10px 20px",borderRadius:2,
              cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:600,
              letterSpacing:"1px",textTransform:"uppercase"}}>
            + Add Assumption
          </button>
        </div>

        {items.length>0&&(
          <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:3,overflow:"hidden",marginBottom:20}}>
            <div style={{display:"grid",gridTemplateColumns:"52px 1fr 100px 120px 90px 80px 28px",
              padding:"10px 16px",background:SURFACE_S,borderBottom:`1px solid ${BORDER}`,gap:8}}>
              {["ID","Description","Category","Source","Vintage","Confidence",""].map((h,i)=>(
                <span key={i} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:INK_M,
                  textTransform:"uppercase",letterSpacing:"0.5px"}}>{h}</span>
              ))}
            </div>
            {items.map((a,idx)=>(
              <div key={idx} style={{display:"grid",
                gridTemplateColumns:"52px 1fr 100px 120px 90px 80px 28px",
                padding:"11px 16px",gap:8,alignItems:"start",
                borderBottom:idx<items.length-1?`1px solid ${BORDER_L}`:"none",
                background:idx%2===0?"transparent":SURFACE_S}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,
                  color:NAVY,fontWeight:600}}>{a.id}</span>
                <input value={a.desc} onChange={e=>updateItem(idx,"desc",e.target.value)}
                  style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:INK,
                    background:"transparent",border:`1px solid transparent`,borderRadius:2,
                    padding:"3px 6px",width:"100%",boxSizing:"border-box",
                    transition:"border-color .15s"}}
                  onFocus={e=>{e.target.style.borderColor=NAVY;e.target.style.background=SURFACE;}}
                  onBlur={e=>{e.target.style.borderColor="transparent";e.target.style.background="transparent";}}/>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_M}}>{a.category}</span>
                <input value={a.source} onChange={e=>updateItem(idx,"source",e.target.value)}
                  style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_S,
                    background:"transparent",border:`1px solid transparent`,borderRadius:2,
                    padding:"3px 6px",width:"100%",boxSizing:"border-box"}}
                  onFocus={e=>{e.target.style.borderColor=NAVY;e.target.style.background=SURFACE;}}
                  onBlur={e=>{e.target.style.borderColor="transparent";e.target.style.background="transparent";}}/>
                <input value={a.vintage} onChange={e=>updateItem(idx,"vintage",e.target.value)}
                  style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:INK_S,
                    background:"transparent",border:`1px solid transparent`,borderRadius:2,
                    padding:"3px 6px",width:"100%",boxSizing:"border-box"}}
                  onFocus={e=>{e.target.style.borderColor=NAVY;e.target.style.background=SURFACE;}}
                  onBlur={e=>{e.target.style.borderColor="transparent";e.target.style.background="transparent";}}/>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:600,
                  color:confColors[a.confidence]||INK_M}}>{a.confidence}</span>
                <button onClick={()=>delItem(idx)} aria-label="Delete assumption"
                  style={{background:"none",border:"none",color:INK_F,cursor:"pointer",fontSize:15,
                    padding:0,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>
            ))}
          </div>
        )}

        <div className="tool-actions no-print">
          <button onClick={exportCSV} className="btn-primary" disabled={items.length===0}
            style={{background:items.length?NAVY:INK_F,color:"#fff",border:"none",padding:"10px 20px",
              borderRadius:2,cursor:items.length?"pointer":"default",
              fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:600}}>Export CSV</button>
          <button onClick={()=>window.print()} className="btn-outline"
            style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:INK_S,border:`1px solid ${BORDER}`,
              background:"transparent",padding:"10px 20px",borderRadius:2,cursor:"pointer"}}>Print</button>
          {items.length>0&&<button onClick={()=>{if(window.confirm("Clear all assumptions?"))setItems([]);}}
            className="btn-outline"
            style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:DOWN,
              border:`1px solid rgba(176,57,45,.25)`,
              background:"transparent",padding:"10px 20px",borderRadius:2,cursor:"pointer"}}>Reset</button>}
        </div>
      </div>
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App(){
  const initialRoute=()=>{
    const route=window.location.hash.replace(/^#\/?/,"");
    return ROUTES.some(r=>r.id===route)?route:"landing";
  };
  const[page,setPage]=useState(initialRoute);
  const[booted,setBooted]=useState(()=>sessionStorage.getItem("meridian-booted")==="1"||initialRoute()!=="landing");
  const[commandOpen,setCommandOpen]=useState(false);
  const[kbdOpen,setKbdOpen]=useState(false);
  const[favorites,setFavorites]=usePersistentState("meridian-fav-reports",[]);
  const[recentPages,setRecentPages]=usePersistentState("meridian-recent",[]);
  const scrollRef=useRef(null);

  const navigate=useCallback((next)=>{
    if(!ROUTES.some(r=>r.id===next))next="landing";
    if(window.location.hash!==`#/${next}`)window.history.pushState(null,"",`#/${next}`);
    setPage(next);
    window.scrollTo({top:0,behavior:"auto"});
    setRecentPages(prev=>{
      const filtered=prev.filter(p=>p!==next);
      return[next,...filtered].slice(0,8);
    });
  },[setRecentPages]);

  const enterApp=useCallback(()=>navigate("dashboard"),[navigate]);
  const goHome=useCallback(()=>navigate("landing"),[navigate]);
  const goTool=useCallback((tool)=>navigate(tool),[navigate]);

  const toggleFavorite=useCallback((code)=>{
    setFavorites(f=>f.includes(code)?f.filter(c=>c!==code):[...f,code]);
  },[setFavorites]);

  useEffect(()=>{
    const onHash=()=>setPage(initialRoute());
    window.addEventListener("hashchange",onHash);
    return()=>window.removeEventListener("hashchange",onHash);
  },[]);
  useEffect(()=>{
    const route=ROUTES.find(r=>r.id===page);
    document.title=`${route?.label||"Advisory OS"} | Meridian RE Advisory`;
    window.scrollTo({top:0,behavior:"auto"});
  },[page]);
  useEffect(()=>{
    const onKey=e=>{
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){
        e.preventDefault();setCommandOpen(v=>!v);
      }
      if(e.key==="?"&&!e.metaKey&&!e.ctrlKey&&
         e.target.tagName!=="INPUT"&&e.target.tagName!=="TEXTAREA"){
        e.preventDefault();setKbdOpen(v=>!v);
      }
    };
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[]);

  const onBack=useCallback(()=>{
    if(page==="dashboard")goHome();
    else navigate("dashboard");
  },[page,goHome,navigate]);

  const showPlatformNav=!["framework","playbook","standards","sample"].includes(page);
  const finishBoot=()=>{sessionStorage.setItem("meridian-booted","1");setBooted(true);};

  return(
    <>
      <style>{CSS}</style>
      <a className="skip-link" href="#main-content">Skip to content</a>
      {!booted&&<Boot onDone={finishBoot}/>}
      {booted&&(
        <>
          {showPlatformNav&&<Nav page={page} onBack={onBack} onNavigate={navigate} onOpenCommand={()=>setCommandOpen(true)}/>}
          <main id="main-content">
            <React.Suspense fallback={<div className="page-loader">Loading…</div>}>
              <div key={page} className="page-fade">
                {page==="landing"&&(
                  <div style={{paddingTop:60,height:"100vh",overflow:"hidden",boxSizing:"border-box"}}>
                    <LandingPage onEnter={enterApp} scrollRef={scrollRef} active={page==="landing"}/>
                  </div>
                )}
                {page==="dashboard"&&<Dashboard onTool={goTool} onNavigate={navigate}
                  favorites={favorites} onToggleFavorite={toggleFavorite} recentPages={recentPages}/>}
                {page==="checker"&&<GuardrailChecker/>}
                {page==="risk"&&<RiskScorer/>}
                {page==="fee"&&<FeeCalculator/>}
                {page==="assumptions"&&<AssumptionsRegister/>}
                {page==="framework"&&<Framework onNavigate={navigate}/>}
                {page==="playbook"&&<Playbook onNavigate={navigate}/>}
                {page==="standards"&&<Standards onNavigate={navigate}/>}
                {page==="sample"&&<SampleReport/>}
              </div>
            </React.Suspense>
          </main>
          <GlobalLauncher onOpen={()=>setCommandOpen(true)}/>
          <CommandCenter open={commandOpen} onClose={()=>setCommandOpen(false)} onNavigate={navigate} current={page}/>
          {page!=="landing"&&<BackToTop/>}
          {kbdOpen&&<KeyboardHelp onClose={()=>setKbdOpen(false)}/>}
        </>
      )}
    </>
  );
}
