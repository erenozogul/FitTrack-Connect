
import React, { useState } from 'react';
import { BottomNav } from '../components/Navigation';
import { translations } from '../App';

interface Note {
  id: string;
  content: string;
  category: 'form' | 'nutrition' | 'progress' | 'general';
  date: string;
  isRead: boolean;
}

interface AnalysisNotesProps {
  lang: 'tr' | 'en';
  role?: 'trainer' | 'student';
}

const STORAGE_KEY = 'fittrack_notes';
const NOTIF_KEY = 'fittrack_note_notification';

const getSampleNotes = (): Note[] => {
  const now = new Date();
  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d.toISOString();
  };
  return [
    {
      id: '1',
      content: 'Squat formunda iyileşme var, diz hizalamasına dikkat et.',
      category: 'form',
      date: daysAgo(2),
      isRead: false,
    },
    {
      id: '2',
      content: 'Protein alımını antrenman sonrası 30 dk içinde yap. Kreatin kullanımını değerlendir.',
      category: 'nutrition',
      date: daysAgo(5),
      isRead: true,
    },
    {
      id: '3',
      content: "Bu hafta bench press'te 5kg ilerleme! Harika gidiyorsun.",
      category: 'progress',
      date: daysAgo(1),
      isRead: false,
    },
  ];
};

const loadNotes = (): Note[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const sample = getSampleNotes();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
  return sample;
};

const saveNotes = (notes: Note[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
};

const relativeDate = (isoDate: string, lang: 'tr' | 'en'): string => {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 60) return lang === 'tr' ? 'Az önce' : 'Just now';
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return lang === 'tr' ? `${minutes} dk önce` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return lang === 'tr' ? `${hours} saat önce` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return lang === 'tr' ? 'Dün' : 'Yesterday';
  return lang === 'tr' ? `${days} gün önce` : `${days} days ago`;
};

