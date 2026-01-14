import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

/**
 * Bundle Analyzer 설정
 * - ANALYZE=true 환경변수로 활성화
 * - npm run analyze 명령으로 번들 분석 가능
 */
const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@next/bundle-analyzer")({ enabled: true })
    : (config: NextConfig) => config;

export default withBundleAnalyzer(nextConfig);
