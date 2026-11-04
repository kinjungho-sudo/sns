const report='sources/'+encodeURIComponent('밴스의원 부산점 AI 검색 진단_기존 홈피_2026. 11. 3_.pdf');
const R=(at,html,cls='')=>`<div class="reveal ${cls}" data-at="${at}">${html}</div>`;
const screen=(asset,url)=>`<div class="screen" style="height:100%"><div class="browserbar"><i></i>${url}</div><div class="viewport"><img src="assets/${asset}.png" alt="${url} 실제 화면 캡처"></div></div>`;
const ring=()=>'<svg class="ring" viewBox="0 0 250 180" aria-hidden="true"><ellipse cx="125" cy="90" rx="118" ry="78"/></svg>';
const metric=(at,title,value,den,desc,tag)=>R(at,`<h2>${title}</h2><strong>${value}<small>${den}</small></strong>${ring()}<p>${desc}</p><span class="tag">${tag}</span>`,'panel white metric');
const chart=(title,values,labels,suffix)=>`<div class="panel white chartpanel"><h2>${title}</h2><svg viewBox="0 0 600 270" role="img" aria-label="${labels.map((d,i)=>d+' '+values[i]+suffix).join(', ')}">${[0,50,100].map(v=>`<line x1="55" y1="${220-v*1.6}" x2="560" y2="${220-v*1.6}" stroke="#e5e2ea"/><text x="10" y="${226-v*1.6}">${v}</text>`).join('')}<path class="chartline" d="${values.map((v,i)=>(i?'L':'M')+(70+i*155)+','+(220-v*1.6)).join(' ')}"/>${values.map((v,i)=>`<circle class="chartdot" cx="${70+i*155}" cy="${220-v*1.6}" r="5"/><text class="value" text-anchor="middle" x="${70+i*155}" y="${200-v*1.6}">${v}${suffix}</text><text text-anchor="middle" x="${70+i*155}" y="256">${labels[i]}</text>`).join('')}</svg></div>`;
const scenes=[
{title:'홈페이지',sub:'진단의 출발점 · 현재 운영 중인 밴스의원 부산점 홈페이지',source:'실제 홈페이지 화면 캡처 · 2026.11.03 · 진단 수치는 기존 보고서 기준',url:'https://busan.vandsclinics.com/',html:`<div class="grid two">${R(0,screen('homepage','busan.vandsclinics.com'))}<div class="side">${R(1.8,'<div class="eyebrow">EXISTING WEBSITE</div><div class="bigtext">환자에게 보이는 홈페이지.<br><span class="emphasis">AI는 어떻게 읽고 있을까요?</span></div>')}${R(4.1,'<div class="note">화면의 인상과 AI 검색 준비 상태를 구분해서 확인합니다.</div>')}</div></div>`},
{title:'이미지 위주 홈페이지',vokey:'1-img',sub:'사진·영상·이미지 배너 중심 · 필요한 정보가 글자로 없음',source:'기존 홈페이지 화면 캡처 2026.11.03 · 점수와 문장은 기존 진단 보고서 p.2–3 인용',url:report+'#page=2',html:`<div class="grid two">${R(0,`<div class="veil-host">${screen('homepage','busan.vandsclinics.com')}${R(1.8,'<div class="ai-veil"><span>AI가 보는 화면</span><b>이미지 · 영상</b><small>그림 속 글자는 근거로 쓰기 어렵습니다</small></div>','veil-r')}</div>`)}<div class="side">${R(1.2,'<div class="eyebrow">IMAGE-HEAVY</div><div class="bigtext">보기엔 화려하지만,<br><span class="emphasis">필요한 정보가 글자로 없습니다.</span></div>')}<div class="list tight">${[['진료시간','“AI가 읽을 수 있는 진료시간 정보가 없습니다.”'],['시술 · 가격 · 이벤트','이미지 속 글자 위주'],['AI가 읽는 병원 정보','8 / 14점'],['글이 잘 정리되어 있는가','9 / 14점']].map(([a,b],i)=>R(2.6+i*.5,`<div class="row"><b>${a}</b>${b}</div>`)).join('')}</div></div></div>`},
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

/* ───────── 간추림: 부마다 핵심 장면만, 부를 여는 큰 글씨 장면 하나 ─────────
   1부부터 3부까지 영상처럼 이어서 재생된다 (마지막 장면에서 멈추고 배경음악도 꺼짐). 수치·문구는 기존 장면 그대로. */
const KEEP={1:s=>['홈페이지','이미지 위주 홈페이지','Dr.GEO 진단','진단 결과','확인된 과제'].includes(s.title),
 2:s=>/^(GEO 관점으로 준비한|텍스트로 적은 병원 정보|시술 안내|확인 후 홈페이지 납품)/.test(s.sub),
 3:s=>/^(SNS 콘텐츠|원장님 세컨드 브레인|동시 통역|보이스 차트)/.test(s.sub)};
// 내레이션 대본 (Typecast 음성·자막 공용). 키 = 부-순서
const VO={'1-img':'지금 홈페이지는 사진과 이미지가 중심이라, 진료시간 같은 필요한 정보가 글자로 적혀 있지 않습니다. AI는 글자로 적힌 정보를 근거로 답합니다.','2-txt':'새 시안은 진료시간, 위치, 자주 묻는 질문, 의료진 정보를 모두 글자로 적었습니다.','1-0':'밴스의원 부산점 홈페이지를, AI는 어떻게 읽고 있을까요?','1-1':'지금 운영 중인 홈페이지입니다. 사람에게 보이는 화면과 AI가 읽는 정보는 다를 수 있습니다.',
 '1-2':'Dr.GEO로 AI에게 직접 묻고, 홈페이지의 준비 상태를 확인했습니다.','1-3':'준비도 65점, AI 답변 54번 중 10번 언급, 정보 정확도 96%. 서로 다른 세 지표입니다.',
 '1-4':'확인된 과제는 네 가지입니다. 항목별로 고치고, 같은 질문으로 다시 측정합니다.',
 '2-0':'그래서 GEO 관점으로, 새 홈페이지 시안을 준비했습니다.','2-1':'신규 시안의 AI 검색 준비도는 83점, 양호 단계입니다. 조건이 달라 이전과 직접 비교하지는 않습니다.',
 '2-2':'시술 안내와 진료시간, 위치를 AI가 읽을 수 있는 화면으로 만들었습니다.','2-3':'진단과 시안 전달은 마쳤고, 요구사항을 반영해 고객 확인 후 납품합니다.',
 '3-0':'끝으로, 참고용으로 저희가 만들 수 있는 것들을 간단히 보여드립니다. 이번 제안 범위는 아닙니다.','3-1':'SNS 자동화입니다. 확인된 병원 정보로 인스타그램 게시물과 블로그 글을 만들고, 의료광고 기준 점검과 담당자 승인을 거쳐 예약 게시합니다.',
 '3-2':'원장님의 세컨드 브레인입니다. 원장님의 노트와 강의, 상담 기준을 기억해서, 직원이 물으면 원장님 방식으로 출처와 함께 답합니다.',
 '3-3':'동시 통역입니다. 외국인 환자와 원장님의 대화를, 양쪽 언어 자막으로 실시간 통역합니다.','3-4':'보이스 차트입니다. 진료 대화를 말하면 차트 초안으로 정리되고, 의사가 확인해 저장합니다.'};
const COVER={1:['AI는 이 홈페이지를','어떻게 읽을까?','1부 · 진단'],2:['GEO 관점으로','다시 만든 홈페이지','2부 · 이번 제공 범위'],3:['참고로 보여드리는','만들 수 있는 것들','3부 · 참고 예시 · 제안 범위 아님']};
const chars=(t,d0,cls='')=>`<span class="cv-line ${cls}">${[...t].map((c,i)=>c===' '?' ':`<span class="ch" data-d="${(d0+i*.045).toFixed(3)}">${c}</span>`).join('')}</span>`;
{const all=scenes.splice(0);for(const p of [1,2,3]){const [a,b,k]=COVER[p];
  scenes.push({part:p,cover:true,title:k,sub:'',duration:4.6,stops:[0,4.6],source:'',url:'#',key:`${p}-0`,
   html:`<div class="cover-card"><p class="cv-kicker">${k}</p>${chars(a,.15)}${chars(b,.15+a.length*.045+.15,'gold')}</div>`});
  let n=0;all.filter(s=>s.part===p&&KEEP[p](s)).forEach(s=>{s.key=s.vokey||`${p}-${++n}`;scenes.push(s)});}}
scenes.forEach(s=>s.vo=VO[s.key]||'');
// 내레이션이 끝나기 전에 장면이 넘어가지 않도록, 음성 길이(초)+여유만큼 장면 길이를 늘린다
const VO_LEN={'1-0':4.6,'1-1':8,'1-2':6.3,'1-3':10.5,'1-4':7.1,'2-0':5.4,'2-1':9.8,'2-2':6.1,'2-3':6.7,'3-1':12.8,'3-2':11.6,'3-3':9,'3-4':7.8};
scenes.forEach(s=>{const need=(VO_LEN[s.key]||0)+1.2,d=s.duration||8;if(need>d){const st=(s.stops||[0,2.8,5.7,8]).slice();st[st.length-1]=need;s.stops=st;s.duration=need}});

const chapterStarts=[0,1,2,3].map(p=>scenes.findIndex(s=>s.part===p)),chapterCounts=[0,1,2,3].map(p=>scenes.filter(s=>s.part===p).length),partName=['','1부','2부','3부'];   // 인덱스 = 부 번호
let sceneIndex=0,time=0,playing=false,last=0;const $=s=>document.querySelector(s);const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const DEFAULT_STOPS=[0,2.8,5.7,8];
const dur=()=>scenes[sceneIndex].duration||8, stops=()=>scenes[sceneIndex].stops||DEFAULT_STOPS;
const clamp=x=>Math.min(1,Math.max(0,x)), easeOut=x=>1-Math.pow(1-x,3), easeInOut=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2, easeOutBack=x=>{const c=1.45;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
const video=()=>scenes[sceneIndex].video?document.querySelector('#scene video, .player.big video'):null;   // 영상 장면(3부 시연)
function resize(){const scale=Math.min(innerWidth/1600,(innerHeight-34)/900);$('#shell').style.transform=`scale(${scale})`;$('#shell').style.left=(innerWidth-1600*scale)/2+'px';$('#shell').style.top=Math.max(0,(innerHeight-34-900*scale)/2)+'px'}
function syncVo(){const va=$('#voa'),f=(window.VO_FILES||{})[scenes[sceneIndex].key];if(!f){va.pause();va.removeAttribute('src');return}   // 장면 내레이션(있으면)
 if(!va.src.endsWith(f)){va.src=f}if(Math.abs(va.currentTime-time)>.4)va.currentTime=Math.min(time,va.duration||time);if(playing&&audioOn&&!muted)va.play().catch(()=>{});else va.pause()}
function syncVideo(){syncVo();const v=video();if(!v)return;if(Math.abs(v.currentTime-time)>.25)v.currentTime=Math.min(time,dur());if(playing&&!reduced.matches)v.play().catch(()=>{});else v.pause()}
/* ───────── 확대·축소: 칸 안의 화면 캡처를 장면 전체 크기로 키우는 변환 ─────────
   z._entry(등장 연출)와 z._zoom(클릭 확대) 중 큰 값만큼 장면 크기 쪽으로 커진다. 0이면 원래 칸. */
function measureZooms(){const area=$('#scene').getBoundingClientRect(),sc=area.width/$('#scene').offsetWidth||1;
 document.querySelectorAll('#scene .zoomable').forEach(z=>{const prev=z.style.transform;z.style.transform='none';const r=z.getBoundingClientRect();z.style.transform=prev;
  const w=r.width/sc,h=r.height/sc,x=(r.left-area.left)/sc,y=(r.top-area.top)/sc,AW=$('#scene').offsetWidth,AH=$('#scene').offsetHeight;
  const s=Math.max(1,Math.min((AW-16)/w,(AH+150)/h,2.4));z._fit={s,tx:(AW-w*s)/2-x,ty:Math.max(-150,(AH-h*s)/2-y)};z._entry=z._entry??0;z._zoom=z._zoom??0;});}
function placeZoom(z){if(!z._fit)return;const a=Math.max(z._entry||0,z._zoom||0),f=z._fit;
 z.style.transform=a>0?`translate(${f.tx*a}px,${f.ty*a}px) scale(${1+(f.s-1)*a})`:'';z.style.zIndex=a>0?20:'';z.classList.toggle('lifted',a>.02);const rv=z.closest('.reveal');if(rv)rv.style.zIndex=a>0?20:'';   // 부모(reveal)도 함께 올려야 어둡게 깐 배경 위로 나온다
 const dim=$('#scene .zoom-dim');if(dim){const m=Math.max(0,...[...document.querySelectorAll('#scene .zoomable')].map(x=>x._zoom||0));dim.style.opacity=(m*.62).toFixed(3);dim.style.pointerEvents=m>.5?'auto':'none'}}
let zoomAnim=null;
function toggleZoom(z){const from=z._zoom||0,to=from>.5?0:1;document.querySelectorAll('#scene .zoomable').forEach(o=>{if(o!==z&&o._zoom){o._zoom=0;placeZoom(o)}});
 if(reduced.matches){z._zoom=to;placeZoom(z);return}const t0=performance.now();cancelAnimationFrame(zoomAnim);
 const tick=now=>{const k=easeInOut(clamp((now-t0)/550));z._zoom=from+(to-from)*k;placeZoom(z);if(k<1)zoomAnim=requestAnimationFrame(tick)};zoomAnim=requestAnimationFrame(tick)}
function wireZooms(){const scene=$('#scene');scene.insertAdjacentHTML('beforeend','<div class="zoom-dim" aria-hidden="true"></div>');
 scene.querySelectorAll('.screen').forEach(z=>{if(z.closest('.player'))return;const rv=z.closest('.reveal');if(rv&&getComputedStyle(rv).position==='static')rv.style.position='relative';z.classList.add('zoomable');z.tabIndex=0;z.setAttribute('role','button');z.setAttribute('aria-label','화면 크게 보기 / 원래대로');
  z.addEventListener('click',()=>toggleZoom(z));z.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();ev.stopPropagation();toggleZoom(z)}})});
 scene.querySelector('.zoom-dim').onclick=()=>scene.querySelectorAll('.zoomable').forEach(z=>{if(z._zoom>.5)toggleZoom(z)});
 measureZooms();}
