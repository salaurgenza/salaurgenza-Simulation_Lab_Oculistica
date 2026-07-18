const phases=[['Accoglienza','Identità, procedura, lateralità'],['Sign-in','Allergie, digiuno, monitoraggio'],['Time-out','Piano condiviso e lente'],['Campo sterile','Preparazione e microscopio'],['Intervento','Campo oculare simulato'],['Evento','Movimento improvviso'],['Sign-out','Tracciabilità e recovery']];
const state={score:0,correct:0,errors:0,phase:0,tab:'patient',selectedTool:'sterile',moving:false,eventTriggered:false,voice:false,done:new Set(),penalties:new Set(),hr:78,bpS:132,bpD:74,spo:98,rr:16};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function syncHandClipBackground(){
  const photo=document.querySelector('.photoScene');
  if(!photo)return;
  const cs=getComputedStyle(photo);
  document.querySelectorAll('.handClip').forEach(el=>{
    el.style.backgroundImage=cs.backgroundImage;
    el.style.backgroundSize=cs.backgroundSize || 'cover';
    el.style.backgroundPosition=cs.backgroundPosition || 'center center';
  });
}

const tabs={patient:{k:'ACCERTAMENTO',t:'Paziente e documentazione',d:'Prima di avvicinarti al campo oculare, rendi esplicite identità, lato e documentazione.',a:[['identity','ID','Identità e lateralità','La paziente dichiara nome, procedura e occhio destro.'],['consent','DOC','Consenso e biometria','Controllo della documentazione e dei dati lente.'],['allergies','RX','Allergie, digiuno, terapia','Raccolta sintetica dei dati preoperatori.']]},safety:{k:'SURGICAL SAFETY',t:'Sign-in e time-out',d:'La procedura parte solo quando tutto il team ha confermato ad alta voce.',a:[['monitor','ECG','Monitor e accesso venoso','Parametri, accesso, profilassi e comfort.'],['iol','IOL','Lente intraoculare','Modello, potere, scadenza e tracciabilità.'],['timeout','T','Time-out OMS','Paziente, occhio destro, procedura e criticità.']]},team:{k:'TEAMWORK',t:'Équipe in sala',d:'Il simulatore premia leadership chiara, closed-loop e stop tempestivo.',a:[['teamBrief','TEAM','Briefing dei ruoli','Chirurgo, strumentista, sala e anestesia allineati.'],['closedLoop','LOOP','Closed-loop','Ogni richiesta viene ripetuta e confermata.'],['speakPatient','MARIA','Parla con Maria','Mantieni la paziente informata e collaborante.']]},anesthesia:{k:'ANESTESIA',t:'Sedazione e parametri',d:'La sicurezza respiratoria resta prioritaria durante tutta la simulazione.',a:[['monitor','ECG','Controlla monitor','ECG, PA, SpO₂, respiro e accesso.'],['sedate','SED','Rivaluta sedazione','Comfort e immobilità senza perdere collaborazione.'],['reassure','STOP','Stop e rassicura','Azione chiave se la paziente si muove.']]},operate:{k:'CAMPO OPERATORIO',t:'Intervento simulato',d:'Seleziona uno strumento o usa il campo oculare per avanzare nella procedura didattica.',a:[['sterile','✦','Prepara campo sterile','Teli, antisepsi e protezione della paziente.'],['scope','⌕','Allinea microscopio','Campo centrato e team pronto.'],['incision','╱','Incisione simulata','Avanzamento visivo sul target oculare.'],['phaco','◌','Faco simulata','Fase centrale con possibile evento dinamico.'],['reassure','Ⅱ','Stop movimento','Blocca procedura e rassicura la paziente.'],['lens','◎','Impianta lente','Solo a campo stabile.'],['hydrate','≈','Idrata e verifica','Chiusura del campo operatorio simulato.']]},debrief:{k:'SIGN-OUT',t:'Chiusura scenario',d:'Chiudi con conteggi, tracciabilità, terapia e consegna alla recovery.',a:[['finalCount','✓','Conta e tracciabilità','Materiali, lente e farmaci registrati.'],['signout','↗','Sign-out e recovery','Consegna strutturata e indicazioni postoperatorie.']]}};
function setupPhases(){$('#phaseLine').innerHTML=phases.map((_,i)=>`<span class="phaseDot ${i===0?'active':''}"></span>`).join('');updatePhase()}function updatePhase(){$$('.phaseDot').forEach((d,i)=>d.className='phaseDot '+(i<state.phase?'done':i===state.phase?'active':''));$('#phaseName').textContent=phases[state.phase][0];$('#phaseHint').textContent=phases[state.phase][1]}function setPhase(n){state.phase=Math.min(phases.length-1,Math.max(state.phase,n));updatePhase()}function addEvent(text,type='good'){const e=document.createElement('div');e.className='event '+type;e.textContent=text;$('#timeline').prepend(e);while($('#timeline').children.length>5)$('#timeline').lastChild.remove()}
function score(id,pts,text,type='good'){if(state.done.has(id))return false;state.done.add(id);state.score=Math.max(0,Math.min(100,state.score+pts));if(pts>0)state.correct++;if(pts<0)state.errors++;$('#score').textContent=state.score;$('#scoreCaption').textContent=`${state.score} / 100`;$('#scoreCircle').style.setProperty('--pct',state.score+'%');addEvent(text,type);render();return true}
function penalty(id,text){if(state.penalties.has(id))return;state.penalties.add(id);state.score=Math.max(0,state.score-6);state.errors++;$('#score').textContent=state.score;$('#scoreCaption').textContent=`${state.score} / 100`;$('#scoreCircle').style.setProperty('--pct',state.score+'%');addEvent(text,'bad');render()}
function say(who,text){$('#speaker').textContent=who.toUpperCase();$('#speech').textContent=text;$('#dialogue').classList.add('show');clearTimeout(window.speechTimer);window.speechTimer=setTimeout(()=>$('#dialogue').classList.remove('show'),5600);if(state.voice&&'speechSynthesis'in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='it-IT';u.rate=.94;speechSynthesis.speak(u)}}
function vitals({hr,bpS,bpD,spo,rr,status}={}){if(hr!=null)state.hr=hr;if(bpS!=null)state.bpS=bpS;if(bpD!=null)state.bpD=bpD;if(spo!=null)state.spo=spo;if(rr!=null)state.rr=rr;$('#hr').textContent=state.hr;$('#bp').textContent=`${state.bpS}/${state.bpD}`;$('#spo').textContent=state.spo;$('#rr').textContent=state.rr;const st=$('#monitorStatus');st.textContent=status||'STABILE';st.className=status==='ATTENZIONE'?'warn':status==='CRITICO'?'danger':''}
function sceneStage(stage,label){$('#scene').className='scene stage-'+stage+(state.moving?' moving':'');$('#eyeHotspot').dataset.label=label;$('#sceneNote').textContent=label==='Campo chiuso'?'Campo chiuso · pronto per sign-out':'Paziente sul lettino · '+label.toLowerCase()}
function requireDone(id,penaltyId,msg){if(state.done.has(id))return true;penalty(penaltyId,msg);say('Team','Prima completiamo la verifica precedente.');return false}
function triggerMovement(){if(state.eventTriggered)return;state.eventTriggered=true;setTimeout(()=>{state.moving=true;setPhase(5);setActorPhase('event');$('#scene').classList.add('moving');vitals({hr:96,bpS:145,bpD:82,spo:97,rr:22,status:'ATTENZIONE'});addEvent('Evento: movimento improvviso','warn');say('Maria Bianchi','Scusate, devo tossire. Non riesco a stare ferma.');render()},800)}

