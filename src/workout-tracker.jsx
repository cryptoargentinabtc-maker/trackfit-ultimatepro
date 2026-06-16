import { useState, useRef, useEffect } from "react";

const boot = () => {
  if (document.getElementById("tfU")) return;
  const s = document.createElement("style");
  s.id = "tfU";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600;700;800&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    @keyframes up  {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pop {0%{transform:scale(.88);opacity:0}65%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.2}}
    .up {animation:up  .3s cubic-bezier(.22,1,.36,1) both;}
    .pop{animation:pop .35s cubic-bezier(.22,1,.36,1) both;}
    .tap:active{opacity:.65;transform:scale(.97);}
    input,textarea,button,select{font-family:'Inter',sans-serif;}
    input[type=number]::-webkit-inner-spin-button{opacity:.3;}
    ::-webkit-scrollbar{width:2px;}
    ::-webkit-scrollbar-thumb{background:#222;border-radius:2px;}
  `;
  document.head.appendChild(s);
};

const T = {
  bg:"#080808", surf:"#0f0f0f", card:"#141414",
  border:"#1e1e1e", borderB:"#2c2c2c",
  acc:"#C8FF00",
  red:"#FF3B3B", blue:"#2196F3", green:"#00E676",
  orange:"#FF6D00", purple:"#CE93D8", cyan:"#00E5FF",
  gold:"#FFD600",
  text:"#F0F0F0", muted:"#484848", dim:"#1a1a1a",
};

const uid  = () => Math.random().toString(36).slice(2,10);
const td   = () => new Date().toISOString().split("T")[0];
const fmtD = d => { try{const[y,m,dd]=d.split("-");return`${dd}/${m}`;}catch{return d;} };
const calc1RM = (w,r) => r===1?w:Math.round(w*(1+r/30));

const BB = ({c,s=18,ls="0.04em",children,style={}}) =>
  <span style={{fontFamily:"'Bebas Neue'",fontSize:s,color:c||T.text,letterSpacing:ls,...style}}>{children}</span>;
const MM = ({c,s=10,bold=false,children}) =>
  <span style={{fontFamily:"'DM Mono',monospace",fontSize:s,color:c||T.muted,fontWeight:bold?"600":"400",letterSpacing:"0.04em"}}>{children}</span>;
const Chip = ({c=T.acc,tiny=false,children}) =>
  <span style={{background:c+"18",color:c,border:`1px solid ${c}28`,borderRadius:5,padding:tiny?"1px 6px":"3px 10px",fontSize:tiny?9:10,fontWeight:700,letterSpacing:"0.05em",whiteSpace:"nowrap",fontFamily:"'DM Mono',monospace"}}>{children}</span>;
const Row = ({children,g=0,j="flex-start",a="center",wrap=false,style={}}) =>
  <div style={{display:"flex",alignItems:a,justifyContent:j,gap:g,flexWrap:wrap?"wrap":"nowrap",...style}}>{children}</div>;
const HR = ({ml=0}) => <div style={{height:1,background:T.border,marginLeft:ml}}/>;
const INP = (extra={}) => ({background:T.card,border:`1px solid ${T.borderB}`,borderRadius:10,padding:"10px 13px",color:T.text,fontSize:14,outline:"none",width:"100%",...extra});

/* ─── LIFT META ──────────────────────────────────────────── */
const LIFT_META = {
  squat:    {name:"Sentadilla con barra", unit:"kg",  icon:"🏋️"},
  rdl:      {name:"Peso Muerto Rumano",   unit:"kg",  icon:"💪"},
  bulg:     {name:"Búlgara con Salto",    unit:"kg",  icon:"🦵"},
  hipthrust:{name:"Hip Thrust",           unit:"kg",  icon:"🍑"},
  boxjump:  {name:"Box Jumps",            unit:"cm",  icon:"📦"},
  bench:    {name:"Press Banca",          unit:"kg",  icon:"🔱"},
  ohp:      {name:"Press Militar",        unit:"kg",  icon:"🙌"},
  pushpress:{name:"Push Press",           unit:"kg",  icon:"⚡"},
  row:      {name:"Remo Pendlay",         unit:"kg",  icon:"🔄"},
  pullup:   {name:"Dominadas",            unit:"kg",  icon:"🦍"},
  curl:     {name:"Curl Martillo",        unit:"kg",  icon:"💪"},
  tricep:   {name:"Press Francés",        unit:"kg",  icon:"🦾"},
  slam:     {name:"Slam Ball",            unit:"kg",  icon:"💥"},
  run:      {name:"Carrera Zona 2",       unit:"min", icon:"🏃"},
  sprint:   {name:"Sprint / Tempo",       unit:"min", icon:"⚡"},
  plank:    {name:"Plancha",              unit:"s",   icon:"⬜"},
};

const SUPPS = [
  {id:"creatine",name:"Creatina",  dose:"5g",    icon:"⚗️",color:T.blue,  timing:"Desayuno — todos los días"},
  {id:"omega3",  name:"Omega 3",   dose:"2-3g",  icon:"🐟",color:T.cyan,  timing:"Con el desayuno o almuerzo"},
  {id:"protein", name:"Proteína",  dose:"25-30g",icon:"🥛",color:T.purple,timing:"Post-entreno ≤40 min",optional:true},
];

/* ─── DEFAULT WEEK ───────────────────────────────────────── */
const mkEx = (o) => ({id:uid(), trackable:false, xfer:false, link:"", focus:"", liftKey:"", tip:"", sets:"", reps:"", rest:"", phase:"", phaseColor:T.blue, name:"", ...o});

const DEFAULT_WEEK = [
  {
    id:"lun",day:"LUN",label:"TREN INFERIOR",icon:"🦵",color:T.acc,
    goal:"Fuerza + Explosividad",duration:"55-65 min",
    why:"Lunes con el cuerpo descansado = mejor día para tren inferior pesado.",
    coachNote:"No vayas al fallo absoluto — mañana es tren superior.",
    nutrition:{pre:"Avena + banana 30-60 min antes. Creatina.",post:"Batido proteína + carbos dentro de 40 min."},
    exercises:[
      mkEx({name:"Movilidad cadera",sets:"",reps:"10 c/lado",rest:"",phase:"CALENTAMIENTO",phaseColor:T.cyan,tip:"Círculos completos. Abrí la cadera antes de cargar."}),
      mkEx({name:"Sentadilla sin peso",sets:"2",reps:"10",rest:"",phase:"CALENTAMIENTO",phaseColor:T.cyan,tip:"Bajá lento, subí rápido."}),
      mkEx({name:"Sentadilla con barra",sets:"4",reps:"6-8",rest:"90s",phase:"A — FUERZA BASE",phaseColor:T.red,tip:"Excéntrico 3s → explosivo. Última rep que cueste pero no falle.",xfer:true,trackable:true,liftKey:"squat",focus:"Fuerza + primer paso"}),
      mkEx({name:"Peso Muerto Rumano",sets:"4",reps:"8-10",rest:"90s",phase:"A — FUERZA BASE",phaseColor:T.red,tip:"Isquios tensos. Espalda neutra siempre.",trackable:true,liftKey:"rdl"}),
      mkEx({name:"Box Jumps",sets:"4",reps:"8",rest:"90s",phase:"B — EXPLOSIVIDAD",phaseColor:T.orange,tip:"Registrá la ALTURA del cajón en cm. Empezá en 40-50cm. Subí 5cm cuando las 8 reps sean fáciles.",xfer:true,trackable:true,liftKey:"boxjump",focus:"Explosividad + primer paso"}),
      mkEx({name:"Búlgara con Salto",sets:"3",reps:"6 c/pierna",rest:"60s",phase:"B — EXPLOSIVIDAD",phaseColor:T.orange,tip:"Sin peso o mancuernas leves. Empujá el piso, salí disparado.",xfer:true,trackable:true,liftKey:"bulg",focus:"Cambio dirección"}),
      mkEx({name:"Hip Thrust single-leg",sets:"3",reps:"10 c/pierna",rest:"60s",phase:"B — EXPLOSIVIDAD",phaseColor:T.orange,tip:"Empuje rápido. Contracción máxima arriba.",xfer:true,trackable:true,liftKey:"hipthrust",focus:"Potencia remate"}),
      mkEx({name:"Plancha frontal",sets:"3",reps:"50s",rest:"",phase:"C — CORE",phaseColor:T.purple,tip:"Core apretado. No hundas las caderas.",trackable:true,liftKey:"plank"}),
      mkEx({name:"Dead bug con banda",sets:"3",reps:"10 c/lado",rest:"",phase:"C — CORE",phaseColor:T.purple,tip:"Espalda baja pegada al suelo.",xfer:true}),
      mkEx({name:"Estiramiento psoas",sets:"",reps:"60s c/lado",rest:"",phase:"VUELTA A LA CALMA",phaseColor:T.green,tip:"OBLIGATORIO después de día de piernas."}),
      mkEx({name:"Estiramiento piriforme",sets:"",reps:"60s c/lado",rest:"",phase:"VUELTA A LA CALMA",phaseColor:T.green}),
    ]
  },
  {
    id:"mar",day:"MAR",label:"TREN SUPERIOR",icon:"💪",color:T.purple,
    goal:"Potencia + Fuerza",duration:"60-70 min",
    why:"Tren superior mientras el inferior recupera. Push Press es el ejercicio más importante.",
    coachNote:"Mañana es motor aeróbico — no lo salteés.",
    nutrition:{pre:"Tostadas + maní + café. Creatina.",post:"Batido proteína + carbos."},
    exercises:[
      mkEx({name:"Band pull-apart",sets:"2",reps:"20",rest:"",phase:"CALENTAMIENTO",phaseColor:T.cyan,tip:"Escápulas atrás. Activa posterior del hombro."}),
      mkEx({name:"Flexiones explosivas rodillas",sets:"2",reps:"8",rest:"",phase:"CALENTAMIENTO",phaseColor:T.cyan,tip:"Despegá las manos del piso."}),
      mkEx({name:"Push Press",sets:"5",reps:"4-5",rest:"2-3min",phase:"A — POTENCIA",phaseColor:T.red,tip:"65-75% del máximo. Explosión desde piernas → bloqueo arriba.",xfer:true,trackable:true,liftKey:"pushpress",focus:"Potencia + posición"}),
      mkEx({name:"Slam Ball Slam",sets:"4",reps:"8",rest:"90s",phase:"A — POTENCIA",phaseColor:T.red,tip:"Máxima velocidad. Variantes: overhead, rotacional.",xfer:true,trackable:true,liftKey:"slam",focus:"Desmarque explosivo"}),
      mkEx({name:"Press Banca",sets:"4",reps:"6-8",rest:"2min",phase:"B — FUERZA",phaseColor:T.blue,tip:"75-85% del máximo. Bajar 3s → subir explosivo.",trackable:true,liftKey:"bench"}),
      mkEx({name:"Remo Pendlay",sets:"4",reps:"6-8",rest:"2min",phase:"B — FUERZA",phaseColor:T.blue,tip:"Explosivo desde el piso. Espalda paralela.",xfer:true,trackable:true,liftKey:"row"}),
      mkEx({name:"Dominadas",sets:"4",reps:"6-8",rest:"2min",phase:"B — FUERZA",phaseColor:T.blue,tip:"0kg = peso corporal. Rango completo.",trackable:true,liftKey:"pullup"}),
      mkEx({name:"Face Pull con banda",sets:"3",reps:"15-20",rest:"45s",phase:"C — ACCESORIOS",phaseColor:T.orange,tip:"Codos altos. Salud del manguito rotador."}),
      mkEx({name:"Curl Martillo",sets:"3",reps:"12",rest:"",phase:"C — ACCESORIOS",phaseColor:T.orange,trackable:true,liftKey:"curl"}),
      mkEx({name:"Pallof Press",sets:"3",reps:"10 c/lado",rest:"",phase:"CORE ROTACIONAL",phaseColor:T.purple,tip:"Anti-rotación pura.",xfer:true}),
      mkEx({name:"Russian Twist con peso",sets:"3",reps:"20 total",rest:"",phase:"CORE ROTACIONAL",phaseColor:T.purple,xfer:true}),
      mkEx({name:"Estiramiento pectoral",sets:"",reps:"45s c/lado",rest:"",phase:"VUELTA A LA CALMA",phaseColor:T.green}),
    ]
  },
  {
    id:"mie",day:"MIE",label:"MOTOR + CARDIO",icon:"🧠",color:T.cyan,
    goal:"Motor Aeróbico + Técnica",duration:"50-60 min",
    why:"ACÁ SE CONSTRUYE EL MOTOR DEL MIN 15-25. Sin este día el partido se cae en el segundo tiempo.",
    coachNote:"El día más subestimado. El Zona 2 es lo que te diferencia al final del partido.",
    nutrition:{pre:"Fruta + agua. Sin comida pesada.",post:"Proteína moderada + carbos."},
    exercises:[
      mkEx({name:"Carrera Zona 2",sets:"1",reps:"20 min",rest:"",phase:"ZONA 2",phaseColor:T.acc,tip:"65-75% FC máx = 124-143 ppm. Podés hablar pero no cantar.",xfer:true,trackable:true,liftKey:"run",focus:"Motor min 15-25"}),
      mkEx({name:"Caminadora Zona 3 Tempo",sets:"1",reps:"10 min",rest:"",phase:"ZONA 3",phaseColor:T.orange,tip:"75-85% FC máx = 143-162 ppm.",xfer:true,trackable:true,liftKey:"sprint",focus:"Resistencia final"}),
      mkEx({name:"Agility ladder",sets:"4",reps:"10m c/variante",rest:"",phase:"COORDINACIÓN",phaseColor:T.blue,tip:"Precisión del movimiento, no velocidad máxima.",xfer:true}),
      mkEx({name:"Conducción con conos",sets:"4",reps:"30s",rest:"15s",phase:"COORDINACIÓN",phaseColor:T.blue,tip:"Curvas cerradas. Interior/exterior del pie.",xfer:true}),
      mkEx({name:"Sprints con cambio dirección",sets:"6",reps:"20m",rest:"30s",phase:"COORDINACIÓN",phaseColor:T.blue,tip:"Sprint 10m → cambio → sprint 10m.",xfer:true}),
      mkEx({name:"Estiramiento psoas",sets:"",reps:"60s c/lado",rest:"",phase:"VUELTA A LA CALMA",phaseColor:T.green}),
    ]
  },
  {
    id:"jue",day:"JUE",label:"JUEGO MIXTO",icon:"⚽",color:T.blue,
    goal:"Técnica + Recuperación",duration:"60-70 min",
    why:"Menor demanda. Posicionamiento y visión. Conservá energía para el viernes.",
    coachNote:"Si sentís el cuerpo pesado, jugá al 70%. El sábado es lo que importa.",
    nutrition:{pre:"500ml agua 2h antes.",post:"Cena: arroz/pasta + pollo."},
    exercises:[
      mkEx({name:"Trote progresivo",sets:"",reps:"5 min",rest:"",phase:"PRE-JUEGO",phaseColor:T.blue}),
      mkEx({name:"Movilidad dinámica",sets:"",reps:"5 min",rest:"",phase:"PRE-JUEGO",phaseColor:T.blue}),
      mkEx({name:"Partido mixto",sets:"",reps:"2×20 min",rest:"",phase:"JUEGO",phaseColor:T.blue,tip:"MENOS intensidad que viernes. Posicionamiento y toque."}),
      mkEx({name:"Estiramiento psoas",sets:"",reps:"60s c/lado",rest:"",phase:"POST-JUEGO",phaseColor:T.green}),
      mkEx({name:"Estiramiento piriforme",sets:"",reps:"60s c/lado",rest:"",phase:"POST-JUEGO",phaseColor:T.green}),
    ]
  },
  {
    id:"vie",day:"VIE",label:"FÚTBOL 5",icon:"🔥",color:T.orange,
    goal:"Alta Intensidad + Preparación",duration:"70-80 min",
    why:"Puro changos — alta exigencia real. Ensayo general del sábado.",
    coachNote:"NOCHE DEL VIERNES: pasta o arroz con pollo. 8 horas de sueño.",
    nutrition:{pre:"2-3h antes: arroz + pollo. 30 min: banana.",post:"Agua + electrolitos. Cena con carbos. DORMÍ 8H."},
    exercises:[
      mkEx({name:"Trote progresivo",sets:"",reps:"4 min",rest:"",phase:"CALENTAMIENTO",phaseColor:T.orange,tip:"40% → 60% → 75%"}),
      mkEx({name:"Sprints progresivos 20m",sets:"4",reps:"1",rest:"30s",phase:"CALENTAMIENTO",phaseColor:T.orange,tip:"50% → 70% → 85% → 95%. ACÁ CRUZÁS EL PRIMER AHOGO.",xfer:true,focus:"Cruzar primer ahogo"}),
      mkEx({name:"Partido Fútbol 5",sets:"",reps:"50 min",rest:"",phase:"PARTIDO",phaseColor:T.orange,tip:"Presión alta primeros 10 min. Marcá el ritmo.",xfer:true}),
      mkEx({name:"Estiramiento psoas",sets:"",reps:"90s c/lado",rest:"",phase:"POST-PARTIDO",phaseColor:T.green,tip:"CRÍTICO. Mañana es el campeonato."}),
      mkEx({name:"Foam rolling cuádriceps",sets:"",reps:"2 min",rest:"",phase:"POST-PARTIDO",phaseColor:T.green}),
    ]
  },
  {
    id:"sab",day:"SAB",label:"CAMPEONATO",icon:"🏆",color:T.acc,
    goal:"Rendimiento Máximo",duration:"20 min pre + partido",
    why:"Toda la semana se construyó para este momento.",
    coachNote:"Confiá en el trabajo. Toda la semana estuvo bien.",
    nutrition:{pre:"3h antes: arroz + proteína. 45 min: banana + café.",post:"Fruta + isotónica. 2h: comida completa."},
    exercises:[
      mkEx({name:"Trote suave progresivo",sets:"",reps:"5 min",rest:"",phase:"CALENTAMIENTO 20 MIN",phaseColor:T.acc}),
      mkEx({name:"Movilidad dinámica",sets:"",reps:"3 min",rest:"",phase:"CALENTAMIENTO 20 MIN",phaseColor:T.acc}),
      mkEx({name:"Sprints progresivos 20m",sets:"4",reps:"50→95%",rest:"30s",phase:"CALENTAMIENTO 20 MIN",phaseColor:T.acc,tip:"ACÁ CRUZÁS EL PRIMER AHOGO antes del pitazo.",xfer:true,focus:"El secreto del partido"}),
      mkEx({name:"PRIMER TIEMPO",sets:"",reps:"25 min",rest:"",phase:"PARTIDO",phaseColor:T.acc,tip:"Presión alta primeros 5 min. Marcá el ritmo del equipo.",xfer:true}),
      mkEx({name:"Hidratación medio tiempo",sets:"",reps:"300-500ml",rest:"",phase:"MEDIO TIEMPO",phaseColor:T.muted}),
      mkEx({name:"SEGUNDO TIEMPO",sets:"",reps:"25 min",rest:"",phase:"PARTIDO",phaseColor:T.red,tip:"Zona 2 del miércoles te sostiene. El rival se cansa — vos no.",xfer:true,focus:"Diferencia física min 40+"}),
      mkEx({name:"Estiramiento psoas",sets:"",reps:"90s c/lado",rest:"",phase:"POST-PARTIDO",phaseColor:T.green}),
      mkEx({name:"Foam rolling piernas",sets:"",reps:"5 min",rest:"",phase:"POST-PARTIDO",phaseColor:T.green}),
    ]
  },
  {
    id:"dom",day:"DOM",label:"RECUPERACIÓN",icon:"🧘",color:T.green,
    goal:"Recuperación Activa",duration:"30-40 min",
    why:"El domingo es tan importante como el lunes. La adaptación pasa en el descanso.",
    coachNote:"Sin cargas. No te trasnoches.",
    nutrition:{pre:"2-3 litros de agua.",post:"Proteína moderada. Caldos para las articulaciones."},
    exercises:[
      mkEx({name:"Estiramiento psoas profundo",sets:"",reps:"90s c/lado",rest:"",phase:"RECUPERACIÓN",phaseColor:T.green}),
      mkEx({name:"Estiramiento piriforme",sets:"",reps:"90s c/lado",rest:"",phase:"RECUPERACIÓN",phaseColor:T.green}),
      mkEx({name:"Hip flexor lunge profundo",sets:"",reps:"60s c/lado",rest:"",phase:"RECUPERACIÓN",phaseColor:T.green}),
      mkEx({name:"Foam rolling piernas",sets:"",reps:"10 min",rest:"",phase:"RECUPERACIÓN",phaseColor:T.green}),
      mkEx({name:"Movilidad cadera CARs",sets:"",reps:"10 c/lado",rest:"",phase:"RECUPERACIÓN",phaseColor:T.green}),
      mkEx({name:"Respiración diafragmática",sets:"",reps:"5 min",rest:"",phase:"RECUPERACIÓN",phaseColor:T.green,tip:"4s inhalar, 6s exhalar."}),
    ]
  },
];

/* ─── REST TIMER ─────────────────────────────────────────── */
function RestTimer({seconds,onClose}){
  const[sec,setSec]=useState(seconds);
  const[run,setRun]=useState(true);
  const ref=useRef();
  useEffect(()=>{
    if(!run){clearInterval(ref.current);return;}
    ref.current=setInterval(()=>setSec(s=>{if(s<=1){clearInterval(ref.current);setRun(false);return 0;}return s-1;}),1000);
    return()=>clearInterval(ref.current);
  },[run]);
  const r=46,circ=2*Math.PI*r,pct=sec/seconds;
  const col=sec>seconds*0.5?T.green:sec>seconds*0.25?T.acc:T.red;
  const m=Math.floor(sec/60),ss=sec%60;
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"#000000e8",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} className="pop" style={{background:T.surf,border:`1px solid #2a2a2a`,borderRadius:24,padding:"36px 50px",textAlign:"center"}}>
        <BB c={T.muted} s={11} ls="0.22em">DESCANSO</BB>
        <div style={{position:"relative",width:130,height:130,margin:"18px auto 22px"}}>
          <svg width={130} height={130} style={{transform:"rotate(-90deg)"}}>
            <circle cx={65} cy={65} r={r} fill="none" stroke={T.dim} strokeWidth={7}/>
            <circle cx={65} cy={65} r={r} fill="none" stroke={col} strokeWidth={7}
              strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round"
              style={{transition:"stroke-dashoffset .95s linear,stroke .3s",filter:`drop-shadow(0 0 10px ${col})`}}/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
            <BB s={44} c={col}>{m>0?`${m}:${String(ss).padStart(2,"0")}`:sec}</BB>
            <MM s={9}>SEG</MM>
          </div>
        </div>
        <Row g={10} j="center">
          <button onClick={()=>setRun(r=>!r)} style={{background:T.card,border:`1px solid #333`,borderRadius:12,padding:"11px 22px",color:T.text,fontSize:13,fontWeight:600,cursor:"pointer"}}>{run?"⏸":"▶"}</button>
          <button onClick={onClose} style={{background:col+"22",border:`1px solid ${col}`,borderRadius:12,padding:"11px 28px",color:col,fontSize:13,fontWeight:700,cursor:"pointer"}}>LISTO ✓</button>
        </Row>
      </div>
    </div>
  );
}

