'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/Card';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error: signInError } = await signIn(email, password);

        if (signInError) {
            setError(signInError.message || 'Invalid credentials');
            setLoading(false);
        } else {
            router.push('/dashboard');
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
                        Welcome back
                    </h1>
                    <p className="text-xl text-text-secondary mb-8">
                        Sign in to access your institutional memory graph and prevent strategic misalignment.
                    </p>

                    <div className="space-y-4">
                        {[
                            'Causal decision graph visualization',
                            'Real-time conflict detection',
                            'Citation-enforced Oracle queries'
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <CheckCircle className="text-primary" size={20} />
                                <span className="text-text-secondary">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
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

                    <h2 className="text-2xl font-bold text-text-primary mb-2">Sign in</h2>
                    <p className="text-text-secondary mb-6">
                        Enter your credentials to access your account
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-conflict-light border border-conflict rounded-lg">
                            <p className="text-sm text-conflict">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                            {!loading && <ArrowRight size={20} />}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-text-secondary text-sm">
                            Don't have an account?{' '}
                            <Link href="/signup" className="text-primary hover:text-primary-hover font-semibold">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
