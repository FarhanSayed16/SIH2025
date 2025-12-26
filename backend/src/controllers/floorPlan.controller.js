import mongoose from 'mongoose';
import path from 'path';
import School from '../models/School.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';
import { getBlueprintUrl, getBlueprintPath, deleteBlueprintFile } from '../services/blueprint.service.js';
import { processUploadedImage } from '../services/blueprint-processing.service.js';
import { generateEquipmentQRCode } from '../services/equipment-qr.service.js';

const generateId = () => new mongoose.Types.ObjectId().toString();

const pickFloor = (value) => {
  if (value === undefined || value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const getBlueprint = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findById(id).select('floorPlan.blueprint name');
    if (!school) return errorResponse(res, 'School not found', 404);

    return successResponse(res, {
      schoolId: school._id,
      schoolName: school.name,
      blueprint: school.floorPlan?.blueprint || null
    }, 'Blueprint retrieved successfully');
  } catch (error) {
    logger.error('Get blueprint error:', error);
    return errorResponse(res, 'Failed to get blueprint', 500);
  }
};

export const uploadBlueprintFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { width, height, scale, floorNumber, floorName } = req.body;
    const file = req.file;

    if (!file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    const school = await School.findById(id);
    if (!school) return errorResponse(res, 'School not found', 404);

    // Process image (resize, generate thumbnail, extract dimensions)
    const processed = await processUploadedImage(file.path, file.originalname);
    
    const imageUrl = processed.imageUrl;
    const thumbnailUrl = processed.thumbnailUrl;

    const blueprint = school.floorPlan?.blueprint || {};
    blueprint.imageUrl = imageUrl;
    blueprint.thumbnailUrl = thumbnailUrl; // Store thumbnail URL
    blueprint.width = width ? Number(width) : processed.width;
    blueprint.height = height ? Number(height) : processed.height;
    blueprint.scale = scale ? Number(scale) : blueprint.scale;
    blueprint.uploadedAt = new Date();
    blueprint.uploadedBy = req.user?._id;
    blueprint.lastModified = new Date();

    // Optional: handle per-floor blueprint
    if (floorNumber !== undefined) {
      const floors = blueprint.floors || [];
      const targetFloor = floors.find(f => f.floorNumber === Number(floorNumber));
      if (targetFloor) {
        targetFloor.blueprintImageUrl = imageUrl;
        targetFloor.name = floorName || targetFloor.name;
        targetFloor.width = width ? Number(width) : targetFloor.width;
        targetFloor.height = height ? Number(height) : targetFloor.height;
        targetFloor.scale = scale ? Number(scale) : targetFloor.scale;
      } else {
        floors.push({
          floorNumber: Number(floorNumber),
          name: floorName || `Floor ${floorNumber}`,
          blueprintImageUrl: imageUrl,
          width: width ? Number(width) : undefined,
          height: height ? Number(height) : undefined,
          scale: scale ? Number(scale) : undefined
        });
      }
      blueprint.floors = floors;
    }

    school.floorPlan = {
      ...school.floorPlan,
      blueprint
    };

    await school.save();

    return successResponse(res, { blueprint }, 'Blueprint uploaded successfully', 201);
  } catch (error) {
    logger.error('Upload blueprint error:', error);
    return errorResponse(res, error.message || 'Failed to upload blueprint', 500);
  }
};

export const updateBlueprintMetadata = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const school = await School.findById(id);
    if (!school) return errorResponse(res, 'School not found', 404);

    const blueprint = school.floorPlan?.blueprint || {};
    const allowed = ['width', 'height', 'scale', 'pdfUrl'];

    allowed.forEach((field) => {
      if (updates[field] !== undefined) {
        const val = ['width', 'height', 'scale'].includes(field) ? Number(updates[field]) : updates[field];
        blueprint[field] = val;
      }
    });

    blueprint.lastModified = new Date();
    school.floorPlan = { ...school.floorPlan, blueprint };
    await school.save();

    return successResponse(res, { blueprint }, 'Blueprint updated successfully');
  } catch (error) {
    logger.error('Update blueprint metadata error:', error);
    return errorResponse(res, 'Failed to update blueprint', 500);
  }
};

