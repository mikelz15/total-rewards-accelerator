/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    // Ask TRA ships its knowledge as a reviewable Markdown file; bundle it as
    // a raw string (see src/content/ask-tra-knowledge.md).
    config.module.rules.push({
      test: /\.md$/,
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;