function show(index,t=.7){unbigVideo();
 const leaving=video();if(leaving)leaving.pause();
 sceneIndex=Math.max(0,Math.min(scenes.length-1,index));const s=scenes[sceneIndex];time=s.video?0:Math.min(t,dur());
 const part=s.part,local=sceneIndex-chapterStarts[part];
 $('#number').textContent=String(part===1?local:part).padStart(2,'0');
 $('#rail').innerHTML=scenes.map((item,i)=>item.part===part?`<button aria-label="${partName[part]} ${i-chapterStarts[part]+1}장 ${item.sub}" data-scene="${i}">${String(i-chapterStarts[part]+1).padStart(2,'0')}</button>`:'').join('');
 document.querySelectorAll('[data-part]').forEach(b=>b.setAttribute('aria-current',String(+b.dataset.part===part)));
 $('#title').textContent=s.title;$('#subtitle').textContent=s.sub;$('#source').textContent=s.source;$('#evidence').href=s.url;$('#scene').innerHTML=s.html;wireZooms();
 document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-current',String(+b.dataset.scene===sceneIndex)));
 $('#seek').max=dur();history.replaceState(null,'','#'+(sceneIndex+1));
 if(s.video){const v=video();v.addEventListener('ended',()=>{time=dur();draw()});document.querySelector('#scene .player-fs').onclick=e=>{e.stopPropagation();bigVideo(v.parentElement)};v.onclick=e=>{e.stopPropagation();bigVideo(v.parentElement)};playing=!reduced.matches;last=performance.now();syncVideo()}   // 영상 장면은 들어오면 무음 자동 재생
 syncVo();draw();
}
function draw(){
 document.querySelectorAll('.reveal').forEach(e=>{const at=+e.dataset.at;const raw=clamp((time-at)/.65);const p=reduced.matches?(time>=at?1:0):easeOut(raw);
  const q=reduced.matches?p:easeOutBack(raw);e.style.opacity=p;e.style.transform=`translateY(${(1-q)*38}px) scale(${.93+.07*q})`;e.style.filter=p<1?`blur(${((1-p)*7).toFixed(1)}px)`:'';e.style.visibility=p===0?'hidden':'visible';e.inert=p===0;
  const ellipse=e.querySelector('ellipse');
  if(ellipse){const rp=reduced.matches?(time>=at?1:0):clamp((time-at-.55)/.85);ellipse.style.strokeDashoffset=700*(1-rp);const num=e.querySelector('strong');const ringBox=e.querySelector('.ring');
   if(e.closest('.body-offset'))ringBox.style.top=(num.offsetTop+num.offsetHeight/2-ringBox.clientHeight/2)+'px';
   const pulse=reduced.matches?0:Math.sin(Math.PI*clamp((time-at-.5)/.8));num.style.transform=`scale(${1+.045*pulse})`;
   // 점수 카운트업: 원래 숫자(data-v)까지 1.1초 동안 올라간다. 다른 점수와 이어서 올리지 않는다.
   const tn=num.firstChild;if(!num.dataset.v)num.dataset.v=tn.textContent.trim();const target=+num.dataset.v;
   const cp=reduced.matches?(time>=at?1:0):easeOut(clamp((time-at)/1.1));tn.textContent=String(Math.round(target*cp));}
  // 실제 화면 캡처: 먼저 장면을 가득 채우며 등장했다가 제자리 칸으로 줄어들어 들어간다 (줌 인 → 아웃)
  e.querySelectorAll('.zoomable').forEach(z=>{const k=reduced.matches?1:easeInOut(clamp((time-at-.45)/1.0));z._entry=1-k;placeZoom(z)});
  // 실제 화면 캡처: 장면 동안 아주 천천히 확대·이동 (켄 번스)
  e.querySelectorAll('.screen .viewport img').forEach(img=>{const kp=reduced.matches?0:Math.sin(Math.PI/2*clamp((time-at)/7.5));img.style.transform=`scale(${1+.05*kp}) translateY(${-1.5*kp}%)`});
  e.querySelectorAll('[data-wave]').forEach(w=>{const phase=(time-at)*6+(+w.dataset.wave)*.65;const amp=reduced.matches?1:.5+.5*Math.sin(phase)**2;w.style.transform=`scaleY(${amp})`;});
  e.querySelectorAll('.chartline').forEach(l=>l.style.strokeDashoffset=700*(1-p));});
 // 큰 글씨: 글자마다 아래에서 튀어 오르며 생성
 document.querySelectorAll('#scene .ch').forEach(c=>{const q=reduced.matches?1:clamp((time-+c.dataset.d)/.6),b=easeOutBack(q);c.style.opacity=Math.min(1,q*2);c.style.transform=`translateY(${(1-b)*105}%) rotate(${(1-q)*8}deg)`});
 document.body.classList.toggle('is-cover',!!scenes[sceneIndex].cover);
 const cap=$('#cap'),vo=scenes[sceneIndex].vo||'';if(cap.textContent!==vo)cap.textContent=vo;
 const s=scenes[sceneIndex],st=stops(),D=dur();
 $('#seek').value=time;$('#clock').textContent=time.toFixed(1)+' / '+D+'s';
 const stage=st.filter(x=>x<=time+1e-6).length;
 $('#status').textContent=s.video?`${s.part}부 · ${sceneIndex-chapterStarts[s.part]+1} / ${chapterCounts[s.part]} · 시연 ${time.toFixed(0)}s`:`${s.part}부 · ${sceneIndex-chapterStarts[s.part]+1} / ${chapterCounts[s.part]} · 단계 ${Math.min(3,Math.max(1,time<1.8?1:time<4.1?2:3))}/3`;
 $('#play').textContent=playing?'일시정지':'재생';$('#play').setAttribute('aria-label',playing?'일시정지 (Space)':'재생 (Space)');
 $('#progress').style.width=((sceneIndex+time/D)/scenes.length*100)+'%';$('#prev').disabled=sceneIndex===0&&time===0;$('#next').disabled=sceneIndex===scenes.length-1&&time>=D;
}
function step(dir){playing=false;const st=stops();if(dir>0){const next=st.find(s=>s>time+.05);if(next!==undefined)time=next;else if(sceneIndex<scenes.length-1)return show(sceneIndex+1,.7);}else{const prev=st.filter(s=>s<time-.05).pop();if(prev!==undefined)time=prev;else if(sceneIndex>0)return show(sceneIndex-1,8);}syncVideo();draw()}
let finished=false;function toggle(){startAudio();finished=false;if(!playing&&time>=dur()-.05){const nx=scenes[sceneIndex+1];if(nx){goPart(nx.part);return}show(0,0)}   // 부가 끝난 뒤 Space = 다음 부
 playing=!playing;last=performance.now();syncVideo();draw()}
