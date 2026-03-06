import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
    Card as CardType,
    User as UserType,
    Comment as CommentType,
} from "../types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AVAILABLE_LABELS } from "../constants";
import { Trash2 } from "lucide-react";

interface CardModalProps {
    card: CardType;
    isOpen: boolean;
    onClose: () => void;
    listTitle: string;
}

export const CardModal = ({
    card,
    isOpen,
    onClose,
    listTitle,
}: CardModalProps) => {
    const queryClient = useQueryClient();
    const [description, setDescription] = useState(card.description);
    const [dueDate, setDueDate] = useState(card.dueDate || "");
    const [newComment, setNewComment] = useState("");

    const { data: users } = useQuery<UserType[]>({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await fetch("/api/users");
            return res.json();
        },
    });

    const { data: comments } = useQuery<CommentType[]>({
        queryKey: ["comments", card.id],
        queryFn: async () => {
            const res = await fetch(`/api/cards/${card.id}/comments`);
            return res.json();
        },
        enabled: isOpen,
    });

    const updateCardMutation = useMutation({
        mutationFn: async (updates: Partial<CardType>) => {
            const res = await fetch(`/api/cards/${card.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["boards"] });
        },
    });

    const deleteCardMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete card");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["boards"] });
            onClose();
        },
    });

    const addCommentMutation = useMutation({
        mutationFn: async (text: string) => {
            const res = await fetch(`/api/cards/${card.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, userId: "usr-1" }), // Mocking active user as Mahad
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["comments", card.id] });
            setNewComment("");
        },
    });

    const handleSaveDescription = () => {
        if (description !== card.description) {
            updateCardMutation.mutate({ description });
        }
    };

    const handleSaveDueDate = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setDueDate(newDate);
        updateCardMutation.mutate({ dueDate: newDate });
    };

    const handleToggleAssignee = (userId: string) => {
        const isAssigned = card.assigneeIds.includes(userId);
        const newAssignees = isAssigned
            ? card.assigneeIds.filter((id) => id !== userId)
            : [...card.assigneeIds, userId];
        updateCardMutation.mutate({ assigneeIds: newAssignees });
    };

    const handleToggleLabel = (labelName: string) => {
        const isSelected = card.labels.includes(labelName);
        const newLabels = isSelected
            ? card.labels.filter((l) => l !== labelName)
            : [...card.labels, labelName];
        updateCardMutation.mutate({ labels: newLabels });
    };

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            addCommentMutation.mutate(newComment.trim());
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2 border-b flex flex-row items-start justify-between">
                    <div>
                        <DialogTitle className="text-xl font-semibold break-words pr-8">
                            {card.title}
                        </DialogTitle>
                        <div className="text-sm text-muted-foreground flex gap-2 items-center mt-1">
                            in list <span className="text-primary">{listTitle}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (window.confirm("Are you sure you want to delete this card?")) {
                                deleteCardMutation.mutate();
                            }
                        }}
                        disabled={deleteCardMutation.isPending}
                        className="text-destructive hover:bg-destructive/10 p-2 rounded-md transition-colors mr-20 relative z-10 -top-2"
                        title="Delete Card"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            Description
                        </h3>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={handleSaveDescription}
                            placeholder="Add a more detailed description..."
                            className="w-full min-h-[120px] bg-secondary/30 p-3 rounded-md border border-transparent focus:border-ring focus:bg-background resize-y text-sm text-foreground transition-colors outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm">Assignees</h3>
                            <div className="flex flex-wrap gap-2">
                                {users?.map((user) => {
                                    const isAssigned = card.assigneeIds.includes(user.id);
                                    return (
                                        <div
                                            key={user.id}
                                            title={user.name}
                                            onClick={() => handleToggleAssignee(user.id)}
                                            className={`h-8 w-8 rounded-full flex items-center justify-center overflow-hidden cursor-pointer transition-all border-2 ${isAssigned ? "border-primary ring-2 ring-primary/20 scale-110 opacity-100 bg-accent text-accent-foreground" : "border-border/50 opacity-50 hover:opacity-100 bg-secondary"}`}
                                        >
                                            {user.avatarUrl ? (
                                                <img
                                                    src={user.avatarUrl}
                                                    alt={user.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-xs font-medium">
                                                    {user.name.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm">Due Date</h3>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={handleSaveDueDate}
                                className="w-full max-w-[200px] bg-secondary/30 p-2 rounded-md border border-transparent focus:border-ring focus:bg-background text-sm text-foreground outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm">Labels</h3>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_LABELS.map((label) => {
                                const isSelected = card.labels.includes(label.name);
                                return (
                                    <button
                                        key={label.name}
                                        onClick={() => handleToggleLabel(label.name)}
                                        className={`text-xs px-2.5 py-1 rounded-md border font-medium capitalize transition-all ${isSelected ? label.color : "bg-transparent text-muted-foreground border-border hover:border-muted-foreground"}`}
                                    >
                                        {label.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-4 border-t pt-6">
                        <h3 className="font-semibold text-sm">Activity</h3>

                        {/* Comments List */}
                        <div className="space-y-4">
                            {comments?.map((comment) => {
                                const user = users?.find((u) => u.id === comment.userId);
                                return (
                                    <div key={comment.id} className="flex gap-3">
                                        <div className="h-8 w-8 rounded-full bg-accent flex-shrink-0 flex items-center justify-center overflow-hidden border border-border">
                                            {user?.avatarUrl ? (
                                                <img
                                                    src={user.avatarUrl}
                                                    alt={user?.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                user?.name.charAt(0)
                                            )}
                                        </div>
                                        <div className="flex-1 bg-secondary/20 p-3 rounded-md">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-sm">
                                                    {user?.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(comment.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                                                {comment.text}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add Comment */}
                        <form onSubmit={handleAddComment} className="flex gap-3 mt-4">
                            <input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 bg-secondary/30 p-2 px-3 rounded-md border border-transparent focus:border-ring focus:bg-background text-sm outline-none transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim()}
                                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-opacity"
                            >
                                Save
                            </button>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
