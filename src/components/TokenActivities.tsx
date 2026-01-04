import { useTokenActivities } from '../hooks/useMovementIndexer';
import { formatIndexerTimestamp } from '@/lib/timestampUtils';

interface TokenActivitiesProps {
  address?: string;
}

export const TokenActivities = ({ address }: TokenActivitiesProps) => {
  const { activities, loading, error, refetch } = useTokenActivities(address || null, 20);

  if (!address) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600">Connect wallet to view activities</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-gray-600">Loading activities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-600">Error loading activities: {error.message}</p>
        <button
          onClick={refetch}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const formatAmount = (amount: string) => {
    return (parseInt(amount) / 100000000).toFixed(8);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Recent Activities</h2>
        <button
          onClick={refetch}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
      
      {activities.length === 0 ? (
        <p className="text-gray-600">No activities found</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  {activity.type.split('::').pop()}
                </span>
                <span className="text-xs text-gray-500">
                  {formatIndexerTimestamp(activity.transaction_timestamp)}
                </span>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">{formatAmount(activity.amount)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Owner:</span>
                  <span className="font-mono text-xs">
                    {activity.owner_address.slice(0, 6)}...{activity.owner_address.slice(-4)}
                  </span>
                </div>
                
                {activity.entry_function_id_str && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500 break-all">
                      {activity.entry_function_id_str}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
