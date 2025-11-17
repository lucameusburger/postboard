declare module 'swearify' {
  interface FilterResult {
    found: boolean;
    selected_languages?: string[];
    bad_words?: string[];
    filtered_sentense?: string;
    allowed_words?: string[];
  }

  export function findAndFilter(
    sentence: string,
    placeholder: string,
    languages: string[],
    allowedWords: string[],
    customWords: string[]
  ): FilterResult;
}

