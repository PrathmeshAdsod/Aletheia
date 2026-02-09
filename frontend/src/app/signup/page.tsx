'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/Card';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        const { error: signUpError } = await signUp(email, password);

        if (signUpError) {
            setError(signUpError.message || 'Failed to create account');
            setLoading(false);
        } else {
            // Success - redirect to login
            router.push('/login');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12">
                <div className="max-w-md">
                    <Link href="/" className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-2xl">A</span>
                        </div>
                        <span className="text-3xl font-bold text-text-primary">Aletheia</span>
                    </Link>

                    <h1 className="text-4xl font-bold text-text-primary mb-4">
                        Start preserving your institutional memory
                    </h1>
                    <p className="text-xl text-text-secondary mb-8">
                        Join teams using Aletheia to prevent strategic misalignment and maintain institutional clarity.
                    </p>

                    <div className="space-y-4">
                        {[
                            'Upload documents and extract decisions automatically',
                            'Build causal decision graphs with AI',
                            'Detect contradictions before they cause problems'
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <CheckCircle className="text-primary" size={20} />
                                <span className="text-text-secondary">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center">
                <Card className="w-full max-w-md p-8 shadow-xl">
                    <div className="mb-8 lg:hidden">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">A</span>
                            </div>
                            <span className="text-2xl font-bold text-text-primary">Aletheia</span>
                        </Link>
                    </div>

                    <h2 className="text-2xl font-bold text-text-primary mb-2">Create account</h2>
                    <p className="text-text-secondary mb-6">
                        Get started with your free trial
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-conflict-light border border-conflict rounded-lg">
                            <p className="text-sm text-conflict">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={20} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary placeholder:text-text-tertiary"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary placeholder:text-text-tertiary"
                                    placeholder="you@company.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary placeholder:text-text-tertiary"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <p className="text-xs text-text-tertiary mt-1">Must be at least 6 characters</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary placeholder:text-text-tertiary"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? 'Creating account...' : 'Create account'}
                            {!loading && <ArrowRight size={20} />}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-text-secondary text-sm">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary hover:text-primary-hover font-semibold">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
