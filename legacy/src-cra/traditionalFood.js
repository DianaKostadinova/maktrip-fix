import React, { useState, useEffect } from 'react';
import './TraditionalFood.css';
import { auth, db } from './Firebase';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import "./backbutton.css"

async function toggleLike(section) {
    const user = auth.currentUser;
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    const snap = await getDoc(docRef);
    const data = snap.data();
    const current = data?.likes?.[section] || false;
    await updateDoc(docRef, {
        [`likes.${section}`]: !current
    });
}

const foods = [
    {
        name: 'Pastrmajlija',
        description: 'Flatbread topped with salted, dried pork or lamb, baked until crispy.',
        location: 'Štip, Veles, Prilep bakeries',
        price: '150-250 MKD',
        image: 'pastramajlija.jpg',
        cuisine: 'Traditional'
    },
    {
        name: 'Tavče Gravče',
        description: 'Baked beans in a traditional clay pot with paprika and spices.',
        location: 'Traditional restaurants',
        price: '120-180 MKD',
        image: 'gravce.jpg',
        cuisine: 'Traditional'
    },
    {
        name: 'Ajvar',
        description: 'Roasted red pepper spread, made in autumn and served with bread or meat.',
        location: 'Markets and traditional homes',
        price: '150 MKD/jar',
        image: 'ajvar.jpg',
        cuisine: 'Spread'
    },
    {
        name: 'Simit Pogača',
        description: 'Round sesame bread, crunchy outside, soft inside – a Balkan favorite.',
        location: 'Local bakeries across Skopje',
        price: '30-60 MKD',
        image: 'simit.jpg',
        cuisine: 'Bakery'
    },
    {
        name: 'Šarska Pleskavica',
        description: 'Grilled meat patty stuffed with cheese – a spicy, juicy delight.',
        location: 'Kafana and traditional restaurants',
        price: '200-300 MKD',
        image: 'sarska.jpg',
        cuisine: 'Grilled'
    },
    {
        name: 'Sarma',
        description: 'Cabbage rolls filled with minced meat and rice, slow-cooked in sauce.',
        location: 'Family homes, traditional restaurants',
        price: '150-220 MKD',
        image: 'sarma.jpg',
        cuisine: 'Traditional'
    },
    {
        name: 'Burek',
        description: 'Flaky pastry filled with meat, cheese, or spinach – a perfect breakfast.',
        location: 'Every bakery in Macedonia',
        price: '60-120 MKD',
        image: 'burek.jpg',
        cuisine: 'Bakery'
    },
    {
        name: 'Mekica',
        description: 'Fried dough pastry, similar to a doughnut, that is typically round and fluffy with a slightly sweet taste.',
        location: 'Most bakeries in Macedonia',
        price: '20-40 MKD',
        image: 'mekica.jpg',
        cuisine: 'Bakery'
    }
];

const restaurants = [

    {
        name: "Teteks",
        description: "Popular local spot known for grilled meats and burgers",
        specialties: "Kebapi, grilled meats, burgers,toast",
        priceRange: "200-300 MKD per meal",
        location: "Multiple locations in Skopje",
        image: "tetekss.webp"
    },
    {
        name: "Royal",
        description: "Popular fast food spot in skopje",
        specialties: "Burgers and wraps",
        priceRange: "200-300 MKD per dish",
        location: "locations in Aerodrom and Debar Maalo",
        image: "royal.jpg"
    },
    {
        name: "Munchies",
        description: "Casual dining with burgers, pizza, and international food",
        specialties: "Burgers,fries, wraps",
        priceRange: "200-400 MKD per dish",
        location: "Aerodrom",
        image: "munchies.webp"
    },
    {
        name: "Jojo's",
        description: "Event-based food truck with delicious burgers and hot-dogs",
        specialties: "Burgers,Hot-Dogs, Wurst",
        priceRange: "200-350 MKD per dish",
       
        note: "Only open during special events - check social media for schedules",
        image: "jojos.webp"
    },
    {
        name: "Oljo's",
        description: "Fast food spot in Debar Maalo",
        specialties: "Burgers",
        priceRange: "250-550 MKD per dish",
        location: "Boemska Street",
        image: "oljos.webp"
    },
    {
        name: "15za12",
        description: "Pizzeria specializing in Neapolitan pizza",
        specialties: "Pizza",
        priceRange: "350-600 MKD per dish",
        location: "Kisela Voda",
        image:"15za12.jpeg"
    },
    {
        name: "Silbo",
        description: "Bakery, located in Debar Maalo that workd tipll 2-3am..(we recomend eating Silbo Gevrek)",
        specialties: "pastries, pizzas, and desserts",
        priceRange: "50-150 MKD per dish",
        location: "DebarMaalo and Aerodrom area",
        image: "silbo.jpg"
    },
    {
        name: "Mekicite na Strazha",
        description: "Traditional Macedonian bakery  on the highway to Ohrid, famous for theirvfresh mekici- a mandatory stop for travelers",
        specialties: "fresh mekici, piroshki, traditional breakfast, coffee",
        priceRange: "30-120 MKD per dish",
        location: "Highway E-65 towards Ohrid, Strazha village",
        image: "mekicite_straza.webp"
    }
];

