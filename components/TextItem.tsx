'use client';

import { useEffect, useMemo, useState } from 'react';

import type { Post } from '@/lib/directus';

interface TextItemProps {
    item: Post;
    isNew?: boolean;
    onDisplayedLengthChange?: (length: number) => void;
}

export default function TextItem({ item, isNew = false, onDisplayedLengthChange }: TextItemProps) {
    const fullText = useMemo(() => `#${item.content} `, [item.content]);
    const [displayedLength, setDisplayedLength] = useState<number>(
        isNew ? 0 : fullText.length
    );

    useEffect(() => {
        if (!isNew) {
            // Show full text immediately for non-new items
            setDisplayedLength(fullText.length);
            return;
        }

        // Start typewriter effect for new items
        let currentLength = 0;

        const typeInterval = setInterval(() => {
            currentLength++;
            setDisplayedLength(currentLength);

            if (currentLength >= fullText.length) {
                clearInterval(typeInterval);
            }
        }, 60); // Adjust speed here (lower = faster, higher = slower)

        return () => clearInterval(typeInterval);
    }, [isNew, fullText]);

    // Notify parent of displayed length changes
    useEffect(() => {
        onDisplayedLengthChange?.(displayedLength);
    }, [displayedLength, onDisplayedLengthChange]);

    // Also notify on mount/initial state
    useEffect(() => {
        onDisplayedLengthChange?.(displayedLength);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const displayedText = fullText.slice(0, displayedLength);

    return <span style={{ display: 'inline' }}>{displayedText}</span>;
}

