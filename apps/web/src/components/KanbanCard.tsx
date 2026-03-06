import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card as CardType, User as UserType } from "../types";
import { useState, memo, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { AVAILABLE_LABELS } from "../constants";
import { Calendar } from "lucide-react";

const CardModal = lazy(() =>
  import("./CardModal").then((module) => ({ default: module.CardModal })),
);

export const KanbanCard = memo(
  ({ card, listTitle }: { card: CardType; listTitle: string }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data: users } = useQuery<UserType[]>({
      queryKey: ["users"],
      queryFn: async () => {
        const res = await fetch("/api/users");
        return res.json();
      },
    });

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: card.id, data: { type: "Card", card } });

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

    // Check if overdue
    const isOverdue =
      card.dueDate &&
      new Date(card.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));

    return (
      <>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          onClick={(e) => {
            if (e.defaultPrevented) return;
            setIsModalOpen(true);
          }}
          className="bg-card text-card-foreground p-3 rounded-lg shadow-sm border border-border/50 text-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
        >
          <div className="flex flex-col gap-3">
            {card.labels && card.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 -mb-1">
                {card.labels.map((labelName) => {
                  const colorInfo = AVAILABLE_LABELS.find(
                    (l) => l.name === labelName,
                  );
                  return (
                    <span
                      key={labelName}
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold capitalize tracking-wide ${colorInfo?.color || "bg-secondary text-secondary-foreground border-border"}`}
                    >
                      {labelName}
                    </span>
                  );
                })}
              </div>
            )}

            <span className="font-medium leading-snug">{card.title}</span>

            <div className="flex items-center justify-between">
              <div className="flex -space-x-1.5 overflow-hidden">
                {card.assigneeIds.map((id) => {
                  const user = users?.find((u) => u.id === id);
                  return user ? (
                    <div
                      key={id}
                      title={user.name}
                      className="inline-block h-6 w-6 rounded-full ring-2 ring-background bg-accent text-accent-foreground flex items-center justify-center overflow-hidden"
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] font-medium">
                          {user.name.charAt(0)}
                        </span>
                      )}
                    </div>
                  ) : null;
                })}
              </div>

              {card.dueDate && (
                <div
                  className={`flex items-center gap-1.5 text-xs font-medium w-fit px-1.5 py-0.5 rounded ${isOverdue ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"}`}
                >
                  <Calendar className="w-3 h-3" />
                  {new Date(card.dueDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        {isModalOpen && (
          <Suspense fallback={null}>
            <CardModal
              card={card}
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              listTitle={listTitle}
            />
          </Suspense>
        )}
      </>
    );
  },
);
