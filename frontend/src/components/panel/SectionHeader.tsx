import type { ReactNode } from 'react';
import './SectionHeader.css';

type SectionHeaderProps = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
};

export function SectionHeader({ title, description, actions }: SectionHeaderProps) {
  return (
    <div className="velora-section-header">
      <div className="velora-section-header-copy">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="velora-section-header-actions">{actions}</div> : null}
    </div>
  );
}
