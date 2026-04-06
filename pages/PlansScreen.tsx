
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';
import { PLANS, PlanTier, getPlanDef, fetchActivePlan } from '../utils/plan';

interface PlansScreenProps {
  lang: 'tr' | 'en';
  role?: 'trainer' | 'student';
}

const planBorderColor: Record<PlanTier, string> = {
  free: 'border-white/10',
  bronze: 'border-amber-600/40',
  silver: 'border-slate-400/40',
  gold: 'border-yellow-400/40',
};
const planBgGlow: Record<PlanTier, string> = {
  free: '',
  bronze: 'shadow-amber-600/10',
  silver: 'shadow-slate-400/10',
  gold: 'shadow-yellow-400/20',
};
const planGradient: Record<PlanTier, string> = {
  free: 'from-slate-500/10 to-transparent',
  bronze: 'from-amber-600/15 to-transparent',
  silver: 'from-slate-400/15 to-transparent',
  gold: 'from-yellow-400/20 to-transparent',
};
const planTextColor: Record<PlanTier, string> = {
  free: 'text-slate-400',
  bronze: 'text-amber-500',
  silver: 'text-slate-300',
  gold: 'text-yellow-400',
};
const tierOrder: Record<PlanTier, number> = { free: 0, bronze: 1, silver: 2, gold: 3 };

