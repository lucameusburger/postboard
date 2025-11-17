'use client';

import { createDirectus, realtime, staticToken } from '@directus/sdk';
import { useEffect, useRef, useState } from 'react';

import type { Post } from '@/lib/directus';
import TextItem from './TextItem';

interface RealtimeTextsProps {
    initialTexts: Post[];
    collectionName: string;
}

export default function RealtimeTexts({
    initialTexts,
    collectionName,
}: RealtimeTextsProps) {
    const [texts, setTexts] = useState<Post[]>(initialTexts);
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
                                setTexts((prev) => [...prev, newText]);
                                setNewTextIds((prev) => new Set(prev).add(String(newText.id)));
                                // Remove from newTextIds after animation completes
                                setTimeout(() => {
                                    setNewTextIds((prev) => {
                                        const updated = new Set(prev);
                                        updated.delete(String(newText.id));
                                        return updated;
                                    });
                                }, 1000);
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
    }, [collectionName]);

    return (
        <div>
            {texts.map((item) => (
                <TextItem
                    key={item.id}
                    item={item}
                    isNew={newTextIds.has(String(item.id))}
                />
            ))}
        </div>
    );
}

