import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';
import { translations } from '../App';
import { addNotification } from '../utils/notifications';

interface MessagesScreenProps {
  lang: 'tr' | 'en';
  role: 'trainer' | 'student';
  userName?: string;
}

type MsgType = 'text' | 'file' | 'image' | 'voice';
interface Message {
  id?: number;
  from: 'me' | 'them';
  text: string;
  time: string;
  type?: MsgType;
  fileName?: string;
}
interface Contact {
  id: number;
  name: string;
  username: string;
  avatar: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
}

const apiHeaders = () => {
  const token = localStorage.getItem('fittrack_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const MessagesScreen: React.FC<MessagesScreenProps> = ({ lang, role }) => {
  const t = translations[lang];
  const navigate = useNavigate();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMoreMsgs, setLoadingMoreMsgs] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showTrainerProfileModal, setShowTrainerProfileModal] = useState(false);
  const [showNewMsgModal, setShowNewMsgModal] = useState(false);
  const [newMsgSearch, setNewMsgSearch] = useState('');
  const [allContacts, setAllContacts] = useState<Contact[]>([]); // for new message search

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const connectedTrainer = (() => {
    try { return JSON.parse(localStorage.getItem('fittrack_connected_trainer') || 'null'); } catch { return null; }
  })();

  // ─── Load contacts ───────────────────────────────────
  const loadContacts = useCallback(async () => {
    try {
      // Get conversation list (contacts who have exchanged messages)
      const res = await fetch('/api/conversations', { headers: apiHeaders() });
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }

      // For trainer: also load all students for "new message"
      if (role === 'trainer') {
        const r2 = await fetch('/api/trainer/students', { headers: apiHeaders() });
        if (r2.ok) {
          const students = await r2.json();
          setAllContacts(students.map((s: any) => ({
            id: s.id, name: s.name, username: s.username,
            avatar: s.avatar, lastMsg: '', time: '', unread: 0, online: false,
          })));
        }
      } else if (connectedTrainer?.id) {
        // Student: trainer is the only contact
        setAllContacts([{
          id: connectedTrainer.id,
          name: connectedTrainer.name,
          username: connectedTrainer.username || '',
          avatar: connectedTrainer.avatar || `https://picsum.photos/seed/${connectedTrainer.username}/100/100`,
          lastMsg: '', time: '', unread: 0, online: false,
        }]);
      }
    } catch { /* ignore */ } finally {
      setLoadingContacts(false);
    }
  }, [role]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  // ─── Load messages for selected contact ──────────────
  const loadMessages = useCallback(async (contactId: number, silent = false) => {
    if (!silent) setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/messages/${contactId}?limit=50`, { headers: apiHeaders() });
      if (res.ok) {
        const newMsgs = await res.json();
        setHasMoreMessages(newMsgs.length === 50);
        setMessages(prev => {
          if (prev.length !== newMsgs.length) return newMsgs;
          if (prev.length === 0) return newMsgs;
          const lastPrev = prev[prev.length - 1];
          const lastNew = newMsgs[newMsgs.length - 1];
          if (lastPrev?.id !== lastNew?.id) return newMsgs;
          return prev; // no change, skip re-render
        });
      }
    } catch { /* ignore */ } finally { if (!silent) setLoadingMsgs(false); }
  }, []);

  const loadMoreMessages = async () => {
    if (!selectedContact || messages.length === 0 || loadingMoreMsgs) return;
    const oldest = messages[0];
    if (!oldest.id) return;
    setLoadingMoreMsgs(true);
    try {
      const res = await fetch(`/api/messages/${selectedContact.id}?limit=50&before=${oldest.id}`, { headers: apiHeaders() });
      if (res.ok) {
        const older = await res.json();
        setHasMoreMessages(older.length === 50);
        setMessages(prev => [...older, ...prev]);
      }
    } catch {} finally { setLoadingMoreMsgs(false); }
  };

  // ─── Poll for new messages every 3s ──────────────────
  useEffect(() => {
    if (!selectedContact) { if (pollRef.current) clearInterval(pollRef.current); return; }
    pollRef.current = setInterval(() => loadMessages(selectedContact.id, true), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedContact, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => { if (recordTimerRef.current) clearInterval(recordTimerRef.current); };
  }, []);

  const getNowTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setMessages([]);
    loadMessages(contact.id);
    setInputText('');
    setIsTyping(false);
    setShowNewMsgModal(false);
    setNewMsgSearch('');
    // Update contact in list: clear unread
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unread: 0 } : c));
  };

  const handleBack = () => {
    setSelectedContact(null);
    setMessages([]);
    setInputText('');
    setIsTyping(false);
    setShowChatMenu(false);
    loadContacts(); // refresh contact list
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !selectedContact) return;

    // Optimistic UI
    const optimistic: Message = { from: 'me', text: trimmed, time: getNowTime(), type: 'text' };
    setMessages(prev => [...prev, optimistic]);
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ receiverId: selectedContact.id, content: trimmed, type: 'text' }),
      });
      // Refresh contacts to update last message
      loadContacts();
    } catch { /* message stays optimistic */ }

    addNotification({
      type: 'message',
      title: lang === 'tr' ? `${selectedContact.name}'a mesaj gönderildi` : `Message sent to ${selectedContact.name}`,
      body: trimmed.slice(0, 80),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const uploadFile = async (file: File | Blob, filename?: string): Promise<{ url: string; name: string } | null> => {
    const token = localStorage.getItem('fittrack_token');
    if (!token) return null;
    const formData = new FormData();
    formData.append('file', file, filename || (file instanceof File ? file.name : 'audio.webm'));
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  };

  const sendFileMessage = async (url: string, name: string, type: 'image' | 'file' | 'voice') => {
    if (!selectedContact) return;
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ receiverId: selectedContact.id, content: url, type, fileName: name }),
      });
      loadContacts();
    } catch { /* stays optimistic */ }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedContact) return;
    const isImage = file.type.startsWith('image/');
    const msgType: 'image' | 'file' = isImage ? 'image' : 'file';
    // Optimistic
    const optimistic: Message = { from: 'me', text: file.name, time: getNowTime(), type: msgType, fileName: file.name };
    setMessages(prev => [...prev, optimistic]);
    e.target.value = '';
    const result = await uploadFile(file);
    if (result) {
      await sendFileMessage(result.url, result.name, msgType);
      // Update optimistic message with real URL
      setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, text: result.url } : m));
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
        const mr = new MediaRecorder(stream, { mimeType });
        audioChunksRef.current = [];
        mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        mr.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          const secs = recordSeconds;
          setIsRecording(false);
          setRecordSeconds(0);
          const dur = secs < 60 ? `0:${secs.toString().padStart(2,'0')}` : `${Math.floor(secs/60)}:${(secs%60).toString().padStart(2,'0')}`;
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          // Optimistic
          setMessages(prev => [...prev, { from: 'me', text: dur, time: getNowTime(), type: 'voice' }]);
          const result = await uploadFile(blob, `voice-${Date.now()}.webm`);
          if (result && selectedContact) {
            await sendFileMessage(result.url, dur, 'voice');
          }
        };
        mr.start();
        mediaRecorderRef.current = mr;
        setIsRecording(true);
        setRecordSeconds(0);
        recordTimerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
      } catch {
        // Microphone permission denied — fall back to timer-only mock
        setIsRecording(true);
        setRecordSeconds(0);
        recordTimerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
      }
    }
  };

  const cancelRecording = () => {
    mediaRecorderRef.current?.stop();
    audioChunksRef.current = [];
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecording(false);
    setRecordSeconds(0);
  };

  const recDur = recordSeconds < 60
    ? `0:${recordSeconds.toString().padStart(2,'0')}`
    : `${Math.floor(recordSeconds/60)}:${(recordSeconds%60).toString().padStart(2,'0')}`;

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const newMsgFiltered = allContacts.filter(c =>
    c.name.toLowerCase().includes(newMsgSearch.toLowerCase())
  );

  const todayLabel = lang === 'tr' ? 'Bugün' : 'Today';
  const onlineLabel = lang === 'tr' ? 'Çevrimiçi' : 'Online';

  // ─── CHAT VIEW ────────────────────────────────────────
  if (selectedContact !== null) {
    const contact = selectedContact;
    const isStudent = role === 'student';
    const statusLabel = isStudent ? `${onlineLabel} • PT` : `${onlineLabel} • ${lang === 'tr' ? 'Öğrenci' : 'Student'}`;

    return (
      <div className="h-screen flex flex-col bg-background-dark md:pl-64">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
        <input ref={imageInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />

        {/* Chat Header */}
        <header className="flex items-center bg-background-dark/95 backdrop-blur-md px-4 py-3 border-b border-white/5 gap-3 sticky top-0 z-10 shrink-0">
          <button onClick={handleBack} className="flex size-9 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all active:scale-95 shrink-0">
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
          <div className="relative shrink-0">
            <div className="size-10 rounded-full overflow-hidden border-2 border-primary">
              <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-sm leading-tight truncate">{contact.name}</h2>
            <p className="text-primary text-[10px] font-bold uppercase tracking-widest">{role === 'student' ? 'PT' : (lang === 'tr' ? 'Öğrenci' : 'Student')}</p>
          </div>
          <div className="flex gap-1.5 shrink-0 relative">
            <button className="flex size-9 items-center justify-center rounded-xl bg-white/5 text-white/20 cursor-not-allowed" title={lang === 'tr' ? 'Yakında' : 'Coming soon'}>
              <span className="material-symbols-outlined text-xl">video_call</span>
            </button>
            <button onClick={() => setShowChatMenu(v => !v)} className="flex size-9 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all active:scale-95">
              <span className="material-symbols-outlined text-xl">more_vert</span>
            </button>
            {showChatMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowChatMenu(false)}></div>
                <div className="absolute top-11 right-0 w-52 bg-card-dark border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden">
                  <button onClick={() => { setShowChatMenu(false); if (role === 'student') setShowTrainerProfileModal(true); else navigate(`/students?id=${contact.id}`); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/5 transition-colors">
                    <span className="material-symbols-outlined text-base text-white/40">person</span>
                    {lang === 'tr' ? 'Profili Görüntüle' : 'View Profile'}
                  </button>
                  <button onClick={() => { setMessages([]); setShowChatMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/5 transition-colors border-t border-white/5">
                    <span className="material-symbols-outlined text-base text-white/40">delete_sweep</span>
                    {lang === 'tr' ? 'Sohbeti Temizle' : 'Clear Chat'}
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-3 max-w-3xl w-full mx-auto">
          <div className="flex justify-center py-2">
            <span className="bg-white/5 text-white/30 text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full border border-white/5">{todayLabel}</span>
          </div>

          {hasMoreMessages && !loadingMsgs && (
            <div className="flex justify-center py-3">
              <button
                onClick={loadMoreMessages}
                disabled={loadingMoreMsgs}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/50 text-xs font-bold hover:bg-white/10 active:scale-95 transition-all disabled:opacity-40 flex items-center gap-2"
              >
                {loadingMoreMsgs
                  ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  : <span className="material-symbols-outlined text-sm">expand_less</span>
                }
                {lang === 'tr' ? 'Daha fazla yükle' : 'Load more'}
              </button>
            </div>
          )}

          {loadingMsgs && (
            <div className="flex justify-center py-8">
              <span className="material-symbols-outlined text-white/20 text-3xl animate-spin">progress_activity</span>
            </div>
          )}

          {!loadingMsgs && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="material-symbols-outlined text-4xl text-white/20">chat_bubble</span>
              <p className="text-white/30 text-sm">{lang === 'tr' ? 'Henüz mesaj yok. Merhaba de!' : 'No messages yet. Say hello!'}</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-end gap-2 ${msg.from === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>
              {msg.from === 'them' && <img src={contact.avatar} alt={contact.name} className="size-7 rounded-full object-cover shrink-0 mb-1" />}
              <div className={`flex flex-col gap-1 max-w-[75%] ${msg.from === 'me' ? 'items-end' : 'items-start'}`}>
                {msg.type === 'voice' ? (
                  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-sm ${msg.from === 'me' ? 'bg-primary text-white rounded-br-sm' : 'bg-card-dark border border-white/5 rounded-bl-sm'}`}>
                    <span className="material-symbols-outlined text-lg">mic</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className="w-0.5 rounded-full bg-current opacity-50" style={{ height: `${5 + Math.abs(Math.sin(i * 0.8)) * 10}px` }}></div>
                      ))}
                    </div>
                    <span className="text-xs font-bold opacity-80 tabular-nums">{msg.text}</span>
                  </div>
                ) : msg.type === 'image' ? (
                  msg.text.startsWith('/uploads/') ? (
                    <a href={msg.text} target="_blank" rel="noopener noreferrer">
                      <img src={msg.text} alt={msg.fileName || 'image'} className="max-w-[220px] rounded-2xl object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                    </a>
                  ) : (
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-sm ${msg.from === 'me' ? 'bg-primary text-white rounded-br-sm' : 'bg-card-dark border border-white/5 rounded-bl-sm'}`}>
                      <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${msg.from === 'me' ? 'bg-white/20' : 'bg-primary/20'}`}>
                        <span className="material-symbols-outlined text-lg">image</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-tight max-w-[130px] truncate">{msg.fileName || msg.text}</p>
                        <p className="text-[10px] opacity-60 mt-0.5">{lang === 'tr' ? 'Görsel' : 'Image'}</p>
                      </div>
                    </div>
                  )
                ) : msg.type === 'file' ? (
                  <a href={msg.text.startsWith('/uploads/') ? msg.text : undefined} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-sm ${msg.from === 'me' ? 'bg-primary text-white rounded-br-sm' : 'bg-card-dark border border-white/5 rounded-bl-sm'}`}>
                    <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${msg.from === 'me' ? 'bg-white/20' : 'bg-primary/20'}`}>
                      <span className="material-symbols-outlined text-lg">description</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight max-w-[130px] truncate">{msg.fileName || msg.text}</p>
                      <p className="text-[10px] opacity-60 mt-0.5">{lang === 'tr' ? 'Dosya' : 'File'}</p>
                    </div>
                  </a>
                ) : (
                  <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.from === 'me' ? 'bg-primary text-white rounded-br-sm' : 'bg-card-dark border border-white/5 text-white rounded-bl-sm'}`}>
                    {msg.text}
                  </div>
                )}
                <span className="text-[9px] text-white/30 font-medium px-1">{msg.time}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-end gap-2">
              <img src={contact.avatar} alt="" className="size-7 rounded-full object-cover shrink-0 mb-1" />
              <div className="bg-card-dark border border-white/5 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div key={i} className="size-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: `${delay}s` }}></div>
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input */}
        <div className="shrink-0 px-4 py-3 border-t border-white/5 bg-background-dark/95 backdrop-blur-sm max-w-3xl w-full mx-auto">
          {isRecording ? (
            <div className="flex items-center gap-3 bg-card-dark border border-red-500/30 rounded-2xl px-4 py-3">
              <div className="size-2.5 bg-red-500 rounded-full animate-pulse shrink-0"></div>
              <div className="flex-1 flex items-center gap-0.5">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="w-0.5 bg-red-400/60 rounded-full animate-pulse" style={{ height: `${4 + Math.random() * 12}px`, animationDelay: `${i * 0.05}s` }}></div>
                ))}
              </div>
              <span className="text-red-400 text-sm font-mono font-bold tabular-nums shrink-0">{recDur}</span>
              <button onClick={cancelRecording} className="text-white/40 hover:text-red-400 transition-colors shrink-0"><span className="material-symbols-outlined text-xl">close</span></button>
              <button onClick={handleMicClick} className="size-10 flex items-center justify-center bg-red-500 rounded-xl text-white hover:bg-red-600 active:scale-95 transition-all shrink-0"><span className="material-symbols-outlined text-xl">send</span></button>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="size-10 shrink-0 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all active:scale-95"><span className="material-symbols-outlined text-xl">attach_file</span></button>
              <button onClick={() => imageInputRef.current?.click()} className="size-10 shrink-0 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all active:scale-95"><span className="material-symbols-outlined text-xl">photo_camera</span></button>
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder={lang === 'tr' ? 'Mesaj yaz...' : 'Type a message...'}
                  className="w-full bg-card-dark border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/30 text-sm resize-none outline-none focus:border-primary/40 transition-colors max-h-[120px] leading-relaxed"
                />
              </div>
              {inputText.trim() ? (
                <button onClick={handleSend} className="size-10 shrink-0 flex items-center justify-center bg-primary rounded-xl text-white hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20"><span className="material-symbols-outlined text-xl">send</span></button>
              ) : (
                <button onClick={handleMicClick} className="size-10 shrink-0 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all active:scale-95"><span className="material-symbols-outlined text-xl">mic</span></button>
              )}
            </div>
          )}
        </div>

        {/* Trainer Profile Modal (student only) */}
        {showTrainerProfileModal && connectedTrainer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center md:justify-center" onClick={() => setShowTrainerProfileModal(false)}>
            <div className="w-full md:max-w-md bg-card-dark rounded-t-3xl md:rounded-2xl p-6" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />
              <div className="flex flex-col items-center mb-4">
                <img src={connectedTrainer.avatar} alt={connectedTrainer.name} className="size-20 rounded-2xl border-2 border-primary/40 object-cover mb-3" />
                <h2 className="text-xl font-black text-white">{connectedTrainer.name}</h2>
                <span className="mt-1.5 text-[10px] font-black uppercase px-3 py-1 rounded-full bg-primary/20 text-primary">Personal Trainer</span>
              </div>
              <button onClick={() => setShowTrainerProfileModal(false)} className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3 font-black text-sm mt-2">
                {lang === 'tr' ? 'Kapat' : 'Close'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── CONTACT LIST VIEW ────────────────────────────────
  return (
    <div className="min-h-screen bg-background-dark pb-32 md:pb-0 md:pl-64">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background-dark/90 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-xl p-2.5">
              <span className="material-symbols-outlined text-primary text-2xl">chat_bubble</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-white">{lang === 'tr' ? 'Mesajlar' : 'Messages'}</h1>
              <p className="text-xs text-white/40">{contacts.reduce((a, c) => a + c.unread, 0) > 0 ? `${contacts.reduce((a, c) => a + c.unread, 0)} ${lang === 'tr' ? 'okunmamış' : 'unread'}` : lang === 'tr' ? 'Tümü okundu' : 'All read'}</p>
            </div>
          </div>
          <button onClick={() => setShowNewMsgModal(true)} className="bg-white/5 rounded-xl p-2.5 hover:bg-white/10 transition-colors active:scale-95">
            <span className="material-symbols-outlined text-white text-2xl">edit_square</span>
          </button>
        </div>
        <div className="relative max-w-2xl mx-auto">
          <span className="material-symbols-outlined text-white/40 absolute left-3 top-1/2 -translate-y-1/2 text-xl">search</span>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={lang === 'tr' ? 'Mesajlarda ara...' : 'Search messages...'} className="w-full bg-card-dark border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/30 text-sm outline-none focus:border-primary/40 transition-colors" />
        </div>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto flex flex-col gap-2">
        {loadingContacts && (
          <div className="flex justify-center py-16">
            <span className="material-symbols-outlined text-white/20 text-3xl animate-spin">progress_activity</span>
          </div>
        )}

        {!loadingContacts && filteredContacts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <span className="material-symbols-outlined text-5xl text-white/10">chat_bubble</span>
            <p className="text-white/30 text-sm text-center">
              {contacts.length === 0
                ? (lang === 'tr' ? 'Henüz mesajlaşma yok.\nYeni mesaj başlatmak için + tuşuna bas.' : 'No conversations yet.\nTap + to start a new message.')
                : (lang === 'tr' ? 'Sonuç bulunamadı' : 'No results found')}
            </p>
            <button onClick={() => setShowNewMsgModal(true)} className="px-5 py-2.5 bg-primary text-white rounded-xl font-black text-sm flex items-center gap-2 hover:bg-primary/90 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-lg">edit_square</span>
              {lang === 'tr' ? 'Yeni Mesaj' : 'New Message'}
            </button>
          </div>
        )}

        {filteredContacts.map(contact => (
          <button key={contact.id} onClick={() => handleSelectContact(contact)} className="bg-card-dark border border-white/5 rounded-2xl p-4 flex items-center gap-3 hover:border-primary/30 transition-all active:scale-[0.98] w-full text-left">
            <div className="relative shrink-0">
              <img src={contact.avatar} alt={contact.name} className="size-12 rounded-full object-cover border-2 border-white/10" />
              {contact.online && <div className="absolute bottom-0 right-0 size-3 bg-green-400 rounded-full border-2 border-card-dark"></div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className={`font-bold text-sm truncate ${contact.unread > 0 ? 'text-white' : 'text-white/80'}`}>{contact.name}</span>
                <span className="text-[10px] text-white/30 shrink-0 ml-2">{contact.time}</span>
              </div>
              <p className={`text-xs truncate ${contact.unread > 0 ? 'text-white/70 font-semibold' : 'text-white/30'}`}>
                {contact.lastMsg || (lang === 'tr' ? 'Mesaj yok' : 'No messages')}
              </p>
            </div>
            {contact.unread > 0 && (
              <span className="size-5 bg-primary rounded-full text-[10px] text-white flex items-center justify-center font-black shrink-0">{contact.unread > 9 ? '9+' : contact.unread}</span>
            )}
          </button>
        ))}
      </div>

      {/* New Message Modal */}
      {showNewMsgModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center md:justify-center" onClick={() => setShowNewMsgModal(false)}>
          <div className="w-full md:max-w-md bg-card-dark rounded-t-3xl md:rounded-2xl p-5 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white">{lang === 'tr' ? 'Yeni Mesaj' : 'New Message'}</h3>
              <button onClick={() => setShowNewMsgModal(false)} className="text-white/30 hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </div>
            <input type="text" value={newMsgSearch} onChange={e => setNewMsgSearch(e.target.value)} placeholder={lang === 'tr' ? 'Kişi ara...' : 'Search people...'} className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-primary/40 transition-colors mb-3" />
            <div className="overflow-y-auto flex flex-col gap-2">
              {newMsgFiltered.length === 0 && (
                <p className="text-white/30 text-sm text-center py-6">{lang === 'tr' ? 'Kişi bulunamadı' : 'No contacts found'}</p>
              )}
              {newMsgFiltered.map(c => (
                <button key={c.id} onClick={() => handleSelectContact(c)} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors text-left w-full">
                  <img src={c.avatar} alt={c.name} className="size-10 rounded-full object-cover border border-white/10" />
                  <div>
                    <p className="text-white font-semibold text-sm">{c.name}</p>
                    <p className="text-white/40 text-xs">@{c.username}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav role={role} lang={lang} />
    </div>
  );
};

export default MessagesScreen;
