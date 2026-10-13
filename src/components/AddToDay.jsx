import { CalendarPlus } from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { useSaved } from '../context/SavedContext';
import { useToast } from '../context/ToastContext';

const fmt = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });

// Drop a place straight onto a day of the trip (saving it too).
export default function AddToDay({ id, name }) {
    const { dates, trip, addToDay } = useTrip();
    const { isSaved, toggle } = useSaved();
    const toast = useToast();
    if (!dates.length) return null;
    const on = dates.find((d) => (trip.days[d] || []).includes(id));
    return (
        <label className="add-to-day">
            <CalendarPlus size={18} aria-hidden />
            <select
                value={on ?? ''}
                onChange={(e) => {
                    const d = e.target.value;
                    if (!d) return;
                    if (!isSaved(id)) toggle(id);
                    addToDay(d, id);
                    toast.success(`${name} → day ${dates.indexOf(d) + 1}`);
                }}
                aria-label={`Add ${name} to a day of your trip`}
            >
                <option value="">{on ? 'Move to day…' : 'Add to my trip…'}</option>
                {dates.map((d, i) => (
                    <option key={d} value={d}>Day {i + 1} · {fmt(d)}</option>
                ))}
            </select>
        </label>
    );
}
