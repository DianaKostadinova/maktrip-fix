import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// Thin wrapper around <dialog>: native focus trapping, Esc to close, and a
// click on the backdrop closes it too. Renders as a bottom sheet on phones.
export default function Modal({ open, onClose, title, children, wide = false, labelledBy }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (open && !el.open) el.showModal();
        if (!open && el.open) el.close();
    }, [open]);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const onCancel = (e) => {
            e.preventDefault();
            onClose();
        };
        el.addEventListener('cancel', onCancel);
        return () => el.removeEventListener('cancel', onCancel);
    }, [onClose]);

    return (
        <dialog
            ref={ref}
            className={`modal ${wide ? 'modal--wide' : ''}`}
            aria-labelledby={labelledBy}
            aria-label={labelledBy ? undefined : title}
            onClick={(e) => e.target === ref.current && onClose()}
        >
            {open && (
                <div className="modal__body">
                    <button className="icon-btn modal__close" onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                    {children}
                </div>
            )}
        </dialog>
    );
}
