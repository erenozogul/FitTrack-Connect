
import React, { useState, useEffect } from 'react';
import { BottomNav } from '../components/Navigation';

interface Note {
  id: number;
  content: string;
  category: 'form' | 'nutrition' | 'progress' | 'general';
  createdAt: string;
}

interface Student {
  id: number;
  name: string;
  username: string;
  avatar: string;
}

interface AnalysisNotesProps {
  lang: 'tr' | 'en';
  role?: 'trainer' | 'student';
}

const categoryConfig = {
  form:      { label: { tr: 'Form',     en: 'Form'      }, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'      },
  nutrition: { label: { tr: 'Beslenme', en: 'Nutrition' }, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  progress:  { label: { tr: 'İlerleme', en: 'Progress'  }, color: 'bg-green-500/20 text-green-400 border-green-500/30'   },
  general:   { label: { tr: 'Genel',    en: 'General'   }, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30'      },
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

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('fittrack_token')}`,
});

const AnalysisNotesScreen: React.FC<AnalysisNotesProps> = ({ lang, role = 'student' }) => {
  const isTrainer = role === 'trainer';

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState<'all' | Note['category']>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<Note['category']>('general');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load students (trainer) or own notes (student)
  useEffect(() => {
    if (isTrainer) {
      fetch('/api/trainer/students', { headers: authHeaders() })
        .then(r => r.ok ? r.json() : [])
        .then(setStudents)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      fetch('/api/notes', { headers: authHeaders() })
        .then(r => r.ok ? r.json() : [])
        .then(setNotes)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isTrainer]);

  const handleSelectStudent = (id: number) => {
    if (selectedStudentId === id) {
      setSelectedStudentId(null);
      setNotes([]);
      return;
    }
    setSelectedStudentId(id);
    setActiveFilter('all');
    fetch(`/api/notes?studentId=${id}`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(setNotes)
      .catch(() => {});
  };

  const handleAddNote = async () => {
    if (!newContent.trim() || !selectedStudentId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ studentId: selectedStudentId, content: newContent.trim(), category: newCategory }),
      });
      if (res.ok) {
        const created = await res.json();
        setNotes(prev => [created, ...prev]);
        setNewContent('');
        setNewCategory('general');
        setShowAddModal(false);
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE', headers: authHeaders() });
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch { /* ignore */ }
  };

  const filteredNotes = activeFilter === 'all' ? notes : notes.filter(n => n.category === activeFilter);
  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const filterPills: { key: 'all' | Note['category']; label: string }[] = [
    { key: 'all',       label: lang === 'tr' ? 'Tümü'     : 'All'       },
    { key: 'form',      label: lang === 'tr' ? 'Form'     : 'Form'      },
    { key: 'nutrition', label: lang === 'tr' ? 'Beslenme' : 'Nutrition' },
    { key: 'progress',  label: lang === 'tr' ? 'İlerleme' : 'Progress'  },
    { key: 'general',   label: lang === 'tr' ? 'Genel'    : 'General'   },
  ];

  return (
    <div className="min-h-screen bg-background-dark pb-32 md:pb-0 md:pl-64">
      {/* Header */}
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

        {loading && (
          <div className="flex justify-center py-16">
            <span className="material-symbols-outlined text-white/20 text-4xl animate-spin">progress_activity</span>
          </div>
        )}

        {/* TRAINER VIEW */}
        {!loading && isTrainer && (
          <>
            {students.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="material-symbols-outlined text-4xl text-white/20">group_off</span>
                <p className="text-white/30 text-sm">{lang === 'tr' ? 'Henüz öğrenci bağlanmamış' : 'No students connected yet'}</p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {students.map(student => {
                const isSelected = selectedStudentId === student.id;
                return (
                  <div key={student.id}>
                    <button
                      onClick={() => handleSelectStudent(student.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all active:scale-[0.99] ${
                        isSelected ? 'bg-primary/10 border-primary/30' : 'bg-card-dark border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <img src={student.avatar} alt={student.name} className={`size-10 rounded-full object-cover border-2 ${isSelected ? 'border-primary' : 'border-white/10'}`} />
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-white'}`}>{student.name}</p>
                        <p className="text-[10px] text-white/30 font-semibold mt-0.5">@{student.username}</p>
                      </div>
                      <span className={`material-symbols-outlined text-lg transition-transform ${isSelected ? 'text-primary rotate-180' : 'text-white/20'}`}>expand_more</span>
                    </button>

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
                            const cfg = categoryConfig[note.category] ?? categoryConfig.general;
                            return (
                              <div key={note.id} className="bg-card-dark rounded-2xl border border-white/5 p-4 flex flex-col gap-2.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${cfg.color}`}>{cfg.label[lang]}</span>
                                    <span className="text-[10px] text-white/30 font-semibold">{relativeDate(note.createdAt, lang)}</span>
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

        {/* STUDENT VIEW */}
        {!loading && !isTrainer && (
          <>
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="size-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-white/20">edit_note</span>
                </div>
                <p className="text-white/40 text-sm font-semibold">{lang === 'tr' ? 'Henüz not yok' : 'No notes yet'}</p>
              </div>
            ) : (
              filteredNotes.map(note => {
                const cfg = categoryConfig[note.category] ?? categoryConfig.general;
                return (
                  <div key={note.id} className="bg-card-dark rounded-2xl border border-white/5 p-4 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${cfg.color}`}>{cfg.label[lang]}</span>
                      <span className="text-[10px] text-white/30 font-semibold">{relativeDate(note.createdAt, lang)}</span>
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

      {/* Add Note Modal */}
      {showAddModal && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-lg bg-[#0f1923] border border-white/10 rounded-t-3xl p-6 pb-10 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">{lang === 'tr' ? 'Not Ekle' : 'Add Note'}</h2>
                <p className="text-xs text-white/40 mt-0.5">{selectedStudent.name}</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="size-8 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="relative">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{lang === 'tr' ? 'Kategori' : 'Category'}</p>
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(v => !v)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/60 flex items-center justify-between"
              >
                <span>{categoryConfig[newCategory].label[lang]}</span>
                <span className="material-symbols-outlined text-white/50 text-base">{showCategoryDropdown ? 'expand_less' : 'expand_more'}</span>
              </button>
              {showCategoryDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-white/10 rounded-xl overflow-hidden shadow-xl">
                  {(Object.keys(categoryConfig) as Note['category'][]).map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setNewCategory(key); setShowCategoryDropdown(false); }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${newCategory === key ? 'bg-primary text-white' : 'text-white hover:bg-white/10'}`}
                    >
                      {categoryConfig[key].label[lang]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{lang === 'tr' ? 'Not' : 'Note'}</p>
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
              disabled={saving || !newContent.trim()}
              className="w-full bg-primary text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined">{saving ? 'hourglass_empty' : 'save'}</span>
              {lang === 'tr' ? 'Kaydet' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisNotesScreen;
