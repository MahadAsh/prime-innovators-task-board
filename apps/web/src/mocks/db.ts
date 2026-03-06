import { Board, List, Card, User, Comment } from "../types";

const DB_KEY = "primeinnovators_db";

const defaultUsers: User[] = [
    {
        id: "usr-1",
        name: "Mahad",
        avatarUrl: "https://i.pravatar.cc/150?u=mahad",
    },
    {
        id: "usr-2",
        name: "Saeed",
        avatarUrl: "https://i.pravatar.cc/150?u=saeed",
    },
];

const defaultBoards: Board[] = [
    {
        id: "brd-1",
        title: "",
        description: "",
        createdAt: new Date().toISOString(),
    },
];

const defaultLists: List[] = [
    { id: "lst-1", boardId: "brd-1", title: "To Do", order: 1000 },
    { id: "lst-2", boardId: "brd-1", title: "In Progress", order: 2000 },
    { id: "lst-3", boardId: "brd-1", title: "Done", order: 3000 },
];

const defaultCards: Card[] = [
    {
        id: "crd-1",
        listId: "lst-1",
        title: "Design API Contract",
        description: "Draft REST endpoints and JSON structures for MSW.",
        order: 1000,
        assigneeIds: ["usr-1"],
        labels: ["architecture", "backend"],
    },
    {
        id: "crd-2",
        listId: "lst-1",
        title: "Setup MSW Handlers",
        description: "Implement realistic request resolution with delays.",
        order: 2000,
        assigneeIds: ["usr-1"],
        labels: ["testing"],
    },
    {
        id: "crd-3",
        listId: "lst-2",
        title: "Scaffold Workspace",
        description: "Turborepo, Vite, Bun, Tailwind CSS setup.",
        order: 1000,
        assigneeIds: ["usr-1", "usr-2"],
        labels: ["infrastructure"],
    },
    {
        id: "crd-4",
        listId: "lst-3",
        title: "Initial Planning",
        description: "Break down tasks and draft architecture document.",
        order: 1000,
        assigneeIds: ["usr-1"],
        labels: ["planning"],
    },
];

const defaultComments: Comment[] = [];

let db = {
    users: defaultUsers,
    boards: defaultBoards,
    lists: defaultLists,
    cards: defaultCards,
    comments: defaultComments,
};

// Check for existing DB
const saved =
    typeof window !== "undefined" ? localStorage.getItem(DB_KEY) : null;
if (saved) {
    try {
        db = JSON.parse(saved);
    } catch (e) {
        console.error("Failed to parse DB from localStorage", e);
    }
}

export const mockUsers = db.users;
export const mockBoards = db.boards;
export const mockLists = db.lists;
export const mockCards = db.cards;
export const mockComments = db.comments;

export const saveMockDb = () => {
    if (typeof window !== "undefined") {
        localStorage.setItem(
            DB_KEY,
            JSON.stringify({
                users: mockUsers,
                boards: mockBoards,
                lists: mockLists,
                cards: mockCards,
                comments: mockComments,
            }),
        );
    }
};
