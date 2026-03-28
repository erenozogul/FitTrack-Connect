
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';
import { translations } from '../App';

interface StudentsScreenProps {
  lang: 'tr' | 'en';
  onLogout: () => void;
}

const mockStudents = [
  { id: 1, name: "Ayşe Kaya",     avatar: "https://picsum.photos/seed/ayse/100/100",   plan: "Fat Loss",    progress: 68, weight: "64 kg", sessions: 12, lastSeen: { tr: "Bugün", en: "Today" } },
  { id: 2, name: "Mehmet Yılmaz", avatar: "https://picsum.photos/seed/mehmet/100/100", plan: "Muscle Gain", progress: 45, weight: "82 kg", sessions: 8,  lastSeen: { tr: "Dün", en: "Yesterday" } },
  { id: 3, name: "Zeynep Şahin",  avatar: "https://picsum.photos/seed/zeynep/100/100", plan: "Strength",    progress: 82, weight: "58 kg", sessions: 20, lastSeen: { tr: "Bugün", en: "Today" } },
  { id: 4, name: "Can Öztürk",    avatar: "https://picsum.photos/seed/can/100/100",    plan: "Mobility",    progress: 31, weight: "75 kg", sessions: 4,  lastSeen: { tr: "3 gün önce", en: "3 days ago" } },
  { id: 5, name: "Selin Arslan",  avatar: "https://picsum.photos/seed/selin/100/100",  plan: "Fat Loss",    progress: 57, weight: "61 kg", sessions: 16, lastSeen: { tr: "Dün", en: "Yesterday" } },
];

type Student = typeof mockStudents[0];

const StudentsScreen: React.FC<StudentsScreenProps> = ({ lang, onLogout }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const t = translations[lang];
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-open student profile if ?id= param is present (e.g. from Messages)
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam) {
      const found = mockStudents.find(s => s.id === Number(idParam));
      if (found) setSelectedStudent(found);
    }
  }, [searchParams]);

  const filteredStudents = mockStudents.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background-dark pb-32 md:pb-0 md:pl-64">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background-dark/90 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-xl p-2.5">
              <span className="material-symbols-outlined text-primary text-2xl">groups</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-white">
                {lang === 'tr' ? 'Öğrencilerim' : 'My Students'}
              </h1>
              <p className="text-xs text-white/40">
                {lang === 'tr'
                  ? `${mockStudents.length} aktif öğrenci`
                  : `${mockStudents.length} active students`}
              </p>
            </div>
          </div>
          <button className="bg-white/5 rounded-xl p-2.5 hover:bg-white/10 transition-colors active:scale-95">
            <span className="material-symbols-outlined text-white text-2xl">person_add</span>
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mt-4 max-w-2xl mx-auto">
          <span className="material-symbols-outlined text-white/40 absolute left-3 top-1/2 -translate-y-1/2 text-xl">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={lang === 'tr' ? 'Öğrenci ara...' : 'Search students...'}
            className="w-full bg-card-dark border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/30 text-sm outline-none focus:border-primary/40 transition-colors"
          />
        </div>
      </div>

      {/* Student list */}
      <div className="px-4 py-4 max-w-2xl mx-auto flex flex-col gap-3">
        {filteredStudents.map(student => (
          <div
            key={student.id}
            onClick={() => setSelectedStudent(student)}
            className="bg-card-dark border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-primary/30 cursor-pointer transition-all active:scale-[0.98]"
          >
            {/* Avatar */}
            <img
              src={student.avatar}
              alt={student.name}
              className="size-14 rounded-2xl object-cover border-2 border-white/10 flex-shrink-0"
            />

            {/* Center info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white text-sm">{student.name}</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-primary/20 text-primary">
                  {student.plan}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-2">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${student.progress}%` }}
                />
              </div>
              <p className="text-[10px] text-white/40 mt-1">
                {student.progress}% • {student.sessions} {lang === 'tr' ? 'seans' : 'sessions'}
              </p>
            </div>

            {/* Right */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-[10px] text-white/40">{student.lastSeen[lang]}</span>
              <span className="material-symbols-outlined text-white/20 text-lg">chevron_right</span>
            </div>
          </div>
        ))}

        {filteredStudents.length === 0 && (
          <div className="text-center py-12 text-white/30">
            <span className="material-symbols-outlined text-4xl block mb-2">search_off</span>
            <p className="text-sm">{lang === 'tr' ? 'Öğrenci bulunamadı' : 'No students found'}</p>
          </div>
        )}
      </div>

      {/* Bottom sheet modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center md:justify-center"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="w-full md:max-w-md md:mx-auto bg-card-dark rounded-t-3xl md:rounded-2xl p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />

            {/* Close button */}
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-5 right-5 bg-white/5 rounded-full p-1.5 hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-white/60 text-xl">close</span>
            </button>

            {/* Avatar */}
            <div className="flex flex-col items-center mb-4">
              <img
                src={selectedStudent.avatar}
                alt={selectedStudent.name}
                className="size-20 rounded-2xl border-2 border-primary/40 object-cover mb-3"
              />
              <h2 className="text-xl font-black text-white">{selectedStudent.name}</h2>
              <span className="mt-1.5 text-[10px] font-black uppercase px-3 py-1 rounded-full bg-primary/20 text-primary">
                {selectedStudent.plan}
              </span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-background-dark rounded-2xl p-3 text-center border border-white/5">
                <p className="text-lg font-black text-white">{selectedStudent.weight}</p>
                <p className="text-[10px] text-white/40 uppercase mt-0.5">{t.weight}</p>
              </div>
              <div className="bg-background-dark rounded-2xl p-3 text-center border border-white/5">
                <p className="text-lg font-black text-white">{selectedStudent.sessions}</p>
                <p className="text-[10px] text-white/40 uppercase mt-0.5">
                  {lang === 'tr' ? 'Seans' : 'Sessions'}
                </p>
              </div>
              <div className="bg-background-dark rounded-2xl p-3 text-center border border-white/5">
                <p className="text-lg font-black text-white">{selectedStudent.progress}%</p>
                <p className="text-[10px] text-white/40 uppercase mt-0.5">
                  {lang === 'tr' ? 'İlerleme' : 'Progress'}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { setSelectedStudent(null); navigate('/messages'); }}
                className="flex-1 bg-primary text-white rounded-2xl py-3.5 font-black text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">chat_bubble</span>
                {lang === 'tr' ? 'Mesaj Gönder' : 'Send Message'}
              </button>
              <button
                onClick={() => alert(lang === 'tr' ? 'Yakında!' : 'Coming Soon!')}
                className="flex-1 bg-white/5 border border-white/10 text-white rounded-2xl py-3.5 font-black text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                {lang === 'tr' ? 'Planı Düzenle' : 'Edit Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav role="trainer" lang={lang} />
    </div>
  );
};

export default StudentsScreen;
