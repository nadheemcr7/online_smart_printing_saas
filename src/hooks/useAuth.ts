"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const useAuth = () => {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", session.user.id)
                    .single();
                setProfile(profileData);
            }
            setLoading(false);
        };

        getUser();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session) {
                    setUser(session.user);
                    const { data: profileData } = await supabase
                        .from("profiles")
                        .select("*")
                        .eq("id", session.user.id)
                        .single();
                    setProfile(profileData);
                } else {
                    setUser(null);
                    setProfile(null);
                }
                setLoading(false);
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [supabase, router]);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            // Clear any cached state
            setUser(null);
            setProfile(null);
            // Force hard navigation to clear all state
            window.location.replace("/login");
        } catch (error) {
            console.error("Sign out error:", error);
            // Fallback: force redirect anyway
            window.location.replace("/login");
        }
    };

    return { user, profile, loading, signOut, supabase };
};
