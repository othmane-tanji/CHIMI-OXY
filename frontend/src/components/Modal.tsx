'use client';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}

export function Modal({ open, onClose, title, children, wide }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
      <div className={`w-full max-h-[90vh] overflow-y-auto rounded-xl bg-white p-4 sm:p-6 shadow-2xl dark:bg-gray-900 ${wide ? 'max-w-4xl' : 'max-w-lg'}`}>
        <div className="mb-4 flex items-center justify-between border-b pb-3 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
