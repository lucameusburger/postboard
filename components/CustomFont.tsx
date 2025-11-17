'use client';

import { useEffect } from 'react';

export default function CustomFont() {
    useEffect(() => {
        const customFontName = process.env.NEXT_PUBLIC_CUSTOM_FONT;

        if (!customFontName) {
            console.log('CustomFont: No NEXT_PUBLIC_CUSTOM_FONT environment variable set');
            return;
        }

        console.log('CustomFont: Loading font:', customFontName);

        // Generate a safe font family name from the filename
        const fontFamilyName = customFontName
            .replace(/\.(otf|ttf|woff|woff2)$/i, '')
            .replace(/[^a-zA-Z0-9]/g, '-');

        // Determine font format based on file extension
        const format = customFontName.endsWith('.otf')
            ? 'opentype'
            : customFontName.endsWith('.ttf')
                ? 'truetype'
                : customFontName.endsWith('.woff2')
                    ? 'woff2'
                    : customFontName.endsWith('.woff')
                        ? 'woff'
                        : 'opentype';

        // Inject @font-face rule
        const styleId = 'custom-font-face';
        if (document.getElementById(styleId)) {
            console.log('CustomFont: Font already injected');
            return; // Already injected
        }

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @font-face {
                font-family: '${fontFamilyName}';
                src: url('/${customFontName}') format('${format}');
                font-display: swap;
            }
            :root {
                --font-custom: '${fontFamilyName}', var(--font-geist-sans);
            }
        `;
        document.head.appendChild(style);
        console.log('CustomFont: Font injected successfully. Font family:', fontFamilyName);
    }, []);

    return null;
}

