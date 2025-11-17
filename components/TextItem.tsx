'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Logo from './LogoSquare';
import type { Post } from '@/lib/directus';

interface TextItemProps {
    item: Post;
    isNew?: boolean;
    onDisplayedLengthChange?: (length: number) => void;
}

export default function TextItem({ item, isNew = false, onDisplayedLengthChange }: TextItemProps) {
    // Animation duration in milliseconds (font-weight deflation time)
    const FONT_WEIGHT_ANIMATION_DURATION = 400;

    const fullText = useMemo(() => `${item.content} `, [item.content]);
    // Add 1 to account for the logo
    const fullTextLength = fullText.length + 1;
    const [displayedLength, setDisplayedLength] = useState<number>(
        isNew ? 0 : fullTextLength
    );
    // Track when each character appeared (timestamp)
    const [characterTimestamps, setCharacterTimestamps] = useState<Map<number, number>>(new Map());
    // Ref to access latest timestamps in interval
    const timestampsRef = useRef<Map<number, number>>(new Map());
    // Ref to track animation interval
    const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    // Track if we've started animating (so we continue even if isNew becomes false)
    const hasStartedAnimatingRef = useRef<boolean>(false);
    // Force re-render to update font weights
    const [, setAnimationTick] = useState(0);

    useEffect(() => {
        if (!isNew) {
            // Show full text immediately for non-new items
            setDisplayedLength(fullTextLength);
            return;
        }

        // Start typewriter effect for new items
        let currentLength = 0;

        const typeInterval = setInterval(() => {
            currentLength++;
            const now = Date.now();
            setCharacterTimestamps((prev) => {
                const updated = new Map(prev);
                updated.set(currentLength - 1, now); // -1 because displayedLength includes logo
                timestampsRef.current = updated; // Update ref
                return updated;
            });
            setDisplayedLength(currentLength);

            if (currentLength >= fullTextLength) {
                clearInterval(typeInterval);
            }
        }, 60); // Adjust speed here (lower = faster, higher = slower)

        return () => clearInterval(typeInterval);
    }, [isNew, fullTextLength]);

    // Continuously update font weights for animation
    useEffect(() => {
        // Start animation interval when isNew becomes true
        if (isNew && !hasStartedAnimatingRef.current) {
            hasStartedAnimatingRef.current = true;
        }

        // Start animation interval if we've started animating and don't have one yet
        // Continue running even if isNew becomes false, until all characters finish
        if (hasStartedAnimatingRef.current && !animationIntervalRef.current) {
            animationIntervalRef.current = setInterval(() => {
                // Always update the tick to force re-render
                // The render function will calculate the correct font-weight based on timestamps
                setAnimationTick((prev) => prev + 1);

                // Check if we should stop the interval (all characters finished animating)
                const now = Date.now();
                let allFinished = true;

                // Only stop if we have characters and all are done
                if (timestampsRef.current.size > 0) {
                    timestampsRef.current.forEach((timestamp) => {
                        if (now - timestamp < FONT_WEIGHT_ANIMATION_DURATION) {
                            allFinished = false;
                        }
                    });

                    // Stop interval only when all characters have finished
                    if (allFinished && animationIntervalRef.current) {
                        clearInterval(animationIntervalRef.current);
                        animationIntervalRef.current = null;
                        hasStartedAnimatingRef.current = false;
                    }
                }
            }, 16); // ~60fps for smooth animation
        }

        // Only clear interval if we're not animating and it's not a new item
        if (!isNew && !hasStartedAnimatingRef.current && animationIntervalRef.current) {
            clearInterval(animationIntervalRef.current);
            animationIntervalRef.current = null;
        }

        return () => {
            // Don't clear on unmount if we're still animating - let it finish naturally
            // Only clear if component unmounts and we're not animating
            if (!hasStartedAnimatingRef.current && animationIntervalRef.current) {
                clearInterval(animationIntervalRef.current);
                animationIntervalRef.current = null;
            }
        };
    }, [isNew]); // Depend on isNew, but continue animation even after it becomes false

    // Notify parent of displayed length changes
    useEffect(() => {
        onDisplayedLengthChange?.(displayedLength);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayedLength]); // Only depend on displayedLength, not the callback

    // Show logo if displayedLength > 0, then show text
    const showLogo = displayedLength > 0;
    const textLength = Math.max(0, displayedLength - 1);
    const displayedText = fullText.slice(0, textLength);

    // Find the first word boundary (space or end of text)
    const firstSpaceIndex = displayedText.indexOf(' ');
    const firstWordEnd = firstSpaceIndex === -1 ? displayedText.length : firstSpaceIndex;

    // Split text into first word and rest
    const firstWordText = displayedText.slice(0, firstWordEnd);
    const restOfText = displayedText.slice(firstWordEnd);
    const firstWordChars = firstWordText.split('');
    const restChars = restOfText.split('');

    return (
        <span
            style={{
                display: 'inline',
                letterSpacing: '-0.04em',
            }}
        >
            {showLogo && firstWordText.length > 0 && (
                <span style={{ whiteSpace: 'nowrap', display: 'inline' }}>
                    <Logo
                        style={{
                            display: 'inline-block',
                            height: '0.7em',
                            width: '0.4em',
                            verticalAlign: 'baseline',
                            marginRight: '0.1em',
                        }}
                    />
                    {firstWordChars.map((char, index) => {
                        // Check if we should animate (either isNew or we've started animating)
                        const shouldAnimate = isNew || hasStartedAnimatingRef.current;

                        // For items that were never new, use normal font weight
                        if (!shouldAnimate) {
                            return (
                                <span
                                    key={index}
                                    style={{
                                        display: 'inline',
                                        fontWeight: 400,
                                    }}
                                >
                                    {char}
                                </span>
                            );
                        }

                        // For items being animated, check timestamp
                        const timestamp = characterTimestamps.get(index);
                        if (!timestamp) {
                            return (
                                <span
                                    key={index}
                                    style={{
                                        display: 'inline',
                                        fontWeight: 400,
                                    }}
                                >
                                    {char}
                                </span>
                            );
                        }

                        const now = Date.now();
                        const age = now - timestamp;

                        // If animation is complete, use normal weight
                        if (age >= FONT_WEIGHT_ANIMATION_DURATION) {
                            return (
                                <span
                                    key={index}
                                    style={{
                                        display: 'inline',
                                        fontWeight: 400,
                                    }}
                                >
                                    {char}
                                </span>
                            );
                        }

                        const animationProgress = age / FONT_WEIGHT_ANIMATION_DURATION;
                        const fontWeight = Math.round(900 - (900 - 400) * animationProgress);

                        return (
                            <span
                                key={index}
                                style={{
                                    display: 'inline',
                                    fontWeight: fontWeight,
                                    transition: 'font-weight 0.05s linear',
                                }}
                            >
                                {char}
                            </span>
                        );
                    })}
                </span>
            )}
            {showLogo && firstWordText.length === 0 && (
                <Logo
                    style={{
                        display: 'inline-block',
                        height: '0.7em',
                        width: '0.4em',
                        verticalAlign: 'baseline',
                        marginRight: '0.1em',
                    }}
                />
            )}
            {restChars.map((char, index) => {
                const actualIndex = firstWordEnd + index;
                // Check if we should animate (either isNew or we've started animating)
                const shouldAnimate = isNew || hasStartedAnimatingRef.current;

                // For items that were never new, use normal font weight
                if (!shouldAnimate) {
                    return (
                        <span
                            key={actualIndex}
                            style={{
                                display: 'inline',
                                fontWeight: 400,
                            }}
                        >
                            {char}
                        </span>
                    );
                }

                // For items being animated, check timestamp
                const timestamp = characterTimestamps.get(actualIndex);
                if (!timestamp) {
                    return (
                        <span
                            key={actualIndex}
                            style={{
                                display: 'inline',
                                fontWeight: 400,
                            }}
                        >
                            {char}
                        </span>
                    );
                }

                const now = Date.now();
                const age = now - timestamp;

                // If animation is complete, use normal weight
                if (age >= FONT_WEIGHT_ANIMATION_DURATION) {
                    return (
                        <span
                            key={actualIndex}
                            style={{
                                display: 'inline',
                                fontWeight: 400,
                            }}
                        >
                            {char}
                        </span>
                    );
                }

                const animationProgress = age / FONT_WEIGHT_ANIMATION_DURATION;
                const fontWeight = Math.round(900 - (900 - 400) * animationProgress);

                return (
                    <span
                        key={actualIndex}
                        style={{
                            display: 'inline',
                            fontWeight: fontWeight,
                            transition: 'font-weight 0.05s linear',
                        }}
                    >
                        {char}
                    </span>
                );
            })}
        </span>
    );
}

