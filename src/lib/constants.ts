import { WritingTemplate } from '../types';

export const TEMPLATES: WritingTemplate[] = [
  {
    id: 'classic-white',
    name: 'সাদা কাগজ',
    background: 'bg-white',
    textColor: 'text-neutral-900',
    fontFamily: 'font-sans'
  },
  {
    id: 'classic-old',
    name: 'পুরোনো চিঠি',
    background: 'paper-classic',
    textColor: 'text-amber-950',
    fontFamily: 'handwriting'
  },
  {
    id: 'classic-yellow',
    name: 'হলদেটে স্মৃতি',
    background: 'bg-yellow-50/80',
    textColor: 'text-amber-900',
    fontFamily: 'handwriting'
  },
  {
    id: 'classic-dark',
    name: 'নিশীথ বার্তা',
    background: 'dark-paper',
    textColor: 'text-neutral-50',
    fontFamily: 'font-sans'
  },
  {
    id: 'classic-postcard',
    name: 'পোস্টকার্ড',
    background: 'bg-orange-50 border-orange-200',
    textColor: 'text-slate-800',
    fontFamily: 'handwriting'
  }
];

export const FONT_SIZES = [
  { id: 'xs', name: 'ছোট', class: 'text-sm' },
  { id: 'md', name: 'মাঝারি', class: 'text-lg' },
  { id: 'lg', name: 'বড়', class: 'text-2xl' },
  { id: 'xl', name: 'বিরাট', class: 'text-3xl' }
];

export const INITIAL_LETTER_CONTENT = `প্রিয় নীরা,

কেমন আছো? অনেকদিন হলো তোমাকে কোনো চিঠি লিখি না। আজ হঠাৎ খুব মনে পড়লো পুরনো দিনগুলোর কথা। সেই বিকেলের আড্ডা, চায়ের কাপে ধোঁয়া ওঠা গল্প—সবই এখন স্মৃতি। 

আশা করি তুমি ভালো আছো। সময় পেলে উত্তর দিও।

ইতি,
তোমার এক শুভাকাঙ্ক্ষী`;
