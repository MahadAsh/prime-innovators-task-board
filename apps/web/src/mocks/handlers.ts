import { http, HttpResponse, delay } from 'msw';
import { mockBoards, mockLists, mockCards, mockUsers } from './db';
import { Card } from '../types';

const NETWORK_DELAY = 500; // Simulated latency

export const handlers = [
    // Boards
    http.get('/api/boards', async () => {
        await delay(NETWORK_DELAY);
        return HttpResponse.json(mockBoards);
    }),

    // Lists for a given board
    http.get('/api/boards/:boardId/lists', async ({ params }) => {
        await delay(NETWORK_DELAY);
        const lists = mockLists.filter((l) => l.boardId === params.boardId);
        return HttpResponse.json(lists.sort((a, b) => a.order - b.order));
    }),

    // Cards for a given board (all lists at once makes UI rendering eager)
    http.get('/api/boards/:boardId/cards', async ({ params }) => {
        await delay(NETWORK_DELAY);
        // Find lists for this board
        const listIds = mockLists.filter(l => l.boardId === params.boardId).map(l => l.id);
        const cards = mockCards.filter(c => listIds.includes(c.listId));
        return HttpResponse.json(cards);
    }),

    // Create a Card
    http.post('/api/cards', async ({ request }) => {
        await delay(NETWORK_DELAY);
        const newCard = (await request.json()) as Partial<Card>;

        const card: Card = {
            id: `crd-${Date.now()}`,
            listId: newCard.listId!,
            title: newCard.title!,
            description: newCard.description || '',
            order: newCard.order || 0,
            assigneeIds: newCard.assigneeIds || [],
            labels: newCard.labels || [],
        };

        mockCards.push(card);
        return HttpResponse.json(card, { status: 201 });
    }),

    // Update a Card (Drag and Drop typically targets order and listId)
    http.put('/api/cards/:cardId', async ({ params, request }) => {
        await delay(NETWORK_DELAY);
        const updates = (await request.json()) as Partial<Card>;
        const index = mockCards.findIndex((c) => c.id === params.cardId);

        if (index === -1) {
            return new HttpResponse('Card not found', { status: 404 });
        }

        mockCards[index] = { ...mockCards[index], ...updates };
        return HttpResponse.json(mockCards[index]);
    }),

    // Users
    http.get('/api/users', async () => {
        await delay(NETWORK_DELAY);
        return HttpResponse.json(mockUsers);
    }),
];
