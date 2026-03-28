
import React, { useState } from 'react';
import { BottomNav } from '../components/Navigation';
import { translations } from '../App';
import { addNotification } from '../utils/notifications';

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

const STUDENT_STORAGE_KEY = 'fittrack_notes';
const NOTIF_KEY = 'fittrack_note_notification';

const mockStudents = [
  { id: 1, name: 'Ayşe Kaya',     avatar: 'https://picsum.photos/seed/ayse/100/100' },
  { id: 2, name: 'Mehmet Yılmaz', avatar: 'https://picsum.photos/seed/mehmet/100/100' },
  { id: 3, name: 'Zeynep Şahin',  avatar: 'https://picsum.photos/seed/zeynep/100/100' },
  { id: 4, name: 'Can Öztürk',    avatar: 'https://picsum.photos/seed/can/100/100' },
  { id: 5, name: 'Selin Arslan',  avatar: 'https://picsum.photos/seed/selin/100/100' },
];

const getTrainerKey = (studentId: number) => `fittrack_notes_trainer_${studentId}`;

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

const loadStudentNotes = (): Note[] => {
  try {
    const raw = localStorage.getItem(STUDENT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const sample = getSampleNotes();
  localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(sample));
  return sample;
};

const loadTrainerNotes = (studentId: number): Note[] => {
  try {
    const raw = localStorage.getItem(getTrainerKey(studentId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
};

const saveStudentNotes = (notes: Note[]) => {
  localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(notes));
};

const saveTrainerNotes = (studentId: number, notes: Note[]) => {
  localStorage.setItem(getTrainerKey(studentId), JSON.stringify(notes));
  // Also sync to student's own storage key so they can read it
  localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(notes));
  const unreadCount = notes.filter(n => !n.isRead).length;
  localStorage.setItem(NOTIF_KEY, JSON.stringify({ count: unreadCount, lastDate: new Date().toISOString() }));
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
  form:      { label: { tr: 'Form',      en: 'Form'      }, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'     },
  nutrition: { label: { tr: 'Beslenme',  en: 'Nutrition' }, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  progress:  { label: { tr: 'İlerleme',  en: 'Progress'  }, color: 'bg-green-500/20 text-green-400 border-green-500/30'   },
  general:   { label: { tr: 'Genel',     en: 'General'   }, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30'      },
};

const AnalysisNotesScreen: React.FC<AnalysisNotesProps> = ({ lang, role = 'student' }) => {
  const isTrainer = role === 'trainer';

  // Student state
  const [studentNotes, setStudentNotes] = useState<Note[]>(() => {
    const loaded = loadStudentNotes();
    if (!isTrainer) {
      const updated = loaded.map(n => ({ ...n, isRead: true }));
      saveStudentNotes(updated);
      return updated;
    }
    return loaded;
  });

  // Trainer state
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [trainerNotes, setTrainerNotes] = useState<Note[]>([]);

  const handleSelectStudent = (id: number) => {
    if (selectedStudentId === id) {
      setSelectedStudentId(null);
      setTrainerNotes([]);
    } else {
      setSelectedStudentId(id);
      setTrainerNotes(loadTrainerNotes(id));
    }
    setActiveFilter('all');
  };

  const notes = isTrainer ? trainerNotes : studentNotes;

  const [activeFilter, setActiveFilter] = useState<'all' | 'form' | 'nutrition' | 'progress' | 'general'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<Note['category']>('general');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const filteredNotes = activeFilter === 'all' ? notes : notes.filter(n => n.category === activeFilter);

  const handleAddNote = () => {
    if (!newContent.trim() || !selectedStudentId) return;
    const newNote: Note = {
      id: Date.now().toString(),
      content: newContent.trim(),
      category: newCategory,
      date: new Date().toISOString(),
      isRead: false,
    };
    const updated = [newNote, ...trainerNotes];
    setTrainerNotes(updated);
    saveTrainerNotes(selectedStudentId, updated);
    const studentName = mockStudents.find(s => s.id === selectedStudentId)?.name || '';
    addNotification({
      type: 'note',
      title: lang === 'tr' ? 'Yeni Not Eklendi' : 'New Note Added',
      body: `${studentName}: ${newContent.slice(0, 60)}${newContent.length > 60 ? '…' : ''}`,
    });
    setNewContent('');
    setNewCategory('general');
    setShowAddModal(false);
  };

  const handleDeleteNote = (id: string) => {
    if (isTrainer && selectedStudentId) {
      const updated = trainerNotes.filter(n => n.id !== id);
      setTrainerNotes(updated);
      saveTrainerNotes(selectedStudentId, updated);
    } else {
      const updated = studentNotes.filter(n => n.id !== id);
      setStudentNotes(updated);
      saveStudentNotes(updated);
    }
  };

  const filterPills = [
    { key: 'all'       as const, label: lang === 'tr' ? 'Tümü'     : 'All'       },
    { key: 'form'      as const, label: lang === 'tr' ? 'Form'     : 'Form'      },
    { key: 'nutrition' as const, label: lang === 'tr' ? 'Beslenme' : 'Nutrition' },
    { key: 'progress'  as const, label: lang === 'tr' ? 'İlerleme' : 'Progress'  },
    { key: 'general'   as const, label: lang === 'tr' ? 'Genel'    : 'General'   },
  ];

  const selectedStudent = mockStudents.find(s => s.id === selectedStudentId);

  return (
    <div className="min-h-screen bg-background-dark pb-32 md:pb-0 md:pl-64">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-background-dark/90 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-xl font-black text-white">
            {lang === 'tr' ? 'Analiz Notları' : 'Analysis Notes'}
          </h1>
          {isTrainer && selectedStudentId && (
            <button
              onClick={() => setShowAddModal(true)}
              className="size-10 bg-primary rounded-xl flex items-center justify-center text-white hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-xl">add</span>
            </button>
          )}
        </div>

        {/* Filter pills — only shown when student selected (trainer) or always (student) */}
        {(!isTrainer || selectedStudentId) && (
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
        )}
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto flex flex-col gap-3">

        {/* === TRAINER VIEW === */}
        {isTrainer && (
          <>
            {/* Student list */}
            <div className="flex flex-col gap-2 mb-1">
              {mockStudents.map(student => {
                const isSelected = selectedStudentId === student.id;
                const noteCount = loadTrainerNotes(student.id).length;
                return (
                  <div key={student.id}>
                    <button
                      onClick={() => handleSelectStudent(student.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all active:scale-[0.99] ${
                        isSelected
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-card-dark border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className={`size-10 rounded-full object-cover border-2 ${isSelected ? 'border-primary' : 'border-white/10'}`}
                      />
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-white'}`}>{student.name}</p>
                        <p className="text-[10px] text-white/30 font-semibold mt-0.5">
                          {noteCount > 0
                            ? `${noteCount} ${lang === 'tr' ? 'not' : 'note'}`
                            : lang === 'tr' ? 'Henüz not yok' : 'No notes yet'}
                        </p>
                      </div>
                      <span className={`material-symbols-outlined text-lg transition-transform ${isSelected ? 'text-primary rotate-180' : 'text-white/20'}`}>
                        expand_more
                      </span>
                    </button>

                    {/* Expanded notes for this student */}
                    {isSelected && (
                      <div className="mt-2 flex flex-col gap-2 pl-2">
                        {filteredNotes.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 gap-3">
                            <div className="size-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                              <span className="material-symbols-outlined text-2xl text-white/20">edit_note</span>
                            </div>
                            <p className="text-white/30 text-xs font-semibold text-center">
                              {lang === 'tr' ? `${student.name} için henüz not yok` : `No notes for ${student.name} yet`}
                            </p>
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
                                  <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="size-7 rounded-lg bg-white/5 flex items-center justify-center text-red-400 hover:bg-red-500/10 active:scale-95 transition-all"
                                  >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                  </button>
                                </div>
                                <p className="text-white text-sm leading-relaxed">{note.content}</p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* === STUDENT VIEW === */}
        {!isTrainer && (
          <>
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="size-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-white/20">edit_note</span>
                </div>
                <p className="text-white/40 text-sm font-semibold">
                  {lang === 'tr' ? 'Henüz not yok' : 'No notes yet'}
                </p>
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
                      {!note.isRead && (
                        <span className="size-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-white text-sm leading-relaxed">{note.content}</p>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      <BottomNav role={role} lang={lang} />

      {/* Add Note Modal (trainer only) */}
      {showAddModal && selectedStudent && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-lg bg-[#0f1923] border border-white/10 rounded-t-3xl p-6 pb-10 flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">
                  {lang === 'tr' ? 'Not Ekle' : 'Add Note'}
                </h2>
                <p className="text-xs text-white/40 mt-0.5">{selectedStudent.name}</p>
              </div>
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
                  {newCategory === 'form'      && (lang === 'tr' ? 'Form'     : 'Form'      )}
                  {newCategory === 'nutrition' && (lang === 'tr' ? 'Beslenme' : 'Nutrition' )}
                  {newCategory === 'progress'  && (lang === 'tr' ? 'İlerleme' : 'Progress'  )}
                  {newCategory === 'general'   && (lang === 'tr' ? 'Genel'    : 'General'   )}
                </span>
                <span className="material-symbols-outlined text-white/50 text-base">
                  {showCategoryDropdown ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {showCategoryDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-white/10 rounded-xl overflow-hidden shadow-xl">
                  {[
                    { value: 'form',      label: lang === 'tr' ? 'Form'     : 'Form'      },
                    { value: 'nutrition', label: lang === 'tr' ? 'Beslenme' : 'Nutrition' },
                    { value: 'progress',  label: lang === 'tr' ? 'İlerleme' : 'Progress'  },
                    { value: 'general',   label: lang === 'tr' ? 'Genel'    : 'General'   },
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
