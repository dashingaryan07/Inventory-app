import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      <div className="text-center py-12">
        <SettingsIcon size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">Settings feature coming soon</p>
      </div>
    </div>
  );
}
