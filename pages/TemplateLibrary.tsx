
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';
import { translations } from '../App';
import { addNotification } from '../utils/notifications';
import { api } from '../utils/api';

interface Exercise {
  id: string;
  name: string;
  target: { tr: string; en: string };
  summary: { tr: string; en: string };
  tips: { tr: string[]; en: string[] };
}

interface BodyPart {
  id: string;
  name: { tr: string; en: string };
  icon: string;
  color: string;
  textColor: string;
  exercises: Exercise[];
}

const bodyParts: BodyPart[] = [
  {
    id: 'chest', name: { tr: 'Göğüs İdmanı', en: 'Chest Workout' },
    icon: 'fitness_center', color: 'bg-primary/10 border-primary/30', textColor: 'text-primary',
    exercises: [
      { id: 'dumbbell-fly', name: 'Dumbbell Fly',
        target: { tr: 'Göğüs (Pektoral)', en: 'Chest (Pectoral)' },
        summary: { tr: 'Göğüs kaslarını genişletir ve derinlemesine çalıştırır. Pektoral kasların esnekliğini ve gücünü artırır. Omuz eklemine yük bindirmeden göğsü izole eder.', en: 'Stretches and deeply works the chest muscles. Increases pectoral flexibility and strength. Isolates the chest without overloading the shoulder joint.' },
        tips: { tr: ['Hafif ağırlıkla başlayın', 'Dirsekleri hafif bükük tutun', 'Yavaş ve kontrollü inin', 'Göğüste kasılmayı hissedin'], en: ['Start with light weight', 'Keep elbows slightly bent', 'Lower slowly and controlled', 'Feel the chest contraction'] }
      },
      { id: 'bench-press', name: 'Bench Press',
        target: { tr: 'Göğüs, Triceps, Ön Omuz', en: 'Chest, Triceps, Front Shoulder' },
        summary: { tr: 'Göğüs geliştirmenin temel bileşik egzersizi. Pektoral, triceps ve ön omuz kaslarını aynı anda güçlendirir. Üst vücut gelişimi için vazgeçilmez.', en: 'The fundamental compound exercise for chest development. Strengthens pectorals, triceps and front deltoids simultaneously.' },
        tips: { tr: ['Sırtı bench\'e yaslayın', 'Barı kontrollü indirin', 'Kürek kemiklerini sıkıştırın', 'Bilekleri düz tutun'], en: ['Press back into bench', 'Lower bar in control', 'Squeeze shoulder blades', 'Keep wrists straight'] }
      },
      { id: 'pushup', name: 'Push-Up',
        target: { tr: 'Göğüs, Triceps, Core', en: 'Chest, Triceps, Core' },
        summary: { tr: 'Ekipmansız göğüs egzersizinin klasiği. Göğüs, triceps ve omuzları çalıştırırken core stabilitesini de geliştirir.', en: 'The classic bodyweight chest exercise. Works chest, triceps and shoulders while developing core stability.' },
        tips: { tr: ['Vücudu düz bir çizgide tutun', 'Dirsekler 45° açıyla', 'Tam hareket açısı kullanın', 'Core\'u sıkıştırın'], en: ['Keep body in a straight line', 'Elbows at 45° angle', 'Use full range of motion', 'Engage your core'] }
      },
    ]
  },
  {
    id: 'legs', name: { tr: 'Bacak İdmanı', en: 'Leg Workout' },
    icon: 'directions_run', color: 'bg-cta-orange/10 border-cta-orange/30', textColor: 'text-cta-orange',
    exercises: [
      { id: 'squat', name: 'Squat',
        target: { tr: 'Quadriceps, Hamstring, Glute', en: 'Quadriceps, Hamstrings, Glutes' },
        summary: { tr: 'Bacak egzersizlerinin kralı. Quad, hamstring ve glute kaslarını aynı anda çalıştırır. Fonksiyonel güç ve kas kütlesi için temel egzersiz.', en: 'The king of leg exercises. Works quads, hamstrings and glutes simultaneously. Foundational for functional strength and muscle mass.' },
        tips: { tr: ['Dizler ayak parmakları hizasında', 'Göğüs dik tutun', 'Topuklar yerden kalkmasın', 'Kalça paralelin altına inin'], en: ['Knees track over toes', 'Keep chest upright', 'Keep heels on ground', 'Lower hips below parallel'] }
      },
      { id: 'rdl', name: 'Romanian Deadlift',
        target: { tr: 'Hamstring, Glute, Bel', en: 'Hamstrings, Glutes, Lower Back' },
        summary: { tr: 'Hamstring ve gluteleri izole eder. Posterior zinciri güçlendirir ve bel sağlığını destekler. Esneklik ve güç kombinasyonu.', en: 'Isolates hamstrings and glutes. Strengthens the posterior chain and supports lower back health.' },
        tips: { tr: ['Bel düz tutun', 'Barı bacaklara yakın tutun', 'Kalçayla hareket yapın', 'Dizleri hafif bükük tutun'], en: ['Keep back straight', 'Keep bar close to legs', 'Drive movement from hips', 'Keep slight knee bend'] }
      },
      { id: 'lunge', name: 'Lunge',
        target: { tr: 'Quadriceps, Glute, Denge', en: 'Quadriceps, Glutes, Balance' },
        summary: { tr: 'Tek bacak çalışmasıyla asimetrik güç geliştirir. Denge ve koordinasyonu artırır. Her iki bacağı eşit geliştirmek için idealdir.', en: 'Develops asymmetric strength through single-leg work. Improves balance and coordination.' },
        tips: { tr: ['Ön diz 90° açıda', 'Arka diz yere değmesin', 'Gövde dik tutun', 'Ön topuktan itin'], en: ['Front knee at 90°', 'Back knee off ground', 'Keep torso upright', 'Push from front heel'] }
      },
    ]
  },
  {
    id: 'shoulders', name: { tr: 'Omuz İdmanı', en: 'Shoulder Workout' },
    icon: 'accessibility_new', color: 'bg-violet-500/10 border-violet-400/30', textColor: 'text-violet-400',
    exercises: [
      { id: 'lateral-raise', name: 'Lateral Raise',
        target: { tr: 'Deltoid (Yan)', en: 'Lateral Deltoid' },
        summary: { tr: 'Omuzların yan bölümünü izole eder. Geniş ve yuvarlak omuz görünümü için temel egzersiz. Yan deltoidin şekillenmesini sağlar.', en: 'Isolates the lateral shoulder. The primary exercise for wide, rounded shoulder appearance.' },
        tips: { tr: ['Omuz yüksekliğine kadar kaldırın', 'Kontrollü indirin', 'Hafif öne eğik tutun', 'Parmak uçları aşağı baksın'], en: ['Raise to shoulder height', 'Lower under control', 'Keep slight forward lean', 'Pinky side slightly higher'] }
      },
      { id: 'shoulder-press', name: 'Shoulder Press',
        target: { tr: 'Deltoid (Ön/Yan), Triceps', en: 'Front/Lateral Deltoid, Triceps' },
        summary: { tr: 'Omuz geliştirmenin temel bileşik hareketi. Ön ve yan deltoid ile tricepsleri çalıştırır. Üst vücut gücü için kritik.', en: 'The fundamental compound shoulder movement. Works front and lateral deltoids with triceps.' },
        tips: { tr: ['Beli fazla bükmeyin', 'Kollar tam uzasın', 'Kulak hizasından başlayın', 'Nefesi kontrol edin'], en: ["Don't arch lower back", 'Fully extend arms', 'Start at ear level', 'Control your breathing'] }
      },
      { id: 'face-pull', name: 'Face Pull',
        target: { tr: 'Arka Deltoid, Rotator Cuff', en: 'Rear Deltoid, Rotator Cuff' },
        summary: { tr: 'Arka deltoid ve rotator cuff güçlendirir. Omuz sağlığını korur ve duruş bozukluklarını düzeltir. Yaralanma önleyici önemli egzersiz.', en: 'Strengthens rear deltoid and rotator cuff. Maintains shoulder health and corrects posture issues.' },
        tips: { tr: ['Kablo göz hizasında', 'Dirsekleri yükseğe çekin', 'Kısa süre kasılı tutun', 'Omuzları germeyin'], en: ['Cable at eye level', 'Pull elbows high', 'Hold contraction briefly', "Don't shrug shoulders"] }
      },
    ]
  },
  {
    id: 'arms', name: { tr: 'Kol Antrenmanı', en: 'Arm Workout' },
    icon: 'sports_martial_arts', color: 'bg-emerald-500/10 border-emerald-400/30', textColor: 'text-emerald-400',
    exercises: [
      { id: 'bicep-curl', name: 'Bicep Curl',
        target: { tr: 'Biceps Brachii', en: 'Biceps Brachii' },
        summary: { tr: 'Biceps kasını izole ederek çalıştırır. Kol ön yüzeyinin dolgunluğunu ve gücünü artırır. Tepe kasılmada tam sıkıştırma önemlidir.', en: 'Isolates and works the biceps muscle. Increases arm fullness and strength. A full peak contraction is important.' },
        tips: { tr: ['Dirsekler yanında sabit', 'Tam hareket açısı kullanın', 'Yavaş inin (negatif faz)', 'Tepe noktada sıkıştırın'], en: ['Keep elbows fixed at sides', 'Use full range of motion', 'Lower slowly (negative phase)', 'Squeeze at the top'] }
      },
      { id: 'tricep-dip', name: 'Tricep Dip',
        target: { tr: 'Triceps Brachii', en: 'Triceps Brachii' },
        summary: { tr: 'Triceps kasını vücut ağırlığıyla çalıştırır. Kolların arka yüzeyini güçlendirir ve şekillendirir. İleri seviye için ağırlık eklenebilir.', en: 'Works triceps with bodyweight. Strengthens and shapes the back of the arms. Weight can be added for advanced progression.' },
        tips: { tr: ['Omuzları geri çekin', 'Dirsekleri dar tutun', 'Kontrollü inin', 'Tam uzanın üstte'], en: ['Pull shoulders back', 'Keep elbows narrow', 'Lower in control', 'Fully extend at top'] }
      },
      { id: 'hammer-curl', name: 'Hammer Curl',
        target: { tr: 'Brachialis, Ön Kol', en: 'Brachialis, Forearm' },
        summary: { tr: 'Nötr tutuşla biceps ve ön kol kaslarını çalıştırır. Kol kalınlığını ve gücünü artırır. Dirsek eklemine daha az yük bindirir.', en: 'Works biceps and forearms with neutral grip. Increases arm thickness and strength. Less stress on the elbow joint.' },
        tips: { tr: ['Baş parmak yukarıda', 'Dirsek sabit', 'Omuzlar shrug yapmasın', 'Bilek nötr pozisyonda'], en: ['Thumb faces up', 'Keep elbow fixed', "Don't shrug shoulders", 'Wrist in neutral position'] }
      },
    ]
  },
  {
    id: 'back', name: { tr: 'Sırt Antrenmanı', en: 'Back Workout' },
    icon: 'airline_seat_recline_extra', color: 'bg-amber-500/10 border-amber-400/30', textColor: 'text-amber-400',
    exercises: [
      { id: 'lat-pulldown', name: 'Lat Pulldown',
        target: { tr: 'Latissimus Dorsi, Biceps', en: 'Latissimus Dorsi, Biceps' },
        summary: { tr: 'Sırt genişliğini geliştiren temel egzersiz. Lat kaslarını hedef alır ve V-şekli vücut görünümü oluşturur. Çekiş gücünü artırır.', en: 'The primary exercise for back width. Targets the lat muscles and creates a V-shaped physique. Increases pulling strength.' },
        tips: { tr: ['Göğüse doğru çekin', 'Sırtı hafif geriye yatırın', 'Kürek kemiklerini sıkıştırın', 'Kontrollü bırakın'], en: ['Pull toward chest', 'Lean slightly back', 'Squeeze shoulder blades', 'Release under control'] }
      },
      { id: 'bent-over-row', name: 'Bent-Over Row',
        target: { tr: 'Orta Sırt, Rhomboid, Biceps', en: 'Mid Back, Rhomboids, Biceps' },
        summary: { tr: 'Orta sırt kalınlığını geliştirir. Rhomboid ve trapez kaslarını güçlendirir. Sırt yoğunluğu için vazgeçilmez bileşik hareket.', en: 'Develops mid-back thickness. Strengthens rhomboids and trapezius. Indispensable compound move for back density.' },
        tips: { tr: ['Sırt 45° açıyla', 'Göbeğe doğru çekin', 'Dirsekler geriye', 'Bel düz tutun'], en: ['Back at 45° angle', 'Pull toward navel', 'Drive elbows back', 'Keep back flat'] }
      },
      { id: 'deadlift', name: 'Deadlift',
        target: { tr: 'Tüm Arka Zincir', en: 'Full Posterior Chain' },
        summary: { tr: 'Tüm vücudu çalıştıran en güçlü bileşik hareket. Sırt, kalça, bacak ve core kaslarını aynı anda güçlendirir. Fonksiyonel güç için en önemli egzersiz.', en: 'The most powerful compound movement. Strengthens back, hips, legs and core simultaneously. The most important exercise for functional strength.' },
        tips: { tr: ['Barı bacaklara yakın tutun', 'Sırt düz kalmalı', 'Kalçayla itin', 'Nefesi kilitleyin'], en: ['Keep bar close to legs', 'Back must stay flat', 'Drive through hips', 'Brace your breath'] }
      },
    ]
  },
  {
    id: 'cardio', name: { tr: 'Kardiyo', en: 'Cardio' },
    icon: 'monitor_heart', color: 'bg-red-500/10 border-red-400/30', textColor: 'text-red-400',
    exercises: [
      { id: 'jump-rope', name: 'Jump Rope',
        target: { tr: 'Kalp-Damar, Koordinasyon', en: 'Cardiovascular, Coordination' },
        summary: { tr: 'Kardiyovasküler dayanıklılığı hızla artırır. Koordinasyon ve ritim geliştirir. Kalori yakımı için oldukça etkili ve pratik bir egzersiz.', en: 'Rapidly improves cardiovascular endurance. Develops coordination and rhythm. Highly effective and practical for calorie burning.' },
        tips: { tr: ['Bilekle döndürün', 'Topuklar hafifçe yükselsin', 'Ritmik nefes alın', 'Dik durun'], en: ['Rotate with wrists', 'Heels slightly elevated', 'Breathe rhythmically', 'Stand tall'] }
      },
      { id: 'jumping-jacks', name: 'Jumping Jacks',
        target: { tr: 'Tüm Vücut, Kardiyo', en: 'Full Body, Cardio' },
        summary: { tr: 'Isınma ve kardiyo için mükemmel tam vücut egzersizi. Koordinasyonu geliştirir ve kalp atışını yükseltir. Her seviyeye uygun.', en: 'Perfect full-body exercise for warm-up and cardio. Improves coordination and elevates heart rate. Suitable for all levels.' },
        tips: { tr: ['Yumuşak iniş yapın', 'Kollar tam açılsın', 'Ritmi koruyun', 'Derin nefes alın'], en: ['Land softly', 'Fully extend arms', 'Maintain rhythm', 'Breathe deeply'] }
      },
      { id: 'burpee', name: 'Burpee',
        target: { tr: 'Tüm Vücut, HIIT', en: 'Full Body, HIIT' },
        summary: { tr: 'Yüksek yoğunluklu tam vücut egzersizi. Güç ve kardiyo kapasitesini aynı anda geliştirir. En çok kalori yakan hareketlerden biridir.', en: 'High-intensity full-body exercise. Develops strength and cardio capacity simultaneously. One of the highest calorie-burning movements.' },
        tips: { tr: ['Tempoyu koruyun', 'Core\'u sıkıştırın', 'Yumuşak atlayın', 'Nefes kontrolü önemli'], en: ['Maintain pace', 'Brace your core', 'Land softly', 'Breathing control is key'] }
      },
    ]
  },
  {
    id: 'calisthenics', name: { tr: 'Kalistenik', en: 'Calisthenics' },
    icon: 'self_improvement', color: 'bg-cyan-500/10 border-cyan-400/30', textColor: 'text-cyan-400',
    exercises: [
      { id: 'pull-up', name: 'Pull-Up',
        target: { tr: 'Lat, Biceps, Üst Sırt', en: 'Lats, Biceps, Upper Back' },
        summary: { tr: 'Kalisteninin temel çekiş hareketi. Sırt ve biceps kaslarını güçlendirir. Vücut kontrolü ve gücünün en önemli göstergesidir.', en: 'The fundamental pull movement in calisthenics. Strengthens back and biceps. The most important indicator of body control and strength.' },
        tips: { tr: ['Tam uzanıştan başlayın', 'Çeneyi barın üstüne', 'Kürek kemiklerini kullanın', 'Sallanmayın'], en: ['Start from full hang', 'Get chin over bar', 'Engage shoulder blades', "Don't swing"] }
      },
      { id: 'muscle-up', name: 'Muscle-Up',
        target: { tr: 'Tüm Üst Vücut', en: 'Full Upper Body' },
        summary: { tr: 'Pull-up ve dip kombinasyonu. Üst vücudun tamamını çalıştırır. Kalisteninin ileri seviye becerilerinden biridir.', en: 'Combination of pull-up and dip. Works the entire upper body. One of the advanced calisthenics skills.' },
        tips: { tr: ['Güçlü pull-up tabanı şart', 'Geçişte patlayıcı olun', 'Omuz esnekliğini geliştirin', 'Kademeli ilerleyin'], en: ['Strong pull-up base required', 'Be explosive at the transition', 'Develop shoulder flexibility', 'Progress gradually'] }
      },
      { id: 'plank', name: 'Plank',
        target: { tr: 'Core, Omuz Stabilitesi', en: 'Core, Shoulder Stability' },
        summary: { tr: 'İzometrik core egzersizinin temeli. Karın, bel ve omuz kaslarını stabilize eder. Her antrenmanın vazgeçilmez tamamlayıcısıdır.', en: 'The foundation of isometric core exercise. Stabilizes abdominal, lower back and shoulder muscles. An indispensable complement to every workout.' },
        tips: { tr: ['Kalçayı ne yükseltin ne indirin', 'Nefes almayı bırakmayın', 'Göbeği içeri çekin', 'Boynu nötr tutun'], en: ["Don't raise or drop hips", "Don't stop breathing", 'Draw navel in', 'Keep neck neutral'] }
      },
    ]
  },
];

