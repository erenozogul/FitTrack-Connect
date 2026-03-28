
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/Navigation';
import { translations } from '../App';
import { addNotification } from '../utils/notifications';

interface MessagesScreenProps {
  lang: 'tr' | 'en';
  role: 'trainer' | 'student';
  userName?: string;
}

const mockContacts = [
  { id: 1, name: "Ayşe Kaya", avatar: "https://picsum.photos/seed/ayse/100/100", lastMsg: { tr: "Bugün antrenman nasıldı?", en: "How was today's workout?" }, time: "09:41", unread: 2, online: true },
  { id: 2, name: "Mehmet Yılmaz", avatar: "https://picsum.photos/seed/mehmet/100/100", lastMsg: { tr: "Planımı güncelleyebilir misin?", en: "Can you update my plan?" }, time: "Dün", unread: 0, online: false },
  { id: 3, name: "Zeynep Şahin", avatar: "https://picsum.photos/seed/zeynep/100/100", lastMsg: { tr: "Teşekkürler koç! 💪", en: "Thanks coach! 💪" }, time: "Pzt", unread: 0, online: true },
  { id: 4, name: "Can Öztürk", avatar: "https://picsum.photos/seed/can/100/100", lastMsg: { tr: "Yarın gelebilir miyim?", en: "Can I come tomorrow?" }, time: "Pzt", unread: 1, online: false },
  { id: 5, name: "Selin Arslan", avatar: "https://picsum.photos/seed/selin/100/100", lastMsg: { tr: "Beslenme planımı aldım", en: "Got my nutrition plan" }, time: "Paz", unread: 0, online: true },
];

type Message = { from: 'me' | 'them'; text: string; time: string; type?: 'text' | 'file' | 'image' | 'voice'; fileName?: string };
type Contact = typeof mockContacts[0];

const mockMessages: Record<number, Message[]> = {
  1: [
    { from: 'them', text: "Merhaba! Bugün antrenman nasıldı?", time: "09:38" },
    { from: 'me', text: "Çok iyiydi, teşekkürler! Squat'ta PR kırdım 🎉", time: "09:40" },
    { from: 'them', text: "Harika! Yarın bacak programını güncelleyeceğim.", time: "09:41" },
  ],
  2: [{ from: 'them', text: "Koç, planımı güncelleyebilir misin?", time: "Dün 18:20" }],
  3: [
    { from: 'me', text: "Zeynep, bu haftaki ilerleme raporun çok iyi!", time: "Pzt 10:00" },
    { from: 'them', text: "Teşekkürler koç! 💪", time: "Pzt 10:05" },
  ],
  4: [{ from: 'them', text: "Koç, yarın seans yapabilir miyiz?", time: "Pzt 15:30" }],
  5: [
    { from: 'me', text: "Selin, yeni beslenme planını gönderdim.", time: "Paz 09:00" },
    { from: 'them', text: "Beslenme planımı aldım, teşekkürler!", time: "Paz 09:15" },
  ],
};

const coachContact = { id: 0, name: "Coach Mike", avatar: "https://picsum.photos/seed/mike/100/100", online: true };
const coachMessagesData: Record<'tr' | 'en', Message[]> = {
  tr: [
    { from: 'them', text: "Bugün squat'taki formun harikaydı! Bir sonraki sette 5 tekrar daha yapalım.", time: "09:41" },
    { from: 'me', text: "Teşekkürler koç! Takviye zamanlaması hakkında bir sorum var.", time: "09:45" },
    { from: 'them', text: "Kreatin antrenman sonrası, protein 30 dk içinde al. 💪", time: "09:47" },
  ],
  en: [
    { from: 'them', text: "Great form on those squats today! Let's push for 5 more reps next set.", time: "09:41" },
    { from: 'me', text: "Thanks coach! Quick question about supplement timing.", time: "09:45" },
    { from: 'them', text: "Take creatine post-workout and protein within 30 mins. 💪", time: "09:47" },
  ],
};

