
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';

interface StudentsScreenProps {
  lang: 'tr' | 'en';
  onLogout: () => void;
}

interface Student {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar: string;
  totalAssignments?: number;
}

const StudentsScreen: React.FC<StudentsScreenProps> = ({ lang, onLogout }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('fittrack_token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('/api/trainer/students', { headers }).then(r => r.ok ? r.json() : []),
      fetch('/api/trainer/analytics', { headers }).then(r => r.ok ? r.json() : null),
    ]).then(([studentList, analytics]) => {
      const statsMap: Record<number, number> = {};
      if (analytics?.students) {
        analytics.students.forEach((s: any) => { statsMap[s.id] = s.totalAssignments; });
      }
      setStudents(studentList.map((s: Student) => ({ ...s, totalAssignments: statsMap[s.id] ?? 0 })));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Auto-open student if ?id= param present
  useEffect(() => {
    if (!students.length) return;
    const idParam = searchParams.get('id');
    if (idParam) {
      const found = students.find(s => s.id === Number(idParam));
      if (found) setSelectedStudent(found);
    }
  }, [students, searchParams]);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.username.toLowerCase().includes(searchQuery.toLowerCase())
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
                {loading
                  ? (lang === 'tr' ? 'Yükleniyor...' : 'Loading...')
                  : lang === 'tr'
                    ? `${students.length} aktif öğrenci`
                    : `${students.length} active students`}
              </p>
            </div>
          </div>
          <button className="bg-white/5 rounded-xl p-2.5 hover:bg-white/10 transition-colors active:scale-95">
            <span className="material-symbols-outlined text-white text-2xl">person_add</span>
          </button>
        </div>

        {/* Search */}
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

      {/* List */}
      <div className="px-4 py-4 max-w-2xl mx-auto flex flex-col gap-3">
        {loading && (
          <div className="flex justify-center py-16">
            <span className="material-symbols-outlined text-white/20 text-4xl animate-spin">progress_activity</span>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-white/30">
            <span className="material-symbols-outlined text-4xl block mb-2">
              {searchQuery ? 'search_off' : 'group_off'}
            </span>
            <p className="text-sm">
              {searchQuery
                ? (lang === 'tr' ? 'Öğrenci bulunamadı' : 'No students found')
                : (lang === 'tr' ? 'Henüz öğrenci bağlanmamış' : 'No students connected yet')}
            </p>
          </div>
        )}

        {filtered.map(student => (
          <div
            key={student.id}
            onClick={() => setSelectedStudent(student)}
            className="bg-card-dark border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-primary/30 cursor-pointer transition-all active:scale-[0.98]"
          >
            <img
              src={student.avatar}
              alt={student.name}
              className="size-14 rounded-2xl object-cover border-2 border-white/10 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm">{student.name}</p>
              <p className="text-white/40 text-xs mt-0.5">@{student.username}</p>
              <p className="text-[10px] text-white/30 mt-1">
                {student.totalAssignments} {lang === 'tr' ? 'seans' : 'sessions'}
              </p>
            </div>
            <span className="material-symbols-outlined text-white/20 text-lg flex-shrink-0">chevron_right</span>
          </div>
        ))}
      </div>

      {/* Student detail modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center md:justify-center"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="w-full md:max-w-md md:mx-auto bg-card-dark rounded-t-3xl md:rounded-2xl p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-5 right-5 bg-white/5 rounded-full p-1.5 hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-white/60 text-xl">close</span>
            </button>

            <div className="flex flex-col items-center mb-5">
              <img
                src={selectedStudent.avatar}
                alt={selectedStudent.name}
                className="size-20 rounded-2xl border-2 border-primary/40 object-cover mb-3"
              />
              <h2 className="text-xl font-black text-white">{selectedStudent.name}</h2>
              <p className="text-white/40 text-sm mt-0.5">@{selectedStudent.username}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-background-dark rounded-2xl p-3 text-center border border-white/5">
                <p className="text-lg font-black text-white">{selectedStudent.totalAssignments ?? 0}</p>
                <p className="text-[10px] text-white/40 uppercase mt-0.5">
                  {lang === 'tr' ? 'Seans' : 'Sessions'}
                </p>
              </div>
              <div className="bg-background-dark rounded-2xl p-3 text-center border border-white/5">
                <p className="text-sm font-bold text-white truncate">{selectedStudent.email}</p>
                <p className="text-[10px] text-white/40 uppercase mt-0.5">E-posta</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setSelectedStudent(null); navigate('/messages'); }}
                className="flex-1 bg-primary text-white rounded-2xl py-3.5 font-black text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">chat_bubble</span>
                {lang === 'tr' ? 'Mesaj Gönder' : 'Send Message'}
              </button>
              <button
                onClick={() => { setSelectedStudent(null); navigate('/library'); }}
                className="flex-1 bg-white/5 border border-white/10 text-white rounded-2xl py-3.5 font-black text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                {lang === 'tr' ? 'Seans Ata' : 'Assign'}
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
