export default function EmptyState({ icon: Icon, title, children, action }) {
    return (
        <div className="empty">
            {Icon && (
                <div className="empty__icon">
                    <Icon size={28} aria-hidden />
                </div>
            )}
            <h3>{title}</h3>
            {children && <p>{children}</p>}
            {action}
        </div>
    );
}
