import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const InspectionContext = createContext(null);

const initialState = {
  cedula: '',
  nombre: '',
  apellidos: '',
  placa: '',
  vehicle_type: null,
  sections: [],
  answers: {},
  photos: {},
  photo_configs: [],
  photos_required: false,
  photos_pending: false,
  is_first_registration: false,
  inspection_status: null,
};

export function InspectionProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const saved = sessionStorage.getItem('inspection_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        delete parsed.photos;
        return { ...initialState, ...parsed };
      }
    } catch {}
    return initialState;
  });

  useEffect(() => {
    const { photos, ...rest } = state;
    sessionStorage.setItem('inspection_draft', JSON.stringify(rest));
  }, [state]);

  const updateIdentification = useCallback((data) => {
    setState((prev) => ({ ...prev, ...data }));
  }, []);

  const updateStatus = useCallback((statusResponse) => {
    setState((prev) => ({
      ...prev,
      photos_required: statusResponse.photos_required,
      photos_pending: statusResponse.photos_pending_from_previous_days,
      is_first_registration: statusResponse.is_first_registration,
      photo_configs: statusResponse.photo_config || [],
      inspection_status: statusResponse,
    }));
  }, []);

  const updateSections = useCallback((sections) => {
    setState((prev) => ({ ...prev, sections }));
  }, []);

  const setAnswer = useCallback((questionId, value) => {
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value },
    }));
  }, []);

  const setPhoto = useCallback((configId, file) => {
    setState((prev) => ({
      ...prev,
      photos: { ...prev.photos, [configId]: file },
    }));
  }, []);

  const removePhoto = useCallback((configId) => {
    setState((prev) => {
      const photos = { ...prev.photos };
      delete photos[configId];
      return { ...prev, photos };
    });
  }, []);

  const reset = useCallback(() => {
    sessionStorage.removeItem('inspection_draft');
    setState(initialState);
  }, []);

  return (
    <InspectionContext.Provider
      value={{
        state,
        updateIdentification,
        updateStatus,
        updateSections,
        setAnswer,
        setPhoto,
        removePhoto,
        reset,
      }}
    >
      {children}
    </InspectionContext.Provider>
  );
}

export function useInspection() {
  const ctx = useContext(InspectionContext);
  if (!ctx) throw new Error('useInspection must be used within InspectionProvider');
  return ctx;
}
