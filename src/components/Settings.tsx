import { useState } from 'react';

const MINIMUM_DURATION = 5;

interface SettingsProps {
    initialDuration: number;
    goalDays: number;
    onSave: ({ duration, goal }: { duration: number; goal: number }) => void;
    onCancel: () => void;
    settingsDisabled: boolean;
  }
  
const Settings = ({
  initialDuration,
  goalDays,
  onSave,
  onCancel,
  settingsDisabled
}: SettingsProps) => {
  const [duration, setDuration] = useState(initialDuration);
  const [goal, setGoal] = useState(goalDays);

  const handleSave = () => {
    if (duration >= MINIMUM_DURATION) {
      onSave({duration, goal});
    } else {
      alert(`Minimum duration must be at least ${MINIMUM_DURATION} minutes.`);
    }
  };

  return (
    <div className="p-4 bg-white border border-gray-300 rounded-md shadow-lg">
      <h2 className="text-xl font-bold mb-4">Settings</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Daily minimum minutes
        </label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mb-2"
          min={MINIMUM_DURATION}
          disabled={settingsDisabled}
        />
        <label className="block text-sm font-medium text-gray-700">
          Goal days (No goal = 0)
        </label>
        <input
          type="number"
          value={goal}
          onChange={(e) => setGoal(Number(e.target.value))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          min={0}
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
