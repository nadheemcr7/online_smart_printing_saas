"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const useAuth = () => {
    const supabase = useMemo(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), []);

    const queryClient = useQueryClient();

    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['auth', 'user'],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            return session?.user || null;
        },
        staleTime: 1000 * 60 * 60, // 1 hour (session doesn't change often)
    });

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['auth', 'profile', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
            return data;
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                queryClient.invalidateQueries({ queryKey: ['auth'] });
            }
        });
        return () => subscription.unsubscribe();
    }, [supabase, queryClient]);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            queryClient.clear(); // Clear all cache
            window.location.replace("/login");
        } catch (error) {
            console.error("Sign out error:", error);
            window.location.replace("/login");
        }
    };

    return { user, profile, loading: userLoading || (user && profileLoading), signOut, supabase };
};
