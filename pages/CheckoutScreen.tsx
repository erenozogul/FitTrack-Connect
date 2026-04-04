
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { translations } from '../App';

interface CheckoutScreenProps {
  lang: 'tr' | 'en';
}

// Plan definitions
const PLANS: Record<string, { name: string; amount: number; students: number }> = {
  bronze:  { name: 'Bronze',  amount: 14900, students: 6  },
  silver:  { name: 'Silver',  amount: 24900, students: 15 },
  gold:    { name: 'Gold',    amount: 44900, students: 25 },
};

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ lang }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const t = translations[lang];
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [payError, setPayError] = useState('');

  const planId = searchParams.get('plan') || 'silver';
  const plan = PLANS[planId] || PLANS.silver;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setPayError('');
    const token = localStorage.getItem('fittrack_token');
    try {
      // Step 1: Create payment intent on server
      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ planId, amount: plan.amount }),
      });
      const data = await res.json();

      if (res.status === 503) {
        // Stripe not configured — demo mode
        setIsProcessing(false);
        setPayError(lang === 'tr'
          ? 'Stripe yapılandırılmamış. Demo: .env dosyasına STRIPE_SECRET_KEY ekleyin.'
          : 'Stripe not configured. Demo: Add STRIPE_SECRET_KEY to .env file.');
        return;
      }

      if (!res.ok) throw new Error(data.message || 'Payment error');

      // Step 2: Confirm with Stripe.js
      const { loadStripe } = await import('@stripe/stripe-js');
      const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
      if (!stripePublicKey) throw new Error('VITE_STRIPE_PUBLIC_KEY not set');
      const stripe = await loadStripe(stripePublicKey);
      if (!stripe) throw new Error('Stripe failed to load');

      const form = e.target as HTMLFormElement;
      const cardNumber = (form.querySelector('[name=cardNumber]') as HTMLInputElement)?.value?.replace(/\s/g,'');
      const expiry = (form.querySelector('[name=expiry]') as HTMLInputElement)?.value?.split('/');

      const { error } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: { token: 'tok_visa' } as any, // In production, use Stripe Elements
          billing_details: { name: cardNumber || 'Card' },
        },
      });

      if (error) throw new Error(error.message);

      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => navigate('/library'), 2000);
    } catch (err: any) {
      setIsProcessing(false);
      setPayError(err.message || (lang === 'tr' ? 'Ödeme başarısız.' : 'Payment failed.'));
    }
  };

  if (isSuccess) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-background-dark p-8 text-center transition-colors">
        <div className="size-24 rounded-full bg-green-500 flex items-center justify-center text-white mb-6 shadow-xl shadow-green-500/20 animate-bounce">
          <span className="material-symbols-outlined text-5xl font-black">check</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Payment Successful!</h2>
        <p className="text-slate-500 dark:text-white/40 mt-2 font-medium">Redirecting to your library...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-background-dark transition-colors pb-10">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-100 dark:border-white/5 px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-900 dark:text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t.checkout}</h1>
      </header>

      <main className="p-6 md:mt-12 space-y-8 max-w-md mx-auto">
        {/* Virtual Card Visualization */}
        <div className="relative aspect-[1.6/1] w-full rounded-2xl bg-gradient-to-br from-primary to-blue-800 p-6 text-white shadow-2xl overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-700">
             <span className="material-symbols-outlined text-[120px]">bolt</span>
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <span className="text-lg font-black italic tracking-tighter opacity-80">PTBoard</span>
              <div className="flex gap-1">
                <div className="size-8 rounded-full bg-red-500/80"></div>
                <div className="size-8 rounded-full bg-yellow-500/80 -ml-4"></div>
              </div>
            </div>
            <div>
              <p className="text-xl font-mono tracking-[0.2em] mb-4">•••• •••• •••• 4242</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] uppercase font-bold opacity-60 mb-1">{t.cardHolder}</p>
                  <p className="text-sm font-bold uppercase tracking-widest">COACH MIKE</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold opacity-60 mb-1">{t.expiryDate}</p>
                  <p className="text-sm font-bold">12 / 26</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Pay Options */}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 bg-slate-900 text-white h-12 rounded-xl font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-xl">apple</span> Apple Pay
          </button>
          <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-900 h-12 rounded-xl font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all">
             <img src="https://www.gstatic.com/images/branding/googlelogo/svg/googlelogo_clr_74x24px.svg" alt="G" className="h-4" /> Pay
          </button>
        </div>

        <div className="relative">
           <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-white/5"></div></div>
           <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-background-dark px-2 text-slate-400 font-bold">{lang === 'tr' ? 'VEYA KART İLE' : 'OR WITH CARD'}</span></div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handlePay} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase ml-1">{t.cardNumber}</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">credit_card</span>
              <input 
                required
                className="w-full bg-slate-50 dark:bg-card-dark border border-slate-200 dark:border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-primary focus:border-primary transition-all text-slate-900 dark:text-white"
                placeholder="4242 4242 4242 4242"
                name="cardNumber"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase ml-1">{t.expiryDate}</label>
              <input 
                required
                className="w-full bg-slate-50 dark:bg-card-dark border border-slate-200 dark:border-white/10 rounded-xl py-4 px-4 text-sm focus:ring-primary focus:border-primary transition-all text-slate-900 dark:text-white"
                placeholder="MM / YY"
                name="expiry"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase ml-1">{t.cvv}</label>
              <input 
                required
                className="w-full bg-slate-50 dark:bg-card-dark border border-slate-200 dark:border-white/10 rounded-xl py-4 px-4 text-sm focus:ring-primary focus:border-primary transition-all text-slate-900 dark:text-white"
                placeholder="•••"
                maxLength={3}
              />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-card-dark border border-slate-200 dark:border-white/10 rounded-2xl p-5 mt-4">
            <h3 className="text-xs font-black uppercase text-slate-400 dark:text-white/30 mb-4">{t.orderSummary}</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-slate-600 dark:text-white/60">{plan.name} Plan ({plan.students} {lang === 'tr' ? 'Öğrenci' : 'Students'})</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{(plan.amount / 100).toFixed(0)} TL</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-white/5">
              <span className="text-base font-black text-slate-900 dark:text-white">{lang === 'tr' ? 'Toplam' : 'Total'}</span>
              <span className="text-base font-black text-primary">{(plan.amount / 100).toFixed(0)} TL</span>
            </div>
          </div>

          {payError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-xs font-bold">{payError}</p>
            </div>
          )}

          <button 
            disabled={isProcessing}
            type="submit"
            className={`w-full h-14 rounded-xl bg-white text-[#0B2B53] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3 ${isProcessing ? 'opacity-80 cursor-wait' : 'hover:brightness-110'}`}
          >
            {isProcessing ? (
              <span className="animate-spin size-5 border-2 border-white/20 border-t-white rounded-full"></span>
            ) : (
              <>
                <span className="material-symbols-outlined">lock</span>
                {t.payNow}
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 dark:text-white/20 font-bold uppercase tracking-widest mt-4">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            {t.securePayment} • SSL Encrypted
          </div>
        </form>
      </main>
    </div>
  );
};

export default CheckoutScreen;
