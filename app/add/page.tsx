'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AddTextPage() {
    const router = useRouter();
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
                throw new Error('Failed to create text');
            }

            router.push('/');
            router.refresh();
        } catch (err) {
            setError('Fehler beim Hinzufügen des Textes. Bitte versuchen Sie es erneut.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50">
            <main className="container mx-auto max-w-2xl px-4 py-16">
                <Link
                    href="/"
                    className="mb-8 inline-block text-foreground hover:underline"
                >
                    ← Zurück
                </Link>

                <div className="rounded-lg bg-white p-8 shadow-sm">
                    <h1 className="mb-6 text-2xl font-semibold text-foreground">
                        Text hinzufügen
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="content"
                                className="block mb-2 text-sm font-medium text-foreground"
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
                                placeholder="Geben Sie hier Ihren Text ein..."
                            />
                        </div>

                        {error && (
                            <div className="rounded-lg bg-red-50 p-4 text-red-800">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-full bg-foreground px-8 py-4 text-background font-medium transition-colors hover:bg-[#383838] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Wird gespeichert...' : 'Text speichern'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}