export const deleteBlueprint = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findById(id);
    if (!school) return errorResponse(res, 'School not found', 404);

    const existingFile = school.floorPlan?.blueprint?.imageUrl;
    const filename = existingFile ? path.basename(existingFile) : null;

    school.floorPlan = {
      ...school.floorPlan,
      blueprint: undefined
    };
    await school.save();

    if (filename) {
      await deleteBlueprintFile(filename).catch((err) => logger.warn('Blueprint delete file warning:', err.message));
    }

    return successResponse(res, null, 'Blueprint deleted successfully');
  } catch (error) {
    logger.error('Delete blueprint error:', error);
    return errorResponse(res, 'Failed to delete blueprint', 500);
  }
};

// Safety equipment
export const listSafetyEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { floor, type, status } = req.query;
    const school = await School.findById(id).select('floorPlan.safetyEquipment name');
    if (!school) return errorResponse(res, 'School not found', 404);

    let equipment = school.floorPlan?.safetyEquipment || [];
    if (floor !== undefined) equipment = equipment.filter(e => e.location?.floor === Number(floor));
    if (type) equipment = equipment.filter(e => e.type === type);
    if (status) equipment = equipment.filter(e => e.status === status);

    return successResponse(res, { equipment }, 'Safety equipment retrieved successfully');
  } catch (error) {
    logger.error('List safety equipment error:', error);
    return errorResponse(res, 'Failed to get safety equipment', 500);
  }
};

export const addSafetyEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    const school = await School.findById(id);
    if (!school) return errorResponse(res, 'School not found', 404);

    // Generate QR code if not provided
    let qrCode = payload.qrCode;
    if (!qrCode) {
      try {
        const equipmentId = payload.id || generateId();
        qrCode = await generateEquipmentQRCode(equipmentId, id, payload.name);
      } catch (error) {
        logger.warn('Failed to generate QR code for equipment:', error.message);
        // Continue without QR code
      }
    }

    const equipment = {
      id: payload.id || generateId(),
      type: payload.type,
      name: payload.name,
      location: {
        floor: pickFloor(payload.location?.floor ?? payload.floor),
        coordinates: {
          x: Number(payload.location?.coordinates?.x ?? payload.x ?? 0),
          y: Number(payload.location?.coordinates?.y ?? payload.y ?? 0)
        },
        geoCoordinates: payload.location?.geoCoordinates
      },
      status: payload.status || 'active',
      lastInspection: payload.lastInspection,
      nextInspection: payload.nextInspection,
      expiryDate: payload.expiryDate,
      capacity: payload.capacity,
      description: payload.description,
      qrCode: qrCode,
      metadata: payload.metadata
    };

    school.floorPlan = {
      ...school.floorPlan,
      safetyEquipment: [...(school.floorPlan?.safetyEquipment || []), equipment]
    };

    await school.save();

    return successResponse(res, { equipment }, 'Safety equipment added', 201);
  } catch (error) {
    logger.error('Add safety equipment error:', error);
    return errorResponse(res, error.message || 'Failed to add safety equipment', 500);
  }
};

