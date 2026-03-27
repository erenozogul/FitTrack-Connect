
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';
import { WorkoutTemplate } from '../types';

interface TemplateLibraryProps {
  onLogout: () => void;
  lang: 'tr' | 'en';
  userName?: string;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onLogout, lang, userName }) => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [formData, setFormData] = useState({
    title: '', level: 'Beginner', category: 'Fat Loss', duration: '30 Mins', image: ''
  });

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('fittrack_token');
      const res = await fetch('/api/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('fittrack_token');
      // Set a placeholder image if empty
      const finalImage = formData.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3KtbbkRy-0cEnBg1lQUOODaSrdq83LjmtIHOJza6jPexcMWW4v5Af9A6n67GIuWqdsY1iHCYUQpUX8nJ0mTddt1ojyV-7GaUXfMO6zuV5Llyou-hcU3bQgNdNdtBte6nbT2ByQziu-FHmsKTIw75OyqgeRU5xjlwiSV2vpkmaD6lwYZeZOlgYnArcBD-O_hzfxTxFw8aqQoCKfrUg0Ymz0XIc_8Gp1c_qPdT8j0QdDRXCjjq1FMW3rY9A3OX5OFbPmblw5onIC9E';
      
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({...formData, image: finalImage})
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ title: '', level: 'Beginner', category: 'Fat Loss', duration: '30 Mins', image: '' });
        fetchTemplates();
      }
    } catch (error) {
      console.error('Create error:', error);
    }
  };


  return (
    <div className="min-h-screen bg-background-dark pb-32 md:pb-0 md:pl-64">
      <header className="sticky top-0 z-40 bg-background-dark/80 backdrop-blur-md border-b border-white/5 px-4 md:px-8 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="text-primary flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <span className="material-symbols-outlined">folder</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Template Library</h1>
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

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)}></div>
                <div className="absolute top-12 right-0 w-48 bg-card-dark border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-white/5">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Signed in as {userName || 'Coach'}</p>
                    <p className="text-xs font-bold text-white truncate">coach@fittrack.com</p>
                  </div>
                  <button 
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Çıkış Yap
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 md:px-8 mt-6 space-y-8 max-w-7xl mx-auto">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20">search</span>
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card-dark border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-primary focus:border-primary transition-all text-white"
            placeholder="Search workout templates..."
          />
          <button onClick={() => alert('Advanced filters coming soon!')} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:text-white transition-colors">
            <span className="material-symbols-outlined">tune</span>
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
          {['All', 'Fat Loss', 'Muscle Gain', 'Mobility', 'Strength'].map((cat) => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={`flex h-10 shrink-0 items-center justify-center rounded-full px-6 font-semibold text-xs transition-colors cursor-pointer ${cat === activeCategory ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-card-dark border border-white/5 text-white/60 hover:bg-white/5'}`}>
              {cat}
            </button>
          ))}
        </div>

        <div onClick={() => setShowModal(true)} className="rounded-xl border-2 border-dashed border-white/10 bg-card-dark p-6 text-center group cursor-pointer hover:border-primary/60 transition-all">
          <div className="flex flex-col items-center gap-2">
            <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">video_call</span>
            </div>
            <h3 className="font-bold text-lg text-primary">New Media Asset</h3>
            <p className="text-xs text-white/40">Upload workout videos or animations (MP4, GIF)</p>
            <button className="mt-4 px-6 py-2 bg-white text-[#0B2B53] rounded-lg text-xs font-bold shadow-lg shadow-cta-orange/20">
              Upload Video
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
            return matchesSearch && matchesCategory;
          }).map((template) => (
            <div key={template.id} className="group relative overflow-hidden rounded-xl bg-card-dark border border-white/5 hover:border-primary/40 transition-all">
              <div className="flex h-32">
                <div className="w-1/3 relative">
                  <img className="w-full h-full object-cover" src={template.image} alt={template.title} />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background-dark/80"></div>
                </div>
                <div className="w-2/3 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm group-hover:text-primary transition-colors">{template.title}</h3>
                      <button className="text-white/20 hover:text-white">
                        <span className="material-symbols-outlined text-xl">more_vert</span>
                      </button>
                    </div>
                    {template.category && <p className="text-xs text-white/50">{template.category}</p>}
                    <div className="flex gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        template.level === 'Advanced' ? 'bg-red-500/20 text-red-400' : 
                        template.level === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {template.level}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[8px] font-black uppercase tracking-wider">
                        {template.duration}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] text-white/40">
                      {template.updatedAt ? `Updated ${template.updatedAt}` : 'Just now'}
                    </p>
                    <button 
                      onClick={() => navigate('/live')}
                      className="flex items-center gap-1 bg-white text-[#0B2B53] px-3 py-1 rounded-lg text-[10px] font-bold uppercase"
                    >
                      Assign <span className="material-symbols-outlined text-[14px]">person_add</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <button onClick={() => setShowModal(true)} className="fixed bottom-24 md:bottom-12 right-6 md:right-12 size-14 bg-white text-[#0B2B53] rounded-full shadow-lg shadow-cta-orange/20 flex items-center justify-center group hover:scale-110 transition-transform z-40">
        <span className="material-symbols-outlined text-3xl font-bold">add</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card-dark border border-white/10 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-white">Create New Template</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Title</label>
                <input required className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="E.g. Full Body HIIT" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/60 mb-1 block">Level</label>
                  <select className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/60 mb-1 block">Category</label>
                  <select className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="Fat Loss">Fat Loss</option>
                    <option value="Muscle Gain">Muscle Gain</option>
                    <option value="Mobility">Mobility</option>
                    <option value="Strength">Strength</option>
                    <option value="All">All</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Duration</label>
                <input required className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="E.g. 45 Mins" />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Image URL (Optional)</label>
                <input className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="https://..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav role="trainer" lang={lang} />
    </div>
  );
};

export default TemplateLibrary;
