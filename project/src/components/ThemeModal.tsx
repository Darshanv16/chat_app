import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { supabase, type Profile, type Theme } from '../lib/supabase';
import { themes } from '../lib/themes';
import { useTheme } from '../contexts/ThemeContext';

type ThemeModalProps = {
  currentUser: Profile;
  onClose: () => void;
  onThemeChange: (theme: Theme) => void;
};

export default function ThemeModal({ currentUser, onClose, onThemeChange }: ThemeModalProps) {
  const { theme: currentTheme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<Theme>(currentTheme);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase
        .from('profiles')
        .update({ theme: selectedTheme })
        .eq('id', currentUser.id);

      setTheme(selectedTheme);
      onThemeChange(selectedTheme);
      onClose();
    } catch (error) {
      console.error('Error saving theme:', error);
    } finally {
      setSaving(false);
    }
  };

  const themePreview = (themeName: Theme) => {
    const config = themes[themeName];
    return (
      <button
        key={themeName}
        onClick={() => setSelectedTheme(themeName)}
        className={`relative p-4 rounded-xl border-2 transition ${
          selectedTheme === themeName
            ? 'border-gray-800 shadow-lg'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className={`h-20 rounded-lg bg-gradient-to-br ${config.gradient} mb-3`} />
        <div className="space-y-2">
          <div className={`h-3 ${config.primary} rounded w-3/4`} />
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded w-5/6" />
        </div>
        <div className="mt-3 text-sm font-medium text-gray-700">{config.name}</div>
        {selectedTheme === themeName && (
          <div className="absolute top-2 right-2 bg-gray-800 text-white rounded-full p-1">
            <Check className="w-4 h-4" />
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Choose Your Theme</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-gray-600 mb-6">
            Personalize your chat experience by selecting a color theme
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(Object.keys(themes) as Theme[]).map((themeName) =>
              themePreview(themeName)
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Theme'}
          </button>
        </div>
      </div>
    </div>
  );
}
