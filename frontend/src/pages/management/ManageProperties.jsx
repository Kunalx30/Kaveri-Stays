import React, { useState, useEffect, useCallback } from 'react';
import { Hotel, Plus, Pencil, Trash2, RefreshCw, Loader2, Star, MapPin } from 'lucide-react';
import {
  getPropertiesApi,
  createPropertyApi,
  updatePropertyApi,
  deletePropertyApi,
} from '../../api/properties';
import { useAuth } from '../../context/AuthContext';
import ManagementNav from '../../components/management/ManagementNav';
import PropertyModal from '../../components/management/PropertyModal';
import ConfirmDeleteDialog from '../../components/management/ConfirmDeleteDialog';
import ErrorMessage from '../../components/common/ErrorMessage';

const ManageProperties = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create, object = edit

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getPropertiesApi();
      setProperties(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load properties.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleOpenCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (property) => {
    setEditTarget(property);
    setModalOpen(true);
  };

  const handleSave = async (payload) => {
    setIsSaving(true);
    try {
      if (editTarget) {
        await updatePropertyApi(editTarget.property_id, payload);
      } else {
        await createPropertyApi(payload);
      }
      setModalOpen(false);
      setEditTarget(null);
      fetchProperties();
    } catch (err) {
      throw err; // Let modal display the error
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deletePropertyApi(deleteTarget.property_id);
      setDeleteTarget(null);
      fetchProperties();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete property. It may have associated rooms.');
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const starColor = (rating) => {
    if (rating >= 5) return 'text-amber-500';
    if (rating >= 4) return 'text-amber-400';
    if (rating >= 3) return 'text-yellow-400';
    return 'text-slate-300';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Hotel className="w-4 h-4" />
            <span>Property Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Resort Properties
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isOwner
              ? 'Create, edit, or remove properties across all resort destinations.'
              : `View and update your assigned property (Property #${user?.property_id}).`}
          </p>
        </div>
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={fetchProperties}
            disabled={isLoading}
            className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {isOwner && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Property</span>
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
          <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
            <Hotel className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-lg font-bold text-slate-800">No properties found</p>
          <p className="text-sm text-slate-500 mt-1">
            {isOwner ? 'Create your first property to get started.' : 'No property is assigned to your account.'}
          </p>
          {isOwner && (
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Create Property
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((prop) => (
            <div
              key={prop.property_id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow space-y-3"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Property #{prop.property_id}
                  </p>
                  <h2 className="text-base font-black text-slate-900 leading-tight truncate mt-0.5">
                    {prop.name}
                  </h2>
                </div>
                <div className="flex items-center space-x-1 shrink-0">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${s <= prop.star_rating ? `fill-current ${starColor(prop.star_rating)}` : 'text-slate-200 fill-current'}`}
                    />
                  ))}
                </div>
              </div>

              {/* City */}
              <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{prop.city}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(prop)}
                  className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer border border-blue-100"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                {isOwner && (
                  <button
                    onClick={() => setDeleteTarget(prop)}
                    className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer border border-red-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Property Create/Edit Modal */}
      <PropertyModal
        isOpen={modalOpen}
        property={editTarget}
        onSave={handleSave}
        onDismiss={() => {
          setModalOpen(false);
          setEditTarget(null);
        }}
        isLoading={isSaving}
      />

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        isOpen={!!deleteTarget}
        title="Delete Property"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone. Deletion is blocked if the property has associated rooms.`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ManageProperties;