/* ===== V9 · logica équipe interattiva ===== */
const actorTexts={
  surgeon:{
    patient:'Procediamo solo dopo identificazione, consenso, lente e time-out.',
    timeout:'Confermo occhio destro, procedura e lente. Il team è pronto.',
    field:'Mi posiziono al microscopio. Campo centrato prima di iniziare.',
    surgery:'Richiedo uno strumento alla volta. La procedura avanza solo con scelta corretta.',
    event:'Stop immediato: strumenti fuori dal campo finché la paziente non è stabile.',
    recovery:'Procedura conclusa. Passiamo a tracciabilità e sign-out.'
  },
  scrub:{
    patient:'Tavolo servitore in preparazione. Controllo integrità e disponibilità degli strumenti.',
    timeout:'Strumenti e lente verificati. Ripeto ogni richiesta con closed-loop.',
    field:'Preparo campo sterile e strumentario per cataratta.',
    surgery:'Sono pronta alla consegna. Trascina lo strumento corretto nel campo.',
    event:'Ritiro lo strumento e mantengo il campo in sicurezza.',
    recovery:'Conta e tracciabilità completate.'
  },
  circulating:{
    patient:'Verifico identità, consenso, lateralità, allergie e documentazione.',
    timeout:'Coordino il time-out e registro le conferme del team.',
    field:'Mantengo la sicurezza ambientale e supporto la tracciabilità.',
    surgery:'Registro i passaggi critici e anticipo materiali e farmaci.',
    event:'Rassicuro la paziente e supporto la comunicazione del team.',
    recovery:'Consegna strutturata alla recovery room.'
  },
  anesthetist:{
    patient:'Parametri stabili. Sedazione leggera, paziente collaborante.',
    timeout:'Monitoraggio attivo, accesso venoso pervio e piano di stop condiviso.',
    field:'Controllo comfort, respiro e immobilità durante il campo.',
    surgery:'Sorveglio respiro e movimento mentre il chirurgo opera.',
    event:'Maria, respiri lentamente. Procedura ferma finché non torna immobile.',
    recovery:'Parametri stabili per trasferimento in recovery.'
  }
};
let actorPhase='patient';
function setActorPhase(phase){
  actorPhase=phase||'patient';
  const layer=document.getElementById('actorLayer');
  if(!layer)return;
  layer.className='actorLayer phase-'+actorPhase;
  document.querySelectorAll('.actor').forEach(a=>a.classList.remove('working','speaking'));
  if(actorPhase==='field'){document.querySelector('.actor.scrub')?.classList.add('working')}
  if(actorPhase==='surgery'){document.querySelector('.actor.surgeon')?.classList.add('working');document.querySelector('.actor.scrub')?.classList.add('working')}
  if(actorPhase==='event'){document.querySelector('.actor.anesthetist')?.classList.add('working');document.querySelector('.actor.scrub')?.classList.add('working')}
}
function actorSpeak(actorKey,overrideText){
  const names={surgeon:'Dott. Ricci · chirurgo',scrub:'Laura · strumentista',circulating:'Elena · infermiere di sala',anesthetist:'Dott. Conti · anestesia'};
  const actor=document.querySelector(`.actor.${actorKey}`);
  document.querySelectorAll('.actor').forEach(a=>a.classList.remove('speaking'));
  actor?.classList.add('speaking');
  const text=overrideText || actorTexts[actorKey]?.[actorPhase] || 'Sono pronto.';
  const toast=document.getElementById('actorToast');
  if(toast){
    document.getElementById('actorToastWho').textContent=(names[actorKey]||'Team').toUpperCase();
    document.getElementById('actorToastText').textContent=text;
    toast.classList.add('show');
    clearTimeout(window.actorToastTimer);
    window.actorToastTimer=setTimeout(()=>{toast.classList.remove('show');actor?.classList.remove('speaking')},5200);
  }
  const voiceName=(names[actorKey]||'Team').split(' · ')[0];
  say(voiceName,text);
}