// ─── SVG Animations ──────────────────────────────────────────────────────────

const s = { stroke: '#60A5FA', strokeWidth: '3', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
const dur = '2.4s';

const BicepCurlSVG = () => (
  <svg viewBox="0 0 120 165" className="w-full max-h-52">
    {/* Head */}
    <circle cx="60" cy="16" r="9" stroke="#60A5FA" strokeWidth="2.5" fill="none" />
    {/* Torso */}
    <line x1="60" y1="25" x2="60" y2="78" {...s} />
    {/* Left arm (static) */}
    <line x1="60" y1="38" x2="38" y2="58" {...s} />
    <line x1="38" y1="58" x2="30" y2="82" {...s} />
    <rect x="22" y="79" width="14" height="5" rx="2" fill="#60A5FA" opacity="0.3" />
    {/* Right upper arm (static) */}
    <line x1="60" y1="38" x2="82" y2="58" {...s} />
    {/* Right forearm + dumbbell (animated curl) */}
    <g>
      <line x1="82" y1="58" x2="90" y2="82" {...s}>
        <animateTransform attributeName="transform" type="rotate"
          values={`0 82 58; -110 82 58; 0 82 58`} dur={dur} repeatCount="indefinite" calcMode="spline"
          keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      </line>
      <rect x="84" y="78" width="14" height="5" rx="2" fill="#60A5FA" opacity="0.5">
        <animateTransform attributeName="transform" type="rotate"
          values={`0 82 58; -110 82 58; 0 82 58`} dur={dur} repeatCount="indefinite" calcMode="spline"
          keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      </rect>
    </g>
    {/* Legs */}
    <line x1="56" y1="78" x2="48" y2="120" {...s} />
    <line x1="64" y1="78" x2="72" y2="120" {...s} />
    <line x1="48" y1="120" x2="44" y2="152" {...s} />
    <line x1="72" y1="120" x2="76" y2="152" {...s} />
    <line x1="44" y1="152" x2="32" y2="157" {...s} />
    <line x1="76" y1="152" x2="88" y2="157" {...s} />
  </svg>
);

const LateralRaiseSVG = () => (
  <svg viewBox="0 0 120 165" className="w-full max-h-52">
    <circle cx="60" cy="16" r="9" stroke="#60A5FA" strokeWidth="2.5" fill="none" />
    <line x1="60" y1="25" x2="60" y2="78" {...s} />
    {/* Left arm */}
    <line x1="60" y1="38" x2="38" y2="62" {...s}>
      <animateTransform attributeName="transform" type="rotate"
        values="0 60 38; -72 60 38; 0 60 38" dur={dur} repeatCount="indefinite" calcMode="spline"
        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <rect x="22" y="60" width="14" height="5" rx="2" fill="#60A5FA" opacity="0.4">
      <animateTransform attributeName="transform" type="rotate"
        values="0 60 38; -72 60 38; 0 60 38" dur={dur} repeatCount="indefinite" calcMode="spline"
        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </rect>
    {/* Right arm */}
    <line x1="60" y1="38" x2="82" y2="62" {...s}>
      <animateTransform attributeName="transform" type="rotate"
        values="0 60 38; 72 60 38; 0 60 38" dur={dur} repeatCount="indefinite" calcMode="spline"
        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <rect x="84" y="60" width="14" height="5" rx="2" fill="#60A5FA" opacity="0.4">
      <animateTransform attributeName="transform" type="rotate"
        values="0 60 38; 72 60 38; 0 60 38" dur={dur} repeatCount="indefinite" calcMode="spline"
        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </rect>
    <line x1="56" y1="78" x2="48" y2="120" {...s} />
    <line x1="64" y1="78" x2="72" y2="120" {...s} />
    <line x1="48" y1="120" x2="44" y2="152" {...s} />
    <line x1="72" y1="120" x2="76" y2="152" {...s} />
    <line x1="44" y1="152" x2="32" y2="157" {...s} />
    <line x1="76" y1="152" x2="88" y2="157" {...s} />
  </svg>
);

const ShoulderPressSVG = () => (
  <svg viewBox="0 0 120 165" className="w-full max-h-52">
    <circle cx="60" cy="16" r="9" stroke="#60A5FA" strokeWidth="2.5" fill="none" />
    <line x1="60" y1="25" x2="60" y2="78" {...s} />
    {/* Left arm - starts at ear level, presses up */}
    <line x1="60" y1="38" x2="36" y2="38" {...s}>
      <animateTransform attributeName="transform" type="rotate"
        values="0 60 38; -45 60 38; 0 60 38" dur={dur} repeatCount="indefinite" calcMode="spline"
        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="36" y1="38" x2="30" y2="12" {...s}>
      <animateTransform attributeName="transform" type="rotate"
        values="0 36 38; 45 36 38; 0 36 38" dur={dur} repeatCount="indefinite" calcMode="spline"
        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Right arm */}
    <line x1="60" y1="38" x2="84" y2="38" {...s}>
      <animateTransform attributeName="transform" type="rotate"
        values="0 60 38; 45 60 38; 0 60 38" dur={dur} repeatCount="indefinite" calcMode="spline"
        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="84" y1="38" x2="90" y2="12" {...s}>
      <animateTransform attributeName="transform" type="rotate"
        values="0 84 38; -45 84 38; 0 84 38" dur={dur} repeatCount="indefinite" calcMode="spline"
        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Bar */}
    <rect x="25" y="8" width="70" height="5" rx="2" fill="#60A5FA" opacity="0.4">
      <animateTransform attributeName="transform" type="translate"
        values="0 0; 0 -18; 0 0" dur={dur} repeatCount="indefinite" calcMode="spline"
        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </rect>
    <line x1="56" y1="78" x2="48" y2="120" {...s} />
    <line x1="64" y1="78" x2="72" y2="120" {...s} />
    <line x1="48" y1="120" x2="44" y2="152" {...s} />
    <line x1="72" y1="120" x2="76" y2="152" {...s} />
    <line x1="44" y1="152" x2="32" y2="157" {...s} />
    <line x1="76" y1="152" x2="88" y2="157" {...s} />
  </svg>
);

