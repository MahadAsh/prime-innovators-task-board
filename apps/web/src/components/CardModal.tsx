import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card as CardType, User as UserType } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

interface CardModalProps {
    card: CardType;
    isOpen: boolean;
    onClose: () => void;
}

export const CardModal = ({ card, isOpen, onClose }: CardModalProps) => {
    const queryClient = useQueryClient();
    const { activeUserId } = useAppStore();
    const [description, setDescription] = useState(card.description);

    const { data: users } = useQuery<UserType[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await fetch('/api/users');
            return res.json();
        }
    });

    const updateCardMutation = useMutation({
        mutationFn: async (updates: Partial<CardType>) => {
            const res = await fetch(`/api/cards/${card.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            return res.json();
        },
        onSuccess: (updatedCard) => {
            queryClient.setQueryData(['boards', card.boardId, 'cards'], (oldCards: CardType[] | undefined) => {
                if (!oldCards) return oldCards;
                return oldCards.map(c => c.id === card.id ? updatedCard : c);
            });
        }
    });

    const handleSaveDescription = () => {
        if (description !== card.description) {
            updateCardMutation.mutate({ description });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2 border-b">
                    <DialogTitle className="text-xl font-semibold break-words">
                        {card.title}
                    </DialogTitle>
                    <div className="text-sm text-muted-foreground flex gap-2 items-center">
                        in list <span className="underline decoration-dashed">{card.listId}</span>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            Description
                        </h3>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={handleSaveDescription}
                            placeholder="Add a more detailed description..."
                            className="w-full min-h-[120px] bg-secondary/30 p-3 rounded-md border border-transparent focus:border-ring focus:bg-background resize-y text-sm transition-colors outline-none"
                        />
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm">Assignees</h3>
                        <div className="flex gap-2">
                            {card.assigneeIds.length === 0 ? (
                                <span className="text-sm text-muted-foreground italic">No assignees yet</span>
                            ) : (
                                card.assigneeIds.map(id => {
                                    const user = users?.find(u => u.id === id);
                                    return user ? (
                                        <div key={id} title={user.name} className="h-8 w-8 rounded-full bg-accent flex items-center justify-center overflow-hidden border border-border">
                                            {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" /> : user.name.charAt(0)}
                                        </div>
                                    ) : null;
                                })
                            )}
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
};
