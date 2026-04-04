import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';
import { io, Socket } from 'socket.io-client';

interface LiveSessionProps {
  lang: 'tr' | 'en';
  role?: 'trainer' | 'student';
}

interface Participant {
  socketId: string;
  userId: number;
  name: string;
  role: 'trainer' | 'student';
  progress: number;
  bpm: number;
  set: string;
  status: 'active' | 'resting' | 'done';
}

interface SessionState {
  sessionId: string;
  workoutName: string;
  currentMove: string;
  round: number;
  totalRounds: number;
  timerSeconds: number;
  isPlaying: boolean;
  participants: Participant[];
}

const LiveSession: React.FC<LiveSessionProps> = ({ lang, role = 'trainer' }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [session, setSession] = useState<SessionState | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [joinId, setJoinId] = useState('');
  const [newMove, setNewMove] = useState('');
  const [phase, setPhase] = useState<'lobby' | 'live'>('lobby');
  const [error, setError] = useState('');
  const [myStatus, setMyStatus] = useState<'active' | 'resting'>('active');
  const socketRef = useRef<Socket | null>(null);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('fittrack_user') || '{}'); } catch { return {}; }
  })();
  const userName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (lang === 'tr' ? 'Kullanıcı' : 'User');
  const userId = user.id || 0;

  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) return;
    const socket = io('/', { path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('session:joined', ({ session: s }) => {
      setSession(s);
      setPhase('live');
    });
    socket.on('session:updated', ({ session: s }) => setSession(s));
    socket.on('session:tick', ({ timerSeconds }) => {
      setSession(prev => prev ? { ...prev, timerSeconds } : prev);
    });
    socket.on('session:ended', () => {
      setPhase('lobby');
      setSession(null);
      setError(lang === 'tr' ? 'Seans sona erdi.' : 'Session ended.');
    });
    socket.on('session:error', ({ message }) => setError(message));
  }, [lang]);

  useEffect(() => {
    // Auto-join if sessionId in URL ?join=XXXX
    const autoJoin = searchParams.get('join');
    if (autoJoin) setJoinId(autoJoin);
    connectSocket();
    return () => { socketRef.current?.disconnect(); };
  }, [connectSocket, searchParams]);

  const handleCreateSession = () => {
    const id = Math.random().toString(36).slice(2, 8).toUpperCase();
    setSessionId(id);
    connectSocket();
    socketRef.current?.emit('session:create', {
      sessionId: id,
      userId,
      name: userName,
      workoutName: lang === 'tr' ? 'Seans' : 'Workout',
    });
  };

  const handleJoinSession = () => {
    const id = joinId.trim().toUpperCase();
    if (!id) return;
    connectSocket();
    socketRef.current?.emit('session:join', { sessionId: id, userId, name: userName, role });
  };

  const control = (action: string, payload?: any) => {
    socketRef.current?.emit('session:control', { sessionId: session?.sessionId, action, payload });
  };

  const updateStats = (bpm: number, progress: number) => {
    socketRef.current?.emit('session:updateStats', {
      sessionId: session?.sessionId,
      bpm, progress,
      set: '1/3',
      status: myStatus,
    });
  };

  const toggleStatus = () => {
    const next = myStatus === 'active' ? 'resting' : 'active';
    setMyStatus(next);
    socketRef.current?.emit('session:updateStats', {
      sessionId: session?.sessionId,
      status: next,
    });
  };

  const timerDisplay = session
    ? `${Math.floor(session.timerSeconds / 60).toString().padStart(2,'0')}:${(session.timerSeconds % 60).toString().padStart(2,'0')}`
    : '00:45';

  // ─── LOBBY ───────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <div className="h-screen flex flex-col bg-background-dark md:pl-64">
        <header className="flex items-center gap-3 p-4 border-b border-white/5 bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-[10px] font-bold text-primary/70 uppercase tracking-widest">Live Session</h1>
            <h2 className="text-sm font-bold">{lang === 'tr' ? 'Canlı Seans' : 'Live Session'}</h2>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 gap-6 pb-28">
          <div className="size-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary">sensors</span>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black">{lang === 'tr' ? 'Gerçek Zamanlı Seans' : 'Real-Time Session'}</h2>
            <p className="text-white/40 text-sm mt-1">{lang === 'tr' ? 'Seans oluştur veya mevcut seansa katıl' : 'Create or join a live session'}</p>
          </div>

          {error && (
            <div className="w-full max-w-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {role === 'trainer' && (
            <div className="w-full max-w-sm bg-card-dark border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
              <h3 className="font-black text-sm">{lang === 'tr' ? 'Yeni Seans Oluştur' : 'Create New Session'}</h3>
              <button
                onClick={handleCreateSession}
                className="w-full py-3 bg-primary rounded-xl text-white font-black text-sm hover:bg-primary/90 active:scale-95 transition-all"
              >
                {lang === 'tr' ? 'Seansı Başlat' : 'Start Session'}
              </button>
            </div>
          )}

          <div className="w-full max-w-sm bg-card-dark border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
            <h3 className="font-black text-sm">{lang === 'tr' ? 'Seansa Katıl' : 'Join Session'}</h3>
            <input
              type="text"
              value={joinId}
              onChange={e => setJoinId(e.target.value.toUpperCase())}
              placeholder={lang === 'tr' ? 'Seans Kodu (örn: ABC123)' : 'Session Code (e.g. ABC123)'}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold placeholder-white/20 focus:outline-none focus:border-primary/50 uppercase tracking-widest"
              maxLength={6}
            />
            <button
              onClick={handleJoinSession}
              disabled={joinId.length < 4}
              className="w-full py-3 bg-white/10 border border-white/10 rounded-xl text-white font-black text-sm hover:bg-white/15 active:scale-95 transition-all disabled:opacity-40"
            >
              {lang === 'tr' ? 'Katıl' : 'Join'}
            </button>
          </div>
        </main>
        <BottomNav role={role} lang={lang} />
      </div>
    );
  }

  // ─── LIVE SESSION ─────────────────────────────────────
  const participants = session?.participants ?? [];
  const isTrainer = role === 'trainer';

  return (
    <div className="h-screen flex flex-col bg-background-dark md:pl-64">
      <header className="flex items-center justify-between p-4 border-b border-white/5 bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => control('end')} className="size-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-[10px] font-bold text-primary/70 uppercase tracking-widest">Live Session</h1>
            <h2 className="text-sm font-bold">{session?.workoutName}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Share session code */}
          <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest">{session?.sessionId}</span>
          </div>
          <div className="bg-primary/20 border border-primary/30 px-3 py-1 rounded-full flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-primary text-[10px] font-black uppercase">{participants.length} {lang === 'tr' ? 'Aktif' : 'Active'}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-y-auto pb-48 md:pb-36 no-scrollbar max-w-5xl mx-auto w-full">
        {/* Timer */}
        <section className="p-4">
          <div className="relative w-full rounded-2xl overflow-hidden bg-card-dark border border-white/10 p-6 flex flex-col items-center gap-3">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
              {lang === 'tr' ? `Tur ${session?.round ?? 1} / ${session?.totalRounds ?? 4}` : `Round ${session?.round ?? 1} of ${session?.totalRounds ?? 4}`}
            </p>
            <div className="text-7xl font-black leading-none tracking-tighter text-primary">{timerDisplay}</div>
            {session?.currentMove && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">
                <p className="text-primary font-black text-sm uppercase tracking-widest">{session.currentMove}</p>
              </div>
            )}
            {/* Trainer-only: Set current move */}
            {isTrainer && (
              <div className="flex gap-2 w-full mt-2">
                <input
                  type="text"
                  value={newMove}
                  onChange={e => setNewMove(e.target.value)}
                  placeholder={lang === 'tr' ? 'Hareket adı...' : 'Move name...'}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                />
                <button
                  onClick={() => { control('nextMove', { move: newMove }); setNewMove(''); }}
                  className="px-4 py-2 bg-primary/20 border border-primary/30 rounded-xl text-primary text-sm font-bold hover:bg-primary/30 transition-colors"
                >
                  {lang === 'tr' ? 'Güncelle' : 'Set'}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Stats */}
        <section className="px-4 grid grid-cols-3 gap-3">
          {[
            { label: lang === 'tr' ? 'Katılımcı' : 'Participants', val: participants.length, icon: 'group' },
            { label: lang === 'tr' ? 'Aktif' : 'Active', val: participants.filter(p => p.status === 'active').length, icon: 'bolt' },
            { label: lang === 'tr' ? 'Dinleniyor' : 'Resting', val: participants.filter(p => p.status === 'resting').length, icon: 'self_improvement' },
          ].map((s, i) => (
            <div key={i} className="p-3 rounded-xl bg-card-dark border border-white/5 flex flex-col items-center gap-1 text-center">
              <span className="material-symbols-outlined text-primary text-sm">{s.icon}</span>
              <p className="text-[8px] text-white/40 uppercase font-bold">{s.label}</p>
              <p className="text-base font-black">{s.val}</p>
            </div>
          ))}
        </section>

        {/* Participants */}
        <section className="p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-3">{lang === 'tr' ? 'Katılımcılar' : 'Participants'}</h3>
          {participants.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">{lang === 'tr' ? 'Henüz katılımcı yok' : 'No participants yet'}</p>
          ) : (
            participants.map((p, i) => (
              <div key={p.socketId} className={`flex items-center gap-3 p-3 rounded-xl border ${i === 0 ? 'border-primary/20 bg-primary/5' : 'border-white/5 bg-card-dark'}`}>
                <div className="size-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-sm shrink-0">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-[11px] truncate">{p.name}</p>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${p.status === 'resting' ? 'text-blue-400' : 'text-green-400'}`}>
                      {p.status === 'resting' ? (lang === 'tr' ? 'Dinleniyor' : 'Resting') : (lang === 'tr' ? 'Aktif' : 'Active')}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${p.progress}%` }}></div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-bold text-primary">{p.set}</p>
                  <p className="text-[8px] text-white/30">{p.bpm > 0 ? `${p.bpm} BPM` : '—'}</p>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {/* Control Footer */}
      <footer className="fixed bottom-0 left-0 md:left-64 right-0 bg-card-dark/95 backdrop-blur-xl border-t border-primary/20 p-4 shadow-2xl">
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-3">
          {isTrainer ? (
            <>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => control(session?.isPlaying ? 'pause' : 'play')}
                  className="flex-1 h-12 rounded-xl bg-primary text-white font-black flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined">{session?.isPlaying ? 'pause' : 'play_arrow'}</span>
                  {session?.isPlaying ? (lang === 'tr' ? 'Durdur' : 'Pause') : (lang === 'tr' ? 'Başlat' : 'Start')}
                </button>
                <button
                  onClick={() => control('nextRound')}
                  className="px-5 h-12 rounded-xl bg-white/10 border border-white/10 text-white font-black flex items-center justify-center gap-2 hover:bg-white/15 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined">skip_next</span>
                </button>
              </div>
              <button
                onClick={() => control('end')}
                className="w-full h-10 rounded-xl border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/10 active:scale-95 transition-all"
              >
                {lang === 'tr' ? 'Seansı Bitir' : 'End Session'}
              </button>
            </>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={toggleStatus}
                className={`flex-1 h-12 rounded-xl border font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all ${myStatus === 'active' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}
              >
                <span className="material-symbols-outlined text-base">{myStatus === 'active' ? 'self_improvement' : 'bolt'}</span>
                {myStatus === 'active' ? (lang === 'tr' ? 'Dinleniyorum' : 'Resting') : (lang === 'tr' ? 'Aktifim' : 'Active')}
              </button>
              <button
                onClick={() => updateStats(Math.floor(120 + Math.random() * 40), Math.floor(Math.random() * 100))}
                className="px-5 h-12 rounded-xl bg-primary/10 border border-primary/30 text-primary font-black text-sm hover:bg-primary/20 active:scale-95 transition-all"
              >
                {lang === 'tr' ? 'Güncelle' : 'Update'}
              </button>
            </div>
          )}
        </div>
      </footer>

      <BottomNav role={role} lang={lang} />
    </div>
  );
};

export default LiveSession;