export const updateSafetyEquipment = async (req, res) => {
  try {
    const { id, equipmentId } = req.params;
    const updates = req.body || {};

    const school = await School.findById(id);
    if (!school) return errorResponse(res, 'School not found', 404);

    const list = school.floorPlan?.safetyEquipment || [];
    const idx = list.findIndex(e => e.id === equipmentId);
    if (idx === -1) return errorResponse(res, 'Equipment not found', 404);

    const current = list[idx];
    const updated = {
      ...current,
      ...updates,
      location: {
        ...current.location,
        ...(updates.location ? {
          floor: pickFloor(updates.location.floor ?? current.location?.floor),
          coordinates: {
            x: Number(updates.location.coordinates?.x ?? current.location?.coordinates?.x ?? 0),
            y: Number(updates.location.coordinates?.y ?? current.location?.coordinates?.y ?? 0)
          },
          geoCoordinates: updates.location.geoCoordinates ?? current.location?.geoCoordinates
        } : current.location)
      }
    };

    list[idx] = updated;
    school.floorPlan = { ...school.floorPlan, safetyEquipment: list };
    await school.save();

    return successResponse(res, { equipment: updated }, 'Safety equipment updated');
  } catch (error) {
    logger.error('Update safety equipment error:', error);
    return errorResponse(res, 'Failed to update safety equipment', 500);
  }
};

export const deleteSafetyEquipment = async (req, res) => {
  try {
    const { id, equipmentId } = req.params;
    const school = await School.findById(id);
    if (!school) return errorResponse(res, 'School not found', 404);

    const list = school.floorPlan?.safetyEquipment || [];
    const filtered = list.filter(e => e.id !== equipmentId);
    if (filtered.length === list.length) return errorResponse(res, 'Equipment not found', 404);

    school.floorPlan = { ...school.floorPlan, safetyEquipment: filtered };
    await school.save();

    return successResponse(res, null, 'Safety equipment deleted');
  } catch (error) {
    logger.error('Delete safety equipment error:', error);
    return errorResponse(res, 'Failed to delete safety equipment', 500);
  }
};

// Exits
export const listExits = async (req, res) => {
  try {
    const { id } = req.params;
    const { floor, type } = req.query;
    const school = await School.findById(id).select('floorPlan.exits name');
    if (!school) return errorResponse(res, 'School not found', 404);

    let exits = school.floorPlan?.exits || [];
    if (floor !== undefined) exits = exits.filter(e => e.location?.floor === Number(floor));
    if (type) exits = exits.filter(e => e.type === type);

    return successResponse(res, { exits }, 'Exits retrieved successfully');
  } catch (error) {
    logger.error('List exits error:', error);
    return errorResponse(res, 'Failed to get exits', 500);
  }
};

export const addExit = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    const school = await School.findById(id);
    if (!school) return errorResponse(res, 'School not found', 404);

    const exit = {
      id: payload.id || generateId(),
      name: payload.name,
      location: {
        floor: pickFloor(payload.location?.floor ?? payload.floor),
        coordinates: {
          x: Number(payload.location?.coordinates?.x ?? payload.x ?? 0),
          y: Number(payload.location?.coordinates?.y ?? payload.y ?? 0)
        },
        geoCoordinates: payload.location?.geoCoordinates
      },
      type: payload.type,
      isAccessible: payload.isAccessible ?? true,
      capacity: payload.capacity,
      hasRamp: payload.hasRamp,
      hasStairs: payload.hasStairs,
      emergencyLighting: payload.emergencyLighting,
      width: payload.width,
      direction: payload.direction,
      leadsTo: payload.leadsTo
    };

    school.floorPlan = { ...school.floorPlan, exits: [...(school.floorPlan?.exits || []), exit] };
    await school.save();

    return successResponse(res, { exit }, 'Exit added', 201);
  } catch (error) {
    logger.error('Add exit error:', error);
    return errorResponse(res, error.message || 'Failed to add exit', 500);
  }
};

