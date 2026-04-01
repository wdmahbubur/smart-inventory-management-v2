import { useLogs } from '../hooks/index';
import { getLogConfig, formatTimeAgo } from '../utils/index';
import { Spinner } from './ui';

export default function ActivityFeed({ limit = 10 }) {
  const { data: logs, isLoading } = useLogs({ limit });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!logs?.length) {
    return <p className="text-sm text-gray-400 text-center py-6">No activity yet.</p>;
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => {
        const cfg = getLogConfig(log.action_type);
        return (
          <div key={log.id} className="flex items-start gap-3">
            {/* Icon bubble */}
            <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center shrink-0 text-sm`}>
              {cfg.icon}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 leading-snug">{log.message}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-400">{formatTimeAgo(log.created_at)}</span>
                {log.user_name && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{log.user_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
