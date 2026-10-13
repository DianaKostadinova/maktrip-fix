const MACEDONIA_CONFIG = {
    disambiguations: {
        'macedonia': 'North Macedonia',
        'macedonian': 'North Macedonia',
        'republic of macedonia': 'North Macedonia',
        'fyrom': 'North Macedonia',
        'former yugoslav republic of macedonia': 'North Macedonia',
        'македонија': 'Северна Македонија',
        'македонски': 'Северна Македонија',
        'република македонија': 'Северна Македонија'
    },

    contextMappings: {
        'history': 'History of North Macedonia',
        'culture': 'Culture of North Macedonia',
        'economy': 'Economy of North Macedonia',
        'politics': 'Politics of North Macedonia',
        'government': 'Government of North Macedonia',
        'language': 'Macedonian language',
        'people': 'Macedonians (ethnic group)',
        'capital': 'Skopje',
        'cities': 'List of cities in North Macedonia'
    },

    validationPatterns: {
        northMacedonia: [
            /north macedonia/i,
            /skopje/i,
            /ohrid/i,
            /bitola/i,
            /prilep/i,
            /kumanovo/i,
            /tetovo/i,
            /gostivar/i,
            /strumica/i,
            /gevgelija/i,
            /македонија/i,
            /скопје/i,
            /охрид/i,
            /битола/i
        ],
        suspicious: [
            /ancient macedonia/i,
            /alexander the great/i,
            /philip ii/i,
            /greek macedonia/i,
            /macedonia \(greece\)/i,
            /thessaloniki/i,
            /kavala/i,
            /veroia/i
        ],
        validCategories: [
            'North Macedonia',
            'Macedonia',
            'Balkans',
            'Southeast Europe',
            'Yugoslav',
            'Macedonian',
            'Skopje',
            'Ohrid'
        ]
    }
};

export async function fetchWikipediaSummary(title, options = {}) {
    const {
        preferredLanguage = 'auto',
        validateContent = true,
        useFallback = true,
        maxRetries = 2
    } = options;

    try {
        const processedTitle = preprocessTitle(title);
        const primaryResult = await fetchWithValidation(processedTitle, preferredLanguage, validateContent);
        return primaryResult;
    } catch (error) {
        console.warn(`Primary fetch failed for "${title}":`, error.message);

        if (useFallback) {
            return await fetchWithFallback(title, validateContent, maxRetries);
        }

        throw error;
    }
}

function preprocessTitle(title) {
    const lowerTitle = title.toLowerCase().trim();
    const disambiguated = MACEDONIA_CONFIG.disambiguations[lowerTitle] || title;
    const contextual = MACEDONIA_CONFIG.contextMappings[lowerTitle] || disambiguated;
    return contextual;
}

async function fetchWithValidation(title, preferredLanguage, validateContent) {
    const lang = determineLang(title, preferredLanguage);

    const searchResults = await searchWikipedia(title, lang);
    const bestMatch = findBestMatch(searchResults, title);

    if (!bestMatch) {
        throw new Error(`No matching article found for "${title}"`);
    }

    const [summary, pageInfo] = await Promise.all([
        fetchSummary(bestMatch, lang),
        fetchPageInfo(bestMatch, lang)
    ]);

    if (validateContent) {
        validateMacedoniaContent(summary, pageInfo, title);
    }

    const finalContent = lang === 'mk' ? await translateToEnglish(summary) : summary;

    return {
        title: bestMatch,
        content: finalContent,
        language: lang,
        url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(bestMatch)}`,
        validated: validateContent
    };
}

function determineLang(title, preferredLanguage) {
    if (preferredLanguage !== 'auto') {
        return preferredLanguage;
    }

    const hasCyrillic = /[\u0400-\u04FF]/.test(title);
    const macedoniaTerms = ['македонија', 'скопје', 'охрид', 'битола'];
    const hasMacedonianTerms = macedoniaTerms.some(term =>
        title.toLowerCase().includes(term)
    );

    return (hasCyrillic || hasMacedonianTerms) ? 'mk' : 'en';
}

async function searchWikipedia(title, lang) {
    const searchUrl = new URL(`https://${lang}.wikipedia.org/w/api.php`);
    searchUrl.searchParams.set('action', 'query');
    searchUrl.searchParams.set('list', 'search');
    searchUrl.searchParams.set('srsearch', title);
    searchUrl.searchParams.set('srlimit', '10');
    searchUrl.searchParams.set('format', 'json');
    searchUrl.searchParams.set('origin', '*');

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (!data.query?.search) {
        throw new Error('Search API returned no results');
    }

    return data.query.search;
}

