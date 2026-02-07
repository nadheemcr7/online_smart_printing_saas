"use client";

import { motion } from "framer-motion";
import {
    CheckCircle2,
    Copy,
    ExternalLink,
    Image as ImageIcon,
    Loader2,
    QrCode,
    ShieldCheck,
    Smartphone
} from "lucide-react";
import { useState } from "react";
import { analyzePaymentScreenshot } from "@/lib/gemini";
import { createBrowserClient } from "@supabase/ssr";
import { cn } from "@/lib/utils";

interface PaymentViewProps {
    orderId: string;
    amount: number;
    vpa: string;
    onSuccess: () => void;
}

export function PaymentView({ orderId, amount, vpa, onSuccess }: PaymentViewProps) {
    const [status, setStatus] = useState<'pay' | 'verifying' | 'success' | 'error'>('pay');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Dynamic UPI Link for QR/Mobile Apps
    const upiLink = `upi://pay?pa=${vpa}&pn=SolvePrint&am=${amount}&tr=${orderId}&cu=INR`;

    const handleVerify = async (file: File) => {
        try {
            setStatus('verifying');

            // 1. Convert to Base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(file);
            });
            const base64 = await base64Promise;

            // 2. AI Analysis
            const result = await analyzePaymentScreenshot(base64, amount);

            if (!result.isSuccessful || !result.isMatch) {
                throw new Error("Payment could not be verified. Please ensure the screenshot clearly shows the amount and success status.");
            }

            // 3. Update Order in DB
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    payment_status: 'paid',
                    status: 'queued', // Move from pending_payment to queued
                    utr_id: result.utr,
                    ai_verification_log: result
                })
                .eq('id', orderId);

            if (updateError) throw updateError;

            setStatus('success');
            setTimeout(onSuccess, 2000);

        } catch (err: any) {
            setError(err.message);
            setStatus('pay');
        }
    };

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                    <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-bold">Payment Verified!</h3>
                <p className="text-slate-500">Your print job is now in the queue.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-[32px] text-center space-y-4">
                <div className="flex justify-center">
                    {/* In a real app, we'd use qr-code-styling, but for demo we show the link */}
                    <div className="w-48 h-48 bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center group relative">
                        <QrCode size={120} className="text-slate-900 group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Smartphone className="text-blue-600 animate-bounce" />
                        </div>
                    </div>
                </div>
                <div>
                    <p className="text-3xl font-black text-slate-900 tracking-tight">₹{amount.toFixed(2)}</p>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">Scan to pay via UPI</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <ShieldCheck className="text-blue-600" size={24} />
                    <div className="flex-1">
                        <p className="text-sm font-bold">Instant AI Verification</p>
                        <p className="text-[10px] text-slate-500 font-medium">Pay & upload screenshot for 0s waiting.</p>
                    </div>
                </div>

                <div className="relative">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="screenshot-upload"
                        onChange={(e) => e.target.files?.[0] && handleVerify(e.target.files[0])}
                        disabled={status === 'verifying'}
                    />
                    <label
                        htmlFor="screenshot-upload"
                        className={cn(
                            "w-full p-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 cursor-pointer transition-all",
                            status === 'verifying' ? "bg-slate-50 border-slate-200" : "bg-white border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                        )}
                    >
                        {status === 'verifying' ? (
                            <><Loader2 className="animate-spin" size={20} /> Verifying Screenshot...</>
                        ) : (
                            <><ImageIcon size={20} /> Upload Payment Screenshot</>
                        )}
                    </label>
                </div>

                {error && (
                    <p className="text-xs text-red-500 font-bold text-center bg-red-50 p-3 rounded-xl border border-red-100 italic">
                        "{error}"
                    </p>
                )}
            </div>
        </div>
    );
}
