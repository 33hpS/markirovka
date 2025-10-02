import * as React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  color?: 'green' | 'blue' | 'purple' | 'yellow' | 'gray' | 'red' | 'indigo';
  className?: string;
}

const palette: Record<string, string> = {
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  gray: 'bg-gray-100 text-gray-800',
  red: 'bg-red-100 text-red-800',
  indigo: 'bg-indigo-100 text-indigo-800',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  color = 'gray',
  className,
}) => (
  <span
    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${palette[color]} ${className ?? ''}`.trim()}
  >
    {children}
  </span>
);

export default Badge;
