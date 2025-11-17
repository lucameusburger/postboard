'use client';

import { createDirectus, realtime, staticToken } from '@directus/sdk';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Post } from '@/lib/directus';
import TextItem from './TextItem';

interface RealtimeTextsProps {
    initialTexts: Post[];
    collectionName: string;
}

interface OverlayItem {
    id: string;
    content: string;
    startTime: number;
}

export default function RealtimeTexts({
    initialTexts,
    collectionName,
}: RealtimeTextsProps) {
    // Ensure initial texts are sorted by date_created (oldest first, latest at end)
    const sortedInitialTexts = [...initialTexts].sort((a, b) => {
        const dateA = a.date_created ? new Date(a.date_created).getTime() : 0;
        const dateB = b.date_created ? new Date(b.date_created).getTime() : 0;
        return dateA - dateB;
    });
    const [texts, setTexts] = useState<Post[]>(sortedInitialTexts);
    const [newTextIds, setNewTextIds] = useState<Set<string>>(new Set());
    // Initialize displayed lengths for initial texts
    // Logo counts as 1 character, then text content + space
    const [displayedLengths, setDisplayedLengths] = useState<Map<string, number>>(() => {
        const initialMap = new Map<string, number>();
        sortedInitialTexts.forEach((text) => {
            const fullText = `${text.content} `;
            // Logo (1) + text length
            initialMap.set(String(text.id), fullText.length + 1);
        });
        return initialMap;
    });
    const [fontSize, setFontSize] = useState<number>(48);
    const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Overlay animation queue
    const [currentOverlay, setCurrentOverlay] = useState<OverlayItem | null>(null);
    const [overlayDisplayedLength, setOverlayDisplayedLength] = useState<number>(0);
    const [overlayExiting, setOverlayExiting] = useState<boolean>(false);
    const overlayQueueRef = useRef<OverlayItem[]>([]);
    const isProcessingOverlayRef = useRef<boolean>(false);
    const overlayTypewriterIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const OVERLAY_CHAR_DELAY = 40; // ms per character for typewriter
    const OVERLAY_DISPLAY_TIME = 2000; // ms to display full text after typing completes
    const OVERLAY_EXIT_DURATION = 300; // ms for swipe out animation

    // Process overlay queue
    const processOverlayQueue = useCallback(() => {
        if (isProcessingOverlayRef.current || overlayQueueRef.current.length === 0) {
            return;
        }

        const nextItem = overlayQueueRef.current.shift();
        if (!nextItem) {
            return;
        }

        isProcessingOverlayRef.current = true;
        setCurrentOverlay(nextItem);
        setOverlayDisplayedLength(0);
        setOverlayExiting(false);

        // Start typewriter animation
        const textLength = nextItem.content.length;
        let currentLength = 0;

        // Clear any existing interval
        if (overlayTypewriterIntervalRef.current) {
            clearInterval(overlayTypewriterIntervalRef.current);
        }

        overlayTypewriterIntervalRef.current = setInterval(() => {
            currentLength++;
            setOverlayDisplayedLength(currentLength);

            if (currentLength >= textLength) {
                if (overlayTypewriterIntervalRef.current) {
                    clearInterval(overlayTypewriterIntervalRef.current);
                    overlayTypewriterIntervalRef.current = null;
                }

                // After typing completes, show full text for a bit, then swipe out
                setTimeout(() => {
                    setOverlayExiting(true);

                    // After exit animation completes, remove overlay and process next
                    setTimeout(() => {
                        setCurrentOverlay(null);
                        setOverlayDisplayedLength(0);
                        setOverlayExiting(false);
                        isProcessingOverlayRef.current = false;

                        // Process next item in queue
                        if (overlayQueueRef.current.length > 0) {
                            setTimeout(() => processOverlayQueue(), 100); // Small delay between overlays
                        }
                    }, OVERLAY_EXIT_DURATION);
                }, OVERLAY_DISPLAY_TIME);
            }
        }, OVERLAY_CHAR_DELAY);
    }, []);

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
                                // Initialize displayed length to 0 for new text (will animate)
                                setDisplayedLengths((prev) => {
                                    const updated = new Map(prev);
                                    updated.set(String(newText.id), 0);
                                    return updated;
                                });

                                // Add to overlay queue
                                const overlayItem: OverlayItem = {
                                    id: String(newText.id),
                                    content: newText.content,
                                    startTime: Date.now(),
                                };
                                overlayQueueRef.current.push(overlayItem);

                                // Process overlay queue
                                processOverlayQueue();

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
            if (overlayTypewriterIntervalRef.current) {
                clearInterval(overlayTypewriterIntervalRef.current);
                overlayTypewriterIntervalRef.current = null;
            }
        };
    }, [collectionName, processOverlayQueue]);

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
            const lineHeight = 1; // Line height multiplier

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
        <>
            <div
                ref={containerRef}
                style={{
                    fontSize: `${fontSize}px`,
                    transition: 'font-size 0.3s ease-out',
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        lineHeight: 0.92,
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

            {/* Overlay for new items */}
            {currentOverlay && (() => {
                // Adjust font size based on text length (max 100 chars)
                const textLength = currentOverlay.content.length;
                let fontSize: string;

                if (textLength <= 30) {
                    fontSize = 'clamp(4rem, 20vw, 15rem)';
                } else if (textLength <= 60) {
                    fontSize = 'clamp(3rem, 15vw, 12rem)';
                } else {
                    fontSize = 'clamp(2rem, 10vw, 8rem)';
                }

                return (
                    <div
                        style={{
                            backgroundColor: 'var(--accent)',
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            pointerEvents: 'none',
                            fontFamily: "'GrotzecPoster', var(--font-geist-sans)",
                            textTransform: 'uppercase',
                            transition: overlayExiting ? 'opacity 0.3s ease-out' : 'none',
                            opacity: overlayExiting ? 0 : 1,

                        }}
                    >
                        <div
                            style={{
                                fontSize: fontSize,
                                color: 'var(--background)',
                                fontWeight: 900,
                                textAlign: 'center',
                                padding: '2rem',
                                lineHeight: 1,
                                wordWrap: 'break-word',
                                maxWidth: '90vw',

                            }}
                        >
                            {currentOverlay.content.slice(0, overlayDisplayedLength)}
                            {overlayDisplayedLength < currentOverlay.content.length && (
                                <span style={{ opacity: 0.5 }}>|</span>
                            )}
                        </div>
                    </div>
                );
            })()}
        </>
    );
}

