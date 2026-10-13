// Trip helper rules: dates, countdown, seasonal checklist, budget, exports.
import { contentRepository } from '../repositories/contentRepository';
import { deviceRepository } from '../repositories/externalRepositories';
import { catalogService } from './catalogService';
import { guideService, essentialsService } from './contentServices';

export const EMPTY_TRIP = {
    startDate: '',
    endDate: '',
    travelers: 2,
    cities: [],
    budgetEur: 0,
    days: {}, // { 'YYYY-MM-DD': [catalogId, ...] }
    checked: {}, // { checklistItemId: true }
    custom: [], // [{ id, text }]
    expenses: [], // [{ id, label, amount, currency, category, date }]
    notes: '',
};

const monthOf = (iso) => new Date(`${iso}T12:00:00`).getMonth();
const todayIso = () => new Date().toISOString().slice(0, 10);
const nextDay = (iso) => {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
};

export const tripService = {
    normalise: (stored) => ({ ...EMPTY_TRIP, ...stored }),

    dates(trip) {
        if (!trip.startDate || !trip.endDate) return [];
        const out = [];
        for (let d = trip.startDate; d <= trip.endDate && out.length < 60; d = nextDay(d)) out.push(d);
        return out;
    },

    countdown(trip) {
        if (!trip.startDate) return null;
        const days = Math.ceil((new Date(`${trip.startDate}T00:00:00`) - new Date()) / 86400000);
        const during = tripService.dates(trip).includes(todayIso());
        const label = days > 1 ? `${days} days to go` : days === 1 ? 'Tomorrow!' : days === 0 ? 'Today!' : during ? 'You’re here — enjoy' : 'Trip finished';
        return { days, label };
    },

    isWarm: (dates) => (dates.length ? [4, 5, 6, 7, 8].includes(monthOf(dates[0])) : null),

    checklist(trip) {
        const warm = tripService.isWarm(tripService.dates(trip));
        const groups = contentRepository.checklist().map((g) => ({
            ...g,
            items: g.items.filter((it) => !it.season || warm == null || (it.season === 'warm') === warm),
        }));
        const all = [...groups.flatMap((g) => g.items), ...trip.custom];
        return { groups, warm, total: all.length, done: all.filter((it) => trip.checked[it.id]).length };
    },

    festivalsDuring: (trip) => guideService.festivalsIn([...new Set(tripService.dates(trip).map(monthOf))]),

    climate: (trip) => (trip.startDate ? guideService.month(monthOf(trip.startDate)) : null),

    budget(trip) {
        const toEur = (e) => (e.currency === 'MKD' ? essentialsService.toEur(e.amount) : e.amount);
        const spent = trip.expenses.reduce((s, e) => s + toEur(e), 0);
        const byCategory = Object.entries(
            trip.expenses.reduce((m, e) => ({ ...m, [e.category]: (m[e.category] || 0) + toEur(e) }), {})
        ).sort((a, b) => b[1] - a[1]);
        const left = trip.budgetEur ? trip.budgetEur - spent : null;
        const daysLeft = tripService.dates(trip).filter((d) => d >= todayIso()).length || tripService.dates(trip).length;
        return { spent, spentMkd: essentialsService.toMkd(spent), byCategory, left, perDay: left != null && daysLeft ? left / daysLeft : null };
    },

    stopsPlanned: (trip) => Object.values(trip.days).flat().length,

    daysWithItems: (trip) => tripService.dates(trip).map((date) => ({ date, items: (trip.days[date] || []).map(catalogService.byId).filter(Boolean) })),

    /** Plain-text itinerary for sharing. */
    toText(trip) {
        return tripService
            .daysWithItems(trip)
            .map(({ date, items }, i) => `Day ${i + 1} (${date}): ${items.map((it) => it.name).join(', ') || 'free day'}`)
            .join('\n');
    },

    /** iCalendar file: one all-day event per trip day. */
    toIcs(trip, title = 'Macedonia trip') {
        const esc = (s) => String(s).replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
        const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
        const events = tripService.daysWithItems(trip).map(({ date, items }, i) =>
            [
                'BEGIN:VEVENT',
                `UID:${date}-${i}@discover-macedonia`,
                `DTSTAMP:${stamp}`,
                `DTSTART;VALUE=DATE:${date.replaceAll('-', '')}`,
                `DTEND;VALUE=DATE:${nextDay(date).replaceAll('-', '')}`,
                `SUMMARY:${esc(`${title} — day ${i + 1}`)}`,
                `DESCRIPTION:${esc(items.length ? items.map((it, n) => `${n + 1}. ${it.name} (${it.location ?? ''})`).join('\n') : 'Free day')}`,
                'END:VEVENT',
            ].join('\r\n')
        );
        return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Discover Macedonia//Trip//EN', ...events, 'END:VCALENDAR'].join('\r\n');
    },

    exportCalendar: (trip) => deviceRepository.downloadFile('macedonia-trip.ics', tripService.toIcs(trip), 'text/calendar'),
    share: (trip) => deviceRepository.share({ title: 'My Macedonia trip', text: tripService.toText(trip) }),
};

export const expenseCategories = () => contentRepository.expenseCategories();
