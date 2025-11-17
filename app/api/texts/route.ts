import { NextRequest, NextResponse } from 'next/server';

import { createText } from '@/lib/directus';
import { findAndFilter } from 'swearify';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Filter out profanity (English and German)
    const filterResult = findAndFilter(
      content,
      '*', // placeholder for filtered words
      ['en', 'de'], // English and German
      [], // no allowed words
      [] // no custom words
    );

    const filteredContent = filterResult.found
      ? filterResult.filtered_sentense || content
      : content;

    const result = await createText(filteredContent);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating text:', error);
    return NextResponse.json(
      { error: 'Failed to create text' },
      { status: 500 }
    );
  }
}

