import Link from 'next/link';

export default function Home() { return <main className='p-8'><h1 className='text-4xl font-bold'>Space Zone Media</h1><p className='mt-4'>Innovating the web, one launch at a time.</p><div className='mt-8 flex gap-4'><Link href='/about' className='underline'>About</Link><Link href='/services' className='underline'>Services</Link><Link href='/portfolio' className='underline'>Portfolio</Link><Link href='/blog' className='underline'>Blog</Link><Link href='/contact' className='underline'>Contact</Link></div></main> }