/* ─── LOG MODAL ──────────────────────────────────────────── */
function LogModal({exercise,history,onSave,onClose}){
  const lm = LIFT_META[exercise.liftKey] || {unit:"kg",name:exercise.name};
  const isBoxJ = exercise.liftKey === "boxjump";
  const isTime = lm.unit === "min" || lm.unit === "s";
  const prev = [...history].filter(h=>h.liftKey===exercise.liftKey).sort((a,b)=>b.date.localeCompare(a.date))[0];
  const initSets = prev
    ? prev.sets.map(s=>({reps:s.reps,weight:s.weight,done:false}))
    : [{reps:isBoxJ?8:10,weight:isBoxJ?50:0,done:false},{reps:isBoxJ?8:10,weight:isBoxJ?50:0,done:false},{reps:isBoxJ?8:10,weight:isBoxJ?50:0,done:false},{reps:isBoxJ?8:10,weight:isBoxJ?50:0,done:false}];
  const[sets,setSets]=useState(initSets);
  const[notes,setNotes]=useState("");
  const[saved,setSaved]=useState(false);
  const[timer,setTimer]=useState(null);
  const upd=(i,f,v)=>setSets(p=>p.map((s,idx)=>idx===i?{...s,[f]:f==="done"?v:Number(v)}:s));
  const maxW=Math.max(...sets.map(s=>s.weight),0);
  const totalV=isTime?sets.reduce((a,s)=>a+s.reps,0):sets.reduce((a,s)=>a+s.reps*s.weight,0);
  const best1RM=(!isBoxJ&&!isTime)?sets.reduce((b,s)=>Math.max(b,calc1RM(s.weight,s.reps)),0):0;

  function doSave(){
    onSave({id:uid(),liftKey:exercise.liftKey,liftName:exercise.name,unit:lm.unit,date:td(),
      sets:sets.map(s=>({reps:s.reps,weight:s.weight})),notes:notes,maxWeight:maxW,totalVolume:totalV});
    setSaved(true);
  }

  const inp = INP({textAlign:"center",fontSize:15});

  if(saved) return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"#000000e8",zIndex:500,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} className="up" style={{background:T.surf,borderRadius:"22px 22px 0 0",padding:"40px 24px",width:"100%",maxWidth:480,margin:"0 auto",textAlign:"center",border:`1px solid ${T.borderB}`}}>
        <div className="pop" style={{width:64,height:64,background:T.green,borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 16px"}}>✅</div>
        <BB s={28} c={T.acc}>GUARDADO</BB>
        <div style={{marginTop:14,background:T.card,borderRadius:12,padding:"14px",display:"flex",flexDirection:"column",gap:6}}>
          {sets.map((s,i)=>(
            <Row key={i} j="space-between" style={{padding:"7px 10px",background:T.dim,borderRadius:8}}>
              <MM s={10}>Serie {i+1}</MM>
              <MM s={13} c={T.acc} bold>
                {isBoxJ?`${s.reps} saltos — ${s.weight}cm`:isTime?`${s.reps} ${lm.unit}`:`${s.reps} reps × ${s.weight} ${lm.unit}`}
              </MM>
            </Row>
          ))}
          {!isBoxJ&&!isTime&&<Row j="space-between" style={{marginTop:4}}><MM s={10}>Volumen</MM><MM s={12} c={T.acc} bold>{totalV.toLocaleString()} kg</MM></Row>}
          {best1RM>0&&<Row j="space-between"><MM s={10}>1RM estimado</MM><MM s={12} c={T.purple} bold>≈{best1RM} kg</MM></Row>}
        </div>
        <button onClick={onClose} className="tap" style={{marginTop:18,width:"100%",background:T.acc,color:T.bg,border:"none",borderRadius:12,padding:"14px",fontFamily:"'Bebas Neue'",fontSize:20,cursor:"pointer"}}>CERRAR</button>
      </div>
    </div>
  );

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"#000000e8",zIndex:500,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.surf,borderRadius:"22px 22px 0 0",padding:"20px 20px 36px",width:"100%",maxWidth:480,margin:"0 auto",maxHeight:"92vh",overflowY:"auto",border:`1px solid ${T.borderB}`}}>
        <Row j="space-between" style={{marginBottom:14}}>
          <div>
            <BB s={17}>{exercise.name}</BB>
            {isBoxJ&&<div style={{marginTop:4}}><Chip c={T.orange} tiny>📦 altura en cm</Chip></div>}
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.muted,fontSize:22,cursor:"pointer"}}>×</button>
        </Row>
        {isBoxJ&&(
          <div style={{background:T.orange+"0e",border:`1px solid ${T.orange}28`,borderRadius:12,padding:"12px 14px",marginBottom:14}}>
            <MM s={9} c={T.orange} bold>CÓMO REGISTRAR BOX JUMPS</MM>
            <div style={{fontSize:12,color:T.text,marginTop:5,lineHeight:1.65}}>
              • <strong>SALTOS</strong> = cantidad de saltos por serie (ej: 8)<br/>
              • <strong>ALTURA</strong> = altura del cajón en cm (ej: 50)<br/>
              • Progresión: cuando 8 reps sean fáciles → subí 5cm
            </div>
          </div>
        )}
        {prev&&(
          <div style={{background:T.blue+"0e",border:`1px solid ${T.blue}22`,borderRadius:12,padding:"12px 14px",marginBottom:14}}>
            <MM s={9} c={T.blue}>ÚLTIMA SESIÓN — {fmtD(prev.date)}</MM>
            <Row g={8} style={{marginTop:7,flexWrap:"wrap"}}>
              {prev.sets.map((s,i)=>(
                <div key={i} style={{background:T.dim,borderRadius:8,padding:"7px 10px",textAlign:"center"}}>
                  <MM s={9} c={T.muted}>S{i+1}</MM>
                  <div style={{marginTop:2}}><BB s={16} c={T.blue}>{s.weight}</BB><MM s={9}>{lm.unit}</MM></div>
                  <MM s={9}>{s.reps}r</MM>
                </div>
              ))}
            </Row>
            {isBoxJ&&prev.maxWeight>0&&<div style={{marginTop:8,fontSize:11,color:T.acc,fontWeight:600}}>💡 Última altura: {prev.maxWeight}cm — intentá {prev.maxWeight+5}cm si fue fácil</div>}
          </div>
        )}
        <Row j="space-between" style={{marginBottom:8}}>
          <BB s={14} c={T.acc} ls="0.08em">SERIES HOY</BB>
          <button onClick={()=>setSets(p=>[...p,{reps:p[p.length-1]?.reps||10,weight:p[p.length-1]?.weight||0,done:false}])} className="tap"
            style={{background:T.acc+"18",border:`1px solid ${T.acc}30`,borderRadius:8,padding:"5px 12px",color:T.acc,fontSize:11,fontWeight:700,cursor:"pointer"}}>+ Serie</button>
        </Row>
        <div style={{display:"grid",gridTemplateColumns:"28px 38px 1fr 1fr 24px",gap:5,marginBottom:5}}>
          <div/><div/>
          <MM s={9}>{isBoxJ?"SALTOS":"REPS"}</MM>
          <MM s={9}>{isBoxJ?"ALTURA cm":isTime?"DURACIÓN":`PESO ${lm.unit}`}</MM>
          <div/>
        </div>
        {sets.map((s,i)=>(
          <div key={i} style={{display:"grid",gridTemplateColumns:"28px 38px 1fr 1fr 24px",gap:5,marginBottom:6,alignItems:"center"}}>
            <button onClick={()=>upd(i,"done",!s.done)} className="tap"
              style={{width:26,height:26,borderRadius:7,background:s.done?T.acc:"transparent",border:`2px solid ${s.done?T.acc:T.borderB}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
              {s.done&&<span style={{fontSize:11,color:T.bg,fontWeight:900}}>✓</span>}
            </button>
            <div style={{background:T.card,borderRadius:7,padding:"9px 0",textAlign:"center",border:`1px solid ${s.done?T.acc+"44":T.border}`}}>
              <MM s={12} c={s.done?T.acc:T.muted} bold>S{i+1}</MM>
            </div>
            <input type="number" value={s.reps||""} onChange={e=>upd(i,"reps",e.target.value)} placeholder={isBoxJ?"8":"10"}
              style={{...inp,border:`1px solid ${s.done?T.acc+"44":T.borderB}`}}/>
            <input type="number" value={s.weight||""} onChange={e=>upd(i,"weight",e.target.value)}
              placeholder={isBoxJ?"50":"0"} step={isBoxJ?5:2.5}
              style={{...inp,color:isBoxJ?T.orange:T.acc,fontWeight:700,border:`1px solid ${s.done?T.acc+"44":T.borderB}`}}/>
            <button onClick={()=>sets.length>1&&setSets(p=>p.filter((_,idx)=>idx!==i))}
              style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
          </div>
        ))}
        <div style={{background:T.dim,borderRadius:10,padding:"12px 14px",marginTop:4,marginBottom:12}}>
          {isBoxJ?(
            <Row j="space-between"><MM s={10}>Altura cajón</MM><BB s={20} c={T.orange}>{maxW}<MM s={11} c={T.muted}> cm</MM></BB></Row>
          ):(
            <>
              {!isTime&&<Row j="space-between"><MM s={10}>Volumen</MM><BB s={20} c={T.acc}>{totalV.toLocaleString()}<MM s={11} c={T.muted}> kg</MM></BB></Row>}
              {!isTime&&<Row j="space-between" style={{marginTop:5}}><MM s={10}>Máximo</MM><BB s={18} c={T.gold}>{maxW}<MM s={11} c={T.muted}> {lm.unit}</MM></BB></Row>}
              {best1RM>0&&<Row j="space-between" style={{marginTop:5}}><MM s={10}>1RM estimado</MM><MM s={12} c={T.purple} bold>≈{best1RM} kg</MM></Row>}
              {prev&&maxW>0&&<Row j="space-between" style={{marginTop:5}}><MM s={10}>vs. última vez</MM><MM s={12} c={maxW>prev.maxWeight?T.green:maxW<prev.maxWeight?T.red:T.muted} bold>{maxW>prev.maxWeight?"↑":maxW<prev.maxWeight?"↓":"="} {Math.abs(maxW-prev.maxWeight)}{lm.unit}</MM></Row>}
            </>
          )}
        </div>
        <Row g={6} style={{marginBottom:12}}>
          {[60,90,120,180].map(t=>(
            <button key={t} onClick={()=>setTimer(t)} className="tap"
              style={{flex:1,background:T.card,border:`1px solid ${t===90?T.acc+"44":T.border}`,borderRadius:9,padding:"9px 4px",color:t===90?T.acc:T.muted,fontSize:11,fontWeight:t===90?700:400,cursor:"pointer",textAlign:"center"}}>
              {t<60?t+"s":t/60+"'"}{t===90&&<div style={{fontSize:8,color:T.acc}}>recom.</div>}
            </button>
          ))}
        </Row>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notas opcionales..." rows={2}
          style={{...INP({resize:"none",lineHeight:1.6,fontSize:12}),marginBottom:12}}/>
        <button onClick={doSave} className="tap"
          style={{width:"100%",background:T.acc,color:T.bg,border:"none",borderRadius:12,padding:"16px",fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:"0.08em",cursor:"pointer",boxShadow:`0 4px 20px ${T.acc}33`}}>
          💾 GUARDAR
        </button>
        {timer!=null&&<RestTimer seconds={timer} onClose={()=>setTimer(null)}/>}
      </div>
    </div>
  );
}

/* ─── EXERCISE EDITOR ────────────────────────────────────── */
function ExEditor({ex,phases,onSave,onClose,onDelete}){
  const[name,setName]=useState(String(ex.name||""));
  const[sets,setSets]=useState(String(ex.sets||""));
  const[reps,setReps]=useState(String(ex.reps||""));
  const[rest,setRest]=useState(String(ex.rest||""));
  const[phase,setPhase]=useState(String(ex.phase||""));
  const[tip,setTip]=useState(String(ex.tip||""));
  const[link,setLink]=useState(String(ex.link||""));
  const[xfer,setXfer]=useState(!!ex.xfer);
  const[trackable,setTrackable]=useState(!!ex.trackable);
  const[liftKey,setLiftKey]=useState(String(ex.liftKey||""));

  function handleSave(){
    const updated={
      id:ex.id,
      name:name.trim(),
      sets:sets.trim(),
      reps:reps.trim(),
      rest:rest.trim(),
      phase:phase.trim(),
      phaseColor:ex.phaseColor||T.blue,
      tip:tip.trim(),
      link:link.trim(),
      xfer:xfer,
      trackable:trackable,
      liftKey:liftKey,
      focus:ex.focus||"",
    };
    onSave(updated);
  }

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"#000000e8",zIndex:500,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} className="up" style={{background:T.surf,borderRadius:"22px 22px 0 0",padding:"20px 20px 36px",width:"100%",maxWidth:480,margin:"0 auto",maxHeight:"90vh",overflowY:"auto",border:`1px solid ${T.borderB}`}}>
        <Row j="space-between" style={{marginBottom:16}}>
          <BB s={18} c={T.acc}>EDITAR EJERCICIO</BB>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.muted,fontSize:22,cursor:"pointer"}}>×</button>
        </Row>
        {[["NOMBRE",name,setName,"Nombre del ejercicio"],["SERIES",sets,setSets,"Ej: 4"],["REPS",reps,setReps,"Ej: 8-10"],["DESCANSO",rest,setRest,"Ej: 90s"],["FASE",phase,setPhase,"Ej: A — FUERZA BASE"]].map(([lbl,val,setter,ph])=>(
          <div key={lbl} style={{marginBottom:11}}>
            <MM s={9} c={T.muted}>{lbl}</MM>
            <input value={val} onChange={e=>setter(e.target.value)} placeholder={ph} style={{...INP(),marginTop:5}}/>
          </div>
        ))}
        <div style={{marginBottom:11}}>
          <MM s={9} c={T.muted}>NOTA DE TÉCNICA</MM>
          <textarea value={tip} onChange={e=>setTip(e.target.value)} placeholder="Cómo ejecutarlo..." rows={3}
            style={{...INP({resize:"none",lineHeight:1.6,fontSize:13}),marginTop:5}}/>
        </div>
        <div style={{marginBottom:14}}>
          <MM s={9} c={T.muted}>LINK DE REFERENCIA (YouTube, etc.)</MM>
          <input value={link} onChange={e=>setLink(e.target.value)} placeholder="https://youtube.com/..."
            style={{...INP({color:T.cyan}),marginTop:5}}/>
          {link.length>5&&<div style={{marginTop:5,fontSize:11,color:T.cyan,wordBreak:"break-all"}}>🔗 {link.slice(0,60)}</div>}
        </div>
        <Row g={16} style={{marginBottom:14,flexWrap:"wrap"}}>
          {[[xfer,setXfer,"⚡ Transferencia fútbol",T.acc],[trackable,setTrackable,"📊 Registrar peso/reps",T.blue]].map(([val,setter,lbl,col])=>(
            <Row key={lbl} g={8} style={{cursor:"pointer"}} onClick={()=>setter(v=>!v)}>
              <div style={{width:22,height:22,borderRadius:6,background:val?col:"transparent",border:`2px solid ${val?col:T.borderB}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
                {val&&<span style={{fontSize:11,color:T.bg,fontWeight:900}}>✓</span>}
              </div>
              <MM s={10}>{lbl}</MM>
            </Row>
          ))}
        </Row>
        {trackable&&(
          <div style={{marginBottom:14}}>
            <MM s={9} c={T.muted}>TIPO DE EJERCICIO (para tracking)</MM>
            <select value={liftKey} onChange={e=>setLiftKey(e.target.value)}
              style={{...INP({appearance:"none"}),marginTop:5}}>
              <option value="">— Sin tracking —</option>
              {Object.entries(LIFT_META).map(([k,m])=>(
                <option key={k} value={k}>{m.icon} {m.name} ({m.unit})</option>
              ))}
            </select>
          </div>
        )}
        <Row g={10}>
          <button onClick={onDelete} className="tap" style={{flex:1,background:T.red+"14",border:`1px solid ${T.red}30`,borderRadius:12,padding:"13px",color:T.red,fontSize:13,fontWeight:700,cursor:"pointer"}}>🗑 Eliminar</button>
          <button onClick={handleSave} className="tap" style={{flex:2,background:T.acc,color:T.bg,border:"none",borderRadius:12,padding:"13px",fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:"0.08em",cursor:"pointer"}}>GUARDAR</button>
        </Row>
      </div>
    </div>
  );
}

