// Use case: community chat rooms — ordering, profanity filter, limits.
import { Filter } from 'bad-words';
import { messageRepository } from '../repositories/messageRepository';

const profanity = new Filter();
export const CHAT_ROOMS = [
    { id: 'meetup', name: 'Travel buddies', description: 'Find people to explore with' },
    { id: 'experiences', name: 'Experiences', description: 'Share stories and moments' },
    { id: 'help', name: 'Ask for help', description: 'Directions, tips, local advice' },
    { id: 'recommendations', name: 'Recommendations', description: 'Places, food and activities' },
];
export const MAX_MESSAGE = 500;

export const chatService = {
    enabled: messageRepository.available,
    /** Live, oldest-first, last 150 messages of a room. */
    watchRoom(room, onMessages, onError) {
        return messageRepository.watchRoom(
            room,
            (list) => {
                const sorted = [...list].sort((a, b) => (a.timestamp?.toMillis?.() ?? Infinity) - (b.timestamp?.toMillis?.() ?? Infinity));
                onMessages(sorted.slice(-150));
            },
            onError
        );
    },
    send(user, room, text) {
        const clean = text.trim();
        if (!clean) return Promise.resolve();
        return messageRepository.add({
            text: profanity.clean(clean).slice(0, MAX_MESSAGE),
            user: user.displayName || user.email,
            photo: user.photoURL || null,
            uid: user.uid,
            category: room,
        });
    },
};
