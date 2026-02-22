"use client";

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { 
  CrewMemberState, 
  CrewMemberAction, 
  CrewMember,
  CrewMemberStateSchema 
} from '@/lib/validators/crewMemberSchema';

// 초기 상태
const initialState: CrewMemberState = {
  members: [],
  selectedMember: null,
  loading: false,
  error: null,
  searchTerm: "",
  sortBy: "name",
  sortOrder: "asc",
};

// Reducer 함수
function crewMemberReducer(
  state: CrewMemberState, 
  action: CrewMemberAction
): CrewMemberState {
  try {
    switch (action.type) {
      case 'SET_MEMBERS':
        return {
          ...state,
          members: action.payload,
          error: null,
        };

      case 'UPDATE_MEMBER':
        return {
          ...state,
          members: state.members.map(member =>
            member.id === action.payload.id ? action.payload : member
          ),
          selectedMember: 
            state.selectedMember?.id === action.payload.id 
              ? action.payload 
              : state.selectedMember,
          error: null,
        };

      case 'REMOVE_MEMBER':
        return {
          ...state,
          members: state.members.filter(member => member.id !== action.payload),
          selectedMember: 
            state.selectedMember?.id === action.payload 
              ? null 
              : state.selectedMember,
          error: null,
        };

      case 'SET_SELECTED_MEMBER':
        return {
          ...state,
          selectedMember: action.payload,
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

      case 'SET_SEARCH_TERM':
        return {
          ...state,
          searchTerm: action.payload,
        };

      case 'SET_SORT':
        return {
          ...state,
          sortBy: action.payload.sortBy,
          sortOrder: action.payload.sortOrder,
        };

      default:
        return state;
    }
  } catch (error) {
    console.error('CrewMemberReducer Error:', error);
    return {
      ...state,
      error: 'State update failed',
      loading: false,
    };
  }
}

// Context 타입
interface CrewMemberContextType {
  state: CrewMemberState;
  actions: {
    setMembers: (members: CrewMember[]) => void;
    updateMember: (member: CrewMember) => void;
    removeMember: (memberId: string) => void;
    setSelectedMember: (member: CrewMember | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setSearchTerm: (term: string) => void;
    setSort: (sortBy: CrewMemberState['sortBy'], sortOrder: CrewMemberState['sortOrder']) => void;
    resetState: () => void;
  };
}

// Context 생성
const CrewMemberContext = createContext<CrewMemberContextType | null>(null);

// Provider Props
interface CrewMemberProviderProps {
  children: ReactNode;
  initialMembers?: CrewMember[];
}

// Provider 컴포넌트
export function CrewMemberProvider({ 
  children, 
  initialMembers = [] 
}: CrewMemberProviderProps) {
  const [state, dispatch] = useReducer(crewMemberReducer, {
    ...initialState,
    members: initialMembers,
  });

  // 액션 함수들
  const actions = {
    setMembers: useCallback((members: CrewMember[]) => {
      dispatch({ type: 'SET_MEMBERS', payload: members });
    }, []),

    updateMember: useCallback((member: CrewMember) => {
      dispatch({ type: 'UPDATE_MEMBER', payload: member });
    }, []),

    removeMember: useCallback((memberId: string) => {
      dispatch({ type: 'REMOVE_MEMBER', payload: memberId });
    }, []),

    setSelectedMember: useCallback((member: CrewMember | null) => {
      dispatch({ type: 'SET_SELECTED_MEMBER', payload: member });
    }, []),

    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    }, []),

    setError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    }, []),

    setSearchTerm: useCallback((term: string) => {
      dispatch({ type: 'SET_SEARCH_TERM', payload: term });
    }, []),

    setSort: useCallback((sortBy: CrewMemberState['sortBy'], sortOrder: CrewMemberState['sortOrder']) => {
      dispatch({ type: 'SET_SORT', payload: { sortBy, sortOrder } });
    }, []),

    resetState: useCallback(() => {
      dispatch({ type: 'SET_MEMBERS', payload: initialMembers });
      dispatch({ type: 'SET_SELECTED_MEMBER', payload: null });
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_SEARCH_TERM', payload: "" });
    }, [initialMembers]),
  };

  const contextValue: CrewMemberContextType = {
    state,
    actions,
  };

  return (
    <CrewMemberContext.Provider value={contextValue}>
      {children}
    </CrewMemberContext.Provider>
  );
}

// Hook for using the context
export function useCrewMemberContext() {
  const context = useContext(CrewMemberContext);
  if (!context) {
    throw new Error('useCrewMemberContext must be used within a CrewMemberProvider');
  }
  return context;
}