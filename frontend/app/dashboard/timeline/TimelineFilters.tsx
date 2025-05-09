import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimelineFiltersProps {
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

export default function TimelineFilters({
  startDate,
  endDate,
  selectedType,
  selectedSeverity,
  selectedHospital,
  onStartDateChange,
  onEndDateChange,
  onTypeChange,
  onSeverityChange,
  onHospitalChange,
  availableHospitals,
  isLoading
}: TimelineFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-8 p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-black">Start Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`w-[200px] justify-start text-left font-normal ${!startDate ? 'text-gray-500' : 'text-black'}`}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={onStartDateChange}
              initialFocus
              className="text-black"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-black">End Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`w-[200px] justify-start text-left font-normal ${!endDate ? 'text-gray-500' : 'text-black'}`}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={onEndDateChange}
              initialFocus
              className="text-black"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-black">Event Type</label>
        <Select value={selectedType} onValueChange={onTypeChange}>
          <SelectTrigger className="w-[200px] bg-white text-black border-gray-200">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="All Types" className="text-black">All Types</SelectItem>
            <SelectItem value="Diagnosis" className="text-black">Diagnosis</SelectItem>
            <SelectItem value="Treatment" className="text-black">Treatment</SelectItem>
            <SelectItem value="Medication" className="text-black">Medication</SelectItem>
            <SelectItem value="Test" className="text-black">Test</SelectItem>
            <SelectItem value="Surgery" className="text-black">Surgery</SelectItem>
            <SelectItem value="Follow-up" className="text-black">Follow-up</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-black">Severity</label>
        <Select value={selectedSeverity} onValueChange={onSeverityChange}>
          <SelectTrigger className="w-[200px] bg-white text-black border-gray-200">
            <SelectValue placeholder="Select severity" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="All Severities" className="text-black">All Severities</SelectItem>
            <SelectItem value="Critical" className="text-black">Critical</SelectItem>
            <SelectItem value="High" className="text-black">High</SelectItem>
            <SelectItem value="Medium" className="text-black">Medium</SelectItem>
            <SelectItem value="Low" className="text-black">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-black">Hospital</label>
        <Select value={selectedHospital} onValueChange={onHospitalChange}>
          <SelectTrigger className="w-[200px] bg-white text-black border-gray-200">
            <SelectValue placeholder="Select hospital" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="All Hospitals" className="text-black">All Hospitals</SelectItem>
            {availableHospitals.map((hospital) => (
              <SelectItem key={hospital} value={hospital} className="text-black">
                {hospital}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}