function findBestMatch(searchResults, originalTitle) {
    if (!searchResults || searchResults.length === 0) {
        return null;
    }

    const scoredResults = searchResults.map(result => ({
        ...result,
        score: calculateMatchScore(result, originalTitle)
    }));

    scoredResults.sort((a, b) => b.score - a.score);
    return scoredResults[0].title;
}

function calculateMatchScore(result, originalTitle) {
    let score = 0;
    const title = result.title.toLowerCase();
    const original = originalTitle.toLowerCase();

    if (title === original) score += 100;
    if (title.includes(original) || original.includes(title)) score += 50;

    if (original.includes('macedonia')) {
        if (title.includes('north macedonia')) score += 30;
        if (title.includes('macedonia (greece)') || title.includes('ancient macedonia')) score -= 50;
    }

    score += Math.log(result.pageid || 1) * 0.1;
    return score;
}

async function fetchSummary(title, lang) {
    const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const response = await fetch(summaryUrl);

    if (!response.ok) {
        throw new Error(`Failed to fetch summary: ${response.status}`);
    }

    const data = await response.json();
    return data.extract || "No summary available.";
}

async function fetchPageInfo(title, lang) {
    const pageUrl = new URL(`https://${lang}.wikipedia.org/w/api.php`);
    pageUrl.searchParams.set('action', 'query');
    pageUrl.searchParams.set('prop', 'categories|info');
    pageUrl.searchParams.set('titles', title);
    pageUrl.searchParams.set('format', 'json');
    pageUrl.searchParams.set('origin', '*');

    const response = await fetch(pageUrl);
    const data = await response.json();

    return Object.values(data.query.pages)[0] || {};
}

function validateMacedoniaContent(content, pageInfo, originalTitle) {
    const lowerTitle = originalTitle.toLowerCase();
    const lowerContent = content.toLowerCase();

    if (!lowerTitle.includes('macedonia') && !lowerTitle.includes('macedon')) {
        return;
    }

    const hasValidPatterns = MACEDONIA_CONFIG.validationPatterns.northMacedonia.some(
        pattern => pattern.test(lowerContent)
    );

    const hasSuspiciousPatterns = MACEDONIA_CONFIG.validationPatterns.suspicious.some(
        pattern => pattern.test(lowerContent)
    );

    const categories = pageInfo.categories || [];
    const hasValidCategories = categories.some(cat =>
        MACEDONIA_CONFIG.validationPatterns.validCategories.some(valid =>
            cat.title.toLowerCase().includes(valid.toLowerCase())
        )
    );

    if (hasSuspiciousPatterns && !hasValidPatterns) {
        throw new Error('Content appears to be about Ancient/Greek Macedonia, not North Macedonia');
    }

    if (lowerTitle.includes('north macedonia') && !hasValidPatterns && !hasValidCategories) {
        throw new Error('Content validation failed: may not be about North Macedonia');
    }
}

async function fetchWithFallback(originalTitle, validateContent, maxRetries) {
    const fallbackStrategies = [
        () => fetchWithValidation(`North Macedonia ${originalTitle}`, 'en', validateContent),
        () => fetchWithValidation(originalTitle, 'mk', validateContent),
        () => fetchWithValidation(originalTitle, 'en', false),
        () => fetchWithValidation(`${originalTitle} North Macedonia`, 'en', false)
    ];

    for (let i = 0; i < Math.min(fallbackStrategies.length, maxRetries); i++) {
        try {
            const result = await fallbackStrategies[i]();
            console.log(`Fallback strategy ${i + 1} succeeded`);
            return result;
        } catch (error) {
            console.warn(`Fallback strategy ${i + 1} failed:`, error.message);
        }
    }

    throw new Error(`All fallback strategies failed for "${originalTitle}"`);
}

async function translateToEnglish(text) {
    try {
        const response = await fetch('https://libretranslate.de/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                q: text,
                source: 'mk',
                target: 'en',
                format: 'text'
            }),
        });

        if (!response.ok) {
            throw new Error(`Translation API error: ${response.status}`);
        }

        const data = await response.json();
        return data.translatedText || text;
    } catch (error) {
        console.warn('Translation failed:', error.message);
        return text;
    }
}

export async function fetchMultipleTopics(titles, options = {}) {
    const results = await Promise.allSettled(
        titles.map(title => fetchWikipediaSummary(title, options))
    );

    return results.map((result, index) => ({
        title: titles[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
    }));
}