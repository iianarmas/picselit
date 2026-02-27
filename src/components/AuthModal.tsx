import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Loader2 } from 'lucide-react';

interface AuthModalProps {
    onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (mode === 'register') {
                if (password !== confirmPassword) {
                    throw new Error('Passwords do not match');
                }
                if (!firstName || !lastName || !email || !password) {
                    throw new Error('Please fill in all fields');
                }

                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                        },
                    },
                });

                if (signUpError) throw signUpError;
                setMessage('Registration successful! Please check your email for a confirmation link.');
            } else {
                if (!email || !password) {
                    throw new Error('Please fill in all fields');
                }

                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;
                onClose(); // Close modal on successful login
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                className="w-full max-w-md rounded-xl p-6 relative shadow-2xl"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
                        {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
                    </h2>
                    <p className="text-sm mt-1 text-[var(--color-muted)]">
                        {mode === 'login'
                            ? 'Log in to save your pixel art projects.'
                            : 'Sign up to start saving your progress.'}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg text-sm bg-red-500/10 text-red-500 border border-red-500/20">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="mb-4 p-3 rounded-lg text-sm bg-green-500/10 text-green-500 border border-green-500/20">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'register' && (
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-medium mb-1 text-[var(--color-text)]">First Name</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                                    placeholder="John"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-medium mb-1 text-[var(--color-text)]">Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium mb-1 text-[var(--color-text)]">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                            placeholder="hello@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium mb-1 text-[var(--color-text)]">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                            placeholder="••••••••"
                        />
                    </div>

                    {mode === 'register' && (
                        <div>
                            <label className="block text-xs font-medium mb-1 text-[var(--color-text)]">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                                placeholder="••••••••"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 mt-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
                        style={{ background: 'var(--color-accent)', color: 'white', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-[var(--color-muted)]">
                    {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                    <button
                        type="button"
                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                        className="font-medium hover:underline text-[var(--color-accent)]"
                    >
                        {mode === 'login' ? 'Sign Up' : 'Log In'}
                    </button>
                </div>
            </div>
        </div>
    );
}