const SquatSVG = () => (
  <svg viewBox="0 0 120 165" className="w-full max-h-52">
    {/* Whole upper body translates down */}
    <g>
      <circle cx="60" cy="16" r="9" stroke="#60A5FA" strokeWidth="2.5" fill="none">
        <animateTransform attributeName="transform" type="translate" values="0 0; 0 24; 0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      </circle>
      <line x1="60" y1="25" x2="60" y2="74" {...s}>
        <animateTransform attributeName="transform" type="translate" values="0 0; 0 22; 0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      </line>
      {/* Arms spread for balance */}
      <line x1="60" y1="38" x2="32" y2="60" {...s}>
        <animateTransform attributeName="transform" type="translate" values="0 0; 0 22; 0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      </line>
      <line x1="60" y1="38" x2="88" y2="60" {...s}>
        <animateTransform attributeName="transform" type="translate" values="0 0; 0 22; 0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      </line>
    </g>
    {/* Legs bend - thighs go more horizontal at bottom */}
    <line x1="56" y1="74" x2="44" y2="110" {...s}>
      <animate attributeName="x2" values="44;30;44" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="y1" values="74;96;74" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="y2" values="110;112;110" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="64" y1="74" x2="76" y2="110" {...s}>
      <animate attributeName="x2" values="76;90;76" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="y1" values="74;96;74" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="y2" values="110;112;110" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Shins */}
    <line x1="44" y1="110" x2="44" y2="150" {...s}>
      <animate attributeName="x1" values="44;30;44" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="76" y1="110" x2="76" y2="150" {...s}>
      <animate attributeName="x1" values="76;90;76" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="44" y1="150" x2="32" y2="157" {...s} />
    <line x1="76" y1="150" x2="88" y2="157" {...s} />
  </svg>
);

const RDLSvg = () => (
  <svg viewBox="0 0 120 165" className="w-full max-h-52">
    {/* Upper body hinges forward from hips */}
    <g>
      <circle cx="60" cy="16" r="9" stroke="#60A5FA" strokeWidth="2.5" fill="none">
        <animateTransform attributeName="transform" type="rotate" values="0 60 78; 55 60 78; 0 60 78" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      </circle>
      <line x1="60" y1="25" x2="60" y2="78" {...s}>
        <animateTransform attributeName="transform" type="rotate" values="0 60 78; 55 60 78; 0 60 78" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      </line>
      {/* Arms hanging with bar */}
      <line x1="60" y1="42" x2="40" y2="66" {...s}>
        <animateTransform attributeName="transform" type="rotate" values="0 60 78; 55 60 78; 0 60 78" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      </line>
      <line x1="40" y1="66" x2="36" y2="90" {...s}>
        <animateTransform attributeName="transform" type="rotate" values="0 60 78; 55 60 78; 0 60 78" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      </line>
      <line x1="60" y1="42" x2="80" y2="66" {...s}>
        <animateTransform attributeName="transform" type="rotate" values="0 60 78; 55 60 78; 0 60 78" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      </line>
      <line x1="80" y1="66" x2="84" y2="90" {...s}>
        <animateTransform attributeName="transform" type="rotate" values="0 60 78; 55 60 78; 0 60 78" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      </line>
      {/* Bar */}
      <rect x="28" y="87" width="44" height="5" rx="2" fill="#60A5FA" opacity="0.4">
        <animateTransform attributeName="transform" type="rotate" values="0 60 78; 55 60 78; 0 60 78" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      </rect>
    </g>
    {/* Legs stay mostly straight */}
    <line x1="56" y1="78" x2="52" y2="122" {...s} />
    <line x1="64" y1="78" x2="68" y2="122" {...s} />
    <line x1="52" y1="122" x2="48" y2="152" {...s} />
    <line x1="68" y1="122" x2="72" y2="152" {...s} />
    <line x1="48" y1="152" x2="36" y2="157" {...s} />
    <line x1="72" y1="152" x2="84" y2="157" {...s} />
  </svg>
);

