import { collectionName, getTexts } from '@/lib/directus';

import FixedButton from '@/components/FixedButton';
import TypewriterTexts from '@/components/TypewriterTexts';
import WordcloudTexts from '@/components/WordcloudTexts';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ presentation?: string; view?: string }>;
}) {
  const data = await getTexts();
  const params = await searchParams;
  const isPresentation = params?.presentation === 'true';
  const view = params?.view || 'typewriter'; // 'typewriter' or 'wordcloud'

  return (
    <div className={"h-screen w-screen overflow-hidden text-5xl"}>
      <main className={"h-full w-full p-4"}>
        {view === 'wordcloud' ? (
          <WordcloudTexts initialTexts={data} collectionName={collectionName} />
        ) : (
          <TypewriterTexts initialTexts={data} collectionName={collectionName} />
        )}
      </main>

      {!isPresentation && (
        <FixedButton href="/add">
          Hinzufügen
        </FixedButton>
      )}
    </div>
  );
}
