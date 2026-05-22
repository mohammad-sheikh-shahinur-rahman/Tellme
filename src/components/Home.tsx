import { useState, FormEvent, ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Mail, Shield, Zap, Heart, LayoutDashboard, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const [searchUsername, setSearchUsername] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchUsername.trim()) {
      navigate(`/${searchUsername.trim().toLowerCase()}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-8 py-12 scrollbar-none">
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center mb-16">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight text-white">
              গোপন <span className="text-indigo-500">বার্তা</span> পাঠান
            </h1>
            <p className="text-xl text-neutral-500 max-w-2xl mx-auto leading-relaxed">
              আপনার পরিচয় গোপন রেখে প্রিয়জনকে সুন্দর ডিজাইনের চিঠি পাঠান। প্রতিটি অক্ষর হাতে লেখা ফন্টের মতো দেখাবে।
            </p>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12 flex flex-col items-center gap-6"
          >
            <form onSubmit={handleSearch} className="relative group w-full max-w-md">
              <input
                type="text"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                placeholder="ইউজারনেম লিখুন (যেমন: nira521)"
                className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl focus:border-indigo-500 focus:ring-0 outline-none transition-all shadow-2xl text-white text-lg placeholder:text-neutral-700"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-500 transition-all shadow-lg active:scale-95"
              >
                <Search size={20} />
              </button>
            </form>

            {user ? (
              <Link 
                to="/dashboard"
                className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold transition-colors group"
              >
                <LayoutDashboard size={20} />
                <span>আপনার ড্যাশবোর্ডে যান</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <p className="text-sm text-neutral-500">
                লিংক স্টাইল: <span className="text-indigo-400">tellme.app/nira521</span>
              </p>
            )}
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <FeatureCard 
            icon={<Shield size={24} className="text-emerald-500" />}
            title="গোপনীয়তা সুরক্ষা"
            desc="প্রতিটি বার্তা এন্ড-টু-এন্ড এনক্রিপ্টেড। আপনার পরিচয় কারো কাছে প্রকাশ করা হয় না।"
          />
          <FeatureCard 
            icon={<Zap size={24} className="text-amber-500" />}
            title="স্মার্ট ড্যাশবোর্ড"
            desc="প্রাপ্ত চিঠিগুলো দেখার জন্য রয়েছে আধুনিক ড্যাশবোর্ড যেখানে সব ফিল্টার করা থাকে।"
          />
          <FeatureCard 
            icon={<Heart size={24} className="text-pink-500" />}
            title="হাতে লিখা অনুভূতি"
            desc="ডিজিটাল যুগেও প্রিয়জনকে আগের দিনের হাতে লিখা চিঠির অনুভূতি দিন সুন্দর টেম্পলেটে।"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
      <div className="mb-4 p-3 bg-white/5 rounded-xl w-fit group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-neutral-500 leading-relaxed text-sm">{desc}</p>
    </div>
  );
}
