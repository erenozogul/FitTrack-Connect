
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import MessagesScreen from './pages/MessagesScreen';
import StudentsScreen from './pages/StudentsScreen';
import TrainerProfileScreen from './pages/TrainerProfileScreen';
import AnalysisNotesScreen from './pages/AnalysisNotesScreen';
import TrainerAnalyticsScreen from './pages/TrainerAnalyticsScreen';
import ProgressScreen from './pages/ProgressScreen';
import TrainerPublicProfile from './pages/TrainerPublicProfile';
import ReportScreen from './pages/ReportScreen';
import { UserRole } from './types';

// Add missing error translation keys to translations object
export const translations = {
  tr: {
    brand: "PTBoard",
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
    firstName: "Ad",
    lastName: "Soyad",
    username: "Kullanıcı Adı",
    usernameOrEmail: "Kullanıcı Adı veya E-posta",
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
    library: "Antrenmanlar",
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
    error_generic: "Bir hata oluştu.",
    error_missing_fields: "Tüm alanlar zorunludur.",
    error_email_in_use: "Bu e-posta adresi bu rol için zaten kullanımda.",
    error_username_in_use: "Bu kullanıcı adı bu rol için zaten alınmış.",
    error_invalid_credentials: "Geçersiz kullanıcı adı veya şifre.",
    error_internal: "Sunucu hatası oluştu.",
    error_email_not_found: "Bu e-posta adresiyle kayıtlı hesap bulunamadı.",
    elevateYourTraining: "Antrenmanını Yükselt",
    welcomeTitle1: "Hesabına",
    welcomeTitle2: "Giriş Yap",
    roleLabel: "Rol",
    selectRoleToContinue: "Rolünü seç ve devam et",
    signedInAs: "Giriş yapıldı:",
    templateLibrary: "Antrenmanlar",
    all: "Tümü",
    fatLoss: "Yağ Yakma",
    muscleGain: "Kas Yapımı",
    mobility: "Hareketlilik",
    strength: "Güç",
    assign: "Ata",
    createNewTemplate: "Yeni Şablon Oluştur",
    titleLabel: "Başlık",
    levelLabel: "Seviye",
    categoryLabel: "Kategori",
    durationLabel: "Süre",
    imageUrlOptional: "Resim URL (İsteğe Bağlı)",
    cancel: "İptal",
    create: "Oluştur",
    justNow: "Az önce",
    updatedLabel: "Güncellendi",
    performance: "Performans",
    todaysSessions: "Bugünkü Seanslar",
    legDayDestroyer: "Bacak Günü - Parçalayıcı",
    october: "Ekim",
    hypertrophy: "Hipertrofi",
    mediaUploadDesc: "Antrenman videoları veya animasyonları yükleyin (MP4, GIF)",
    notifications: "Bildirimler",
    comingSoon: "Yakında!",
    myStudents: "Öğrencilerim",
    viewPlan: "Planı Gör",
    selectStudent: "Öğrenci Seç",
    proBadge: "Pro",
    dashboardLabel: "Panel",
    uploadVideoTitle: "Video Yükle",
    uploadVideoDesc: "Antrenman videosu veya animasyon seç",
    selectFile: "Dosya Seç",
    selectedFile: "Seçilen Dosya",
    noFileSelected: "Dosya seçilmedi",
    upload: "Yükle",
    silverRequired: "Gümüş Paket Gerekli",
    silverRequiredDesc: "Egzersiz animasyonları Silver ve üzeri paketlerde mevcuttur.",
    upgradePlan: "Paketi Yükselt",
    lockedTips: "Doğru form ipuçları Silver pakette açılır."
  },
  en: {
    brand: "PTBoard",
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
    firstName: "First Name",
    lastName: "Last Name",
    username: "Username",
    usernameOrEmail: "Username or Email",
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
    library: "Workouts",
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
    error_generic: "An error occurred.",
    error_missing_fields: "All fields are required.",
    error_email_in_use: "Email is already in use for this role.",
    error_username_in_use: "Username is already taken for this role.",
    error_invalid_credentials: "Invalid credentials.",
    error_internal: "Internal server error.",
    error_email_not_found: "No account found with this email address.",
    elevateYourTraining: "Elevate Your Training",
    welcomeTitle1: "Log in to",
    welcomeTitle2: "Login",
    roleLabel: "Role",
    selectRoleToContinue: "Select your role to continue",
    signedInAs: "Signed in as",
    templateLibrary: "Workouts",
    all: "All",
    fatLoss: "Fat Loss",
    muscleGain: "Muscle Gain",
    mobility: "Mobility",
    strength: "Strength",
    assign: "Assign",
    createNewTemplate: "Create New Template",
    titleLabel: "Title",
    levelLabel: "Level",
    categoryLabel: "Category",
    durationLabel: "Duration",
    imageUrlOptional: "Image URL (Optional)",
    cancel: "Cancel",
    create: "Create",
    justNow: "Just now",
    updatedLabel: "Updated",
    performance: "Performance",
    todaysSessions: "Today's Sessions",
    legDayDestroyer: "Leg Day - Destroyer",
    october: "October",
    hypertrophy: "Hypertrophy",
    mediaUploadDesc: "Upload workout videos or animations (MP4, GIF)",
    notifications: "Notifications",
    comingSoon: "Coming Soon!",
    myStudents: "My Students",
    viewPlan: "View Plan",
    selectStudent: "Select Student",
    proBadge: "Pro",
    dashboardLabel: "Dashboard",
    uploadVideoTitle: "Upload Video",
    uploadVideoDesc: "Select a workout video or animation",
    selectFile: "Select File",
    selectedFile: "Selected File",
    noFileSelected: "No file selected",
    upload: "Upload",
    silverRequired: "Silver Plan Required",
    silverRequiredDesc: "Exercise animations are available in Silver and above plans.",
    upgradePlan: "Upgrade Plan",
    lockedTips: "Correct form tips unlock with Silver plan."
  }
};

