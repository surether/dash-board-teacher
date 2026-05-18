import type { ReactNode } from "react";

interface WidgetStubProps {
  title: string;
  label: string;
  children: ReactNode;
}

export function WidgetStub({ title, label, children }: WidgetStubProps) {
  return (
    <article className="widget-stub">
      <div className="widget-stub__label">{label}</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}
