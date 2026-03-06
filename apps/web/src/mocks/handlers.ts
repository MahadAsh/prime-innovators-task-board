import { http, HttpResponse, delay } from "msw";
import {
    mockBoards,
    mockLists,
    mockCards,
    mockUsers,
    mockComments,
    saveMockDb,
} from "./db";
import { Card } from "../types";

const NETWORK_DELAY = 500; // Simulated latency

export const handlers = [
    // Boards
    http.get("/api/boards", async () => {
        await delay(NETWORK_DELAY);
        return HttpResponse.json(mockBoards);
    }),

    // Update a Board (e.g., dynamically change title)
    http.put("/api/boards/:boardId", async ({ params, request }) => {
        await delay(NETWORK_DELAY);
        const updates = (await request.json()) as Partial<(typeof mockBoards)[0]>;
        const index = mockBoards.findIndex((b) => b.id === params.boardId);

        if (index === -1) {
            return new HttpResponse("Board not found", { status: 404 });
        }

        mockBoards[index] = { ...mockBoards[index], ...updates };
        saveMockDb();
        return HttpResponse.json(mockBoards[index]);
    }),

    // Lists for a given board
    http.get("/api/boards/:boardId/lists", async ({ params }) => {
        await delay(NETWORK_DELAY);
        const lists = mockLists.filter((l) => l.boardId === params.boardId);
        return HttpResponse.json(lists.sort((a, b) => a.order - b.order));
    }),

    // Create a List
    http.post("/api/boards/:boardId/lists", async ({ params, request }) => {
        await delay(NETWORK_DELAY);
        const { title } = (await request.json()) as { title: string };

        const lists = mockLists.filter((l) => l.boardId === params.boardId);
        const newOrder =
            lists.length > 0 ? Math.max(...lists.map((l) => l.order)) + 1000 : 1000;

        const newList = {
            id: `lst-${Date.now()}`,
            boardId: params.boardId as string,
            title,
            order: newOrder,
        };

        mockLists.push(newList);
        saveMockDb();
        return HttpResponse.json(newList, { status: 201 });
    }),

    // Cards for a given board (all lists at once makes UI rendering eager)
    http.get("/api/boards/:boardId/cards", async ({ params }) => {
        await delay(NETWORK_DELAY);
        // Find lists for this board
        const listIds = mockLists
            .filter((l) => l.boardId === params.boardId)
            .map((l) => l.id);
        const cards = mockCards.filter((c) => listIds.includes(c.listId));
        return HttpResponse.json(cards);
    }),

    // Create a Card
    http.post("/api/cards", async ({ request }) => {
        await delay(NETWORK_DELAY);
        const newCard = (await request.json()) as Partial<Card>;

        const card: Card = {
            id: `crd-${Date.now()}`,
            listId: newCard.listId!,
            title: newCard.title!,
            description: newCard.description || "",
            order: newCard.order || 0,
            assigneeIds: newCard.assigneeIds || [],
            labels: newCard.labels || [],
        };

        mockCards.push(card);
        saveMockDb();
        return HttpResponse.json(card, { status: 201 });
    }),

    // Update a Card (Drag and Drop typically targets order and listId)
    http.put("/api/cards/:cardId", async ({ params, request }) => {
        await delay(NETWORK_DELAY);
        const updates = (await request.json()) as Partial<Card>;
        const index = mockCards.findIndex((c) => c.id === params.cardId);

        if (index === -1) {
            return new HttpResponse("Card not found", { status: 404 });
        }

        mockCards[index] = { ...mockCards[index], ...updates };
        saveMockDb();
        return HttpResponse.json(mockCards[index]);
    }),

    // Delete a Card
    http.delete("/api/cards/:cardId", async ({ params }) => {
        await delay(NETWORK_DELAY);
        const index = mockCards.findIndex((c) => c.id === params.cardId);

        if (index === -1) {
            return new HttpResponse("Card not found", { status: 404 });
        }

        const deletedCard = mockCards.splice(index, 1)[0];
        saveMockDb();
        return HttpResponse.json(deletedCard);
    }),

    // Get Comments for a Card
    http.get("/api/cards/:cardId/comments", async ({ params }) => {
        await delay(NETWORK_DELAY);
        const comments = mockComments.filter((c) => c.cardId === params.cardId);
        return HttpResponse.json(comments);
    }),

    // Add a Comment to a Card
    http.post("/api/cards/:cardId/comments", async ({ params, request }) => {
        await delay(NETWORK_DELAY);
        const { text, userId } = (await request.json()) as {
            text: string;
            userId: string;
        };

        const newComment = {
            id: `cmt-${Date.now()}`,
            cardId: params.cardId as string,
            userId,
            text,
            createdAt: new Date().toISOString(),
        };

        mockComments.push(newComment);
        saveMockDb();
        return HttpResponse.json(newComment, { status: 201 });
    }),

    // Users
    http.get("/api/users", async () => {
        await delay(NETWORK_DELAY);
        return HttpResponse.json(mockUsers);
    }),

    // Create or Login User
    http.post("/api/users", async ({ request }) => {
        await delay(NETWORK_DELAY);
        const { name } = (await request.json()) as { name: string };

        let user = mockUsers.find(
            (u) => u.name.toLowerCase() === name.toLowerCase(),
        );

        if (!user) {
            user = {
                id: `usr-${Date.now()}`,
                name,
                avatarUrl: `https://avatar.vercel.sh/${encodeURIComponent(name)}`,
            };
            mockUsers.push(user);
            saveMockDb();
        }

        return HttpResponse.json(user, { status: 201 });
    }),
];
