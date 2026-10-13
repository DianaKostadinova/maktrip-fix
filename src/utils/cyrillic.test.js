import { describe, expect, it } from 'vitest';
import { isCyrillic, toCyrillic, toLatin } from './cyrillic';

describe('cyrillic transliteration', () => {
    it('romanises Macedonian place names', () => {
        expect(toLatin('Скопје')).toBe('Skopje');
        expect(toLatin('Охрид')).toBe('Ohrid');
        expect(toLatin('Шар Планина')).toBe('Shar Planina');
        expect(toLatin('Ѓорче Петров')).toBe('Gjorche Petrov');
    });

    it('handles digraphs going back to Cyrillic', () => {
        expect(toCyrillic('Kozjak')).toBe('Козјак');
        expect(toCyrillic('dzhamija')).toBe('џамија');
        expect(toCyrillic('Ulica Makedonija')).toBe('Улица Македонија');
    });

    it('detects Cyrillic text', () => {
        expect(isCyrillic('Здраво')).toBe(true);
        expect(isCyrillic('Zdravo')).toBe(false);
    });
});
