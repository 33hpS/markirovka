import * as React from 'react';

export interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  children,
  className,
}) => (
  <div
    className={`p-4 rounded-lg border bg-white shadow-sm hover:shadow transition-shadow ${className ?? ''}`.trim()}
  >
    <h3 className='font-semibold mb-2 text-gray-900 text-sm tracking-wide'>
      {title}
    </h3>
    <div className='text-xs text-gray-600 leading-relaxed space-y-1'>
      {children}
    </div>
  </div>
);

export default SectionCard;