const LungeSVG = () => (
  <svg viewBox="0 0 140 165" className="w-full max-h-52">
    <circle cx="65" cy="16" r="9" stroke="#60A5FA" strokeWidth="2.5" fill="none" />
    <line x1="65" y1="25" x2="65" y2="78" {...s} />
    <line x1="65" y1="38" x2="44" y2="58" {...s} />
    <line x1="44" y1="58" x2="38" y2="80" {...s} />
    <line x1="65" y1="38" x2="86" y2="58" {...s} />
    <line x1="86" y1="58" x2="92" y2="80" {...s} />
    {/* Front left leg lunging forward */}
    <line x1="61" y1="78" x2="38" y2="112" {...s}>
      <animate attributeName="x2" values="38;28;38" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="y2" values="112;116;112" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="38" y1="112" x2="34" y2="152" {...s}>
      <animate attributeName="x1" values="38;28;38" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="y1" values="112;116;112" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Back right leg */}
    <line x1="69" y1="78" x2="92" y2="112" {...s} />
    <line x1="92" y1="112" x2="110" y2="145" {...s} />
    <line x1="34" y1="152" x2="22" y2="157" {...s} />
    <line x1="110" y1="145" x2="122" y2="148" {...s} />
  </svg>
);

const DumbbellFlySVG = () => (
  <svg viewBox="0 0 180 120" className="w-full max-h-52">
    {/* Lying on back - bench */}
    <rect x="10" y="68" width="160" height="8" rx="3" fill="#60A5FA" opacity="0.1" stroke="#60A5FA" strokeWidth="1" />
    {/* Head */}
    <circle cx="155" cy="60" r="9" stroke="#60A5FA" strokeWidth="2.5" fill="none" />
    {/* Torso */}
    <line x1="145" y1="60" x2="40" y2="64" {...s} />
    {/* Left arm spreads out */}
    <line x1="100" y1="62" x2="30" y2="56" {...s}>
      <animate attributeName="y2" values="56;30;56" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="x2" values="30;55;30" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <rect x="16" y="52" width="14" height="6" rx="2" fill="#60A5FA" opacity="0.4">
      <animate attributeName="y" values="52;26;52" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="x" values="16;42;16" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </rect>
    {/* Right arm spreads out */}
    <line x1="100" y1="62" x2="150" y2="56" {...s}>
      <animate attributeName="y2" values="56;30;56" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="x2" values="150;125;150" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <rect x="150" y="52" width="14" height="6" rx="2" fill="#60A5FA" opacity="0.4">
      <animate attributeName="y" values="52;26;52" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="x" values="150;124;150" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </rect>
    {/* Legs */}
    <line x1="40" y1="64" x2="22" y2="100" {...s} />
    <line x1="40" y1="64" x2="15" y2="96" {...s} />
  </svg>
);

const BenchPressSVG = () => (
  <svg viewBox="0 0 180 120" className="w-full max-h-52">
    <rect x="10" y="68" width="160" height="8" rx="3" fill="#60A5FA" opacity="0.1" stroke="#60A5FA" strokeWidth="1" />
    <circle cx="155" cy="60" r="9" stroke="#60A5FA" strokeWidth="2.5" fill="none" />
    <line x1="145" y1="60" x2="40" y2="64" {...s} />
    {/* Arms push bar up */}
    <line x1="115" y1="62" x2="98" y2="42" {...s}>
      <animate attributeName="y2" values="42;18;42" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="85" y1="62" x2="98" y2="42" {...s}>
      <animate attributeName="y2" values="42;18;42" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Bar */}
    <rect x="55" y="38" width="90" height="6" rx="2" fill="#60A5FA" opacity="0.5">
      <animate attributeName="y" values="38;14;38" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </rect>
    <line x1="40" y1="64" x2="22" y2="100" {...s} />
    <line x1="40" y1="64" x2="15" y2="96" {...s} />
  </svg>
);

const PushupSVG = () => (
  <svg viewBox="0 0 180 120" className="w-full max-h-52">
    {/* Floor */}
    <line x1="5" y1="108" x2="175" y2="108" stroke="#60A5FA" strokeWidth="1" opacity="0.2" />
    {/* Head */}
    <circle cx="155" cy="52" r="9" stroke="#60A5FA" strokeWidth="2.5" fill="none">
      <animate attributeName="cy" values="52;62;52" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </circle>
    {/* Body - plank */}
    <line x1="145" y1="55" x2="45" y2="72" {...s}>
      <animate attributeName="y1" values="55;64;55" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="y2" values="72;82;72" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Left arm */}
    <line x1="120" y1="60" x2="108" y2="88" {...s}>
      <animate attributeName="y1" values="60;70;60" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Right arm */}
    <line x1="95" y1="64" x2="82" y2="88" {...s}>
      <animate attributeName="y1" values="64;74;64" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Hands on floor */}
    <circle cx="108" cy="88" r="3" fill="#60A5FA" opacity="0.4" />
    <circle cx="82" cy="88" r="3" fill="#60A5FA" opacity="0.4" />
    {/* Legs */}
    <line x1="45" y1="72" x2="22" y2="88" {...s}>
      <animate attributeName="y1" values="72;82;72" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="22" y1="88" x2="15" y2="106" {...s} />
    <circle cx="15" cy="106" r="2.5" fill="#60A5FA" opacity="0.4" />
  </svg>
);

const FacePullSVG = () => (
  <svg viewBox="0 0 120 165" className="w-full max-h-52">
    <circle cx="60" cy="16" r="9" stroke="#60A5FA" strokeWidth="2.5" fill="none" />
    <line x1="60" y1="25" x2="60" y2="78" {...s} />
    {/* Cable line */}
    <line x1="115" y1="38" x2="88" y2="38" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.4" />
    {/* Arms pulling toward face */}
    <line x1="60" y1="38" x2="88" y2="30" {...s}>
      <animate attributeName="x2" values="88;72;88" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="60" y1="38" x2="88" y2="46" {...s}>
      <animate attributeName="x2" values="88;72;88" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="56" y1="78" x2="48" y2="120" {...s} />
    <line x1="64" y1="78" x2="72" y2="120" {...s} />
    <line x1="48" y1="120" x2="44" y2="152" {...s} />
    <line x1="72" y1="120" x2="76" y2="152" {...s} />
    <line x1="44" y1="152" x2="32" y2="157" {...s} />
    <line x1="76" y1="152" x2="88" y2="157" {...s} />
  </svg>
);

const TricepDipSVG = () => (
  <svg viewBox="0 0 140 165" className="w-full max-h-52">
    {/* Two parallel bars */}
    <rect x="12" y="58" width="8" height="60" rx="3" fill="#60A5FA" opacity="0.2" stroke="#60A5FA" strokeWidth="1" />
    <rect x="120" y="58" width="8" height="60" rx="3" fill="#60A5FA" opacity="0.2" stroke="#60A5FA" strokeWidth="1" />
    <line x1="12" y1="62" x2="20" y2="62" stroke="#60A5FA" strokeWidth="2.5" />
    <line x1="120" y1="62" x2="128" y2="62" stroke="#60A5FA" strokeWidth="2.5" />
    {/* Figure dipping */}
    <circle cx="70" cy="32" r="9" stroke="#60A5FA" strokeWidth="2.5" fill="none">
      <animate attributeName="cy" values="32;50;32" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </circle>
    <line x1="70" y1="41" x2="70" y2="82" {...s}>
      <animateTransform attributeName="transform" type="translate" values="0 0; 0 18; 0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Arms on bars */}
    <line x1="70" y1="52" x2="22" y2="62" {...s}>
      <animate attributeName="y1" values="52;70;52" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="70" y1="52" x2="118" y2="62" {...s}>
      <animate attributeName="y1" values="52;70;52" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Legs hanging */}
    <line x1="66" y1="82" x2="60" y2="128" {...s}>
      <animateTransform attributeName="transform" type="translate" values="0 0; 0 18; 0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="74" y1="82" x2="80" y2="128" {...s}>
      <animateTransform attributeName="transform" type="translate" values="0 0; 0 18; 0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
  </svg>
);