/* ─── ADD EXERCISE MODAL ─────────────────────────────────── */
function AddExModal({phases,onAdd,onClose}){
  const[name,setName]=useState("");
  const[sets,setSets]=useState("3");
  const[reps,setReps]=useState("10");
  const[rest,setRest]=useState("90s");
  const[phase,setPhase]=useState(phases[0]||"");
  const[tip,setTip]=useState("");
  const[link,setLink]=useState("");
  const[xfer,setXfer]=useState(false);
  const[trackable,setTrackable]=useState(false);
  const[liftKey,setLiftKey]=useState("");

  function handleAdd(){
    if(!name.trim()) return;
    onAdd({
      id:uid(),
      name:name.trim(),sets:sets.trim(),reps:reps.trim(),rest:rest.trim(),
      phase:phase.trim()||phases[0]||"",
      phaseColor:T.blue,tip:tip.trim(),link:link.trim(),
      xfer:xfer,trackable:trackable,liftKey:liftKey,focus:"",
    });
  }

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"#000000e8",zIndex:500,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} className="up" style={{background:T.surf,borderRadius:"22px 22px 0 0",padding:"20px 20px 36px",width:"100%",maxWidth:480,margin:"0 auto",maxHeight:"90vh",overflowY:"auto",border:`1px solid ${T.borderB}`}}>
        <Row j="space-between" style={{marginBottom:16}}>
          <BB s={18} c={T.green}>NUEVO EJERCICIO</BB>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.muted,fontSize:22,cursor:"pointer"}}>×</button>
        </Row>
        {[["NOMBRE *",name,setName,"Nombre del ejercicio"],["SERIES",sets,setSets,"Ej: 4"],["REPS",reps,setReps,"Ej: 8-10"],["DESCANSO",rest,setRest,"Ej: 90s"]].map(([lbl,val,setter,ph])=>(
          <div key={lbl} style={{marginBottom:11}}>
            <MM s={9} c={T.muted}>{lbl}</MM>
            <input value={val} onChange={e=>setter(e.target.value)} placeholder={ph} style={{...INP(),marginTop:5}}/>
          </div>
        ))}
        <div style={{marginBottom:11}}>
          <MM s={9} c={T.muted}>FASE</MM>
          <select value={phase} onChange={e=>setPhase(e.target.value)} style={{...INP({appearance:"none"}),marginTop:5}}>
            {phases.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div style={{marginBottom:11}}>
          <MM s={9} c={T.muted}>NOTA DE TÉCNICA</MM>
          <textarea value={tip} onChange={e=>setTip(e.target.value)} placeholder="Cómo ejecutarlo..." rows={2}
            style={{...INP({resize:"none",lineHeight:1.6,fontSize:13}),marginTop:5}}/>
        </div>
        <div style={{marginBottom:14}}>
          <MM s={9} c={T.muted}>LINK DE REFERENCIA</MM>
          <input value={link} onChange={e=>setLink(e.target.value)} placeholder="https://youtube.com/..."
            style={{...INP({color:T.cyan}),marginTop:5}}/>
        </div>
        <Row g={14} style={{marginBottom:14,flexWrap:"wrap"}}>
          {[[xfer,setXfer,"⚡ Transferencia fútbol",T.acc],[trackable,setTrackable,"📊 Registrar peso/reps",T.blue]].map(([val,setter,lbl,col])=>(
            <Row key={lbl} g={8} style={{cursor:"pointer"}} onClick={()=>setter(v=>!v)}>
              <div style={{width:22,height:22,borderRadius:6,background:val?col:"transparent",border:`2px solid ${val?col:T.borderB}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
                {val&&<span style={{fontSize:11,color:T.bg,fontWeight:900}}>✓</span>}
              </div>
              <MM s={10}>{lbl}</MM>
            </Row>
          ))}
        </Row>
        {trackable&&(
          <div style={{marginBottom:14}}>
            <MM s={9} c={T.muted}>TIPO DE EJERCICIO</MM>
            <select value={liftKey} onChange={e=>setLiftKey(e.target.value)}
              style={{...INP({appearance:"none"}),marginTop:5}}>
              <option value="">— Sin tracking —</option>
              {Object.entries(LIFT_META).map(([k,m])=>(
                <option key={k} value={k}>{m.icon} {m.name} ({m.unit})</option>
              ))}
            </select>
          </div>
        )}
        <button onClick={handleAdd} className="tap"
          style={{width:"100%",background:name.trim()?T.green:T.dim,color:name.trim()?T.bg:T.muted,border:"none",borderRadius:12,padding:"14px",fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:"0.08em",cursor:name.trim()?"pointer":"not-allowed"}}>
          AGREGAR EJERCICIO
        </button>
      </div>
    </div>
  );
}

/* ─── SESSION VIEW ───────────────────────────────────────── */
function SessionView({day,setDay,history,setHistory}){
  const phases=[...new Set((day.exercises||[]).map(e=>e.phase).filter(Boolean))];
  const[openPhase,setOpenPhase]=useState(phases[0]||"");
  const[checked,setChecked]=useState({});
  const[editEx,setEditEx]=useState(null);
  const[addingEx,setAddingEx]=useState(false);
  const[logEx,setLogEx]=useState(null);
  const[showNut,setShowNut]=useState(false);
  const[editMode,setEditMode]=useState(false);
  const[timer,setTimer]=useState(null);

  const allEx=(day.exercises||[]).length;
  const doneCount=Object.values(checked).filter(Boolean).length;

  function saveEx(updated){
    setDay(d=>({...d,exercises:(d.exercises||[]).map(e=>e.id===updated.id?updated:e)}));
    setEditEx(null);
  }
  function delEx(id){
    setDay(d=>({...d,exercises:(d.exercises||[]).filter(e=>e.id!==id)}));
    setEditEx(null);
  }
  function addEx(ex){
    setDay(d=>({...d,exercises:[...(d.exercises||[]),ex]}));
    setAddingEx(false);
  }

  return(
    <div>
      <div style={{padding:"20px 20px 16px",background:`linear-gradient(145deg,${day.color}0e,${T.bg} 55%)`,borderBottom:`1px solid ${T.border}`}}>
        <Row j="space-between" style={{marginBottom:8}}>
          <Row g={10}>
            <span style={{fontSize:26}}>{day.icon}</span>
            <div>
              <BB s={22} c={day.color}>{day.label}</BB>
              <div style={{marginTop:2}}><MM s={10}>{day.goal} · {day.duration}</MM></div>
            </div>
          </Row>
          <button onClick={()=>setEditMode(m=>!m)} className="tap"
            style={{background:editMode?T.orange+"22":T.dim,border:`1px solid ${editMode?T.orange+"55":T.border}`,borderRadius:9,padding:"7px 13px",color:editMode?T.orange:T.muted,fontSize:11,fontWeight:700,cursor:"pointer"}}>
            {editMode?"✓ LISTO":"✏️ EDITAR"}
          </button>
        </Row>
        <div style={{background:T.dim,borderRadius:3,height:4,overflow:"hidden",marginBottom:10}}>
          <div style={{width:`${allEx>0?(doneCount/allEx)*100:0}%`,height:"100%",background:day.color,borderRadius:3,transition:"width .4s",boxShadow:`0 0 8px ${day.color}88`}}/>
        </div>
        <div style={{background:day.color+"08",borderRadius:11,padding:"10px 13px",borderLeft:`3px solid ${day.color}44`}}>
          <MM s={9} c={day.color}>¿POR QUÉ ESTE DÍA?</MM>
          <div style={{fontSize:11,color:T.muted,marginTop:3,lineHeight:1.6}}>{day.why}</div>
        </div>
      </div>

      {/* Nutrition */}
      {(day.nutrition?.pre||day.nutrition?.post)&&(
        <div style={{borderBottom:`1px solid ${T.border}`}}>
          <div onClick={()=>setShowNut(s=>!s)} style={{padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
            <Row g={8}><span style={{fontSize:15}}>🥗</span><BB s={13} c={T.gold} ls="0.06em">NUTRICIÓN HOY</BB></Row>
            <span style={{color:T.muted,fontSize:12,transform:showNut?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
          </div>
          {showNut&&(
            <div className="up" style={{padding:"0 20px 16px",display:"flex",flexDirection:"column",gap:8}}>
              {[["PRE",day.nutrition.pre,T.orange],["POST",day.nutrition.post,T.green]].map(([l,v,c])=>v?(
                <div key={l} style={{background:c+"08",border:`1px solid ${c}18`,borderRadius:10,padding:"10px 13px"}}>
                  <MM s={9} c={c}>{l}</MM>
                  <div style={{fontSize:12,color:T.text,marginTop:4,lineHeight:1.6}}>{v}</div>
                </div>
              ):null)}
            </div>
          )}
        </div>
      )}

      {/* Phases */}
      {phases.map(phase=>{
        const phExs=(day.exercises||[]).filter(e=>e.phase===phase);
        const phColor=phExs[0]?.phaseColor||T.blue;
        const isOpen=openPhase===phase;
        const phaseDone=phExs.filter(ex=>checked[ex.id]).length;
        return(
          <div key={phase} style={{borderBottom:`1px solid ${T.border}`}}>
            <div onClick={()=>setOpenPhase(isOpen?null:phase)}
              style={{padding:"13px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",background:isOpen?phColor+"07":"transparent",userSelect:"none"}}>
              <Row g={10}>
                <div style={{width:3,height:36,borderRadius:2,background:phColor,flexShrink:0}}/>
                <BB s={14} c={phColor} ls="0.07em">{phase}</BB>
              </Row>
              <Row g={8}>
                {phaseDone>0&&<Chip c={phColor} tiny>{phaseDone}/{phExs.length}</Chip>}
                <span style={{color:T.muted,fontSize:13,transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
              </Row>
            </div>
            {isOpen&&(
              <div className="up" style={{background:T.surf}}>
                {phExs.map((ex,i)=>{
                  const isDone=!!checked[ex.id];
                  const prevEntry=(ex.trackable&&ex.liftKey)?[...history].filter(h=>h.liftKey===ex.liftKey).sort((a,b)=>b.date.localeCompare(a.date))[0]:null;
                  const restSec=ex.rest?ex.rest.match(/(\d+)s/)?.[1]:null;
                  const isBoxJ=ex.liftKey==="boxjump";
                  return(
                    <div key={ex.id}>
                      <div style={{padding:"14px 20px",display:"flex",gap:12,alignItems:"flex-start",opacity:isDone?0.4:1,transition:"opacity .2s"}}>
                        <button onClick={()=>setChecked(p=>({...p,[ex.id]:!p[ex.id]}))} className="tap"
                          style={{width:24,height:24,borderRadius:7,flexShrink:0,marginTop:1,background:isDone?phColor:"transparent",border:`2px solid ${isDone?phColor:T.borderB}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
                          {isDone&&<span style={{fontSize:12,color:T.bg,fontWeight:900}}>✓</span>}
                        </button>
                        <div style={{flex:1,minWidth:0}}>
                          <Row g={8} style={{flexWrap:"wrap",marginBottom:4}}>
                            <span style={{fontSize:13,fontWeight:600,color:ex.xfer?phColor:T.text,textDecoration:isDone?"line-through":"none"}}>{ex.name}</span>
                            {ex.xfer&&<Chip c={phColor} tiny>⚡</Chip>}
                            {isBoxJ&&<Chip c={T.orange} tiny>📦 cm</Chip>}
                          </Row>
                          {(ex.sets||ex.reps)&&(
                            <Row g={10} style={{flexWrap:"wrap",marginBottom:3}}>
                              {ex.sets&&<MM s={11} c={T.muted}>{ex.sets} series</MM>}
                              {ex.reps&&<MM s={11} c={T.text} bold>{ex.reps}</MM>}
                              {ex.rest&&<MM s={11} c={T.muted}>· {ex.rest}</MM>}
                            </Row>
                          )}
                          {ex.focus&&<div style={{marginTop:3}}><Chip c={T.acc} tiny>🎯 {ex.focus}</Chip></div>}
                          {ex.tip&&<div style={{marginTop:7,fontSize:11,color:T.muted,lineHeight:1.6,paddingLeft:10,borderLeft:`2px solid ${phColor}33`}}>{ex.tip}</div>}
                          {ex.link&&ex.link.startsWith("http")&&(
                            <div style={{marginTop:7}}>
                              <a href={ex.link} target="_blank" rel="noopener noreferrer"
                                style={{display:"inline-flex",alignItems:"center",gap:6,background:T.blue+"12",border:`1px solid ${T.blue}25`,borderRadius:8,padding:"5px 10px",color:T.blue,fontSize:11,fontWeight:600,textDecoration:"none"}}>
                                🎥 Ver técnica
                              </a>
                            </div>
                          )}
                          {prevEntry&&(
                            <div style={{marginTop:8,background:T.blue+"08",borderRadius:9,padding:"8px 11px"}}>
                              <MM s={10} c={T.blue}>
                                Último: <span style={{color:isBoxJ?T.orange:T.gold,fontWeight:700}}>
                                  {isBoxJ?`${prevEntry.maxWeight}cm`:`${prevEntry.maxWeight}${LIFT_META[ex.liftKey]?.unit||"kg"}`}
                                </span> — {fmtD(prevEntry.date)}
                              </MM>
                            </div>
                          )}
                          <Row g={8} style={{marginTop:8,flexWrap:"wrap"}}>
                            {ex.trackable&&(
                              <button onClick={()=>setLogEx(ex)} className="tap"
                                style={{background:T.acc+"14",border:`1px solid ${T.acc}28`,borderRadius:8,padding:"6px 12px",color:T.acc,fontSize:11,fontWeight:700,cursor:"pointer"}}>
                                📝 {prevEntry?"Registrar":"Primer registro"}
                              </button>
                            )}
                            {editMode&&(
                              <button onClick={()=>setEditEx(ex)} className="tap"
                                style={{background:T.orange+"12",border:`1px solid ${T.orange}25`,borderRadius:8,padding:"6px 12px",color:T.orange,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                                ✏️ Editar
                              </button>
                            )}
                          </Row>
                        </div>
                        {restSec&&(
                          <button onClick={()=>setTimer(parseInt(restSec))} className="tap"
                            style={{background:"transparent",border:`1px solid ${T.borderB}`,borderRadius:9,padding:"6px 10px",color:T.muted,fontSize:11,cursor:"pointer",flexShrink:0}}>⏱</button>
                        )}
                      </div>
                      {i<phExs.length-1&&<HR ml={56}/>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {editMode&&(
        <div style={{padding:"14px 20px"}}>
          <button onClick={()=>setAddingEx(true)} className="tap"
            style={{width:"100%",background:T.green+"12",border:`1px solid ${T.green}28`,borderRadius:12,padding:"13px",color:T.green,fontSize:13,fontWeight:700,cursor:"pointer"}}>
            + AGREGAR EJERCICIO
          </button>
        </div>
      )}

      {day.coachNote&&(
        <div style={{padding:"14px 20px 24px"}}>
          <div style={{background:T.gold+"07",border:`1px solid ${T.gold}16`,borderRadius:12,padding:"12px 15px",display:"flex",gap:10}}>
            <span style={{fontSize:18,flexShrink:0}}>👨‍💼</span>
            <div style={{fontSize:12,color:T.muted,lineHeight:1.6}}>
              <span style={{color:T.gold,fontWeight:700}}>Preparador: </span>{day.coachNote}
            </div>
          </div>
        </div>
      )}

      {editEx&&<ExEditor ex={editEx} phases={phases} onSave={saveEx} onClose={()=>setEditEx(null)} onDelete={()=>delEx(editEx.id)}/>}
      {addingEx&&<AddExModal phases={phases} onAdd={addEx} onClose={()=>setAddingEx(false)}/>}
      {logEx&&<LogModal exercise={logEx} history={history} onSave={entry=>setHistory(p=>[entry,...p])} onClose={()=>setLogEx(null)}/>}
      {timer!=null&&<RestTimer seconds={timer} onClose={()=>setTimer(null)}/>}
    </div>
  );
}

/* ─── LINE CHART ─────────────────────────────────────────── */
function LineChart({data,color,unit,label}){
  if(!data||data.length<2) return(
    <div style={{padding:"24px 0",textAlign:"center"}}>
      <MM s={11} c={T.muted}>Necesitás al menos 2 registros para ver la progresión</MM>
    </div>
  );
  const vals=data.map(d=>d.val);
  const minV=Math.min(...vals),maxV=Math.max(...vals),range=maxV-minV||1;
  const W=300,H=90;
  const px=i=>i*(W/(data.length-1));
  const py=v=>H-8-((v-minV)/range)*(H-20);
  const pts=data.map((d,i)=>({x:px(i),y:py(d.val),val:d.val,date:d.date}));
  const smooth=pts.reduce((acc,p,i)=>{
    if(i===0) return `M${p.x},${p.y}`;
    const prev=pts[i-1];
    const cpx=(prev.x+p.x)/2;
    return acc+` C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
  },"");
  const area=smooth+` L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`;
  const maxPt=pts.reduce((a,p)=>p.val>a.val?p:a,pts[0]);
  const lastPt=pts[pts.length-1];
  const gid="g"+uid();
  return(
    <div>
      {label&&<div style={{marginBottom:6}}><MM s={10} c={color}>{label}</MM></div>}
      <svg width="100%" viewBox={`0 0 ${W} ${H+10}`} style={{overflow:"visible"}}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0,0.5,1].map((f,i)=>(
          <line key={i} x1={0} y1={py(minV+range*f)} x2={W} y2={py(minV+range*f)} stroke={T.border} strokeWidth="1" strokeDasharray="4 4"/>
        ))}
        <path d={area} fill={`url(#${gid})`}/>
        <path d={smooth} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{filter:`drop-shadow(0 0 6px ${color}66)`}}/>
        <circle cx={maxPt.x} cy={maxPt.y} r={6} fill={T.gold} stroke={T.bg} strokeWidth={2} style={{filter:`drop-shadow(0 0 8px ${T.gold})`}}/>
        <text x={maxPt.x} y={maxPt.y-12} textAnchor="middle" fill={T.gold} fontSize="10" fontFamily="'DM Mono',monospace" fontWeight="600">PR {maxPt.val}{unit}</text>
        {pts.map((p,i)=>(
          <circle key={i} cx={p.x} cy={p.y} r={i===pts.length-1?5:3} fill={i===pts.length-1?color:T.bg} stroke={color} strokeWidth={i===pts.length-1?2:1.5}/>
        ))}
        <text x={lastPt.x} y={lastPt.y+(lastPt.y<20?14:-8)} textAnchor="middle" fill={color} fontSize="10" fontFamily="'DM Mono',monospace" fontWeight="600">{lastPt.val}{unit}</text>
      </svg>
      <Row j="space-between" style={{marginTop:4}}>
        <MM s={8}>{fmtD(data[0].date)}</MM>
        {data.length>2&&<MM s={8}>{fmtD(data[Math.floor(data.length/2)].date)}</MM>}
        <MM s={8}>{fmtD(data[data.length-1].date)}</MM>
      </Row>
    </div>
  );
}

/* ─── TRACKER VIEW ───────────────────────────────────────── */
function TrackerView({history,bodyLog,setBodyLog}){
  const[selKey,setSelKey]=useState("all");
  const[bwInput,setBwInput]=useState("");
  const[bwSaved,setBwSaved]=useState(false);
  const ts=td();

  const liftKeys=[...new Set(history.map(h=>h.liftKey))];
  const prs={};
  history.forEach(h=>{if(!prs[h.liftKey]||h.maxWeight>prs[h.liftKey].weight)prs[h.liftKey]={weight:h.maxWeight,date:h.date,name:h.liftName,unit:h.unit||"kg"};});

  const chartData=selKey!=="all"
    ?[...history].filter(h=>h.liftKey===selKey).sort((a,b)=>a.date.localeCompare(b.date)).map(e=>({val:Math.max(...e.sets.map(s=>s.weight),0),date:e.date}))
    :[];
  const lm=selKey!=="all"?LIFT_META[selKey]:null;
  const isBoxJ=selKey==="boxjump";

  const allDates=[...new Set(history.map(h=>h.date))].sort().reverse();
  let streak=0;const base=new Date();
  for(let i=0;i<60;i++){const d=new Date(base);d.setDate(base.getDate()-i);const k=d.toISOString().split("T")[0];if(allDates.includes(k))streak++;else if(i>0)break;}

  const weekDays=Array.from({length:7}).map((_,i)=>{
    const d=new Date();d.setDate(d.getDate()-(6-i));
    const k=d.toISOString().split("T")[0];
    const vol=history.filter(h=>h.date===k).reduce((a,h)=>a+h.totalVolume,0);
    return{label:["L","M","X","J","V","S","D"][i],vol,key:k};
  });
  const maxVol=Math.max(...weekDays.map(d=>d.vol),1);

  const oneRMs=liftKeys.filter(k=>!["run","sprint","plank"].includes(k)).map(k=>{
    const entries=history.filter(h=>h.liftKey===k);
    const best=entries.reduce((b,h)=>Math.max(b,h.sets.reduce((bx,s)=>Math.max(bx,calc1RM(s.weight,s.reps)),0)),0);
    return{key:k,name:entries[0]?.liftName||k,best1RM:best,pr:prs[k]?.weight||0,unit:LIFT_META[k]?.unit||"kg",isBoxJ:k==="boxjump"};
  }).filter(x=>x.pr>0);

  function saveBW(){
    if(!bwInput) return;
    setBodyLog(p=>[{id:uid(),date:ts,weight:Number(bwInput)},...p.filter(b=>b.date!==ts)]);
    setBwInput("");setBwSaved(true);setTimeout(()=>setBwSaved(false),1500);
  }

  const bwChart=[...bodyLog].sort((a,b)=>a.date.localeCompare(b.date)).slice(-14).map(b=>({val:b.weight,date:b.date}));

  return(
    <div style={{padding:"20px 20px 0",display:"flex",flexDirection:"column",gap:16}}>
      <BB s={13} c={T.muted} ls="0.18em">TRACKER DE PROGRESO</BB>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {[{l:"RACHA",v:`${streak}d`,c:T.orange,i:"🔥"},{l:"SESIONES",v:history.length,c:T.acc,i:"📊"},{l:"PRs",v:Object.keys(prs).length,c:T.gold,i:"🏆"}].map((s,i)=>(
          <div key={i} style={{background:T.card,border:`1px solid ${s.c}16`,borderRadius:13,padding:"13px 10px",textAlign:"center",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:8,right:10,fontSize:18,opacity:.1}}>{s.i}</div>
            <MM s={8}>{s.l}</MM>
            <div style={{marginTop:4}}><BB s={26} c={s.c}>{s.v}</BB></div>
          </div>
        ))}
      </div>

      {/* Progress chart */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"18px 16px"}}>
        <Row j="space-between" style={{marginBottom:12}}>
          <BB s={13} c={T.acc} ls="0.1em">PROGRESIÓN</BB>
          {lm&&<Chip c={isBoxJ?T.orange:T.acc} tiny>{lm.unit}</Chip>}
        </Row>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8,WebkitOverflowScrolling:"touch"}}>
          {liftKeys.map(k=>{
            const m=LIFT_META[k];
            return(
              <button key={k} onClick={()=>setSelKey(k)} className="tap"
                style={{background:selKey===k?T.acc+"22":T.dim,border:`1px solid ${selKey===k?T.acc:T.border}`,borderRadius:9,padding:"6px 12px",color:selKey===k?T.acc:T.muted,fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                {m?.icon||"🏋️"} {k}
              </button>
            );
          })}
        </div>
        {selKey==="all"?(
          <div style={{padding:"20px 0",textAlign:"center"}}><MM s={11} c={T.muted}>Seleccioná un ejercicio</MM></div>
        ):(
          <>
            {isBoxJ&&<div style={{background:T.orange+"0e",borderRadius:10,padding:"10px 13px",marginBottom:12}}>
              <MM s={9} c={T.orange} bold>📦 La línea muestra la altura del cajón en cm</MM>
            </div>}
            <LineChart data={chartData} color={isBoxJ?T.orange:T.acc} unit={lm?.unit||"kg"} label={isBoxJ?"ALTURA CAJÓN (cm)":"PESO"}/>
            {chartData.length>=2&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:12}}>
                {[
                  {l:"PR",v:`${Math.max(...chartData.map(d=>d.val))}${lm?.unit}`,c:T.gold},
                  {l:"ACTUAL",v:`${chartData[chartData.length-1]?.val}${lm?.unit}`,c:isBoxJ?T.orange:T.acc},
                  {l:"MEJORA",v:`+${chartData[chartData.length-1]?.val-chartData[0]?.val}${lm?.unit}`,c:T.green},
                ].map((s,i)=>(
                  <div key={i} style={{background:T.dim,borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
                    <MM s={8}>{s.l}</MM>
                    <div style={{marginTop:3}}><BB s={18} c={s.c}>{s.v}</BB></div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Weekly bar chart */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"18px 16px"}}>
        <Row j="space-between" style={{marginBottom:14}}>
          <BB s={13} c={T.text} ls="0.1em">CARGA SEMANAL</BB>
          <MM s={10}>{weekDays.filter(d=>d.vol>0).length} sesiones</MM>
        </Row>
        <div style={{display:"flex",gap:6,alignItems:"flex-end",height:80}}>
          {weekDays.map((d,i)=>{
            const h=d.vol>0?Math.max(8,(d.vol/maxVol)*68):3;
            const isT=d.key===ts;
            return(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                {d.vol>0&&<MM s={8} c={isT?T.acc:T.muted}>{d.vol>999?`${(d.vol/1000).toFixed(1)}k`:d.vol}</MM>}
                <div style={{width:"100%",height:h,borderRadius:5,background:isT?T.acc:T.acc+"55",boxShadow:isT?`0 0 10px ${T.acc}55`:"none",transition:`height .7s ease ${i*50}ms`}}/>
                <MM s={9} c={isT?T.acc:T.muted}>{d.label}</MM>
              </div>
            );
          })}
        </div>
      </div>

      {/* 1RM */}
      {oneRMs.length>0&&(
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"18px 16px"}}>
          <BB s={13} c={T.purple} ls="0.1em">PRs + 1RM ESTIMADO</BB>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:12}}>
            {oneRMs.map(l=>(
              <div key={l.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 13px",background:T.dim,borderRadius:11}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:T.text}}>{l.name}</div>
                  <MM s={10} c={T.muted}>PR: {l.pr}{l.unit}</MM>
                </div>
                <div style={{textAlign:"right"}}>
                  <BB s={22} c={l.isBoxJ?T.orange:T.gold}>{l.pr}</BB><MM s={11} c={T.muted}> {l.unit}</MM>
                  {l.best1RM>0&&!l.isBoxJ&&<div><MM s={10} c={T.purple}>1RM ≈{l.best1RM}kg</MM></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Body weight */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"18px 16px"}}>
        <BB s={13} c={T.blue} ls="0.1em">⚖️ PESO CORPORAL</BB>
        <Row g={8} style={{marginTop:12,flexWrap:"wrap"}}>
          <input type="number" value={bwInput} onChange={e=>setBwInput(e.target.value)} placeholder="64.0" step={0.1}
            style={{...INP({width:90,textAlign:"center",fontSize:16,color:T.blue,fontWeight:700}),flex:"none"}}/>
          <MM s={11} c={T.muted} style={{alignSelf:"center"}}>kg</MM>
          <button onClick={saveBW} className="tap"
            style={{background:T.blue+"22",border:`1px solid ${T.blue}44`,borderRadius:10,padding:"10px 16px",color:bwSaved?T.green:T.blue,fontSize:12,fontWeight:700,cursor:"pointer",transition:"color .3s"}}>
            {bwSaved?"✓ OK":"Guardar"}
          </button>
        </Row>
        {bwChart.length>=2&&<div style={{marginTop:14}}><LineChart data={bwChart} color={T.blue} unit="kg" label="EVOLUCIÓN PESO CORPORAL"/></div>}
        {bwChart.length===0&&<div style={{marginTop:10,fontSize:11,color:T.muted}}>Registrá tu peso hoy para ver la evolución.</div>}
      </div>
      <div style={{height:24}}/>
    </div>
  );
}

/* ─── HISTORY VIEW ───────────────────────────────────────── */
function HistoryView({history,setHistory}){
  const[filterKey,setFilterKey]=useState("all");
  const[expandedId,setExpandedId]=useState(null);
  const keys=[...new Set(history.map(h=>h.liftKey))];
  const filtered=filterKey==="all"?history:history.filter(h=>h.liftKey===filterKey);
  const sorted=[...filtered].sort((a,b)=>b.date.localeCompare(a.date));
  const prs={};history.forEach(h=>{if(!prs[h.liftKey]||h.maxWeight>prs[h.liftKey].weight)prs[h.liftKey]={weight:h.maxWeight,date:h.date,unit:h.unit||"kg"};});

  return(
    <div style={{padding:"20px 20px 0",display:"flex",flexDirection:"column",gap:14}}>
      <Row j="space-between">
        <BB s={13} c={T.muted} ls="0.18em">HISTORIAL</BB>
        <MM s={10}>{history.length} registros</MM>
      </Row>
      {Object.keys(prs).length>0&&(
        <div>
          <MM s={9} c={T.gold}>🏆 RÉCORDS PERSONALES</MM>
          <div style={{display:"flex",gap:8,marginTop:8,overflowX:"auto",paddingBottom:4}}>
            {Object.entries(prs).map(([key,pr])=>{
              const m=LIFT_META[key];const isBJ=key==="boxjump";
              return(
                <div key={key} style={{background:T.gold+"08",border:`1px solid ${T.gold}20`,borderRadius:12,padding:"11px 13px",minWidth:94,flexShrink:0,textAlign:"center"}}>
                  <div style={{fontSize:16,marginBottom:3}}>{m?.icon||"🏋️"}</div>
                  <MM s={8} c={T.muted}>{key}</MM>
                  <div style={{marginTop:3}}><BB s={22} c={isBJ?T.orange:T.gold}>{pr.weight}</BB><MM s={9} c={T.muted}> {pr.unit}</MM></div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {keys.length>0&&(
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
          <button onClick={()=>setFilterKey("all")} className="tap" style={{background:filterKey==="all"?T.acc+"22":T.card,border:`1px solid ${filterKey==="all"?T.acc:T.border}`,borderRadius:9,padding:"6px 12px",color:filterKey==="all"?T.acc:T.muted,fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>Todos</button>
          {keys.map(k=><button key={k} onClick={()=>setFilterKey(k)} className="tap" style={{background:filterKey===k?T.acc+"22":T.card,border:`1px solid ${filterKey===k?T.acc:T.border}`,borderRadius:9,padding:"6px 12px",color:filterKey===k?T.acc:T.muted,fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>{k}</button>)}
        </div>
      )}
      {sorted.length===0?(
        <div style={{padding:"60px 0",textAlign:"center"}}>
          <div style={{fontSize:44,marginBottom:14}}>📋</div>
          <BB s={18} c={T.muted}>SIN REGISTROS AÚN</BB>
          <div style={{marginTop:8,fontSize:12,color:T.muted,lineHeight:1.7}}>Abrí la sesión del día y tocá<br/>"Registrar" en cualquier ejercicio.</div>
        </div>
      ):sorted.map(entry=>{
        const isExp=expandedId===entry.id;
        const isPR=prs[entry.liftKey]?.weight===entry.maxWeight&&prs[entry.liftKey]?.date===entry.date;
        const isBJEntry=entry.liftKey==="boxjump";
        const best1RM=(!isBJEntry)?entry.sets.reduce((b,s)=>Math.max(b,calc1RM(s.weight,s.reps)),0):0;
        return(
          <div key={entry.id} style={{background:T.card,border:`1px solid ${isPR?T.gold+"44":T.border}`,borderRadius:14,overflow:"hidden"}}>
            <div onClick={()=>setExpandedId(isExp?null:entry.id)} style={{padding:"14px 16px",cursor:"pointer",background:isPR?T.gold+"04":"transparent"}}>
              <Row j="space-between">
                <div>
                  <Row g={7} style={{marginBottom:3}}>
                    <span style={{fontSize:13,fontWeight:600,color:T.text}}>{entry.liftName}</span>
                    {isPR&&<Chip c={T.gold} tiny>🏆 PR</Chip>}
                    {isBJEntry&&<Chip c={T.orange} tiny>📦 cajón</Chip>}
                  </Row>
                  <MM s={10} c={T.muted}>{entry.date} · {entry.sets.length} series</MM>
                </div>
                <div style={{textAlign:"right"}}>
                  <BB s={24} c={isPR?T.gold:isBJEntry?T.orange:T.acc}>{entry.maxWeight}</BB>
                  <MM s={10} c={T.muted}> {entry.unit||"kg"}</MM>
                </div>
              </Row>
              <Row g={14} style={{marginTop:6}}>
                {isBJEntry?<MM s={10}>📦 {entry.sets[0]?.reps} saltos × {entry.maxWeight}cm</MM>:<MM s={10}>Vol: <span style={{color:T.acc,fontWeight:700}}>{entry.totalVolume.toLocaleString()}kg</span></MM>}
                {best1RM>0&&<MM s={10}>1RM≈<span style={{color:T.purple,fontWeight:700}}>{best1RM}kg</span></MM>}
                <span style={{color:T.muted,fontSize:12,marginLeft:"auto"}}>{isExp?"▲":"▾"}</span>
              </Row>
            </div>
            {isExp&&(
              <div className="up" style={{background:T.surf,borderTop:`1px solid ${T.border}`,padding:"14px 16px"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:8}}>
                  {entry.sets.map((s,i)=>(
                    <div key={i} style={{background:T.card,borderRadius:9,padding:"9px 8px",textAlign:"center"}}>
                      <MM s={9} c={T.muted}>S{i+1}</MM>
                      <div style={{marginTop:2}}><BB s={17} c={isBJEntry?T.orange:T.acc}>{s.weight}</BB><MM s={9} c={T.muted}>{entry.unit||"kg"}</MM></div>
                      <MM s={10}>{s.reps}{isBJEntry?" sal.":"r"}</MM>
                      {!isBJEntry&&s.weight>0&&<MM s={8} c={T.purple}>≈{calc1RM(s.weight,s.reps)}</MM>}
                    </div>
                  ))}
                </div>
                {entry.notes&&<div style={{fontSize:11,color:T.muted,fontStyle:"italic",paddingTop:8,borderTop:`1px solid ${T.border}`,lineHeight:1.5}}>💬 {entry.notes}</div>}
                <button onClick={()=>setHistory(p=>p.filter(h=>h.id!==entry.id))} className="tap"
                  style={{marginTop:10,background:T.red+"10",border:`1px solid ${T.red}22`,borderRadius:8,padding:"7px 14px",color:T.red,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  🗑 Eliminar
                </button>
              </div>
            )}
          </div>
        );
      })}
      <div style={{height:20}}/>
    </div>
  );
}

/* ─── SUPPLEMENTS ────────────────────────────────────────── */
function SuppsView({suppLog,setSuppLog}){
  const ts=td();
  const tl=suppLog[ts]||{};
  const tog=id=>setSuppLog(p=>{const d=p[ts]||{};return{...p,[ts]:{...d,[id]:{taken:!d[id]?.taken}}};});
  const streak=id=>{let s=0;for(let i=0;i<60;i++){const d=new Date();d.setDate(d.getDate()-i);const k=d.toISOString().split("T")[0];if(suppLog[k]?.[id]?.taken)s++;else if(i>0)break;}return s;};
  const weekA=id=>{let t=0;for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);const k=d.toISOString().split("T")[0];if(suppLog[k]?.[id]?.taken)t++;}return t;};
  return(
    <div style={{padding:"20px 20px 0",display:"flex",flexDirection:"column",gap:14}}>
      <BB s={13} c={T.muted} ls="0.18em">SUPLEMENTACIÓN</BB>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden"}}>
        <div style={{padding:"11px 16px",background:T.dim,borderBottom:`1px solid ${T.border}`}}><BB s={12} c={T.acc} ls="0.12em">✓ CHECK DIARIO</BB></div>
        {SUPPS.map((s,i)=>{
          const taken=tl[s.id]?.taken||false;
          return(
            <div key={s.id}>
              <div style={{padding:"14px 16px",display:"flex",gap:12,alignItems:"flex-start"}}>
                <button onClick={()=>tog(s.id)} className="tap"
                  style={{width:30,height:30,borderRadius:9,flexShrink:0,background:taken?s.color:"transparent",border:`2px solid ${taken?s.color:T.borderB}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginTop:1,transition:"all .2s"}}>
                  {taken&&<span style={{fontSize:14,color:T.bg,fontWeight:900}}>✓</span>}
                </button>
                <div style={{flex:1}}>
                  <Row g={8} style={{flexWrap:"wrap",marginBottom:4}}>
                    <span style={{fontSize:18}}>{s.icon}</span>
                    <span style={{fontSize:14,fontWeight:700,color:taken?s.color:T.text}}>{s.name}</span>
                    <Chip c={s.color} tiny>{s.dose}</Chip>
                    {s.optional&&<Chip c={T.muted} tiny>opcional</Chip>}
                  </Row>
                  <div style={{fontSize:11,color:T.muted,marginBottom:5}}><span style={{color:s.color,fontWeight:600}}>⏰ </span>{s.timing}</div>
                  <Row g={12}><MM s={10} c={s.color}>🔥 {streak(s.id)} días</MM><MM s={10}>{weekA(s.id)}/7 semana</MM></Row>
                </div>
              </div>
              {i<SUPPS.length-1&&<HR/>}
            </div>
          );
        })}
      </div>
      {/* 7 day adherence */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 16px"}}>
        <BB s={11} c={T.muted} ls="0.14em">ADHERENCIA 7 DÍAS</BB>
        <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:12}}>
          {SUPPS.filter(s=>!s.optional).map(s=>(
            <div key={s.id}>
              <Row j="space-between" style={{marginBottom:6}}><MM s={10}>{s.icon} {s.name}</MM><MM s={10} c={s.color} bold>{weekA(s.id)}/7</MM></Row>
              <div style={{display:"flex",gap:4}}>
                {Array.from({length:7}).map((_,i)=>{
                  const d=new Date();d.setDate(d.getDate()-(6-i));
                  const k=d.toISOString().split("T")[0];
                  const taken=suppLog[k]?.[s.id]?.taken;
                  const isT=k===ts;
                  return <div key={i} style={{flex:1,height:30,borderRadius:6,background:taken?s.color:T.dim,border:isT?`1.5px solid ${s.color}77`:"none",boxShadow:taken?`0 0 8px ${s.color}44`:"none",transition:"all .3s"}}/>;
                })}
              </div>
            </div>
          ))}
          <Row j="space-around">{["L","M","X","J","V","S","D"].map((d,i)=><div key={i} style={{flex:1,textAlign:"center"}}><MM s={9}>{d}</MM></div>)}</Row>
        </div>
      </div>
      <div style={{height:24}}/>
    </div>
  );
}

/* ─── HOME VIEW ──────────────────────────────────────────── */
function HomeView({week,history,suppLog,onSelectDay}){
  const ts=td();
  const dow=new Date().getDay();
  const todayIdx={1:0,2:1,3:2,4:3,5:4,6:5,0:6}[dow]??0;
  const mainSupps=SUPPS.filter(s=>!s.optional);
  const suppDone=mainSupps.filter(s=>suppLog[ts]?.[s.id]?.taken).length;
  const allDone=suppDone===mainSupps.length;
  const prs={};history.forEach(h=>{if(!prs[h.liftKey]||h.maxWeight>prs[h.liftKey].weight)prs[h.liftKey]={weight:h.maxWeight,name:h.liftName,unit:h.unit||"kg"};});
  const weekVol=Array.from({length:7}).map((_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const k=d.toISOString().split("T")[0];return{label:["L","M","X","J","V","S","D"][i],vol:history.filter(h=>h.date===k).reduce((a,h)=>a+h.totalVolume,0),key:k};});
  const maxVol=Math.max(...weekVol.map(w=>w.vol),1);
  const todayDay=week[todayIdx];
  const allDates=[...new Set(history.map(h=>h.date))].sort().reverse();
  let streak=0;for(let i=0;i<60;i++){const d=new Date();d.setDate(d.getDate()-i);const k=d.toISOString().split("T")[0];if(allDates.includes(k))streak++;else if(i>0)break;}

  return(
    <div>
      {/* Hero */}
      <div style={{padding:"22px 20px 20px",background:`linear-gradient(145deg,#0c1400,${T.bg} 60%)`,borderBottom:`1px solid ${T.border}`,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-70,right:-50,width:220,height:220,borderRadius:"50%",background:`radial-gradient(circle,${T.acc}0b,transparent 70%)`,pointerEvents:"none"}}/>
        <Row j="space-between" a="flex-start">
          <div>
            <BB s={38} style={{lineHeight:1}}>TITO</BB>
            <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
              <Chip c={T.acc}>⚽ MEDIOCAMPISTA</Chip>
              <Chip c={T.muted}>64 KG</Chip>
              {streak>0&&<Chip c={T.orange}>🔥 {streak}d racha</Chip>}
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <BB s={11} c={T.muted} ls="0.14em">SEMANA</BB>
            <div><BB s={22} c={T.acc}>{weekVol.reduce((a,w)=>a+w.vol,0)>0?`${(weekVol.reduce((a,w)=>a+w.vol,0)/1000).toFixed(1)}k`:"0"}</BB><MM s={11} c={T.muted}> kg</MM></div>
          </div>
        </Row>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:16}}>
          {[{l:"SESIONES",v:history.filter(h=>(new Date()-new Date(h.date))<7*864e5).length,c:T.acc},{l:"PRs",v:Object.keys(prs).length,c:T.gold},{l:"SUPLS HOY",v:`${suppDone}/${mainSupps.length}`,c:allDone?T.green:T.orange}].map((s,i)=>(
            <div key={i} style={{background:T.dim,borderRadius:12,padding:"12px 8px",textAlign:"center",border:`1px solid ${s.c}16`}}>
              <BB s={26} c={s.c}>{s.v}</BB><div style={{marginTop:1}}><MM s={8}>{s.l}</MM></div>
            </div>
          ))}
        </div>
      </div>

      {/* Today */}
      <div style={{padding:"16px 20px 0"}}>
        <MM s={9} c={T.muted}>HOY — {["LUNES","MARTES","MIÉRCOLES","JUEVES","VIERNES","SÁBADO","DOMINGO"][todayIdx]}</MM>
        <div onClick={()=>onSelectDay(todayIdx)} className="tap"
          style={{marginTop:8,background:`linear-gradient(135deg,${todayDay.color}10,transparent)`,border:`1px solid ${todayDay.color}40`,borderRadius:16,padding:"16px 18px",cursor:"pointer",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-10,right:-8,fontFamily:"'Bebas Neue'",fontSize:80,color:todayDay.color+"06",lineHeight:1,pointerEvents:"none"}}>{todayDay.day}</div>
          <Row g={10} style={{marginBottom:7}}>
            <span style={{fontSize:24}}>{todayDay.icon}</span>
            <div><BB s={20} c={todayDay.color}>{todayDay.label}</BB><div style={{marginTop:1}}><MM s={10}>{todayDay.goal}</MM></div></div>
          </Row>
          <Row g={8} style={{flexWrap:"wrap"}}>
            <Chip c={todayDay.color} tiny>⏱ {todayDay.duration}</Chip>
            <Chip c={T.acc} tiny>Abrir sesión →</Chip>
          </Row>
        </div>
      </div>

      {/* Supp status */}
      <div style={{padding:"12px 20px 0"}}>
        {!allDone?(
          <div style={{background:T.orange+"0a",border:`1px solid ${T.orange}20`,borderRadius:12,padding:"11px 14px"}}>
            <Row g={8}><span style={{fontSize:16}}>⚠️</span><div><div style={{fontSize:12,fontWeight:700,color:T.orange}}>Suplementos pendientes</div><div style={{fontSize:11,color:T.muted,marginTop:2}}>{mainSupps.filter(s=>!suppLog[ts]?.[s.id]?.taken).map(s=>`${s.icon} ${s.name}`).join("  ·  ")}</div></div></Row>
          </div>
        ):(
          <div style={{background:T.green+"08",border:`1px solid ${T.green}1a`,borderRadius:12,padding:"11px 14px"}}>
            <Row g={8}><span style={{fontSize:16}}>✅</span><div style={{fontSize:12,fontWeight:700,color:T.green}}>Suplementos del día completos 💪</div></Row>
          </div>
        )}
      </div>

      {/* Week plan */}
      <div style={{padding:"16px 20px 0"}}>
        <MM s={9} c={T.muted}>PLAN SEMANAL</MM>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:10}}>
          {week.map((d,i)=>{
            const isToday=i===todayIdx;
            return(
              <div key={i} onClick={()=>onSelectDay(i)} className="tap"
                style={{background:isToday?d.color+"10":T.card,border:`1px solid ${isToday?d.color+"50":T.border}`,borderRadius:12,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,position:"relative",overflow:"hidden"}}>
                {isToday&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:d.color}}/>}
                <span style={{fontSize:20,flexShrink:0}}>{d.icon}</span>
                <div style={{flex:1}}>
                  <Row g={8} style={{flexWrap:"wrap",marginBottom:2}}>
                    <span style={{fontSize:13,fontWeight:600,color:isToday?T.text:T.muted}}>{d.day} — {d.label}</span>
                    {isToday&&<Chip c={d.color} tiny>HOY</Chip>}
                  </Row>
                  <MM s={10} c={T.muted}>{d.goal} · {(d.exercises||[]).length} ejercicios</MM>
                </div>
                <span style={{color:T.muted,fontSize:18}}>›</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Volume chart */}
      <div style={{padding:"14px 20px 0"}}>
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px 14px"}}>
          <Row j="space-between" style={{marginBottom:12}}>
            <BB s={12} c={T.text} ls="0.1em">VOLUMEN SEMANAL</BB>
            <MM s={10} c={T.acc}>{weekVol.reduce((a,w)=>a+w.vol,0).toLocaleString()} kg</MM>
          </Row>
          <div style={{display:"flex",gap:6,alignItems:"flex-end",height:72}}>
            {weekVol.map((d,i)=>{
              const h=d.vol>0?Math.max(8,(d.vol/maxVol)*60):3;
              const isT=d.key===ts;
              return(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  {d.vol>0&&<MM s={8} c={T.muted}>{d.vol>999?`${(d.vol/1000).toFixed(1)}k`:d.vol}</MM>}
                  <div style={{width:"100%",height:h,borderRadius:5,background:isT?T.acc:T.acc+"55",boxShadow:isT?`0 0 10px ${T.acc}55`:"none",transition:`height .7s ease ${i*50}ms`}}/>
                  <MM s={9} c={isT?T.acc:T.muted}>{d.label}</MM>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PRs */}
      {Object.keys(prs).length>0&&(
        <div style={{padding:"14px 20px 24px"}}>
          <MM s={9} c={T.gold}>🏆 MIS RÉCORDS</MM>
          <div style={{display:"flex",gap:8,marginTop:8,overflowX:"auto",paddingBottom:4}}>
            {Object.entries(prs).map(([key,pr])=>{
              const m=LIFT_META[key];const isBJ=key==="boxjump";
              return(
                <div key={key} style={{background:T.gold+"08",border:`1px solid ${T.gold}20`,borderRadius:12,padding:"11px 13px",minWidth:94,flexShrink:0,textAlign:"center"}}>
                  <div style={{fontSize:16,marginBottom:3}}>{m?.icon||"🏋️"}</div>
                  <MM s={8} c={T.muted}>{key}</MM>
                  <div style={{marginTop:3}}><BB s={22} c={isBJ?T.orange:T.gold}>{pr.weight}</BB><MM s={9} c={T.muted}> {pr.unit}</MM></div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


/* ─── EXPORT FUNCTIONS ───────────────────────────────────── */

function exportCSV(history, bodyLog, suppLog) {
  const rows = [];
  rows.push(["TRACKFIT ULTIMATE — EXPORTACIÓN"]);
  rows.push(["Fecha: " + new Date().toLocaleDateString("es-AR")]);
  rows.push([]);

  if (history.length > 0) {
    rows.push(["── HISTORIAL DE ENTRENAMIENTOS ──"]);
    rows.push(["Fecha","Ejercicio","S1 reps","S1 peso","S2 reps","S2 peso","S3 reps","S3 peso","S4 reps","S4 peso","Máximo","Volumen","Unidad","Notas"]);
    [...history].sort((a,b)=>a.date.localeCompare(b.date)).forEach(h=>{
      const row=[h.date, h.liftName];
      for(let i=0;i<4;i++){row.push(h.sets[i]?.reps||"");row.push(h.sets[i]?.weight||"");}
      row.push(h.maxWeight, h.totalVolume, h.unit||"kg", h.notes||"");
      rows.push(row);
    });
    rows.push([]);
  }

  const prs={};
  history.forEach(h=>{if(!prs[h.liftKey]||h.maxWeight>prs[h.liftKey].weight)prs[h.liftKey]={weight:h.maxWeight,date:h.date,name:h.liftName,unit:h.unit||"kg"};});
  if(Object.keys(prs).length>0){
    rows.push(["── RÉCORDS PERSONALES ──"]);
    rows.push(["Ejercicio","PR","Unidad","Fecha"]);
    Object.values(prs).forEach(pr=>rows.push([pr.name,pr.weight,pr.unit,pr.date]));
    rows.push([]);
  }

  if(bodyLog.length>0){
    rows.push(["── PESO CORPORAL ──"]);
    rows.push(["Fecha","Peso (kg)"]);
    [...bodyLog].sort((a,b)=>a.date.localeCompare(b.date)).forEach(b=>rows.push([b.date,b.weight]));
    rows.push([]);
  }

  const suppDates=Object.keys(suppLog).sort();
  if(suppDates.length>0){
    rows.push(["── SUPLEMENTOS ──"]);
    rows.push(["Fecha","Creatina","Omega 3","Proteína"]);
    suppDates.forEach(date=>{
      const dl=suppLog[date]||{};
      rows.push([date,dl.creatine?.taken?"SI":"NO",dl.omega3?.taken?"SI":"NO",dl.protein?.taken?"SI":"NO"]);
    });
  }

  const csv=rows.map(r=>r.map(cell=>{
    const s=String(cell).replace(/"/g,'""');
    return(s.includes(",")||s.includes("\n")||s.includes('"'))?'"'+s+'"':s;
  }).join(",")).join("\n");

  const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download="TrackFit_"+new Date().toISOString().split("T")[0]+".csv";
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
}

async function exportPDF(history, bodyLog) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });

  const ACC = [200,255,0];
  const BG  = [8,8,8];
  const W = doc.internal.pageSize.width;

  // Header
  doc.setFillColor(...BG);
  doc.rect(0,0,W,30,"F");
  doc.setTextColor(...ACC);
  doc.setFontSize(22);
  doc.setFont("helvetica","bold");
  doc.text("TRACKFIT ULTIMATE",14,18);
  doc.setFontSize(10);
  doc.setTextColor(180,180,180);
  doc.text("Reporte exportado: "+new Date().toLocaleDateString("es-AR"),14,26);

  let y = 38;

  // PRs section
  const prs={};
  history.forEach(h=>{if(!prs[h.liftKey]||h.maxWeight>prs[h.liftKey].weight)prs[h.liftKey]={weight:h.maxWeight,name:h.liftName,unit:h.unit||"kg",date:h.date};});

  if(Object.keys(prs).length>0){
    doc.setFontSize(13);
    doc.setTextColor(...ACC);
    doc.setFont("helvetica","bold");
    doc.text("RÉCORDS PERSONALES",14,y);
    y+=6;

    autoTable(doc,{
      startY:y,
      head:[["Ejercicio","PR","Unidad","Fecha"]],
      body:Object.values(prs).map(p=>[p.name,p.weight,p.unit,p.date]),
      theme:"grid",
      headStyles:{fillColor:BG,textColor:ACC,fontStyle:"bold"},
      bodyStyles:{fillColor:[20,20,20],textColor:[220,220,220]},
      alternateRowStyles:{fillColor:[30,30,30]},
      styles:{fontSize:10,cellPadding:3},
      margin:{left:14,right:14},
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // History section
  if(history.length>0){
    if(y>220){doc.addPage();y=20;}
    doc.setFontSize(13);
    doc.setTextColor(...ACC);
    doc.setFont("helvetica","bold");
    doc.text("HISTORIAL DE ENTRENAMIENTOS",14,y);
    y+=6;

    const sorted=[...history].sort((a,b)=>a.date.localeCompare(b.date));
    autoTable(doc,{
      startY:y,
      head:[["Fecha","Ejercicio","Series","Máximo","Volumen","Unidad"]],
      body:sorted.map(h=>[h.date,h.liftName,h.sets.length,h.maxWeight,h.totalVolume,h.unit||"kg"]),
      theme:"grid",
      headStyles:{fillColor:BG,textColor:ACC,fontStyle:"bold"},
      bodyStyles:{fillColor:[20,20,20],textColor:[220,220,220]},
      alternateRowStyles:{fillColor:[30,30,30]},
      styles:{fontSize:9,cellPadding:3},
      margin:{left:14,right:14},
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Body weight section
  if(bodyLog.length>0){
    if(y>220){doc.addPage();y=20;}
    doc.setFontSize(13);
    doc.setTextColor(...ACC);
    doc.setFont("helvetica","bold");
    doc.text("EVOLUCIÓN PESO CORPORAL",14,y);
    y+=6;

    autoTable(doc,{
      startY:y,
      head:[["Fecha","Peso (kg)"]],
      body:[...bodyLog].sort((a,b)=>a.date.localeCompare(b.date)).map(b=>[b.date,b.weight]),
      theme:"grid",
      headStyles:{fillColor:BG,textColor:ACC,fontStyle:"bold"},
      bodyStyles:{fillColor:[20,20,20],textColor:[220,220,220]},
      alternateRowStyles:{fillColor:[30,30,30]},
      styles:{fontSize:10,cellPadding:3},
      margin:{left:14,right:14},
      tableWidth:80,
    });
  }

  // Footer on each page
  const pageCount = doc.internal.getNumberOfPages();
  for(let i=1;i<=pageCount;i++){
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(80,80,80);
    doc.text("TrackFit Ultimate — Página "+i+" de "+pageCount, W/2, 290, {align:"center"});
  }

  doc.save("TrackFit_"+new Date().toISOString().split("T")[0]+".pdf");
}

/* ─── EXPORT MODAL ───────────────────────────────────────── */
function ExportModal({history,bodyLog,suppLog,onClose}){
  const[loading,setLoading]=useState(null);
  const[done,setDone]=useState(null);

  async function handleExport(type){
    setLoading(type);
    try{
      if(type==="csv") exportCSV(history,bodyLog,suppLog);
      if(type==="pdf") await exportPDF(history,bodyLog);
      setDone(type);
      setTimeout(()=>setDone(null),2000);
    }catch(e){console.error(e);}
    setLoading(null);
  }

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"#000000e0",zIndex:700,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} className="up"
        style={{background:"#0f0f0f",borderRadius:"22px 22px 0 0",padding:"24px 20px 40px",width:"100%",maxWidth:480,margin:"0 auto",border:"1px solid #2c2c2c"}}>
        <Row j="space-between" style={{marginBottom:18}}>
          <BB s={18} c="#C8FF00" ls="0.08em">EXPORTAR DATOS</BB>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#484848",fontSize:22,cursor:"pointer"}}>×</button>
        </Row>

        <div style={{background:"#1a1a1a",border:"1px solid #2c2c2c",borderRadius:12,padding:"14px 16px",marginBottom:14}}>
          <MM s={9} c="#C8FF00" bold>📊 QUÉ INCLUYE</MM>
          <div style={{display:"flex",flexDirection:"column",gap:7,marginTop:10}}>
            {[["📋","Historial completo","Fecha, ejercicio, series, reps, pesos"],["🏆","Récords personales","PR de cada ejercicio"],["⚖️","Peso corporal","Todos los registros"],["💊","Adherencia suplementos","Check diario"]].map(([ico,t,d])=>(
              <div key={t} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:16,flexShrink:0}}>{ico}</span>
                <div><div style={{fontSize:12,fontWeight:600,color:"#F0F0F0"}}>{t}</div><div style={{fontSize:11,color:"#484848"}}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* Excel/CSV */}
          <button onClick={()=>handleExport("csv")} className="tap"
            style={{width:"100%",background:done==="csv"?"#00E676":"#C8FF00",color:"#080808",border:"none",borderRadius:14,padding:"16px",fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:"0.08em",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,transition:"background .3s"}}>
            {loading==="csv"?"⏳ GENERANDO...":`📊 ${done==="csv"?"✓ DESCARGADO":"EXPORTAR EXCEL / CSV"}`}
          </button>
          <div style={{fontSize:11,color:"#484848",textAlign:"center"}}>Abrilo en Excel, Google Sheets o Numbers</div>

          {/* PDF */}
          <button onClick={()=>handleExport("pdf")} className="tap"
            style={{width:"100%",background:done==="pdf"?"#00E676":"#2196F3",color:"#080808",border:"none",borderRadius:14,padding:"16px",fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:"0.08em",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,transition:"background .3s",marginTop:4}}>
            {loading==="pdf"?"⏳ GENERANDO...":`📄 ${done==="pdf"?"✓ DESCARGADO":"EXPORTAR PDF"}`}
          </button>
          <div style={{fontSize:11,color:"#484848",textAlign:"center"}}>Reporte completo con tablas formateadas</div>
        </div>

        <div style={{marginTop:16,background:"#1a1a1a",borderRadius:12,padding:"11px 14px"}}>
          <div style={{fontSize:11,color:"#484848",lineHeight:1.6,textAlign:"center"}}>
            ⚠️ Los datos se guardan solo mientras la app está abierta.<br/>Exportá regularmente para no perderlos.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── TABS & APP ─────────────────────────────────────────── */
const TABS=[
  {id:"home",    label:"INICIO",   icon:"⚡"},
  {id:"session", label:"SESIÓN",   icon:"📋"},
  {id:"tracker", label:"TRACKER",  icon:"📈"},
  {id:"hist",    label:"HISTORIAL",icon:"📊"},
  {id:"supps",   label:"SUPLS",    icon:"💊"},
];

export default function App(){
  boot();
  const[week,setWeek]=useState(()=>DEFAULT_WEEK.map(d=>({...d,exercises:d.exercises.map(e=>({...e,id:uid()}))})));
  const[history,setHistory]=useState([]);
  const[suppLog,setSuppLog]=useState({});
  const[bodyLog,setBodyLog]=useState([]);
  const[tab,setTab]=useState("home");
  const[tabKey,setTabKey]=useState(0);
  const[selectedIdx,setSelectedIdx]=useState(0);
  const[showExport,setShowExport]=useState(false);

  const go=id=>{setTab(id);setTabKey(k=>k+1);};
  const openDay=idx=>{setSelectedIdx(idx);go("session");};
  const updateDay=updated=>setWeek(w=>w.map((d,i)=>i===selectedIdx?updated:d));

  return(
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Inter',sans-serif",display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto"}}>
      {/* Top bar */}
      <div style={{padding:"11px 18px 10px",background:T.surf,borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:100}}>
        <Row g={8}>
          <BB s={21} ls="0.06em">TRACK<span style={{color:T.acc}}>FIT</span></BB>
          <MM s={9} c={T.muted}>ULTIMATE</MM>
        </Row>
        <Row g={8}>
          <button onClick={()=>setShowExport(true)} className="tap"
            style={{background:T.green+"18",border:`1px solid ${T.green}30`,borderRadius:9,padding:"6px 11px",color:T.green,fontSize:11,fontWeight:700,cursor:"pointer"}}>
            📊 EXPORTAR
          </button>
          <div style={{width:6,height:6,borderRadius:"50%",background:T.green,animation:"pulse 2s infinite",boxShadow:`0 0 8px ${T.green}`}}/>
        </Row>
      </div>

      {/* Day strip */}
      {tab==="session"&&(
        <div style={{background:T.surf,borderBottom:`1px solid ${T.border}`,padding:"7px 14px",overflowX:"auto",display:"flex",gap:5,WebkitOverflowScrolling:"touch"}}>
          {week.map((d,i)=>(
            <button key={i} onClick={()=>setSelectedIdx(i)} className="tap"
              style={{background:selectedIdx===i?d.color+"22":T.card,border:`1px solid ${selectedIdx===i?d.color:T.border}`,borderRadius:9,padding:"7px 13px",color:selectedIdx===i?d.color:T.muted,fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
              {d.icon} {d.day}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div key={tabKey} className="up" style={{flex:1,overflowY:"auto",paddingBottom:80}}>
        {tab==="home"   &&<HomeView week={week} history={history} suppLog={suppLog} onSelectDay={openDay}/>}
        {tab==="session"&&<SessionView day={week[selectedIdx]} setDay={updateDay} history={history} setHistory={setHistory}/>}
        {tab==="tracker"&&<TrackerView history={history} bodyLog={bodyLog} setBodyLog={setBodyLog}/>}
        {tab==="hist"   &&<HistoryView history={history} setHistory={setHistory}/>}
        {tab==="supps"  &&<SuppsView suppLog={suppLog} setSuppLog={setSuppLog}/>}
      </div>

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:T.surf+"f4",backdropFilter:"blur(24px)",borderTop:`1px solid ${T.border}`,display:"flex",paddingBottom:10}}>
        {TABS.map(t=>{
          const isActive=tab===t.id;
          return(
            <button key={t.id} onClick={()=>go(t.id)} className="tap"
              style={{flex:1,background:"none",border:"none",cursor:"pointer",padding:"12px 4px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,position:"relative"}}>
              {isActive&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:28,height:2,background:T.acc,borderRadius:"0 0 3px 3px"}}/>}
              <span style={{fontSize:17}}>{t.icon}</span>
              <BB s={9} c={isActive?T.acc:T.muted} ls="0.12em">{t.label}</BB>
            </button>
          );
        })}
      </div>

      {showExport&&<ExportModal history={history} bodyLog={bodyLog} suppLog={suppLog} onClose={()=>setShowExport(false)}/>}
    </div>
  );
}
