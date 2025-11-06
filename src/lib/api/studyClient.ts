/**
 * Study session API client
 * Provides methods for fetching study sessions
 */

import { apiGet } from "./apiClient";
import type { GetStudySessionQuery, GetStudySessionResponse, ApiResponseDTO } from "@/types";

/**
 * Build query string from study session parameters
 */
const buildStudySessionQueryString = (params: GetStudySessionQuery): string => {
  const searchParams = new URLSearchParams();

  if (params.limit !== undefined) {
    searchParams.append("limit", params.limit.toString());
  }

  if (params.source !== undefined) {
    searchParams.append("source", params.source);
  }

  if (params.shuffle !== undefined) {
    searchParams.append("shuffle", params.shuffle.toString());
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

/**
 * Fetch a new study session
 *
 * @param params - Query parameters for filtering and configuration
 * @returns API result with study session data
 */
export const getStudySession = async (params: GetStudySessionQuery = {}) => {
  const queryString = buildStudySessionQueryString(params);
  return apiGet<ApiResponseDTO<GetStudySessionResponse>>(`/api/study/session${queryString}`);
};
