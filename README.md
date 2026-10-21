# my-toss-app

Apps in Toss 프로젝트입니다.

Node.js 24.22.1 이상(24 LTS)을 사용하세요. `.nvmrc`에 보안 수정 버전이 고정되어 있습니다.

SDK 3.x의 설정은 `apps-in-toss.config.ts`에서 관리합니다. 배포 전 토스 QR 환경에서
SDK 기능을 확인하고, API의 Origin 허용 목록에 `https://my-toss-app.web.tossmini.com`과
`https://my-toss-app.private-web.tossmini.com`을 반영하세요. SDK 3.x 번들을 출시하면
SDK 2.x로 롤백할 수 없습니다.

## 시작하기

```bash
npm run dev
```

## 배포하기

- 앱인토스 배포 API 키는 [앱인토스 콘솔](https://apps-in-toss.toss.im/) > 워크스페이스 > API 키 > 콘솔 API 키 에서 발급받을 수 있어요.

```bash
npm run build
npm run deploy
```

## 유용한 링크

- [앱인토스 콘솔](https://apps-in-toss.toss.im/)
- [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [앱인토스 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)

AI를 사용하시는 경우 [여기](https://developers-apps-in-toss.toss.im/development/llms.html)를 확인해보세요.