function advance(){const nx=scenes[sceneIndex+1];if(nx)show(sceneIndex+1,0);else{time=dur();playing=false;finished=true;draw()}}   // 1부 → 2부 → 3부 끝까지 이어서 재생, 마지막에서 멈춤
function goPart(p){p=Math.max(1,Math.min(3,p));finished=false;playing=!reduced.matches;last=performance.now();show(chapterStarts[p],0)}
function partOf(){return scenes[sceneIndex].part}
// 배경음악: 재생 중일 때만 나온다. 일시정지·마지막 장면이 끝나면 천천히 꺼지고, 내레이션·자막 중엔 작게
function audioTick(){if(!audioOn)return;const want=playing&&!muted;if(want&&bgm.paused)bgm.play().catch(()=>{});
 const target=!want?0:(!$('#voa').paused||document.body.classList.contains('caps')&&scenes[sceneIndex].vo?.1:.22);
 bgm.volume=Math.max(0,Math.min(1,bgm.volume+(target-bgm.volume)*(want?.1:.15)));if(!want&&bgm.volume<.01&&!bgm.paused)bgm.pause()}
function frame(now){audioTick();if(playing){const v=video();
  if(v&&!v.paused&&v.readyState>=2)time=v.currentTime;   // 영상 장면은 영상 시간이 기준
  else time+=Math.min((now-last)/1000,.1);
  if(time>=dur()-(v&&v.ended?0:.02)&&(!v||v.ended||v.paused)){advance()}
  else if(time>=dur()&&!v){advance()}
  draw()}last=now;requestAnimationFrame(frame)}
