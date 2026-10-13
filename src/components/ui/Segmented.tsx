import { cn } from '@/lib/utils';

interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: React.ReactNode }[];
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

function Segmented<T extends string>({ value, options, onChange, label, className }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex rounded-full border border-white/10 p-0.5', className)}>
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
            value === option.value ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default Segmented;
