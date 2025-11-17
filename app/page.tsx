import { collectionName, getTexts } from '@/lib/directus';

import Link from 'next/link';
import RealtimeTexts from '@/components/RealtimeTexts';
import TextItem from '@/components/TextItem';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ presentation?: string }>;
}) {
  const data = await getTexts();
  const params = await searchParams;
  const isPresentation = params?.presentation === 'true';

  return (
    <div className="min-h-screen text-5xl">
      <main className="mx-auto p-4">
        {isPresentation ? (
          <RealtimeTexts initialTexts={data} collectionName={collectionName} />
        ) : (
          <div>
            {data.map((item) => (
              <TextItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>

      {!isPresentation && (
        <Link
          href="/add"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-8 py-4 text-background font-medium transition-colors hover:bg-[#383838] shadow-lg z-50"
        >
          Text hinzufügen
        </Link>
      )}
    </div>
  );
}
