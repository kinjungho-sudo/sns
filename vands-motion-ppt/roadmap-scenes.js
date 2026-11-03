// 3부 향후 로드맵: 시연 영상 3편 + 피부과 SNS 참고 1장. 모두 향후 도입 가상 예시 · 별도 협의 옵션.
// 영상 소스는 motion/sns.html · knowledge.html · voice.html (node tools/render-video.mjs 로 다시 만듦)
function getRoadmapScenes(){
 const badges='<div class="scene-badges"><span>향후 도입 가상 예시</span><span>별도 협의 옵션</span></div>';
 const player=(name,label)=>`<div class="player demo-player"><video src="assets/video/${name}.mp4" poster="assets/video/${name}-poster.jpg" muted playsinline preload="auto" aria-label="${label}"></video><button class="player-fs" aria-label="영상 전체 화면">⤢ 전체 화면</button></div>`;
 const side=(title,points,similar,simNote)=>`<div class="demo-side">${R(.6,`<h2>${title}</h2><ul class="demo-points">${points.map(p=>`<li>${p}</li>`).join('')}</ul>`)}${R(1.8,`<div class="similar"><span class="eyebrow">비슷한 일을 하는 제품</span><div class="prods">${similar.map(([n,d])=>`<div><b>${n}</b><span>${d}</span></div>`).join('')}</div>${simNote?`<p class="sim-note">${simNote}</p>`:''}</div>`)}</div>`;
 const demo=(sub,name,dur,label,sideHtml,source,url)=>({part:3,title:'향후 로드맵',sub,duration:dur,stops:[0,dur],video:true,source,url,
  html:badges+`<div class="demo body-offset">${R(0,player(name,label))}${sideHtml}</div>`});
 return [
  demo('SNS 콘텐츠 자동화 · 시연','sns',14,'SNS 콘텐츠 자동화 시연 영상',
   side('확인된 정보로 초안,<br>사람이 승인, 예약 게시',['카드뉴스 · 숏폼 · 다국어 초안을 한 번에','게시 전 의료광고 기준 점검 → 담당자 승인','승인된 것만 일정에 맞춰 게시'],
    [['Canva Magic Studio','글·이미지로 SNS 디자인 초안'],['Buffer · Hootsuite','AI 문구 제안과 예약 게시']]),
   '가상 시연 · 유사 제품은 공개된 기능 소개 기준 · 실제 게시·플랫폼 연동이 아닙니다','https://www.canva.com/'),
  {part:3,title:'향후 로드맵',sub:'피부과 SNS는 이렇게 씁니다 · 참고 조사',source:'참고: 데일리안 ‘피알남’ 인터뷰(2022) · 병원 소개 페이지 · 피부과 유튜브 분석 리포트(2026.9) · 의료광고 관련 보도 — 업계 자료 포함, 게시 전 법령 원문·심의 기준 확인',url:'https://www.dailian.co.kr/news/view/1118733/',
   html:badges+`<div class="sns-research body-offset">${R(0,`<div class="panel res"><span class="eyebrow">많이 쓰는 형식</span><h2>카드뉴스 · 숏폼</h2><ul><li><b>카드뉴스</b>계절별 피부 관리처럼 진료과 테마로 기획</li><li><b>릴스 · 숏폼</b>짧은 설명 영상, 자막 중심</li><li><b>다국어 안내</b>외국인 환자용 언어별 콘텐츠</li></ul></div>`)}${R(1.2,`<div class="panel res"><span class="eyebrow">원장이 직접 설명</span><h2>전문의 채널</h2><ul><li><b>‘피알남’ (보스피부과)</b>원장이 피부 상담을 영상으로 · 내원자 상당수가 구독자라는 병원 측 설명</li><li><b>생활 밀착 팁</b>상식 반전 · 실용 정보가 인기 (업계 리포트)</li></ul></div>`)}${R(2.4,`<div class="panel res warn"><span class="eyebrow">자동화해도 지킬 것</span><h2>의료광고 기준</h2><ul><li><b>치료 경험담 · 후기</b>의료법 제56조 제2항으로 제한</li><li><b>후기 조건 할인</b>유인·알선 소지 (제27조 제3항)</li><li><b>사전심의</b>일평균 이용자 10만 이상 SNS 광고</li></ul></div>`)}</div>${R(3.4,'<div class="note compact">그래서 자동화 흐름에 “게시 전 점검 · 담당자 승인” 단계를 넣었습니다.</div>','bottom-note')}`},
  demo('내부 지식 보조 · 시연','knowledge',10,'내부 지식 보조 시연 영상',
   side('직원이 물으면<br>확인된 문서에서 답',['병원 공식 정보 · 안내문 · 업무 매뉴얼이 근거','답마다 출처 표시','문서에 없으면 “담당자 확인 필요”'],
    [['Notion AI','사내 문서에 질문하고 답 받기'],['ChatGPT 프로젝트','올린 자료를 바탕으로 답변'],['Glean','회사 자료 통합 검색 · 답변']]),
   '가상 시연 · 답은 고객 전달 시안의 진료시간 문구(평일 20시까지 · 토·일 진료)만 사용 · 실제 연동이 아닙니다','https://vands-eight.vercel.app/#location'),
  demo('보이스 차트 · 시연','voice',11,'보이스 차트 시연 영상',
   side('말하면 차트 초안,<br>확인은 의사가',['진료 대화를 기록 초안으로','의사가 확인 · 수정한 뒤 저장'],
    [['퍼즐에이아이','보이스 EMR · 국내 대형병원 도입 보도'],['비트컴퓨터','의원용 EMR의 AI 보이스 기능'],['Abridge · Dragon Copilot','해외 진료 대화 기록 AI']],'국내 대형병원들이 2025년 보이스 EMR을 도입했다는 보도가 있습니다.'),
   '가상 시연 · 실제 환자 정보·녹음 없음 · 유사 제품은 공개 보도 기준','https://www.hankyung.com/article/2025102007781'),
 ];
}
