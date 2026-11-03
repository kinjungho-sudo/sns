const report='sources/'+encodeURIComponent('밴스의원 부산점 AI 검색 진단_기존 홈피_2026. 11. 3_.pdf');
const R=(at,html,cls='')=>`<div class="reveal ${cls}" data-at="${at}">${html}</div>`;
const screen=(asset,url)=>`<div class="screen" style="height:100%"><div class="browserbar"><i></i>${url}</div><div class="viewport"><img src="assets/${asset}.png" alt="${url} 실제 화면 캡처"></div></div>`;
const ring=()=>'<svg class="ring" viewBox="0 0 250 180" aria-hidden="true"><ellipse cx="125" cy="90" rx="118" ry="78"/></svg>';
const metric=(at,title,value,den,desc,tag)=>R(at,`<h2>${title}</h2><strong>${value}<small>${den}</small></strong>${ring()}<p>${desc}</p><span class="tag">${tag}</span>`,'panel white metric');
const chart=(title,values,labels,suffix)=>`<div class="panel white chartpanel"><h2>${title}</h2><svg viewBox="0 0 600 270" role="img" aria-label="${labels.map((d,i)=>d+' '+values[i]+suffix).join(', ')}">${[0,50,100].map(v=>`<line x1="55" y1="${220-v*1.6}" x2="560" y2="${220-v*1.6}" stroke="#e5e2ea"/><text x="10" y="${226-v*1.6}">${v}</text>`).join('')}<path class="chartline" d="${values.map((v,i)=>(i?'L':'M')+(70+i*155)+','+(220-v*1.6)).join(' ')}"/>${values.map((v,i)=>`<circle class="chartdot" cx="${70+i*155}" cy="${220-v*1.6}" r="5"/><text class="value" text-anchor="middle" x="${70+i*155}" y="${200-v*1.6}">${v}${suffix}</text><text text-anchor="middle" x="${70+i*155}" y="256">${labels[i]}</text>`).join('')}</svg></div>`;
const scenes=[
{title:'홈페이지',sub:'진단의 출발점 · 현재 운영 중인 밴스의원 부산점 홈페이지',source:'실제 홈페이지 화면 캡처 · 2026.11.03 · 진단 수치는 기존 보고서 기준',url:'https://busan.vandsclinics.com/',html:`<div class="grid two">${R(0,screen('homepage','busan.vandsclinics.com'))}<div class="side">${R(1.8,'<div class="eyebrow">EXISTING WEBSITE</div><div class="bigtext">환자에게 보이는 홈페이지.<br><span class="emphasis">AI는 어떻게 읽고 있을까요?</span></div>')}${R(4.1,'<div class="note">화면의 인상과 AI 검색 준비 상태를 구분해서 확인합니다.</div>')}</div></div>`},
{title:'Dr.GEO 진단',sub:'실제 도구 화면 → 기존 홈페이지 진단 보고서',source:'실제 Dr.GEO 첫 화면 캡처 · 결과는 2026.11.03 기존 보고서 기반 재현',url:'https://drgeo.vercel.app',html:`<div class="grid two">${R(0,screen('drgeo','drgeo.vercel.app'))}<div class="side">${R(1.8,'<div class="eyebrow">DIAGNOSIS</div><div class="bigtext">AI에게 직접 묻고,<br>홈페이지의<br><span class="emphasis">준비 상태를 확인합니다.</span></div>')}${R(4.1,'<div class="note">대상: 밴스의원 부산점<br>기존 홈페이지 · 측정일 2026.11.03<br>이 발표에서 진단을 새로 실행하지 않습니다.</div>')}</div></div>`},
{title:'진단 결과',sub:'서로 다른 세 지표 · 더하거나 평균 내지 않습니다',source:'기존 진단 보고서 p.1 · 보고서 기반 재현 · 언급률 오차범위 7%–41%',url:report+'#page=1',html:`<div class="grid three">${metric(0,'홈페이지 준비 상태','65','/100','기초 단계','규칙 기반 준비도 점검')}${metric(1.8,'AI 답변에 나온 비율','19','%','54번 중 10번 언급','AI 언급 측정 · 59곳 중 공동 6위')}${metric(4.1,'병원 정보 정확도','96','%','정보를 답한 56건 중 틀림 2건','준비도·언급률과 별도 측정')}</div>`},
{title:'점수와 그래프',sub:'준비도는 65점 유지 · 언급률 차이만으로 변화 단정 불가',source:'기존 진단 보고서 p.2 · 축 0–100 고정 · 실제 기록을 재현',url:report+'#page=2',html:`<div class="grid equal">${R(0,chart('AI 답변에 나온 비율',[24,20,20,19],['10.31.','11.2.','11.3.','11.3.'],'%'))}${R(1.8,chart('홈페이지 준비 상태',[65,65,65,65],['10.31.','11.1.','11.2.','11.3.'],'점'))}</div>${R(4.1,'<span class="pill">두 측정의 오차범위가 겹칩니다. 이 차이만으로 변화가 있었다고 단정할 수 없습니다.</span>','chartnote')}`},
{title:'모두닥 정보 불일치',sub:'발견 01 · AI가 참고한 외부 정보와 공식 정보의 차이',source:'기존 진단 보고서 p.3 문제점 / p.4 개선점 · 보고서 기반 재현',url:report+'#page=3',html:`<div class="grid equal"><div class="side">${R(0,'<div class="quote">“모두닥 정보가 공식 정보와 다릅니다. AI가 14번 참고했습니다.”<small>기존 보고서 p.3 · 외부 채널</small></div>')}${R(1.8,'<div class="panel"><span class="eyebrow">OBSERVED REFERENCE</span><div style="font-size:85px;font-weight:800">14<span style="font-size:30px">번 참고</span></div><p class="muted">참고 횟수이며 오류 발생 횟수는 아닙니다.</p></div>')}</div>${R(4.1,'<div class="side" style="height:100%"><div class="eyebrow">FIRST ACTION</div><div class="bigtext">공식 정보와 대조하고<br><span class="emphasis">모두닥 정보 수정 요청</span></div><div class="note">정보 불일치가 AI 언급률에 미친 영향은 이 보고서만으로 단정하지 않습니다.</div></div>')}</div>`},
{title:'진료과 정보 차이',sub:'발견 02 · 화면의 정보와 AI가 읽는 정보의 일치 여부',source:'기존 진단 보고서 p.3 홈페이지 문제 / p.4 개선점 · 보고서 기반 재현',url:report+'#page=3',html:`<div class="side" style="height:100%">${R(0,'<div class="comparison"><div>화면의 진료과</div><span class="neq">≠</span><div>AI가 읽는 진료과</div></div>')}${R(1.8,'<div class="quote">“화면과 AI가 읽는 정보의 진료과가 서로 다릅니다.”<small>기존 보고서 p.3 · 홈페이지</small></div>')}${R(4.1,'<div class="note">확인할 과제: AI가 읽는 진료과를 화면과 같게 수정<br>보고서에 특정 진료과 값은 제시되지 않아 임의로 추가하지 않았습니다.</div>')}</div>`},
{title:'진료시간 · 접근',sub:'발견 03–04 · 읽을 수 있는 정보와 들어올 수 있는 경로',source:'기존 진단 보고서 p.3–4 · Perplexity 답변은 이번 언급률 측정에 포함되지 않음',url:report+'#page=3',html:`<div class="grid equal">${R(0,'<div class="panel stack" style="height:100%"><span class="eyebrow">03 · OPENING HOURS</span><h2>AI가 읽을 수 있는<br>진료시간 정보 없음</h2><div class="quote">“AI가 읽을 수 있는 진료시간 정보가 없습니다.”<small>보고서 p.3</small></div><p class="muted">개선점: 요일별 진료시간 정보 추가</p></div>')}${R(1.8,'<div class="panel stack" style="height:100%"><span class="eyebrow">04 · ACCESS</span><h2>Perplexity<br>홈페이지 접근 제한</h2><div class="quote">“AI 검색 서비스 Perplexity가 홈페이지에 들어오지 못합니다.”<small>보고서 p.3</small></div><p class="muted">개선점: 홈페이지 보안 설정에서 접속 허용</p></div>')}</div>${R(4.1,'<span class="pill">접근 문제와 AI 답변 언급률은 서로 다른 점검 항목입니다.</span>','chartnote')}`},
{title:'확인된 과제',sub:'기존 홈페이지 → 진단 → 근거 → 개선 과제',source:'기존 진단 보고서 p.1–4 · 개선이 AI 언급 증가를 보장하지 않으며 같은 질문으로 재측정',url:report+'#page=4',html:`<div class="grid equal"><div class="side">${R(0,'<div class="overview"><img class="mini" src="assets/homepage.png" alt="기존 홈페이지"><div class="bigtext">기존 홈페이지<br>진단 결과</div></div><div class="summary-metrics" style="margin-top:28px"><div><small>홈페이지 준비도</small><strong>65<small>/100</small></strong></div><div><small>AI 언급</small><strong>10<small>/54회</small></strong></div></div>')}${R(4.1,'<div class="note">항목별로 개선하고, 같은 질문으로 다시 측정합니다.<br>홈페이지 전면 재구축이 필수라는 의미는 아닙니다.</div>')}</div><div class="list">${['모두닥 정보 불일치','화면 · AI 진료과 차이','AI가 읽을 수 있는 진료시간 정보 없음','Perplexity 접근 제한'].map((s,i)=>R(1.8+i*.5,`<div class="row"><b>0${i+1}</b>${s}</div>`)).join('')}</div></div>`}
];
scenes.forEach(s=>s.part=1);
scenes.push(...getNextScenes(), ...getRoadmapScenes());

