import { prisma } from "@/lib/prisma";
import { SettingsClient, ConfigItem, ConfigType } from "./SettingsClient";

export default async function AdminSettingsPage() {
  const dbConfigs = await prisma.systemConfig.findMany({
    orderBy: { key: "asc" },
  });

  const configs: ConfigItem[] = dbConfigs.map(c => ({
    id: c.id,
    key: c.key,
    value: c.value,
    type: c.type as ConfigType,
  }));

  return (
    <div className="page-container">
      <header>
        <h1 className="page-title">Cấu hình hệ thống</h1>
        <p className="page-subtitle">Quản lý tham số cấu hình động và biến môi trường.</p>
      </header>

      <SettingsClient initialConfigs={configs} />
    </div>
  );
}
