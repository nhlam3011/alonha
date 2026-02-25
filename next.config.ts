import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "vinhomesland.vn", pathname: "/**" },
      // News RSS feed image domains
      { protocol: "https", hostname: "cafefcdn.com", pathname: "/**" },
      { protocol: "https", hostname: "cdn.baogiaothong.vn", pathname: "/**" },
      { protocol: "https", hostname: "icdn.dantri.com.vn", pathname: "/**" },
      { protocol: "https", hostname: "i1-dantri.vnecdn.net", pathname: "/**" },
      { protocol: "https", hostname: "i1-s.vnecdn.net", pathname: "/**" },
      { protocol: "https", hostname: "i1-vnexpress.vnecdn.net", pathname: "/**" },
      { protocol: "https", hostname: "img-s.vnecdn.net", pathname: "/**" },
      { protocol: "https", hostname: "photo-baomoi.zadn.vn", pathname: "/**" },
      { protocol: "https", hostname: "static-images.vnncdn.net", pathname: "/**" },
      { protocol: "https", hostname: "vnn-resize.vgcloud.vn", pathname: "/**" },
      { protocol: "https", hostname: "media-cdn-v2.laodong.vn", pathname: "/**" },
      { protocol: "https", hostname: "batdongsan.com.vn", pathname: "/**" },
      { protocol: "https", hostname: "cdn.alongwalk.info", pathname: "/**" },
      { protocol: "https", hostname: "*.cafefcdn.com", pathname: "/**" },
      { protocol: "https", hostname: "*.vnecdn.net", pathname: "/**" },
      { protocol: "https", hostname: "*.zadn.vn", pathname: "/**" },
      { protocol: "https", hostname: "*.vgcloud.vn", pathname: "/**" },
    ],
  },
};

export default nextConfig;
