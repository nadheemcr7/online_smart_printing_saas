"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import {
    Store,
    CreditCard,
    Tag,
    Smartphone,
    ShieldCheck,
    Save,
    Loader2,
    AlertCircle,
    ChevronLeft,
    Power
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function OwnerSettingsPage() {
    const { supabase, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form State
    const [settings, setSettings] = useState({
        shop_name: "RIDHA PRINTERS",
        is_open: true,
        primary_vpa: "",
        backup_vpa: "",
        active_vpa_type: "primary"
    });

    useEffect(() => {
        if (!user) return;

        const loadSettings = async () => {
            const { data, error } = await supabase
                .from("shop_settings")
                .select("*")
                .eq("owner_id", user.id)
                .single();

            if (data) {
                setSettings({
                    shop_name: data.shop_name,
                    is_open: data.is_open,
                    primary_vpa: data.primary_vpa || "",
                    backup_vpa: data.backup_vpa || "",
                    active_vpa_type: data.active_vpa_type
                });
            } else {
                // First time setup - fetch existing VPA from profile
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("vpa")
                    .eq("id", user.id)
                    .single();

                if (profile?.vpa) {
                    setSettings(prev => ({ ...prev, primary_vpa: profile.vpa }));
                }
            }
            setLoading(false);
        };

        loadSettings();
    }, [supabase, user]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const { error: upsertError } = await supabase
                .from("shop_settings")
                .upsert({
                    owner_id: user.id,
                    ...settings,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'owner_id' });

            if (upsertError) throw upsertError;

            // Also update the short-hand VPA in profile for compatibility
            await supabase
                .from("profiles")
                .update({ vpa: settings.active_vpa_type === 'primary' ? settings.primary_vpa : settings.backup_vpa })
                .eq("id", user.id);

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            {/* Nav */}
            <nav className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/owner" className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                        <ChevronLeft size={20} className="text-slate-400" />
                    </Link>
                    <span className="font-bold text-lg">Shop Settings</span>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Save
                </button>
            </nav>

            <main className="max-w-2xl mx-auto p-6 space-y-8">
                {/* Shop Status Banner */}
                <div className={cn(
                    "p-6 rounded-[32px] border-2 flex items-center justify-between transition-all",
                    settings.is_open ? "bg-emerald-50 border-emerald-100 text-emerald-900" : "bg-red-50 border-red-100 text-red-900"
                )}>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center",
                            settings.is_open ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                        )}>
                            <Power size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-lg">{settings.is_open ? "Shop is Open" : "Shop is Closed"}</p>
                            <p className="text-xs font-medium opacity-70">Students can {settings.is_open ? "upload documents now" : "no longer upload for now"}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSettings(p => ({ ...p, is_open: !p.is_open }))}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            settings.is_open ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                        )}
                    >
                        Toggle
                    </button>
                </div>

                {/* Section: Basic Info */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <Store size={18} className="text-blue-600" />
                        <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest">General Info</h3>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm">
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-700 ml-1">Shop Name</label>
                            <input
                                type="text"
                                value={settings.shop_name}
                                onChange={(e) => setSettings(p => ({ ...p, shop_name: e.target.value }))}
                                className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-blue-600 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Section: Payments */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <CreditCard size={18} className="text-blue-600" />
                        <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest">UPI & Finance</h3>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-slate-700 ml-1">Primary UPI ID</label>
                                <input
                                    type="text"
                                    placeholder="e.g. name@okicici"
                                    value={settings.primary_vpa}
                                    onChange={(e) => setSettings(p => ({ ...p, primary_vpa: e.target.value }))}
                                    className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-blue-600"
                                />
                                <button
                                    onClick={() => setSettings(p => ({ ...p, active_vpa_type: 'primary' }))}
                                    className={cn(
                                        "w-full py-3 rounded-xl text-xs font-bold transition-all",
                                        settings.active_vpa_type === 'primary' ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                                    )}
                                >
                                    {settings.active_vpa_type === 'primary' ? "Currently Active" : "Set Active"}
                                </button>
                            </div>
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-slate-700 ml-1">Backup UPI ID</label>
                                <input
                                    type="text"
                                    placeholder="Emergency backup"
                                    value={settings.backup_vpa}
                                    onChange={(e) => setSettings(p => ({ ...p, backup_vpa: e.target.value }))}
                                    className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-blue-600"
                                />
                                <button
                                    onClick={() => setSettings(p => ({ ...p, active_vpa_type: 'backup' }))}
                                    className={cn(
                                        "w-full py-3 rounded-xl text-xs font-bold transition-all",
                                        settings.active_vpa_type === 'backup' ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-500"
                                    )}
                                >
                                    {settings.active_vpa_type === 'backup' ? "Currently Active" : "Set Active"}
                                </button>
                            </div>
                        </div>
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                            <Smartphone className="text-blue-600 mt-1" size={16} />
                            <p className="text-[11px] text-blue-900 font-medium">Use the backup VPA if your primary bank (GPay/HDFC etc) is experiencing server issues. Customers will see the new UPI ID instantly.</p>
                        </div>
                    </div>
                </div>

                {/* Section: Pricing Preview */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <Tag size={18} className="text-blue-600" />
                        <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest">Pricing Rules (Ridha Printers)</h3>
                    </div>
                    <div className="bg-slate-900 text-white rounded-[32px] p-8 shadow-xl">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">B/W Rates</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end border-b border-white/10 pb-2">
                                        <span className="text-xs opacity-60">Single Side (0-10p)</span>
                                        <span className="font-bold text-emerald-400">₹2.00</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-white/10 pb-2">
                                        <span className="text-xs opacity-60">Single Side (10p+)</span>
                                        <span className="font-bold text-emerald-400">₹1.00</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs opacity-60">Double Side (10p+)</span>
                                        <span className="font-bold text-emerald-400">₹1.50</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">Color Rates</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end border-b border-white/10 pb-2">
                                        <span className="text-xs opacity-60">Single Side</span>
                                        <span className="font-bold text-emerald-400">₹10.00</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs opacity-60">Double Side</span>
                                        <span className="font-bold text-emerald-400">₹20.00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2"
                    >
                        <ShieldCheck size={20} />
                        Settings Saved Successfully!
                    </motion.div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}
            </main>
        </div>
    );
}
