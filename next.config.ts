import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Разрешаем dev-сервер по локальной сети (чтобы открыть с телефона в той же Wi-Fi).
  allowedDevOrigins: ["localhost", "127.0.0.1"],
};

export default nextConfig;
