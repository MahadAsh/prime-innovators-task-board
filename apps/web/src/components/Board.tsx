import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { List as ListType, Card as CardType } from "../types";
import { Plus } from "lucide-react";
import { useState } from "react";
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
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";

const DroppableColumn = ({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: "Column",
      listId: id,
    },
  });
  return (
    <div ref={setNodeRef} className={className}>
      {children}
    </div>
  );
};

export const Board = ({ boardId }: { boardId: string }) => {
  const queryClient = useQueryClient();
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [addingCardToList, setAddingCardToList] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");

  const { data: lists, isLoading: listsLoading } = useQuery<ListType[]>({
    queryKey: ["boards", boardId, "lists"],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}/lists`);
      return res.json();
    },
  });

  const { data: cards, isLoading: cardsLoading } = useQuery<CardType[]>({
    queryKey: ["boards", boardId, "cards"],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}/cards`);
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async ({
      cardId,
      updates,
    }: {
      cardId: string;
      updates: Partial<CardType>;
    }) => {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      return res.json();
    },
  });

  const createListMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch(`/api/boards/${boardId}/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", boardId, "lists"] });
      setAddingList(false);
      setNewListTitle("");
    },
  });

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListTitle.trim()) {
      createListMutation.mutate(newListTitle.trim());
    }
  };

  const createCardMutation = useMutation({
    mutationFn: async ({
      listId,
      title,
      order,
    }: {
      listId: string;
      title: string;
      order: number;
    }) => {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId, title, order }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", boardId, "cards"] });
      setAddingCardToList(null);
      setNewCardTitle("");
    },
  });

  const handleCreateCard = (e: React.FormEvent, listId: string) => {
    e.preventDefault();
    if (newCardTitle.trim()) {
      const listCards = cards?.filter((c) => c.listId === listId) || [];
      const newOrder =
        listCards.length > 0
          ? Math.max(...listCards.map((c) => c.order)) + 1000
          : 1000;
      createCardMutation.mutate({
        listId,
        title: newCardTitle.trim(),
        order: newOrder,
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "Card") {
      setActiveCard(active.data.current.card);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id === over.id) return;

    const isActiveACard = active.data.current?.type === "Card";
    if (!isActiveACard) return;

    const isOverACard = over.data.current?.type === "Card";
    const isOverAColumn = over.data.current?.type === "Column";

    if (!isOverACard && !isOverAColumn) return;

    queryClient.setQueryData(
      ["boards", boardId, "cards"],
      (oldCards: CardType[] | undefined) => {
        if (!oldCards) return oldCards;

        const activeIndex = oldCards.findIndex((c) => c.id === active.id);
        if (activeIndex === -1) return oldCards;

        if (isOverAColumn) {
          const overListId = over.id as string;
          if (oldCards[activeIndex].listId !== overListId) {
            const newCards = [...oldCards];
            const cardsInList = newCards.filter((c) => c.listId === overListId);
            const newOrder =
              cardsInList.length > 0
                ? Math.max(...cardsInList.map((c) => c.order)) + 1000
                : 1000;

            newCards[activeIndex] = {
              ...newCards[activeIndex],
              listId: overListId,
              order: newOrder,
            };
            return newCards;
          }
        } else if (isOverACard) {
          const overIndex = oldCards.findIndex((c) => c.id === over.id);
          if (overIndex === -1) return oldCards;

          if (oldCards[activeIndex].listId !== oldCards[overIndex].listId) {
            const newCards = [...oldCards];
            newCards[activeIndex] = {
              ...newCards[activeIndex],
              listId: newCards[overIndex].listId,
              order: newCards[overIndex].order - 1,
            };
            return arrayMove(newCards, activeIndex, overIndex);
          }

          return arrayMove(oldCards, activeIndex, overIndex);
        }

        return oldCards;
      },
    );
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      const currentCards = queryClient.getQueryData<CardType[]>([
        "boards",
        boardId,
        "cards",
      ]);
      const movedCard = currentCards?.find((c) => c.id === active.id);

      if (movedCard) {
        mutation.mutate(
          {
            cardId: movedCard.id,
            updates: { listId: movedCard.listId, order: movedCard.order },
          },
          {
            onSettled: () => {
              queryClient.invalidateQueries({
                queryKey: ["boards", boardId, "cards"],
              });
            },
          },
        );
      }
    }
  };

  if (listsLoading || cardsLoading) {
    return (
      <div className="text-muted-foreground animate-pulse p-4">
        Loading board data...
      </div>
    );
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
            const cardIds = listCards.map((c) => c.id);

            return (
              <DroppableColumn
                key={list.id}
                id={list.id}
                className="w-80 flex-shrink-0 bg-secondary/50 rounded-xl p-3 flex flex-col max-h-full"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-semibold text-sm">{list.title}</h3>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {listCards.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2 overflow-y-auto min-h-[50px] flex-1">
                  <SortableContext
                    items={cardIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {listCards.map((card) => (
                      <KanbanCard
                        key={card.id}
                        card={card}
                        listTitle={list.title}
                      />
                    ))}
                  </SortableContext>
                </div>

                {addingCardToList === list.id ? (
                  <form
                    onSubmit={(e) => handleCreateCard(e, list.id)}
                    className="mt-3 flex flex-col gap-2"
                  >
                    <input
                      autoFocus
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      placeholder="Enter a title for this card..."
                      className="bg-background text-sm p-3 rounded-lg shadow-sm border border-border focus:border-ring focus:outline-none w-full"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={!newCardTitle.trim()}
                        className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-md font-medium disabled:opacity-50"
                      >
                        Add card
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddingCardToList(null)}
                        className="text-xs px-2 py-1.5 text-white hover:text-white/90"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setAddingCardToList(list.id);
                      setNewCardTitle("");
                    }}
                    className="mt-3 flex items-center gap-2 text-sm text-white/90 hover:text-foreground hover:bg-secondary/80 p-2 rounded-lg transition-colors w-full"
                  >
                    <Plus className="h-4 w-4" />
                    Add a card
                  </button>
                )}
              </DroppableColumn>
            );
          })}

          {addingList ? (
            <div className="w-80 flex-shrink-0 bg-secondary/50 rounded-xl p-3">
              <form onSubmit={handleCreateList} className="flex flex-col gap-2">
                <input
                  autoFocus
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="Enter list title..."
                  className="bg-background text-sm p-3 rounded-lg shadow-sm border border-border focus:border-ring focus:outline-none w-full"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={!newListTitle.trim()}
                    className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-md font-medium disabled:opacity-50"
                  >
                    Add list
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingList(false)}
                    className="text-xs px-2 py-1.5 text-white hover:text-white/90"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={() => {
                setAddingList(true);
                setNewListTitle("");
              }}
              className="w-80 h-24 flex-shrink-0 flex items-center justify-center gap-2 p-4 rounded-xl border bg-background/50 text-foreground hover:bg-secondary/50 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add another list
            </button>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeCard ? (
          <KanbanCard
            card={activeCard}
            listTitle={
              lists?.find((l) => l.id === activeCard.listId)?.title || "Unknown"
            }
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
