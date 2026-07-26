import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "my-toss-app",
  brand: {
    displayName: "주식 순위",
    primaryColor: "#FF8A65", // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    // TODO: 앱인토스 콘솔에서 아이콘 이미지를 업로드한 뒤, 발급된 이미지 주소로 채워주세요.
    // (public/appsintoss-logo.png는 로컬 개발용 자산이라 배포 후 접근 가능한 URL이 아닙니다)
    icon: "",
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