export const updateExit = async (req, res) => {
  try {
    const { id, exitId } = req.params;
    const updates = req.body || {};
    const school = await School.findById(id);
    if (!school) return errorResponse(res, 'School not found', 404);

    const exits = school.floorPlan?.exits || [];
    const idx = exits.findIndex(e => e.id === exitId);
    if (idx === -1) return errorResponse(res, 'Exit not found', 404);

    const current = exits[idx];
    const updated = {
      ...current,
      ...updates,
      location: {
        ...current.location,
        ...(updates.location ? {
          floor: pickFloor(updates.location.floor ?? current.location?.floor),
          coordinates: {
            x: Number(updates.location.coordinates?.x ?? current.location?.coordinates?.x ?? 0),
            y: Number(updates.location.coordinates?.y ?? current.location?.coordinates?.y ?? 0)
          },
          geoCoordinates: updates.location.geoCoordinates ?? current.location?.geoCoordinates
        } : current.location)
      }
    };

    exits[idx] = updated;
    school.floorPlan = { ...school.floorPlan, exits };
    await school.save();

    return successResponse(res, { exit: updated }, 'Exit updated');
  } catch (error) {
    logger.error('Update exit error:', error);
    return errorResponse(res, 'Failed to update exit', 500);
  }
};

export const deleteExit = async (req, res) => {
  try {
    const { id, exitId } = req.params;
    const school = await School.findById(id);
    if (!school) return errorResponse(res, 'School not found', 404);

    const exits = school.floorPlan?.exits || [];
    const filtered = exits.filter(e => e.id !== exitId);
    if (filtered.length === exits.length) return errorResponse(res, 'Exit not found', 404);

    school.floorPlan = { ...school.floorPlan, exits: filtered };
    await school.save();

    return successResponse(res, null, 'Exit deleted');
  } catch (error) {
    logger.error('Delete exit error:', error);
    return errorResponse(res, 'Failed to delete exit', 500);
  }
};

// Rooms
export const listRooms = async (req, res) => {
  try {
    const { id } = req.params;
    const { floor, roomType } = req.query;
    const school = await School.findById(id).select('floorPlan.rooms name');
    if (!school) return errorResponse(res, 'School not found', 404);

    let rooms = school.floorPlan?.rooms || [];
    if (floor !== undefined) rooms = rooms.filter(r => r.location?.floor === Number(floor) || r.floorNumber === Number(floor));
    if (roomType) rooms = rooms.filter(r => r.roomType === roomType);

    return successResponse(res, { rooms }, 'Rooms retrieved successfully');
  } catch (error) {
    logger.error('List rooms error:', error);
    return errorResponse(res, 'Failed to get rooms', 500);
  }
};

export const addRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    const school = await School.findById(id);
    if (!school) return errorResponse(res, 'School not found', 404);

    const room = {
      id: payload.id || generateId(),
      name: payload.name,
      location: {
        floor: pickFloor(payload.location?.floor ?? payload.floor),
        coordinates: {
          x: Number(payload.location?.coordinates?.x ?? payload.x ?? 0),
          y: Number(payload.location?.coordinates?.y ?? payload.y ?? 0)
        },
        bounds: payload.location?.bounds || []
      },
      roomType: payload.roomType,
      capacity: payload.capacity,
      hasWindows: payload.hasWindows,
      hasEmergencyExit: payload.hasEmergencyExit,
      nearestExit: payload.nearestExit,
      nearestFireExtinguisher: payload.nearestFireExtinguisher,
      floorNumber: payload.floorNumber ?? payload.location?.floor
    };

    school.floorPlan = { ...school.floorPlan, rooms: [...(school.floorPlan?.rooms || []), room] };
    await school.save();

    return successResponse(res, { room }, 'Room added', 201);
  } catch (error) {
    logger.error('Add room error:', error);
    return errorResponse(res, error.message || 'Failed to add room', 500);
  }
};

