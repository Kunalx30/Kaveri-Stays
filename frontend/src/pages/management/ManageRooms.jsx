import React, { useState, useEffect, useCallback } from 'react';
import { DoorClosed, Plus, Pencil, Trash2, RefreshCw, Loader2, Hash, Grid, Hotel, Sparkles, AlertTriangle } from 'lucide-react';
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

  // Filters
  const [filterPropertyId, setFilterPropertyId] = useState('');
  const [filterRoomTypeId, setFilterRoomTypeId] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lookupsError, setLookupsError] = useState('');

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (filterPropertyId) params.property_id = Number(filterPropertyId);
      if (filterRoomTypeId) params.room_type_id = Number(filterRoomTypeId);
      const data = await listRoomsApi(params);
      setRooms(data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load rooms.');
    } finally {
      setIsLoading(false);
    }
  }, [filterPropertyId, filterRoomTypeId]);

  const fetchLookups = useCallback(async () => {
    setLookupsError('');
    try {
      const [props, types] = await Promise.all([
        getPropertiesApi().catch(() => null),
        listRoomTypesApi().catch(() => null),
      ]);
      if (props !== null) setProperties(props);
      if (types !== null) setRoomTypes(types);
      if (props === null || types === null) {
        setLookupsError('Could not load properties or room types. Room creation may be unavailable.');
      }
    } catch {
      setLookupsError('Could not load lookup data.');
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
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1E1C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        
        {/* ── Page Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#E6DFD5]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4EFEA] border border-[#E6DFD5] text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A6240]">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Unit Directory</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#16231E]">
              Room Inventory
            </h1>
            <p className="text-sm text-[#5A635F] font-light max-w-2xl leading-relaxed">
              {isOwner
                ? 'Manage individual room units, numbers, and category assignments across all resort properties.'
                : `Manage room units for your assigned resort (Property #${user?.property_id}).`}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
            <button
              onClick={fetchRooms}
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#16231E] bg-white hover:bg-[#F4EFEA] border border-[#E6DFD5] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Refresh rooms"
              aria-label="Refresh rooms"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {canMutate && (
              <button
                onClick={() => { setEditTarget(null); setModalOpen(true); }}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#16231E] hover:bg-[#253B33] transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Room</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Sub Navigation ── */}
        <ManagementNav />

        {lookupsError && (
          <div className="rounded-2xl bg-[#FFF8EB] border border-[#FCE2C1] text-[#B45309] px-5 py-3.5 text-xs font-medium flex items-center space-x-3 shadow-2xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#D97706]" />
            <span>{lookupsError}</span>
          </div>
        )}

        {/* ── Filter Bar ── */}
        {isOwner && (
          <div className="bg-[#F4EFEA] p-4 sm:p-5 rounded-3xl border border-[#E6DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A6240]">
                Inventory Filters
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-[11px] font-semibold text-[#5A635F] uppercase tracking-wider whitespace-nowrap">
                  Property:
                </label>
                <select
                  value={filterPropertyId}
                  onChange={(e) => setFilterPropertyId(e.target.value)}
                  className="w-full sm:w-auto px-3.5 py-2 bg-white border border-[#D8D0C5] rounded-xl text-xs text-[#16231E] focus:outline-none focus:ring-2 focus:ring-[#253B33]/20 focus:border-[#253B33] transition-all cursor-pointer sm:min-w-[180px]"
                >
                  <option value="">All Properties</option>
                  {properties.map((p) => (
                    <option key={p.property_id} value={p.property_id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-[11px] font-semibold text-[#5A635F] uppercase tracking-wider whitespace-nowrap">
                  Category:
                </label>
                <select
                  value={filterRoomTypeId}
                  onChange={(e) => setFilterRoomTypeId(e.target.value)}
                  className="w-full sm:w-auto px-3.5 py-2 bg-white border border-[#D8D0C5] rounded-xl text-xs text-[#16231E] focus:outline-none focus:ring-2 focus:ring-[#253B33]/20 focus:border-[#253B33] transition-all cursor-pointer sm:min-w-[180px]"
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
          </div>
        )}

        <ErrorMessage message={error} onDismiss={() => setError('')} />

        {/* ── Content ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F4EFEA] border border-[#E6DFD5] flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-[#8A6240]" />
            </div>
            <p className="text-xs font-semibold text-[#7A857F] uppercase tracking-wider">
              Loading room inventory...
            </p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-[#D8D0C5] bg-[#FBF7EF]">
            <div className="w-20 h-20 rounded-3xl bg-white border border-[#E6DFD5] flex items-center justify-center mx-auto mb-5 shadow-sm">
              <DoorClosed className="w-9 h-9 text-[#8A6240]" />
            </div>
            <p className="font-serif text-2xl font-normal text-[#16231E]">No Rooms Found</p>
            <p className="text-sm text-[#5A635F] mt-1 font-light max-w-md mx-auto">
              {canMutate
                ? 'No rooms match your filter criteria. Create a new room unit or clear filters.'
                : 'No room units available in this scope.'}
            </p>
            {canMutate && (
              <button
                onClick={() => { setEditTarget(null); setModalOpen(true); }}
                className="mt-5 inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#16231E] hover:bg-[#253B33] transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Room Unit</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {rooms.map((room) => (
                <div
                  key={room.room_id}
                  className="bg-white border border-[#E6DFD5] rounded-3xl p-5 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[#EAF3EE] flex items-center justify-center text-[#1B4D3E] shrink-0">
                        <Hash className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-[#7A857F] uppercase tracking-wider">
                          Unit #{room.room_id}
                        </span>
                        <h3 className="font-serif text-2xl font-normal text-[#16231E] truncate">
                          Room {room.room_number}
                        </h3>
                      </div>
                    </div>

                    {canMutate && (
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          onClick={() => { setEditTarget(room); setModalOpen(true); }}
                          className="p-2 rounded-xl text-[#16231E] bg-[#F4EFEA] hover:bg-[#EDE8E1] border border-[#E6DFD5] transition-colors cursor-pointer"
                          aria-label={`Edit room ${room.room_number}`}
                          title="Edit room"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#8A6240]" />
                        </button>
                        {isOwner && (
                          <button
                            onClick={() => setDeleteTarget(room)}
                            className="p-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors cursor-pointer"
                            aria-label={`Delete room ${room.room_number}`}
                            title="Delete room"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-3 border-t border-[#F4EFEA] text-xs">
                    <div className="flex items-center space-x-2 text-[#5A635F]">
                      <Hotel className="w-3.5 h-3.5 text-[#8A6240] shrink-0" />
                      <span className="truncate font-medium">{getPropertyName(room.property_id)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Grid className="w-3.5 h-3.5 text-[#2C5282] shrink-0" />
                      <span className="px-2.5 py-0.5 bg-[#EBF2F7] text-[#2C5282] border border-[#D0E0EC] rounded-full font-bold text-[10px] uppercase tracking-wider">
                        {getRoomTypeName(room.room_type_id)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block overflow-hidden rounded-3xl border border-[#E6DFD5] bg-white shadow-xs">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#F4EFEA] border-b border-[#E6DFD5]">
                    <th className="text-left px-6 py-4 font-bold text-[#7A857F] uppercase tracking-[0.18em]">
                      Unit ID
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-[#7A857F] uppercase tracking-[0.18em]">
                      Room Number
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-[#7A857F] uppercase tracking-[0.18em]">
                      Resort Destination
                    </th>
                    <th className="text-left px-6 py-4 font-bold text-[#7A857F] uppercase tracking-[0.18em]">
                      Category
                    </th>
                    {canMutate && (
                      <th className="text-right px-6 py-4 font-bold text-[#7A857F] uppercase tracking-[0.18em]">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4EFEA]">
                  {rooms.map((room) => (
                    <tr key={room.room_id} className="hover:bg-[#FBF9F5] transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-[#7A857F]">
                        #{room.room_id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-xl bg-[#EAF3EE] flex items-center justify-center text-[#1B4D3E]">
                            <Hash className="w-4 h-4" />
                          </div>
                          <span className="font-serif text-lg font-normal text-[#16231E]">
                            {room.room_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#5A635F]">
                        <div className="flex items-center space-x-2">
                          <Hotel className="w-3.5 h-3.5 text-[#8A6240] shrink-0" />
                          <span className="font-medium text-[#16231E]">{getPropertyName(room.property_id)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 bg-[#EBF2F7] text-[#2C5282] border border-[#D0E0EC] rounded-full font-bold text-[10px] uppercase tracking-wider">
                          {getRoomTypeName(room.room_type_id)}
                        </span>
                      </td>
                      {canMutate && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => { setEditTarget(room); setModalOpen(true); }}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#16231E] bg-[#F4EFEA] hover:bg-[#EDE8E1] border border-[#E6DFD5] transition-colors cursor-pointer"
                              title="Edit room"
                            >
                              <Pencil className="w-3 h-3 text-[#8A6240]" />
                              <span>Edit</span>
                            </button>
                            {isOwner && (
                              <button
                                onClick={() => setDeleteTarget(room)}
                                className="p-1.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors cursor-pointer"
                                title="Delete room"
                                aria-label={`Delete room ${room.room_number}`}
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
          </>
        )}

        <RoomModal
          isOpen={modalOpen}
          room={editTarget}
          properties={properties}
          roomTypes={roomTypes}
          onSave={handleSave}
          onDismiss={() => { setModalOpen(false); setEditTarget(null); }}
          isLoading={isSaving}
          defaultPropertyId={user?.property_id}
          isOwner={isOwner}
        />

        <ConfirmDeleteDialog
          isOpen={!!deleteTarget}
          title="Delete Room"
          description={
            deleteTarget
              ? `Delete room "${deleteTarget.room_number}"? This will be blocked if the room is linked to active or past bookings.`
              : ''
          }
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isLoading={isDeleting}
        />

      </div>
    </div>
  );
};

export default ManageRooms;
