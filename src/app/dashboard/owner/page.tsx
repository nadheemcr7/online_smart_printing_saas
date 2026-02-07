"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import {
    Printer,
    Clock,
    CheckCircle2,
    MoreVertical,
    Users,
    TrendingUp,
    Settings,
    Bell,
    Search,
    CheckSquare,
    Square
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { HandoverModal } from "@/components/HandoverModal";
import { Handshake } from "lucide-react";

export default function OwnerDashboard() {
    const { profile, signOut, supabase } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isHandoverOpen, setIsHandoverOpen] = useState(false);

    // Stats
    const stats = [
        { label: "Pending", value: orders.filter(o => o.status === 'queued').length, icon: <Clock className="text-orange-500" /> },
        { label: "Printing", value: orders.filter(o => o.status === 'printing').length, icon: <Printer className="text-blue-500" /> },
        { label: "Ready", value: orders.filter(o => o.status === 'ready').length, icon: <CheckCircle2 className="text-emerald-500" /> },
    ];

    useEffect(() => {
        const fetchOrders = async () => {
            const { data } = await supabase
                .from("orders")
                .select(`
          *,
          profiles:customer_id (full_name)
        `)
                .order("created_at", { ascending: false });

            setOrders(data || []);
            setLoading(false);
        };

        fetchOrders();

        // Realtime subscription
        const channel = supabase
            .channel("orders_changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
                fetchOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const toggleSelect = (id: string) => {
        setSelectedOrders(prev =>
            prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
        );
    };

    const handleBatchUpdate = async (status: string) => {
        if (selectedOrders.length === 0) return;

        const { error } = await supabase.rpc("batch_update_order_status", {
            order_ids: selectedOrders,
            new_status: status
        });

        if (!error) {
            setSelectedOrders([]);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col hidden lg:flex">
                <div className="flex items-center gap-2 mb-10">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        <Printer size={20} />
                    </div>
                    <span className="font-bold text-xl tracking-tight">Solve Print</span>
                </div>

                <nav className="space-y-1 flex-1">
                    <Link href="/dashboard/owner">
                        <NavItem icon={<Users size={20} />} label="Live Queue" active />
                    </Link>
                    <Link href="/dashboard/owner/analytics">
                        <NavItem icon={<TrendingUp size={20} />} label="Analytics" />
                    </Link>
                    <Link href="/dashboard/owner/settings">
                        <NavItem icon={<Settings size={20} />} label="Shop Settings" />
                    </Link>
                </nav>

                <div className="pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 bg-slate-200 rounded-full" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{profile?.full_name || "Owner"}</p>
                            <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={signOut}
                        className="w-full text-left px-2 py-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-20">
                    <h2 className="text-lg font-bold">Shop Queue</h2>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsHandoverOpen(true)}
                            className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100"
                        >
                            <Handshake size={18} />
                            Verify Code
                        </button>
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                placeholder="Search orders..."
                                className="pl-10 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </button>
                    </div>
                </header>

                <HandoverModal
                    isOpen={isHandoverOpen}
                    onClose={() => setIsHandoverOpen(false)}
                />

                {/* Dashboard Content */}
                <div className="p-8 space-y-8">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.map((stat, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={stat.label}
                                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-slate-50 rounded-lg">{stat.icon}</div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                                </div>
                                <div className="text-3xl font-bold">{stat.value}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Batch Actions Float */}
                    <AnimatePresence>
                        {selectedOrders.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl z-50 border border-white/10 backdrop-blur-md"
                            >
                                <span className="text-sm font-bold border-r border-white/20 pr-6">
                                    {selectedOrders.length} Selected
                                </span>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleBatchUpdate('printing')}
                                        className="text-sm font-bold hover:text-blue-400 transition-colors"
                                    >
                                        Start Printing
                                    </button>
                                    <button
                                        onClick={() => handleBatchUpdate('ready')}
                                        className="text-sm font-bold hover:text-emerald-400 transition-colors"
                                    >
                                        Mark Ready
                                    </button>
                                    <button
                                        onClick={() => setSelectedOrders([])}
                                        className="text-sm font-bold text-slate-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Orders Table */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-6 py-4 w-10">
                                            <button
                                                onClick={() => setSelectedOrders(selectedOrders.length === orders.length ? [] : orders.map(o => o.id))}
                                                className="text-slate-400"
                                            >
                                                {selectedOrders.length === orders.length && orders.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                                            </button>
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pickup Code</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pages</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {loading ? (
                                        <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">Loading queue...</td></tr>
                                    ) : orders.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">Queue is empty. Waiting for orders...</td></tr>
                                    ) : orders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className={cn(
                                                "hover:bg-slate-50 transition-colors group",
                                                selectedOrders.includes(order.id) && "bg-blue-50/50 hover:bg-blue-50"
                                            )}
                                        >
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => toggleSelect(order.id)}
                                                    className={cn("transition-colors", selectedOrders.includes(order.id) ? "text-blue-600" : "text-slate-300 group-hover:text-slate-400")}
                                                >
                                                    {selectedOrders.includes(order.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded text-sm tracking-widest">
                                                    #{order.pickup_code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{(order.profiles as any)?.full_name || "Guest"}</div>
                                                <div className="text-xs text-slate-500">
                                                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {order.total_pages} Pages
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={order.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-color">
                                                    <MoreVertical size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function NavItem({ icon, label, active = false }: any) {
    return (
        <a href="#" className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all",
            active ? "bg-blue-50 text-blue-600 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        )}>
            {icon}
            {label}
        </a>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        pending_payment: "bg-slate-50 text-slate-400 border-slate-100",
        queued: "bg-orange-50 text-orange-600 border-orange-100",
        printing: "bg-blue-50 text-blue-600 border-blue-100",
        ready: "bg-emerald-50 text-emerald-600 border-emerald-100",
        completed: "bg-slate-100 text-slate-500 border-slate-200",
    };

    const labels: any = {
        pending_payment: "Pending Pay",
        queued: "In Queue",
        printing: "Printing",
        ready: "Ready",
        completed: "Handed Over",
    };

    return (
        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", styles[status])}>
            {labels[status] || status}
        </span>
    );
}