/* ───────── 오프닝: 15초 모션그래픽 (motion/opening.html을 렌더한 영상) ─────────
   1부 8장 · 2부 6장 · 3부 7장은 그대로 두고, 맨 앞에 오프닝 장면 하나를 더한다. */
scenes.unshift({part:0,title:'오프닝',sub:'15초 모션그래픽 · 1부 진단에서 2부 이번 제공 범위까지',duration:15,stops:[0,15],video:'assets/video/opening.mp4',
 source:'모션그래픽: motion/opening.html 렌더 · 수치는 기존 진단 보고서 p.1 (2026.11.03) · 신규 시안 점수와 전후 비교하지 않음',url:report+'#page=1',
 html:`<div class="opening">${R(0,`<div class="player"><video src="assets/video/opening.mp4" poster="assets/video/opening-poster.jpg" muted playsinline preload="auto"></video><button class="player-fs" aria-label="영상 전체 화면">⤢ 영상 전체 화면</button></div>`)}<div class="side">${R(.6,'<div class="eyebrow">MOTION SUMMARY · 15s</div><div class="bigtext">AI가 읽는 홈페이지,<br><span class="emphasis">진단에서 납품까지</span></div>')}${R(1.6,'<div class="note">영상 속 수치는 기존 홈페이지 보고서 기준입니다.<br>두 지표는 따로 보며, 더하거나 평균 내지 않습니다.</div>')}${R(2.6,'<div class="chapters-mini"><span>1부 · 진단 8장</span><span>2부 · 이번 제공 범위 6장</span><span>3부 · 향후 로드맵 4장 (시연 영상 3편)</span></div>')}</div></div>`});

