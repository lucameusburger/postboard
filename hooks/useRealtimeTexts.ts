import { createDirectus, realtime, staticToken } from '@directus/sdk';
import { useEffect, useRef, useState } from 'react';

import type { Post } from '@/lib/directus';

interface UseRealtimeTextsOptions {
    initialTexts: Post[];
    collectionName: string;
    onNewText?: (text: Post) => void;
}

interface UseRealtimeTextsReturn {
    texts: Post[];
    newTextIds: Set<string>;
    removeNewTextId: (id: string) => void;
}

export function useRealtimeTexts({
    initialTexts,
    collectionName,
    onNewText,
}: UseRealtimeTextsOptions): UseRealtimeTextsReturn {
    // Ensure initial texts are sorted by date_created (oldest first, latest at end)
    const sortedInitialTexts = [...initialTexts].sort((a, b) => {
        const dateA = a.date_created ? new Date(a.date_created).getTime() : 0;
        const dateB = b.date_created ? new Date(b.date_created).getTime() : 0;
        return dateA - dateB;
    });

    const [texts, setTexts] = useState<Post[]>(sortedInitialTexts);
    const [newTextIds, setNewTextIds] = useState<Set<string>>(new Set());
    const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

    useEffect(() => {
        const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
        const token = process.env.NEXT_PUBLIC_DIRECTUS_TOKEN;

        if (!directusUrl || !token) {
            console.error('NEXT_PUBLIC_DIRECTUS_URL or NEXT_PUBLIC_DIRECTUS_TOKEN is not set');
            return;
        }

        // Create Directus client with authentication
        const directus = createDirectus(directusUrl)
            .with(realtime())
            .with(staticToken(token));

        // Subscribe to create events
        directus
            .subscribe(collectionName, {
                event: 'create',
            })
            .then((sub) => {
                subscriptionRef.current = sub;
                // Handle messages from the subscription
                (async () => {
                    for await (const message of sub.subscription) {
                        if (message?.event === 'create' && message?.data) {
                            // message.data might be an array or a single item
                            const data = Array.isArray(message.data)
                                ? message.data[0]
                                : message.data;
                            if (data && typeof data === 'object' && 'id' in data && 'content' in data) {
                                const newText = data as Post;
                                setTexts((prev) => {
                                    // Insert new text in the correct position based on date_created
                                    const updated = [...prev, newText];
                                    return updated.sort((a, b) => {
                                        const dateA = a.date_created ? new Date(a.date_created).getTime() : 0;
                                        const dateB = b.date_created ? new Date(b.date_created).getTime() : 0;
                                        return dateA - dateB;
                                    });
                                });
                                setNewTextIds((prev) => new Set(prev).add(String(newText.id)));

                                // Call the callback if provided
                                onNewText?.(newText);
                            }
                        }
                    }
                })();
            })
            .catch((error) => {
                console.error('Error setting up realtime subscription:', error);
            });

        // Cleanup subscription on unmount
        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
            }
        };
    }, [collectionName, onNewText]);

    const removeNewTextId = (id: string) => {
        setNewTextIds((prev) => {
            const updated = new Set(prev);
            updated.delete(id);
            return updated;
        });
    };

    return {
        texts,
        newTextIds,
        removeNewTextId,
    };
}

