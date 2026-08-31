import React, { useState, useEffect, useCallback } from 'react';
import { Grid, Plus, Pencil, Trash2, RefreshCw, Loader2, Users, Sparkles } from 'lucide-react';
import {
  listRoomTypesApi,
  createRoomTypeApi,
  updateRoomTypeApi,
  deleteRoomTypeApi,
} from '../../api/roomTypes';
import { useAuth } from '../../context/AuthContext';
import ManagementNav from '../../components/management/ManagementNav';
import RoomTypeModal from '../../components/management/RoomTypeModal';
import ConfirmDeleteDialog from '../../components/management/ConfirmDeleteDialog';
import ErrorMessage from '../../components/common/ErrorMessage';

const ManageRoomTypes = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [roomTypes, setRoomTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRoomTypes = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await listRoomTypesApi();
      setRoomTypes(data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load room types.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoomTypes();
  }, [fetchRoomTypes]);

  const handleSave = async (payload) => {
    setIsSaving(true);
    try {
      if (editTarget) {
        await updateRoomTypeApi(editTarget.room_type_id, payload);
      } else {
        await createRoomTypeApi(payload);
      }
      setModalOpen(false);
      setEditTarget(null);
      fetchRoomTypes();
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
      await deleteRoomTypeApi(deleteTarget.room_type_id);
      setDeleteTarget(null);
      fetchRoomTypes();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Failed to delete room type. It may be referenced by existing rooms or rate plans.'
      );
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const occupancyBadgeStyle = (n) => {
    if (n >= 6) return 'bg-[#EBF2F7] text-[#2C5282] border-[#D0E0EC]';
    if (n >= 4) return 'bg-[#EAF3EE] text-[#1B4D3E] border-[#CDE3D6]';
    return 'bg-[#F4EFEA] text-[#8A6240] border-[#E6DFD5]';
  };

  const occupancyTierLabel = (n) => {
    if (n >= 6) return 'Executive Villa / Group';
    if (n >= 4) return 'Family Suite';
    if (n >= 3) return 'Triple Deluxe';
    if (n === 2) return 'Double Stay';
    return 'Single Retreat';
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1E1C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        
        {/* ── Page Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#E6DFD5]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4EFEA] border border-[#E6DFD5] text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A6240]">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Category Directory</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#16231E]">
              Room Type Categories
            </h1>
            <p className="text-sm text-[#5A635F] font-light max-w-2xl leading-relaxed">
              Global room category definitions and capacity limits shared across all Kaveri Stays properties.
              {!isOwner && ' (View-only for your current role)'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
            <button
              onClick={fetchRoomTypes}
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#16231E] bg-white hover:bg-[#F4EFEA] border border-[#E6DFD5] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Refresh room types"
              aria-label="Refresh room types"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {isOwner && (
              <button
                onClick={() => { setEditTarget(null); setModalOpen(true); }}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#16231E] hover:bg-[#253B33] transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Category</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Sub Navigation ── */}
        <ManagementNav />

        <ErrorMessage message={error} onDismiss={() => setError('')} />

        {/* ── Content ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F4EFEA] border border-[#E6DFD5] flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-[#8A6240]" />
            </div>
            <p className="text-xs font-semibold text-[#7A857F] uppercase tracking-wider">
              Loading room categories...
            </p>
          </div>
        ) : roomTypes.length === 0 ? (
          <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-[#D8D0C5] bg-[#FBF7EF]">
            <div className="w-20 h-20 rounded-3xl bg-white border border-[#E6DFD5] flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Grid className="w-9 h-9 text-[#8A6240]" />
            </div>
            <p className="font-serif text-2xl font-normal text-[#16231E]">No Room Categories Found</p>
            <p className="text-sm text-[#5A635F] mt-1 font-light max-w-md mx-auto">
              Define global room categories to classify units, standardise suites, and establish occupancy ceilings.
            </p>
            {isOwner && (
              <button
                onClick={() => { setEditTarget(null); setModalOpen(true); }}
                className="mt-5 inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#16231E] hover:bg-[#253B33] transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Category</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {roomTypes.map((rt) => (
              <div
                key={rt.room_type_id}
                className="group relative bg-white border border-[#E6DFD5] hover:border-[#8A6240]/40 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-6"
              >
                {/* Header: ID + Tier */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-[#F4EFEA] flex items-center justify-center text-[#8A6240]">
                      <Grid className="w-5 h-5" />
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${occupancyBadgeStyle(rt.max_occupancy)}`}>
                      {occupancyTierLabel(rt.max_occupancy)}
                    </span>
                  </div>

                  {/* Name */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A857F]">
                      Category #{rt.room_type_id}
                    </p>
                    <h2 className="font-serif text-2xl font-normal text-[#16231E] leading-snug mt-1 group-hover:text-[#8A6240] transition-colors">
                      {rt.name}
                    </h2>
                  </div>
                </div>

                {/* Occupancy Card */}
                <div className="space-y-4 pt-4 border-t border-[#F4EFEA]">
                  <div className="flex items-center space-x-2.5 text-xs text-[#5A635F] bg-[#FBF9F5] rounded-2xl px-4 py-3 border border-[#E6DFD5]/60">
                    <Users className="w-4 h-4 text-[#8A6240] shrink-0" />
                    <span className="font-light">
                      Capacity for up to <strong className="font-semibold text-[#16231E]">{rt.max_occupancy} guests</strong>
                    </span>
                  </div>

                  {/* Actions (Owner Only) */}
                  {isOwner && (
                    <div className="flex items-center space-x-2 pt-2">
                      <button
                        onClick={() => { setEditTarget(rt); setModalOpen(true); }}
                        className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#16231E] bg-[#F4EFEA] hover:bg-[#EDE8E1] border border-[#E6DFD5] transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#8A6240]" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(rt)}
                        className="inline-flex items-center justify-center p-2.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors cursor-pointer"
                        title="Delete category"
                        aria-label="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <RoomTypeModal
          isOpen={modalOpen}
          roomType={editTarget}
          onSave={handleSave}
          onDismiss={() => { setModalOpen(false); setEditTarget(null); }}
          isLoading={isSaving}
        />

        <ConfirmDeleteDialog
          isOpen={!!deleteTarget}
          title="Delete Room Type"
          description={
            deleteTarget
              ? `Delete room category "${deleteTarget.name}"? This action will be rejected if the category is assigned to active rooms or rate schedules.`
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

export default ManageRoomTypes;