function action(id){const a={identity(){if(score(id,8,'Identità e occhio destro confermati')){setPhase(1);setActorPhase('patient');actorSpeak('circulating','Identità e lateralità confermate. Ora completiamo la documentazione.');say('Maria Bianchi','Sono Maria Bianchi. Oggi mi operate l’occhio destro.')}},consent(){if(score(id,5,'Consenso, biometria e documentazione presenti'))say('Elena, infermiere di sala','Consenso firmato, biometria disponibile e lato coerente.')},allergies(){if(score(id,5,'Allergie, digiuno e terapia verificati'))say('Maria Bianchi','Non ho allergie note e sono a digiuno da ieri sera.')},monitor(){if(score(id,8,'Monitoraggio e accesso completati')){setPhase(2);setActorPhase('timeout');vitals({hr:76,bpS:130,bpD:72,spo:99,rr:15,status:'STABILE'});actorSpeak('anesthetist','Monitoraggio attivo, accesso venoso pervio, sedazione leggera.');say('Dott. Conti','Monitoraggio attivo, accesso venoso pervio, sedazione leggera.')}},iol(){if(score(id,8,'Lente intraoculare verificata'))say('Laura, strumentista','Lente corretta: modello, potere, confezione e scadenza confermati.')},timeout(){if(!requireDone('identity','timeout-identity','Time-out senza identità'))return;if(!requireDone('monitor','timeout-monitor','Time-out senza monitoraggio'))return;if(!requireDone('iol','timeout-iol','Time-out senza lente'))return;if(score(id,12,'Time-out OMS completato')){setPhase(3);setActorPhase('timeout');actorSpeak('surgeon','Confermo paziente, occhio destro, procedura e lente. Il team è allineato.');say('Dott. Ricci','Confermo paziente, occhio destro, procedura e lente. Il team è allineato.')}},teamBrief(){if(score(id,5,'Ruoli e piano di escalation condivisi'))say('Elena, infermiere di sala','Ruoli chiari e piano di stop condiviso prima dell’incisione.')},closedLoop(){if(score(id,5,'Comunicazione closed-loop attivata'))say('Laura, strumentista','Ripeto e confermo ogni passaggio richiesto.')},speakPatient(){if(score(id,4,'Paziente rassicurata'))say('Maria Bianchi','Grazie, sapere cosa succede mi aiuta a restare tranquilla.')},sedate(){if(score(id,6,'Sedazione rivalutata')){vitals({hr:74,bpS:128,bpD:72,spo:99,rr:15,status:'STABILE'});say('Dott. Conti','Sedazione titolata, respiro conservato e paziente collaborante.')}},sterile(){if(!requireDone('timeout','sterile-timeout','Campo prima del time-out'))return;if(score(id,8,'Campo sterile preparato')){setPhase(3);setActorPhase('field');sceneStage('sterile','Campo sterile');actorSpeak('scrub','Campo sterile integro, teli posizionati e comfort verificato.');say('Laura, strumentista','Campo sterile integro, teli posizionati e comfort verificato.')}},scope(){if(!requireDone('sterile','scope-sterile','Microscopio prima del campo'))return;if(score(id,6,'Microscopio centrato')){sceneStage('scope','Microscopio centrato');say('Dott. Ricci','Campo centrato e visibilità adeguata.')}},incision(){if(!requireDone('scope','incision-scope','Incisione prima del microscopio'))return;if(score(id,8,'Incisione simulata completata')){setPhase(4);setActorPhase('surgery');sceneStage('incision','Incisione simulata');actorSpeak('surgeon','Incisione simulata eseguita. Manteniamo campo e paziente stabili.');say('Dott. Ricci','Incisione simulata eseguita. Manteniamo campo e paziente stabili.')}},phaco(){if(!requireDone('incision','phaco-incision','Faco prima dell’incisione'))return;if(score(id,9,'Faco simulata avviata')){setActorPhase('surgery');sceneStage('phaco','Faco simulata');actorSpeak('surgeon','Fase centrale avviata. Tutti pronti a fermarsi se la paziente si muove.');say('Dott. Ricci','Fase centrale avviata. Tutti pronti a fermarsi se la paziente si muove.');triggerMovement()}},reassure(){if(!state.moving){if(score('reassure-before',4,'Piano di stop condiviso'))say('Dott. Conti','Se Maria si muove, fermiamo subito la procedura e la guidiamo con calma.');return}if(score(id,12,'Movimento gestito con stop e comunicazione')){state.moving=false;setActorPhase('surgery');$('#scene').classList.remove('moving');vitals({hr:84,bpS:136,bpD:76,spo:98,rr:17,status:'STABILE'});say('Dott. Conti','Stop procedura. Maria, respiri lentamente e resti immobile. Riprendiamo solo quando è stabile.')}},stop(){a.reassure()},lens(){if(!requireDone('phaco','lens-phaco','Lente prima della faco'))return;if(state.moving){penalty('lens-moving','Lente tentata durante movimento');say('Dott. Ricci','No, prima stop e stabilizzazione della paziente.');return}if(score(id,10,'Lente intraoculare impiantata nella simulazione')){sceneStage('lens','Lente in sede');say('Laura, strumentista','Lente consegnata e tracciabilità confermata.')}},hydrate(){if(!requireDone('lens','hydrate-lens','Idratazione prima della lente'))return;if(score(id,7,'Idratazione e verifica completate')){setPhase(6);setActorPhase('recovery');sceneStage('hydrate','Campo chiuso');actorSpeak('surgeon','Campo stabile. Procediamo alla chiusura e al sign-out.');say('Dott. Ricci','Campo stabile. Procediamo alla chiusura e al sign-out.')}},finalCount(){if(score(id,7,'Conta finale e tracciabilità completate'))say('Laura, strumentista','Conta finale corretta. Lente, farmaci e dispositivi registrati.')},signout(){if(!requireDone('hydrate','signout-hydrate','Sign-out prima della chiusura'))return;if(score(id,10,'Sign-out e recovery completati')){setPhase(6);say('Elena, infermiere di sala','Procedura, lente, terapia e consegna postoperatoria documentate.');finish()}}};if(a[id])a[id]()}
function render(){const t=tabs[state.tab];$('#panelContent').innerHTML=`<div class="kicker">${t.k}</div><h2 class="panelTitle">${t.t}</h2><p class="lead">${t.d}</p>${t.a.map(([id,ico,title,sub])=>`<button class="action ${state.done.has(id)?'done':''}" data-action="${id}"><span class="aicon">${ico}</span><span><b>${title}</b><span>${sub}</span></span><span class="check">${state.done.has(id)?'✓':'›'}</span></button>`).join('')}`;$$('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.tab));$$('.tool').forEach(b=>{const tool=b.dataset.tool;b.classList.toggle('active',tool===state.selectedTool);b.classList.toggle('done',state.done.has(tool)||(tool==='stop'&&state.done.has('reassure')))})}
function switchTab(tab){state.tab=tab;render()}function finish(){const s=state.score;$('#finalScore').textContent=s;$('#correctCount').textContent=state.correct;$('#errorCount').textContent=state.errors;$('#finalTitle').textContent=s>=85?'Performance molto buona':s>=65?'Scenario completato':'Scenario da rivedere';$('#finalText').textContent=s>=85?'Hai mantenuto il paziente al centro, coordinando verifiche, campo, intervento simulato ed evento dinamico.':s>=65?'Hai completato il percorso, ma alcune verifiche possono essere più tempestive.':'Rivedi sign-in, time-out, campo sterile, stop durante movimento e sign-out.';const miss=[['identity','identificazione'],['timeout','time-out'],['sterile','campo sterile'],['reassure','stop movimento'],['lens','lente'],['signout','sign-out']].filter(([id])=>!state.done.has(id)).map(x=>x[1]);$('#feedback').innerHTML=miss.length?`<p class="lead"><b>Da rinforzare:</b> ${miss.join(', ')}.</p>`:'<p class="lead"><b>Obiettivi prioritari completati.</b></p>';$('#modal').classList.remove('hidden')}
function reset(){location.reload()}setupPhases();render();vitals();setActorPhase('patient');document.querySelectorAll('.actor').forEach(a=>a.addEventListener('click',()=>actorSpeak(a.dataset.actor)));$('#startBtn').addEventListener('click',()=>{$('#startScreen').classList.add('hidden');say('Elena, infermiere di sala','Scenario avviato. Partiamo dalla verifica della paziente e dell’occhio destro.')});$('#resetBtn').addEventListener('click',reset);$('#modalReset').addEventListener('click',reset);$('#modalClose').addEventListener('click',()=>$('#modal').classList.add('hidden'));$('#voiceBtn').addEventListener('click',e=>{state.voice=!state.voice;e.currentTarget.textContent=state.voice?'V':'S';if(!state.voice&&'speechSynthesis'in window)speechSynthesis.cancel()});$('#fullBtn').addEventListener('click',()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.());$$('.tab').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));$('#panelContent').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)action(b.dataset.action)});$('#toolDock').addEventListener('click',e=>{
  const b=e.target.closest('[data-tool]');
  if(!b)return;
  if(b.dataset.tool==='sterile'){
    state.selectedTool='sterile';
    render();
    addEvent('Apertura équipe interattiva, tavolo servitore virtuale','warn');
    say('Laura, strumentista','Apro il tavolo servitore. Prepariamoci a consegnare gli strumenti in closed-loop.');
    openSurgery();
    return;
  }
  state.selectedTool=b.dataset.tool;
  render();
  if(b.dataset.tool==='stop'||b.dataset.tool==='signout')action(b.dataset.tool)
});
$('#eyeHotspot').addEventListener('click',()=>action(state.selectedTool));


