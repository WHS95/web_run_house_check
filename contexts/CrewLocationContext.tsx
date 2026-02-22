"use client";

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { 
  CrewLocationState, 
  CrewLocationAction, 
  CrewLocation, 
  CrewLocationStateSchema 
} from '@/lib/validators/crewLocationSchema';

// 초기 상태
const initialState: CrewLocationState = {
  locations: [],
  selectedLocation: null,
  loading: false,
  error: null,
};

// Reducer 함수
function crewLocationReducer(
  state: CrewLocationState, 
  action: CrewLocationAction
): CrewLocationState {
  try {
    switch (action.type) {
      case 'SET_LOCATIONS':
        return {
          ...state,
          locations: action.payload,
          error: null,
        };

      case 'ADD_LOCATION':
        return {
          ...state,
          locations: [...state.locations, action.payload],
          error: null,
        };

      case 'UPDATE_LOCATION':
        return {
          ...state,
          locations: state.locations.map(location =>
            location.id === action.payload.id ? action.payload : location
          ),
          selectedLocation: 
            state.selectedLocation?.id === action.payload.id 
              ? action.payload 
              : state.selectedLocation,
          error: null,
        };

      case 'DELETE_LOCATION':
        return {
          ...state,
          locations: state.locations.filter(location => location.id !== action.payload),
          selectedLocation: 
            state.selectedLocation?.id === action.payload 
              ? null 
              : state.selectedLocation,
          error: null,
        };

      case 'SET_SELECTED_LOCATION':
        return {
          ...state,
          selectedLocation: action.payload,
        };

      case 'SET_LOADING':
        return {
          ...state,
          loading: action.payload,
        };

      case 'SET_ERROR':
        return {
          ...state,
          error: action.payload,
          loading: false,
        };

      default:
        return state;
    }
  } catch (error) {
    console.error('CrewLocationReducer Error:', error);
    return {
      ...state,
      error: 'State update failed',
      loading: false,
    };
  }
}

// Context 타입
interface CrewLocationContextType {
  state: CrewLocationState;
  actions: {
    setLocations: (locations: CrewLocation[]) => void;
    addLocation: (location: CrewLocation) => void;
    updateLocation: (location: CrewLocation) => void;
    deleteLocation: (locationId: number) => void;
    setSelectedLocation: (location: CrewLocation | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    resetState: () => void;
  };
}

// Context 생성
const CrewLocationContext = createContext<CrewLocationContextType | null>(null);

// Provider Props
interface CrewLocationProviderProps {
  children: ReactNode;
  initialLocations?: CrewLocation[];
}

// Provider 컴포넌트
export function CrewLocationProvider({ 
  children, 
  initialLocations = [] 
}: CrewLocationProviderProps) {
  const [state, dispatch] = useReducer(crewLocationReducer, {
    ...initialState,
    locations: initialLocations,
  });

  // 액션 함수들
  const actions = {
    setLocations: useCallback((locations: CrewLocation[]) => {
      // Zod 검증
      try {
        const validatedLocations = locations.map(loc => CrewLocationStateSchema.parse({
          locations: [loc],
          selectedLocation: null,
          loading: false,
          error: null
        }).locations[0]);
        
        dispatch({ 
          type: 'SET_LOCATIONS', 
          payload: validatedLocations 
        });
      } catch (error) {
        console.error('Invalid locations data:', error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: 'Invalid location data format' 
        });
      }
    }, []),

    addLocation: useCallback((location: CrewLocation) => {
      dispatch({ type: 'ADD_LOCATION', payload: location });
    }, []),

    updateLocation: useCallback((location: CrewLocation) => {
      dispatch({ type: 'UPDATE_LOCATION', payload: location });
    }, []),

    deleteLocation: useCallback((locationId: number) => {
      dispatch({ type: 'DELETE_LOCATION', payload: locationId });
    }, []),

    setSelectedLocation: useCallback((location: CrewLocation | null) => {
      dispatch({ type: 'SET_SELECTED_LOCATION', payload: location });
    }, []),

    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    }, []),

    setError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    }, []),

    resetState: useCallback(() => {
      dispatch({ type: 'SET_LOCATIONS', payload: initialLocations });
      dispatch({ type: 'SET_SELECTED_LOCATION', payload: null });
      dispatch({ type: 'SET_ERROR', payload: null });
    }, [initialLocations]),
  };

  const contextValue: CrewLocationContextType = {
    state,
    actions,
  };

  return (
    <CrewLocationContext.Provider value={contextValue}>
      {children}
    </CrewLocationContext.Provider>
  );
}

// Hook for using the context
export function useCrewLocationContext() {
  const context = useContext(CrewLocationContext);
  if (!context) {
    throw new Error('useCrewLocationContext must be used within a CrewLocationProvider');
  }
  return context;
}