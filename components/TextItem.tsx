'use client';

import { useEffect, useMemo, useState } from 'react';

import Logo from './LogoSquare';
import type { Post } from '@/lib/directus';

interface TextItemProps {
    item: Post;
    isNew?: boolean;
    onDisplayedLengthChange?: (length: number) => void;
}

export default function TextItem({ item, isNew = false, onDisplayedLengthChange }: TextItemProps) {
    const fullText = useMemo(() => `${item.content} `, [item.content]);
    // Add 1 to account for the logo
    const fullTextLength = fullText.length + 1;
    const [displayedLength, setDisplayedLength] = useState<number>(
        isNew ? 0 : fullTextLength
    );

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
            setDisplayedLength(currentLength);

            if (currentLength >= fullTextLength) {
                clearInterval(typeInterval);
            }
        }, 60); // Adjust speed here (lower = faster, higher = slower)

        return () => clearInterval(typeInterval);
    }, [isNew, fullTextLength]);

    // Notify parent of displayed length changes
    useEffect(() => {
        onDisplayedLengthChange?.(displayedLength);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayedLength]); // Only depend on displayedLength, not the callback

    // Show logo if displayedLength > 0, then show text
    const showLogo = displayedLength > 0;
    const textLength = Math.max(0, displayedLength - 1);
    const displayedText = fullText.slice(0, textLength);

    // Get custom font name if set
    const customFontName = process.env.NEXT_PUBLIC_CUSTOM_FONT;
    const fontFamily = customFontName
        ? `'${customFontName.replace(/\.(otf|ttf|woff|woff2)$/i, '').replace(/[^a-zA-Z0-9]/g, '-')}', var(--font-geist-sans)`
        : 'var(--font-geist-sans)';

    return (
        <span
            style={{
                display: 'inline',
                fontFamily: fontFamily,
                textTransform: 'uppercase',
            }}
        >
            {showLogo && (
                <Logo
                    style={{
                        display: 'inline-block',
                        height: '0.7em',
                        width: '0.7em',
                        verticalAlign: 'baseline',
                        marginRight: '0.1em',
                    }}
                />
            )}
            {displayedText}
        </span>
    );
}