const chapterStarts=[0,1,9,15],chapterCounts=[1,8,6,4],partName=['오프닝','1부','2부','3부'];
let sceneIndex=0,time=0,playing=false,last=0;const $=s=>document.querySelector(s);const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const DEFAULT_STOPS=[0,2.8,5.7,8];
const dur=()=>scenes[sceneIndex].duration||8, stops=()=>scenes[sceneIndex].stops||DEFAULT_STOPS;
const clamp=x=>Math.min(1,Math.max(0,x)), easeOut=x=>1-Math.pow(1-x,3);
const video=()=>scenes[sceneIndex].video?document.querySelector('#scene video'):null;   // 영상 장면(오프닝 · 3부 시연)
function resize(){const scale=Math.min(innerWidth/1600,(innerHeight-30)/900);$('#shell').style.transform=`scale(${scale})`;$('#shell').style.left=(innerWidth-1600*scale)/2+'px';$('#shell').style.top=Math.max(0,(innerHeight-30-900*scale)/2)+'px'}
function syncVideo(){const v=video();if(!v)return;if(Math.abs(v.currentTime-time)>.25)v.currentTime=Math.min(time,dur());if(playing&&!reduced.matches)v.play().catch(()=>{});else v.pause()}
function show(index,t=.7){
 const leaving=video();if(leaving)leaving.pause();
 sceneIndex=Math.max(0,Math.min(scenes.length-1,index));const s=scenes[sceneIndex];time=s.video?0:Math.min(t,dur());
 const part=s.part,local=sceneIndex-chapterStarts[part];
 $('#number').textContent=part===0?'00':String(part===1?local+1:part).padStart(2,'0');
 $('#rail').innerHTML=scenes.map((item,i)=>item.part===part?`<button aria-label="${partName[part]} ${i-chapterStarts[part]+1}장 ${item.sub}" data-scene="${i}">${part===0?'00':String(i-chapterStarts[part]+1).padStart(2,'0')}</button>`:'').join('');
 document.querySelectorAll('[data-part]').forEach(b=>b.setAttribute('aria-current',String(+b.dataset.part===part)));
 $('#title').textContent=s.title;$('#subtitle').textContent=s.sub;$('#source').textContent=s.source;$('#evidence').href=s.url;$('#scene').innerHTML=s.html;
 document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-current',String(+b.dataset.scene===sceneIndex)));
 $('#seek').max=dur();history.replaceState(null,'','#'+(sceneIndex+1));
 if(s.video){const v=video();v.addEventListener('ended',()=>{time=dur();draw()});document.querySelector('#scene .player-fs').onclick=()=>fullscreen(v.parentElement);playing=!reduced.matches;last=performance.now();syncVideo()}   // 영상 장면은 들어오면 무음 자동 재생
 draw();
}
function draw(){
 document.querySelectorAll('.reveal').forEach(e=>{const at=+e.dataset.at;const raw=clamp((time-at)/.65);const p=reduced.matches?(time>=at?1:0):easeOut(raw);
  e.style.opacity=p;e.style.transform=`translateY(${(1-p)*20}px)`;e.style.visibility=p===0?'hidden':'visible';e.inert=p===0;
  const ellipse=e.querySelector('ellipse');
  if(ellipse){const rp=reduced.matches?(time>=at?1:0):clamp((time-at-.55)/.85);ellipse.style.strokeDashoffset=700*(1-rp);const num=e.querySelector('strong');const ringBox=e.querySelector('.ring');
   if(e.closest('.body-offset'))ringBox.style.top=(num.offsetTop+num.offsetHeight/2-ringBox.clientHeight/2)+'px';
   const pulse=reduced.matches?0:Math.sin(Math.PI*clamp((time-at-.5)/.8));num.style.transform=`scale(${1+.045*pulse})`;
   // 점수 카운트업: 원래 숫자(data-v)까지 1.1초 동안 올라간다. 다른 점수와 이어서 올리지 않는다.
   const tn=num.firstChild;if(!num.dataset.v)num.dataset.v=tn.textContent.trim();const target=+num.dataset.v;
   const cp=reduced.matches?(time>=at?1:0):easeOut(clamp((time-at)/1.1));tn.textContent=String(Math.round(target*cp));}
  // 실제 화면 캡처: 장면 동안 아주 천천히 확대·이동 (켄 번스)
  e.querySelectorAll('.screen .viewport img').forEach(img=>{const kp=reduced.matches?0:Math.sin(Math.PI/2*clamp((time-at)/7.5));img.style.transform=`scale(${1+.05*kp}) translateY(${-1.5*kp}%)`});
  e.querySelectorAll('[data-wave]').forEach(w=>{const phase=(time-at)*6+(+w.dataset.wave)*.65;const amp=reduced.matches?1:.5+.5*Math.sin(phase)**2;w.style.transform=`scaleY(${amp})`;});
  e.querySelectorAll('.chartline').forEach(l=>l.style.strokeDashoffset=700*(1-p));});
 const s=scenes[sceneIndex],st=stops(),D=dur();
 $('#seek').value=time;$('#clock').textContent=time.toFixed(1)+' / '+D+'s';
 const stage=st.filter(x=>x<=time+1e-6).length;
 $('#status').textContent=s.part===0?`오프닝 · 모션그래픽 ${time.toFixed(0)}s`:s.video?`${s.part}부 · ${sceneIndex-chapterStarts[s.part]+1} / ${chapterCounts[s.part]} · 시연 ${time.toFixed(0)}s`:`${s.part}부 · ${sceneIndex-chapterStarts[s.part]+1} / ${chapterCounts[s.part]} · 단계 ${Math.min(3,Math.max(1,time<1.8?1:time<4.1?2:3))}/3`;
 $('#play').textContent=playing?'일시정지':'재생';$('#play').setAttribute('aria-label',playing?'일시정지 (Space)':'재생 (Space)');
 $('#progress').style.width=((sceneIndex+time/D)/scenes.length*100)+'%';$('#prev').disabled=sceneIndex===0&&time===0;$('#next').disabled=sceneIndex===scenes.length-1&&time>=D;
}
function step(dir){playing=false;const st=stops();if(dir>0){const next=st.find(s=>s>time+.05);if(next!==undefined)time=next;else if(sceneIndex<scenes.length-1)return show(sceneIndex+1,.7);}else{const prev=st.filter(s=>s<time-.05).pop();if(prev!==undefined)time=prev;else if(sceneIndex>0)return show(sceneIndex-1,8);}syncVideo();draw()}
function toggle(){if(!playing&&sceneIndex===scenes.length-1&&time>=dur())show(0,0);playing=!playing;last=performance.now();syncVideo();draw()}
function frame(now){if(playing){const v=video();
  if(v&&!v.paused&&v.readyState>=2)time=v.currentTime;   // 영상 장면은 영상 시간이 기준
  else time+=Math.min((now-last)/1000,.1);
  if(time>=dur()-(v&&v.ended?0:.02)&&(!v||v.ended||v.paused)){if(sceneIndex<scenes.length-1)show(sceneIndex+1,.7);else{time=dur();playing=false}}
  else if(time>=dur()&&!v){if(sceneIndex<scenes.length-1)show(sceneIndex+1,.7);else{time=dur();playing=false}}
  draw()}last=now;requestAnimationFrame(frame)}
