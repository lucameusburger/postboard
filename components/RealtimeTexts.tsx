'use client';

import { createDirectus, realtime, staticToken } from '@directus/sdk';
import { useCallback, useEffect, useRef, useState } from 'react';

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
    // Initialize displayed lengths for initial texts
    // Logo counts as 1 character, then text content + space
    const [displayedLengths, setDisplayedLengths] = useState<Map<string, number>>(() => {
        const initialMap = new Map<string, number>();
        initialTexts.forEach((text) => {
            const fullText = `${text.content} `;
            // Logo (1) + text length
            initialMap.set(String(text.id), fullText.length + 1);
        });
        return initialMap;
    });
    const [fontSize, setFontSize] = useState<number>(48);
    const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

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
                                // Initialize displayed length to 0 for new text (will animate)
                                setDisplayedLengths((prev) => {
                                    const updated = new Map(prev);
                                    updated.set(String(newText.id), 0);
                                    return updated;
                                });
                                // Calculate animation duration based on text length
                                // TextItem adds Logo (counts as 1) + " " suffix, and uses 60ms per character
                                const fullTextLength = `${newText.content} `.length + 1; // +1 for logo
                                const animationDuration = fullTextLength * 60;
                                // Remove from newTextIds after animation completes
                                setTimeout(() => {
                                    setNewTextIds((prev) => {
                                        const updated = new Set(prev);
                                        updated.delete(String(newText.id));
                                        return updated;
                                    });
                                }, animationDuration);
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

    // Handle displayed length changes from TextItem components
    const handleDisplayedLengthChange = useCallback((itemId: string, length: number) => {
        setDisplayedLengths((prev) => {
            const updated = new Map(prev);
            updated.set(itemId, length);
            return updated;
        });
    }, []);

    // Calculate font size based on total characters (wrapping paragraph)
    useEffect(() => {
        const calculateFontSize = () => {
            // Calculate total displayed characters
            let totalChars = 0;
            displayedLengths.forEach((length) => {
                totalChars += length;
            });

            // If no text, use a large default size
            if (totalChars === 0) {
                setFontSize(120);
                return;
            }

            // Get viewport dimensions
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const padding = 64; // Account for padding (2rem = 32px on each side)
            const availableWidth = viewportWidth - padding;
            const availableHeight = viewportHeight - padding;

            // Start with a base size and adjust
            const minFontSize = 12;
            const maxFontSize = 200;

            // Estimate: assume average character width is about 0.6em
            // Text will wrap naturally, so we need to estimate how many lines it will take
            // and ensure the total height fits within the viewport

            // Try different font sizes to find the best fit
            // We want: (estimatedLines * fontSize * lineHeight) <= availableHeight
            const lineHeight = 1.2; // Line height multiplier

            // Iterative approach to find optimal font size
            let bestSize = minFontSize;

            // Try a few sizes to find the best fit
            for (let testSize = maxFontSize; testSize >= minFontSize; testSize -= 5) {
                const charWidthMultiplier = 0.5;
                const charsPerLine = Math.max(1, Math.floor(availableWidth / (testSize * charWidthMultiplier)));
                const estimatedLines = Math.ceil(totalChars / charsPerLine);
                const totalHeight = estimatedLines * testSize * lineHeight;

                if (totalHeight <= availableHeight) {
                    bestSize = testSize;
                    break;
                }
            }

            // If we couldn't find a good fit, use the maximum that fits vertically
            if (bestSize === minFontSize) {
                // Estimate minimum lines needed
                const charsPerLineMin = Math.max(1, Math.floor(availableWidth / (minFontSize * 0.6)));
                const minLines = Math.ceil(totalChars / charsPerLineMin);
                bestSize = Math.min(maxFontSize, availableHeight / (minLines * lineHeight));
            }

            // Clamp to min/max
            bestSize = Math.max(minFontSize, Math.min(maxFontSize, bestSize));

            setFontSize(bestSize);
        };

        calculateFontSize();

        // Recalculate on window resize
        const handleResize = () => {
            calculateFontSize();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [displayedLengths]);

    return (
        <div
            ref={containerRef}
            style={{
                fontSize: `${fontSize}px`,
                transition: 'font-size 0.3s ease-out',
                height: '100vh',
                width: '100vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                boxSizing: 'border-box',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    width: '100%',
                    lineHeight: 1.2,
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                }}
            >
                {texts.map((item) => {
                    const itemId = String(item.id);
                    return (
                        <TextItem
                            key={item.id}
                            item={item}
                            isNew={newTextIds.has(itemId)}
                            onDisplayedLengthChange={(length) => handleDisplayedLengthChange(itemId, length)}
                        />
                    );
                })}
            </div>
        </div>
    );
}

