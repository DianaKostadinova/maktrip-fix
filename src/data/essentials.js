// Practical info for travellers. Kept as data so it is searchable from the
// command palette and works fully offline.

export const EUR_TO_MKD = 61.5;

export const emergencyNumbers = [
    { label: 'Emergency (all services)', number: '112' },
    { label: 'Police', number: '192' },
    { label: 'Fire', number: '193' },
    { label: 'Ambulance', number: '194' },
];

export const quickFacts = [
    { label: 'Currency', value: 'Denar (MKD) · €1 ≈ 61.5 MKD' },
    { label: 'Language', value: 'Macedonian (Cyrillic) · Albanian in the west' },
    { label: 'Plugs', value: '230 V · Type C/F (EU)' },
    { label: 'Driving', value: 'Right-hand side · international licence OK' },
    { label: 'Population', value: '~1.8 million · Skopje ~600,000' },
    { label: 'Time zone', value: 'CET (UTC+1), summer UTC+2' },
];

export const phrases = [
    { mk: 'Здраво', latin: 'Zdravo', en: 'Hello' },
    { mk: 'Довидување', latin: 'Doviduvanje', en: 'Goodbye' },
    { mk: 'Благодарам', latin: 'Blagodaram', en: 'Thank you' },
    { mk: 'Молам', latin: 'Molam', en: "Please / You're welcome" },
    { mk: 'Извинете', latin: 'Izvinete', en: 'Excuse me / Sorry' },
    { mk: 'Да / Не', latin: 'Da / Ne', en: 'Yes / No' },
    { mk: 'Колку чини?', latin: 'Kolku chini?', en: 'How much is it?' },
    { mk: 'Каде е…?', latin: 'Kade e…?', en: 'Where is…?' },
    { mk: 'Не разбирам', latin: 'Ne razbiram', en: "I don't understand" },
    { mk: 'Зборувате ли англиски?', latin: 'Zboruvate li angliski?', en: 'Do you speak English?' },
    { mk: 'Едно пиво, молам', latin: 'Edno pivo, molam', en: 'One beer, please' },
    { mk: 'Сметката, молам', latin: 'Smetkata, molam', en: 'The bill, please' },
    { mk: 'Помош!', latin: 'Pomosh!', en: 'Help!' },
    { mk: 'Аптека', latin: 'Apteka', en: 'Pharmacy' },
];

export const prices = [
    {
        group: 'Food & drink',
        items: [
            ['Restaurant meal', '200–500 MKD'],
            ['Fast-food combo', '150–350 MKD'],
            ['Burek', '~80 MKD'],
            ['Local beer 0.5 L (Skopsko, Zlaten Dab)', '~150 MKD'],
            ['Glass of wine', '120–200 MKD'],
            ['Espresso', '60–90 MKD'],
            ['Water 0.5 L', '30–40 MKD'],
        ],
    },
    {
        group: 'Getting around',
        items: [
            ['City bus ride', '~35 MKD'],
            ['Taxi start + per km', '50 MKD + 40 MKD/km'],
            ['Airport → centre by taxi', '1,200–1,500 MKD'],
            ['Airport → centre by bus', '~200 MKD'],
            ['Intercity bus', '300–800 MKD'],
        ],
    },
];