$('#prev').onclick=()=>step(-1);$('#next').onclick=()=>step(1);$('#play').onclick=toggle;$('#restart').onclick=()=>{playing=false;time=scenes[sceneIndex].video?0:.7;syncVideo();draw()};$('#seek').oninput=e=>{playing=false;time=+e.target.value;syncVideo();draw()};$('#rail').onclick=e=>{const b=e.target.closest('button');if(b){playing=false;show(+b.dataset.scene)}};
async function fullscreen(el=document.documentElement){try{if(document.fullscreenElement)await document.exitFullscreen();else await el.requestFullscreen()}catch{}}
$('#chapters').onclick=e=>{const b=e.target.closest('[data-part]');if(b){playing=false;show(chapterStarts[+b.dataset.part]);}};
$('#fullscreen').onclick=()=>fullscreen();addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select')||e.altKey||e.ctrlKey||e.metaKey)return;if(e.target.matches('button,a')&&(e.code==='Space'||e.key==='Enter'))return;if(['ArrowRight','ArrowLeft','PageDown','PageUp','Home','End',' '].includes(e.key))e.preventDefault();if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1);if(e.code==='Space')toggle();if(e.key==='PageDown'){playing=false;show(sceneIndex+1)}if(e.key==='PageUp'){playing=false;show(sceneIndex-1)}if(e.key==='Home'){playing=false;show(0)}if(e.key==='End'){playing=false;show(scenes.length-1,8)}if(e.key.toLowerCase()==='f')fullscreen()});
addEventListener('hashchange',()=>{const n=(parseInt(location.hash.slice(1))||1)-1;if(n!==sceneIndex){playing=false;show(n)}});addEventListener('resize',resize);reduced.addEventListener('change',draw);let touchX;$('#scene').addEventListener('touchstart',e=>touchX=e.changedTouches[0].clientX,{passive:true});$('#scene').addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>60)step(dx<0?1:-1)},{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;syncVideo();draw()}});
resize();document.fonts.ready.then(()=>{show((parseInt(location.hash.slice(1))||1)-1,reduced.matches?8:.7);document.body.dataset.ready='1'});requestAnimationFrame(frame);