const MessagesScreen: React.FC<MessagesScreenProps> = ({ lang, role }) => {
  const t = translations[lang];
  const navigate = useNavigate();

  const initialContact: Contact | null = role === 'student' ? (coachContact as unknown as Contact) : null;
  const initialMessages: Message[] = role === 'student' ? coachMessagesData[lang] : [];

  const [selectedContact, setSelectedContact] = useState<Contact | null>(initialContact);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New message modal
  const [showNewMsgModal, setShowNewMsgModal] = useState(false);
  const [newMsgSearch, setNewMsgSearch] = useState('');

  // 3-dot menu in chat
  const [showChatMenu, setShowChatMenu] = useState(false);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // File inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => { if (recordTimerRef.current) clearInterval(recordTimerRef.current); };
  }, []);

  const getNowTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const triggerAutoReply = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1500);
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setMessages(mockMessages[contact.id] ?? []);
    setInputText('');
    setIsTyping(false);
    setShowNewMsgModal(false);
    setNewMsgSearch('');
  };

  const handleBack = () => {
    setSelectedContact(null);
    setMessages([]);
    setInputText('');
    setIsTyping(false);
    setShowChatMenu(false);
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setMessages(prev => [...prev, { from: 'me', text: trimmed, time: getNowTime() }]);
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    triggerAutoReply();
    if (selectedContact) {
      addNotification({
        type: 'message',
        title: lang === 'tr' ? `${selectedContact.name}'dan mesaj` : `Message from ${selectedContact.name}`,
        body: trimmed.slice(0, 80),
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    setMessages(prev => [...prev, { from: 'me', text: file.name, time: getNowTime(), type: isImage ? 'image' : 'file', fileName: file.name }]);
    triggerAutoReply();
    e.target.value = '';
  };

  const handleMicClick = () => {
    if (isRecording) {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      const secs = recordSeconds;
      setIsRecording(false);
      setRecordSeconds(0);
      const dur = secs < 60 ? `0:${secs.toString().padStart(2, '0')}` : `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;
      setMessages(prev => [...prev, { from: 'me', text: dur, time: getNowTime(), type: 'voice' }]);
      triggerAutoReply();
    } else {
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    }
  };

  const cancelRecording = () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecording(false);
    setRecordSeconds(0);
  };

  const filteredContacts = mockContacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMsg[lang].toLowerCase().includes(searchQuery.toLowerCase())
  );

  const newMsgFiltered = mockContacts.filter(c =>
    c.name.toLowerCase().includes(newMsgSearch.toLowerCase())
  );

  const recDur = recordSeconds < 60
    ? `0:${recordSeconds.toString().padStart(2, '0')}`
    : `${Math.floor(recordSeconds / 60)}:${(recordSeconds % 60).toString().padStart(2, '0')}`;

  const todayLabel = lang === 'tr' ? 'Bugün' : 'Today';
  const onlineLabel = lang === 'tr' ? 'Çevrimiçi' : 'Online';

  // ───────────────── CHAT VIEW ─────────────────
  if (selectedContact !== null) {
    const contact = selectedContact;
    const isStudent = role === 'student';
    const statusLabel = isStudent
      ? `${onlineLabel} • PT`
      : `${onlineLabel} • ${lang === 'tr' ? 'Öğrenci' : 'Student'}`;

    return (
      <div className="h-screen flex flex-col bg-background-dark md:pl-64">
        {/* Hidden file inputs */}
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
        <input ref={imageInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />

        {/* Chat Header */}
        <header className="flex items-center bg-background-dark/95 backdrop-blur-md px-4 py-3 border-b border-white/5 gap-3 sticky top-0 z-10 shrink-0">
          {role === 'trainer' && (
            <button
              onClick={handleBack}
              className="flex size-9 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all active:scale-95 shrink-0"
            >
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>
          )}

          <div className="relative shrink-0">
            <div className="size-10 rounded-full overflow-hidden border-2 border-primary">
              <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
            </div>
            {contact.online && (
              <div className="absolute bottom-0 right-0 size-2.5 bg-green-400 rounded-full border-2 border-background-dark"></div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-sm leading-tight truncate">{contact.name}</h2>
            <p className="text-primary text-[10px] font-bold uppercase tracking-widest">{statusLabel}</p>
          </div>

          <div className="flex gap-1.5 shrink-0 relative">
            {/* Video call — disabled for now */}
            <button
              className="flex size-9 items-center justify-center rounded-xl bg-white/5 text-white/20 cursor-not-allowed"
              title={lang === 'tr' ? 'Yakında' : 'Coming soon'}
            >
              <span className="material-symbols-outlined text-xl">video_call</span>
            </button>

            {/* 3-dot menu */}
            <button
              onClick={() => setShowChatMenu(v => !v)}
              className="flex size-9 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-xl">more_vert</span>
            </button>

            {showChatMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowChatMenu(false)}></div>
                <div className="absolute top-11 right-0 w-52 bg-card-dark border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden">
                  <button
                    onClick={() => { setShowChatMenu(false); navigate(`/students?id=${contact.id}`); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base text-white/40">person</span>
                    {lang === 'tr' ? 'Profili Görüntüle' : 'View Profile'}
                  </button>
                  <button
                    onClick={() => {
                      setMessages(prev => [...prev, { from: 'me', text: '📌 ' + (lang === 'tr' ? 'Mesaj sabitlendi' : 'Message pinned'), time: getNowTime() }]);
                      setShowChatMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base text-white/40">push_pin</span>
                    {lang === 'tr' ? 'Mesajı Sabitle' : 'Pin Message'}
                  </button>
                  <button
                    onClick={() => { setMessages([]); setShowChatMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/5 transition-colors border-t border-white/5"
                  >
                    <span className="material-symbols-outlined text-base text-white/40">delete_sweep</span>
                    {lang === 'tr' ? 'Sohbeti Temizle' : 'Clear Chat'}
                  </button>
                  <button
                    onClick={() => setShowChatMenu(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/5"
                  >
                    <span className="material-symbols-outlined text-base">block</span>
                    {lang === 'tr' ? 'Engelle' : 'Block'}
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-3 max-w-3xl w-full mx-auto">
          <div className="flex justify-center py-2">
            <span className="bg-white/5 text-white/30 text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full border border-white/5">
              {todayLabel}
            </span>
          </div>

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-end gap-2 ${msg.from === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>
              {msg.from === 'them' && (
                <img src={contact.avatar} alt={contact.name} className="size-7 rounded-full object-cover shrink-0 mb-1" />
              )}
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
                ) : msg.type === 'file' ? (
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-sm ${msg.from === 'me' ? 'bg-primary text-white rounded-br-sm' : 'bg-card-dark border border-white/5 rounded-bl-sm'}`}>
                    <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${msg.from === 'me' ? 'bg-white/20' : 'bg-primary/20'}`}>
                      <span className="material-symbols-outlined text-lg">description</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight max-w-[130px] truncate">{msg.fileName}</p>
                      <p className="text-[10px] opacity-60 mt-0.5">{lang === 'tr' ? 'Dosya' : 'File'}</p>
                    </div>
                    <span className="material-symbols-outlined text-base opacity-60 shrink-0">download</span>
                  </div>
                ) : msg.type === 'image' ? (
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-sm ${msg.from === 'me' ? 'bg-primary text-white rounded-br-sm' : 'bg-card-dark border border-white/5 rounded-bl-sm'}`}>
                    <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${msg.from === 'me' ? 'bg-white/20' : 'bg-primary/20'}`}>
                      <span className="material-symbols-outlined text-lg">image</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight max-w-[130px] truncate">{msg.fileName}</p>
                      <p className="text-[10px] opacity-60 mt-0.5">{lang === 'tr' ? 'Görsel' : 'Image'}</p>
                    </div>
                  </div>
                ) : (
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.from === 'me' ? 'bg-primary text-white rounded-br-sm' : 'bg-card-dark text-white/90 border border-white/5 rounded-bl-sm'}`}>
                    {msg.text}
                  </div>
                )}
                <span className="text-white/25 text-[10px] px-1">{msg.time}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-end gap-2">
              <img src={contact.avatar} alt={contact.name} className="size-7 rounded-full object-cover shrink-0 mb-1" />
              <div className="bg-card-dark border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center">
                  <span className="size-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="size-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="size-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Input Area */}
        <div className="shrink-0 bg-background-dark/95 backdrop-blur-md border-t border-white/5 px-3 py-3 pb-20 md:pb-4 max-w-3xl w-full mx-auto">
          {isRecording ? (
            /* Recording UI */
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
              <button onClick={cancelRecording} className="text-white/40 hover:text-white transition-colors shrink-0">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <span className="size-2 bg-red-500 rounded-full animate-pulse shrink-0"></span>
                <div className="flex items-center gap-0.5 flex-1 overflow-hidden">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <div key={i} className="w-0.5 rounded-full bg-red-400/60 shrink-0" style={{ height: `${4 + Math.abs(Math.sin(i * 0.9)) * 14}px` }}></div>
                  ))}
                </div>
                <span className="text-red-400 font-black text-sm tabular-nums shrink-0">{recDur}</span>
              </div>
              <button
                onClick={handleMicClick}
                className="flex size-9 items-center justify-center rounded-xl bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all shrink-0 shadow-md shadow-red-500/30"
              >
                <span className="material-symbols-outlined text-lg">send</span>
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-2 bg-card-dark border border-white/8 rounded-2xl px-3 py-2 shadow-inner">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex size-8 items-center justify-center rounded-lg text-white/30 hover:text-primary hover:bg-primary/10 transition-all shrink-0 mb-0.5"
                title={lang === 'tr' ? 'Dosya Ekle' : 'Attach File'}
              >
                <span className="material-symbols-outlined text-xl">attach_file</span>
              </button>
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex size-8 items-center justify-center rounded-lg text-white/30 hover:text-primary hover:bg-primary/10 transition-all shrink-0 mb-0.5"
                title={lang === 'tr' ? 'Fotoğraf / Video' : 'Photo / Video'}
              >
                <span className="material-symbols-outlined text-xl">photo_camera</span>
              </button>

              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={lang === 'tr' ? 'Mesaj yaz...' : 'Type a message...'}
                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/20 resize-none outline-none py-1.5 max-h-[120px] leading-relaxed"
                style={{ overflow: 'hidden' }}
              />

              {inputText.trim() ? (
                <button
                  onClick={handleSend}
                  className="flex size-8 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/80 active:scale-95 transition-all shrink-0 mb-0.5 shadow-md shadow-primary/30"
                >
                  <span className="material-symbols-outlined text-lg">send</span>
                </button>
              ) : (
                <button
                  onClick={handleMicClick}
                  className="flex size-8 items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 mb-0.5"
                  title={lang === 'tr' ? 'Sesli Mesaj Kaydet' : 'Record Voice Message'}
                >
                  <span className="material-symbols-outlined text-xl">mic</span>
                </button>
              )}
            </div>
          )}
        </div>

        <BottomNav role={role} lang={lang} />
      </div>
    );
  }

  // ───────────────── CONTACT LIST VIEW ─────────────────
  return (
    <div className="h-screen flex flex-col bg-background-dark md:pl-64">
      {/* Header */}
      <header className="flex items-center justify-between bg-background-dark/95 backdrop-blur-md px-5 pt-5 pb-4 border-b border-white/5 sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <span className="material-symbols-outlined text-xl">forum</span>
          </div>
          <div>
            <h1 className="text-white font-black text-xl tracking-tight">{lang === 'tr' ? 'Mesajlar' : 'Messages'}</h1>
            <p className="text-white/30 text-xs">{mockContacts.length} {lang === 'tr' ? 'konuşma' : 'conversations'}</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewMsgModal(true)}
          className="flex size-9 items-center justify-center rounded-xl bg-white/5 hover:bg-primary/15 text-white/40 hover:text-primary transition-all active:scale-95"
          title={lang === 'tr' ? 'Yeni Mesaj' : 'New Message'}
        >
          <span className="material-symbols-outlined text-xl">edit_square</span>
        </button>
      </header>

      {/* Search */}
      <div className="px-4 py-3 shrink-0">
        <div className="flex items-center gap-3 bg-card-dark border border-white/5 rounded-2xl px-4 py-2.5">
          <span className="material-symbols-outlined text-white/25 text-xl shrink-0">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={lang === 'tr' ? 'Sohbet ara...' : 'Search chats...'}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/20 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-white/30 hover:text-white/60 transition-colors">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Contact List */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-4">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="material-symbols-outlined text-white/10 text-5xl">search_off</span>
            <p className="text-white/30 text-sm">{lang === 'tr' ? 'Sonuç bulunamadı' : 'No results found'}</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {filteredContacts.map(contact => (
              <li key={contact.id}>
                <button
                  onClick={() => handleSelectContact(contact)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] active:bg-white/[0.06] transition-all cursor-pointer group"
                >
                  <div className="relative shrink-0">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="size-13 rounded-full object-cover border-2 border-white/5 group-hover:border-primary/30 transition-colors"
                      style={{ width: '52px', height: '52px' }}
                    />
                    {contact.online && (
                      <div className="absolute bottom-0 right-0 size-3 bg-green-400 rounded-full border-2 border-background-dark"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-semibold text-sm truncate ${contact.unread > 0 ? 'text-white' : 'text-white/80'}`}>
                        {contact.name}
                      </span>
                      <span className={`text-[10px] shrink-0 ${contact.unread > 0 ? 'text-primary font-bold' : 'text-white/25'}`}>
                        {contact.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-xs truncate leading-relaxed ${contact.unread > 0 ? 'text-white/60' : 'text-white/30'}`}>
                        {contact.lastMsg[lang]}
                      </p>
                      {contact.unread > 0 && (
                        <span className="shrink-0 flex size-5 items-center justify-center rounded-full bg-primary text-white text-[10px] font-black">
                          {contact.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <BottomNav role={role} lang={lang} />

      {/* ── New Message Modal ── */}
      {showNewMsgModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
          onClick={() => setShowNewMsgModal(false)}
        >
          <div
            className="w-full max-w-lg bg-[#0f1923] border border-white/10 rounded-t-3xl pb-10 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5">
              <h2 className="text-white font-black text-lg">{lang === 'tr' ? 'Yeni Mesaj' : 'New Message'}</h2>
              <button
                onClick={() => setShowNewMsgModal(false)}
                className="size-8 bg-white/5 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="px-4 py-3">
              <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5">
                <span className="material-symbols-outlined text-white/30 text-lg">search</span>
                <input
                  autoFocus
                  type="text"
                  value={newMsgSearch}
                  onChange={e => setNewMsgSearch(e.target.value)}
                  placeholder={lang === 'tr' ? 'Kişi ara...' : 'Search people...'}
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
                />
              </div>
            </div>

            <ul className="max-h-72 overflow-y-auto divide-y divide-white/5">
              {newMsgFiltered.length === 0 ? (
                <li className="flex flex-col items-center py-8 gap-2">
                  <span className="material-symbols-outlined text-white/20 text-4xl">person_search</span>
                  <p className="text-white/30 text-sm">{lang === 'tr' ? 'Kişi bulunamadı' : 'No people found'}</p>
                </li>
              ) : newMsgFiltered.map(contact => (
                <li key={contact.id}>
                  <button
                    onClick={() => handleSelectContact(contact)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 transition-colors"
                  >
                    <div className="relative shrink-0">
                      <img src={contact.avatar} alt={contact.name} className="size-10 rounded-full object-cover border-2 border-white/10" />
                      {contact.online && (
                        <div className="absolute bottom-0 right-0 size-2.5 bg-green-400 rounded-full border-2 border-[#0f1923]"></div>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-white text-sm font-semibold">{contact.name}</p>
                      <p className="text-white/30 text-xs">
                        {contact.online
                          ? (lang === 'tr' ? 'Çevrimiçi' : 'Online')
                          : (lang === 'tr' ? 'Çevrimdışı' : 'Offline')}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-white/20 text-xl ml-auto">chevron_right</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesScreen;