/* ===== V6 · motore chirurgia dinamica ===== */
const surgerySteps=[
 {id:'blefarostato',name:'Blefarostato',short:'Blefarostato',icon:'◉',phase:'Preparazione del campo',instruction:'Il chirurgo chiede di aprire il campo palpebrale prima degli accessi. Seleziona il blefarostato e portalo nel campo.',request:'Iniziamo. Blefarostato.',confirm:'Blefarostato, confermo.',from:0.00,to:0.05},
 {id:'lama22',name:'Lama 2,2 mm',short:'Lama 2.2',icon:'╱',phase:'Accesso principale',instruction:'Seleziona la lama 2,2 per l’incisione principale. Il video 3D avanza al passaggio degli accessi anteriori.',request:'Lama due punto due per l’incisione principale.',confirm:'Lama 2,2, confermo.',from:0.05,to:0.12},
 {id:'lama12',name:'Lama 1,2 mm',short:'Lama 1.2',icon:'╲',phase:'Accesso secondario',instruction:'Ora serve la lama 1,2 per la paracentesi/accesso secondario. Il video resta nella fase degli accessi anteriori.',request:'Lama uno punto due per l’accesso secondario.',confirm:'Lama 1,2, confermo.',from:0.12,to:0.18},
 {id:'viscoat',name:'Viscoat',short:'Viscoat',icon:'◒',phase:'Viscoelastico',instruction:'Proteggi camera anteriore e endotelio. Seleziona Viscoat e portalo nel campo.',request:'Viscoat.',confirm:'Viscoat, confermo.',from:0.18,to:0.24},
 {id:'capsuloressi',name:'Pinza da capsuloressi',short:'Capsuloressi',icon:'⌁',phase:'Capsuloressi',instruction:'Seleziona la pinza per capsuloressi e accompagna l’apertura continua della capsula anteriore.',request:'Pinza da capsuloressi.',confirm:'Pinza da capsuloressi, confermo.',from:0.24,to:0.36},
 {id:'idrodissezione',name:'Cannula da idrodissezione',short:'Idrodissezione',icon:'≈',phase:'Idrodissezione',instruction:'Scegli la cannula per mobilizzare il nucleo e preparare la fase di faco.',request:'Cannula da idrodissezione.',confirm:'Cannula da idrodissezione, confermo.',from:0.36,to:0.44},
 {id:'facoemulsificatore',name:'Manipolo facoemulsificatore',short:'Faco',icon:'◉',phase:'Facoemulsificazione',instruction:'Prendi il manipolo faco. Durante questa fase la paziente potrebbe tossire: se accade, devi fermare e retrarre.',request:'Manipolo faco.',confirm:'Manipolo faco, confermo.',from:0.44,to:0.58,cough:true},
 {id:'chopper',name:'Chopper',short:'Chopper',icon:'⌇',phase:'Frammentazione del nucleo',instruction:'Serve il chopper per supportare la frammentazione del nucleo insieme al faco.',request:'Chopper.',confirm:'Chopper, confermo.',from:0.58,to:0.68},
 {id:'ia',name:'Manipolo irrigazione/aspirazione',short:'I/A',icon:'⇄',phase:'Irrigazione e aspirazione',instruction:'Rimuovi i residui corticali con il manipolo I/A.',request:'Manipolo irrigazione aspirazione.',confirm:'Manipolo I/A, confermo.',from:0.68,to:0.78},
 {id:'provisc',name:'Provisc',short:'Provisc',icon:'◌',phase:'Preparazione sacco capsulare',instruction:'Riempi il sacco capsulare prima di inserire la lente.',request:'Provisc.',confirm:'Provisc, confermo.',from:0.78,to:0.84},
 {id:'lenteIOL',name:'Lente intraoculare IOL',short:'Lente IOL',icon:'◎',phase:'Impianto della IOL',instruction:'Seleziona la lente/iniettore IOL. Il video avanza all’impianto e apertura della lente.',request:'Lente intraoculare.',confirm:'Lente IOL, confermo.',from:0.84,to:0.94},
 {id:'aprokam',name:'Aprokam intracamerale',short:'Aprokam',icon:'✚',phase:'Terapia intracamerale e chiusura',instruction:'Concludi con Aprokam e controllo finale del campo prima del sign-out.',request:'Aprokam.',confirm:'Aprokam, confermo.',from:0.94,to:1.00}
];
const instrumentPhotos={"blefarostato": "assets/images/image-02.png", "lama22": "assets/images/image-03.png", "lama12": "assets/images/image-04.png", "viscoat": "assets/images/image-05.png", "capsuloressi": "assets/images/image-06.png", "idrodissezione": "assets/images/image-07.png", "facoemulsificatore": "assets/images/image-08.png", "chopper": "assets/images/image-09.png", "ia": "assets/images/image-10.png", "provisc": "assets/images/image-11.png", "lenteIOL": "assets/images/image-12.png", "aprokam": "assets/images/image-13.png", "forbici": "assets/images/image-14.png", "portaghi": "assets/images/image-15.png", "pinza": "assets/images/image-16.png", "siringa": "assets/images/image-17.png"};
const extraInstruments=[
 {id:'forbici',name:'Forbici microchirurgiche',short:'Forbici',icon:'✂'},
 {id:'portaghi',name:'Portaghi',short:'Portaghi',icon:'⌖'},
 {id:'pinza',name:'Pinza anatomica non richiesta',short:'Pinza',icon:'⌇'},
 {id:'siringa',name:'Siringa generica',short:'Siringa',icon:'▱'}
];
const surgeryState={step:0,selected:null,completed:new Set(),api:null,ready:false,animationUID:null,duration:100,playingTimer:null,coughActive:false,coughResolved:false,surgeryScore:0};
const sfUID='375ec3c07a0f42108da9334b6f9c1f85';
function surgerySay(who,text){document.getElementById('closedLoopText').textContent=who+': «'+text+'»';say(who,text)}
function initSketchfab(){
 const iframe=document.getElementById('sketchfabViewer'); if(!iframe||surgeryState.api)return;
 if(typeof Sketchfab==='undefined'){
   iframe.src='https://sketchfab.com/models/'+sfUID+'/embed?autostart=0&ui_infos=0&ui_controls=1&ui_stop=0&ui_watermark_link=0';
   document.getElementById('viewerLoading').classList.add('hidden'); document.getElementById('surgeryStatus').textContent='Viewer standard'; return;
 }
 const client=new Sketchfab('1.12.1',iframe);
 client.init(sfUID,{autostart:0,preload:1,ui_infos:0,ui_controls:0,ui_stop:0,ui_watermark_link:0,ui_watermark:1,ui_annotations:0,success:function(api){
   surgeryState.api=api; api.start(function(){
    api.addEventListener('viewerready',function(){
      surgeryState.ready=true; document.getElementById('viewerLoading').classList.add('hidden'); document.getElementById('surgeryStatus').textContent='Video 3D pronto · attesa strumento';
      api.getAnimations(function(err,animations){if(!err&&animations&&animations.length){surgeryState.animationUID=animations[0][0];surgeryState.duration=animations[0][2]||100;api.setCurrentAnimationByUID(surgeryState.animationUID,function(){api.setCycleMode('one');api.pause();api.seekTo(0);});}});
    });
   });
 },error:function(){iframe.src='https://sketchfab.com/models/'+sfUID+'/embed?autostart=0&ui_infos=0&ui_controls=1';document.getElementById('viewerLoading').classList.add('hidden');document.getElementById('surgeryStatus').textContent='Modalità incorporata';}});
}
function openSurgery(){setActorPhase('surgery');
 const modal=document.getElementById('surgeryModal'); modal.classList.remove('hidden');modal.setAttribute('aria-hidden','false');initSketchfab();renderInstrumentTray();updateSurgeryStep();setTimeout(()=>{if(surgerySteps[surgeryState.step])surgerySay('Dott. Ricci',surgerySteps[surgeryState.step].request);const exp=document.querySelector('.instrumentCard.expected');if(exp){exp.classList.add('requestPulse');setTimeout(()=>exp.classList.remove('requestPulse'),1800);}},500);
}
function closeSurgery(){setActorPhase(state.moving?'event':'field');document.getElementById('surgeryModal').classList.add('hidden');document.getElementById('surgeryModal').setAttribute('aria-hidden','true');if(surgeryState.api)surgeryState.api.pause();}
function renderInstrumentTray(){
 const all=[...surgerySteps.map(x=>({id:x.id,name:x.name,short:x.short,icon:x.icon})),...extraInstruments];
 const expected=surgerySteps[surgeryState.step];document.getElementById('instrumentTray').innerHTML=all.map(i=>`<button type="button" class="instrumentCard ${surgeryState.completed.has(i.id)?'used':''} ${surgeryState.selected===i.id?'selected':''} ${expected&&expected.id===i.id?'expected':''}" draggable="${!surgeryState.completed.has(i.id)}" data-instrument="${i.id}"><img class="instThumb" src="${instrumentPhotos[i.id]||''}" alt="${i.name}"><span class="instMeta"><b>${i.short}</b><small>${i.name}</small><span class="instBadge">${surgeryState.completed.has(i.id)?'USATO':(expected&&expected.id===i.id?'RICHIESTO':'TRASCINA')}</span></span></button>`).join('');
 document.querySelectorAll('.instrumentCard').forEach(card=>{card.addEventListener('click',()=>selectInstrument(card.dataset.instrument));card.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',card.dataset.instrument);selectInstrument(card.dataset.instrument)});});
}
function selectInstrument(id){if(surgeryState.completed.has(id))return;surgeryState.selected=id;renderInstrumentTray();const picked=([...(surgerySteps),...extraInstruments].find(x=>x.id===id)?.name||id).toUpperCase();const drop=document.getElementById('surgicalFieldDrop');drop.classList.add('ready');drop.textContent='PORTA NEL CAMPO: '+picked;}
function useSelectedInstrument(){if(!surgeryState.selected)return;useInstrument(surgeryState.selected)}
function useInstrument(id){
 const expected=surgerySteps[surgeryState.step]; if(!expected)return;
 const card=document.querySelector(`[data-instrument="${id}"]`);
 if(id!==expected.id){if(card){card.classList.add('wrong');setTimeout(()=>card.classList.remove('wrong'),550)}penalty('surgery-wrong-'+surgeryState.step+'-'+id,'Strumento errato in '+expected.phase);surgerySay('Dott. Ricci','Stop. Questo non è lo strumento richiesto.');return;}
 if(surgeryState.coughActive){surgerySay('Dott. Conti','Prima dobbiamo gestire il movimento della paziente e retrarre gli strumenti.');return;}
 surgeryState.completed.add(id);surgeryState.selected=null;surgeryState.surgeryScore+=10;score('v6-'+id,Math.min(4,100-state.score),'Strumento corretto: '+expected.name);setActorPhase(expected.cough?'event':'surgery');actorSpeak('scrub',expected.confirm);surgerySay('Laura, strumentista',expected.confirm);renderInstrumentTray();playSurgerySegment(expected);
}
function playSurgerySegment(step){
 document.getElementById('viewerStageTitle').textContent=step.phase;document.getElementById('viewerStageText').textContent='Strumento corretto: '+step.name+'. La fase 3D è in esecuzione.';document.getElementById('surgeryStatus').textContent='In esecuzione · '+step.phase;
 const api=surgeryState.api; const start=surgeryState.duration*step.from,end=surgeryState.duration*step.to; const speed=parseFloat(document.getElementById('viewerSpeed').value||'1');
 clearInterval(surgeryState.playingTimer);
 if(api&&surgeryState.ready){api.pause();api.setSpeed(speed);api.seekTo(start,function(){api.play();});surgeryState.playingTimer=setInterval(()=>{api.getCurrentTime(function(err,t){if(!err&&t>=end){api.pause();clearInterval(surgeryState.playingTimer);segmentCompleted(step);}})},220);}else{setTimeout(()=>segmentCompleted(step),2200);}
 if(step.cough)setTimeout(()=>triggerSurgeryCough(),Math.max(1100,(end-start)/Math.max(speed,.1)*500));
}
function segmentCompleted(step){if(step.cough&&surgeryState.coughActive)return;document.getElementById('surgeryStatus').textContent='Fase completata';surgeryState.step++;if(surgeryState.step>=surgerySteps.length){document.getElementById('stepCount').textContent='PROCEDURA COMPLETATA';document.getElementById('stepTitle').textContent='Procedura cataratta completata';document.getElementById('stepInstruction').textContent='Accessi, capsuloressi, faco, I/A, IOL e Aprokam completati. Procedi con tracciabilità e sign-out.';document.getElementById('surgicalFieldDrop').textContent='CHIRURGIA 3D COMPLETATA';surgerySay('Dott. Ricci','Procedura completata. Lente in sede, terapia intracamerale somministrata. Procediamo al sign-out.');state.done.add('incision');state.done.add('phaco');state.done.add('lens');state.done.add('hydrate');setPhase(6);render();return;}updateSurgeryStep();setTimeout(()=>{if(surgerySteps[surgeryState.step])surgerySay('Dott. Ricci',surgerySteps[surgeryState.step].request);const exp=document.querySelector('.instrumentCard.expected');if(exp){exp.classList.add('requestPulse');setTimeout(()=>exp.classList.remove('requestPulse'),1800);}},500);}
function updateSurgeryStep(){const s=surgerySteps[surgeryState.step];if(!s)return;document.getElementById('stepCount').textContent=`PASSAGGIO ${surgeryState.step+1} DI ${surgerySteps.length}`;document.getElementById('stepTitle').textContent=s.phase;document.getElementById('stepInstruction').textContent=s.instruction;document.getElementById('viewerStageTitle').textContent=s.phase;document.getElementById('viewerStageText').textContent='In attesa dello strumento corretto: '+s.name+'. Quando lo porti nel campo, il video 3D esegue il segmento corrispondente.';const drop=document.getElementById('surgicalFieldDrop');drop.classList.remove('locked');drop.classList.add('ready');drop.innerHTML='TRASCINA QUI LA FOTO: '+s.name.toUpperCase()+'<br><small>closed-loop: ascolta la richiesta, scegli lo strumento e rilascialo nel campo</small>';renderInstrumentTray();}
function triggerSurgeryCough(){if(surgeryState.coughActive||surgeryState.coughResolved)return;surgeryState.coughActive=true;if(surgeryState.api)surgeryState.api.pause();clearInterval(surgeryState.playingTimer);document.getElementById('surgeryModal').classList.add('patientMove');const p=document.getElementById('patientState');p.className='patientState alert';p.innerHTML='<b>Maria Bianchi · movimento improvviso</b><span>La paziente tossisce: gli strumenti sono ancora nel campo.</span>';document.getElementById('surgicalFieldDrop').classList.add('locked');document.getElementById('surgicalFieldDrop').textContent='STOP · RETRAI GLI STRUMENTI';document.getElementById('surgeryStatus').textContent='ATTENZIONE · PAZIENTE IN MOVIMENTO';surgerySay('Maria Bianchi','Devo tossire. Non riesco a stare ferma.');}
function emergencyStop(){
 if(!surgeryState.coughActive){surgerySay('Dott. Conti','Stop di sicurezza disponibile. La paziente al momento è stabile.');if(surgeryState.api)surgeryState.api.pause();return;}
 if(surgeryState.api){surgeryState.api.pause();surgeryState.api.setSpeed(-0.65);surgeryState.api.play();setTimeout(()=>{surgeryState.api.pause();surgeryState.api.setSpeed(1)},1100)}
 surgeryState.coughActive=false;surgeryState.coughResolved=true;document.getElementById('surgeryModal').classList.remove('patientMove');const p=document.getElementById('patientState');p.className='patientState stable';p.innerHTML='<b>Maria Bianchi · nuovamente collaborante</b><span>Procedura interrotta, strumenti retratti, respiro regolare.</span>';document.getElementById('surgicalFieldDrop').classList.remove('locked');score('v6-cough-stop',8,'Movimento gestito: stop e retrazione');surgerySay('Dott. Conti','Stop procedura. Strumenti retratti. Maria, respiri lentamente. Riprendiamo soltanto quando è stabile.');setTimeout(()=>segmentCompleted(surgerySteps[surgeryState.step]),1400);
}
function bindSurgeryUI(){
 
const eyePreview=document.getElementById('eyePreview');
if(eyePreview){
  const setEyeFront=()=>{
    eyePreview.removeAttribute('auto-rotate');
    eyePreview.setAttribute('interaction-prompt','none');
    eyePreview.setAttribute('camera-controls','');
    eyePreview.setAttribute('camera-target','0m 0m 0m');
    eyePreview.setAttribute('camera-orbit','95deg 88deg 0.34m');
    eyePreview.setAttribute('field-of-view','20deg');
    eyePreview.setAttribute('min-camera-orbit','auto auto 0.24m');
    eyePreview.setAttribute('max-camera-orbit','auto auto 0.90m');
    eyePreview.setAttribute('orientation','0deg -90deg 0deg');
    if(typeof eyePreview.jumpCameraToGoal==='function') eyePreview.jumpCameraToGoal();
  };
  eyePreview.addEventListener('load',()=>setTimeout(setEyeFront,150));
  window.addEventListener('load',()=>setTimeout(setEyeFront,700));
}
const openers=[document.getElementById('openEyeBtn')].filter(Boolean);openers.forEach(b=>b.addEventListener('click',openSurgery));document.getElementById('closeSurgeryBtn').addEventListener('click',closeSurgery);
 const drop=document.getElementById('surgicalFieldDrop');drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragover')});drop.addEventListener('dragleave',()=>drop.classList.remove('dragover'));drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragover');useInstrument(e.dataTransfer.getData('text/plain'))});drop.addEventListener('click',useSelectedInstrument);
 document.getElementById('viewerPlay').addEventListener('click',()=>surgeryState.api&&surgeryState.api.play());document.getElementById('viewerPause').addEventListener('click',()=>surgeryState.api&&surgeryState.api.pause());document.getElementById('viewerReverse').addEventListener('click',()=>{if(surgeryState.api){surgeryState.api.setSpeed(-.65);surgeryState.api.play();setTimeout(()=>{surgeryState.api.pause();surgeryState.api.setSpeed(1)},1200)}});document.getElementById('viewerSpeed').addEventListener('change',e=>surgeryState.api&&surgeryState.api.setSpeed(parseFloat(e.target.value)));
 document.getElementById('emergencyStop').addEventListener('click',emergencyStop);document.getElementById('showLocalEye').addEventListener('click',()=>document.getElementById('localEyePanel').classList.remove('hidden'));document.getElementById('closeLocalEye').addEventListener('click',()=>document.getElementById('localEyePanel').classList.add('hidden'));
}
bindSurgeryUI();




window.addEventListener('DOMContentLoaded', function(){
  const btn = document.getElementById('openSurgeryBtn');
  if (btn) {
    btn.addEventListener('click', function(ev){
      ev.preventDefault();
      ev.stopImmediatePropagation();
      window.location.href = 'tavolo-servitore.html';
    }, true);
  }
});



window.addEventListener('load', function(){
  if (window.syncHandClipBackground) {
    syncHandClipBackground();
    setTimeout(syncHandClipBackground, 150);
    setTimeout(syncHandClipBackground, 800);
  }
});
