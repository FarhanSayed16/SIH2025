'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { classroomApi } from '@/lib/api/classroom';

interface QRData {
  qrCode: string;
  qrBadgeId: string;
  qrImage: string;
  student: {
    id: string;
    name: string;
    grade: string;
    section: string;
  };
}

export default function QRGeneratorPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<any[]>([]);
  const [qrData, setQrData] = useState<QRData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [classroomJoinQR, setClassroomJoinQR] = useState<any>(null); // For classroom join QR code
  const [isGeneratingJoinQR, setIsGeneratingJoinQR] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Ensure API client has token
    if (accessToken) {
      import('@/lib/api/client').then(({ apiClient }) => {
        apiClient.setToken(accessToken);
      });
    }
    
    // Set up API client for classroom API
    if (accessToken) {
      import('@/lib/api/client').then(({ apiClient }) => {
        apiClient.setToken(accessToken);
      });
    }

    loadClasses();
  }, [isAuthenticated, router, accessToken]);

  const loadClasses = async () => {
    setIsLoadingClasses(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/teacher/classes`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Handle different response formats
          if (data.data?.classes) {
            setClasses(data.data.classes);
          } else if (Array.isArray(data.data)) {
            setClasses(data.data);
          } else if (Array.isArray(data.classes)) {
            setClasses(data.classes);
          }
        }
      } else {
        console.error('Failed to load classes:', response.status);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  /**
   * Generate Classroom Join QR Code
   * This QR code allows students to scan and join the class
   * Works even when class has 0 students
   */
  const generateClassroomJoinQR = async () => {
    if (!selectedClass) {
      alert('Please select a class');
      return;
    }

    setIsGeneratingJoinQR(true);
    setClassroomJoinQR(null);
    try {
      const response = await classroomApi.generateQR(selectedClass);
      if (response.success && response.data) {
        setClassroomJoinQR(response.data);
        alert('Classroom join QR code generated successfully! Students can scan this QR code to join your class.');
      } else {
        alert('Failed to generate classroom join QR code: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error generating classroom join QR:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Error generating classroom join QR code: ${errorMessage}`);
      
      // Log debug info if available
      if (error.debug) {
        console.error('Error debug info:', error.debug);
      }
    } finally {
      setIsGeneratingJoinQR(false);
    }
  };

  /**
   * Generate Student Badge QR Codes
   * These are individual QR codes for each student (for printing badges)
   * Requires students to already be in the class
   */
  const generateStudentBadgeQRs = async () => {
    if (!selectedClass) {
      alert('Please select a class');
      return;
    }

    setIsLoading(true);
    setQrData([]); // Clear previous data
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/qr/generate-class/${selectedClass}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('QR generation response:', data);
        
        if (data.success) {
          if (data.data?.qrCodes && Array.isArray(data.data.qrCodes)) {
            const validQRCodes = data.data.qrCodes.filter((qr: any) => !qr.error);
            setQrData(validQRCodes);
            
            if (validQRCodes.length === 0) {
              if (data.data.totalStudents === 0) {
                alert('This class has no students yet. Students need to join the class first (via QR code or class code) before you can generate student badge QR codes.');
              } else {
                alert('No QR codes were generated. Please check if students have valid data.');
              }
            } else {
              alert(`Successfully generated ${validQRCodes.length} student badge QR code(s)!`);
            }
          } else {
            // Handle case where qrCodes is missing or not an array
            if (data.data?.totalStudents === 0) {
              alert('This class has no students yet. Students need to join the class first (via QR code or class code) before you can generate student badge QR codes.');
            } else {
              alert('QR codes generated, but no data was returned. Please try again.');
            }
          }
        } else {
          alert('Failed to generate QR codes: ' + (data.message || 'Unknown error'));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert('Failed to generate QR codes: ' + (errorData.message || 'Server error'));
      }
    } catch (error) {
      console.error('Error generating QR codes:', error);
      alert('Error generating QR codes: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const printBadge = (qr: QRData) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Badge - ${qr.student.name}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                text-align: center;
              }
              .badge {
                border: 2px solid #000;
                padding: 20px;
                margin: 10px;
                display: inline-block;
                width: 300px;
              }
              .badge img {
                width: 200px;
                height: 200px;
                margin: 10px 0;
              }
              .badge h2 {
                margin: 10px 0;
              }
              .badge p {
                margin: 5px 0;
              }
            </style>
          </head>
          <body>
            <div class="badge">
              <h2>Kavach</h2>
              <img src="${qr.qrImage}" alt="QR Code" />
              <h3>${qr.student.name}</h3>
              <p>Grade ${qr.student.grade} - Section ${qr.student.section}</p>
              <p><strong>Badge ID:</strong> ${qr.qrBadgeId}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">QR Code Generator</h1>
            <p className="text-gray-600 mt-2">Generate classroom join QR codes and student badge QR codes</p>
          </div>

          <Card className="p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class
                </label>
                {isLoadingClasses ? (
                  <div className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-center text-gray-500">
                    Loading classes...
                  </div>
                ) : classes.length === 0 ? (
                  <div className="w-full p-2 border border-gray-300 rounded bg-yellow-50 text-center text-yellow-700">
                    No classes found. Please create a class first.
                  </div>
                ) : (
                  <select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setQrData([]); // Clear QR data when class changes
                      setClassroomJoinQR(null); // Clear classroom join QR when class changes
                    }}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="">-- Select a class --</option>
                    {classes.map((classItem) => (
                      <option key={classItem._id} value={classItem._id}>
                        Grade {classItem.grade} - Section {classItem.section} ({classItem.studentIds?.length || 0} students)
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <Button
                  onClick={generateClassroomJoinQR}
                  disabled={!selectedClass || isGeneratingJoinQR || isLoadingClasses}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isGeneratingJoinQR ? 'Generating...' : 'Generate Classroom Join QR Code'}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Students scan this QR code to join your class (works even with 0 students)
                </p>
                <div className="border-t my-2"></div>
                <Button
                  onClick={generateStudentBadgeQRs}
                  disabled={!selectedClass || isLoading || isLoadingClasses}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Generating...' : 'Generate Student Badge QR Codes'}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Generate individual QR badges for each student (requires students to be in class)
                </p>
              </div>
            </div>
          </Card>

          {/* Classroom Join QR Code Display */}
          {classroomJoinQR && (
            <Card className="p-6 mb-6 bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-green-800 mb-2">Classroom Join QR Code</h2>
                  <p className="text-sm text-green-700 mb-2">
                    Students can scan this QR code to join your class
                  </p>
                  {classroomJoinQR.expiresAt && (
                    <p className="text-xs text-green-600">
                      Expires: {new Date(classroomJoinQR.expiresAt).toLocaleString()}
                    </p>
                  )}
                </div>
                {classroomJoinQR.qrImage && (
                  <div className="ml-4">
                    <img 
                      src={classroomJoinQR.qrImage} 
                      alt="Classroom Join QR Code" 
                      className="w-32 h-32 border-2 border-green-300 rounded"
                    />
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* QR Badges Display */}
          <div>
            <h2 className="text-xl font-bold mb-4">
              Generated QR Badges {qrData.length > 0 && `(${qrData.length})`}
            </h2>
            
            {qrData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {qrData.map((qr, index) => (
                  <Card key={index} className="p-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">{qr.student.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Grade {qr.student.grade} - Section {qr.student.section}
                      </p>
                      <img
                        src={qr.qrImage}
                        alt="QR Code"
                        className="mx-auto mb-4 border-2 border-gray-300"
                        style={{ width: '200px', height: '200px' }}
                      />
                      <p className="text-xs text-gray-500 mb-2">Badge ID: {qr.qrBadgeId}</p>
                      <Button
                        onClick={() => printBadge(qr)}
                        className="w-full"
                        variant="outline"
                      >
                        Print Badge
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <div className="text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  <p className="text-lg font-medium mb-2">No QR Badges Generated</p>
                  <p className="text-sm">
                    {selectedClass
                      ? 'No student badge QR codes generated yet. Students need to join the class first (via classroom join QR code or class code), then you can generate individual student badge QR codes.'
                      : 'Select a class and generate QR codes. Use "Classroom Join QR Code" to let students join, then "Student Badge QR Codes" to create badges for enrolled students.'}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

