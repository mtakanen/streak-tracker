import { useState } from 'react';

const MINIMUM_DURATION = 5;

interface SettingsProps {
    initialSettings: InitialSettings;
    onSave: ({ duration, goal, multiSport }: { duration: number; goal: number, multiSport: boolean }) => void;
    onCancel: () => void;
    settingsDisabled: boolean;
  }

interface InitialSettings {
    duration: number;
    goal: number;
    multiSport: boolean;
  }
  
const Settings = ({
  initialSettings,
  onSave,
  onCancel,
  settingsDisabled
}: SettingsProps) => {

  const [settings, setSettings] = useState(initialSettings);

  const handleSave = () => {
    if (settings.duration >= MINIMUM_DURATION) {
      onSave(settings);
    } else {
      alert(`Minimum duration must be at least ${MINIMUM_DURATION} minutes.`);
    }
  };

  return (
    <div className="text-secondary p-4 bg-primary border border-border rounded-md shadow-lg">
      <h2 className="text-xl font-bold mb-4">Settings</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Daily minimum minutes
        </label>
        <input
          type="number"
          value={settings.duration}
          onChange={(e) => setSettings({ ...settings, duration: Number(e.target.value) })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mb-2"
          min={MINIMUM_DURATION}
          disabled={settingsDisabled}
        />
        <label className="block text-sm font-medium text-gray-700">
          Goal streak (No goal = 0)
        </label>
        <input
          type="number"
          value={settings.goal}
          onChange={(e) => setSettings({ ...settings, goal: Number(e.target.value) })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          min={0}
        />
        <label className="mt-2 block text-sm font-medium text-gray-700">
          Multi-sport
        </label>
        <input
          type="checkbox"
          checked={settings.multiSport}
          onChange={(e) => setSettings({ ...settings, multiSport: e.target.checked })}
          className="mt-1 mb-4"
          disabled={settingsDisabled}
        />
      </div>
      <button
        onClick={onCancel}
        className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2"
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        className="px-4 py-2 bg-blue-500 text-white rounded-md"
      >
        Save
      </button>
    </div>
  );
};

export default Settings;
