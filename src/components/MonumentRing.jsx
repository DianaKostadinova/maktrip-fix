import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import { guideService } from '../services/contentServices';

const monuments = guideService.monuments();

const N = monuments.length;
const STEP = (2 * Math.PI) / N;
const DURATION = 900;
const AUTOPLAY_MS = 4000;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const mod = (n, m) => ((n % m) + m) % m;

/**
 * Four transparent monuments standing on a turntable. `turn` is a continuous
 * number (1 = one quarter turn); it's tweened with requestAnimationFrame so
 * every monument travels along the actual circle, and depth is recomputed each
 * frame — which lets the back of the ring pass *behind* the headline while the
 * front passes in front of it.
 */
export default function MonumentRing({ children }) {
    const stageRef = useRef(null);
    const [width, setWidth] = useState(1000);
    const [turn, setTurn] = useState(0); // animated value
    const current = useRef(0); // same value, readable synchronously
    const target = useRef(0);
    const [goal, setGoal] = useState(0); // where the ring is heading (whole steps)
    const swipedAt = useRef(0);
    const anim = useRef(null);
    const drag = useRef(null);
    const reduceMotion = useRef(false);
    const wheel = useRef({ sum: 0, at: 0 });
    // Autoplay: on unless the user paused it or prefers reduced motion; it also
    // waits while being touched, off-screen, or in a background tab. Hover does
    // not pause it (the hero is full-width, so the mouse is nearly always on it);
    // any manual turn simply restarts the countdown.
    const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const [hold, setHold] = useState(false);
    const [visible, setVisible] = useState(true);

    useLayoutEffect(() => {
        reduceMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const el = stageRef.current;
        const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    useEffect(() => () => cancelAnimationFrame(anim.current), []);

    useEffect(() => {
        const el = stageRef.current;
        const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && document.visibilityState === 'visible'), { threshold: 0.15 });
        io.observe(el);
        const onVis = () => setVisible(document.visibilityState === 'visible');
        document.addEventListener('visibilitychange', onVis);
        return () => {
            io.disconnect();
            document.removeEventListener('visibilitychange', onVis);
        };
    }, []);

    const rotateTo = useCallback((to) => {
        cancelAnimationFrame(anim.current);
        target.current = to;
        setGoal(to);
        const apply = (v) => {
            current.current = v;
            setTurn(v);
        };
        if (reduceMotion.current) {
            apply(to);
            return;
        }
        const from = current.current;
        const start = performance.now();
        const tick = (now) => {
            const t = Math.min(1, (now - start) / DURATION);
            apply(from + (to - from) * easeInOut(t));
            if (t < 1) anim.current = requestAnimationFrame(tick);
        };
        anim.current = requestAnimationFrame(tick);
    }, []);

    const step = useCallback((dir) => rotateTo(Math.round(target.current) + dir), [rotateTo]);

    // Bring monument i to the front along the shortest way round.
    const focus = (i) => {
        const current = Math.round(target.current);
        const delta = mod(i - current + N / 2, N) - N / 2;
        if (delta !== 0) rotateTo(current + delta);
    };

    const playing = !paused && !hold && visible;

    // One timer per step: any manual turn changes `goal` and restarts the 4 s countdown.
    useEffect(() => {
        if (!playing) return undefined;
        const t = setTimeout(() => step(1), AUTOPLAY_MS);
        return () => clearTimeout(t);
    }, [playing, goal, step]);

    // Horizontal trackpad scroll (or Shift + wheel) turns the ring; vertical scroll stays page scroll.
    const onWheel = (e) => {
        const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
        if (!dx) return;
        const w = wheel.current;
        if (e.timeStamp - w.at < DURATION * 0.6) return; // one step per gesture
        w.sum += dx;
        if (Math.abs(w.sum) > 50) {
            step(w.sum > 0 ? 1 : -1);
            w.sum = 0;
            w.at = e.timeStamp;
        }
    };

    const front = mod(goal, N);
    const active = monuments[front];

    // Ring geometry, scaled to the stage width.
    const radius = Math.min(width * 0.34, 470);

    const onKeyDown = (e) => {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            step(1);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            step(-1);
        }
    };

    // Swipe left/right to turn; the click that follows a swipe is ignored.
    const onPointerDown = (e) => {
        drag.current = e.clientX;
    };
    const onPointerUp = (e) => {
        if (drag.current == null) return;
        const dx = e.clientX - drag.current;
        drag.current = null;
        if (Math.abs(dx) > 40) {
            swipedAt.current = e.timeStamp;
            step(dx < 0 ? 1 : -1);
        }
    };
    const justSwiped = (e) => e.timeStamp - swipedAt.current < 300;

    return (
        <div className="ring" role="group" aria-roledescription="carousel" aria-label="Four monuments of Macedonia">
            <div
                ref={stageRef}
                className="ring__stage"
                tabIndex={0}
                onKeyDown={onKeyDown}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onWheel={onWheel}
                onTouchStart={() => setHold(true)}
                onTouchEnd={() => setTimeout(() => setHold(false), 1500)}
                onClick={(e) => {
                    // A click on empty stage turns the ring one step.
                    if (justSwiped(e)) return;
                    if (e.target === e.currentTarget || e.target.classList.contains('ring__headline')) step(1);
                }}
            >
                <div className="ring__sun" aria-hidden />
                <div className="ring__floor" aria-hidden />

                {/* The headline sits at middle depth (z-index 2): the front of the ring passes over it, the back behind it. */}
                <div className="ring__headline" aria-hidden>
                    {children}
                </div>

                {monuments.map((m, i) => {
                    const angle = (i - turn) * STEP;
                    const depth = Math.cos(angle); // 1 = front, -1 = back
                    const x = Math.sin(angle) * radius;
                    const scale = 0.42 + 0.58 * ((depth + 1) / 2) ** 1.4;
                    const lift = (1 - depth) * 26; // further away = a little higher on the "floor"
                    const isFront = i === front;
                    return (
                        <button
                            key={m.id}
                            type="button"
                            className={`ring__item ${isFront ? 'is-front' : ''}`}
                            style={{
                                transform: `translate(calc(-50% + ${x}px), ${-lift}px) scale(${scale})`,
                                zIndex: depth > -0.2 ? 3 + Math.round((depth + 1) * 10) : 1,
                                opacity: 0.35 + 0.65 * ((depth + 1) / 2),
                                filter: depth < 0 ? `blur(${(-depth * 2).toFixed(2)}px) saturate(${0.6 + 0.4 * (1 + depth)})` : 'none',
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (justSwiped(e)) return;
                                if (isFront) step(1);
                                else focus(i);
                            }}
                            aria-label={isFront ? `${m.name} — show next monument` : `Show ${m.name}`}
                            tabIndex={-1}
                        >
                            <img src={m.image} alt="" draggable="false" decoding="async" fetchPriority={i === 0 ? 'high' : 'auto'} />
                        </button>
                    );
                })}
            </div>

            <div className="ring__bar">
                <div className="ring__caption" aria-live="polite" key={active.id}>
                    <span className="ring__count">
                        {String(front + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}
                    </span>
                    <div>
                        <p className="ring__local">{active.local} · {active.year}</p>
                        <h2 className="ring__name">{active.name}</h2>
                        <p className="ring__text">
                            {active.text} <span className="muted">{active.location}.</span>
                        </p>
                        <Link to={`/places?open=${active.placeId}`} className="link-arrow">
                            Plan a visit <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
                <div className="ring__controls">
                    <div className={`ring__dots ${playing ? 'is-playing' : ''}`} aria-hidden>
                        {monuments.map((m, i) => (
                            <span key={i === front ? `${m.id}-${goal}` : m.id} className={i === front ? 'is-active' : ''} style={{ '--autoplay': `${AUTOPLAY_MS}ms` }} />
                        ))}
                    </div>
                    <button className="ring__btn" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Play auto-rotation' : 'Pause auto-rotation'} aria-pressed={paused}>
                        {paused ? <Play size={18} /> : <Pause size={18} />}
                    </button>
                    <button className="ring__btn" onClick={() => step(-1)} aria-label="Previous monument">
                        <ArrowLeft size={20} />
                    </button>
                    <button className="ring__btn ring__btn--primary" onClick={() => step(1)} aria-label="Next monument">
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
            <p className="ring__credit">
                Photos: Wikimedia Commons ({[...new Set(monuments.map((m) => m.credit.license))].join(', ')}), backgrounds removed ·{' '}
                <Link to="/credits">credits</Link>
            </p>
        </div>
    );
}
