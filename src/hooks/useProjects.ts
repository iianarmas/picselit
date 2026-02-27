import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { MarkGrid } from './useMarkingState';

export interface ProjectData {
    id: string;
    name: string;
    image_data: string;
    grid_w: number;
    grid_h: number;
    link_aspect: boolean;
    brightness: number;
    contrast: number;
    saturation: number;
    vibrancy: number;
    target_colors: number;
    color_similarity: number;
    marked_pixels: MarkGrid;
    updated_at: string;
}

export function useProjects() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<ProjectData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProjects = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('projects')
                .select('*')
                .order('updated_at', { ascending: false });

            if (fetchError) throw fetchError;
            setProjects(data as ProjectData[]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const saveProject = async (projectInput: Omit<ProjectData, 'id' | 'updated_at'>, existingId?: string) => {
        if (!user) return null;
        setLoading(true);
        setError(null);
        try {
            if (existingId) {
                const { data, error: updateError } = await supabase
                    .from('projects')
                    .update(projectInput)
                    .eq('id', existingId)
                    .select()
                    .single();

                if (updateError) throw updateError;
                await fetchProjects();
                return data as ProjectData;
            } else {
                const { data, error: insertError } = await supabase
                    .from('projects')
                    .insert([{ ...projectInput, user_id: user.id }])
                    .select()
                    .single();

                if (insertError) throw insertError;
                await fetchProjects();
                return data as ProjectData;
            }
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const deleteProject = async (id: string) => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const { error: deleteError } = await supabase
                .from('projects')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            await fetchProjects();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        projects,
        loading,
        error,
        fetchProjects,
        saveProject,
        deleteProject
    };
}
