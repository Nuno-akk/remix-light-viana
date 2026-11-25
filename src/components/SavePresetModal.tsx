import {useState} from 'react';
import {X} from 'lucide-react';
import {useLanguage} from '../i18n/LanguageContext';

interface SavePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function SavePresetModal({isOpen, onClose, onSave}: SavePresetModalProps) {
  const {t} = useLanguage();
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setName('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-preset-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-xl border border-white/15 bg-[#101624] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="save-preset-title" className="font-display text-base font-semibold text-white">
            {t.saveModalTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeModalAria}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="preset-name-input" className="mb-1.5 block text-xs font-medium text-slate-300">
              {t.presetNameLabel}
            </label>
            <input
              id="preset-name-input"
              type="text"
              autoFocus
              required
              maxLength={32}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.presetNamePlaceholder}
              className="h-10 w-full rounded-lg border border-white/15 bg-[#090C12] px-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white"
            >
              {t.cancelBtn}
            </button>
            <button
              type="submit"
              className="min-h-[40px] rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400"
            >
              {t.savePresetBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
