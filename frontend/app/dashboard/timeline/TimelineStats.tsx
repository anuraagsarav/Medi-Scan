import { ResponsivePie } from '@nivo/pie';
import { format } from 'date-fns';

interface TimelineStatsProps {
  stats: {
    stats: Array<{
      _id: {
        eventType: string;
        severity: string;
      };
      count: number;
    }>;
    medications: Array<{
      _id: string;
      occurrences: number;
      lastPrescribed: string;
    }>;
  };
  showOnlyChart?: boolean;
  showOnlyMedications?: boolean;
}

export default function TimelineStats({ stats, showOnlyChart, showOnlyMedications }: TimelineStatsProps) {
  // Process event type data for pie chart
  const eventTypeData = (stats?.stats || []).reduce((acc: any[], curr) => {
    const existingType = acc.find(item => item.id === curr._id.eventType);
    if (existingType) {
      existingType.value += curr.count;
    } else {
      acc.push({
        id: curr._id.eventType,
        label: curr._id.eventType,
        value: curr.count
      });
    }
    return acc;
  }, []);

  // Process severity data
  const severityData = (stats?.stats || []).reduce((acc: Record<string, number>, curr) => {
    const severity = curr._id.severity;
    acc[severity] = (acc[severity] || 0) + curr.count;
    return acc;
  }, {});

  // Process medications data
  const medicationsData = (stats?.medications || [])
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 5);

  const totalEvents = eventTypeData.reduce((sum, item) => sum + item.value, 0);

  if (!stats || (!showOnlyChart && !showOnlyMedications && !eventTypeData.length)) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-6 shadow-sm">
        <p className="text-slate-700 text-center font-medium">No statistics available</p>
      </div>
    );
  }

  return (
    <>
      {(!showOnlyMedications && eventTypeData.length > 0) && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-slate-900">Event Type Distribution</h3>
          <div className="h-[300px]">
            <ResponsivePie
              data={eventTypeData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              colors={{ scheme: 'nivo' }}
              borderWidth={1}
              borderColor={{ theme: 'background' }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#334155"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor="#334155"
              theme={{
                background: 'transparent',
                textColor: '#334155',
                fontSize: 13,
                labels: {
                  text: {
                    fontSize: 13,
                    fill: '#334155',
                    fontWeight: 500
                  }
                }
              }}
            />
          </div>
          <div className="mt-4 space-y-2">
            {Object.entries(severityData).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-800">{severity}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${(count / totalEvents) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{Math.round((count / totalEvents) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!showOnlyChart && medicationsData.length > 0) && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-slate-900">Recent Medications</h3>
          <div className="space-y-4">
            {medicationsData.map((med) => (
              <div
                key={med._id}
                className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-slate-800">{med._id}</h4>
                  <span className="text-sm font-medium text-slate-700">
                    {format(new Date(med.lastPrescribed), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{
                        width: `${(med.occurrences / Math.max(...medicationsData.map(m => m.occurrences))) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-700 min-w-[3ch]">{med.occurrences}x</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
} 