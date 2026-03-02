import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card as CardType } from '../types';
import { useState, memo } from 'react';
import { CardModal } from './CardModal';

export const KanbanCard = memo(({ card }: { card: CardType }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: card.id, data: { type: 'Card', card } });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-card/50 border-2 border-primary/50 text-transparent p-3 rounded-lg shadow-sm h-[46px]"
            />
        );
    }

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                onClick={(e) => {
                    // Prevent drag logic firing purely on click
                    if (e.defaultPrevented) return;
                    setIsModalOpen(true);
                }}
                className="bg-card text-card-foreground p-3 rounded-lg shadow-sm border border-border/50 text-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
            >
                {card.title}
            </div>
            <CardModal
                card={card}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
});