export const transport = [
    {
        id: 'bus',
        title: 'City buses (JSP)',
        body: 'Skopje’s public bus network runs from early morning to around midnight. Buy a refillable Skopje Card at kiosks, or pay the driver (~35 MKD). The card gives discounted fares.',
        links: [
            { label: 'Routes & timetables', href: 'http://www.jsp.com.mk/PlanskiVozenRed.aspx' },
            { label: 'Android app', href: 'https://play.google.com/store/apps/details?id=mk.com.jsp.jspskopje' },
            { label: 'iOS app', href: 'https://apps.apple.com/mk/app/jsp-skopje/id1581790590' },
        ],
    },
    {
        id: 'taxi',
        title: 'Taxis',
        body: 'Licensed taxis are cheap and metered: ~50–60 MKD start + ~40 MKD/km, so 5 km is a little over 200 MKD. Always make sure the meter is running.',
        links: [
            { label: 'Wizi (Android)', href: 'https://play.google.com/store/apps/details?id=mk.wizi.passenger' },
            { label: 'Wizi (iOS)', href: 'https://apps.apple.com/us/app/wizi/id1450317409' },
            { label: 'Beeride (Android)', href: 'https://play.google.com/store/apps/details?id=com.beeride.passenger' },
            { label: 'Beeride (iOS)', href: 'https://apps.apple.com/us/app/beeride/id1545427494' },
            { label: 'All taxi companies', href: 'https://zk.mk/taksi-kompanii/skopje' },
        ],
        phones: [
            { label: 'Global Taxi (English-speaking)', number: '+38970255255' },
            { label: 'Riva Taxi', number: '15161' },
            { label: 'Panorama Taxi (airport)', number: '15160' },
        ],
    },
    {
        id: 'scooters',
        title: 'BinBin e-scooters',
        body: 'Scan the QR code to unlock, ~9 MKD per minute, max 25 km/h. Stick to bike lanes and park responsibly.',
        links: [
            { label: 'Android', href: 'https://play.google.com/store/apps/details?id=com.binbin.customer' },
            { label: 'iOS', href: 'https://apps.apple.com/us/app/binbin-scooters/id1474379989' },
        ],
    },
    {
        id: 'intercity',
        title: 'Intercity, trains & cars',
        body: 'Comfortable coaches connect all major cities (Skopje–Ohrid ~3 h). Trains are limited but scenic. Car rental at the airport and in the centre costs about €20–40/day.',
        links: [
            { label: 'Bus tickets (BalkanViator)', href: 'https://www.balkanviator.com' },
            { label: 'Macedonian Railways', href: 'http://www.mzt.mk' },
            { label: 'Airport bus', href: 'https://skp.airports.com.mk/en-EN/passenger-guide/to-from-the-airport/page/bus' },
        ],
    },
];

export const tips = [
    {
        id: 'money',
        title: 'Money',
        items: [
            'Cash is king — many small places don’t take cards.',
            'Use official exchange offices ("Menuvačnica"); never change money on the street.',
            'Avoid airport exchange desks — poor rates.',
            'ATMs are everywhere (limit usually ~20,000 MKD).',
            'Keep small notes for markets, taxis and tips.',
        ],
    },
    {
        id: 'connectivity',
        title: 'SIM & Wi-Fi',
        items: [
            'Tourist SIMs at the airport, kiosks and shops (~500 MKD / 7 days).',
            'Main providers: A1, Telekom, Lycamobile.',
            'Free Wi-Fi in most cafés, restaurants and hotels.',
            'EU roaming works but can be expensive — not in the EU zone.',
        ],
    },
    {
        id: 'health',
        title: 'Health & safety',
        items: [
            'Tap water is safe in cities.',
            'Pharmacies say "Аптека" — many are open 24/7.',
            'Travel insurance is strongly recommended.',
            'Very safe overall; watch for pickpockets in crowded markets.',
        ],
    },
    {
        id: 'etiquette',
        title: 'Eating out',
        items: [
            'Tip ~10%; round up for taxis.',
            'Service is relaxed — coffee can last hours.',
            'Smoking is still common in cafés and bars.',
            'Vegetarian options are limited but improving.',
        ],
    },
    {
        id: 'scams',
        title: 'Scams to avoid',
        items: [
            'Taxi overcharging — insist on the meter.',
            'Check prices before ordering, especially fish.',
            'Count your money at the exchange desk.',
            'Real police always show ID and never ask for your wallet.',
        ],
    },
    {
        id: 'shopping',
        title: 'Shopping hours',
        items: [
            'Shops: Mon–Fri 9–20, Sat 9–15, many closed Sunday.',
            'Supermarkets open daily until ~22:00.',
            'Bargaining is expected at bazaars, not in shops.',
        ],
    },
    {
        id: 'pro',
        title: 'Pro tips',
        items: [
            'Download offline maps before day trips.',
            'Learn a few Cyrillic letters — street signs use them.',
            'Dress modestly at monasteries.',
            'Try rakija, but pace yourself!',
            'Summers hit 35 °C+, winters can drop to −10 °C.',
            'Carry tissues — public toilets often lack paper.',
        ],
    },
];

export const holidays = [
    ['Jan 1–2', 'New Year'],
    ['Jan 7', 'Orthodox Christmas'],
    ['Spring (varies)', 'Orthodox Easter'],
    ['May 1', 'Labour Day'],
    ['May 24', 'Ss. Cyril and Methodius'],
    ['Aug 2', 'Ilinden — Republic Day'],
    ['Sep 8', 'Independence Day'],
    ['Oct 11', 'Day of the Uprising'],
    ['Oct 23', 'Macedonian Revolutionary Struggle Day'],
    ['Dec 8', 'St. Clement of Ohrid'],
];
