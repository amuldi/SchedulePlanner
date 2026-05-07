# SchedulePlanner

SchedulePlanner는 월간 캘린더, Agenda, Projects를 한 화면에서 다루는 데스크톱 중심 일정 관리 웹앱입니다. 밝은 아이보리 톤과 블루 포인트 컬러를 유지하면서 일정 입력, 검색, 드래그 앤 드롭, 웹 알림, 데이터 백업 흐름을 실제 서비스에 가깝게 다듬었습니다.

[Production 사이트](https://design-schedule-deploy.vercel.app)

## 미리보기

아래 이미지는 현재 Production 배포 화면을 기준으로 캡처한 최신 실행 화면입니다.

![SchedulePlanner current production screen](./assets/readme/preview.png)

## 핵심 기능

- 월간 캘린더에서 일정과 프로젝트 기간을 함께 확인
- 선택한 날짜의 일정 추가, 수정, 완료 처리, 삭제
- 일정이 많아져도 Agenda 목록 안에서 스크롤로 안정적으로 탐색
- 캘린더 셀 간 일정 드래그 앤 드롭 이동
- 일정 시작 전 알림 설정: 없음, 10분 전, 30분 전, 1시간 전
- Notification API와 Service Worker 기반 웹 알림 처리
- 검색어 기반 일정/프로젝트 동시 필터링
- 프로젝트 기간, 분류, 색상, 진행 상태 관리
- 오늘 날짜, 공휴일, 빈 상태, 저장 성공/오류 토스트 표시
- 프로필 이름과 이미지 변경
- JSON 데이터 내보내기/가져오기
- PWA manifest와 앱 아이콘 제공

## 화면 구성

- **상단 바**: 프로필, 검색, 알림 권한 버튼, 데이터 내보내기/가져오기
- **Calendar**: 월간 일정, 프로젝트 기간, 공휴일, 오늘/선택 날짜 표시
- **Planner**: 일정과 프로젝트를 탭으로 전환해 관리
- **Agenda**: 날짜, 시간, 알림, 제목 중심의 간결한 일정 입력 폼
- **Projects**: 프로젝트명, 기간, 분류, 색상, 상태 관리

## 디자인 방향

- 기존 아이보리 기반 UI 아이덴티티를 유지했습니다.
- 카드, 입력창, 버튼, 캘린더 셀의 border와 shadow를 정리해 더 안정적인 SaaS형 화면으로 다듬었습니다.
- 캘린더 일정 점은 푸른색 포인트로 통일해 선택된 어두운 셀에서도 식별되도록 했습니다.
- 과한 애니메이션 대신 hover, focus, transition을 짧고 부드럽게 적용했습니다.

## 기술 구성

- HTML
- CSS
- Vanilla JavaScript
- Browser `localStorage`
- Notification API
- Service Worker
- Vercel Static Deployment

## 파일 구조

```text
.
├── index.html
├── src/
│   ├── app.js
│   └── styles.css
├── assets/
│   ├── icons/
│   └── readme/
│       ├── preview.png
│       └── favicon-preview.png
├── sw.js
├── site.webmanifest
├── vercel.json
└── README.md
```

## 로컬 실행

정적 앱이라 별도 빌드 과정이 필요 없습니다. 기본 화면은 `index.html`을 직접 열어도 확인할 수 있습니다.

웹 알림과 Service Worker까지 함께 확인하려면 로컬 서버로 실행하세요.

```bash
python3 -m http.server 4173
```

```text
http://localhost:4173
```

브라우저 알림은 HTTPS 또는 `localhost` 같은 보안 컨텍스트에서 동작합니다.

## 배포

현재 Production URL:

```text
https://design-schedule-deploy.vercel.app
```

Vercel CLI 배포:

```bash
npx vercel deploy --prod --yes
```

## 데이터 저장

일정, 프로젝트, 프로필 정보는 서버 DB가 아니라 브라우저 `localStorage`에 저장됩니다. 다른 브라우저나 기기로 옮기려면 상단의 내보내기/가져오기 기능으로 JSON 파일을 사용하면 됩니다.

## 알림 참고

- 알림 권한이 차단된 경우 브라우저 사이트 설정에서 직접 허용해야 합니다.
- 알림은 브라우저의 Notification API 지원 여부와 권한 상태에 따라 동작합니다.
- Service Worker는 알림 클릭 시 열려 있는 앱 창을 다시 포커스하고 해당 날짜로 이동시키는 데 사용됩니다.
