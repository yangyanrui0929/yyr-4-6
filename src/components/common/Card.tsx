import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: string;
}

export default function Card({ children, className = "", title, icon }: CardProps) {
  return (
    <div
      className={`card bg-white/95 backdrop-blur border border-amber-100 ${className}`}
    >
      {(title || icon) && (
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-100">
          {icon && <span className="text-2xl">{icon}</span>}
          {title && (
            <h3 className="font-display text-lg text-kitchen-brown">
              {title}
            </h3>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
