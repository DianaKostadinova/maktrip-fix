export default function PageHeader({ eyebrow, title, children, image, actions }) {
    return (
        <header className={`page-header ${image ? 'page-header--image' : ''}`}>
            {image && <div className="page-header__bg" style={{ backgroundImage: `url(${image})` }} aria-hidden />}
            <div className="container page-header__inner">
                {eyebrow && <p className="eyebrow">{eyebrow}</p>}
                <h1 className="display">{title}</h1>
                {children && <p className="lead">{children}</p>}
                {actions && <div className="page-header__actions">{actions}</div>}
            </div>
        </header>
    );
}
