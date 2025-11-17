import { createDirectus, createItem, readItems, rest, staticToken } from '@directus/sdk';

const directusUrl = process.env.DIRECTUS_URL;
const token = process.env.DIRECTUS_TOKEN;
const collection = process.env.DIRECTUS_TEXTS_COLLECTION;

if (!token) {
  throw new Error('DIRECTUS_TOKEN environment variable is not set');
}
if (!directusUrl) {
  throw new Error('DIRECTUS_URL environment variable is not set');
}
if (!collection || typeof collection !== 'string') {
  throw new Error('DIRECTUS_TEXTS_COLLECTION environment variable is not set');
}

const collectionName = collection as string;

export const directus = createDirectus(directusUrl)
  .with(rest())
  .with(staticToken(token));

export { collectionName };

export interface Post {
  id: number;
  content: string;
}

export async function getTexts(): Promise<Post[]> {
  const result = await directus.request<Post[]>(
    readItems(collectionName)
  );
  return result;
}

export async function createText(content: string): Promise<Post> {
  const result = await directus.request<Post>(
    createItem(collectionName, { content })
  );
  return result;
}

