"use client";

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { 
  InviteCodeState, 
  InviteCodeAction, 
  InviteCode,
  InviteCodeStateSchema 
} from '@/lib/validators/inviteCodeSchema';

// 초기 상태
const initialState: InviteCodeState = {
  inviteCodes: [],
  selectedInviteCode: null,
  loading: false,
  error: null,
  isModalOpen: false,
  editingCode: null,
};

// Reducer 함수
function inviteCodeReducer(
  state: InviteCodeState, 
  action: InviteCodeAction
): InviteCodeState {
  try {
    switch (action.type) {
      case 'SET_INVITE_CODES':
        return {
          ...state,
          inviteCodes: action.payload,
          error: null,
        };

      case 'ADD_INVITE_CODE':
        return {
          ...state,
          inviteCodes: [...state.inviteCodes, action.payload],
          error: null,
        };

      case 'UPDATE_INVITE_CODE':
        return {
          ...state,
          inviteCodes: state.inviteCodes.map(code =>
            code.id === action.payload.id ? action.payload : code
          ),
          selectedInviteCode: 
            state.selectedInviteCode?.id === action.payload.id 
              ? action.payload 
              : state.selectedInviteCode,
          error: null,
        };

      case 'DELETE_INVITE_CODE':
        return {
          ...state,
          inviteCodes: state.inviteCodes.filter(code => code.id !== action.payload),
          selectedInviteCode: 
            state.selectedInviteCode?.id === action.payload 
              ? null 
              : state.selectedInviteCode,
          error: null,
        };

      case 'SET_SELECTED_INVITE_CODE':
        return {
          ...state,
          selectedInviteCode: action.payload,
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

      case 'SET_MODAL_OPEN':
        return {
          ...state,
          isModalOpen: action.payload,
        };

      case 'SET_EDITING_CODE':
        return {
          ...state,
          editingCode: action.payload,
        };

      default:
        return state;
    }
  } catch (error) {
    console.error('InviteCodeReducer Error:', error);
    return {
      ...state,
      error: 'State update failed',
      loading: false,
    };
  }
}

// Context 타입
interface InviteCodeContextType {
  state: InviteCodeState;
  actions: {
    setInviteCodes: (codes: InviteCode[]) => void;
    addInviteCode: (code: InviteCode) => void;
    updateInviteCode: (code: InviteCode) => void;
    deleteInviteCode: (codeId: number) => void;
    setSelectedInviteCode: (code: InviteCode | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setModalOpen: (open: boolean) => void;
    setEditingCode: (code: InviteCode | null) => void;
    resetState: () => void;
  };
}

// Context 생성
const InviteCodeContext = createContext<InviteCodeContextType | null>(null);

// Provider Props
interface InviteCodeProviderProps {
  children: ReactNode;
  initialInviteCodes?: InviteCode[];
}

// Provider 컴포넌트
export function InviteCodeProvider({ 
  children, 
  initialInviteCodes = [] 
}: InviteCodeProviderProps) {
  const [state, dispatch] = useReducer(inviteCodeReducer, {
    ...initialState,
    inviteCodes: initialInviteCodes,
  });

  // 액션 함수들
  const actions = {
    setInviteCodes: useCallback((codes: InviteCode[]) => {
      dispatch({ type: 'SET_INVITE_CODES', payload: codes });
    }, []),

    addInviteCode: useCallback((code: InviteCode) => {
      dispatch({ type: 'ADD_INVITE_CODE', payload: code });
    }, []),

    updateInviteCode: useCallback((code: InviteCode) => {
      dispatch({ type: 'UPDATE_INVITE_CODE', payload: code });
    }, []),

    deleteInviteCode: useCallback((codeId: number) => {
      dispatch({ type: 'DELETE_INVITE_CODE', payload: codeId });
    }, []),

    setSelectedInviteCode: useCallback((code: InviteCode | null) => {
      dispatch({ type: 'SET_SELECTED_INVITE_CODE', payload: code });
    }, []),

    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    }, []),

    setError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    }, []),

    setModalOpen: useCallback((open: boolean) => {
      dispatch({ type: 'SET_MODAL_OPEN', payload: open });
    }, []),

    setEditingCode: useCallback((code: InviteCode | null) => {
      dispatch({ type: 'SET_EDITING_CODE', payload: code });
    }, []),

    resetState: useCallback(() => {
      dispatch({ type: 'SET_INVITE_CODES', payload: initialInviteCodes });
      dispatch({ type: 'SET_SELECTED_INVITE_CODE', payload: null });
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_MODAL_OPEN', payload: false });
      dispatch({ type: 'SET_EDITING_CODE', payload: null });
    }, [initialInviteCodes]),
  };

  const contextValue: InviteCodeContextType = {
    state,
    actions,
  };

  return (
    <InviteCodeContext.Provider value={contextValue}>
      {children}
    </InviteCodeContext.Provider>
  );
}

// Hook for using the context
export function useInviteCodeContext() {
  const context = useContext(InviteCodeContext);
  if (!context) {
    throw new Error('useInviteCodeContext must be used within a InviteCodeProvider');
  }
  return context;
}