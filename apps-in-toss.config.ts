import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "my-toss-app",

  brand: {
    // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    primaryColor: "#FF8A65"
  },

  permissions: [],
  webBundleDir: "dist"
});