const categoryConfig = {
  form: { label: { tr: 'Form', en: 'Form' }, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  nutrition: { label: { tr: 'Beslenme', en: 'Nutrition' }, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  progress: { label: { tr: 'İlerleme', en: 'Progress' }, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  general: { label: { tr: 'Genel', en: 'General' }, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

const AnalysisNotesScreen: React.FC<AnalysisNotesProps> = ({ lang, role = 'student' }) => {
  const isTrainer = role === 'trainer';

  const [notes, setNotes] = useState<Note[]>(() => {
    const loaded = loadNotes();
    // If student, mark all as read on init
    if (!isTrainer) {
      const updated = loaded.map(n => ({ ...n, isRead: true }));
      saveNotes(updated);
      return updated;
    }
    return loaded;
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'form' | 'nutrition' | 'progress' | 'general'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<Note['category']>('general');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const filteredNotes = activeFilter === 'all' ? notes : notes.filter(n => n.category === activeFilter);

  const handleAddNote = () => {
    if (!newContent.trim()) return;
    const newNote: Note = {
      id: Date.now().toString(),
      content: newContent.trim(),
      category: newCategory,
      date: new Date().toISOString(),
      isRead: false,
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    saveNotes(updated);
    // Save notification
    const unreadCount = updated.filter(n => !n.isRead).length;
    localStorage.setItem(NOTIF_KEY, JSON.stringify({ count: unreadCount, lastDate: new Date().toISOString() }));
    setNewContent('');
    setNewCategory('general');
    setShowAddModal(false);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
  };

  const filterPills = [
    { key: 'all' as const, label: lang === 'tr' ? 'Tümü' : 'All' },
    { key: 'form' as const, label: lang === 'tr' ? 'Form' : 'Form' },
    { key: 'nutrition' as const, label: lang === 'tr' ? 'Beslenme' : 'Nutrition' },
    { key: 'progress' as const, label: lang === 'tr' ? 'İlerleme' : 'Progress' },
    { key: 'general' as const, label: lang === 'tr' ? 'Genel' : 'General' },
  ];

  return (
    <div className="min-h-screen bg-background-dark pb-32 md:pb-0 md:pl-64">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-background-dark/90 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-xl font-black text-white">
            {lang === 'tr' ? 'Analiz Notları' : 'Analysis Notes'}
          </h1>
          {isTrainer && (
            <button
              onClick={() => setShowAddModal(true)}
              className="size-10 bg-primary rounded-xl flex items-center justify-center text-white hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-xl">add</span>
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 max-w-2xl mx-auto pb-1">
          {filterPills.map(pill => (
            <button
              key={pill.key}
              onClick={() => setActiveFilter(pill.key)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${
                activeFilter === pill.key
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto flex flex-col gap-3">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="size-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-white/20">edit_note</span>
            </div>
            <div className="text-center">
              <p className="text-white/40 text-sm font-semibold">
                {lang === 'tr' ? 'Henüz not yok' : 'No notes yet'}
              </p>
              {isTrainer && (
                <p className="text-white/20 text-xs mt-1">
                  {lang === 'tr' ? 'Not eklemek için + butonuna tıkla' : 'Tap + to add a note'}
                </p>
              )}
            </div>
          </div>
        ) : (
          filteredNotes.map(note => {
            const cfg = categoryConfig[note.category];
            return (
              <div
                key={note.id}
                className="bg-card-dark rounded-2xl border border-white/5 p-4 flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${cfg.color}`}>
                      {cfg.label[lang]}
                    </span>
                    <span className="text-[10px] text-white/30 font-semibold">
                      {relativeDate(note.date, lang)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isTrainer && !note.isRead && (
                      <span className="size-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                    {isTrainer && (
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="size-7 rounded-lg bg-white/5 flex items-center justify-center text-red-400 hover:bg-red-500/10 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-white text-sm leading-relaxed">{note.content}</p>
              </div>
            );
          })
        )}
      </div>

      <BottomNav role={role} lang={lang} />

      {/* Add Note Modal (trainer only) */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-lg bg-[#0f1923] border border-white/10 rounded-t-3xl p-6 pb-10 flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white">
                {lang === 'tr' ? 'Not Ekle' : 'Add Note'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="size-8 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="relative">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
                {lang === 'tr' ? 'Kategori' : 'Category'}
              </p>
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(v => !v)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/60 flex items-center justify-between"
              >
                <span>
                  {newCategory === 'form' && (lang === 'tr' ? 'Form' : 'Form')}
                  {newCategory === 'nutrition' && (lang === 'tr' ? 'Beslenme' : 'Nutrition')}
                  {newCategory === 'progress' && (lang === 'tr' ? 'İlerleme' : 'Progress')}
                  {newCategory === 'general' && (lang === 'tr' ? 'Genel' : 'General')}
                </span>
                <span className="material-symbols-outlined text-white/50 text-base">
                  {showCategoryDropdown ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {showCategoryDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-white/10 rounded-xl overflow-hidden shadow-xl">
                  {[
                    { value: 'form', label: lang === 'tr' ? 'Form' : 'Form' },
                    { value: 'nutrition', label: lang === 'tr' ? 'Beslenme' : 'Nutrition' },
                    { value: 'progress', label: lang === 'tr' ? 'İlerleme' : 'Progress' },
                    { value: 'general', label: lang === 'tr' ? 'Genel' : 'General' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setNewCategory(opt.value as Note['category']); setShowCategoryDropdown(false); }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${newCategory === opt.value ? 'bg-primary text-white' : 'text-white hover:bg-white/10'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
                {lang === 'tr' ? 'Not' : 'Note'}
              </p>
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder={lang === 'tr' ? 'Notunuzu yazın...' : 'Write your note...'}
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-primary/60 resize-none"
              />
            </div>

            <button
              onClick={handleAddNote}
              className="w-full bg-primary text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">save</span>
              {lang === 'tr' ? 'Kaydet' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisNotesScreen;
