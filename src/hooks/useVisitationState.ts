import { useState, useEffect } from 'react';
import { VisitationRecord, ProgressLogNote } from '../types';

export const defaultVisitations: VisitationRecord[] = [];

export const defaultProgressNotes: ProgressLogNote[] = [];

export function useVisitationState() {
  const [visitationRecords, setVisitationRecords] = useState<VisitationRecord[]>(() => {
    const saved = localStorage.getItem('clinic_visitation_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return defaultVisitations;
  });

  const [progressNotes, setProgressNotes] = useState<ProgressLogNote[]>(() => {
    const saved = localStorage.getItem('clinic_progress_notes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return defaultProgressNotes;
  });

  const [isLoading, setIsLoading] = useState(true);

  // Initialize visitation records
  useEffect(() => {
    async function loadVisitations() {
      try {
        const res = await fetch('/api/visitations');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setVisitationRecords(data);
            localStorage.setItem('clinic_visitation_records', JSON.stringify(data));
          } else {
            const currentList = visitationRecords.length > 0 ? visitationRecords : defaultVisitations;
            setVisitationRecords(currentList);
            localStorage.setItem('clinic_visitation_records', JSON.stringify(currentList));
            await fetch('/api/visitations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(currentList)
            });
          }
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        console.warn('Failed to load visitations from API, using local storage fallback:', err);
        const saved = localStorage.getItem('clinic_visitation_records');
        if (saved) {
          setVisitationRecords(JSON.parse(saved));
        }
      }
    }

    async function loadProgressNotes() {
      try {
        const res = await fetch('/api/progress-notes');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setProgressNotes(data);
            localStorage.setItem('clinic_progress_notes', JSON.stringify(data));
          } else {
            const currentList = progressNotes.length > 0 ? progressNotes : defaultProgressNotes;
            setProgressNotes(currentList);
            localStorage.setItem('clinic_progress_notes', JSON.stringify(currentList));
            await fetch('/api/progress-notes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(currentList)
            });
          }
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        console.warn('Failed to load progress notes from API, using local storage fallback:', err);
        const saved = localStorage.getItem('clinic_progress_notes');
        if (saved) {
          setProgressNotes(JSON.parse(saved));
        }
      }
    }

    async function init() {
      setIsLoading(true);
      await Promise.all([loadVisitations(), loadProgressNotes()]);
      setIsLoading(false);
    }
    init();
  }, []);

  // Persist every change (including ones made via the raw setters) once the initial load is done
  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('clinic_visitation_records', JSON.stringify(visitationRecords));
    fetch('/api/visitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visitationRecords)
    }).catch(e => console.warn('Failed to persist visitations to Express API server:', e));
  }, [visitationRecords, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('clinic_progress_notes', JSON.stringify(progressNotes));
    fetch('/api/progress-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progressNotes)
    }).catch(e => console.warn('Failed to persist progress notes to Express API server:', e));
  }, [progressNotes, isLoading]);

  const syncVisitationsList = async (updatedList: VisitationRecord[]) => {
    setVisitationRecords(updatedList);
    localStorage.setItem('clinic_visitation_records', JSON.stringify(updatedList));
    try {
      await fetch('/api/visitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedList)
      });
    } catch (e) {
      console.warn('Failed to sync visitations to Express API:', e);
    }
  };

  const syncProgressNotesList = async (updatedList: ProgressLogNote[]) => {
    setProgressNotes(updatedList);
    localStorage.setItem('clinic_progress_notes', JSON.stringify(updatedList));
    try {
      await fetch('/api/progress-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedList)
      });
    } catch (e) {
      console.warn('Failed to sync progress notes to Express API:', e);
    }
  };

  const addVisitation = async (record: VisitationRecord) => {
    const updated = [record, ...visitationRecords];
    await syncVisitationsList(updated);
  };

  const deleteVisitation = async (id: string) => {
    const updated = visitationRecords.filter(v => v.id !== id);
    await syncVisitationsList(updated);
  };

  const addProgressNote = async (note: ProgressLogNote) => {
    const updated = [note, ...progressNotes];
    await syncProgressNotesList(updated);
  };

  const updateProgressNotes = (
    updater: ProgressLogNote[] | ((prev: ProgressLogNote[]) => ProgressLogNote[])
  ) => {
    setProgressNotes(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('clinic_progress_notes', JSON.stringify(next));
      fetch('/api/progress-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next)
      }).catch(e => console.warn('Failed to sync progress notes to Express API:', e));
      return next;
    });
  };

  return {
    visitationRecords,
    setVisitationRecords,
    addVisitation,
    deleteVisitation,
    progressNotes,
    setProgressNotes,
    addProgressNote,
    updateProgressNotes,
    isLoading
  };
}
