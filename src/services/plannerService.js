// Use cases backed by the Spring Boot API: itinerary drafts and news.
import { apiRepository } from '../repositories/apiRepository';

export const plannerService = {
    /** 'ok' | 'model-missing' | 'model-down' | 'api-down', plus model name. */
    async status(signal) {
        try {
            const h = await apiRepository.health(signal);
            if (!h.ai?.reachable) return { state: 'model-down', model: h.ai?.model };
            if (!h.ai?.modelInstalled) return { state: 'model-missing', model: h.ai.model };
            return { state: 'ok', model: h.ai.model };
        } catch (e) {
            if (e.name === 'AbortError') throw e;
            return { state: 'api-down' };
        }
    },

    validate({ startDate, endDate }) {
        const days = startDate && endDate ? Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1 : 0;
        if (days < 1 || days > 14) return 'Pick a trip between 1 and 14 days.';
        return null;
    },

    generate(form, savedPlaceNames, { onText, signal }) {
        return apiRepository.streamPlan(
            {
                city: form.city,
                startDate: form.startDate,
                endDate: form.endDate,
                budgetEur: Number(form.budgetEur),
                travelers: Number(form.travelers),
                pace: form.pace,
                interests: form.interests,
                savedPlaces: form.useSaved ? savedPlaceNames : [],
                notes: form.notes,
            },
            { onText, signal }
        );
    },
};


// Free hosting puts the API to sleep when idle; waking takes ~1 min. Give up
// after 8 s so the news section simply hides instead of spinning.
const NEWS_TIMEOUT_MS = 8000;

export const newsService = {
    async latest(limit, signal) {
        const timeout = AbortSignal.timeout(NEWS_TIMEOUT_MS);
        return (await apiRepository.news(limit, signal ? AbortSignal.any([signal, timeout]) : timeout)).items;
    },
};
