import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: "dealguard",
  project: "frontend",
  widenClientFileUpload: true,
});



