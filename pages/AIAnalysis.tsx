import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';

interface AIAnalysisProps {
  lang: 'tr' | 'en';
  role?: 'trainer' | 'student';
}

interface Keypoint {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

interface Finding {
  title: string;
  desc: string;
  metric: string;
  target: string;
  severity: 'ok' | 'warn' | 'error';
}

// MoveNet keypoint connections for skeleton drawing
const CONNECTIONS: [number, number][] = [
  [0,1],[0,2],[1,3],[2,4],         // head
  [5,6],                             // shoulders
  [5,7],[7,9],[6,8],[8,10],         // arms
  [5,11],[6,12],[11,12],            // torso
  [11,13],[13,15],[12,14],[14,16],  // legs
];

const KP_NAMES = ['nose','left_eye','right_eye','left_ear','right_ear','left_shoulder','right_shoulder','left_elbow','right_elbow','left_wrist','right_wrist','left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle'];

function calcAngleDeg(a: Keypoint, b: Keypoint): number {
  return Math.abs(Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI));
}

function analyzePosture(kps: Keypoint[], lang: 'tr' | 'en'): Finding[] {
  const findings: Finding[] = [];
  const getKp = (name: string) => kps[KP_NAMES.indexOf(name)];

  const ls = getKp('left_shoulder');
  const rs = getKp('right_shoulder');
  const lh = getKp('left_hip');
  const rh = getKp('right_hip');

  if (ls && rs && (ls.score ?? 0) > 0.3 && (rs.score ?? 0) > 0.3) {
    const shoulderTilt = Math.abs(ls.y - rs.y) / Math.abs(ls.x - rs.x) * 100;
    const deg = Math.round(calcAngleDeg(ls, rs) % 20);
    findings.push({
      title: lang === 'tr' ? 'Omuz Dengesi' : 'Shoulder Balance',
      desc: deg > 5
        ? (lang === 'tr' ? 'Omuzlar arasında eğim tespit edildi. Dengeli yükleme önerilir.' : 'Shoulder tilt detected. Balanced loading recommended.')
        : (lang === 'tr' ? 'Omuzlar dengeli görünüyor.' : 'Shoulders appear balanced.'),
      metric: `${Math.round(shoulderTilt)}°`,
      target: '< 5°',
      severity: deg > 8 ? 'error' : deg > 4 ? 'warn' : 'ok',
    });
  }

  if (lh && rh && (lh.score ?? 0) > 0.3 && (rh.score ?? 0) > 0.3) {
    const hipTilt = Math.abs(lh.y - rh.y) / Math.abs(lh.x - rh.x) * 100;
    const deg = Math.round(hipTilt);
    findings.push({
      title: lang === 'tr' ? 'Pelvik Denge' : 'Pelvic Balance',
      desc: deg > 5
        ? (lang === 'tr' ? 'Pelvis eğimi tespit edildi. Core güçlendirme önerilir.' : 'Pelvic tilt detected. Core strengthening recommended.')
        : (lang === 'tr' ? 'Pelvis dengeli görünüyor.' : 'Pelvis appears balanced.'),
      metric: `${deg}°`,
      target: '< 5°',
      severity: deg > 10 ? 'error' : deg > 5 ? 'warn' : 'ok',
    });
  }

  if (ls && lh && (ls.score ?? 0) > 0.3 && (lh.score ?? 0) > 0.3) {
    const spineAngle = Math.abs(calcAngleDeg(ls, lh) - 90);
    findings.push({
      title: lang === 'tr' ? 'Omurga Hizası' : 'Spine Alignment',
      desc: spineAngle > 10
        ? (lang === 'tr' ? 'Omurga lateral eğim gösteriyor. Duruş düzeltme egzersizleri önerilir.' : 'Lateral spinal deviation detected. Posture correction exercises recommended.')
        : (lang === 'tr' ? 'Omurga hizası iyi görünüyor.' : 'Spine alignment looks good.'),
      metric: `${Math.round(spineAngle)}°`,
      target: '< 10°',
      severity: spineAngle > 15 ? 'error' : spineAngle > 10 ? 'warn' : 'ok',
    });
  }

  return findings;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ lang, role = 'student' }) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const detectorRef = useRef<any>(null);

  const [camActive, setCamActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [error, setError] = useState('');
  const [fps, setFps] = useState(0);
  const lastTimeRef = useRef(0);

  const drawSkeleton = useCallback((kps: Keypoint[], ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);

    // Connections
    ctx.strokeStyle = '#007AFF';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    CONNECTIONS.forEach(([i, j]) => {
      const a = kps[i], b = kps[j];
      if (!a || !b || (a.score ?? 0) < 0.3 || (b.score ?? 0) < 0.3) return;
      ctx.beginPath();
      ctx.moveTo(a.x * w, a.y * h);
      ctx.lineTo(b.x * w, b.y * h);
      ctx.stroke();
    });

    // Keypoints
    ctx.globalAlpha = 1;
    kps.forEach(kp => {
      if ((kp.score ?? 0) < 0.3) return;
      ctx.beginPath();
      ctx.arc(kp.x * w, kp.y * h, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#007AFF';
      ctx.fill();
    });
  }, []);

  const detect = useCallback(async () => {
    const detector = detectorRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!detector || !video || !canvas || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    try {
      const poses = await detector.estimatePoses(video);
      if (poses.length > 0) {
        const kps = poses[0].keypoints.map((kp: any) => ({
          x: kp.x / video.videoWidth,
          y: kp.y / video.videoHeight,
          score: kp.score,
          name: kp.name,
        }));
        drawSkeleton(kps, ctx, w, h);

        // Update findings every 30 frames
        const now = performance.now();
        const elapsed = now - lastTimeRef.current;
        setFps(Math.round(1000 / elapsed));
        lastTimeRef.current = now;
        if (Math.random() < 0.05) { // ~5% of frames = ~1-2x per second
          setFindings(analyzePosture(kps, lang));
        }
      }
    } catch { /* ignore frame errors */ }

    animFrameRef.current = requestAnimationFrame(detect);
  }, [drawSkeleton, lang]);

  const startCamera = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Lazy-load TF.js to avoid blocking initial render
      const [tfjs, poseDetection] = await Promise.all([
        import('@tensorflow/tfjs-backend-webgl'),
        import('@tensorflow-models/pose-detection'),
      ]);
      await (tfjs as any).setBackend?.('webgl').catch(() => {});

      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: (poseDetection as any).movenet?.modelType?.SINGLEPOSE_LIGHTNING ?? 'SinglePose.Lightning' }
      );
      detectorRef.current = detector;
      setCamActive(true);
      setLoading(false);
      animFrameRef.current = requestAnimationFrame(detect);
    } catch (e: any) {
      setError(lang === 'tr' ? 'Kamera erişimi reddedildi veya model yüklenemedi.' : 'Camera access denied or model failed to load.');
      setLoading(false);
    }
  }, [detect, lang]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
    detectorRef.current = null;
    setCamActive(false);
    setFindings([]);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const severityColor = (s: Finding['severity']) =>
    s === 'ok' ? 'text-green-400 border-green-500/30 bg-green-500/10' :
    s === 'warn' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
    'text-red-400 border-red-500/30 bg-red-500/10';

  const severityLabel = (s: Finding['severity']) =>
    s === 'ok' ? (lang === 'tr' ? 'İyi' : 'Good') :
    s === 'warn' ? (lang === 'tr' ? 'Orta' : 'Moderate') :
    (lang === 'tr' ? 'Düzelt' : 'Fix');

  return (
    <div className="h-screen flex flex-col bg-background-dark md:pl-64">
      <header className="sticky top-0 z-10 bg-background-dark/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-[8px] font-black tracking-[0.3em] text-white/30 uppercase leading-none mb-1">PTBoard</h1>
            <p className="text-sm font-black uppercase italic">{lang === 'tr' ? 'AI Form Analizi' : 'AI Form Analysis'}</p>
          </div>
        </div>
        {camActive && (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-primary text-[10px] font-black">{fps} FPS</span>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto pb-44 md:pb-32 no-scrollbar max-w-3xl mx-auto w-full">
        {/* Camera / Skeleton View */}
        <section className="p-4">
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-primary/20 shadow-2xl bg-black">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full"
              style={{ transform: 'scaleX(-1)' }}
            />

            {!camActive && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60">
                <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-primary">videocam</span>
                </div>
                <p className="text-white/60 text-sm text-center px-8">
                  {lang === 'tr' ? 'Kamera açılınca MoveNet ile gerçek zamanlı poz analizi başlar' : 'Real-time pose analysis with MoveNet starts when camera is on'}
                </p>
                {error && <p className="text-red-400 text-xs text-center px-8">{error}</p>}
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                <p className="text-white/60 text-xs">{lang === 'tr' ? 'Model yükleniyor...' : 'Loading model...'}</p>
              </div>
            )}

            {camActive && (
              <div className="absolute top-3 left-3 bg-background-dark/80 backdrop-blur px-3 py-1.5 rounded-lg border border-primary/20 text-[9px] font-black text-primary flex items-center gap-2 uppercase tracking-widest">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                {lang === 'tr' ? 'AI Canlı Analiz' : 'AI Live Analysis'}
              </div>
            )}
          </div>
        </section>

        {/* Controls */}
        <section className="px-4">
          <button
            onClick={camActive ? stopCamera : startCamera}
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all ${
              camActive
                ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                : 'bg-primary text-white hover:bg-primary/90'
            } disabled:opacity-50`}
          >
            <span className="material-symbols-outlined text-base">{camActive ? 'videocam_off' : 'videocam'}</span>
            {loading ? (lang === 'tr' ? 'Yükleniyor...' : 'Loading...') :
              camActive ? (lang === 'tr' ? 'Kamerayı Kapat' : 'Stop Camera') :
              (lang === 'tr' ? 'Kamerayı Aç & Analizi Başlat' : 'Start Camera & Analysis')}
          </button>
        </section>

        {/* Diagnostic Findings */}
        <section className="px-4 mt-5 space-y-3 pb-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/60">
            {lang === 'tr' ? 'Tanı Bulguları' : 'Diagnostic Findings'}
          </h3>

          {findings.length === 0 && (
            <div className="bg-card-dark border border-white/5 rounded-2xl p-6 text-center">
              <span className="material-symbols-outlined text-3xl text-white/20 mb-2 block">analytics</span>
              <p className="text-white/30 text-sm">
                {camActive
                  ? (lang === 'tr' ? 'Poz tespit ediliyor...' : 'Detecting pose...')
                  : (lang === 'tr' ? 'Analiz başlatmak için kamerayı açın' : 'Start camera to begin analysis')}
              </p>
            </div>
          )}

          {findings.map((f, i) => (
            <div key={i} className="bg-card-dark border border-white/10 rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-base ${f.severity === 'ok' ? 'text-green-400' : f.severity === 'warn' ? 'text-yellow-400' : 'text-red-400'}`}>
                    {f.severity === 'ok' ? 'check_circle' : f.severity === 'warn' ? 'warning' : 'error'}
                  </span>
                  <h4 className="font-bold text-white text-sm">{f.title}</h4>
                </div>
                <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded border ${severityColor(f.severity)}`}>
                  {severityLabel(f.severity)}
                </span>
              </div>
              <p className="text-[11px] text-white/40 mb-3 leading-relaxed">{f.desc}</p>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-background-dark rounded border border-primary/30 text-primary text-[10px] font-black">
                  {lang === 'tr' ? 'Metrik' : 'Metric'}: {f.metric}
                </div>
                <div className="px-3 py-1 bg-background-dark rounded border border-white/5 text-white/30 text-[10px] font-black">
                  {lang === 'tr' ? 'Hedef' : 'Target'}: {f.target}
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>

      <BottomNav role={role} lang={lang} />
    </div>
  );
};

export default AIAnalysis;
