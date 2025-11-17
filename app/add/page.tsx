'use client';

import { useRef, useState } from 'react';

import FixedButton from '@/components/FixedButton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AddTextPage() {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    return (
        <div className="min-h-screen text-5xl">
            <main className="container mx-auto max-w-2xl p-4">


                <div className="">
                    <div className="flex justify-between items-center">
                        <h1 className="mb-6 text-foreground">
                            {process.env.NEXT_PUBLIC_ADD_TEXT || "Text hinzufügen"}
                        </h1>
                    </div>

                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 pb-24">
                        <div>
                            <label
                                htmlFor="content"
                                className=" mb-2 text-sm font-medium text-foreground  sr-only"
                            >
                                Text
                            </label>
                            <textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                                rows={10}
                                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-foreground placeholder-zinc-500 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                                placeholder="Für mich ist ..."
                            />
                        </div>

                        {error && (
                            <div className="rounded-lg bg-red-50 p-4 text-red-800">
                                {error}
                            </div>
                        )}
                    </form>
                </div>
            </main>

            <FixedButton
                type="submit"
                className='max-w-2xl mx-auto'
                disabled={isSubmitting}
                onClick={() => formRef.current?.requestSubmit()}
            >
                {isSubmitting ? 'Speichern...' : 'Speichern'}
            </FixedButton>
        </div>
    );
}

