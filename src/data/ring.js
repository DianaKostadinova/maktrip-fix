import credits from './ringCredits.json' with { type: 'json' };

// The four monuments in the home-page ring. Images are transparent cut-outs
// made from Wikimedia Commons photos (background removed; see ringCredits.json).
export const monuments = [
    {
        id: 'warrior',
        name: 'Warrior on a Horse',
        local: 'Воин на коњ',
        location: 'Macedonia Square, Skopje',
        year: '2011',
        text: 'A 14.5-metre bronze rider rearing above a musical fountain — the centrepiece of the capital.',
        placeId: 'alexander-monument',
    },
    {
        id: 'porta',
        name: 'Porta Macedonia',
        local: 'Порта Македонија',
        location: 'Pella Square, Skopje',
        year: '2012',
        text: 'A triumphal arch for twenty years of independence, with a terrace on top.',
        placeId: 'porta-macedonia',
    },
    {
        id: 'kaneo',
        name: 'St. John at Kaneo',
        local: 'Св. Јован Канео',
        location: 'Ohrid',
        year: '13th c.',
        text: 'The little church on the cliff above Lake Ohrid — the country’s postcard.',
        placeId: 'kaneo',
    },
    {
        id: 'cross',
        name: 'Millennium Cross',
        local: 'Милениумски крст',
        location: 'Mount Vodno, Skopje',
        year: '2002',
        text: '66 metres of steel on Vodno, lit up at night and visible from all over the city.',
        placeId: 'vodno-cross',
    },
].map((m) => ({ ...m, image: credits[m.id].src, credit: credits[m.id] }));
