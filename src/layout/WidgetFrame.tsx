import type { ReactNode } from "react";
import { GripVertical } from "lucide-react";
import type { WidgetDefinition } from "../types/dashboard";

interface WidgetFrameProps {
  title: string;
  subtitle?: string;
  accent?: WidgetDefinition["accent"];
  actions?: ReactNode;
  children: ReactNode;
}

export function WidgetFrame({
  title,
  subtitle,
  accent = "slate",
  actions,
  children,
}: WidgetFrameProps) {
  return (
    <article className="widget-frame" data-accent={accent}>
      <header className="widget-frame__header">
        <div className="widget-frame__heading">
          <span className="widget-frame__drag-handle" aria-hidden="true">
            <GripVertical size={16} strokeWidth={2.2} />
          </span>
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="widget-frame__actions">{actions}</div> : null}
      </header>
      <div className="widget-frame__body">{children}</div>
    </article>
  );
}
