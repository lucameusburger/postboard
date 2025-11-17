'use client';

import { useEffect, useRef, useState } from 'react';

import FixedButton from '@/components/FixedButton';
import { useRouter } from 'next/navigation';

export default function AddTextPage() {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Autofocus the textarea when component mounts
        textareaRef.current?.focus();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/texts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to create text');
            }

            router.push('/');
            router.refresh();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Fehler beim Hinzufügen des Textes. Bitte versuchen Sie es erneut.';
            setError(errorMessage);
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const MAX_LENGTH = 100;

    return (
        <div className="min-h-screen text-5xl flex flex-col">
            <main className="flex-1 flex flex-col p-4 pb-24 relative">
                <form ref={formRef} onSubmit={handleSubmit} className="flex-1 flex flex-col">
                    <textarea
                        ref={textareaRef}
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                        maxLength={MAX_LENGTH}
                        className="flex-1 w-full text-foreground placeholder-zinc-500 bg-transparent border-none outline-none resize-none focus:outline-none"
                        placeholder={process.env.NEXT_PUBLIC_ADD_TEXT || "Für mich ist ..."}
                    />

                    {error && (
                        <div className="rounded-lg bg-red-50 p-4 text-red-800 text-base mb-4">
                            {error}
                        </div>
                    )}
                </form>
                <div className="absolute top-4 right-4 text-sm text-zinc-400">
                    {content.length}/{MAX_LENGTH}
                </div>
            </main>

            <FixedButton
                type="submit"
                disabled={isSubmitting || !content.trim()}
                onClick={() => formRef.current?.requestSubmit()}
            >
                {isSubmitting ? 'Speichern...' : 'Speichern'}
            </FixedButton>
        </div>
    );
}

