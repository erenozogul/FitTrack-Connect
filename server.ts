import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { createServer as createViteServer } from "vite";
import apiApp from "./api/index";
import path from "path";

// ─── Live Session State ───────────────────────────────
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
interface LiveSession {
  sessionId: string;
  trainerId: number;
  workoutName: string;
  currentMove: string;
  round: number;
  totalRounds: number;
  timerSeconds: number;
  isPlaying: boolean;
  participants: Map<string, Participant>;
  timerInterval?: ReturnType<typeof setInterval>;
}

const sessions = new Map<string, LiveSession>();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });
  const PORT = 3000;

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Mount the API routes
  app.use(apiApp);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  // ─── Socket.IO Live Session Logic ─────────────────────
  io.on('connection', (socket) => {

    // Trainer creates a session
    socket.on('session:create', ({ sessionId, userId, name, workoutName }) => {
      const session: LiveSession = {
        sessionId,
        trainerId: userId,
        workoutName,
        currentMove: '',
        round: 1,
        totalRounds: 4,
        timerSeconds: 45,
        isPlaying: false,
        participants: new Map(),
      };
      sessions.set(sessionId, session);
      socket.join(sessionId);
      session.participants.set(socket.id, {
        socketId: socket.id, userId, name, role: 'trainer',
        progress: 0, bpm: 0, set: '0/0', status: 'active',
      });
      socket.emit('session:joined', { session: serializeSession(session) });
    });

    // Student or trainer joins existing session
    socket.on('session:join', ({ sessionId, userId, name, role }) => {
      const session = sessions.get(sessionId);
      if (!session) { socket.emit('session:error', { message: 'Session not found' }); return; }
      socket.join(sessionId);
      session.participants.set(socket.id, {
        socketId: socket.id, userId, name, role,
        progress: 0, bpm: 0, set: '1/3', status: 'active',
      });
      socket.emit('session:joined', { session: serializeSession(session) });
      io.to(sessionId).emit('session:updated', { session: serializeSession(session) });
    });

    // Trainer controls: play/pause, next move, change round
    socket.on('session:control', ({ sessionId, action, payload }) => {
      const session = sessions.get(sessionId);
      if (!session) return;
      if (action === 'play') {
        session.isPlaying = true;
        session.timerInterval = setInterval(() => {
          if (session.timerSeconds > 0) {
            session.timerSeconds--;
          } else {
            session.timerSeconds = 45;
          }
          io.to(sessionId).emit('session:tick', { timerSeconds: session.timerSeconds });
        }, 1000);
      } else if (action === 'pause') {
        session.isPlaying = false;
        if (session.timerInterval) clearInterval(session.timerInterval);
      } else if (action === 'nextMove') {
        session.currentMove = payload.move || '';
        session.timerSeconds = 45;
      } else if (action === 'nextRound') {
        session.round = Math.min(session.round + 1, session.totalRounds);
      } else if (action === 'end') {
        if (session.timerInterval) clearInterval(session.timerInterval);
        io.to(sessionId).emit('session:ended', {});
        sessions.delete(sessionId);
        return;
      }
      io.to(sessionId).emit('session:updated', { session: serializeSession(session) });
    });

    // Participant updates their own stats
    socket.on('session:updateStats', ({ sessionId, bpm, progress, set, status }) => {
      const session = sessions.get(sessionId);
      if (!session) return;
      const p = session.participants.get(socket.id);
      if (!p) return;
      if (bpm !== undefined) p.bpm = bpm;
      if (progress !== undefined) p.progress = progress;
      if (set !== undefined) p.set = set;
      if (status !== undefined) p.status = status;
      io.to(sessionId).emit('session:updated', { session: serializeSession(session) });
    });

    socket.on('disconnect', () => {
      sessions.forEach((session, sessionId) => {
        if (session.participants.has(socket.id)) {
          session.participants.delete(socket.id);
          if (session.participants.size === 0) {
            if (session.timerInterval) clearInterval(session.timerInterval);
            sessions.delete(sessionId);
          } else {
            io.to(sessionId).emit('session:updated', { session: serializeSession(session) });
          }
        }
      });
    });
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

function serializeSession(s: LiveSession) {
  return {
    sessionId: s.sessionId,
    trainerId: s.trainerId,
    workoutName: s.workoutName,
    currentMove: s.currentMove,
    round: s.round,
    totalRounds: s.totalRounds,
    timerSeconds: s.timerSeconds,
    isPlaying: s.isPlaying,
    participants: Array.from(s.participants.values()),
  };
}

startServer();
