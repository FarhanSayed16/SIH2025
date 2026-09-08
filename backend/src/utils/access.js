// Normalize both populated references and raw MongoDB IDs at authorization boundaries.
export const referenceId = (value) => String(value?._id ?? value?.id ?? value ?? '');

export const isSystemAdmin = (user) => user?.role?.toLowerCase() === 'system_admin';

export const canAccessInstitution = (user, institutionId) => {
  const target = referenceId(institutionId);
  return user?.approvalStatus === 'approved' && !!target && (isSystemAdmin(user) || referenceId(user?.institutionId) === target);
};

export const isStaff = (user) =>
  ['teacher', 'admin', 'system_admin'].includes(user?.role?.toLowerCase()) &&
  user?.approvalStatus === 'approved';
