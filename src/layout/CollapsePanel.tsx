import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsePanelProps {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsePanel({
  title,
  summary,
  defaultOpen = false,
  children,
}: CollapsePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="collapse-panel" data-open={isOpen}>
      <button
        type="button"
        className="collapse-panel__trigger"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>
          <strong>{title}</strong>
          {summary ? <small>{summary}</small> : null}
        </span>
        <ChevronDown size={18} className="collapse-panel__icon" />
      </button>
      {isOpen ? <div className="collapse-panel__content">{children}</div> : null}
    </section>
  );
}
