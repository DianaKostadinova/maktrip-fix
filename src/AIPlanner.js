import React, { useState, useEffect } from "react";
import { Ollama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { auth, db } from "./Firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import "./backbutton.css";
import "./AIPlanner.css";
import { useNavigate } from "react-router-dom";

function SmartTravelPlanner() {
    const [location, setLocation] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [budget, setBudget] = useState("");
    const [interests, setInterests] = useState("");
    const [likes, setLikes] = useState({});
    const [pinnedPlaces, setPinnedPlaces] = useState([]);
    const [plan, setPlan] = useState("");
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [ollamaStatus, setOllamaStatus] = useState("checking");
    const navigate = useNavigate();

    
    const macedoniaDatabase = {
        attractions: [
           
            {
                name: 'Alexander the Great Monument',
                location: 'Skopje',
                category: 'Monument',
                coords: { lat: 41.9959, lng: 21.4314 },
                description: 'Iconic 22-meter bronze statue in Macedonia Square.',
                cost: 'Free',
                duration: '30 min',
                bestTime: 'Early morning or evening for photos',
                howToGet: 'Walk from anywhere downtown or any bus to main square',
                nearbyAttractions: ['Old Bazaar', 'Stone Bridge', 'Skopje Fortress']
            },
            {
                name: 'Matka Canyon',
                location: 'Skopje',
                category: 'Nature',
                coords: { lat: 41.9479, lng: 21.2981 },
                description: 'Stunning canyon with caves, medieval monasteries, and boat tours.',
                cost: '€3 entry, boat tours €5',
                duration: '4-6 hours',
                bestTime: 'Morning (9-11 AM) to avoid crowds, spring/summer for boat tours',
                howToGet: 'Bus #60 from city center (45 min, €1) or taxi (20 min, ~€8). Last bus 8 PM.',
                tips: 'Bring water, comfortable shoes. Restaurant available. Cave tours extra €3.'
            },
            {
                name: 'Mount Vodno & Millennium Cross',
                location: 'Skopje',
                category: 'Nature/Monument',
                coords: { lat: 41.9653, lng: 21.3981 },
                description: '66-meter illuminated cross with panoramic city views.',
                cost: 'Cable car €4 return',
                duration: '3-4 hours (including travel)',
                bestTime: 'Late afternoon for sunset views, avoid windy days',
                howToGet: 'Bus #25 to Sredno Vodno (30 min), then cable car. Or taxi direct €10.',
                tips: 'Check cable car schedule. Restaurant at top. Great for photos.'
            },
            {
                name: 'Skopje Fortress (Kale)',
                location: 'Skopje',
                category: 'Historical',
                coords: { lat: 42.0008, lng: 21.4333 },
                description: '6th-century fortress overlooking the city.',
                cost: 'Free',
                duration: '1-2 hours',
                bestTime: 'Late afternoon for sunset, morning to avoid heat',
                howToGet: '15-min walk from Macedonia Square or Old Bazaar',
                nearbyAttractions: ['Old Bazaar', 'Macedonia Square']
            },
            {
                name: 'Old Bazaar (Stara Čaršija)',
                location: 'Skopje',
                category: 'Cultural',
                coords: { lat: 42.0000, lng: 21.4367 },
                description: 'Largest bazaar in Balkans outside Istanbul with Ottoman architecture.',
                cost: 'Free entry, shopping varies',
                duration: '2-3 hours',
                bestTime: 'Morning (10 AM-12 PM) when shops open, evening for cafes',
                howToGet: '5-min walk north from Macedonia Square across Stone Bridge',
                tips: 'Try traditional coffee, bargain for souvenirs, visit mosques'
            },
            {
                name: 'Kozjak Lake',
                location: 'Skopje Region',
                category: 'Nature',
                coords: { lat: 42.1547, lng: 21.3289 },
                description: 'Hidden emerald lake perfect for swimming.',
                cost: 'Free',
                duration: 'Full day trip',
                bestTime: 'April-October, morning start to enjoy full day',
                howToGet: 'NEED CAR/TAXI: 45 min to Volkovo village + 20-min steep hike. No public transport.',
                tips: 'Difficult access, GPS essential, bring food/water, swimming gear'
            },

            
            {
                name: 'St. Naum Church',
                location: 'Ohrid',
                category: 'Religious',
                coords: { lat: 40.9134, lng: 20.7403 },
                description: '10th-century monastery with peacocks and springs.',
                cost: '€3 entry',
                duration: '3-4 hours (including travel)',
                bestTime: 'Morning to avoid crowds, combine with boat tour',
                howToGet: 'Boat tour from Ohrid (€15, 2 hours) or bus (€2, 45 min) or taxi €15',
                tips: 'Peacocks roam freely, natural springs, restaurant on site'
            },
            {
                name: 'Church of St. John at Kaneo',
                location: 'Ohrid',
                category: 'Religious',
                coords: { lat: 41.1097, lng: 20.7881 },
                description: 'Most photographed church in Macedonia on cliff over lake.',
                cost: '€2 entry',
                duration: '1-2 hours',
                bestTime: 'Golden hour (sunset) for best photos, early morning for solitude',
                howToGet: '20-min scenic walk along Ohrid boardwalk or 5-min taxi',
                nearbyAttractions: ['Samuel\'s Fortress', 'Ohrid Boardwalk']
            },
            {
                name: 'Samuel\'s Fortress',
                location: 'Ohrid',
                category: 'Historical',
                coords: { lat: 41.1131, lng: 20.7950 },
                description: '10th-century fortress with panoramic lake views.',
                cost: '€3 entry',
                duration: '1-2 hours',
                bestTime: 'Late afternoon for sunset views',
                howToGet: 'Steep 15-min climb from old town',
                tips: 'Wear comfortable shoes, bring water, great photo spot'
            },

          
            {
                name: 'Heraclea Lyncestis',
                location: 'Bitola',
                category: 'Archaeological',
                coords: { lat: 41.0111, lng: 21.3425 },
                description: 'Ancient city founded by Philip II with amazing mosaics.',
                cost: '€5 entry',
                duration: '2-3 hours',
                bestTime: 'Morning to avoid heat, late afternoon for good lighting',
                howToGet: '2km south of Bitola. Walk 30 min or taxi €2',
                tips: 'Bring sun protection, audio guide available, amazing mosaics'
            },
            {
                name: 'Širok Sokak Street',
                location: 'Bitola',
                category: 'Cultural',
                coords: { lat: 41.0322, lng: 21.3344 },
                description: 'Pedestrian street with consulate buildings and cafes.',
                cost: 'Free walking, cafe/shopping varies',
                duration: '2-3 hours',
                bestTime: 'Evening for cafe culture, afternoon for shopping',
                howToGet: 'Main pedestrian street in city center',
                nearbyAttractions: ['Clock Tower', 'Magnolia Square']
            }
        ],

        nightlife: [
            {
                name: 'Garson',
                location: 'Skopje City Center',
                category: 'Cocktail Bar',
                description: 'Trendy cocktail bar with DJ nights and karaoke weekends.',
                bestTime: 'Thursday-Saturday nights, karaoke weekends',
                vibe: 'Trendy, energetic',
                priceRange: '€5-12 per drink'
            },
            {
                name: 'Kotur',
                location: 'Debar Maalo, Skopje',
                category: 'Stylish Bar',
                description: 'Chic interior with great music and weekend DJs.',
                bestTime: 'Friday-Saturday for DJs, weekdays for relaxed vibe',
                vibe: 'Stylish, sophisticated',
                priceRange: '€4-10 per drink'
            },
            {
                name: 'Crash Bar',
                location: 'Centar, Skopje',
                category: 'Rock Bar',
                description: 'Underground rock bar with raw atmosphere.',
                bestTime: 'Any evening, especially for rock music lovers',
                vibe: 'Underground, alternative',
                priceRange: '€3-7 per drink'
            }
        ],

        cafes: [
            {
                name: 'The Dude Specialty Coffee',
                location: 'Centar, Skopje',
                category: 'Specialty Coffee',
                description: 'Premium coffee roastery with exceptional beans.',
                specialty: 'Single-origin beans, pour-over methods',
                bestTime: 'Morning for fresh coffee, afternoon for work',
                priceRange: '€2-5'
            },
            {
                name: 'Sinatra Coffee',
                location: 'Debar Maalo, Skopje',
                category: 'Espresso Bar',
                description: 'Elegant coffee bar with premium espresso.',
                specialty: 'Italian-style coffee, sophisticated atmosphere',
                bestTime: 'Morning rush',
                priceRange: '€1.5-4'
            }
        ],

        transportation: {
            skopje: {
                publicBus: '€0.5-1 per ride, extensive network',
                taxi: '€3-8 city rides, €0.5 per km',
                walking: 'City center very walkable',
                dayPass: 'Bus day pass €3'
            },
            intercity: {
                'Skopje-Ohrid': 'Bus €8-12, 2.5-3 hours, frequent departures',
                'Skopje-Bitola': 'Bus €7-10, 2-2.5 hours',
                'Ohrid-Bitola': 'Bus €5-8, 1.5 hours',
                'Skopje-Tetovo': 'Bus €2-3, 45 minutes'
            }
        },

        budgetGuide: {
            accommodation: {
                budget: '€15-25/night (hostels, guesthouses)',
                midRange: '€25-50/night (hotels)',
                luxury: '€50+/night (premium hotels)'
            },
            food: {
                budget: '€3-8 per meal (traditional restaurants)',
                midRange: '€8-15 per meal (nice restaurants)',
                luxury: '€15+per meal (fine dining)'
            },
            activities: {
                free: 'Fortress, parks, walking tours, some churches',
                low: '€2-5 (most museums, basic entries)',
                medium: '€5-15 (boat tours, cable cars, guided tours)',
                high: '€15+ (special activities, private tours)'
            }
        }
    };

    const llm = new Ollama({
        baseUrl: "http://localhost:11434",
        model: "llama3.2:3b",
        temperature: 0.3, 
    });

    
    const promptTemplate = PromptTemplate.fromTemplate(`
You are an expert local travel guide for North Macedonia with deep knowledge of the region.

COMPREHENSIVE MACEDONIA TRAVEL DATABASE:
{databaseInfo}

SMART PLANNING RULES:
1. TIMING OPTIMIZATION:
   - Group nearby attractions by location and time of day
   - Schedule outdoor activities for optimal weather/lighting
   - Plan restaurant visits around meal times
   - Consider opening hours and crowd patterns

2. TRANSPORTATION LOGIC:
   - Minimize backtracking between locations
   - Use public transport for city exploration
   - Recommend taxis for hard-to-reach places
   - Suggest walking for nearby attractions

3. BUDGET OPTIMIZATION:
   - Mix free and paid attractions
   - Suggest lunch at budget places, dinner at nicer spots
   - Recommend day passes for transport when beneficial
   - Include cost breakdowns for each day

4. SEASONAL CONSIDERATIONS:
   - Outdoor activities best in spring/summer/early fall
   - Indoor alternatives for bad weather
   - Seasonal opening hours for attractions

TRIP DETAILS:
- Base Location: {location}
- Dates: {startDate} to {endDate}
- Total Budget: {budget} EUR
- Interests: {interests}
- Liked Categories: {likedCategories}
- Pinned Places: {pinnedPlaces}

REQUIRED OUTPUT FORMAT:
Create a day-by-day itinerary with:

**DAY X (Date): Theme**
- **Morning (9:00-12:00):** [Activity] - [Location] - [Cost] - [How to get there]
  *Why this time:* [Reasoning for timing]
  *Travel:* [Transport details and time]

- **Lunch (12:00-14:00):** [Restaurant suggestion] - [Cost estimate]

- **Afternoon (14:00-17:00):** [Activity] - [Location] - [Cost] - [Transport]
  *Why this time:* [Reasoning]

- **Evening (17:00+):** [Activity/Dining] - [Cost]
  *Alternative:* [Backup option if weather/closure]

**Daily Budget:** €X (breakdown: transport €X, activities €X, food €X)
**Daily Total Walking:** Approximately X minutes
**Key Tips:** [Practical advice for the day]

---

GENERATE SMART, PRACTICAL ITINERARY NOW:
    `);

    const chain = promptTemplate.pipe(llm).pipe(new StringOutputParser());

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            if (u) fetchUserData(u.uid);
        });

        checkOllamaStatus();
        return () => unsubscribe();
    }, []);

    const checkOllamaStatus = async () => {
        try {
            const response = await fetch("http://localhost:11434/api/tags");
            if (response.ok) {
                setOllamaStatus("connected");
            } else {
                setOllamaStatus("error");
            }
        } catch (error) {
            setOllamaStatus("error");
        }
    };

    const fetchUserData = async (uid) => {
        const userRef = doc(db, "users", uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
            await setDoc(userRef, { pinnedPlaces: [], likes: {} });
            return;
        }
        const data = snap.data();
        setLikes(data.likes || {});
        setPinnedPlaces(data.pinnedPlaces || []);
    };

    const generateDatabaseInfo = (baseLocation) => {
        const location = baseLocation.toLowerCase();
        let relevantData = "";

        const localAttractions = macedoniaDatabase.attractions.filter(
            attr => attr.location.toLowerCase().includes(location) ||
                location.includes(attr.location.toLowerCase())
        );

        const nearbyAttractions = macedoniaDatabase.attractions.filter(
            attr => !attr.location.toLowerCase().includes(location) &&
                !location.includes(attr.location.toLowerCase())
        );

        relevantData += "LOCAL ATTRACTIONS:\n";
        localAttractions.forEach(attr => {
            relevantData += `- ${attr.name} (${attr.category}): ${attr.description}\n`;
            relevantData += `  Cost: ${attr.cost}, Duration: ${attr.duration}\n`;
            relevantData += `  Best Time: ${attr.bestTime}\n`;
            relevantData += `  Transport: ${attr.howToGet}\n`;
            if (attr.tips) relevantData += `  Tips: ${attr.tips}\n`;
            if (attr.nearbyAttractions) relevantData += `  Nearby: ${attr.nearbyAttractions.join(', ')}\n`;
            relevantData += "\n";
        });

        relevantData += "NEARBY CITIES/DAY TRIPS:\n";
        nearbyAttractions.slice(0, 6).forEach(attr => {
            relevantData += `- ${attr.name} in ${attr.location}: ${attr.description}\n`;
            relevantData += `  Cost: ${attr.cost}, Duration: ${attr.duration}\n\n`;
        });

        relevantData += "NIGHTLIFE & DINING:\n";
        macedoniaDatabase.nightlife.forEach(spot => {
            if (spot.location.toLowerCase().includes(location)) {
                relevantData += `- ${spot.name}: ${spot.description}\n`;
                relevantData += `  Best Time: ${spot.bestTime}, Vibe: ${spot.vibe}\n`;
                relevantData += `  Price: ${spot.priceRange}\n\n`;
            }
        });

        relevantData += "COFFEE CULTURE:\n";
        macedoniaDatabase.cafes.forEach(cafe => {
            if (cafe.location.toLowerCase().includes(location)) {
                relevantData += `- ${cafe.name}: ${cafe.description}\n`;
                relevantData += `  Specialty: ${cafe.specialty}\n`;
                relevantData += `  Best Time: ${cafe.bestTime}, Price: ${cafe.priceRange}\n\n`;
            }
        });

        relevantData += "TRANSPORTATION:\n";
        relevantData += `Local: ${macedoniaDatabase.transportation.skopje.publicBus}\n`;
        relevantData += `Taxi: ${macedoniaDatabase.transportation.skopje.taxi}\n`;
        relevantData += "Intercity connections:\n";
        Object.entries(macedoniaDatabase.transportation.intercity).forEach(([route, info]) => {
            relevantData += `- ${route}: ${info}\n`;
        });

        relevantData += "\nBUDGET GUIDELINES:\n";
        relevantData += `Accommodation: Budget ${macedoniaDatabase.budgetGuide.accommodation.budget}, Mid-range ${macedoniaDatabase.budgetGuide.accommodation.midRange}\n`;
        relevantData += `Food: Budget ${macedoniaDatabase.budgetGuide.food.budget}, Mid-range ${macedoniaDatabase.budgetGuide.food.midRange}\n`;
        relevantData += `Activities: Free ${macedoniaDatabase.budgetGuide.activities.free}, Low cost ${macedoniaDatabase.budgetGuide.activities.low}, Medium ${macedoniaDatabase.budgetGuide.activities.medium}\n`;

        return relevantData;
    };

    const calculateDays = () => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const generatePlan = async () => {
        if (ollamaStatus !== "connected") {
            alert("❌ Ollama is not running. Please start Ollama and try again.");
            return;
        }

        if (!location || !startDate || !endDate || !budget) {
            alert("❌ Please fill in all required fields.");
            return;
        }

        const days = calculateDays();
        if (days > 14) {
            alert("❌ Please select a trip of 14 days or less for optimal planning.");
            return;
        }

        setLoading(true);
        setPlan(" Analyzing your trip requirements...");

        try {
            const databaseInfo = generateDatabaseInfo(location);
            setPlan(" Generating your travel plan... This may take a minute");

            const pinnedList = pinnedPlaces.map((p) => p.name).join(", ") || "none";
            const likedCategories = Object.entries(likes)
                .filter(([_, val]) => val)
                .map(([key]) => key)
                .join(", ") || "none";

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Generation timeout")), 180000)
            );

            const generationPromise = chain.invoke({
                location: location,
                startDate: startDate,
                endDate: endDate,
                budget: budget,
                interests: interests,
                likedCategories: likedCategories,
                pinnedPlaces: pinnedList,
                databaseInfo: databaseInfo,
            });

            const result = await Promise.race([generationPromise, timeoutPromise]);
            setPlan(result);

        } catch (error) {
            console.error("Error generating plan:", error);

            if (error.message.includes("timeout")) {
                setPlan("❌ Generation timed out. The plan might be too complex. Try a shorter trip duration.");
            } else {
                setPlan(`❌ Error: ${error.message}\n\nTry refreshing and generating again.`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user || !plan || plan.startsWith("❌")) {
            alert("❌ Please log in and generate a valid plan first.");
            return;
        }

        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { travelPlan: plan });
            alert("✅ Smart plan saved to your profile!");
        } catch (error) {
            alert("❌ Error saving plan. Please try again.");
        }
    };

    return (
        <div className="planner-wrapper">
            <div className="background-fixed"></div>

            <div className="controls-container">
                <button className="back-button" onClick={() => navigate(-1)}> ⬅ Back </button>
            </div>

            <div className="planner-page">
                <h2 className="title"> Macedonia Travel Planner</h2>

           

                <input
                    type="text"
                    placeholder="Your base city (Skopje, Ohrid, Bitola, Tetovo, etc.)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                />

                <div className="date-group">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                    />

                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                    />
                    {startDate && endDate && (
                        <span className="days-indicator">
                             {calculateDays()} days
                        </span>
                    )}
                </div>

                <input
                    type="number"
                    placeholder="Total budget in EUR (include accommodation, food, activities)"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    min="50"
                    required
                />

                <textarea
                    placeholder="Your interests and preferences (e.g., history, nature, nightlife, food culture, photography, hiking, museums, local experiences)"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    rows="3"
                />

                <div className="button-group">
                    <button
                        onClick={generatePlan}
                        disabled={loading || ollamaStatus !== "connected"}
                        className={loading ? "generating" : "smart-btn"}
                    >
                        {loading ? " Creating plan..." : " Generate Travel Plan"}
                    </button>

                    {loading && (
                        <button
                            onClick={() => {
                                setLoading(false);
                                setPlan("❌ Generation cancelled by user");
                            }}
                            className="cancel-btn"
                        >
                            Cancel
                        </button>
                    )}
                </div>

                {ollamaStatus === "error" && (
                    <div className="help-text">
                        <p><strong>To start the AI planner:</strong></p>
                        <ol>
                            <li>Open terminal and run: <code>ollama serve</code></li>
                            <li>Download model: <code>ollama pull llama3.2:3b</code></li>
                            <li>Refresh this page</li>
                        </ol>
                    </div>
                )}

                {plan && (
                    <>
                        <div className="result-box smart-plan">
                            <h3> Your Travel Plan:</h3>
                            <div className="plan-content">
                                <pre>{plan}</pre>
                            </div>
                        </div>

                        {!plan.startsWith("❌") && (
                            <button className="btn btn-warning mt-3" onClick={handleSave}>
                                💾 Save Plan
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
} export default SmartTravelPlanner;