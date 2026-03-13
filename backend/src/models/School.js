import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'School name is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates'
      }
    }
  },
  safeZones: [{
    name: {
      type: String,
      required: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    capacity: {
      type: Number,
      default: 0
    },
    description: String
  }],
  floorPlan: {
    blueprint: {
      imageUrl: String, // Primary blueprint image URL
      pdfUrl: String, // Optional PDF URL
      width: Number, // In pixels or meters based on scale
      height: Number,
      scale: Number, // e.g., 1 pixel = 0.1 meters
      floors: [{
        floorNumber: Number,
        name: String,
        blueprintImageUrl: String,
        width: Number,
        height: Number,
        scale: Number
      }],
      uploadedAt: Date,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      lastModified: Date
    },
    safetyEquipment: [{
      id: String,
      type: {
        type: String,
        enum: ['fire-extinguisher', 'first-aid-kit', 'aed', 'emergency-exit-sign', 'fire-alarm', 'sprinkler', 'emergency-light', 'defibrillator', 'other']
      },
      name: String,
      location: {
        floor: Number,
        coordinates: {
          x: Number,
          y: Number
        },
        geoCoordinates: {
          type: { type: String, enum: ['Point'] },
          coordinates: [Number] // [lng, lat]
        }
      },
      status: {
        type: String,
        enum: ['active', 'maintenance', 'expired', 'missing'],
        default: 'active'
      },
      lastInspection: Date,
      nextInspection: Date,
      expiryDate: Date,
      capacity: String,
      description: String,
      qrCode: String,
      metadata: {
        manufacturer: String,
        model: String,
        serialNumber: String
      }
    }],
    rooms: [{
      id: String,
      name: String,
      location: {
        floor: Number,
        coordinates: {
          x: Number,
          y: Number
        },
        bounds: [{
          x: Number,
          y: Number
        }]
      },
      roomType: {
        type: String,
        enum: ['classroom', 'laboratory', 'library', 'office', 'gym', 'cafeteria', 'bathroom', 'stairwell', 'elevator', 'storage', 'other']
      },
      capacity: Number,
      hasWindows: Boolean,
      hasEmergencyExit: Boolean,
      nearestExit: String,
      nearestFireExtinguisher: String,
      floorNumber: Number
    }],
    exits: [{
      id: String,
      name: String,
      location: {
        floor: Number,
        coordinates: {
          x: Number,
          y: Number
        },
        geoCoordinates: {
          type: { type: String, enum: ['Point'] },
          coordinates: [Number]
        }
      },
      type: {
        type: String,
        enum: ['main', 'emergency', 'fire', 'service', 'disabled-access']
      },
      isAccessible: {
        type: Boolean,
        default: true
      },
      capacity: Number,
      hasRamp: Boolean,
      hasStairs: Boolean,
      emergencyLighting: Boolean,
      width: Number,
      direction: String,
      leadsTo: String
    }],
    hazards: [{
      id: String,
      type: {
        type: String,
        enum: ['fire', 'structural', 'electrical', 'other']
      },
      location: {
        type: { type: String, enum: ['Point'] },
        coordinates: [Number]
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      description: String,
      resolved: {
        type: Boolean,
        default: false
      }
    }]
  },
  preparednessScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  region: {
    type: String,
    trim: true
  },
  disasterTypes: [{
    type: String,
    enum: ['earthquake', 'flood', 'fire', 'cyclone', 'stampede', 'heatwave', 'landslide']
  }],
  contact: {
    principal: {
      name: String,
      phone: String,
      email: String
    },
    emergency: {
      phone: String,
      email: String
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  totalTeachers: {
    type: Number,
    default: 0
  },
  // Phase 2.5: K-12 Multi-Access fields
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  totalClasses: {
    type: Number,
    default: 0
  },
  deviceManagement: {
    allowPersonalDevices: {
      type: Boolean,
      default: false
    },
    allowClassDevices: {
      type: Boolean,
      default: true
    },
    maxClassDevices: {
      type: Number,
      default: 5
    }
  },
  // Phase 5.3: Mesh Networking - school-level shared key
  meshKey: {
    type: String,
    select: false, // Don't return key by default (security)
  },
  meshKeyExpiresAt: {
    type: Date,
    select: false, // Don't return expiration by default
  }
}, {
  timestamps: true
});

// Geospatial indexes
schoolSchema.index({ location: '2dsphere' });
schoolSchema.index({ 'safeZones.location': '2dsphere' });
schoolSchema.index({ name: 1 });
schoolSchema.index({ region: 1 });
// Phase 2.5: K-12 Multi-Access indexes
schoolSchema.index({ totalClasses: 1 });

// Method to find nearest schools
schoolSchema.statics.findNearest = function(lat, lng, maxDistance = 5000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true
  });
};

// Method to calculate preparedness score
schoolSchema.methods.calculatePreparednessScore = async function() {
  const Drill = mongoose.model('Drill');
  const User = mongoose.model('User');
  
  // Get recent drills
  const recentDrills = await Drill.find({
    institutionId: this._id,
    status: 'completed',
    createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
  });
  
  if (recentDrills.length === 0) {
    this.preparednessScore = 0;
    return this.save();
  }
  
  // Calculate average participation rate
  const avgParticipation = recentDrills.reduce((sum, drill) => {
    return sum + (drill.results?.participationRate || 0);
  }, 0) / recentDrills.length;
  
  // Calculate average evacuation time (lower is better)
  const avgEvacuationTime = recentDrills.reduce((sum, drill) => {
    return sum + (drill.results?.avgEvacuationTime || 0);
  }, 0) / recentDrills.length;
  
  // Normalize evacuation time (5 min = 0, 0 min = 100)
  const timeScore = Math.max(0, 100 - (avgEvacuationTime / 3)); // 3 seconds = 1 point
  
  // Calculate final score (weighted)
  this.preparednessScore = Math.round(
    (avgParticipation * 0.6) + (timeScore * 0.4)
  );
  
  return this.save();
};

const School = mongoose.model('School', schoolSchema);

export default School;

