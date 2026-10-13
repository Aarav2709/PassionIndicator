import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

const Switch = ({ checked, onChange, label }: SwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200', checked ? 'bg-white' : 'bg-white/[0.12]')}
  >
    <span
      className={cn(
        'absolute top-0.5 h-5 w-5 rounded-full transition-all duration-200',
        checked ? 'left-[22px] bg-black' : 'left-0.5 bg-neutral-400'
      )}
    />
  </button>
);

export default Switch;
