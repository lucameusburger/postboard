import { collectionName, getTexts } from '@/lib/directus';

import FixedButton from '@/components/FixedButton';
import RealtimeTexts from '@/components/RealtimeTexts';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ presentation?: string }>;
}) {
  const data = await getTexts();
  const params = await searchParams;
  const isPresentation = params?.presentation === 'true';

  return (
    <div className={isPresentation ? "h-screen w-screen overflow-hidden" : "min-h-screen text-5xl"}>
      <main className={isPresentation ? "h-full w-full" : "mx-auto p-4"}>
        <RealtimeTexts initialTexts={data} collectionName={collectionName} />
      </main>

      {!isPresentation && (
        <FixedButton href="/add">
          Hinzufügen
        </FixedButton>
      )}
    </div>
  );
}
