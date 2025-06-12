import { useEffect, useState } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const ICONS = {
  success: <CheckCircleIcon className="h-5 w-5 text-green-600" />,
  error: <ExclamationCircleIcon className="h-5 w-5 text-red-600" />,
  info: <InformationCircleIcon className="h-5 w-5 text-blue-600" />,
  warning: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />,
};

const COLORS = {
  success: 'bg-green-100 border-green-300 text-green-800',
  error: 'bg-red-100 border-red-300 text-red-800',
  info: 'bg-blue-100 border-blue-300 text-blue-800',
  warning: 'bg-yellow-100 border-yellow-300 text-yellow-800',
};

const Notification = ({ message, type = 'info', duration = 3000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-fade-in">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md border ${COLORS[type]}`}>
        {ICONS[type]}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};

export default Notification;