function TraditionalFood() {
    const [isLiked, setIsLiked] = useState(false);
    const [visibleCards, setVisibleCards] = useState([]);
    const [selectedCuisine, setSelectedCuisine] = useState('all');
    const [activeSection, setActiveSection] = useState('foods');
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisibleCards(foods.map((_, index) => index));
        }, 200);
        return () => clearTimeout(timer);
    }, []);

    const handleLike = async () => {
        setIsLiked(!isLiked);
        await toggleLike('traditionalFood');
    };

    const filteredFoods = selectedCuisine === 'all'
        ? foods
        : foods.filter(food => food.cuisine.toLowerCase() === selectedCuisine);

    const uniqueCuisines = [...new Set(foods.map(food => food.cuisine))];

    return (
        <div className="food-page">
            <div className="background-blur"></div>

            <div className="floating-particles">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 6}s`,
                            animationDuration: `${Math.random() * 3 + 4}s`
                        }}
                    />
                ))}
            </div>

            <div className="controls-container">
                <button className="back-button" onClick={() => navigate(-1)}>
                    ⬅ Back
                </button>
            </div>

            <div className="food-wrapper">
                <div className="food-hero">
                    <div className="food-header">
                        <h1 className="food-title">Traditional Macedonian and Fast Food & Restaurants</h1>
                    </div>
                    <p className="food-sub">
                        Discover authentic Macedonian dishes and the best places to enjoy them in Skopje.
                    </p>
                </div>

                {}
                <div className="section-selector" style={{ marginBottom: '20px', textAlign: 'center' }}>
                    <button
                        onClick={() => setActiveSection('foods')}
                        style={{
                            padding: '12px 24px',
                            margin: '5px',
                            backgroundColor: activeSection === 'foods' ? '#007bff' : '#f8f9fa',
                            color: activeSection === 'foods' ? 'white' : '#333',
                            border: '1px solid #ddd',
                            borderRadius: '25px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                         Traditional Foods
                    </button>
                    <button
                        onClick={() => setActiveSection('restaurants')}
                        style={{
                            padding: '12px 24px',
                            margin: '5px',
                            backgroundColor: activeSection === 'restaurants' ? '#007bff' : '#f8f9fa',
                            color: activeSection === 'restaurants' ? 'white' : '#333',
                            border: '1px solid #ddd',
                            borderRadius: '25px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                        Fast Food
                    </button>
                </div>

                {activeSection === 'foods' && (
                    <>
                        {}
                        

                        <div className="food-list">
                            {(selectedCuisine === 'all' ? foods : foods.filter(food => food.cuisine.toLowerCase() === selectedCuisine)).map((food, index) => (
                                <div
                                    className={`food-card ${visibleCards.includes(index) ? 'visible' : ''}`}
                                    key={index}
                                    style={{
                                        transitionDelay: `${index * 0.1}s`
                                    }}
                                >
                                    <img
                                        src={`./${food.image}`}
                                        alt={food.name}
                                        className="food-img"
                                        onError={(e) => {
                                            e.target.src = `https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;
                                        }}
                                    />
                                    <div className="food-info">
                                        <h3>{food.name}</h3>
                                        <p>{food.description}</p>
                                        <p className="location"><strong>Where to find:</strong> {food.location}</p>
                                        <p className="price">{food.price}</p>
                                        <span className="cuisine-tag">{food.cuisine}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeSection === 'restaurants' && (
                    <div className="restaurant-list">
                        {restaurants.map((restaurant, index) => (
                            <div
                                className={`food-card ${visibleCards.includes(index) ? 'visible' : ''}`}
                                key={index}
                                style={{
                                    transitionDelay: `${index * 0.1}s`
                                }}
                            >
                                <img
                                    src={`./${restaurant.image}`}
                                    alt={restaurant.name}
                                    className="food-img"
                                    onError={(e) => {
                                        e.target.src = `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;
                                    }}
                                />
                                <div className="food-info">
                                    <h3>{restaurant.name}</h3>
                                    <p>{restaurant.description}</p>
                                    <p className="location"><strong>Specialties:</strong> {restaurant.specialties}</p>
                                    <p className="location"><strong>Location:</strong> {restaurant.location}</p>
                                    <p className="price">{restaurant.priceRange}</p>
                                    {restaurant.note && (
                                        <p style={{
                                            fontSize: '0.85em',
                                            color: '#e74c3c',
                                            fontStyle: 'italic',
                                            marginTop: '8px'
                                        }}>
                                            ℹ️ {restaurant.note}
                                        </p>
                                    )}
                                    <span className="cuisine-tag">Restaurant</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TraditionalFood;