import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { List as ListType, Card as CardType } from '../types';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
    sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';

export const Board = ({ boardId }: { boardId: string }) => {
    const queryClient = useQueryClient();
    const [activeCard, setActiveCard] = useState<CardType | null>(null);

    const { data: lists, isLoading: listsLoading } = useQuery<ListType[]>({
        queryKey: ['boards', boardId, 'lists'],
        queryFn: async () => {
            const res = await fetch(`/api/boards/${boardId}/lists`);
            return res.json();
        },
    });

    const { data: cards, isLoading: cardsLoading } = useQuery<CardType[]>({
        queryKey: ['boards', boardId, 'cards'],
        queryFn: async () => {
            const res = await fetch(`/api/boards/${boardId}/cards`);
            return res.json();
        },
    });

    const mutation = useMutation({
        mutationFn: async ({ cardId, updates }: { cardId: string; updates: Partial<CardType> }) => {
            const res = await fetch(`/api/cards/${cardId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            return res.json();
        }
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const onDragStart = (event: DragStartEvent) => {
        const { active } = event;
        if (active.data.current?.type === 'Card') {
            setActiveCard(active.data.current.card);
        }
    };

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id === over.id) return;

        const isActiveACard = active.data.current?.type === 'Card';

        if (!isActiveACard) return;

        queryClient.setQueryData(['boards', boardId, 'cards'], (oldCards: CardType[] | undefined) => {
            if (!oldCards) return oldCards;

            const activeIndex = oldCards.findIndex((c) => c.id === active.id);
            const overIndex = oldCards.findIndex((c) => c.id === over.id);

            if (activeIndex === -1 || overIndex === -1) return oldCards;

            if (oldCards[activeIndex].listId !== oldCards[overIndex].listId) {
                const newCards = [...oldCards];
                // Move card to new list optimistically during drag over
                newCards[activeIndex] = {
                    ...newCards[activeIndex],
                    listId: newCards[overIndex].listId,
                    order: newCards[overIndex].order - 1 // place just above the hovered item
                };
                return arrayMove(newCards, activeIndex, overIndex);
            }

            return arrayMove(oldCards, activeIndex, overIndex);
        });
    };

    const onDragEnd = (event: DragEndEvent) => {
        setActiveCard(null);
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            const currentCards = queryClient.getQueryData<CardType[]>(['boards', boardId, 'cards']);
            const movedCard = currentCards?.find(c => c.id === active.id);

            if (movedCard) {
                mutation.mutate({
                    cardId: movedCard.id,
                    updates: { listId: movedCard.listId, order: movedCard.order }
                }, {
                    onSettled: () => {
                        queryClient.invalidateQueries({ queryKey: ['boards', boardId, 'cards'] });
                    }
                });
            }
        }
    };

    if (listsLoading || cardsLoading) {
        return <div className="text-muted-foreground animate-pulse p-4">Loading board data...</div>;
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex h-full items-start gap-4 pb-4 px-2 select-none">
                    {lists?.map((list) => {
                        const listCards = cards?.filter((c) => c.listId === list.id) || [];
                        const cardIds = listCards.map(c => c.id);

                        return (
                            <div key={list.id} className="w-80 flex-shrink-0 bg-secondary/50 rounded-xl p-3 flex flex-col max-h-full">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <h3 className="font-semibold text-sm">{list.title}</h3>
                                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                        {listCards.length}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-2 overflow-y-auto min-h-[50px] flex-1">
                                    <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                                        {listCards.map(card => (
                                            <KanbanCard key={card.id} card={card} />
                                        ))}
                                    </SortableContext>
                                </div>

                                <button className="mt-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/80 p-2 rounded-lg transition-colors w-full">
                                    <Plus className="h-4 w-4" />
                                    Add a card
                                </button>
                            </div>
                        );
                    })}

                    <button className="w-80 flex-shrink-0 bg-background/50 border border-dashed hover:bg-secondary/50 rounded-xl p-4 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors h-24">
                        <Plus className="h-5 w-5" />
                        Add another list
                    </button>
                </div>
            </div>

            <DragOverlay>
                {activeCard ? <KanbanCard card={activeCard} /> : null}
            </DragOverlay>
        </DndContext>
    );
};