const LatPulldownSVG = () => (
  <svg viewBox="0 0 120 165" className="w-full max-h-52">
    {/* Cable machine top rail */}
    <line x1="20" y1="8" x2="100" y2="8" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.35" />
    {/* Cable */}
    <line x1="60" y1="8" x2="60" y2="28" stroke="#60A5FA" strokeWidth="1" opacity="0.4">
      <animate attributeName="y2" values="28;48;28" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Bar */}
    <line x1="38" y1="28" x2="82" y2="28" stroke="#60A5FA" strokeWidth="2.5">
      <animate attributeName="y1" values="28;48;28" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="y2" values="28;48;28" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Head */}
    <circle cx="60" cy="58" r="9" stroke="#60A5FA" strokeWidth="2.5" fill="none" />
    {/* Torso */}
    <line x1="60" y1="67" x2="60" y2="112" {...s} />
    {/* Left arm up to bar */}
    <line x1="60" y1="78" x2="38" y2="28" {...s}>
      <animate attributeName="x2" values="38;45;38" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="y2" values="28;48;28" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Right arm up to bar */}
    <line x1="60" y1="78" x2="82" y2="28" {...s}>
      <animate attributeName="x2" values="82;75;82" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="y2" values="28;48;28" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Seat */}
    <rect x="42" y="110" width="36" height="6" rx="2" fill="#60A5FA" opacity="0.18" stroke="#60A5FA" strokeWidth="1" />
    {/* Seated legs */}
    <line x1="52" y1="116" x2="28" y2="116" {...s} />
    <line x1="68" y1="116" x2="92" y2="116" {...s} />
    <line x1="28" y1="116" x2="26" y2="148" {...s} />
    <line x1="92" y1="116" x2="94" y2="148" {...s} />
    <line x1="26" y1="148" x2="16" y2="154" {...s} />
    <line x1="94" y1="148" x2="104" y2="154" {...s} />
  </svg>
);

const BentOverRowSVG = () => (
  <svg viewBox="0 0 120 165" className="w-full max-h-52">
    {/* Head tilted with bent torso */}
    <circle cx="90" cy="44" r="9" stroke="#60A5FA" strokeWidth="2.5" fill="none" />
    {/* Torso ~45° */}
    <line x1="82" y1="52" x2="42" y2="76" {...s} />
    {/* Left arm hanging then pulling */}
    <line x1="55" y1="66" x2="50" y2="96" {...s}>
      <animate attributeName="y2" values="96;76;96" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Right arm hanging then pulling */}
    <line x1="68" y1="58" x2="63" y2="88" {...s}>
      <animate attributeName="y2" values="88;68;88" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Barbell */}
    <line x1="40" y1="96" x2="72" y2="96" stroke="#60A5FA" strokeWidth="2.5">
      <animate attributeName="y1" values="96;76;96" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="y2" values="96;76;96" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <circle cx="38" cy="96" r="4" fill="#60A5FA" opacity="0.3">
      <animate attributeName="cy" values="96;76;96" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </circle>
    <circle cx="74" cy="96" r="4" fill="#60A5FA" opacity="0.3">
      <animate attributeName="cy" values="96;76;96" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </circle>
    {/* Legs */}
    <line x1="44" y1="76" x2="38" y2="118" {...s} />
    <line x1="40" y1="76" x2="34" y2="118" {...s} />
    <line x1="38" y1="118" x2="36" y2="150" {...s} />
    <line x1="34" y1="118" x2="32" y2="150" {...s} />
    <line x1="36" y1="150" x2="24" y2="156" {...s} />
    <line x1="32" y1="150" x2="20" y2="156" {...s} />
  </svg>
);

const DeadliftSVG = () => (
  <svg viewBox="0 0 120 165" className="w-full max-h-52">
    {/* Head */}
    <circle cx="60" cy="16" r="9" stroke="#60A5FA" strokeWidth="2.5" fill="none">
      <animate attributeName="cy" values="16;36;16" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </circle>
    {/* Torso */}
    <line x1="60" y1="25" x2="60" y2="78" {...s}>
      <animate attributeName="y1" values="25;45;25" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="y2" values="78;90;78" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Arms down to bar */}
    <line x1="60" y1="42" x2="36" y2="100" {...s}>
      <animate attributeName="y1" values="42;58;42" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="y2" values="100;112;100" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="60" y1="42" x2="84" y2="100" {...s}>
      <animate attributeName="y1" values="42;58;42" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="y2" values="100;112;100" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Barbell */}
    <line x1="22" y1="100" x2="98" y2="100" stroke="#60A5FA" strokeWidth="2.5">
      <animate attributeName="y1" values="100;112;100" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="y2" values="100;112;100" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <circle cx="20" cy="100" r="6" fill="#60A5FA" opacity="0.3">
      <animate attributeName="cy" values="100;112;100" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </circle>
    <circle cx="100" cy="100" r="6" fill="#60A5FA" opacity="0.3">
      <animate attributeName="cy" values="100;112;100" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </circle>
    {/* Legs */}
    <line x1="56" y1="78" x2="46" y2="118" {...s}>
      <animate attributeName="y1" values="78;90;78" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="64" y1="78" x2="74" y2="118" {...s}>
      <animate attributeName="y1" values="78;90;78" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="46" y1="118" x2="42" y2="152" {...s} />
    <line x1="74" y1="118" x2="78" y2="152" {...s} />
    <line x1="42" y1="152" x2="30" y2="157" {...s} />
    <line x1="78" y1="152" x2="90" y2="157" {...s} />
  </svg>
);

const JumpRopeSVG = () => (
  <svg viewBox="0 0 120 165" className="w-full max-h-52">
    {/* Rope arc */}
    <path d="M 10 100 Q 60 135 110 100" stroke="#60A5FA" strokeWidth="1.5" fill="none" opacity="0.5">
      <animate attributeName="d" values="M 10 100 Q 60 135 110 100; M 10 98 Q 60 125 110 98; M 10 100 Q 60 135 110 100" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </path>
    {/* Head */}
    <circle cx="60" cy="18" r="9" stroke="#60A5FA" strokeWidth="2.5" fill="none">
      <animate attributeName="cy" values="18;12;18" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </circle>
    {/* Torso */}
    <line x1="60" y1="27" x2="60" y2="80" {...s}>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Left arm with handle */}
    <line x1="60" y1="42" x2="22" y2="58" {...s}>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="22" y1="58" x2="12" y2="88" stroke="#60A5FA" strokeWidth="2.5">
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Right arm with handle */}
    <line x1="60" y1="42" x2="98" y2="58" {...s}>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="98" y1="58" x2="108" y2="88" stroke="#60A5FA" strokeWidth="2.5">
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Legs */}
    <line x1="56" y1="80" x2="50" y2="118" {...s}>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="64" y1="80" x2="70" y2="118" {...s}>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="50" y1="118" x2="46" y2="150" {...s}>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="70" y1="118" x2="74" y2="150" {...s}>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="46" y1="150" x2="34" y2="156" {...s}>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="74" y1="150" x2="86" y2="156" {...s}>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
  </svg>
);

const JumpingJacksSVG = () => (
  <svg viewBox="0 0 120 165" className="w-full max-h-52">
    <circle cx="60" cy="16" r="9" stroke="#60A5FA" strokeWidth="2.5" fill="none" />
    <line x1="60" y1="25" x2="60" y2="78" {...s} />
    {/* Left arm - raises up */}
    <line x1="60" y1="38" x2="38" y2="58" {...s}>
      <animateTransform attributeName="transform" type="rotate"
        values="0 60 38; -65 60 38; 0 60 38" dur={dur} repeatCount="indefinite" calcMode="spline"
        keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Right arm - raises up */}
    <line x1="60" y1="38" x2="82" y2="58" {...s}>
      <animateTransform attributeName="transform" type="rotate"
        values="0 60 38; 65 60 38; 0 60 38" dur={dur} repeatCount="indefinite" calcMode="spline"
        keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Left leg - spreads out */}
    <line x1="56" y1="78" x2="40" y2="120" {...s}>
      <animateTransform attributeName="transform" type="rotate"
        values="0 56 78; -20 56 78; 0 56 78" dur={dur} repeatCount="indefinite" calcMode="spline"
        keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="40" y1="120" x2="32" y2="152" {...s}>
      <animateTransform attributeName="transform" type="rotate"
        values="0 56 78; -20 56 78; 0 56 78" dur={dur} repeatCount="indefinite" calcMode="spline"
        keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Right leg - spreads out */}
    <line x1="64" y1="78" x2="80" y2="120" {...s}>
      <animateTransform attributeName="transform" type="rotate"
        values="0 64 78; 20 64 78; 0 64 78" dur={dur} repeatCount="indefinite" calcMode="spline"
        keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="80" y1="120" x2="88" y2="152" {...s}>
      <animateTransform attributeName="transform" type="rotate"
        values="0 64 78; 20 64 78; 0 64 78" dur={dur} repeatCount="indefinite" calcMode="spline"
        keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="32" y1="152" x2="22" y2="157" {...s} />
    <line x1="88" y1="152" x2="98" y2="157" {...s} />
  </svg>
);

