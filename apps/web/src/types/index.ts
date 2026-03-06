export type User = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type Comment = {
  id: string;
  cardId: string;
  userId: string;
  text: string;
  createdAt: string;
};

export type Card = {
  id: string;
  listId: string;
  title: string;
  description: string;
  order: number;
  dueDate?: string;
  assigneeIds: string[];
  labels: string[];
};

export type List = {
  id: string;
  boardId: string;
  title: string;
  order: number;
};

export type Board = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
};
