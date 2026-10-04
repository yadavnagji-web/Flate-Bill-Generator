import React, { useState } from 'react';
import { Building, Flat, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { generatePresetFlats } from '../utils/storage';
import {
  Building2,
  Users,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Phone,
  Hash,
} from 'lucide-react';

interface FlatsManagerViewProps {
  building: Building;
  flats: Flat[];
  language: Language;
  onUpdateBuilding: (b: Building) => void;
  onAddFlat: (flat: Flat) => void;
  onUpdateFlat: (flat: Flat) => void;
  onDeleteFlat: (flatId: string) => void;
  onBatchGenerateFlats: (count: number) => void;
}

export const FlatsManagerView: React.FC<FlatsManagerViewProps> = ({
  building,
  flats,
  language,
  onUpdateBuilding,
  onAddFlat,
  onUpdateFlat,
  onDeleteFlat,
  onBatchGenerateFlats,
}) => {
  const t = getTranslation(language);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Building Edit Modal
  const [isEditingBuilding, setIsEditingBuilding] = useState<boolean>(false);
  const [bldName, setBldName] = useState<string>(building.name);
  const [bldAddress, setBldAddress] = useState<string>(building.address);
  const [bldOwner, setBldOwner] = useState<string>(building.ownerName);
  const [bldMobile, setBldMobile] = useState<string>(building.ownerMobile);

  // Flat Add/Edit Modal
  const [isFlatModalOpen, setIsFlatModalOpen] = useState<boolean>(false);
  const [editingFlatId, setEditingFlatId] = useState<string | null>(null);
  const [flatNumber, setFlatNumber] = useState<string>('');
  const [tenantName, setTenantName] = useState<string>('');
  const [tenantMobile, setTenantMobile] = useState<string>('');
  const [subMeterNumber, setSubMeterNumber] = useState<string>('');
  const [prevReading, setPrevReading] = useState<number>(0);
  const [currReading, setCurrReading] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Custom preset count input
  const [customPresetCount, setCustomPresetCount] = useState<number>(10);

  // Filter flats belonging to current building
  const buildingFlats = flats.filter((f) => f.buildingId === building.id);

  const filteredFlats = buildingFlats.filter((f) => {
    const matchSearch =
      f.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.subMeterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.tenantMobile.includes(searchTerm);

    const matchStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? f.isActive
        : !f.isActive;

    return matchSearch && matchStatus;
  });

  const activeCount = buildingFlats.filter((f) => f.isActive).length;

  const handleOpenAddFlat = () => {
    setEditingFlatId(null);
    setFlatNumber('');
    setTenantName('');
    setTenantMobile('');
    setSubMeterNumber(`SM-${building.id.slice(0, 3)}-${buildingFlats.length + 101}`);
    setPrevReading(0);
    setCurrReading(0);
    setIsActive(true);
    setIsFlatModalOpen(true);
  };

  const handleOpenEditFlat = (flat: Flat) => {
    setEditingFlatId(flat.id);
    setFlatNumber(flat.flatNumber);
    setTenantName(flat.tenantName);
    setTenantMobile(flat.tenantMobile);
    setSubMeterNumber(flat.subMeterNumber);
    setPrevReading(flat.previousReading);
    setCurrReading(flat.currentReading);
    setIsActive(flat.isActive);
    setIsFlatModalOpen(true);
  };

  const handleSaveFlat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatNumber.trim()) return;

    if (editingFlatId) {
      const existing = flats.find((f) => f.id === editingFlatId);
      if (existing) {
        onUpdateFlat({
          ...existing,
          flatNumber: flatNumber.trim(),
          tenantName: tenantName.trim() || `Resident ${flatNumber}`,
          tenantMobile: tenantMobile.trim(),
          subMeterNumber: subMeterNumber.trim() || `SM-${flatNumber}`,
          previousReading: Number(prevReading) || 0,
          currentReading: Number(currReading) || 0,
          isActive,
        });
      }
    } else {
      const newFlat: Flat = {
        id: `flat_${building.id}_${Date.now()}_${flatNumber}`,
        buildingId: building.id,
        flatNumber: flatNumber.trim(),
        tenantName: tenantName.trim() || `Resident ${flatNumber}`,
        tenantMobile: tenantMobile.trim(),
        subMeterNumber: subMeterNumber.trim() || `SM-${flatNumber}`,
        previousReading: Number(prevReading) || 0,
        currentReading: Number(currReading) || 0,
        isActive,
      };
      onAddFlat(newFlat);
    }
    setIsFlatModalOpen(false);
  };

  const handleSaveBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBuilding({
      ...building,
      name: bldName.trim() || building.name,
      address: bldAddress.trim() || building.address,
      ownerName: bldOwner.trim() || building.ownerName,
      ownerMobile: bldMobile.trim() || building.ownerMobile,
    });
    setIsEditingBuilding(false);
  };

  return (
    <div className="space-y-5 pb-24 max-w-5xl mx-auto">
      {/* Building Information Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                Building Setup
              </span>
              <span className="text-xs text-slate-400">
                {activeCount} Active / {buildingFlats.length} Total Flats
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">{building.name}</h2>
            <p className="text-xs text-slate-300">{building.address}</p>
            <div className="text-xs text-slate-400 flex items-center gap-3 pt-1">
              <span>Manager: <strong className="text-slate-200">{building.ownerName}</strong></span>
              <span>•</span>
              <span>Mobile: <strong className="text-slate-200">{building.ownerMobile}</strong></span>
            </div>
          </div>

          <button
            onClick={() => {
              setBldName(building.name);
              setBldAddress(building.address);
              setBldOwner(building.ownerName);
              setBldMobile(building.ownerMobile);
              setIsEditingBuilding(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Edit Building Info</span>
          </button>
        </div>
      </div>

      {/* Dynamic Flats Preset Selector (Section 1: 5, 8, 10, 12, 20 or custom flats) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Variable Flats Setup (डू नॉट हार्ड-कोड 8 फ्लैट्स)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Instantly configure any number of flats for this building:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[5, 8, 10, 12, 20].map((count) => (
              <button
                key={count}
                onClick={() => {
                  if (
                    confirm(
                      `Generate ${count} flats for this building? Existing flats will be reset to ${count} sub-meters.`
                    )
                  ) {
                    onBatchGenerateFlats(count);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  buildingFlats.length === count
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                }`}
              >
                {count} Flats
              </button>
            ))}

            <div className="flex items-center gap-1 pl-2">
              <input
                type="number"
                min="1"
                max="100"
                value={customPresetCount}
                onChange={(e) => setCustomPresetCount(parseInt(e.target.value) || 1)}
                className="w-12 bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-xs text-center text-white"
              />
              <button
                onClick={() => {
                  if (
                    confirm(
                      `Generate ${customPresetCount} custom flats for this building?`
                    )
                  ) {
                    onBatchGenerateFlats(customPresetCount);
                  }
                }}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
              >
                Set Custom
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Flats Search, Filter & Add Button Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search flat number, tenant, or meter number..."
            className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none"
          >
            <option value="all">All Status ({buildingFlats.length})</option>
            <option value="active">Active Only ({activeCount})</option>
            <option value="inactive">Inactive Only ({buildingFlats.length - activeCount})</option>
          </select>

          <button
            onClick={handleOpenAddFlat}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addFlat}</span>
          </button>
        </div>
      </div>

      {/* Flats Grid / Card List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredFlats.map((flat) => (
          <div
            key={flat.id}
            className={`border rounded-2xl p-4 shadow-sm transition space-y-3 ${
              flat.isActive
                ? 'bg-slate-900 border-slate-800'
                : 'bg-slate-950 border-slate-900 opacity-75'
            }`}
          >
            {/* Top row: Flat number, active toggle, actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
                  Flat {flat.flatNumber}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    flat.isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {flat.isActive ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" /> Inactive
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    onUpdateFlat({
                      ...flat,
                      isActive: !flat.isActive,
                    })
                  }
                  title="Toggle Active / Inactive"
                  className="text-slate-400 hover:text-cyan-400 p-1"
                >
                  {flat.isActive ? (
                    <ToggleRight className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-slate-500" />
                  )}
                </button>
                <button
                  onClick={() => handleOpenEditFlat(flat)}
                  className="text-slate-400 hover:text-slate-200 p-1"
                  title="Edit Flat"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete Flat ${flat.flatNumber}?`)) {
                      onDeleteFlat(flat.id);
                    }
                  }}
                  className="text-slate-400 hover:text-red-400 p-1"
                  title="Delete Flat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tenant details */}
            <div className="space-y-1 text-xs">
              <div className="font-semibold text-slate-200 truncate">
                {flat.tenantName}
              </div>
              <div className="text-slate-400 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-cyan-400" />
                <span>{flat.tenantMobile || 'No phone entered'}</span>
              </div>
              <div className="text-slate-400 flex items-center gap-1.5">
                <Hash className="w-3 h-3 text-amber-400" />
                <span>Sub-meter: {flat.subMeterNumber}</span>
              </div>
            </div>

            {/* Meter Readings Snapshot */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Prev: <strong className="text-slate-300">{flat.previousReading}</strong></span>
              <span>Curr: <strong className="text-cyan-300">{flat.currentReading}</strong></span>
              <span>
                Diff:{' '}
                <strong className="text-emerald-400">
                  {Math.max(0, flat.currentReading - flat.previousReading)} U
                </strong>
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredFlats.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-xs">
          No flats found matching your search.
        </div>
      )}

      {/* Edit Building Modal */}
      {isEditingBuilding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveBuilding}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white">Edit Building Information</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Building Name</label>
                <input
                  type="text"
                  required
                  value={bldName}
                  onChange={(e) => setBldName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={bldAddress}
                  onChange={(e) => setBldAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Owner / Manager Name</label>
                <input
                  type="text"
                  value={bldOwner}
                  onChange={(e) => setBldOwner(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Owner Mobile Number</label>
                <input
                  type="text"
                  value={bldMobile}
                  onChange={(e) => setBldMobile(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingBuilding(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow"
              >
                Save Building
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Flat Modal */}
      {isFlatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveFlat}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white">
              {editingFlatId ? 'Edit Flat Details' : 'Add New Flat'}
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">* Flat Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 101"
                  value={flatNumber}
                  onChange={(e) => setFlatNumber(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Sub-meter No.</label>
                <input
                  type="text"
                  placeholder="SM-101"
                  value={subMeterNumber}
                  onChange={(e) => setSubMeterNumber(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">Tenant / Resident Name</label>
                <input
                  type="text"
                  placeholder="e.g. Resident Name"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-400 mb-1">Tenant Mobile Number (for WhatsApp)</label>
                <input
                  type="text"
                  placeholder="10-digit mobile number"
                  value={tenantMobile}
                  onChange={(e) => setTenantMobile(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Previous Meter Reading</label>
                <input
                  type="number"
                  value={prevReading}
                  onChange={(e) => setPrevReading(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Current Meter Reading</label>
                <input
                  type="number"
                  value={currReading}
                  onChange={(e) => setCurrReading(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div className="col-span-2 flex items-center justify-between p-2.5 bg-slate-850 rounded-xl border border-slate-750">
                <span className="text-slate-300 font-medium">Active Status (सक्रिय स्थिति)</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className="flex items-center gap-1.5 text-xs font-semibold"
                >
                  {isActive ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Active
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Inactive
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsFlatModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow"
              >
                {editingFlatId ? 'Update Flat' : 'Add Flat'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
