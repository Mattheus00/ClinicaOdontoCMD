import type { ReactNode } from 'react';
import './PageHeader.css';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions, children }: PageHeaderProps) {
  return (
    <div className="page-header velora-page-header">
      <div className="velora-page-header-copy">
        {eyebrow ? <p className="velora-page-eyebrow">{eyebrow}</p> : null}
        <h1 className="page-title">{title}</h1>
        {description ? <div className="page-subtitle">{description}</div> : null}
        {children}
      </div>
      {actions ? <div className="velora-page-header-actions">{actions}</div> : null}
    </div>
  );
}
