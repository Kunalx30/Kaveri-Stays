import React, { useState, useEffect, useCallback } from 'react';
import { DoorClosed, Plus, Pencil, Trash2, RefreshCw, Loader2, Hash, Grid, Hotel } from 'lucide-react';
import { listRoomsApi, createRoomApi, updateRoomApi, deleteRoomApi } from '../../api/rooms';
import { getPropertiesApi } from '../../api/properties';
import { listRoomTypesApi } from '../../api/roomTypes';
import { useAuth } from '../../context/AuthContext';
import ManagementNav from '../../components/management/ManagementNav';
import RoomModal from '../../components/management/RoomModal';
import ConfirmDeleteDialog from '../../components/management/ConfirmDeleteDialog';
import ErrorMessage from '../../components/common/ErrorMessage';

const ManageRooms = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const canMutate = isOwner || user?.role === 'manager';

  const [rooms, setRooms] = useState([]);
  const [properties, setProperties] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Filter
  const [filterPropertyId, setFilterPropertyId] = useState('');
  const [filterRoomTypeId, setFilterRoomTypeId] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (filterPropertyId) params.property_id = filterPropertyId;
      if (filterRoomTypeId) params.room_type_id = filterRoomTypeId;
      const data = await listRoomsApi(params);
      setRooms(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load rooms.');
    } finally {
      setIsLoading(false);
    }
  }, [filterPropertyId, filterRoomTypeId]);

  const fetchLookups = useCallback(async () => {
    try {
      const [props, types] = await Promise.all([
        getPropertiesApi().catch(() => []),
        listRoomTypesApi().catch(() => []),
      ]);
      setProperties(props);
      setRoomTypes(types);
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleSave = async (payload) => {
    setIsSaving(true);
    try {
      if (editTarget) {
        // Only room_number and room_type_id are editable
        await updateRoomApi(editTarget.room_id, {
          room_number: payload.room_number,
          room_type_id: payload.room_type_id,
        });
      } else {
        await createRoomApi(payload);
      }
      setModalOpen(false);
      setEditTarget(null);
      fetchRooms();
    } catch (err) {
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteRoomApi(deleteTarget.room_id);
      setDeleteTarget(null);
      fetchRooms();
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Failed to delete room. It may have existing bookings.'
      );
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const getPropertyName = (id) => properties.find((p) => p.property_id === id)?.name || `Property #${id}`;
  const getRoomTypeName = (id) => roomTypes.find((rt) => rt.room_type_id === id)?.name || `Type #${id}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
            <DoorClosed className="w-4 h-4" />
            <span>Room Inventory Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Room Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isOwner
              ? 'Manage individual room units across all resort properties.'
              : `Manage rooms for your assigned property (Property #${user?.property_id}).`}
          </p>
        </div>
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={fetchRooms}
            disabled={isLoading}
            className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {canMutate && (
            <button
              onClick={() => { setEditTarget(null); setModalOpen(true); }}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Room</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Navigation */}
      <ManagementNav />

      {/* Filters */}
      {isOwner && (
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Filter by Property
            </label>
            <select
              value={filterPropertyId}
              onChange={(e) => setFilterPropertyId(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-700 cursor-pointer min-w-[160px]"
            >
              <option value="">All Properties</option>
              {properties.map((p) => (
                <option key={p.property_id} value={p.property_id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Filter by Room Type
            </label>
            <select
              value={filterRoomTypeId}
              onChange={(e) => setFilterRoomTypeId(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-700 cursor-pointer min-w-[160px]"
            >
              <option value="">All Room Types</option>
              {roomTypes.map((rt) => (
                <option key={rt.room_type_id} value={rt.room_type_id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
            <DoorClosed className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-slate-800">No rooms found</p>
          <p className="text-sm text-slate-500 mt-1">
            {canMutate ? 'Create your first room unit.' : 'No rooms are available.'}
          </p>
          {canMutate && (
            <button
              onClick={() => { setEditTarget(null); setModalOpen(true); }}
              className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              Create Room
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Room ID</th>
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Room #</th>
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1.5">
                    <Hotel className="w-3.5 h-3.5" />
                    <span>Property</span>
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1.5">
                    <Grid className="w-3.5 h-3.5" />
                    <span>Room Type</span>
                  </div>
                </th>
                {canMutate && (
                  <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rooms.map((room) => (
                <tr key={room.room_id} className="bg-white hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-400">#{room.room_id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Hash className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-900">{room.room_number}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{getPropertyName(room.property_id)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full font-bold text-[10px] uppercase tracking-wide">
                      {getRoomTypeName(room.room_type_id)}
                    </span>
                  </td>
                  {canMutate && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => { setEditTarget(room); setModalOpen(true); }}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit room"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {isOwner && (
                          <button
                            onClick={() => setDeleteTarget(room)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete room"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RoomModal
        isOpen={modalOpen}
        room={editTarget}
        properties={properties}
        roomTypes={roomTypes}
        onSave={handleSave}
        onDismiss={() => { setModalOpen(false); setEditTarget(null); }}
        isLoading={isSaving}
        currentUser={user}
      />

      <ConfirmDeleteDialog
        isOpen={!!deleteTarget}
        title="Delete Room"
        description={
          deleteTarget
            ? `Delete room "${deleteTarget.room_number}"? This is blocked if the room has any bookings.`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ManageRooms;
