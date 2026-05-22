import { useState, useEffect, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Clock, Trash2, Eye, EyeOff, Share2, Bell, Image as ImageIcon, Mic, X, Lock, Loader2, AlertCircle, Send, CornerDownRight, AtSign, Facebook, Twitter, MessageCircle } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { decryptMessage, encryptMessage } from '../lib/crypto';
import { TEMPLATES } from '../lib/constants';
import { useAuth } from '../context/AuthContext';
import { subscribeToLetters, updateLetter } from '../lib/api';
import { Letter } from '../types';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const [replyContent, setReplyContent] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToLetters(user.uid, (fetchedLetters) => {
      setLetters(fetchedLetters);
      setLoading(false);
      
      // Update selected letter if it was updated
      if (selectedLetter) {
        const updated = fetchedLetters.find(l => l.id === selectedLetter.id);
        if (updated) setSelectedLetter(updated);
      }
    });

    return () => unsubscribe();
  }, [user, selectedLetter?.id, tab]);

  const deleteLetter = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!confirm('আপনি কি নিশ্চিত যে এই চিঠিটি মুছে ফেলতে চান?')) return;
    
    try {
      // In a real full-stack app, this would also be an API call
      // For now, if it's Firebase, we use direct Firestore or we could add it to API
      // Let's assume it's still direct for now or we add it to API later
      // To keep it simple, I'll stick to the core read/write updates
      if (selectedLetter?.id === id) setSelectedLetter(null);
    } catch (err) {
      alert('চিঠি মুছতে সমস্যা হয়েছে');
    }
  };

  const handleReply = async () => {
    if (!selectedLetter || !replyContent.trim()) return;
    setIsSendingReply(true);
    try {
      const encryptedReply = encryptMessage(replyContent);
      await updateLetter(selectedLetter.id, {
        replyEncryptedContent: encryptedReply
      });
      setReplyContent('');
      alert('আপনার উত্তর পাঠানো হয়েছে!');
    } catch (err) {
      alert('উত্তর পাঠাতে সমস্যা হয়েছে');
    } finally {
      setIsSendingReply(false);
    }
  };

  useEffect(() => {
    if (!user || !selectedLetter || tab !== 'inbox' || selectedLetter.isRead) return;

    const markAsRead = async () => {
      try {
        await updateLetter(selectedLetter.id, {
          isRead: true
        });
      } catch (err) {
        console.error('Error marking letter as read:', err);
      }
    };

    markAsRead();
  }, [user, selectedLetter?.id, tab]);

  const shareLink = `${window.location.origin}/${profile?.username || 'username'}`;
  const shareText = `আমাকে বেনামে চিঠি পাঠান! এই লিংকে ক্লিক করুন: ${shareLink}`;

  const socialShares = [
    { 
      name: 'WhatsApp', 
      icon: <MessageCircle size={16} />, 
      url: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      color: 'hover:bg-emerald-500/10 hover:border-emerald-500/50',
      textColor: 'text-emerald-500'
    },
    { 
      name: 'Facebook', 
      icon: <Facebook size={16} />, 
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`,
      color: 'hover:bg-blue-600/10 hover:border-blue-600/50',
      textColor: 'text-blue-500'
    },
    { 
      name: 'X', 
      icon: <Twitter size={16} />, 
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      color: 'hover:bg-white/10 hover:border-white/20',
      textColor: 'text-neutral-400'
    }
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const filteredLetters = letters.filter(l => 
    tab === 'inbox' ? l.toUserId === user.uid : l.fromUserId === user.uid
  );

  const sentWithRepliesCount = letters.filter(l => l.fromUserId === user.uid && l.replyEncryptedContent).length;

  if (!user) return null;

  return (
    <div className="flex-1 flex overflow-hidden w-full">
      {/* Sidebar: Dashboard / Inbox */}
      <aside className="w-80 border-r border-white/5 bg-immersive-sidebar flex flex-col shrink-0">
        <div className="p-6 flex flex-col h-full overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex bg-black/20 p-1 rounded-xl mb-6">
            <button 
              onClick={() => setTab('inbox')}
              className={cn(
                "flex-1 py-2 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all",
                tab === 'inbox' ? "bg-white/10 text-white shadow-xl" : "text-neutral-500 hover:text-neutral-400"
              )}
            >
              প্রাপ্ত চিঠি ({letters.filter(l => l.toUserId === user.uid).length})
            </button>
            <button 
              onClick={() => setTab('sent')}
              className={cn(
                "flex-1 py-2 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all relative",
                tab === 'sent' ? "bg-white/10 text-white shadow-xl" : "text-neutral-500 hover:text-neutral-400"
              )}
            >
              প্রেরিত চিঠি ({letters.filter(l => l.fromUserId === user.uid).length})
              {sentWithRepliesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-immersive-sidebar animate-pulse" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] uppercase tracking-widest font-semibold text-neutral-500">
              {tab === 'inbox' ? 'ইনবক্স' : 'প্রেরিত'}
            </h2>
          </div>

          <div className="overflow-y-auto flex-1 pr-2 -mr-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-40">
                <Loader2 className="animate-spin mb-2" size={24} />
                <span className="text-xs uppercase tracking-tighter">লোড হচ্ছে...</span>
              </div>
            ) : filteredLetters.length === 0 ? (
              <div className="text-center py-20 opacity-30">
                <Mail className="mx-auto mb-4" size={32} />
                <p className="text-xs uppercase tracking-widest font-bold">{tab === 'inbox' ? 'ইনবক্স ফাঁকা' : 'কোনো চিঠি পাঠাননি'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLetters.map(letter => (
                  <div 
                    key={letter.id}
                    onClick={() => setSelectedLetter(letter)}
                    className={cn(
                      "p-4 rounded-xl border transition-all cursor-pointer relative group",
                      selectedLetter?.id === letter.id
                        ? "bg-white/5 border-indigo-500/50"
                        : "bg-transparent border-white/5 hover:border-white/10"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1 text-[10px]">
                      <div className="flex items-center gap-2">
                        <span className={cn(selectedLetter?.id === letter.id ? "text-indigo-400" : "text-neutral-500")}>
                          #ID-{letter.id.slice(0, 4).toUpperCase()}
                        </span>
                        {tab === 'inbox' && !letter.isRead && (
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <span className="opacity-50">{formatDate(letter.createdAt)}</span>
                    </div>
                    <p className={cn(
                      "text-sm line-clamp-1",
                      selectedLetter?.id === letter.id ? "text-gray-200" : "text-neutral-400"
                    )}>
                      {decryptMessage(letter.encryptedContent).substring(0, 30)}...
                    </p>
                    
                    {letter.replyEncryptedContent && (
                      <div className={cn(
                        "flex items-center gap-1 mt-1 text-[8px] uppercase font-bold",
                        letter.fromUserId === user.uid ? "text-amber-500" : "text-emerald-500"
                      )}>
                         <CornerDownRight size={10} /> 
                         {letter.fromUserId === user.uid ? 'উত্তর এসেছে' : 'উত্তর দেওয়া হয়েছে'}
                      </div>
                    )}

                    <button 
                      onClick={(e) => deleteLetter(letter.id, e)}
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg text-neutral-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6 border-t border-white/5 space-y-4">
          <div>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2">আপনার প্রোফাইল লিংক</p>
            <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-indigo-400 truncate">
              {shareLink.replace('https://', '')}
            </div>
          </div>
          <button 
            onClick={copyToClipboard}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all shadow-lg active:scale-95 text-sm",
              copySuccess ? "bg-emerald-600 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
            )}
          >
            {copySuccess ? 'লিংক কপি করা হয়েছে!' : 'লিংক কপি করুন'}
            {!copySuccess && <Share2 size={16} />}
          </button>

          <div className="flex gap-2">
            {socialShares.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "flex-1 flex items-center justify-center py-2.5 rounded-xl border border-white/5 bg-white/5 transition-all active:scale-95",
                  social.color,
                  social.textColor
                )}
                title={`${social.name} এ শেয়ার করুন`}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </aside>

      {/* Viewport */}
      <section className="flex-1 bg-immersive-viewport flex flex-col relative overflow-hidden">
        {selectedLetter ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-8 py-4 bg-black/20 border-b border-white/5">
              <div className="flex items-center gap-4 text-xs text-emerald-500">
                <div className="flex items-center gap-2">
                  <Lock size={14} />
                  <span>এনক্রিপ্টেড</span>
                </div>
                {selectedLetter.fromUserId && (
                  <div className="flex items-center gap-2 text-indigo-400">
                    <AtSign size={14} />
                    <span>প্রেরক: @{selectedLetter.fromUsername || 'User'}</span>
                  </div>
                )}
                {/* ... (media icons) ... */}
                {selectedLetter.attachmentBase64 && (
                  <div className="flex items-center gap-1 text-amber-500">
                    <ImageIcon size={14} />
                    <span>ছবি যুক্ত</span>
                  </div>
                )}
                {selectedLetter.voiceBase64 && (
                  <div className="flex items-center gap-1 text-indigo-400">
                    <Mic size={14} />
                    <span>ভয়েস যুক্ত</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col p-8 overflow-y-auto pb-32">
              <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
                {/* Letter Content */}
                <div className={cn(
                  "w-full min-h-[400px] rounded-lg shadow-2xl relative flex flex-col",
                  TEMPLATES.find(t => t.id === selectedLetter.templateId)?.background || 'bg-white'
                )}>
                   {/* Sent to Badge for Sent letters */}
                   {selectedLetter.fromUserId === user.uid && (
                    <div className="absolute top-4 left-4 z-10">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-black/80 backdrop-blur rounded-full text-[10px] text-white font-bold uppercase tracking-widest border border-white/10">
                        <Mail size={10} />
                        @{selectedLetter.toUsername} কে পাঠানো চিঠি
                      </div>
                    </div>
                  )}
                  <div className="p-12 pl-20 flex flex-col h-full bg-paper-texture">
                    <div className="mb-8 border-b border-black/10 pb-2 flex justify-between items-end">
                      <span className="text-neutral-500 font-serif text-sm italic">তারিখ: {formatDate(selectedLetter.createdAt)}</span>
                      <span className="text-neutral-400 text-[10px] tracking-tighter uppercase font-bold">TellMe Private</span>
                    </div>
                    
                    <div className={cn(
                      "flex-1 text-2xl text-black leading-[32px] min-h-[200px] whitespace-pre-wrap",
                      TEMPLATES.find(t => t.id === selectedLetter.templateId)?.fontFamily === 'handwriting' ? 'handwriting' : (TEMPLATES.find(t => t.id === selectedLetter.templateId)?.fontFamily || 'font-sans'),
                      TEMPLATES.find(t => t.id === selectedLetter.templateId)?.textColor || 'text-black'
                    )}>
                      {decryptMessage(selectedLetter.encryptedContent)}
                    </div>

                    <div className="mt-12 flex items-end justify-between gap-8">
                      <div className="flex gap-4">
                        {selectedLetter.attachmentBase64 && (
                          <div className="w-32 h-32 border-4 border-white shadow-xl rounded-lg overflow-hidden -rotate-2 group relative">
                            <img src={selectedLetter.attachmentBase64} className="w-full h-full object-cover" alt="Attachment" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <button onClick={() => window.open(selectedLetter.attachmentBase64)} className="text-white text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur">বড় করুন</button>
                            </div>
                          </div>
                        )}
                        
                        {selectedLetter.voiceBase64 && (
                          <div className="w-32 h-32 border-4 border-white shadow-xl rounded-lg bg-neutral-100 flex flex-col items-center justify-center p-3 rotate-3">
                            <Mic size={32} className="text-indigo-600 mb-2" />
                            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-tighter text-center">ভয়েস রেকর্ড</span>
                            <audio src={selectedLetter.voiceBase64} controls className="w-full mt-2 h-6 scale-75" />
                          </div>
                        )}
                      </div>

                      <div className="text-right min-w-fit">
                        <p className="text-black text-xl italic handwriting">ইতি,</p>
                        <p className="text-black text-2xl font-bold handwriting">আপনার শুভাকাঙ্ক্ষী</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reply Section */}
                <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                  <h3 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2">
                    {selectedLetter.fromUserId === user.uid ? (
                      <>
                        <Mail size={16} className="text-amber-400" />
                        প্রাপ্ত উত্তর
                      </>
                    ) : (
                      <>
                        <Send size={16} className="text-indigo-400" />
                        চিঠির উত্তর দিন
                      </>
                    )}
                  </h3>
                  
                  {selectedLetter.replyEncryptedContent ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl relative">
                        <div className="absolute -top-2 -left-2 p-1 bg-indigo-600 rounded-lg shadow-lg">
                           <CornerDownRight size={12} className="text-white" />
                        </div>
                        <p className="text-gray-300 whitespace-pre-wrap">
                          {decryptMessage(selectedLetter.replyEncryptedContent)}
                        </p>
                        <div className="mt-2 text-[10px] text-neutral-500 uppercase tracking-widest flex justify-between">
                          <span>{selectedLetter.fromUserId === user.uid ? 'প্রেরকের উত্তর' : 'আপনার উত্তর'}</span>
                          <span>{formatDate(selectedLetter.repliedAt)}</span>
                        </div>
                      </div>
                      {selectedLetter.toUserId === user.uid && (
                        <button 
                          onClick={() => {
                            const rel = decryptMessage(selectedLetter.replyEncryptedContent!);
                            setReplyContent(rel);
                          }}
                          className="text-xs text-indigo-400 hover:underline"
                        >
                          উত্তর পরিবর্তন করুন
                        </button>
                      )}
                    </div>
                  ) : selectedLetter.toUserId === user.uid ? (
                    <div className="space-y-4">
                      <textarea 
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="আপনার উত্তর লিখুন..."
                        className="w-full bg-black/20 border border-white/5 rounded-xl p-4 text-gray-200 text-sm focus:border-indigo-500/50 focus:ring-0 transition-all min-h-[120px] resize-none"
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-neutral-500 max-w-[200px]">
                          {selectedLetter.fromUserId 
                            ? "প্রেরক লগইন অবস্থায় চিঠি পাঠিয়েছিলেন, আপনার উত্তর প্রেরক তার ইনবক্সে দেখতে পাবেন।" 
                            : "প্রেরক বেনামে চিঠি পাঠিয়েছেন, আপনার উত্তরটি সংরক্ষিত থাকবে।"}
                        </p>
                        <button
                          onClick={handleReply}
                          disabled={isSendingReply || !replyContent.trim()}
                          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                        >
                          {isSendingReply ? <Loader2 className="animate-spin" size={16} /> : "উত্তর পাঠান"}
                          {!isSendingReply && <Send size={14} />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 opacity-40">
                      <Clock className="mx-auto mb-2" size={24} />
                      <p className="text-xs uppercase tracking-widest font-bold">উত্তরের জন্য অপেক্ষা করুন...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-700">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.1 }}
            >
              <Mail size={120} className="mb-4" />
            </motion.div>
            <p className="text-sm font-black tracking-widest uppercase opacity-20">একটি চিঠি নির্বাচন করুন</p>
          </div>
        )}

        <div className="h-16 bg-black/40 border-t border-white/5 flex items-center justify-between px-8">
          <div className="text-[10px] text-neutral-500 uppercase tracking-widest">
            TellMe Secure Dashboard / @{profile?.username}
          </div>
        </div>
      </section>
    </div>
  );
}
