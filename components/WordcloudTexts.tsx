'use client';

import * as d3 from 'd3';

import { useEffect, useRef } from 'react';

import type { Post } from '@/lib/directus';
import { useRealtimeTexts } from '@/hooks/useRealtimeTexts';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const cloud = require('d3-cloud');

interface WordcloudTextsProps {
    initialTexts: Post[];
    collectionName: string;
}

interface WordData {
    text: string;
    size: number;
    x?: number;
    y?: number;
    rotate?: number;
}

export default function WordcloudTexts({
    initialTexts,
    collectionName,
}: WordcloudTextsProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const { texts } = useRealtimeTexts({
        initialTexts,
        collectionName,
    });

    useEffect(() => {
        if (!svgRef.current) return;

        // Clear previous content
        d3.select(svgRef.current).selectAll('*').remove();

        // Get dimensions
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Set up SVG
        const svg = d3
            .select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        // Create a group for the words
        const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

        // Extract words from all texts
        const words: { text: string; count: number }[] = [];
        const wordCounts = new Map<string, number>();

        texts.forEach((post) => {
            // Split text into words (simple approach - split by spaces)
            const postWords = post.content
                .toLowerCase()
                .split(/\s+/)
                .filter((word) => word.length > 0);

            postWords.forEach((word) => {
                wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
            });
        });

        // Convert to array format
        wordCounts.forEach((count, text) => {
            words.push({ text, count });
        });

        // If no words, return early
        if (words.length === 0) {
            return;
        }

        // Calculate size range for fontSize function
        const maxCount = Math.max(...words.map((w) => w.count));
        const minCount = Math.min(...words.map((w) => w.count));
        const sizeScale = d3.scaleLinear().domain([minCount, maxCount]).range([10, 100]);

        // Prepare data for d3-cloud - pass count directly, let fontSize handle scaling
        const layout = cloud()
            .size([width, height])
            .words(
                words.map((d) => ({
                    text: d.text,
                    count: d.count,
                }))
            )
            .padding(8)
            .rotate(() => Math.random() * 360) // Random rotation: 0 to 360 degrees
            // .fontSize((d: { text: string; count: number }) => sizeScale(d.count))
            .fontSize(60)
            .on('end', (wordsData: WordData[]) => {
                // Draw the words
                g.selectAll('text')
                    .data(wordsData)
                    .enter()
                    .append('text')
                    .style('font-size', (d) => `${d.size}px`)
                    .style('fill', 'var(--foreground)')
                    .style('text-anchor', 'middle')
                    .attr('text-anchor', 'middle')
                    .attr('transform', (d) => `translate(${d.x},${d.y})rotate(${d.rotate || 0})`)
                    .text((d) => d.text);
            });

        layout.start();

        // Handle window resize
        const handleResize = () => {
            // Re-run the layout on resize
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;

            svg.attr('width', newWidth).attr('height', newHeight);
            g.attr('transform', `translate(${newWidth / 2},${newHeight / 2})`);

            // Recreate layout with new dimensions
            const newLayout = cloud()
                .size([newWidth, newHeight])
                .words(
                    words.map((d) => ({
                        text: d.text,
                        count: d.count,
                    }))
                )
                .padding(2)
                .rotate(() => Math.random() * 360) // Random rotation: 0 to 360 degrees
                .font('GrotzecPoster')
                .fontSize((d: { text: string; count: number }) => sizeScale(d.count))
                .on('end', (wordsData: WordData[]) => {
                    // Clear and redraw
                    g.selectAll('text').remove();
                    g.selectAll('text')
                        .data(wordsData)
                        .enter()
                        .append('text')
                        .style('font-size', (d) => `${d.size}px`)
                        .style('font-family', 'GrotzecPoster, var(--font-geist-sans)')
                        .style('fill', 'var(--foreground)')
                        .style('text-anchor', 'middle')
                        .attr('text-anchor', 'middle')
                        .attr('transform', (d) => `translate(${d.x},${d.y})rotate(${d.rotate || 0})`)
                        .text((d) => d.text);
                });

            newLayout.start();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [texts]);

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
}

