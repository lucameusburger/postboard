import { NextRequest, NextResponse } from 'next/server';

import { createText } from '@/lib/directus';
import { findAndFilter } from 'swearify';

/**
 * Checks if a word appears as a complete word (not a substring) in the text.
 * Uses word boundaries to ensure we only match whole words.
 */
function isCompleteWord(text: string, word: string): boolean {
  // Create a regex pattern that matches the word with word boundaries
  // Escape special regex characters in the word
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Use word boundaries (\b) to match complete words only
  // Case-insensitive matching
  const wordBoundaryRegex = new RegExp(`\\b${escapedWord}\\b`, 'i');
  return wordBoundaryRegex.test(text);
}

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Check for profanity (English and German)
    const filterResult = findAndFilter(
      content,
      '*', // placeholder (not used since we're blocking, not filtering)
      ['en', 'de'], // English and German
      [], // no allowed words
      [] // no custom words
    );

    // If swearwords were found, verify they are complete words (not substrings)
    if (filterResult.found && filterResult.bad_words && filterResult.bad_words.length > 0) {
      // Check if any of the detected bad words are actually complete words
      const hasCompleteBadWord = filterResult.bad_words.some((badWord) =>
        isCompleteWord(content, badWord)
      );

      if (hasCompleteBadWord) {
        // Block the entire post
        return NextResponse.json(
          { error: 'Ihr Beitrag enthält unangemessene Inhalte und kann nicht veröffentlicht werden.' },
          { status: 400 }
        );
      }
      // If no complete words were found, it was a false positive (substring match)
      // Allow the post to proceed
    }

    // No swearwords found or only false positives - allow the post
    const result = await createText(content);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating text:', error);
    return NextResponse.json(
      { error: 'Failed to create text' },
      { status: 500 }
    );
  }
}

