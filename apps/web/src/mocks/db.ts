import { Board, List, Card, User, Comment } from '../types';

export const mockUsers: User[] = [
    { id: 'usr-1', name: 'Mahad', avatarUrl: 'https://i.pravatar.cc/150?u=mahad' },
    { id: 'usr-2', name: 'Alex Doe', avatarUrl: 'https://i.pravatar.cc/150?u=alex' },
];

export const mockBoards: Board[] = [
    {
        id: 'brd-1',
        title: 'Frontend Architecture Project',
        description: 'Planning and execution of the Kanban board web app.',
        createdAt: new Date().toISOString(),
    },
];

export let mockLists: List[] = [
    { id: 'lst-1', boardId: 'brd-1', title: 'To Do', order: 1000 },
    { id: 'lst-2', boardId: 'brd-1', title: 'In Progress', order: 2000 },
    { id: 'lst-3', boardId: 'brd-1', title: 'Done', order: 3000 },
];

export let mockCards: Card[] = [
    {
        id: 'crd-1',
        listId: 'lst-1',
        title: 'Design API Contract',
        description: 'Draft REST endpoints and JSON structures for MSW.',
        order: 1000,
        assigneeIds: ['usr-1'],
        labels: ['architecture', 'backend'],
    },
    {
        id: 'crd-2',
        listId: 'lst-1',
        title: 'Setup MSW Handlers',
        description: 'Implement realistic request resolution with delays.',
        order: 2000,
        assigneeIds: ['usr-1'],
        labels: ['testing'],
    },
    {
        id: 'crd-3',
        listId: 'lst-2',
        title: 'Scaffold Workspace',
        description: 'Turborepo, Vite, Bun, Tailwind CSS setup.',
        order: 1000,
        assigneeIds: ['usr-1', 'usr-2'],
        labels: ['infrastructure'],
    },
    {
        id: 'crd-4',
        listId: 'lst-3',
        title: 'Initial Planning',
        description: 'Break down tasks and draft architecture document.',
        order: 1000,
        assigneeIds: ['usr-1'],
        labels: ['planning'],
    }
];

export let mockComments: Comment[] = [];
