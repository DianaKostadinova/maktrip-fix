// Macedonian Cyrillic <-> Latin transliteration (official romanisation,
// with digraphs handled first when going Latin -> Cyrillic).

const MAP = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ѓ: 'gj', е: 'e', ж: 'zh', з: 'z', ѕ: 'dz', и: 'i', ј: 'j', к: 'k', л: 'l', љ: 'lj',
    м: 'm', н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r', с: 's', т: 't', ќ: 'kj', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', џ: 'dzh', ш: 'sh',
};

const REVERSE = Object.entries(MAP).sort((a, b) => b[1].length - a[1].length);

const matchCase = (src, out) => (src === src.toUpperCase() && src !== src.toLowerCase() ? out[0].toUpperCase() + out.slice(1) : out);

export function toLatin(text) {
    return [...text].map((ch) => (MAP[ch.toLowerCase()] ? matchCase(ch, MAP[ch.toLowerCase()]) : ch)).join('');
}

export function toCyrillic(text) {
    let out = '';
    for (let i = 0; i < text.length; ) {
        const rest = text.slice(i).toLowerCase();
        const hit = REVERSE.find(([, lat]) => rest.startsWith(lat));
        if (hit) {
            const [cyr, lat] = hit;
            out += text[i] === text[i].toUpperCase() && text[i] !== text[i].toLowerCase() ? cyr.toUpperCase() : cyr;
            i += lat.length;
        } else {
            out += text[i];
            i += 1;
        }
    }
    return out;
}

export const isCyrillic = (text) => /[Ѐ-ӿ]/.test(text);

export const ALPHABET = Object.entries(MAP);
