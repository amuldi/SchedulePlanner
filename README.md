# SchedulePlanner

SchedulePlanner는 월간 캘린더, 일정, 프로젝트를 한 화면에서 관리하는 정적 웹 플래너입니다. 기존의 밝은 아이보리 톤과 선명한 포인트 컬러를 유지하면서, 실제 서비스처럼 사용할 수 있도록 일정 관리 흐름, 알림, 검색, 드래그 앤 드롭, 데이터 백업 기능을 다듬었습니다.

[Production 사이트 열기](https://design-schedule-deploy.vercel.app)

## 미리보기

![SchedulePlanner main screen](./assets/readme/preview.png)

## 주요 기능

- 월간 캘린더에서 일정과 프로젝트 기간을 함께 확인
- 선택한 날짜의 일정 추가, 수정, 완료, 삭제
- 캘린더 셀 간 일정 드래그 앤 드롭 이동
- 일정 시작 전 웹 알림 설정: 없음, 10분 전, 30분 전, 1시간 전
- Notification API와 Service Worker 기반 알림 클릭 처리
- 검색어 기반 일정과 프로젝트 동시 필터링
- Agenda 목록 내부 스크롤 처리로 일정이 많아도 카드가 깨지지 않음
- 프로젝트 시작일, 종료일, 분류, 색상, 진행 상태 관리
- 오늘 날짜, 공휴일, 빈 상태, 저장 성공/오류 토스트 표시
- 프로필 이름과 이미지 변경
- JSON 데이터 내보내기와 가져오기
- PWA용 manifest, favicon, app icon 제공

## UI 방향

- 데스크톱 작업 흐름을 기준으로 캘린더를 넓게 배치하고 Planner 패널을 오른쪽에 고정했습니다.
- 기존 아이보리 기반 분위기는 유지하되 카드, 입력창, 버튼, hover 상태의 border와 shadow를 정리했습니다.
- Agenda와 Projects는 탭으로 분리해 화면 밀도를 낮추고, 일정 입력은 날짜, 시간, 알림, 제목 중심으로 단순화했습니다.
- 캘린더 안의 일정 점, 프로젝트 바, 상태 배지는 시각적 식별이 쉽도록 색상 대비를 보강했습니다.

## 기술 구성

- HTML, CSS, Vanilla JavaScript
- 브라우저 `localStorage` 기반 상태 저장
- Notification API
- Service Worker
- Vercel 정적 배포

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

빌드 과정이 없는 정적 앱입니다. 기본 화면은 `index.html`을 브라우저로 직접 열어도 확인할 수 있습니다.

웹 알림과 Service Worker까지 함께 확인하려면 로컬 서버로 실행하는 것이 좋습니다.

```bash
python3 -m http.server 4173
```

```text
http://localhost:4173
```

브라우저 알림은 HTTPS 또는 `localhost` 같은 보안 컨텍스트에서만 동작합니다.

## 배포

현재 Production 배포 주소:

```text
https://design-schedule-deploy.vercel.app
```

Vercel CLI로 직접 배포할 때:

```bash
npx vercel deploy --prod --yes
```

## 데이터 저장 방식

앱 데이터는 서버 DB가 아니라 브라우저 `localStorage`에 저장됩니다. 다른 브라우저나 기기로 옮기려면 상단의 내보내기/가져오기 기능으로 JSON 파일을 사용하면 됩니다.

## 참고

- 알림 권한이 차단된 경우 브라우저 사이트 설정에서 직접 허용해야 합니다.
- 일정 알림은 앱이 같은 브라우저 프로필에 열려 있거나 Service Worker가 등록된 상태를 기준으로 동작합니다.
- 프로젝트는 GitHub 저장소와 Vercel Production 배포가 연결된 정적 웹앱입니다.
