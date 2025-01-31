import { useState } from 'react';

const MINIMUM_DURATION = 5;

const Settings = ({
  initialDuration,
  onSave,
  onCancel,
  settingsDisabled
}: {
  initialDuration: number;
  onSave: (duration: number) => void;
  onCancel: () => void;
  settingsDisabled: boolean
}) => {
  const [duration, setDuration] = useState(initialDuration);

  const handleSave = () => {
    if (duration >= MINIMUM_DURATION) {
      onSave(duration);
    } else {
      alert(`Minimum duration must be at least ${MINIMUM_DURATION} minutes.`);
    }
  };

  return (
    <div className="p-4 bg-white border border-gray-300 rounded-md shadow-lg">
      <h2 className="text-xl font-bold mb-4">Settings</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Minimum Duration (minutes)
        </label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          min={MINIMUM_DURATION}
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
        disabled={settingsDisabled}
      >
        Save
      </button>
    </div>
  );
};

export default Settings;
