/**
 * Classroom Join Request API
 * RBAC Refinement: Teacher approval system
 */

import { apiClient } from './client';
import { ApiResponse } from './client';

export interface ClassroomJoinRequest {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
  };
  classId: {
    _id: string;
    grade: string;
    section: string;
    classCode: string;
  };
  teacherId: string;
  qrCode: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requestedAt: string;
  expiresAt: string;
  studentInfo: {
    name: string;
    email: string;
    phone?: string;
    parentName?: string;
    parentPhone?: string;
  };
  notes?: string;
  rejectionReason?: string;
}

export interface ClassroomQR {
  /** Data-URL image from server (preferred for display). */
  qrImage?: string;
  /** Raw QR payload string. */
  qrString?: string;
  /** Legacy alias — some older clients expected this name. */
  qrCode?: string;
  expiresAt: string;
  classId?: string;
  class?: {
    _id?: string;
    grade?: string;
    section?: string;
    classCode?: string;
  };
}

/** Normalize generate-QR payloads so UI can always read qrImage/qrString. */
export function normalizeClassroomQR(data: any): ClassroomQR | null {
  if (!data || typeof data !== 'object') return null;
  const qrImage = data.qrImage || data.qrCodeImage || undefined;
  const qrString = data.qrString || data.qrCode || undefined;
  return {
    qrImage,
    qrString,
    qrCode: qrString,
    expiresAt: data.expiresAt,
    classId: data.classId || data.class?._id,
    class: data.class,
  };
}

export const classroomApi = {
  /**
   * Generate classroom QR code (Teacher/Admin)
   * POST /api/classroom/:classId/qr/generate
   */
  async generateQR(classId: string): Promise<ApiResponse<ClassroomQR>> {
    try {
      console.log(`[ClassroomAPI] Generating QR for class: ${classId}`);
      const response = await apiClient.post<ClassroomQR>(`/classroom/${classId}/qr/generate`, {});
      console.log(`[ClassroomAPI] QR generation response:`, response);
      return {
        ...response,
        data: response.data ? normalizeClassroomQR(response.data) ?? response.data : undefined,
      };
    } catch (error: any) {
      console.error(`[ClassroomAPI] QR generation error:`, error);
      
      // Parse error response for better error messages
      // Error data can be in error.data (from API client) or error.response.data (from fetch)
      const errorData = error.data || error.response?.data;
      const errorCode = error.code || errorData?.code;
      const debug = error.debug || errorData?.debug || {};
      
      if (errorData || errorCode) {
        // Map error codes to user-friendly messages
        const errorMessages: Record<string, string> = {
          'TEACHER_NOT_APPROVED': 'Your account is pending approval. Please contact your administrator.',
          'TEACHER_NO_INSTITUTION': 'You must be assigned to a school/institution by an admin.',
          'TEACHER_DEACTIVATED': 'Your account has been deactivated. Please contact your administrator.',
          'INSUFFICIENT_PERMISSIONS': `Insufficient permissions. Your role '${debug.userRole || 'unknown'}' is not allowed. Required: ${debug.allowedRoles?.join(' or ') || 'teacher or admin'}`,
          'ROLE_NOT_FOUND': 'User role not found. Please log out and log back in.'
        };
        
        const message = errorMessages[errorCode] || errorData?.message || error.message || 'Failed to generate QR code';
        
        // Create a new error with the user-friendly message
        const friendlyError = new Error(message);
        (friendlyError as any).code = errorCode;
        (friendlyError as any).debug = debug;
        throw friendlyError;
      }
      
      throw error;
    }
  },

  /**
   * Get pending join requests for a class (Teacher/Admin)
   */
  async getPendingRequests(classId: string): Promise<ApiResponse<{ requests: ClassroomJoinRequest[] }>> {
    return apiClient.get(`/classroom/${classId}/join-requests`);
  },

  /**
   * Approve a join request (Teacher/Admin)
   */
  async approveRequest(requestId: string, notes?: string): Promise<ApiResponse> {
    return apiClient.post(`/classroom/join-requests/${requestId}/approve`, { notes });
  },

  /**
   * Reject a join request (Teacher/Admin)
   */
  async rejectRequest(requestId: string, reason?: string): Promise<ApiResponse> {
    return apiClient.post(`/classroom/join-requests/${requestId}/reject`, { reason });
  },

  /**
   * Expire classroom QR code (Teacher/Admin)
   */
  async expireQR(classId: string): Promise<ApiResponse> {
    return apiClient.post(`/classroom/${classId}/qr/expire`, {});
  },
};

