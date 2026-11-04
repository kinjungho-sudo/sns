// 3부 참고 예시: 이런 것도 만들 수 있다는 참고용 시연 영상 4편 (+ 피부과 SNS 참고 1장, 간추린 발표에선 뺌). 솔루션 제안이 아니다.
// 영상 소스는 motion/sns.html · brain.html · interpret.html · voice.html (node tools/render-video.mjs 로 다시 만듦)
function getRoadmapScenes(){
 const badges='<div class="scene-badges"><span>참고 예시</span><span>이번 제안 범위 아님</span></div>';
 const player=(name,label)=>`<div class="player demo-player"><video src="${vid(name)}" poster="${vid(name+'-poster','.jpg')}" muted playsinline preload="auto" aria-label="${label}"></video><button class="player-fs" aria-label="영상 전체 화면">⤢ 전체 화면</button></div>`;
 const side=(title,points,similar,simNote)=>`<div class="demo-side">${R(.6,`<h2>${title}</h2><ul class="demo-points">${points.map(p=>`<li>${p}</li>`).join('')}</ul>`)}${R(1.8,`<div class="similar"><span class="eyebrow">비슷한 일을 하는 제품</span><div class="prods">${similar.map(([n,d])=>`<div><b>${n}</b><span>${d}</span></div>`).join('')}</div>${simNote?`<p class="sim-note">${simNote}</p>`:''}</div>`)}</div>`;
 const demo=(sub,name,dur,label,sideHtml,source,url)=>({part:3,title:'참고 · 만들 수 있는 것들',sub,duration:dur,stops:[0,dur],video:true,source,url,
  html:badges+`<div class="demo body-offset">${R(0,player(name,label))}${sideHtml}</div>`});
 return [
  demo('SNS 콘텐츠 자동화 · 시연','sns',17,'SNS 콘텐츠 자동화 시연 영상',
   side('인스타그램 · 블로그 글을<br>자동으로 만들고 예약 게시',['병원 사진 + 매거진형 게시물 · 블로그 글 초안','게시 전 의료광고 기준 점검 → 담당자 승인','승인된 것만 일정에 맞춰 게시'],
    [['Canva Magic Studio','글·이미지로 SNS 디자인 초안'],['Buffer · Hootsuite','AI 문구 제안과 예약 게시']]),
   '가상 시연 · 유사 제품은 공개된 기능 소개 기준 · 실제 게시·플랫폼 연동이 아닙니다','https://www.canva.com/'),
  {part:3,title:'향후 로드맵',sub:'피부과 SNS는 이렇게 씁니다 · 참고 조사',source:'참고: 데일리안 ‘피알남’ 인터뷰(2022) · 병원 소개 페이지 · 피부과 유튜브 분석 리포트(2026.9) · 의료광고 관련 보도 — 업계 자료 포함, 게시 전 법령 원문·심의 기준 확인',url:'https://www.dailian.co.kr/news/view/1118733/',
   html:badges+`<div class="sns-research body-offset">${R(0,`<div class="panel res"><span class="eyebrow">많이 쓰는 형식</span><h2>카드뉴스 · 숏폼</h2><ul><li><b>카드뉴스</b>계절별 피부 관리처럼 진료과 테마로 기획</li><li><b>릴스 · 숏폼</b>짧은 설명 영상, 자막 중심</li><li><b>다국어 안내</b>외국인 환자용 언어별 콘텐츠</li></ul></div>`)}${R(1.2,`<div class="panel res"><span class="eyebrow">원장이 직접 설명</span><h2>전문의 채널</h2><ul><li><b>‘피알남’ (보스피부과)</b>원장이 피부 상담을 영상으로 · 내원자 상당수가 구독자라는 병원 측 설명</li><li><b>생활 밀착 팁</b>상식 반전 · 실용 정보가 인기 (업계 리포트)</li></ul></div>`)}${R(2.4,`<div class="panel res warn"><span class="eyebrow">자동화해도 지킬 것</span><h2>의료광고 기준</h2><ul><li><b>치료 경험담 · 후기</b>의료법 제56조 제2항으로 제한</li><li><b>후기 조건 할인</b>유인·알선 소지 (제27조 제3항)</li><li><b>사전심의</b>일평균 이용자 10만 이상 SNS 광고</li></ul></div>`)}</div>${R(3.4,'<div class="note compact">그래서 자동화 흐름에 “게시 전 점검 · 담당자 승인” 단계를 넣었습니다.</div>','bottom-note')}`},
  demo('원장님 세컨드 브레인 · 시연','brain',15,'원장님 세컨드 브레인 AI 에이전트 시연 영상',
   side('원장님의 지식을 기억하는<br>AI 에이전트',['진료 노트 · 강의 · 상담 기준을 한곳에 기억','직원이 물으면 원장님 방식으로, 출처와 함께','음성 메모 한마디로 새 기준 추가'],
    [['Notion AI','쌓인 문서에 묻고 답 받기'],['Mem · Obsidian','개인 지식 저장소 · 세컨드 브레인'],['ChatGPT 프로젝트','올린 자료로 답변']]),
   '가상 시연 · 노트·답변 내용은 설명용 예시 · 진료 판단은 원장님이 최종 확인 · 실제 연동이 아닙니다','https://www.notion.com/product/ai'),
  demo('동시 통역 · 시연','interpret',15,'외국인 환자 동시 통역 시연 영상',
   side('외국인 환자와<br>실시간 통역 자막',['환자 말은 한국어로, 원장님 말은 환자 언어로','영어 · 중국어 · 일본어 등 여러 언어','진료 설명은 원장님이 확인'],
    [['파파고 대화 통역','양방향 음성 통역'],['Google 번역 대화 모드','실시간 음성 번역'],['DeepL Voice','회의·대화 실시간 번역 자막']]),
   '가상 시연 · 실제 환자 정보 없음 · 유사 제품은 공개된 기능 소개 기준','https://papago.naver.com/'),
  demo('보이스 차트 · 시연','voice',11,'보이스 차트 시연 영상',
   side('말하면 차트 초안,<br>확인은 의사가',['진료 대화를 기록 초안으로','의사가 확인 · 수정한 뒤 저장'],
    [['퍼즐에이아이','보이스 EMR · 국내 대형병원 도입 보도'],['비트컴퓨터','의원용 EMR의 AI 보이스 기능'],['Abridge · Dragon Copilot','해외 진료 대화 기록 AI']],'국내 대형병원들이 2025년 보이스 EMR을 도입했다는 보도가 있습니다.'),
   '가상 시연 · 실제 환자 정보·녹음 없음 · 유사 제품은 공개 보도 기준','https://www.hankyung.com/article/2025102007781'),
 ];
}
