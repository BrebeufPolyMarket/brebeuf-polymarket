import type { NextConfig } from "next";

const [githubOwner, githubRepo] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const isUserOrOrgPagesRepo = githubRepo?.toLowerCase() === `${githubOwner?.toLowerCase()}.github.io`;
const repoBasePath = isGithubActions && githubRepo && !isUserOrOrgPagesRepo ? `/${githubRepo}` : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(repoBasePath
    ? {
        basePath: repoBasePath,
        assetPrefix: repoBasePath,
      }
    : {}),
};

export default nextConfig;
