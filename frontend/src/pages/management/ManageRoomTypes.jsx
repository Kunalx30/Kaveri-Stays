import React, { useState, useEffect, useCallback } from 'react';
import { Grid, Plus, Pencil, Trash2, RefreshCw, Loader2, Users } from 'lucide-react';
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
      setRoomTypes(data);
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

  const occupancyColor = (n) => {
    if (n >= 6) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (n >= 4) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Grid className="w-4 h-4" />
            <span>Room Types Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Global Room Categories
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage room type classifications shared across all resort properties.
            {!isOwner && ' View-only for non-owner roles.'}
          </p>
        </div>
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={fetchRoomTypes}
            disabled={isLoading}
            className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {isOwner && (
            <button
              onClick={() => { setEditTarget(null); setModalOpen(true); }}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Room Type</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Navigation */}
      <ManagementNav />

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
        </div>
      ) : roomTypes.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4">
            <Grid className="w-8 h-8 text-indigo-400" />
          </div>
          <p className="text-lg font-bold text-slate-800">No room types found</p>
          <p className="text-sm text-slate-500 mt-1">Create a global room type to get started.</p>
          {isOwner && (
            <button
              onClick={() => { setEditTarget(null); setModalOpen(true); }}
              className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Create Room Type
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {roomTypes.map((rt) => (
            <div
              key={rt.room_type_id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Grid className="w-4 h-4" />
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${occupancyColor(rt.max_occupancy)}`}>
                  Max {rt.max_occupancy}
                </span>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Type #{rt.room_type_id}
                </p>
                <h2 className="text-base font-black text-slate-900 leading-tight mt-0.5 truncate">
                  {rt.name}
                </h2>
              </div>

              <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Up to {rt.max_occupancy} guests</span>
              </div>

              {isOwner && (
                <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => { setEditTarget(rt); setModalOpen(true); }}
                    className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer border border-indigo-100"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(rt)}
                    className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer border border-red-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
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
            ? `Delete room type "${deleteTarget.name}"? This is blocked if it's referenced by rooms or rate plans.`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ManageRoomTypes;
