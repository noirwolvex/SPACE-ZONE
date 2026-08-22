import { prisma } from "@/lib/prisma";
import CheckoutForm from "@/components/CheckoutForm";

export const revalidate = 0;

interface CheckoutPageProps {
  searchParams: Promise<{ bookId?: string }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { bookId } = await searchParams;
  if (!bookId) {
    return (
      <main className="flex-1 flex flex-col pt-24 pb-16 bg-[#050505] min-h-[90vh]">
        <div className="container mx-auto px-4 max-w-2xl relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6 drop-shadow-md">Checkout</h1>
          <div className="mt-8 text-center py-20 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.1)]">
            <p className="text-slate-300 font-medium">No book selected for checkout.</p>
          </div>
        </div>
      </main>
    );
  }

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: {
      id: true,
      title: true,
      filename: true,
      summary: true,
      coverImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!book) {
    return (
      <main className="flex-1 flex flex-col pt-24 pb-16 bg-[#050505] min-h-[90vh]">
        <div className="container mx-auto px-4 max-w-2xl relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6 drop-shadow-md">Checkout</h1>
          <div className="mt-8 text-center py-20 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.1)]">
            <p className="text-slate-300 font-medium">The selected book is not available.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col pt-24 pb-16 bg-[#050505] min-h-[90vh]">
      <div className="container mx-auto px-4 max-w-2xl relative z-10 text-center">
        <CheckoutForm book={book} />
      </div>
    </main>
  );
}
