
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import WelcomeScreen from './pages/WelcomeScreen';
import LoginScreen from './pages/LoginScreen';
import SignUpScreen from './pages/SignUpScreen';
import PlansScreen from './pages/PlansScreen';
import TemplateLibrary from './pages/TemplateLibrary';
import LiveSession from './pages/LiveSession';
import StudentDashboard from './pages/StudentDashboard';
import ChatScreen from './pages/ChatScreen';
import AIAnalysis from './pages/AIAnalysis';
import MapExplorer from './pages/MapExplorer';
import CheckoutScreen from './pages/CheckoutScreen';
import { UserRole } from './types';

// Add missing error translation keys to translations object
export const translations = {
  tr: {
    brand: "FitTrack Connect",
    trainer: "KİŞİSEL ANTRENÖR",
    student: "ÖĞRENCİ",
    iAmA: "BEN BİR",
    trainerDesc: "Müşterileri yönetin, programlar oluşturun ve işinizi büyütün.",
    studentDesc: "Antrenmanları takip edin, hedeflere ulaşın ve koçunuzla bağ kurun.",
    scroll: "Detaylar için kaydır",
    login: "Giriş Yap",
    email: "E-posta Adresi",
    password: "Şifre",
    forgot: "Şifremi unuttum?",
    continueWith: "Veya şununla devam et",
    noAccount: "Hesabınız yok mu?",
    signUp: "Kaydol",
    fullName: "Ad Soyad",
    createAccount: "Hesap Oluştur",
    haveAccount: "Zaten hesabınız var mı?",
    logout: "Çıkış Yap",
    settings: "Ayarlar",
    welcomeBack: "Tekrar hoş geldin",
    weeklySchedule: "Haftalık Takvim",
    todaysWorkout: "Günün Antrenmanı",
    startWorkout: "Antrenmana Başla",
    coachNote: "Koçun Notu",
    dailyMetrics: "Günlük Ölçümler",
    weight: "Kilo",
    bodyFat: "Vücut Yağı",
    library: "Kütüphane",
    board: "Panel",
    plans: "Planlar",
    profile: "Profil",
    home: "Ana Sayfa",
    map: "Harita",
    chat: "Sohbet",
    searchTemplates: "Antrenman şablonu ara...",
    newMedia: "Yeni Medya Varlığı",
    uploadVideo: "Video Yükle",
    advanced: "İleri Seviye",
    beginner: "Başlangıç",
    intermediate: "Orta Seviye",
    mins: "Dakika",
    darkMode: "Karanlık Mod",
    lightMode: "Aydınlık Mod",
    activeStudents: "Aktif Öğrenciler",
    totalRevenue: "Toplam Gelir",
    coachingOverview: "Koçluk Özeti",
    checkout: "Ödeme",
    cardNumber: "Kart Numarası",
    expiryDate: "Son Kullanma Tarihi",
    cvv: "CVV",
    cardHolder: "Kart Sahibi",
    payNow: "Şimdi Öde",
    securePayment: "Güvenli Ödeme",
    orderSummary: "Sipariş Özeti",
    error_not_found: "Kullanıcı bulunamadı.",
    error_wrong_password: "Hatalı şifre.",
    error_generic: "Bir hata oluştu."
  },
  en: {
    brand: "FitTrack Connect",
    trainer: "PERSONAL TRAINER",
    student: "STUDENT",
    iAmA: "I AM A",
    trainerDesc: "Manage clients, build programs, and scale your business.",
    studentDesc: "Track workouts, reach goals, and connect with your coach.",
    scroll: "Scroll for details",
    login: "Login",
    email: "Email Address",
    password: "Password",
    forgot: "Forgot password?",
    continueWith: "Or continue with",
    noAccount: "Don't have an account?",
    signUp: "Sign Up",
    fullName: "Full Name",
    createAccount: "Create Account",
    haveAccount: "Already have an account?",
    logout: "Logout",
    settings: "Settings",
    welcomeBack: "Welcome back",
    weeklySchedule: "Weekly Schedule",
    todaysWorkout: "Today's Workout",
    startWorkout: "Start Workout",
    coachNote: "Coach's Personal Note",
    dailyMetrics: "Daily Metrics",
    weight: "Weight",
    bodyFat: "Body Fat",
    library: "Library",
    board: "Board",
    plans: "Plans",
    profile: "Profile",
    home: "Home",
    map: "Map",
    chat: "Chat",
    searchTemplates: "Search workout templates...",
    newMedia: "New Media Asset",
    uploadVideo: "Upload Video",
    advanced: "Advanced",
    beginner: "Beginner",
    intermediate: "Intermediate",
    mins: "Mins",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    activeStudents: "Active Students",
    totalRevenue: "Total Revenue",
    coachingOverview: "Coaching Overview",
    checkout: "Checkout",
    cardNumber: "Card Number",
    expiryDate: "Expiry Date",
    cvv: "CVV",
    cardHolder: "Card Holder",
    payNow: "Pay Now",
    securePayment: "Secure Payment",
    orderSummary: "Order Summary",
    error_not_found: "User not found.",
    error_wrong_password: "Wrong password.",
    error_generic: "An error occurred."
  }
};

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [lang, setLang] = useState<'tr' | 'en'>('tr');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setRole(null);
    setUserName('');
  };

  const handleAuthSuccess = (name?: string) => {
    if (name) setUserName(name);
    setIsLoggedIn(true);
  };

  return (
    <HashRouter>
      <div className="min-h-screen bg-white dark:bg-background-dark font-sans text-slate-900 dark:text-white max-w-md mx-auto relative overflow-hidden shadow-2xl transition-colors duration-300">
        <Routes>
          <Route path="/" element={<WelcomeScreen onSelectRole={(r) => setRole(r)} lang={lang} setLang={setLang} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
          <Route 
            path="/login" 
            element={<LoginScreen role={role} onLogin={(name, r) => { handleAuthSuccess(name); setRole(r); }} lang={lang} />} 
          />
          <Route 
            path="/signup" 
            element={<SignUpScreen role={role} onSignUp={(name) => handleAuthSuccess(name)} lang={lang} />} 
          />
          <Route path="/plans" element={<PlansScreen lang={lang} />} />
          <Route path="/library" element={<TemplateLibrary onLogout={handleLogout} lang={lang} userName={userName} />} />
          <Route path="/live" element={<LiveSession lang={lang} />} />
          <Route path="/dashboard" element={<StudentDashboard onLogout={handleLogout} lang={lang} role={role as 'trainer' | 'student'} userName={userName} />} />
          <Route path="/chat" element={<ChatScreen lang={lang} />} />
          <Route path="/analysis" element={<AIAnalysis lang={lang} />} />
          <Route path="/explore" element={<MapExplorer lang={lang} />} />
          <Route path="/checkout" element={<CheckoutScreen lang={lang} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
