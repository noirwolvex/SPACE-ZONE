import { redirect } from "next/navigation";

export const revalidate = 0;

interface CheckoutPageProps {
  searchParams: Promise<{ bookId?: string }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { bookId } = await searchParams;

  if (bookId) {
    redirect(`/books/${encodeURIComponent(bookId)}`);
  }

  return (
    <main className="flex min-h-[90vh] flex-1 items-center justify-center bg-[#050505] px-4 py-24 text-white">
      <div className="max-w-xl rounded-3xl border border-indigo-500/20 bg-slate-900/40 p-10 text-center shadow-[0_0_30px_rgba(79,70,229,0.12)]">
        <h1 className="text-4xl font-extrabold tracking-tight">Checkout</h1>
        <p className="mt-4 text-slate-300">Select a book first to continue to its secure purchase flow.</p>
      </div>
    </main>
  );
}
