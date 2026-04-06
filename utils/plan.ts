export type PlanTier = 'free' | 'bronze' | 'silver' | 'gold';

export interface PlanDefinition {
  id: PlanTier;
  name: string;
  price: { tr: string; en: string };
  maxStudents: number;
  color: string;
  icon: string;
  features: { id: string; label: { tr: string; en: string }; included: boolean }[];
}

export const PLANS: PlanDefinition[] = [
  {
    id: 'free',
    name: 'Free',
    price: { tr: 'Ücretsiz', en: 'Free' },
    maxStudents: 3,
    color: 'text-slate-400',
    icon: 'person',
    features: [
      { id: 'student_management', label: { tr: 'Öğrenci Yönetimi (3 öğrenci)', en: 'Student Management (3 students)' }, included: true },
      { id: 'session_assignment', label: { tr: 'Seans Atama', en: 'Session Assignment' }, included: true },
      { id: 'notes', label: { tr: 'Not Alma', en: 'Notes' }, included: true },
      { id: 'exercise_animations', label: { tr: 'Egzersiz Animasyonları', en: 'Exercise Animations' }, included: false },
      { id: 'ai_analysis', label: { tr: 'AI Performans Analizi', en: 'AI Performance Analysis' }, included: false },
      { id: 'nutrition_logs', label: { tr: 'Beslenme Takibi', en: 'Nutrition Logs' }, included: false },
    ]
  },
  {
    id: 'bronze',
    name: 'Bronze',
    price: { tr: '249 TL/ay', en: '249 TL/mo' },
    maxStudents: 6,
    color: 'text-amber-600',
    icon: 'military_tech',
    features: [
      { id: 'student_management', label: { tr: 'Öğrenci Yönetimi (6 öğrenci)', en: 'Student Management (6 students)' }, included: true },
      { id: 'session_assignment', label: { tr: 'Seans Atama', en: 'Session Assignment' }, included: true },
      { id: 'notes', label: { tr: 'Not Alma', en: 'Notes' }, included: true },
      { id: 'exercise_animations', label: { tr: 'Egzersiz Animasyonları', en: 'Exercise Animations' }, included: false },
      { id: 'ai_analysis', label: { tr: 'AI Performans Analizi', en: 'AI Performance Analysis' }, included: false },
      { id: 'nutrition_logs', label: { tr: 'Beslenme Takibi', en: 'Nutrition Logs' }, included: false },
    ]
  },
  {
    id: 'silver',
    name: 'Silver',
    price: { tr: '349 TL/ay', en: '349 TL/mo' },
    maxStudents: 15,
    color: 'text-slate-300',
    icon: 'workspace_premium',
    features: [
      { id: 'student_management', label: { tr: 'Öğrenci Yönetimi (15 öğrenci)', en: 'Student Management (15 students)' }, included: true },
      { id: 'session_assignment', label: { tr: 'Seans Atama', en: 'Session Assignment' }, included: true },
      { id: 'notes', label: { tr: 'Not Alma', en: 'Notes' }, included: true },
      { id: 'exercise_animations', label: { tr: 'Egzersiz Animasyonları', en: 'Exercise Animations' }, included: true },
      { id: 'ai_analysis', label: { tr: 'AI Performans Analizi', en: 'AI Performance Analysis' }, included: false },
      { id: 'nutrition_logs', label: { tr: 'Beslenme Takibi', en: 'Nutrition Logs' }, included: false },
    ]
  },
  {
    id: 'gold',
    name: 'Gold',
    price: { tr: '449 TL/ay', en: '449 TL/mo' },
    maxStudents: 25,
    color: 'text-yellow-400',
    icon: 'emoji_events',
    features: [
      { id: 'student_management', label: { tr: 'Öğrenci Yönetimi (25 öğrenci)', en: 'Student Management (25 students)' }, included: true },
      { id: 'session_assignment', label: { tr: 'Seans Atama', en: 'Session Assignment' }, included: true },
      { id: 'notes', label: { tr: 'Not Alma', en: 'Notes' }, included: true },
      { id: 'exercise_animations', label: { tr: 'Egzersiz Animasyonları', en: 'Exercise Animations' }, included: true },
      { id: 'ai_analysis', label: { tr: 'AI Performans Analizi', en: 'AI Performance Analysis' }, included: true },
      { id: 'nutrition_logs', label: { tr: 'Beslenme Takibi', en: 'Nutrition Logs' }, included: true },
    ]
  },
];

export const getPlanDef = (tier: PlanTier): PlanDefinition => PLANS.find(p => p.id === tier) || PLANS[0];

export const hasFeature = (plan: PlanTier, featureId: string): boolean => {
  const def = getPlanDef(plan);
  return def.features.find(f => f.id === featureId)?.included ?? false;
};

// Fetch active plan (trainer: own plan; student: their trainer's plan)
export const fetchActivePlan = async (role: 'trainer' | 'student'): Promise<PlanTier> => {
  try {
    const token = localStorage.getItem('fittrack_token');
    if (!token) return 'free';
    const endpoint = role === 'trainer' ? '/api/trainer/plan' : '/api/student/trainer-plan';
    const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return 'free';
    const data = await res.json();
    return (data.plan as PlanTier) || 'free';
  } catch { return 'free'; }
};
