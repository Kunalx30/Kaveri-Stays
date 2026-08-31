import React, { useState, useEffect, useCallback } from 'react';
import { Hotel, Plus, Pencil, Trash2, RefreshCw, Loader2, Star, MapPin, Sparkles } from 'lucide-react';
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

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getPropertiesApi();
      setProperties(data || []);
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

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1E1C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        
        {/* ── Page Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#E6DFD5]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4EFEA] border border-[#E6DFD5] text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A6240]">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Resort Portfolio</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#16231E]">
              Resort Properties
            </h1>
            <p className="text-sm text-[#5A635F] font-light max-w-2xl leading-relaxed">
              {isOwner
                ? 'Oversee luxury resort destinations, manage branding details, star tiers, and regional locations.'
                : `View and maintain operational details for your assigned property (Property #${user?.property_id}).`}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
            <button
              onClick={fetchProperties}
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#16231E] bg-white hover:bg-[#F4EFEA] border border-[#E6DFD5] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Refresh properties"
              aria-label="Refresh properties"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {isOwner && (
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#16231E] hover:bg-[#253B33] transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Property</span>
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
              Loading properties...
            </p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-[#D8D0C5] bg-[#FBF7EF]">
            <div className="w-20 h-20 rounded-3xl bg-white border border-[#E6DFD5] flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Hotel className="w-9 h-9 text-[#8A6240]" />
            </div>
            <p className="font-serif text-2xl font-normal text-[#16231E]">No Properties Found</p>
            <p className="text-sm text-[#5A635F] mt-1 font-light max-w-md mx-auto">
              {isOwner
                ? 'Add your first resort destination to begin configuring rooms, categories, and rates.'
                : 'No property is currently linked to your management account.'}
            </p>
            {isOwner && (
              <button
                onClick={handleOpenCreate}
                className="mt-5 inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#16231E] hover:bg-[#253B33] transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Property</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop) => (
              <div
                key={prop.property_id}
                className="group relative bg-white border border-[#E6DFD5] hover:border-[#8A6240]/40 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-6"
              >
                {/* Header Badge & Rating */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F4EFEA] border border-[#E6DFD5] text-[10px] font-bold uppercase tracking-wider text-[#8A6240]">
                      Property #{prop.property_id}
                    </span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= prop.star_rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-[#E6DFD5] fill-[#E6DFD5]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Property Name & City */}
                  <div>
                    <h2 className="font-serif text-2xl font-normal text-[#16231E] leading-snug group-hover:text-[#8A6240] transition-colors">
                      {prop.name}
                    </h2>
                    <div className="flex items-center space-x-1.5 text-xs text-[#5A635F] mt-2">
                      <MapPin className="w-3.5 h-3.5 text-[#8A6240] shrink-0" />
                      <span>{prop.city}</span>
                    </div>
                  </div>
                </div>

                {/* Status and Actions footer */}
                <div className="space-y-4 pt-4 border-t border-[#F4EFEA]">
                  <div className="flex items-center justify-between text-xs text-[#7A857F]">
                    <span className="font-light">{prop.star_rating}-Star Luxury Rating</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B4D3E] bg-[#EAF3EE] px-2 py-0.5 rounded-full border border-[#CDE3D6]">
                      Active
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      onClick={() => handleOpenEdit(prop)}
                      className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#16231E] bg-[#F4EFEA] hover:bg-[#EDE8E1] border border-[#E6DFD5] transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#8A6240]" />
                      <span>Edit Property</span>
                    </button>

                    {isOwner && (
                      <button
                        onClick={() => setDeleteTarget(prop)}
                        className="inline-flex items-center justify-center p-2.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors cursor-pointer"
                        title="Delete property"
                        aria-label="Delete property"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <PropertyModal
          isOpen={modalOpen}
          property={editTarget}
          onSave={handleSave}
          onDismiss={() => { setModalOpen(false); setEditTarget(null); }}
          isLoading={isSaving}
        />

        <ConfirmDeleteDialog
          isOpen={!!deleteTarget}
          title="Delete Property"
          description={
            deleteTarget
              ? `Are you sure you want to delete "${deleteTarget.name}"? This action is irreversible and will be blocked if the property contains active room units.`
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

export default ManageProperties;