const ProtectedRoute: React.FC<{ isLoggedIn: boolean; isLoading: boolean; children: React.ReactNode }> = ({ isLoggedIn, isLoading, children }) => {
  const location = useLocation();
  if (isLoading) return null;
  if (!isLoggedIn) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [lang, setLang] = useState<'tr' | 'en'>('tr');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('fittrack_dark_mode');
    // Default to dark (true) if never set
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    // Restore auth state from localStorage on mount
    const token = localStorage.getItem('fittrack_token');
    const userStr = localStorage.getItem('fittrack_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsLoggedIn(true);
        setRole(user.role);
        setUserName(`${user.firstName} ${user.lastName}`);
      } catch {
        localStorage.removeItem('fittrack_token');
        localStorage.removeItem('fittrack_user');
      }
    }
    setIsAuthLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('fittrack_dark_mode', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    const refreshToken = localStorage.getItem('fittrack_refresh_token');
    if (refreshToken) {
      fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) }).catch(() => {});
    }
    localStorage.removeItem('fittrack_token');
    localStorage.removeItem('fittrack_refresh_token');
    localStorage.removeItem('fittrack_user');
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
      <div className="min-h-screen bg-white dark:bg-background-dark font-sans text-slate-900 dark:text-white relative transition-colors duration-300 flex flex-col">
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
          <Route path="/plans" element={<ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isAuthLoading}><PlansScreen lang={lang} role={role as 'trainer' | 'student'} /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isAuthLoading}><TemplateLibrary onLogout={handleLogout} lang={lang} userName={userName} role={role as 'trainer' | 'student'} /></ProtectedRoute>} />
          <Route path="/live" element={<ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isAuthLoading}><LiveSession lang={lang} role={role as 'trainer' | 'student'} /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isAuthLoading}><StudentDashboard onLogout={handleLogout} lang={lang} role={role as 'trainer' | 'student'} userName={userName} /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isAuthLoading}><ChatScreen lang={lang} /></ProtectedRoute>} />
          <Route path="/analysis" element={<ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isAuthLoading}><AIAnalysis lang={lang} role={role as 'trainer' | 'student'} /></ProtectedRoute>} />
          <Route path="/explore" element={<ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isAuthLoading}><MapExplorer lang={lang} /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isAuthLoading}><CheckoutScreen lang={lang} /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isAuthLoading}><MessagesScreen lang={lang} role={role as 'trainer' | 'student'} userName={userName} /></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isAuthLoading}><AnalysisNotesScreen lang={lang} role={role as 'trainer' | 'student'} /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isAuthLoading}><StudentsScreen lang={lang} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isAuthLoading}><TrainerProfileScreen lang={lang} setLang={setLang} onLogout={handleLogout} userName={userName} role={role as 'trainer' | 'student'} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isAuthLoading}><TrainerAnalyticsScreen lang={lang} /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isAuthLoading}><ProgressScreen lang={lang} role={role as 'trainer' | 'student'} /></ProtectedRoute>} />
          <Route path="/trainer/:username" element={<ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isAuthLoading}><TrainerPublicProfile lang={lang} role={role as 'trainer' | 'student'} /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isAuthLoading}><ReportScreen lang={lang} role={role as 'trainer' | 'student'} /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
