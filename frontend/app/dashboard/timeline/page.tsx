'use client';

import { useState, useEffect } from 'react';
import { Chrono } from 'react-chrono';
import { format } from 'date-fns';
import { Building2, Tag, AlertTriangle, Loader2, AlertOctagon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import TimelineFilters from './TimelineFilters';
import TimelineStats from './TimelineStats';

interface TimelineEvent {
  _id: string;
  userId: string;
  fileId: string;
  eventDate: string;
  eventType: string;
  description: string;
  hospital: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  relatedConditions: string[];
  medications: string[];
  createdAt: string;
}

export interface TimelineFiltersProps {
  startDate: Date | null;
  endDate: Date | null;
  selectedType: string;
  selectedSeverity: string;
  selectedHospital: string;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onTypeChange: (type: string) => void;
  onSeverityChange: (severity: string) => void;
  onHospitalChange: (hospital: string) => void;
  availableHospitals: string[];
  isLoading: boolean;
}

interface TimelineItem {
  title: string;
  cardTitle: string;
  cardSubtitle: string;
  cardDetailedText: string;
  eventType: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  medications: string[];
  relatedConditions: string[];
}

interface TimelineStats {
  eventTypeDistribution: Record<string, number>;
  recentMedications: { name: string; count: number }[];
  severityDistribution: Record<string, number>;
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
}

interface TimelineFilters {
  startDate: Date | null;
  endDate: Date | null;
  eventType: string;
  severity: string;
  hospital: string;
}

// Add interface for the timeline response structure
interface TimelineResponse {
  timeline: {
    [year: string]: {
      [month: string]: TimelineEvent[];
    };
  };
}

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [timelineStats, setTimelineStats] = useState<TimelineStats>({
    eventTypeDistribution: {},
    recentMedications: [],
    severityDistribution: {},
    stats: [],
    medications: []
  });
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedSeverity, setSelectedSeverity] = useState('All Severities');
  const [selectedHospital, setSelectedHospital] = useState('All Hospitals');
  const [availableHospitals, setAvailableHospitals] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch hospital folders when component mounts
  useEffect(() => {
    fetchHospitalFolders();
  }, []);

  // Fetch timeline data and stats when filters change
  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchTimelineData(),
        fetchTimelineStats()
      ]);
    };
    fetchData();
  }, [startDate, endDate, selectedType, selectedSeverity, selectedHospital]);

  const fetchHospitalFolders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/files/folders', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const files = await response.json() as Array<{ hospital: string }>;
      // Extract unique hospital names from files
      const hospitals = [...new Set(files.map(file => file.hospital))];
      setAvailableHospitals(hospitals.sort());
    } catch (error) {
      console.error('Error fetching hospital folders:', error);
    }
  };

  const fetchTimelineData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', format(startDate, 'yyyy-MM-dd'));
      if (endDate) queryParams.append('endDate', format(endDate, 'yyyy-MM-dd'));
      if (selectedType !== 'All Types') queryParams.append('eventType', selectedType);
      if (selectedSeverity !== 'All Severities') queryParams.append('severity', selectedSeverity);
      if (selectedHospital !== 'All Hospitals') queryParams.append('hospital', selectedHospital);

      const response = await fetch(`http://localhost:5000/api/timeline/events?${queryParams}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json() as TimelineResponse;
      
      // Extract events from the nested timeline structure
      if (data && data.timeline) {
        // Flatten the grouped events into a single array
        const flattenedEvents = Object.values(data.timeline).reduce((acc: TimelineEvent[], yearEvents) => {
          Object.values(yearEvents).forEach((monthEvents: TimelineEvent[]) => {
            acc.push(...monthEvents);
          });
          return acc;
        }, []);
        
        // Sort events by date in descending order
        const sortedEvents = flattenedEvents.sort((a, b) => 
          new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
        );
        
        setEvents(sortedEvents);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching timeline events:', error instanceof Error ? error.message : String(error));
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimelineStats = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', format(startDate, 'yyyy-MM-dd'));
      if (endDate) params.append('endDate', format(endDate, 'yyyy-MM-dd'));
      if (selectedType !== 'All Types') params.append('eventType', selectedType);
      if (selectedSeverity !== 'All Severities') params.append('severity', selectedSeverity);
      if (selectedHospital !== 'All Hospitals') params.append('hospital', selectedHospital);

      const response = await fetch(`http://localhost:5000/api/timeline/stats?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTimelineStats(data);
    } catch (error) {
      console.error('Error fetching timeline stats:', error);
      setTimelineStats({
        eventTypeDistribution: {},
        recentMedications: [],
        severityDistribution: {},
        stats: [],
        medications: []
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-600';
      case 'High': return 'text-orange-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-slate-900';
    }
  };

  const transformEventsToItems = (events: TimelineEvent[]): TimelineItem[] => {
    if (!Array.isArray(events)) return [];
    
    return events.map(event => ({
      title: format(new Date(event.eventDate), 'MMM d, yyyy'),
      cardTitle: event.eventType,
      cardSubtitle: event.hospital,
      cardDetailedText: event.description,
      eventType: event.eventType,
      severity: event.severity,
      medications: event.medications,
      relatedConditions: event.relatedConditions
    }));
  };

  const timelineItems = transformEventsToItems(events || []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div>
        <h1 className="text-4xl font-bold mb-2 text-white">Medical Timeline</h1>
        <p className="text-white/90">Track and visualize your medical history over time</p>
      </div>

      <TimelineFilters
        startDate={startDate}
        endDate={endDate}
        selectedType={selectedType}
        selectedSeverity={selectedSeverity}
        selectedHospital={selectedHospital}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onTypeChange={setSelectedType}
        onSeverityChange={setSelectedSeverity}
        onHospitalChange={setSelectedHospital}
        availableHospitals={availableHospitals}
        isLoading={isLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-6 min-h-[600px] shadow-sm overflow-y-auto max-h-[800px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Loading timeline events...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600">
              <AlertOctagon className="w-12 h-12 mb-4 text-red-500" />
              <p className="text-red-500">{error}</p>
              <button 
                onClick={() => fetchTimelineData()}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-slate-700"
              >
                Retry
              </button>
            </div>
          ) : events.length > 0 ? (
            <Chrono
              items={timelineItems}
              mode="VERTICAL"
              cardHeight={120}
              theme={{
                primary: '#4f46e5',
                secondary: 'rgba(79, 70, 229, 0.1)',
                cardBgColor: '#ffffff',
                cardForeColor: '#1e293b',
                titleColor: '#1e293b',
                titleColorActive: '#1e293b',
                cardTitleColor: '#1e293b',
                cardSubtitleColor: '#475569',
                cardDetailsColor: '#475569',
              }}
              fontSizes={{
                cardSubtitle: '0.85rem',
                cardText: '0.9rem',
                cardTitle: '1rem',
                title: '1rem',
              }}
              classNames={{
                card: 'timeline-card shadow-sm',
                cardText: 'text-slate-700',
                cardTitle: 'text-slate-900 font-medium',
                cardSubtitle: 'text-slate-600',
                title: 'text-slate-900',
                controls: 'timeline-controls',
                controlButton: 'timeline-control-button',
              }}
              onItemClick={(item: TimelineItem) => {
                const event = events[timelineItems.indexOf(item)];
                if (event) setSelectedEvent(event);
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-black/70">
              <AlertTriangle className="w-12 h-12 mb-4" />
              <p>No events found for the selected filters</p>
              {(startDate || endDate || selectedType !== 'All Types' || selectedSeverity !== 'All Severities' || selectedHospital !== 'All Hospitals') && (
                <button 
                  onClick={() => {
                    setStartDate(null);
                    setEndDate(null);
                    setSelectedType('All Types');
                    setSelectedSeverity('All Severities');
                    setSelectedHospital('All Hospitals');
                  }}
                  className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-black"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-8">
          {timelineStats && !isLoading && <TimelineStats stats={timelineStats} />}
        </div>
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl bg-white backdrop-blur-sm text-slate-900 border-gray-200 shadow-lg">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900">
                  <span className={getSeverityColor(selectedEvent.severity)}>●</span>
                  {selectedEvent.eventType}
                </DialogTitle>
                <DialogDescription>
                  <div className="grid gap-4 mt-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Building2 className="w-4 h-4" />
                      {selectedEvent.hospital}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Tag className="w-4 h-4" />
                      {format(new Date(selectedEvent.eventDate), 'MMMM d, yyyy')}
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2 text-slate-900">Description</h3>
                  <p className="text-slate-700">{selectedEvent.description}</p>
                </div>

                {selectedEvent.medications.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2 text-slate-900">Medications</h3>
                    <div className="grid gap-2">
                      {selectedEvent.medications.map((med, i) => (
                        <div key={i} className="bg-slate-50 px-3 py-2 rounded-lg text-sm text-slate-700">
                          {med}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvent.relatedConditions.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2 text-slate-900">Related Conditions</h3>
                    <div className="grid gap-2">
                      {selectedEvent.relatedConditions.map((condition, i) => (
                        <div key={i} className="bg-slate-50 px-3 py-2 rounded-lg text-sm text-slate-700">
                          {condition}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const timelineStyles = `
  .timeline-controls {
    background: rgba(17, 24, 39, 0.7);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(79, 70, 229, 0.2);
    border-radius: 0.75rem;
    padding: 0.5rem;
    display: flex;
    gap: 0.5rem;
  }

  .timeline-control-button {
    background: rgba(79, 70, 229, 0.1) !important;
    color: white !important;
    border: 1px solid rgba(79, 70, 229, 0.3) !important;
    padding: 0.5rem 1rem !important;
    border-radius: 0.5rem !important;
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    transition: all 0.2s ease-in-out !important;
  }

  .timeline-control-button:hover {
    background: rgba(79, 70, 229, 0.2) !important;
    border-color: rgba(79, 70, 229, 0.5) !important;
    transform: translateY(-1px);
  }

  .timeline-control-button:active {
    transform: translateY(0px);
  }

  /* Style the timeline line and dots */
  .rs-timeline-line {
    background: rgba(79, 70, 229, 0.3) !important;
  }

  .rs-timeline-point {
    background: rgb(79, 70, 229) !important;
    border: 2px solid rgba(79, 70, 229, 0.3) !important;
  }

  /* Scrollbar Styles */
  .scrollbar-thin::-webkit-scrollbar {
    width: 8px;
  }

  .scrollbar-thin::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = timelineStyles;
  document.head.appendChild(style);
} 