const BurpeeSVG = () => (
  <svg viewBox="0 0 120 165" className="w-full max-h-52">
    {/* Head */}
    <circle cx="60" cy="16" r="9" stroke="#60A5FA" strokeWidth="2.5" fill="none">
      <animate attributeName="cy" values="16;72;16" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
    </circle>
    {/* Torso - goes from upright to horizontal */}
    <line x1="60" y1="25" x2="60" y2="78" {...s}>
      <animate attributeName="x1" values="60;20;60" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
      <animate attributeName="y1" values="25;80;25" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
      <animate attributeName="x2" values="60;100;60" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
      <animate attributeName="y2" values="78;80;78" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
    </line>
    {/* Left arm */}
    <line x1="60" y1="40" x2="38" y2="60" {...s}>
      <animate attributeName="x1" values="60;20;60" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
      <animate attributeName="y1" values="40;80;40" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
      <animate attributeName="x2" values="38;10;38" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
      <animate attributeName="y2" values="60;100;60" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
    </line>
    {/* Right arm */}
    <line x1="60" y1="40" x2="82" y2="60" {...s}>
      <animate attributeName="x1" values="60;20;60" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
      <animate attributeName="y1" values="40;80;40" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
      <animate attributeName="x2" values="82;30;82" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
      <animate attributeName="y2" values="60;100;60" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
    </line>
    {/* Legs */}
    <line x1="56" y1="78" x2="48" y2="120" {...s}>
      <animate attributeName="x1" values="56;100;56" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
      <animate attributeName="y1" values="78;80;78" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
      <animate attributeName="x2" values="48;80;48" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
      <animate attributeName="y2" values="120;100;120" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
    </line>
    <line x1="64" y1="78" x2="72" y2="120" {...s}>
      <animate attributeName="x1" values="64;100;64" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
      <animate attributeName="y1" values="78;80;78" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
      <animate attributeName="x2" values="72;110;72" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
      <animate attributeName="y2" values="120;100;120" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.5;1" />
    </line>
    <line x1="48" y1="120" x2="44" y2="152" {...s} />
    <line x1="72" y1="120" x2="76" y2="152" {...s} />
    <line x1="44" y1="152" x2="32" y2="157" {...s} />
    <line x1="76" y1="152" x2="88" y2="157" {...s} />
  </svg>
);

const PullUpSVG = () => (
  <svg viewBox="0 0 120 165" className="w-full max-h-52">
    {/* Pull-up bar */}
    <line x1="15" y1="12" x2="105" y2="12" stroke="#60A5FA" strokeWidth="3" />
    <line x1="15" y1="8" x2="15" y2="18" stroke="#60A5FA" strokeWidth="2" />
    <line x1="105" y1="8" x2="105" y2="18" stroke="#60A5FA" strokeWidth="2" />
    {/* Head */}
    <circle cx="60" cy="38" r="9" stroke="#60A5FA" strokeWidth="2.5" fill="none">
      <animate attributeName="cy" values="38;26;38" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </circle>
    {/* Torso */}
    <line x1="60" y1="47" x2="60" y2="100" {...s}>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -12;0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Left arm reaching bar */}
    <line x1="60" y1="58" x2="36" y2="12" {...s}>
      <animate attributeName="y1" values="58;46;58" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Right arm reaching bar */}
    <line x1="60" y1="58" x2="84" y2="12" {...s}>
      <animate attributeName="y1" values="58;46;58" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Legs hanging */}
    <line x1="56" y1="100" x2="50" y2="138" {...s}>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -12;0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="64" y1="100" x2="70" y2="138" {...s}>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -12;0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="50" y1="138" x2="46" y2="160" {...s}>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -12;0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="70" y1="138" x2="74" y2="160" {...s}>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -12;0 0" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
  </svg>
);

const PlankSVG = () => (
  <svg viewBox="0 0 160 100" className="w-full max-h-52">
    {/* Ground */}
    <line x1="10" y1="88" x2="150" y2="88" stroke="#60A5FA" strokeWidth="1" opacity="0.2" />
    {/* Head */}
    <circle cx="128" cy="48" r="9" stroke="#60A5FA" strokeWidth="2.5" fill="none">
      <animate attributeName="cy" values="48;46;48" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </circle>
    {/* Horizontal torso */}
    <line x1="119" y1="56" x2="52" y2="62" {...s}>
      <animate attributeName="y1" values="56;54;56" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="y2" values="62;60;62" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    {/* Right forearm on ground */}
    <line x1="115" y1="58" x2="105" y2="88" {...s} />
    <line x1="105" y1="88" x2="118" y2="88" {...s} />
    {/* Left forearm on ground */}
    <line x1="80" y1="62" x2="70" y2="88" {...s} />
    <line x1="70" y1="88" x2="83" y2="88" {...s} />
    {/* Hips + legs */}
    <line x1="52" y1="62" x2="30" y2="68" {...s}>
      <animate attributeName="y1" values="62;60;62" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </line>
    <line x1="30" y1="68" x2="20" y2="88" {...s} />
    <line x1="20" y1="88" x2="32" y2="88" {...s} />
    {/* Breathing indicator (subtle pulse on torso) */}
    <circle cx="85" cy="60" r="3" fill="#60A5FA" opacity="0.2">
      <animate attributeName="r" values="3;5;3" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
      <animate attributeName="opacity" values="0.2;0.5;0.2" dur={dur} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" keyTimes="0;0.45;1" />
    </circle>
  </svg>
);

