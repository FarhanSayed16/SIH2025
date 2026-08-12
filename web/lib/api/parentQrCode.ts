/**
 * Parent QR Code API client
 * Phase 4: Parent-Teacher-Student Linkage
 */

import { apiClient, ApiResponse } from './client';

export interface ParentQRCode {
  _id: string;
  parentId: string;
  studentId: string;
  relationshipId: string;
  qrCodeHash: string;
  qrCodeSecret: string;
  expiresAt: string;
  generatedBy: string;
  scannedBy?: string;
  scanCount: number;
  lastScannedAt?: string;
  isActive: boolean;
  status: 'active' | 'expired' | 'revoked';
  type: 'parent_request' | 'teacher_generated' | 'admin_generated';
  createdAt: string;
  updatedAt: string;
}

export interface QRCodeVerificationResult {
  success: boolean;
  verified: boolean;
  parent: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    parentProfile?: any;
  };
  student: {
    _id: string;
    name: string;
    email: string;
    grade?: string;
    section?: string;
  };
  relationship: {
    _id: string;
    relationship: string;
    isPrimary: boolean;
    verified: boolean;
  };
  qrCode: ParentQRCode;
  scannedAt: string;
  scannedBy: string;
}

export interface GenerateQRCodeRequest {
  parentId: string;
  studentId: string;
  type?: 'parent_request' | 'teacher_generated' | 'admin_generated';
}

export interface VerifyQRCodeRequest {
  qrCodeData: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export const parentQrCodeApi = {
  /**
   * Generate a parent QR code
   * POST /api/qr/parent/generate
   */
  async generate(
    data: GenerateQRCodeRequest
  ): Promise<ApiResponse<{ qrCode: ParentQRCode; qrCodeImage: string }>> {
    return apiClient.post<{ qrCode: ParentQRCode; qrCodeImage: string }>(
      '/qr/parent/generate',
      data
    );
  },

  /**
   * Verify a QR code (teacher scan)
   * POST /api/qr/parent/verify
   */
  async verify(
    data: VerifyQRCodeRequest
  ): Promise<ApiResponse<QRCodeVerificationResult>> {
    return apiClient.post<QRCodeVerificationResult>('/qr/parent/verify', data);
  },

  /**
   * Refresh a QR code
   * POST /api/qr/parent/:qrCodeId/refresh
   */
  async refresh(
    qrCodeId: string
  ): Promise<ApiResponse<{ qrCode: ParentQRCode; qrCodeImage: string }>> {
    return apiClient.post<{ qrCode: ParentQRCode; qrCodeImage: string }>(
      `/qr/parent/${qrCodeId}/refresh`
    );
  },

  /**
   * Get QR codes for a student's parents
   * GET /api/qr/parent/student/:studentId
   */
  async getStudentQRCodes(
    studentId: string
  ): Promise<ApiResponse<{ qrCodes: ParentQRCode[] }>> {
    return apiClient.get<{ qrCodes: ParentQRCode[] }>(
      `/qr/parent/student/${studentId}`
    );
  },

  /**
   * Get all QR codes for authenticated parent
   * GET /api/qr/parent/qr-codes
   */
  async getParentQRCodes(): Promise<ApiResponse<{ qrCodes: ParentQRCode[] }>> {
    return apiClient.get<{ qrCodes: ParentQRCode[] }>('/qr/parent/qr-codes');
  },

  /**
   * Get QR code for a specific child
   * GET /api/parent/qr-code/:studentId
   */
  async getChildQRCode(
    studentId: string
  ): Promise<ApiResponse<{ qrCode: ParentQRCode; qrCodeImage: string }>> {
    return apiClient.get<{ qrCode: ParentQRCode; qrCodeImage: string }>(
      `/parent/qr-code/${studentId}`
    );
  },

  /**
   * Get QR code details
   * GET /api/qr/parent/:qrCodeId
   */
  async getDetails(
    qrCodeId: string
  ): Promise<ApiResponse<{ qrCode: ParentQRCode; qrCodeImage: string }>> {
    return apiClient.get<{ qrCode: ParentQRCode; qrCodeImage: string }>(
      `/qr/parent/${qrCodeId}`
    );
  },
};

