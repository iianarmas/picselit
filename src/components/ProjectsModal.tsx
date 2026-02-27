import { useState, useEffect } from 'react';
import { useProjects } from '../hooks/useProjects';
import type { ProjectData } from '../hooks/useProjects';
import { X, Loader2, Image as ImageIcon, Trash2, Clock, AlertTriangle } from 'lucide-react';

interface ProjectsModalProps {
    onClose: () => void;
    onLoadProject: (project: ProjectData) => void;
}

export function ProjectsModal({ onClose, onLoadProject }: ProjectsModalProps) {
    const { projects, loading, error, fetchProjects, deleteProject } = useProjects();
    const [projectToDelete, setProjectToDelete] = useState<ProjectData | null>(null);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                className="w-full max-w-2xl rounded-xl p-6 relative shadow-2xl flex flex-col"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', maxHeight: '80vh' }}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
                        My Projects
                    </h2>
                    <p className="text-sm mt-1 text-[var(--color-muted)]">
                        Load or manage your saved pixel art projects.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg text-sm bg-red-500/10 text-red-500 border border-red-500/20">
                        {error}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-2">
                    {loading && projects.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-[var(--color-muted)] gap-3">
                            <Loader2 className="animate-spin" size={24} />
                            <p className="text-sm">Loading projects...</p>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-[var(--color-muted)] gap-3">
                            <ImageIcon size={48} className="opacity-20" />
                            <p className="text-sm">You don't have any saved projects yet.</p>
                        </div>
                    ) : (
                        projects.map(project => (
                            <div
                                key={project.id}
                                className="flex items-center gap-4 p-3 rounded-lg border group hover:shadow-lg transition-all cursor-pointer"
                                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
                                onClick={() => onLoadProject(project)}
                            >
                                <div
                                    className="w-16 h-16 rounded overflow-hidden flex-shrink-0 border border-[var(--color-border)]"
                                    style={{ background: 'var(--color-surface2)' }}
                                >
                                    <img src={project.image_data} alt={project.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-[var(--color-text)] truncate">{project.name}</h3>
                                    <div className="flex items-center gap-3 text-xs text-[var(--color-muted)] mt-1">
                                        <span className="flex items-center gap-1">
                                            <GridIcon size={12} /> {project.grid_w} × {project.grid_h}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} /> {new Date(project.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setProjectToDelete(project);
                                        }}
                                        className="p-2 rounded-md hover:bg-red-500/10 text-red-500 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Custom Delete Confirmation Modal */}
            {projectToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm rounded-xl p-5 shadow-2xl flex flex-col items-center text-center transform scale-100"
                        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">Delete Project?</h3>
                        <p className="text-sm text-[var(--color-muted)] mb-6">
                            Are you sure you want to delete "<span className="font-semibold">{projectToDelete.name}</span>"? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setProjectToDelete(null)}
                                className="flex-1 py-2 rounded-lg font-medium transition-colors hover:bg-[var(--color-surface2)] text-[var(--color-text)] border"
                                style={{ borderColor: 'var(--color-border)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    deleteProject(projectToDelete.id);
                                    setProjectToDelete(null);
                                }}
                                className="flex-1 py-2 rounded-lg font-medium text-white transition-opacity hover:opacity-90 bg-red-500"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function GridIcon({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <path d="M3 9h18" />
            <path d="M3 15h18" />
            <path d="M9 3v18" />
            <path d="M15 3v18" />
        </svg>
    );
}
