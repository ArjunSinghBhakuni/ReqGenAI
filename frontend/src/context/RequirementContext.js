import React, { createContext, useContext, useReducer, useEffect } from "react";
import { requirementAPI } from "../services/api";

const RequirementContext = createContext();

// Action types
const ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  SET_REQUIREMENTS: "SET_REQUIREMENTS",
  ADD_REQUIREMENT: "ADD_REQUIREMENT",
  UPDATE_REQUIREMENT: "UPDATE_REQUIREMENT",
  SET_SELECTED_REQUIREMENT: "SET_SELECTED_REQUIREMENT",
  SET_DOCUMENTS: "SET_DOCUMENTS",
  ADD_DOCUMENT: "ADD_DOCUMENT",
  SET_PAGINATION: "SET_PAGINATION",
};

// Initial state
const initialState = {
  requirements: [],
  selectedRequirement: null,
  documents: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

// Reducer
function requirementReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case ACTIONS.SET_REQUIREMENTS:
      return {
        ...state,
        requirements: action.payload.requirements,
        pagination: action.payload.pagination,
        loading: false,
        error: null,
      };

    case ACTIONS.ADD_REQUIREMENT:
      return {
        ...state,
        requirements: [action.payload, ...state.requirements],
        loading: false,
        error: null,
      };

    case ACTIONS.UPDATE_REQUIREMENT:
      return {
        ...state,
        requirements: state.requirements.map((req) =>
          req.project_id === action.payload.project_id ? action.payload : req
        ),
        selectedRequirement:
          state.selectedRequirement?.project_id === action.payload.project_id
            ? action.payload
            : state.selectedRequirement,
      };

    case ACTIONS.SET_SELECTED_REQUIREMENT:
      return { ...state, selectedRequirement: action.payload };

    case ACTIONS.SET_DOCUMENTS:
      return { ...state, documents: action.payload };

    case ACTIONS.ADD_DOCUMENT:
      return { ...state, documents: [...state.documents, action.payload] };

    default:
      return state;
  }
}

// Provider component
export function RequirementProvider({ children }) {
  const [state, dispatch] = useReducer(requirementReducer, initialState);

  // Load requirements
  const loadRequirements = async (page = 1, limit = 10, status = null) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      const response = await requirementAPI.getAll(page, limit, status);

      if (response.data.success) {
        dispatch({
          type: ACTIONS.SET_REQUIREMENTS,
          payload: {
            requirements: response.data.projects,
            pagination: response.data.pagination,
          },
        });
      } else {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: "Failed to load requirements",
        });
      }
    } catch (error) {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: error.response?.data?.message || "Failed to load requirements",
      });
    }
  };

  // Create new requirement
  const createRequirement = async (data) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });

      let response;
      switch (data.source) {
        case "manual":
          response = await requirementAPI.createManual(data.content);
          break;
        case "transcript":
          response = await requirementAPI.createTranscript(
            data.content,
            data.sourceDetail
          );
          break;
        case "file":
          response = await requirementAPI.createFile(
            data.sourceDetail, // filename
            data.content // text
          );
          break;
        default:
          throw new Error("Invalid requirement type");
      }

      if (response.data.success) {
        // Reload requirements to get the updated list
        await loadRequirements();
        return response.data;
      } else {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: "Failed to create requirement",
        });
        return null;
      }
    } catch (error) {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload:
          error.response?.data?.message || "Failed to create requirement",
      });
      return null;
    }
  };

  // Load requirement details
  const loadRequirementDetails = async (reqId) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      const response = await requirementAPI.getById(reqId);

      if (response.data.success) {
        dispatch({
          type: ACTIONS.SET_SELECTED_REQUIREMENT,
          payload: response.data.project,
        });
        dispatch({
          type: ACTIONS.SET_DOCUMENTS,
          payload: response.data.documents,
        });
        return response.data;
      } else {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: "Failed to load requirement details",
        });
        return null;
      }
    } catch (error) {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload:
          error.response?.data?.message || "Failed to load requirement details",
      });
      return null;
    }
  };

  // Load document content
  const loadDocument = async (reqId, documentId) => {
    try {
      const response = await requirementAPI.getDocument(reqId, documentId);
      return response.data.success ? response.data.document : null;
    } catch (error) {
      console.error("Failed to load document:", error);
      return null;
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });
  };

  // Load requirements on mount
  useEffect(() => {
    loadRequirements();
  }, []);

  const value = {
    ...state,
    loadRequirements,
    createRequirement,
    loadRequirementDetails,
    loadDocument,
    clearError,
  };

  return (
    <RequirementContext.Provider value={value}>
      {children}
    </RequirementContext.Provider>
  );
}

// Custom hook to use the context
export function useRequirement() {
  const context = useContext(RequirementContext);
  if (!context) {
    throw new Error("useRequirement must be used within a RequirementProvider");
  }
  return context;
}