export const updateRoom = async (req, res) => {
  try {
    const { id, roomId } = req.params;
    const updates = req.body || {};
    const school = await School.findById(id);
    if (!school) return errorResponse(res, 'School not found', 404);

    const rooms = school.floorPlan?.rooms || [];
    const idx = rooms.findIndex(r => r.id === roomId);
    if (idx === -1) return errorResponse(res, 'Room not found', 404);

    const current = rooms[idx];
    const updated = {
      ...current,
      ...updates,
      location: {
        ...current.location,
        ...(updates.location ? {
          floor: pickFloor(updates.location.floor ?? current.location?.floor),
          coordinates: {
            x: Number(updates.location.coordinates?.x ?? current.location?.coordinates?.x ?? 0),
            y: Number(updates.location.coordinates?.y ?? current.location?.coordinates?.y ?? 0)
          },
          bounds: updates.location.bounds ?? current.location?.bounds
        } : current.location)
      }
    };

    rooms[idx] = updated;
    school.floorPlan = { ...school.floorPlan, rooms };
    await school.save();

    return successResponse(res, { room: updated }, 'Room updated');
  } catch (error) {
    logger.error('Update room error:', error);
    return errorResponse(res, 'Failed to update room', 500);
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const { id, roomId } = req.params;
    const school = await School.findById(id);
    if (!school) return errorResponse(res, 'School not found', 404);

    const rooms = school.floorPlan?.rooms || [];
    const filtered = rooms.filter(r => r.id !== roomId);
    if (filtered.length === rooms.length) return errorResponse(res, 'Room not found', 404);

    school.floorPlan = { ...school.floorPlan, rooms: filtered };
    await school.save();

    return successResponse(res, null, 'Room deleted');
  } catch (error) {
    logger.error('Delete room error:', error);
    return errorResponse(res, 'Failed to delete room', 500);
  }
};

// Aggregated map data
export const getMapData = async (req, res) => {
  try {
    const { id } = req.params;
    const { floor } = req.query;
    const school = await School.findById(id).select('name floorPlan');
    if (!school) return errorResponse(res, 'School not found', 404);

    const floorNumber = floor !== undefined ? Number(floor) : undefined;

    const filterByFloor = (items) => {
      if (floorNumber === undefined) return items;
      return items.filter((item) => {
        if (item.location?.floor !== undefined) return item.location.floor === floorNumber;
        if (item.floorNumber !== undefined) return item.floorNumber === floorNumber;
        return true;
      });
    };

    const data = {
      blueprint: school.floorPlan?.blueprint || null,
      equipment: filterByFloor(school.floorPlan?.safetyEquipment || []),
      exits: filterByFloor(school.floorPlan?.exits || []),
      rooms: filterByFloor(school.floorPlan?.rooms || []),
      hazards: school.floorPlan?.hazards || []
    };

    return successResponse(res, data, 'Map data retrieved successfully');
  } catch (error) {
    logger.error('Get map data error:', error);
    return errorResponse(res, 'Failed to get map data', 500);
  }
};

