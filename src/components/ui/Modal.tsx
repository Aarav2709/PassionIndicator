import { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const Modal = ({ title, onClose, children, className }: ModalProps) => {
  const titleId = useId();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-fade-in"
      onMouseDown={e => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn('max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-white/10 bg-black p-6', className)}
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 id={titleId} className="text-base font-medium text-white">
            {title}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close" className="icon-btn -mr-2">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
