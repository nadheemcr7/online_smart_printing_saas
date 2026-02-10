"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import {
    ShieldAlert,
    Users,
    BarChart3,
    LayoutDashboard,
    Activity,
    Settings,
    LogOut,
    Loader2,
    CheckCircle2,
    XCircle,
    Package
} from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function DeveloperDashboard() {
    const { user, profile, loading: authLoading, signOut, supabase } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Protect client side
    useEffect(() => {
        if (!authLoading && !user) {
            window.location.replace("/login");
        }
    }, [user, authLoading]);

    useEffect(() => {
        if (!user || profile?.role !== 'developer' || authLoading) return;

        const fetchGlobalStats = async () => {
            // Get total platform stats
            const { data: orders } = await supabase.from('orders').select('estimated_cost, payment_status, status');
            const { data: users } = await supabase.from('profiles').select('role');

            const totalRevenue = orders?.filter(o => o.payment_status === 'paid').reduce((acc, o) => acc + Number(o.estimated_cost), 0) || 0;
            const totalOrders = orders?.length || 0;
            const shopOwners = users?.filter(u => u.role === 'owner').length || 0;
            const totalStudents = users?.filter(u => u.role === 'customer').length || 0;

            setStats({
                totalRevenue,
                totalOrders,
                shopOwners,
                totalStudents
            });

            // Get recent global activity
            const { data: recent } = await supabase
                .from('orders')
                .select('*, profiles:customer_id(full_name)')
                .order('created_at', { ascending: false })
                .limit(10);

            setRecentOrders(recent || []);
            setLoading(false);
        };

        fetchGlobalStats();
    }, [supabase, user, profile]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    if (profile?.role !== 'developer') {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
                <ShieldAlert size={64} className="text-red-500 mb-6" />
                <h1 className="text-4xl font-black mb-2 tracking-tight">ACCESS DENIED</h1>
                <p className="text-slate-400 mb-8 max-w-md">System administrative tools are restricted. Please log in with a developer account.</p>
                <Link href="/login" className="bg-white text-slate-950 px-8 py-3 rounded-full font-bold">Return to Login</Link>
            </div>
        );
    }

    const platformCards = [
        { label: "Total Revenue", value: formatCurrency(stats?.totalRevenue), icon: <BarChart3 className="text-emerald-400" /> },
        { label: "Active Orders", value: stats?.totalOrders, icon: <Package className="text-blue-400" /> },
        { label: "Shop Partners", value: stats?.shopOwners, icon: <LayoutDashboard className="text-purple-400" /> },
        { label: "Student Base", value: stats?.totalStudents, icon: <Users className="text-orange-400" /> },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans flex">
            {/* Dark Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-slate-950 p-6 flex flex-col hidden lg:flex">
                <div className="flex items-center gap-2 mb-12">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        <ShieldAlert size={20} />
                    </div>
                    <span className="font-bold text-xl tracking-tight italic">dev_console</span>
                </div>

                <nav className="space-y-2 flex-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm bg-white/10 text-white transition-all">
                        <LayoutDashboard size={18} /> Overview
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:text-white transition-all">
                        <Users size={18} /> User Mgmt
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:text-white transition-all">
                        <Activity size={18} /> System Logs
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:text-white transition-all">
                        <Settings size={18} /> Config
                    </button>
                </nav>

                <div className="pt-6 border-t border-white/5">
                    <button
                        onClick={signOut}
                        className="flex items-center gap-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 px-3 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 group active:scale-95"
                    >
                        <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
                        Exit Console
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 space-y-12 overflow-y-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic">Platform Core</h1>
                        <p className="text-slate-500 font-medium">Real-time system-wide infrastructure monitoring.</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 text-xs font-black uppercase tracking-widest">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        System Online
                    </div>
                </header>

                {/* Platform Metric Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {platformCards.map((card, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={card.label}
                            className="bg-white/5 border border-white/5 p-8 rounded-[32px] space-y-4 hover:border-white/10 transition-colors"
                        >
                            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/5">
                                {card.icon}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">{card.label}</p>
                                <p className="text-3xl font-bold tracking-tight mt-1">{card.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Global Live Traffic */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-black uppercase italic tracking-widest flex items-center gap-2 text-slate-400">
                            <Activity size={18} /> Global Live Signal
                        </h3>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-[40px] overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-white/5">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Order ID</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Customer</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Value</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-5 font-mono text-xs text-blue-400">#{order.pickup_code}</td>
                                        <td className="px-8 py-5 font-bold">{(order.profiles as any)?.full_name || "Guest"}</td>
                                        <td className="px-8 py-5 font-bold text-emerald-400">{formatCurrency(order.estimated_cost)}</td>
                                        <td className="px-8 py-5">
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border",
                                                order.payment_status === 'paid' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                                            )}>
                                                {order.payment_status === 'paid' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                {order.payment_status}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-xs text-slate-500 font-medium">
                                            {new Date(order.created_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
