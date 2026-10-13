// Default pre-trip checklist. `season` limits an item to warm or cold months.

export const CHECKLIST = [
    {
        group: 'Documents',
        items: [
            { id: 'passport', text: 'Passport or EU ID valid for the whole trip' },
            { id: 'visa', text: 'Check visa rules for your nationality' },
            { id: 'insurance', text: 'Travel insurance (not covered by EU EHIC)' },
            { id: 'copies', text: 'Photo of passport saved offline' },
            { id: 'license', text: 'Driving licence (+ Green Card if driving your own car)' },
        ],
    },
    {
        group: 'Money',
        items: [
            { id: 'cash', text: 'Some cash in euros or denars for day one' },
            { id: 'card', text: 'Tell your bank you’re travelling' },
            { id: 'fees', text: 'A card with no foreign-transaction fees' },
        ],
    },
    {
        group: 'Phone & tech',
        items: [
            { id: 'offline-maps', text: 'Download offline maps of Skopje / Ohrid' },
            { id: 'install', text: 'Install this app to your home screen (works offline)' },
            { id: 'sim', text: 'Plan a local SIM or eSIM — EU roaming doesn’t apply' },
            { id: 'adapter', text: 'Type C/F plug adapter (EU style)' },
            { id: 'apps', text: 'Taxi app (Wizi / Beeride) installed' },
        ],
    },
    {
        group: 'Packing',
        items: [
            { id: 'shoes', text: 'Comfortable walking shoes — old towns are cobbled' },
            { id: 'modest', text: 'Covered shoulders/knees outfit for monasteries' },
            { id: 'swim', text: 'Swimwear for Lake Ohrid', season: 'warm' },
            { id: 'sun', text: 'Sunscreen, hat, refillable water bottle', season: 'warm' },
            { id: 'layers', text: 'Warm layers and a waterproof jacket', season: 'cold' },
            { id: 'boots', text: 'Waterproof boots for snow/slush', season: 'cold' },
            { id: 'tissues', text: 'Pocket tissues & hand sanitiser' },
        ],
    },
    {
        group: 'Before you go',
        items: [
            { id: 'book-ohrid', text: 'Book Ohrid accommodation early (July–August)' },
            { id: 'bus', text: 'Check intercity bus times for travel days' },
            { id: 'phrases', text: 'Learn 5 phrases: zdravo, blagodaram, molam…' },
            { id: 'events', text: 'Check festivals during your dates (see Guide)' },
        ],
    },
];

export const EXPENSE_CATEGORIES = ['Stay', 'Food', 'Transport', 'Activities', 'Shopping', 'Other'];
