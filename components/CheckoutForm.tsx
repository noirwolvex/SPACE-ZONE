"use client";

interface CheckoutBook {
  id: string;
  title: string | null;
  filename: string | null;
  summary: string | null;
  coverImage: string | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}

interface CheckoutFormProps {
  book: CheckoutBook;
}

export default function CheckoutForm({ book }: CheckoutFormProps) {
  return (
    <div className="rounded-[32px] border border-indigo-500/20 bg-slate-900/60 p-8 text-left text-white shadow-[0_0_30px_rgba(79,70,229,0.18)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Checkout</p>
          <h2 className="mt-2 text-2xl font-semibold">{book.title ?? "Selected item"}</h2>
          <p className="mt-2 text-sm text-slate-300">{book.filename ?? "Download-ready content"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-right">
          <p className="text-sm text-slate-300">Available</p>
          <p className="text-xl font-semibold">Now</p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-slate-300">
        <p>Secure checkout experience is being prepared for this item.</p>
        <p className="mt-2">Once the payment flow is connected, this panel will handle the full purchase experience.</p>
      </div>
    </div>
  );
}
