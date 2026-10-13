import { Fragment } from 'react';

// Renders the planner's light markdown (headings, **bold**, *italic*, bullets,
// ---) as React elements — no innerHTML, so model output can't inject markup.

function inline(text) {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
        return <Fragment key={i}>{p}</Fragment>;
    });
}

export default function PlanText({ text }) {
    const blocks = [];
    let list = null;

    text.split('\n').forEach((raw, i) => {
        const line = raw.trimEnd();
        const bullet = line.match(/^\s*[-*•]\s+(.*)/);
        if (bullet) {
            list ??= [];
            list.push(<li key={i}>{inline(bullet[1])}</li>);
            return;
        }
        if (list) {
            blocks.push(<ul key={`ul-${i}`}>{list}</ul>);
            list = null;
        }
        if (!line.trim()) return;
        if (/^-{3,}$/.test(line.trim())) blocks.push(<hr key={i} />);
        else if (/^#{1,3}\s/.test(line)) blocks.push(<h3 key={i}>{inline(line.replace(/^#+\s/, ''))}</h3>);
        else if (/^\*\*[^*]+\*\*:?$/.test(line.trim())) blocks.push(<h3 key={i}>{line.trim().replace(/\*\*/g, '').replace(/:$/, '')}</h3>);
        else blocks.push(<p key={i}>{inline(line)}</p>);
    });
    if (list) blocks.push(<ul key="ul-end">{list}</ul>);

    return <div className="plan-text">{blocks}</div>;
}
