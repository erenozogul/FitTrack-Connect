
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';

interface PlansScreenProps {
  lang: 'tr' | 'en';
}

const PlansScreen: React.FC<PlansScreenProps> = ({ lang }) => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Bronze',
      price: '249 TL',
      capacity: '6 Students',
      progress: '25%',
      features: ['Core Management Tools', 'Student Progress Tracking', 'Standard Support'],
      cta: lang === 'tr' ? 'Bronze Seç' : 'Choose Bronze'
    },
    {
      name: 'Silver',
      price: '249 TL',
      capacity: '15 Students',
      progress: '50%',
      features: ['Enhanced Management Suite', 'Custom Workout Builder', 'Priority Email Support', 'Best Capacity Value'],
      cta: lang === 'tr' ? 'Silver Seç' : 'Choose Silver',
      bestValue: true
    },
    {
      name: 'Gold',
      price: '449 TL',
      capacity: '25 Students',
      progress: '100%',
      features: ['Full Management Suite', 'AI Performance Analysis', '24/7 VIP Support', 'Client Nutrition Logs'],
      cta: lang === 'tr' ? 'Gold Seç' : 'Choose Gold',
      isPremium: true
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-background-dark pb-32 md:pb-0 md:pl-64 transition-colors">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
            <span className="material-symbols-outlined text-slate-900 dark:text-white">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{lang === 'tr' ? 'Koçluk Planları' : 'Coaching Plans'}</h1>
        </div>
        {/* Removed "Hoca Öder" badge from here */}
      </header>

      <main className="px-6 py-8">
        <section className="text-center mb-12">
          <h2 className="text-3xl font-extrabold mb-4 tracking-tighter text-slate-900 dark:text-white">{lang === 'tr' ? 'Kapasite Seçin' : 'Select Capacity'}</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
            {lang === 'tr' ? 'Mevcut listenize uyan bir plan seçin. Öğrenci kitleniz büyüdükçe ölçeklendirin.' : 'Choose a plan that fits your current roster. Scale up as your student base grows.'} 
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`flex flex-col rounded-xl border ${plan.bestValue ? 'border-primary' : 'border-slate-200 dark:border-white/5'} bg-slate-50 dark:bg-card-dark p-6 transition-transform hover:scale-[1.02] relative overflow-hidden shadow-sm`}
            >
              {plan.bestValue && (
                <div className="absolute top-4 right-4">
                  <span className="bg-primary text-white dark:text-background-dark text-[10px] font-black uppercase px-2 py-1 rounded">Best Value</span>
                </div>
              )}
              {plan.isPremium && (
                <div className="absolute -right-10 top-5 rotate-45 bg-primary text-white dark:text-background-dark text-[8px] font-black uppercase px-12 py-1 shadow-lg">
                  Premium AI
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-sm font-bold uppercase tracking-widest mb-1 ${plan.bestValue ? 'text-primary' : 'text-slate-400'}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                  <span className="text-slate-400 text-xs font-medium">/month</span>
                </div>
              </div>

              <div className="mb-8 p-4 rounded-lg bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Capacity</span>
                  <span className="text-[10px] font-bold text-slate-900 dark:text-white">{plan.capacity}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-1 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: plan.progress }}></div>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className={`flex items-center gap-3 text-xs ${i === 1 && plan.isPremium ? 'text-slate-900 dark:text-white font-bold italic' : 'text-slate-600 dark:text-slate-300'}`}>
                    <span className="material-symbols-outlined text-primary text-lg">
                      {feature.includes('AI') ? 'psychology' : 'check_circle'}
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => navigate('/checkout')}
                className="w-full py-3 px-4 rounded-lg bg-white hover:brightness-110 text-[#0B2B53] font-bold transition-all shadow-lg shadow-cta-orange/20 active:scale-95"
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </main>

      <BottomNav role="trainer" lang={lang} />
    </div>
  );
};

export default PlansScreen;
