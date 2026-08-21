export default function Blog() { 
  return (
    <main className="flex-1 flex flex-col pt-24 pb-16 bg-[#050505] min-h-[90vh]">
      <div className="container mx-auto px-4 max-w-5xl relative z-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 drop-shadow-md">Blog</h1>
        <p className="text-xl text-slate-300">Latest articles and insights.</p>
        
        <div className="mt-16 text-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-indigo-900/40">
          <p className="text-slate-400 font-medium">No posts found. Our transmission will begin shortly.</p>
        </div>
      </div>
    </main> 
  );
}
