const fs = require('fs');

const d = './pages';
const files = fs.readdirSync(d);

files.forEach(f => {
  if (!f.endsWith('.tsx')) return;
  let p = d + '/' + f;
  let c = fs.readFileSync(p, 'utf8');
  let original = c;

  // Replace bg-cta-orange combinations
  c = c.replace(/bg-cta-orange(.*?)text-white/g, 'bg-white$1text-[#0B2B53]');
  c = c.replace(/text-cta-orange/g, 'text-white');
  c = c.replace(/'bg-cta-orange'/g, "'bg-white text-[#0B2B53]'");
  c = c.replace(/bg-cta-orange/g, 'bg-white text-[#0B2B53] dark:text-[#0B2B53]');

  // Replace specific bg-primary button in CheckoutScreen
  if (f === 'CheckoutScreen.tsx') {
    c = c.replace(/bg-primary text-white font-black uppercase/g, 'bg-white text-[#0B2B53] font-black uppercase');
  }

  // Replace secondary button in StudentDashboard.tsx
  if (f === 'StudentDashboard.tsx') {
    c = c.replace(/'bg-primary'/g, "'bg-white text-[#0B2B53]'");
  }

  if (c !== original) {
    fs.writeFileSync(p, c);
    console.log('Updated ' + p);
  }
});
