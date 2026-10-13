import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Users, Camera, HelpCircle, Star, MessagesSquare } from 'lucide-react';
import { chatService, CHAT_ROOMS, MAX_MESSAGE } from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

const ICONS = { meetup: Users, experiences: Camera, help: HelpCircle, recommendations: Star };
const ROOMS = CHAT_ROOMS.map((r) => ({ ...r, icon: ICONS[r.id] }));
const MAX_LEN = MAX_MESSAGE;

function timeLabel(ts) {
    const d = ts?.toDate?.();
    if (!d) return 'sending…';
    const sameDay = d.toDateString() === new Date().toDateString();
    return sameDay ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function initials(name = '?') {
    return name.split(/[\s@.]/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join('');
}

export default function Community() {
    const { user, enabled } = useAuth();
    const toast = useToast();
    const [room, setRoom] = useState('meetup');
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const endRef = useRef(null);

    useEffect(() => {
        document.title = 'Community · Discover Macedonia';
    }, []);

    useEffect(() => {
        if (!chatService.enabled()) return undefined;
        return chatService.watchRoom(room, setMessages, (err) => toast.error(`Chat unavailable: ${err.message}`));
    }, [room, toast]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ block: 'end' });
    }, [messages]);

    const active = useMemo(() => ROOMS.find((r) => r.id === room), [room]);

    const send = async (e) => {
        e.preventDefault();
        const clean = text.trim();
        if (!clean || !user) return;
        setSending(true);
        try {
            await chatService.send(user, room, clean);
            setText('');
        } catch (err) {
            toast.error(`Couldn’t send: ${err.message}`);
        } finally {
            setSending(false);
        }
    };

    if (!enabled) {
        return (
            <>
                <PageHeader eyebrow="Луѓе · Community" title="Traveller chat" />
                <div className="container">
                    <EmptyState icon={MessagesSquare} title="Chat isn’t configured">Add Firebase settings to .env to enable accounts and chat.</EmptyState>
                </div>
            </>
        );
    }

    return (
        <>
            <PageHeader eyebrow="Луѓе · Community" title="Traveller chat">
                Meet other travellers, ask locals, share what you found.
            </PageHeader>
            <div className="container chat">
                <nav className="chat__rooms" aria-label="Chat rooms">
                    {ROOMS.map((r) => (
                        <button key={r.id} className={`room ${room === r.id ? 'is-active' : ''}`} aria-current={room === r.id} onClick={() => setRoom(r.id)}>
                            <r.icon size={18} aria-hidden />
                            <span>
                                <strong>{r.name}</strong>
                                <small>{r.description}</small>
                            </span>
                        </button>
                    ))}
                </nav>

                <section className="chat__main panel" aria-label={active.name}>
                    <div className="chat__messages">
                        {messages.length === 0 ? (
                            <EmptyState icon={active.icon} title={`No messages in ${active.name} yet`}>Be the first to say hello.</EmptyState>
                        ) : (
                            messages.map((m) => {
                                const mine = m.uid === user?.uid;
                                return (
                                    <div key={m.id} className={`msg ${mine ? 'msg--mine' : ''}`}>
                                        {!mine && (m.photo ? <img className="msg__avatar" src={m.photo} alt="" /> : <span className="msg__avatar">{initials(m.user)}</span>)}
                                        <div className="msg__bubble">
                                            {!mine && <strong className="msg__name">{m.user}</strong>}
                                            <p>{m.text}</p>
                                            <time>{timeLabel(m.timestamp)}</time>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={endRef} />
                    </div>

                    {user ? (
                        <form className="chat__composer" onSubmit={send}>
                            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={MAX_LEN} placeholder={`Message ${active.name}…`} aria-label="Message" />
                            <button className="btn btn--primary" disabled={!text.trim() || sending} aria-label="Send"><Send size={18} /></button>
                        </form>
                    ) : (
                        <div className="chat__signin">
                            <span>Sign in to join the conversation.</span>
                            <Link to="/account?next=/community" className="btn btn--primary btn--sm">Sign in</Link>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
