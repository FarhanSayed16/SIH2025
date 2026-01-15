/**
 * Phase 3.4.5: Attendance Model
 * Tracks student attendance for classes
 */

import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  records: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true,
      default: 'present'
    },
    remarks: {
      type: String,
      trim: true
    },
    markedAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes
attendanceSchema.index({ classId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ institutionId: 1, date: -1 });
attendanceSchema.index({ 'records.studentId': 1, date: -1 });

// Static method to get attendance statistics
attendanceSchema.statics.getAttendanceStats = async function(classId, startDate, endDate) {
  const matchQuery = { classId };
  if (startDate || endDate) {
    matchQuery.date = {};
    if (startDate) matchQuery.date.$gte = new Date(startDate);
    if (endDate) matchQuery.date.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: matchQuery },
    { $unwind: '$records' },
    {
      $group: {
        _id: '$records.status',
        count: { $sum: 1 }
      }
    }
  ]);

  return stats;
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;