// Simple navigation route (straight-line fallback)
export const getNavigationRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const { fromX, fromY, toX, toY, floor } = req.query;

    const school = await School.findById(id).select('floorPlan');
    if (!school) return errorResponse(res, 'School not found', 404);

    const sx = parseFloat(fromX);
    const sy = parseFloat(fromY);
    const tx = parseFloat(toX);
    const ty = parseFloat(toY);

    if ([sx, sy, tx, ty].some((v) => Number.isNaN(v))) {
      return errorResponse(res, 'fromX, fromY, toX, toY are required as numbers', 400);
    }

    const targetFloor = floor !== undefined ? Number(floor) : undefined;

    // Build nodes from floor plan (rooms + exits + equipment) on the requested floor
    const nodes = [];
    const addNode = (id, x, y, label = '') => {
      if (x === undefined || y === undefined || Number.isNaN(x) || Number.isNaN(y)) return;
      nodes.push({ id, x, y, label });
    };

    const fp = school.floorPlan || {};
    const sameFloor = (loc) => {
      if (targetFloor === undefined) return true;
      const f = loc?.floor;
      return f === undefined || f === targetFloor;
    };

    (fp.rooms || []).forEach((r) => {
      if (!sameFloor(r.location)) return;
      addNode(`room-${r.id}`, r.location?.coordinates?.x, r.location?.coordinates?.y, r.name || 'room');
    });
    (fp.exits || []).forEach((ex) => {
      if (!sameFloor(ex.location)) return;
      addNode(`exit-${ex.id}`, ex.location?.coordinates?.x, ex.location?.coordinates?.y, ex.name || 'exit');
    });
    (fp.safetyEquipment || []).forEach((eq) => {
      if (!sameFloor(eq.location)) return;
      addNode(`eq-${eq.id}`, eq.location?.coordinates?.x, eq.location?.coordinates?.y, eq.name || 'equipment');
    });

    // Add start and end nodes
    addNode('start', sx, sy, 'start');
    addNode('end', tx, ty, 'end');

    if (nodes.length < 2) {
      // Fallback to straight line
      const dx = tx - sx;
      const dy = ty - sy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const walkingSpeed = 1.4;
      const estimatedTimeSeconds = walkingSpeed > 0 ? distance / walkingSpeed : 0;
      return successResponse(
        res,
        {
          floor: targetFloor ?? null,
          route: [
            { x: sx, y: sy },
            { x: tx, y: ty }
          ],
          distance,
          estimatedTimeSeconds
        },
        'Navigation route calculated (straight-line fallback)'
      );
    }

    // Dijkstra on fully connected graph (Euclidean weights)
    const dist = {};
    const prev = {};
    const Q = new Set(nodes.map((n) => n.id));
    nodes.forEach((n) => (dist[n.id] = Infinity));
    dist['start'] = 0;

    const getNode = (id) => nodes.find((n) => n.id === id);
    const weight = (a, b) => {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.sqrt(dx * dx + dy * dy);
    };

    while (Q.size > 0) {
      let u = null;
      let best = Infinity;
      Q.forEach((id) => {
        if (dist[id] < best) {
          best = dist[id];
          u = id;
        }
      });
      if (u === null) break;
      Q.delete(u);
      if (u === 'end') break;

      const uNode = getNode(u);
      if (!uNode) continue;

      nodes.forEach((vNode) => {
        if (!Q.has(vNode.id) || vNode.id === u) return;
        const alt = dist[u] + weight(uNode, vNode);
        if (alt < dist[vNode.id]) {
          dist[vNode.id] = alt;
          prev[vNode.id] = u;
        }
      });
    }

    // Reconstruct path
    const pathIds = [];
    let cur = 'end';
    if (!prev[cur] && cur !== 'start') {
      // No path found, fallback to straight line
      const dx = tx - sx;
      const dy = ty - sy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const walkingSpeed = 1.4;
      const estimatedTimeSeconds = walkingSpeed > 0 ? distance / walkingSpeed : 0;
      return successResponse(
        res,
        {
          floor: targetFloor ?? null,
          route: [
            { x: sx, y: sy },
            { x: tx, y: ty }
          ],
          distance,
          estimatedTimeSeconds
        },
        'Navigation route calculated (straight-line fallback)'
      );
    }
    while (cur) {
      pathIds.unshift(cur);
      cur = prev[cur];
      if (cur === 'start') {
        pathIds.unshift('start');
        break;
      }
    }

    const path = pathIds.map((id) => {
      const n = getNode(id);
      return { x: n?.x ?? 0, y: n?.y ?? 0 };
    });

    const distance = dist['end'] ?? 0;
    const walkingSpeed = 1.4;
    const estimatedTimeSeconds = walkingSpeed > 0 ? distance / walkingSpeed : 0;

    return successResponse(
      res,
      {
        floor: targetFloor ?? null,
        route: path,
        distance,
        estimatedTimeSeconds
      },
      'Navigation route calculated'
    );
  } catch (error) {
    logger.error('Get navigation route error:', error);
    return errorResponse(res, 'Failed to calculate route', 500);
  }
};