const PlansScreen: React.FC<PlansScreenProps> = ({ lang, role = 'trainer' }) => {
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState<PlanTier>('free');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<PlanTier | null>(null);
  const [confirmPlan, setConfirmPlan] = useState<PlanTier | null>(null);
  const [successPlan, setSuccessPlan] = useState<PlanTier | null>(null);

  useEffect(() => {
    fetchActivePlan(role as 'trainer' | 'student').then(p => {
      setActivePlan(p);
      setLoading(false);
    });
  }, [role]);

  const handleSelectPlan = async (plan: PlanTier) => {
    if (role !== 'trainer') return;
    if (plan === activePlan) return;
    setConfirmPlan(plan);
  };

  const handleConfirm = async () => {
    if (!confirmPlan) return;
    setUpgrading(confirmPlan);
    setConfirmPlan(null);
    try {
      const token = localStorage.getItem('fittrack_token');
      const res = await fetch('/api/trainer/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: confirmPlan }),
      });
      if (res.ok) {
        setActivePlan(confirmPlan);
        setSuccessPlan(confirmPlan);
        localStorage.setItem('fittrack_trainer_plan', confirmPlan);
        setTimeout(() => setSuccessPlan(null), 3000);
      }
    } finally {
      setUpgrading(null);
    }
  };

  const currentDef = getPlanDef(activePlan);

  return (
    <div className="min-h-screen bg-background-dark pb-32 md:pb-0 md:pl-64">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background-dark/80 backdrop-blur-md border-b border-white/5 px-4 md:px-8 py-4">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-lg bg-white/5 text-white/60 hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-black text-white">{lang === 'tr' ? 'Koçluk Planları' : 'Coaching Plans'}</h1>
            {role !== 'trainer' && (
              <p className="text-xs text-white/40">{lang === 'tr' ? 'Antrenörünüzün planı sizin için de geçerlidir' : "Your trainer's plan also applies to you"}</p>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-3xl mx-auto flex flex-col gap-6">
        {/* Current plan banner */}
        {!loading && (
          <div className={`rounded-2xl bg-gradient-to-r ${planGradient[activePlan]} border ${planBorderColor[activePlan]} p-4 flex items-center gap-4`}>
            <div className={`size-12 rounded-xl bg-white/5 flex items-center justify-center`}>
              <span className={`material-symbols-outlined text-2xl ${planTextColor[activePlan]}`}>{currentDef.icon}</span>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{lang === 'tr' ? 'Aktif Plan' : 'Active Plan'}</p>
              <p className={`text-xl font-black ${planTextColor[activePlan]}`}>{currentDef.name}</p>
              {role !== 'trainer' && (
                <p className="text-xs text-white/30 mt-0.5">{lang === 'tr' ? 'Antrenörünüzün planından yararlanıyorsunuz' : "You benefit from your trainer's plan"}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-white/60">{currentDef.price[lang]}</p>
              <p className="text-[10px] text-white/30">{lang === 'tr' ? `${currentDef.maxStudents} öğrenci` : `${currentDef.maxStudents} students`}</p>
            </div>
          </div>
        )}

        {/* Success banner */}
        {successPlan && (
          <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-green-400">check_circle</span>
            <p className="text-sm font-bold text-green-400">
              {lang === 'tr' ? `${getPlanDef(successPlan).name} planına geçiş başarılı!` : `Successfully switched to ${getPlanDef(successPlan).name} plan!`}
            </p>
          </div>
        )}

        {/* Student info */}
        {role !== 'trainer' && (
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary mt-0.5">info</span>
            <p className="text-xs text-white/60 leading-relaxed">
              {lang === 'tr'
                ? 'Antrenörünüz plan yükselttiğinde, siz de otomatik olarak o planın tüm özelliklerinden yararlanırsınız. Plan yönetimi yalnızca antrenörlere aittir.'
                : "When your trainer upgrades their plan, you automatically benefit from all features of that plan. Plan management belongs to trainers only."}
            </p>
          </div>
        )}

        {/* Plan cards */}
        <div className="flex flex-col gap-4">
          {PLANS.filter(p => p.id !== 'free').map((plan) => {
            const isActive = plan.id === activePlan;
            const isUpgrade = tierOrder[plan.id] > tierOrder[activePlan];
            const isDowngrade = tierOrder[plan.id] < tierOrder[activePlan];
            const isLoading = upgrading === plan.id;

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border transition-all ${isActive
                  ? `${planBorderColor[plan.id]} bg-gradient-to-br ${planGradient[plan.id]} shadow-lg ${planBgGlow[plan.id]}`
                  : 'border-white/5 bg-card-dark'
                }`}
              >
                <div className="p-5">
                  {/* Plan header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-xl bg-white/5 flex items-center justify-center`}>
                        <span className={`material-symbols-outlined ${planTextColor[plan.id]}`}>{plan.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`text-lg font-black ${planTextColor[plan.id]}`}>{plan.name}</h3>
                          {isActive && (
                            <span className="text-[9px] font-black uppercase bg-white/10 text-white/60 px-2 py-0.5 rounded-full">{lang === 'tr' ? 'Aktif' : 'Active'}</span>
                          )}
                        </div>
                        <p className="text-xs text-white/40">{lang === 'tr' ? `Max ${plan.maxStudents} öğrenci` : `Max ${plan.maxStudents} students`}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-black ${planTextColor[plan.id]}`}>{plan.price[lang].split('/')[0]}</p>
                      <p className="text-[10px] text-white/30">/{lang === 'tr' ? 'ay' : 'mo'}</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-col gap-2 mb-4">
                    {plan.features.map(f => (
                      <div key={f.id} className="flex items-center gap-2.5">
                        <span className={`material-symbols-outlined text-base ${f.included ? planTextColor[plan.id] : 'text-white/20'}`}>
                          {f.included ? 'check_circle' : 'cancel'}
                        </span>
                        <span className={`text-xs ${f.included ? 'text-white/80' : 'text-white/25 line-through'}`}>{f.label[lang]}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA - only for trainers */}
                  {role === 'trainer' && (
                    <button
                      disabled={isActive || isLoading}
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`w-full py-3 rounded-xl font-black text-sm transition-all active:scale-95 ${
                        isActive
                          ? 'bg-white/5 text-white/40 cursor-default'
                          : isUpgrade
                          ? `bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-90 shadow-lg shadow-primary/20`
                          : 'bg-white/10 text-white/60 hover:bg-white/15'
                      }`}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {lang === 'tr' ? 'İşleniyor...' : 'Processing...'}
                        </span>
                      ) : isActive ? (
                        lang === 'tr' ? '✓ Aktif Plan' : '✓ Active Plan'
                      ) : isUpgrade ? (
                        lang === 'tr' ? `${plan.name}'e Yükselt` : `Upgrade to ${plan.name}`
                      ) : (
                        lang === 'tr' ? `${plan.name}'e Geç` : `Switch to ${plan.name}`
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Free plan info */}
        {role === 'trainer' && activePlan !== 'free' && (
          <button
            onClick={() => setConfirmPlan('free')}
            className="text-xs text-white/30 hover:text-white/50 text-center transition-colors"
          >
            {lang === 'tr' ? 'Ücretsiz plana dön' : 'Switch back to free plan'}
          </button>
        )}
      </main>

      {/* Confirm modal */}
      {confirmPlan && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center" onClick={() => setConfirmPlan(null)}>
          <div className="w-full max-w-lg bg-[#0f1923] border border-white/10 rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className={`size-14 rounded-2xl bg-white/5 flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-3xl ${planTextColor[confirmPlan]}`}>{getPlanDef(confirmPlan).icon}</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{getPlanDef(confirmPlan).name}</h3>
                <p className="text-sm text-white/40">{getPlanDef(confirmPlan).price[lang]}</p>
              </div>
            </div>
            <p className="text-sm text-white/60 mb-6 leading-relaxed">
              {confirmPlan === 'free'
                ? (lang === 'tr' ? 'Ücretsiz plana geçmek istediğinizden emin misiniz? Premium özelliklerinizi kaybedeceksiniz.' : 'Are you sure you want to switch to the free plan? You will lose your premium features.')
                : (lang === 'tr'
                  ? `${getPlanDef(confirmPlan).name} planına geçmek istediğinizden emin misiniz? Öğrencileriniz de bu planın özelliklerinden yararlanabilecek.`
                  : `Are you sure you want to switch to the ${getPlanDef(confirmPlan).name} plan? Your students will also benefit from this plan's features.`)
              }
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmPlan(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 font-bold text-sm">
                {lang === 'tr' ? 'İptal' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 py-3 rounded-xl font-black text-sm text-white bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 active:scale-95 transition-all`}
              >
                {lang === 'tr' ? 'Onayla' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav role={role} lang={lang} />
    </div>
  );
};

export default PlansScreen;