const ExerciseAnimation = ({ id }: { id: string }) => {
  const map: Record<string, React.ReactNode> = {
    'bicep-curl':     <BicepCurlSVG />,
    'hammer-curl':    <BicepCurlSVG />,
    'lateral-raise':  <LateralRaiseSVG />,
    'shoulder-press': <ShoulderPressSVG />,
    'face-pull':      <FacePullSVG />,
    'squat':          <SquatSVG />,
    'rdl':            <RDLSvg />,
    'lunge':          <LungeSVG />,
    'dumbbell-fly':   <DumbbellFlySVG />,
    'bench-press':    <BenchPressSVG />,
    'pushup':         <PushupSVG />,
    'tricep-dip':     <TricepDipSVG />,
    'lat-pulldown':   <LatPulldownSVG />,
    'bent-over-row':  <BentOverRowSVG />,
    'deadlift':       <DeadliftSVG />,
    'jump-rope':      <JumpRopeSVG />,
    'jumping-jacks':  <JumpingJacksSVG />,
    'burpee':         <BurpeeSVG />,
    'pull-up':        <PullUpSVG />,
    'muscle-up':      <PullUpSVG />,
    'plank':          <PlankSVG />,
  };
  return <>{map[id] ?? <BicepCurlSVG />}</>;
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface TemplateLibraryProps {
  onLogout: () => void;
  lang: 'tr' | 'en';
  userName?: string;
  role?: 'trainer' | 'student';
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onLogout, lang, userName, role = 'trainer' }) => {
  const navigate = useNavigate();
  const t = translations[lang];
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const currentUser = (() => {
    try { const s = localStorage.getItem('fittrack_user'); return s ? JSON.parse(s) : null; } catch { return null; }
  })();

  // Plan check: 'bronze' by default, 'silver' or 'gold' unlocks animations
  const userPlan: string = currentUser?.plan || 'bronze';
  const hasPremiumAccess = userPlan === 'silver' || userPlan === 'gold';

  const isTrainer = role === 'trainer';

  // Exercise media state
  const [exerciseMedia, setExerciseMedia] = useState<{ id: number; videoUrl: string; label: string; trainerId: number }[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [showAddMedia, setShowAddMedia] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoLabel, setNewVideoLabel] = useState('');

  useEffect(() => {
    if (!selectedExercise) { setExerciseMedia([]); setShowAddMedia(false); return; }
    const token = localStorage.getItem('fittrack_token');
    if (!token) return;
    setMediaLoading(true);
    fetch(`/api/exercise-media/${selectedExercise.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setExerciseMedia)
      .catch(() => {})
      .finally(() => setMediaLoading(false));
  }, [selectedExercise]);

  const handleAddMedia = async () => {
    if (!newVideoUrl.trim() || !selectedExercise) return;
    const token = localStorage.getItem('fittrack_token');
    if (!token) return;
    await fetch('/api/exercise-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ exerciseId: selectedExercise.id, videoUrl: newVideoUrl.trim(), label: newVideoLabel }),
    });
    // Refresh media list
    const res = await fetch(`/api/exercise-media/${selectedExercise.id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setExerciseMedia(await res.json());
    setNewVideoUrl('');
    setNewVideoLabel('');
    setShowAddMedia(false);
  };

  const handleDeleteMedia = async (mediaId: number) => {
    const token = localStorage.getItem('fittrack_token');
    if (!token) return;
    await fetch(`/api/exercise-media/${mediaId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setExerciseMedia(prev => prev.filter(m => m.id !== mediaId));
  };

  const getEmbedUrl = (url: string): string | null => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
        const vid = u.searchParams.get('v') || u.pathname.split('/').pop() || '';
        return `https://www.youtube.com/embed/${vid}`;
      }
      return url; // raw URL (GIF, mp4, etc.)
    } catch {
      return null;
    }
  };

  const [assignTarget, setAssignTarget] = useState<BodyPart | null>(null);
  const [assignStudentId, setAssignStudentId] = useState<number>(0);
  const [assignDate, setAssignDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [assignStartTime, setAssignStartTime] = useState<string>('09:00');
  const [assignEndTime, setAssignEndTime] = useState<string>('10:00');
  const [assignStudentDropdown, setAssignStudentDropdown] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [realStudents, setRealStudents] = useState<{ id: number; name: string }[]>([]);
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [recurringWeeks, setRecurringWeeks] = useState(4);

  useEffect(() => {
    if (!isTrainer) return;
    const token = localStorage.getItem('fittrack_token');
    fetch('/api/trainer/students', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((data: { id: number; name: string }[]) => {
        setRealStudents(data);
        if (data.length > 0) setAssignStudentId(data[0].id);
      })
      .catch(() => {});
  }, [isTrainer]);

  const handleAssign = async () => {
    const student = realStudents.find(s => s.id === assignStudentId);
    if (!student || !assignTarget) return;
    setAssignError(null);

    // Past date/time validation
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const currentTimeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    if (!recurringEnabled) {
      if (assignDate < todayStr) {
        setAssignError(lang === 'tr' ? 'Geçmiş tarihe seans atanamaz.' : 'Cannot assign to a past date.');
        return;
      }
      if (assignDate === todayStr && assignEndTime && assignEndTime <= currentTimeStr) {
        setAssignError(lang === 'tr' ? 'Geçmiş saate seans atanamaz.' : 'Cannot assign to a past time slot.');
        return;
      }
    }

    // Build list of dates to assign
    const datesToAssign: string[] = [];
    if (recurringEnabled && recurringDays.length > 0) {
      const start = new Date(assignDate + 'T12:00:00');
      for (let w = 0; w < recurringWeeks; w++) {
        for (const dow of recurringDays) {
          const d = new Date(start);
          d.setDate(start.getDate() + w * 7 + ((dow - start.getDay() + 7) % 7));
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          if (!datesToAssign.includes(key)) datesToAssign.push(key);
        }
      }
      datesToAssign.sort();
      // Filter out past dates for recurring
      const filtered = datesToAssign.filter(d => {
        if (d < todayStr) return false;
        if (d === todayStr && assignEndTime && assignEndTime <= currentTimeStr) return false;
        return true;
      });
      if (filtered.length === 0) {
        setAssignError(lang === 'tr' ? 'Seçili günlerde gelecekte geçerli tarih bulunamadı.' : 'No valid future dates found for selected days.');
        return;
      }
      datesToAssign.length = 0;
      datesToAssign.push(...filtered);
    } else {
      datesToAssign.push(assignDate);
    }

    try {
      if (assignStartTime && assignEndTime) {
        const existing: any[] = await api.get('/api/assignments');
        const toLocalDateStr = (d: string) => {
          const dt = new Date(d);
          if (isNaN(dt.getTime())) return d.slice(0, 10);
          return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
        };
        const conflictDate = datesToAssign.find(date =>
          existing.some(a =>
            toLocalDateStr(String(a.assignedDate)) === date &&
            a.startTime && a.endTime &&
            a.startTime < assignEndTime &&
            a.endTime > assignStartTime
          )
        );
        if (conflictDate) {
          setAssignError(lang === 'tr' ? `${conflictDate} tarihinde bu saat aralığında çakışma var!` : `Time conflict on ${conflictDate}!`);
          return;
        }
      }

      for (const date of datesToAssign) {
        await api.post('/api/assignments', {
          studentId: student.id,
          studentName: student.name,
          workoutId: assignTarget.id,
          workoutName: assignTarget.name[lang],
          assignedDate: date,
          startTime: assignStartTime,
          endTime: assignEndTime,
        });
      }
    } catch (err: any) {
      if (err?.error === 'error_time_conflict') {
        setAssignError(lang === 'tr' ? 'Bu saat aralığında zaten bir seans var!' : 'A session already exists in this time slot!');
      } else {
        setAssignError(lang === 'tr' ? 'Bir hata oluştu.' : 'An error occurred.');
      }
      return;
    }
    addNotification({
      type: 'assignment',
      title: lang === 'tr' ? 'Yeni Antrenman Atandı' : 'New Workout Assigned',
      body: recurringEnabled
        ? `${student.name} → ${assignTarget.name[lang]} • ${datesToAssign.length} seans`
        : `${student.name} → ${assignTarget.name[lang]} • ${assignDate} ${assignStartTime}-${assignEndTime}`,
    });
    setAssignSuccess(true);
    setTimeout(() => { setAssignSuccess(false); setAssignTarget(null); setAssignError(null); setRecurringEnabled(false); setRecurringDays([]); }, 1200);
  };

  const handleLogoutClick = () => { onLogout(); window.location.hash = '#/'; };

  return (
    <div className="min-h-screen bg-background-dark pb-32 md:pb-0 md:pl-64">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background-dark/80 backdrop-blur-md border-b border-white/5 px-4 md:px-8 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {selectedBodyPart ? (
              <button
                onClick={() => { setSelectedBodyPart(null); setSelectedExercise(null); }}
                className="size-10 flex items-center justify-center rounded-lg bg-white/5 text-white/60 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
            ) : (
              <div className="text-primary flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <span className="material-symbols-outlined">folder</span>
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                {selectedBodyPart ? selectedBodyPart.name[lang] : t.templateLibrary}
              </h1>
              {selectedBodyPart && (
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                  {selectedBodyPart.exercises.length} {lang === 'tr' ? 'egzersiz' : 'exercises'}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 relative">
            <button className="flex size-10 items-center justify-center rounded-lg bg-white/5 text-white/40">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="size-10 rounded-full border-2 border-primary overflow-hidden active:scale-95 transition-transform"
            >
              <img className="w-full h-full object-cover" src="https://picsum.photos/seed/coach/100/100" alt="Profile" />
            </button>
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)}></div>
                <div className="absolute top-12 right-0 w-48 bg-card-dark border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden">
                  <div className="p-4 border-b border-white/5">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t.signedInAs} {userName || 'Coach'}</p>
                    <p className="text-xs font-bold text-white truncate">{currentUser?.email || 'coach@fittrack.com'}</p>
                  </div>
                  <button onClick={handleLogoutClick} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors">
                    <span className="material-symbols-outlined text-sm">logout</span>
                    {t.logout}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 md:px-8 mt-6 max-w-7xl mx-auto">
        {/* Body Part Grid */}
        {!selectedBodyPart && (
          <div className="grid grid-cols-2 gap-4">
            {bodyParts.map((bp) => (
              <div key={bp.id} className={`group relative overflow-hidden rounded-2xl border ${bp.color} flex flex-col shadow-lg`}>
                <button
                  onClick={() => setSelectedBodyPart(bp)}
                  className="flex flex-col items-center gap-4 text-center p-6 hover:scale-[1.01] active:scale-[0.98] transition-all flex-1"
                >
                  <div className={`size-16 rounded-2xl ${bp.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <span className={`material-symbols-outlined text-4xl ${bp.textColor}`}>{bp.icon}</span>
                  </div>
                  <div>
                    <h2 className="text-base font-black uppercase tracking-tight text-white">{bp.name[lang]}</h2>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${bp.textColor} opacity-70`}>
                      {bp.exercises.length} {lang === 'tr' ? 'egzersiz' : 'exercises'}
                    </p>
                  </div>
                </button>
                {isTrainer && (
                  <button
                    onClick={() => { setAssignTarget(bp); setAssignSuccess(false); }}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 border-t border-white/10 text-xs font-black text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">person_add</span>
                    {lang === 'tr' ? 'Öğrenciye Ata' : 'Assign to Student'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Exercise List */}
        {selectedBodyPart && !selectedExercise && (
          <div className="space-y-3">
            {selectedBodyPart.exercises.map((ex, i) => (
              <button
                key={ex.id}
                onClick={() => setSelectedExercise(ex)}
                className="w-full group flex items-center gap-4 bg-card-dark border border-white/5 hover:border-primary/40 rounded-2xl p-4 transition-all active:scale-[0.98]"
              >
                <div className="size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <span className="text-primary font-black text-lg">{i + 1}</span>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-white group-hover:text-primary transition-colors">{ex.name}</h3>
                  <p className="text-xs text-white/40 mt-0.5">{ex.target[lang]}</p>
                </div>
                <span className="material-symbols-outlined text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward_ios</span>
              </button>
            ))}
          </div>
        )}

        {/* Exercise Detail */}
        {selectedExercise && (
          <div className="space-y-6">
            {/* Back to exercise list */}
            <button
              onClick={() => setSelectedExercise(null)}
              className="flex items-center gap-2 text-white/40 hover:text-white text-sm font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
              {selectedBodyPart?.name[lang]}
            </button>

            {/* Animation Card */}
            <div className="bg-card-dark border border-white/10 rounded-2xl overflow-hidden">
              <div className="bg-background-dark flex items-center justify-center p-6 min-h-[220px] relative">
                {hasPremiumAccess ? (
                  <ExerciseAnimation id={selectedExercise.id} />
                ) : (
                  <>
                    <div className="blur-sm opacity-20 pointer-events-none select-none">
                      <ExerciseAnimation id={selectedExercise.id} />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                      <div className="size-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-white/40">lock</span>
                      </div>
                      <p className="text-sm font-black text-white">{t.silverRequired}</p>
                      <p className="text-xs text-white/40 leading-relaxed">{t.silverRequiredDesc}</p>
                      <button
                        onClick={() => navigate('/plans')}
                        className="mt-1 px-5 py-2 bg-primary text-white rounded-xl font-black text-xs shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                      >
                        {t.upgradePlan}
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="p-5 border-t border-white/5">
                <p className="text-[10px] font-black text-primary/70 uppercase tracking-widest mb-1">{selectedExercise.target[lang]}</p>
                <h2 className="text-2xl font-black text-white">{selectedExercise.name}</h2>
              </div>
            </div>

            {/* Exercise Media / Videos */}
            {(exerciseMedia.length > 0 || isTrainer) && (
              <div className="bg-card-dark border border-white/5 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                    {lang === 'tr' ? 'Video / GIF' : 'Video / GIF'}
                  </p>
                  {isTrainer && (
                    <button
                      onClick={() => setShowAddMedia(v => !v)}
                      className="flex items-center gap-1 text-primary text-[10px] font-black hover:underline"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      {lang === 'tr' ? 'Ekle' : 'Add'}
                    </button>
                  )}
                </div>
                {mediaLoading && <p className="text-white/30 text-xs">{lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}</p>}
                {exerciseMedia.map(m => {
                  const embedUrl = getEmbedUrl(m.videoUrl);
                  return (
                    <div key={m.id} className="space-y-2">
                      {m.label && <p className="text-xs font-bold text-white/60">{m.label}</p>}
                      {embedUrl && (embedUrl.includes('youtube.com/embed') ? (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                          <iframe
                            src={embedUrl}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                          />
                        </div>
                      ) : (
                        <img src={embedUrl} alt={m.label || 'exercise'} className="w-full rounded-xl object-contain max-h-56" />
                      ))}
                      {isTrainer && (
                        <button
                          onClick={() => handleDeleteMedia(m.id)}
                          className="text-red-400/60 hover:text-red-400 text-[10px] font-bold flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          {lang === 'tr' ? 'Sil' : 'Delete'}
                        </button>
                      )}
                    </div>
                  );
                })}
                {isTrainer && showAddMedia && (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <input
                      type="url"
                      placeholder={lang === 'tr' ? 'YouTube URL veya GIF linki...' : 'YouTube URL or GIF link...'}
                      value={newVideoUrl}
                      onChange={e => setNewVideoUrl(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-primary/50"
                    />
                    <input
                      type="text"
                      placeholder={lang === 'tr' ? 'Etiket (opsiyonel)' : 'Label (optional)'}
                      value={newVideoLabel}
                      onChange={e => setNewVideoLabel(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-primary/50"
                    />
                    <button
                      onClick={handleAddMedia}
                      disabled={!newVideoUrl.trim()}
                      className="w-full h-9 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all disabled:opacity-40"
                    >
                      {lang === 'tr' ? 'Kaydet' : 'Save'}
                    </button>
                  </div>
                )}
                {exerciseMedia.length === 0 && !mediaLoading && !isTrainer && (
                  <p className="text-white/20 text-xs">{lang === 'tr' ? 'Henüz video eklenmemiş.' : 'No videos added yet.'}</p>
                )}
              </div>
            )}

            {/* Summary */}
            <div className="bg-card-dark border border-white/5 rounded-2xl p-5">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
                {lang === 'tr' ? 'Özet' : 'Summary'}
              </p>
              <p className="text-sm text-white/80 leading-relaxed">{selectedExercise.summary[lang]}</p>
            </div>

            {/* Tips */}
            <div className="bg-card-dark border border-white/5 rounded-2xl p-5 relative overflow-hidden">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">
                {lang === 'tr' ? 'Doğru Form İpuçları' : 'Correct Form Tips'}
              </p>
              <ul className={`space-y-2 ${!hasPremiumAccess ? 'blur-sm opacity-30 pointer-events-none select-none' : ''}`}>
                {selectedExercise.tips[lang].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[12px]">check</span>
                    </span>
                    <span className="text-sm text-white/70">{tip}</span>
                  </li>
                ))}
              </ul>
              {!hasPremiumAccess && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-card-dark/90 border border-white/10 rounded-xl px-4 py-2">
                    <span className="material-symbols-outlined text-white/40 text-base">lock</span>
                    <span className="text-xs text-white/50 font-bold">{t.lockedTips}</span>
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-3">
              {isTrainer && selectedBodyPart && (
                <button
                  onClick={() => { setAssignTarget(selectedBodyPart); setAssignSuccess(false); }}
                  className="w-full bg-cta-orange text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined">person_add</span>
                  {lang === 'tr' ? 'Öğrenciye Ata' : 'Assign to Student'}
                </button>
              )}
              {!isTrainer && (
                <button
                  onClick={() => window.location.hash = '#/live'}
                  className="w-full bg-primary text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined">play_circle</span>
                  {lang === 'tr' ? 'Antrenmanı Başlat' : 'Start Workout'}
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <BottomNav role={role} lang={lang} />

      {/* Assign to Student Modal */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center" onClick={() => setAssignTarget(null)}>
          <div className="w-full max-w-lg bg-[#0f1923] border border-white/10 rounded-t-3xl p-6 pb-10 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">{lang === 'tr' ? 'Öğrenciye Ata' : 'Assign to Student'}</h2>
                <p className="text-xs text-primary mt-0.5 font-semibold">{assignTarget.name[lang]}</p>
              </div>
              <button onClick={() => setAssignTarget(null)} className="size-8 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {assignSuccess ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="size-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-green-400">check_circle</span>
                </div>
                <p className="text-white font-black">{lang === 'tr' ? 'Başarıyla Atandı!' : 'Successfully Assigned!'}</p>
              </div>
            ) : (
              <>
                {/* Student selector */}
                <div className="relative">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{lang === 'tr' ? 'Öğrenci' : 'Student'}</p>
                  <button
                    type="button"
                    onClick={() => setAssignStudentDropdown(v => !v)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm flex items-center justify-between"
                  >
                    <span>{realStudents.find(s => s.id === assignStudentId)?.name ?? (realStudents.length === 0 ? (lang === 'tr' ? 'Öğrenci yok' : 'No students') : '...')}</span>
                    <span className="material-symbols-outlined text-white/50 text-base">{assignStudentDropdown ? 'expand_less' : 'expand_more'}</span>
                  </button>
                  {assignStudentDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-white/10 rounded-xl overflow-hidden shadow-xl">
                      {realStudents.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => { setAssignStudentId(s.id); setAssignStudentDropdown(false); }}
                          className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${assignStudentId === s.id ? 'bg-primary text-white' : 'text-white hover:bg-white/10'}`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date picker */}
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{lang === 'tr' ? 'Tarih' : 'Date'}</p>
                  <input
                    type="date"
                    value={assignDate}
                    min={(() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })()}
                    onChange={e => setAssignDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/60 [color-scheme:dark]"
                  />
                </div>

                {/* Recurring toggle */}
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{lang === 'tr' ? 'Tekrarlayan' : 'Recurring'}</p>
                    <button
                      type="button"
                      onClick={() => setRecurringEnabled(v => !v)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${recurringEnabled ? 'bg-primary' : 'bg-white/10'}`}
                    >
                      <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${recurringEnabled ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                  {recurringEnabled && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-[9px] text-white/30 font-bold uppercase mb-2">{lang === 'tr' ? 'Hangi günler?' : 'Which days?'}</p>
                        <div className="flex gap-1.5">
                          {(lang === 'tr'
                            ? ['Pz','Pt','Sa','Ça','Pe','Cu','Ct']
                            : ['Su','Mo','Tu','We','Th','Fr','Sa']
                          ).map((label, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setRecurringDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx])}
                              className={`flex-1 py-1.5 rounded-lg text-[9px] font-black transition-colors ${recurringDays.includes(idx) ? 'bg-primary text-white' : 'bg-white/5 text-white/40'}`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] text-white/30 font-bold uppercase mb-1">{lang === 'tr' ? `Kaç hafta? (${recurringWeeks})` : `How many weeks? (${recurringWeeks})`}</p>
                        <input
                          type="range"
                          min="1"
                          max="12"
                          value={recurringWeeks}
                          onChange={e => setRecurringWeeks(parseInt(e.target.value))}
                          className="w-full accent-primary"
                        />
                        <div className="flex justify-between text-[8px] text-white/20 font-bold">
                          <span>1</span><span>4</span><span>8</span><span>12</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Time range */}
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{lang === 'tr' ? 'Saat Aralığı' : 'Time Range'}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-[9px] text-white/30 font-bold uppercase mb-1">{lang === 'tr' ? 'Başlangıç' : 'Start'}</p>
                      <input
                        type="time"
                        value={assignStartTime}
                        min={(() => { const n = new Date(); const t = `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`; const today = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; return assignDate === today ? t : undefined; })()}
                        onChange={e => setAssignStartTime(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/60 [color-scheme:dark]"
                      />
                    </div>
                    <span className="text-white/30 font-black mt-5">→</span>
                    <div className="flex-1">
                      <p className="text-[9px] text-white/30 font-bold uppercase mb-1">{lang === 'tr' ? 'Bitiş' : 'End'}</p>
                      <input
                        type="time"
                        value={assignEndTime}
                        onChange={e => setAssignEndTime(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/60 [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                {assignError && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                    <span className="material-symbols-outlined text-red-400 text-base">error</span>
                    <p className="text-red-400 text-sm font-semibold">{assignError}</p>
                  </div>
                )}

                <button
                  onClick={handleAssign}
                  className="w-full bg-primary text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined">event_available</span>
                  {lang === 'tr' ? 'Ata' : 'Assign'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;
