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
    <div className={"h-screen w-screen overflow-hidden text-5xl"}>
      <main className={"h-full w-full p-4"}>
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
