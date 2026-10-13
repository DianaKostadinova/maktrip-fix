import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { guideService } from '../services/contentServices';
import PageHeader from '../components/PageHeader';

// Spotify embeds are heavy (~1 MB each), so each one loads on demand.
function Track({ id, index }) {
    const [load, setLoad] = useState(false);
    return (
        <div className="track">
            {load ? (
                <iframe
                    title={`Spotify track ${index + 1}`}
                    src={`https://open.spotify.com/embed/track/${id}?utm_source=generator&theme=0`}
                    width="100%"
                    height="152"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                />
            ) : (
                <button className="track__placeholder" onClick={() => setLoad(true)}>
                    <span className="track__num">{String(index + 1).padStart(2, '0')}</span>
                    <span className="track__play"><Play size={20} /></span>
                    <span>Load track</span>
                </button>
            )}
        </div>
    );
}

export default function Music() {
    useEffect(() => {
        document.title = 'Music · Discover Macedonia';
    }, []);

    return (
        <>
            <PageHeader eyebrow="Звуци · Music" title="What Macedonia is playing" image="/images/music.webp">
                Trending local songs — perfect for the bus ride to Ohrid.
            </PageHeader>
            <div className="container">
                <div className="tracks">
                    {guideService.spotifyTracks().map((id, i) => (
                        <Track key={id} id={id} index={i} />
                    ))}
                </div>
            </div>
        </>
    );
}
