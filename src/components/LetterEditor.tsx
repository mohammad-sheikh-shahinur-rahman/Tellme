import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Image as ImageIcon, 
  Mic, 
  Type, 
  Palette, 
  X, 
  Trash2, 
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { TEMPLATES, FONT_SIZES, INITIAL_LETTER_CONTENT } from '../lib/constants';
import { encryptMessage } from '../lib/crypto';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export default function LetterEditor() {
  const { username } = useParams<{ username: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [content, setContent] = useState(INITIAL_LETTER_CONTENT);
  const [templateId, setTemplateId] = useState(TEMPLATES[1].id);
  const [fontSizeId, setFontSizeId] = useState('md');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipientUid, setRecipientUid] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  const [image, setImage] = useState<string | null>(null);
  const [voiceBlob, setVoiceBlob] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const currentFontSize = FONT_SIZES.find(f => f.id === fontSizeId) || FONT_SIZES[1];

  useEffect(() => {
    const validateRecipient = async () => {
      if (!username) return;
      setIsValidating(true);
      try {
        const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
        if (usernameDoc.exists()) {
          setRecipientUid(usernameDoc.data().uid);
        } else {
          setError('এই ইউজারনেমটি খুঁজে পাওয়া যায়নি।');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `usernames/${username.toLowerCase()}`);
        setError('ইউজার যাচাই করতে সমস্যা হয়েছে।');
      } finally {
        setIsValidating(false);
      }
    };

    validateRecipient();
  }, [username]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        setError('ছবির সাইজ অনেক বড় (৮০০কিবির কম হতে হবে)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      if (!window.MediaRecorder) {
        setError('অডিও রেকর্ডিং সাপোর্ট নেই');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          if ((reader.result as string).length > 1000000) {
            setError('ভয়েস রেকর্ডিং অনেক বড় হয়ে গেছে।');
            return;
          }
          setVoiceBlob(reader.result as string);
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('মাইক্রোফোন অ্যাক্সেস পাওয়া যায়নি');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
  };

  const handleSend = async () => {
    if (!content.trim() || !recipientUid || !username) return;
    setIsSending(true);
    setError(null);
    try {
      const encrypted = encryptMessage(content);
      
      const letterData: any = {
        toUsername: username.toLowerCase(),
        toUserId: recipientUid,
        encryptedContent: encrypted,
        templateId,
        fontSize: fontSizeId,
        attachmentBase64: image || null,
        voiceBase64: voiceBlob || null,
        createdAt: serverTimestamp(),
      };

      if (user) {
        letterData.fromUserId = user.uid;
        letterData.fromUsername = profile?.username || null;
      }
      
      await addDoc(collection(db, 'letters'), letterData);

      setIsSent(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'letters');
      setError('চিঠি পাঠানো সম্ভব হয়নি। আবার চেষ্টা করুন।');
    } finally {
      setIsSending(false);
    }
  };

  if (isValidating) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
        <p className="text-neutral-500 uppercase tracking-widest text-xs font-bold">ইউজার যাচাই করা হচ্ছে...</p>
      </div>
    );
  }

  if (error && !recipientUid) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-white mb-2">{error}</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-indigo-400 hover:underline">হোম পেজে ফিরে যান</button>
      </div>
    );
  }

  if (isSent) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/5 border border-white/10 p-12 rounded-3xl text-center max-w-md shadow-2xl backdrop-blur-xl"
        >
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">চিঠি পাঠানো হয়েছে!</h2>
          <p className="text-neutral-500 mb-10 leading-relaxed">আপনার গোপনীয় বার্তাটি সফলভাবে এনক্রিপ্ট করে পাঠানো হয়েছে।</p>
          <button onClick={() => navigate('/')} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95">
            হোম পেজে ফিরে যান
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden w-full">
      {/* Sidebar: Controls */}
      <aside className="w-80 border-r border-white/5 bg-immersive-sidebar flex flex-col shrink-0">
        <div className="p-8 space-y-10 overflow-y-auto flex-1">
          <section>
            <h2 className="text-xs uppercase tracking-widest font-semibold text-neutral-500 mb-4 tracking-tighter">প্রাপক ইউজারনেম</h2>
            <div className="text-2xl font-black text-indigo-400">@{username}</div>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-widest font-semibold text-neutral-500 mb-4 tracking-tighter">ফন্ট সাইজ</h2>
            <div className="grid grid-cols-2 gap-2">
              {FONT_SIZES.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFontSizeId(f.id)}
                  className={cn(
                    "py-2 rounded-lg text-xs font-medium border transition-all",
                    fontSizeId === f.id ? "bg-indigo-600 text-white border-indigo-500 shadow-lg" : "bg-white/5 text-neutral-500 border-white/5 hover:border-white/10"
                  )}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-widest font-semibold text-neutral-500 mb-4 tracking-tighter">টেম্পলেট</h2>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemplateId(t.id)}
                  className={cn(
                    "h-12 rounded-lg border flex items-center justify-center transition-all overflow-hidden",
                    templateId === t.id ? "ring-2 ring-indigo-500 scale-95" : "border-white/5 hover:border-white/10"
                  )}
                >
                  <div className={cn("w-full h-full flex items-center justify-center", t.background)}>
                    <span className={cn("text-[10px] font-bold", t.textColor)}>{t.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-widest font-semibold text-neutral-500 mb-4 tracking-tighter">অ্যাটাচমেন্ট</h2>
            <div className="flex gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 text-neutral-400 hover:text-white transition-all">
                <ImageIcon size={20} />
              </button>
              <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={cn("p-3 rounded-xl border transition-all", isRecording ? "bg-red-500/20 text-red-500 border-red-500" : "bg-white/5 border-white/5 text-neutral-400 hover:text-white")}
              >
                <Mic size={20} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
          </section>
        </div>

        <div className="mt-auto p-8 border-t border-white/5 text-[10px] text-neutral-600 uppercase tracking-widest text-center">
          TellMe / এনক্রিপ্টেড ও সুরক্ষিত
        </div>
      </aside>

      {/* Editor Main */}
      <section className="flex-1 bg-immersive-viewport flex flex-col relative overflow-hidden">
        <div className="flex items-center justify-between px-8 py-4 bg-black/20 border-b border-white/5">
          <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium">
            <Lock size={14} />
            চিঠি এনক্রিপ্ট করা হবে
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
          <div className={cn(
            "w-full max-w-2xl min-h-[500px] h-fit paper-classic rounded-lg paper-shadow relative flex flex-col",
            TEMPLATES.find(t => t.id === templateId)?.background.includes('bg-white') ? 'bg-white border-2 border-white' : TEMPLATES.find(t => t.id === templateId)?.background
          )}>
            <div className="p-12 pl-20 flex flex-col h-full bg-paper-texture">
              <div className="mb-8 border-b border-black/10 pb-2">
                <span className="text-neutral-500 font-serif text-sm italic">তারিখ: ১৫ আশ্বিন, ১৪৩১</span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={cn(
                  "flex-1 bg-transparent border-none resize-none focus:ring-0 text-black leading-[32px] p-0 mb-8 whitespace-pre-wrap",
                    TEMPLATES.find(t => t.id === templateId)?.fontFamily === 'handwriting' ? 'handwriting' : '',
                    currentFontSize.class,
                    TEMPLATES.find(t => t.id === templateId)?.textColor || 'text-black'
                )}
                placeholder="প্রিয়..."
              />

              <div className="mt-auto flex items-end justify-between">
                <div className="flex gap-4">
                  {image && (
                    <div className="w-24 h-24 border-2 border-white shadow-xl rounded-lg overflow-hidden -rotate-3 relative group">
                      <img src={image} className="w-full h-full object-cover" alt="Attached" />
                      <button onClick={() => setImage(null)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs">মুছে ফেলুন</button>
                    </div>
                  )}
                  {voiceBlob && (
                    <div className="w-24 h-24 border-2 border-white shadow-xl rounded-lg bg-neutral-100 flex flex-col items-center justify-center p-2 rotate-2 group">
                      <Mic size={24} className="text-indigo-600 mb-1" />
                      <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-tight">ভয়েস রেকর্ড</span>
                      <button onClick={() => setVoiceBlob(null)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px]">X</button>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-black text-xl italic handwriting">ইতি,</p>
                  <p className="text-black text-2xl font-bold handwriting">আপনার শুভাকাঙ্ক্ষী</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="h-24 bg-black/40 border-t border-white/5 flex items-center justify-between px-8">
          <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-tighter">
            {error && <><AlertCircle size={14} /> {error}</>}
          </div>
          <button
            onClick={handleSend}
            disabled={isSending || !recipientUid}
            className="px-12 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
          >
            {isSending ? <Loader2 className="animate-spin" /> : "চিঠি পাঠান"}
          </button>
        </div>
      </section>
    </div>
  );
}