$('#prev').onclick=()=>step(-1);$('#next').onclick=()=>step(1);$('#play').onclick=toggle;$('#restart').onclick=()=>{playing=false;time=scenes[sceneIndex].video?0:.7;syncVideo();draw()};$('#seek').oninput=e=>{playing=false;time=+e.target.value;syncVideo();draw()};$('#rail').onclick=e=>{const b=e.target.closest('button');if(b){playing=false;show(+b.dataset.scene)}};
// 시연 영상: 클릭하면 화면을 꽉 채우고, 다시 클릭(또는 Esc)하면 원래 크기로
function bigVideo(p){const on=!p.classList.contains('big');
 if(on){p._home=p.parentElement;p._next=p.nextSibling;document.body.appendChild(p)}   // 움직이는 상자 밖(문서 맨 위)으로 옮겨야 화면 전체를 덮는다
 else if(p._home&&p._home.isConnected){p._home.insertBefore(p,p._next&&p._next.parentElement===p._home?p._next:null)}
 else p.remove();
 p.classList.toggle('big',on);document.body.classList.toggle('video-big',on);if(on&&!begun)begin()}
function unbigVideo(){const p=document.querySelector('.player.big');if(p)bigVideo(p)}
async function fullscreen(el=document.documentElement){try{if(document.fullscreenElement)await document.exitFullscreen();else await el.requestFullscreen()}catch{}}
$('#chapters').onclick=e=>{const b=e.target.closest('[data-part]');if(b)goPart(+b.dataset.part)};
addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select')||e.altKey||e.ctrlKey||e.metaKey)return;if(!begun){begin();if(e.code==='Space'||e.key==='Enter'){e.preventDefault();return}}if(e.target.matches('button,a')&&(e.code==='Space'||e.key==='Enter'))return;startAudio();
 const k=e.key;if(['ArrowRight','ArrowLeft','PageDown','PageUp','Home','End',' '].includes(k))e.preventDefault();
 if(k==='ArrowRight'||k==='PageDown')goPart(partOf()+1);           // 다음 부(영상 한 편)
 else if(k==='ArrowLeft'||k==='PageUp')goPart(partOf()-1);
 else if(k==='.'){playing=false;show(Math.min(scenes.length-1,sceneIndex+1),8)}   // 장면 하나 앞으로
 else if(k===','){playing=false;show(Math.max(0,sceneIndex-1),8)}
 else if(e.code==='Space')toggle();
 else if(k==='r'||k==='R')goPart(partOf());
 else if(k==='1'||k==='2'||k==='3')goPart(+k);
 else if(k==='Home')goPart(1);else if(k==='End'){playing=false;show(scenes.length-1,8)}
 else if(k==='m'||k==='M'){muted=!muted;bgm.muted=muted}
 else if(k==='c'||k==='C')document.body.classList.toggle('caps');
 else if(k==='?'||k==='h'||k==='H')$('#keys').classList.toggle('show');
 else if(k.toLowerCase()==='f')fullscreen();
 if(k==='Escape'){unbigVideo();$('#keys').classList.remove('show');document.querySelectorAll('#scene .zoomable').forEach(z=>{if(z._zoom>.5)toggleZoom(z)})}});
