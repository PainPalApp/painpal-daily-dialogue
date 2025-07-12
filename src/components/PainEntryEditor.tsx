import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Edit3, Save, X, Plus, Trash2, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface PainEntry {
  id: number;
  date: string;
  timestamp: string;
  painLevel: number | null;
  location: string[];
  triggers: string[];
  medications: any[];
  notes: string;
  symptoms: string[];
  status: string;
}

interface PainEntryEditorProps {
  entries: PainEntry[];
  onUpdate: (entries: PainEntry[]) => void;
}

export function PainEntryEditor({ entries, onUpdate }: PainEntryEditorProps) {
  const [editingEntry, setEditingEntry] = useState<PainEntry | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const todayEntries = entries.filter(entry => {
    const today = new Date().toISOString().split('T')[0];
    return entry.date === today;
  }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const handleEdit = (entry: PainEntry) => {
    setEditingEntry({ ...entry });
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!editingEntry) return;
    
    const updatedEntries = entries.map(entry => 
      entry.id === editingEntry.id ? editingEntry : entry
    );
    
    onUpdate(updatedEntries);
    localStorage.setItem('painTrackingData', JSON.stringify(updatedEntries));
    window.dispatchEvent(new CustomEvent('painDataUpdated'));
    
    setEditingEntry(null);
    setIsOpen(false);
  };

  const handleDelete = (entryId: number) => {
    const updatedEntries = entries.filter(entry => entry.id !== entryId);
    onUpdate(updatedEntries);
    localStorage.setItem('painTrackingData', JSON.stringify(updatedEntries));
    window.dispatchEvent(new CustomEvent('painDataUpdated'));
  };

  const addTrigger = (trigger: string) => {
    if (!editingEntry || editingEntry.triggers.includes(trigger)) return;
    setEditingEntry({
      ...editingEntry,
      triggers: [...editingEntry.triggers, trigger]
    });
  };

  const removeTrigger = (trigger: string) => {
    if (!editingEntry) return;
    setEditingEntry({
      ...editingEntry,
      triggers: editingEntry.triggers.filter(t => t !== trigger)
    });
  };

  const addLocation = (location: string) => {
    if (!editingEntry || editingEntry.location.includes(location)) return;
    setEditingEntry({
      ...editingEntry,
      location: [...editingEntry.location, location]
    });
  };

  const removeLocation = (location: string) => {
    if (!editingEntry) return;
    setEditingEntry({
      ...editingEntry,
      location: editingEntry.location.filter(l => l !== location)
    });
  };

  const addMedication = (medication: string) => {
    if (!editingEntry) return;
    setEditingEntry({
      ...editingEntry,
      medications: [...editingEntry.medications, { name: medication, effective: true }]
    });
  };

  const removeMedication = (index: number) => {
    if (!editingEntry) return;
    setEditingEntry({
      ...editingEntry,
      medications: editingEntry.medications.filter((_, i) => i !== index)
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const commonTriggers = ['stress', 'poor sleep', 'dehydration', 'bright lights', 'screen time', 'diet', 'weather', 'hormones'];
  const commonMedications = ['ibuprofen', 'tylenol', 'aspirin', 'excedrin'];
  const commonLocations = ['forehead', 'temples', 'behind eyes', 'back of head', 'neck', 'shoulders', 'back', 'chest', 'abdomen', 'arms', 'legs', 'jaw', 'joints'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Today's Pain Entries</h3>
        <span className="text-sm text-muted-foreground">
          {todayEntries.length} {todayEntries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <div className="space-y-3">
        {todayEntries.map((entry) => (
          <div key={entry.id} className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{formatTime(entry.timestamp)}</span>
                </div>
                <div className="text-lg font-bold text-destructive">
                  {entry.painLevel}/10
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog open={isOpen && editingEntry?.id === entry.id} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(entry)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Pain Entry</DialogTitle>
                    </DialogHeader>
                    
                    {editingEntry && (
                      <div className="space-y-4">
                        {/* Pain Level */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Pain Level (0-10)</label>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={editingEntry.painLevel || ''}
                            onChange={(e) => setEditingEntry({
                              ...editingEntry,
                              painLevel: parseInt(e.target.value) || null
                            })}
                          />
                        </div>

                        {/* Timestamp */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Time</label>
                          <Input
                            type="datetime-local"
                            value={editingEntry.timestamp.slice(0, 16)}
                            onChange={(e) => setEditingEntry({
                              ...editingEntry,
                              timestamp: new Date(e.target.value).toISOString()
                            })}
                          />
                        </div>

                        {/* Pain Locations */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Pain Locations</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {editingEntry.location.map((location) => (
                              <Badge key={location} variant="secondary" className="cursor-pointer" onClick={() => removeLocation(location)}>
                                {location} <X className="h-3 w-3 ml-1" />
                              </Badge>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {commonLocations.filter(l => !editingEntry.location.includes(l)).map((location) => (
                              <Button key={location} variant="outline" size="sm" onClick={() => addLocation(location)}>
                                <Plus className="h-3 w-3 mr-1" /> {location}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Triggers */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Triggers</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {editingEntry.triggers.map((trigger) => (
                              <Badge key={trigger} variant="secondary" className="cursor-pointer" onClick={() => removeTrigger(trigger)}>
                                {trigger} <X className="h-3 w-3 ml-1" />
                              </Badge>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {commonTriggers.filter(t => !editingEntry.triggers.includes(t)).map((trigger) => (
                              <Button key={trigger} variant="outline" size="sm" onClick={() => addTrigger(trigger)}>
                                <Plus className="h-3 w-3 mr-1" /> {trigger}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Medications */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Medications</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {editingEntry.medications.map((med, index) => (
                              <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeMedication(index)}>
                                {med.name} <X className="h-3 w-3 ml-1" />
                              </Badge>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {commonMedications.filter(m => !editingEntry.medications.some(med => med.name === m)).map((medication) => (
                              <Button key={medication} variant="outline" size="sm" onClick={() => addMedication(medication)}>
                                <Plus className="h-3 w-3 mr-1" /> {medication}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Notes</label>
                          <Textarea
                            value={editingEntry.notes}
                            onChange={(e) => setEditingEntry({
                              ...editingEntry,
                              notes: e.target.value
                            })}
                            placeholder="Additional notes about this pain episode..."
                          />
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleSave} className="flex-1">
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(entry.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Entry Details */}
            <div className="space-y-2 text-sm">
              {entry.location.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-muted-foreground">Locations:</span>
                  {entry.location.map((location) => (
                    <Badge key={location} variant="outline" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      {location}
                    </Badge>
                  ))}
                </div>
              )}
              
              {entry.triggers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-muted-foreground">Triggers:</span>
                  {entry.triggers.map((trigger) => (
                    <Badge key={trigger} variant="outline" className="text-xs">
                      {trigger}
                    </Badge>
                  ))}
                </div>
              )}
              
              {entry.medications.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-muted-foreground">Medications:</span>
                  {entry.medications.map((med, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {med.name} {med.effective ? '✓' : '✗'}
                    </Badge>
                  ))}
                </div>
              )}
              
              {entry.notes && (
                <div>
                  <span className="text-muted-foreground">Notes:</span>
                  <p className="text-foreground mt-1">{entry.notes}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {todayEntries.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No pain entries recorded today
        </div>
      )}
    </div>
  );
}