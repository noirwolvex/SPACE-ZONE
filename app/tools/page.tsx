import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Hammer } from "lucide-react";

export default async function ToolsPage() {
  const tools = await prisma.startupTool.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <main className="flex-1 flex flex-col pt-24 pb-16 dark:bg-gray-950">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 border-b border-gray-200 dark:border-gray-800 pb-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 flex items-center gap-4">
              <Hammer className="w-10 h-10 text-blue-600 dark:text-blue-500" />
              Startup Tools
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
              Premium digital tools, templates, and SaaS products engineered to accelerate your growth.
            </p>
          </div>
        </div>

        {tools.length === 0 ? (
           <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
             <p className="text-gray-500 dark:text-gray-400 font-medium">No tools found. Please run the database seeder.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tools.map((tool) => (
              <div key={tool.id} className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:border-blue-300 dark:hover:border-blue-700/50 hover:shadow-xl dark:hover:shadow-blue-900/10 transition-all duration-300">
                <div className="bg-gray-100 dark:bg-gray-800 h-48 w-full flex items-center justify-center">
                  <span className="text-gray-400 dark:text-gray-500 font-medium">No Image</span>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                      {tool.category.name}
                    </span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">${tool.price}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{tool.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 flex-1 leading-relaxed text-sm">
                    {tool.summary}
                  </p>
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="w-full text-center rounded-xl bg-gray-900 dark:bg-gray-100 px-4 py-3 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-white transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