/* 소리: 배경음악은 첫 키 입력·클릭 뒤 재생(브라우저 규칙), 내레이션 자막 중엔 작게 */
const bgm=$('#bgm');let muted=false,audioOn=false;function startAudio(){if(audioOn)return;audioOn=true;bgm.volume=.22;bgm.play().catch(()=>{})}   // 배경음악이 실패해도 내레이션은 계속
// 처음 화면: '발표 시작' 버튼. 클릭·Space 한 번으로 소리와 재생을 함께 시작 (브라우저는 사용자 동작 전 소리 재생을 막음)
let begun=new URLSearchParams(location.search).has('nostart');if(begun)$('#start').classList.add('gone');   // ?nostart: 시작 버튼 없이 (검사용)
function begin(){if(begun)return;begun=true;$('#start').classList.add('gone');$('#start').blur();$('#start').tabIndex=-1;startAudio();if(!playing&&!scenes[sceneIndex].video)toggle()}
addEventListener('click',e=>{if(!begun){begin();return}startAudio()});
addEventListener('hashchange',()=>{const n=(parseInt(location.hash.slice(1))||1)-1;if(n!==sceneIndex){playing=false;show(n)}});addEventListener('resize',()=>{resize();measureZooms();draw()});reduced.addEventListener('change',draw);let touchX;$('#scene').addEventListener('touchstart',e=>touchX=e.changedTouches[0].clientX,{passive:true});$('#scene').addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>60)goPart(partOf()+(dx<0?1:-1))},{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;syncVideo();draw()}});
resize();document.fonts.ready.then(()=>{show((parseInt(location.hash.slice(1))||1)-1,reduced.matches?8:0);document.body.dataset.ready='1'});requestAnimationFrame(frame);
