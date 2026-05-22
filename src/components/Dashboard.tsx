import { useState, useEffect, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Clock, Trash2, Eye, EyeOff, Share2, Bell, Image as ImageIcon, Mic, X, Lock, Loader2, AlertCircle, Send, CornerDownRight, AtSign } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { cn, formatDate } from '../lib/utils';
import { decryptMessage, encryptMessage } from '../lib/crypto';
import { TEMPLATES } from '../lib/constants';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
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

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'letters'),
      where('toUserId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLetters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Letter[];
      setLetters(fetchedLetters);
      setLoading(false);
      
      // Update selected letter if it was updated
      if (selectedLetter) {
        const updated = fetchedLetters.find(l => l.id === selectedLetter.id);
        if (updated) setSelectedLetter(updated);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'letters');
      setError('চিঠি লোড করতে সমস্যা হয়েছে');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, selectedLetter?.id]);

  const deleteLetter = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!confirm('আপনি কি নিশ্চিত যে এই চিঠিটি মুছে ফেলতে চান?')) return;
    
    try {
      await deleteDoc(doc(db, 'letters', id));
      if (selectedLetter?.id === id) setSelectedLetter(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `letters/${id}`);
      alert('চিঠি মুছতে সমস্যা হয়েছে');
    }
  };

  const handleReply = async () => {
    if (!selectedLetter || !replyContent.trim()) return;
    setIsSendingReply(true);
    try {
      const encryptedReply = encryptMessage(replyContent);
      await updateDoc(doc(db, 'letters', selectedLetter.id), {
        replyEncryptedContent: encryptedReply,
        repliedAt: serverTimestamp()
      });
      setReplyContent('');
      alert('আপনার উত্তর পাঠানো হয়েছে!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `letters/${selectedLetter.id}`);
      alert('উত্তর পাঠাতে সমস্যা হয়েছে');
    } finally {
      setIsSendingReply(false);
    }
  };

  const shareLink = `${window.location.origin}/${profile?.username || 'username'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="flex-1 flex overflow-hidden w-full">
      {/* Sidebar: Dashboard / Inbox */}
      <aside className="w-80 border-r border-white/5 bg-immersive-sidebar flex flex-col shrink-0">
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-neutral-500">ইনবক্স</h2>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
              {letters.length}টি চিঠি
            </span>
          </div>

          {/* ... (Letters list - keeping same code as before) ... */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <Loader2 className="animate-spin mb-2" size={24} />
              <span className="text-xs uppercase tracking-tighter">লোড হচ্ছে...</span>
            </div>
          ) : letters.length === 0 ? (
            <div className="text-center py-20 opacity-30">
              <Mail className="mx-auto mb-4" size={32} />
              <p className="text-xs uppercase tracking-widest font-bold">ইনবক্স ফাঁকা</p>
            </div>
          ) : (
            <div className="space-y-3">
              {letters.map(letter => (
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
                    <span className={cn(selectedLetter?.id === letter.id ? "text-indigo-400" : "text-neutral-500")}>
                      #ID-{letter.id.slice(0, 4).toUpperCase()}
                    </span>
                    <span className="opacity-50">{formatDate(letter.createdAt)}</span>
                  </div>
                  <p className={cn(
                    "text-sm line-clamp-1",
                    selectedLetter?.id === letter.id ? "text-gray-200" : "text-neutral-400"
                  )}>
                    {decryptMessage(letter.encryptedContent).substring(0, 30)}...
                  </p>
                  
                  {letter.replyEncryptedContent && (
                    <div className="flex items-center gap-1 mt-1 text-[8px] text-emerald-500 uppercase font-bold">
                       <CornerDownRight size={10} /> উত্তর দেওয়া হয়েছে
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
            {copySuccess ? 'লিংক কপি করা হয়েছে!' : 'লিংক শেয়ার করুন'}
            {!copySuccess && <Share2 size={16} />}
          </button>
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
                  <div className="p-12 pl-20 flex flex-col h-full bg-paper-texture">
                    <div className="mb-8 border-b border-black/10 pb-2 flex justify-between items-end">
                      <span className="text-neutral-500 font-serif text-sm italic">তারিখ: {formatDate(selectedLetter.createdAt)}</span>
                      <span className="text-neutral-400 text-[10px] tracking-tighter uppercase font-bold">TellMe Private</span>
                    </div>
                    
                    <div className={cn(
                      "flex-1 text-2xl text-black leading-[32px] min-h-[200px] whitespace-pre-wrap",
                      TEMPLATES.find(t => t.id === selectedLetter.templateId)?.fontFamily === 'handwriting' ? 'handwriting' : '',
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
                    <Send size={16} className="text-indigo-400" />
                    চিঠির উত্তর দিন
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
                          <span>আপনার উত্তর</span>
                          <span>{formatDate(selectedLetter.repliedAt)}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const rel = decryptMessage(selectedLetter.replyEncryptedContent!);
                          setReplyContent(rel);
                          // Clear reply to allow editing? No, rules allow update.
                        }}
                        className="text-xs text-indigo-400 hover:underline"
                      >
                        উত্তর পরিবর্তন করুন
                      </button>
                    </div>
                  ) : (
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
