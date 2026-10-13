// Single-select filter chips. `options` is an array of strings or { value, label }.
export default function Chips({ options, value, onChange, label }) {
    return (
        <div className="chips" role="radiogroup" aria-label={label}>
            {options.map((opt) => {
                const { value: v, label: l, count } = typeof opt === 'string' ? { value: opt, label: opt } : opt;
                const active = v === value;
                return (
                    <button key={v} role="radio" aria-checked={active} className={`chip ${active ? 'is-active' : ''}`} onClick={() => onChange(v)}>
                        {l}
                        {count != null && <span className="chip__count">{count}</span>}
                    </button>
                );
            })}
        </div>
    );
}
