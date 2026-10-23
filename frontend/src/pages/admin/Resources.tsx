/**
 * Page 6 — Resources & Inventory Command
 * Strict inventory ledger adhering to Available = On-hand − Reserved − Unavailable formula,
 * stock reservation modal, movements ledger, and threshold breach alerts.
 */
import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { ResourceInventoryItem, ResourceMovementRecord } from '../../types/admin';
import { LoadingState } from '../../components/admin/LoadingState';
import { EmptyState } from '../../components/admin/EmptyState';
import {
  Package,
  Search,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Layers,
  History,
  ShieldAlert,
} from 'lucide-react';

export const Resources: React.FC = () => {
  const [resources, setResources] = useState<ResourceInventoryItem[]>([]);
  const [movements, setMovements] = useState<ResourceMovementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Reservation modal state
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<ResourceInventoryItem | null>(null);
  const [reserveQty, setReserveQty] = useState<number>(1);
  const [reserveTaskId, setReserveTaskId] = useState<string>('102');
  const [reserveNotes, setReserveNotes] = useState<string>('');
  const [reserveError, setReserveError] = useState<string>('');

  const loadResources = async () => {
    setLoading(true);
    try {
      const [resRes, movRes] = await Promise.all([
        adminApi.getResources(),
        adminApi.getResourceMovements(),
      ]);
      setResources(resRes.data);
      setMovements(movRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;
    if (reserveQty <= 0) {
      setReserveError('Quantity must be greater than zero.');
      return;
    }
    if (reserveQty > selectedResource.available) {
      setReserveError(
        `Cannot reserve ${reserveQty} ${selectedResource.unit}. Only ${selectedResource.available} available.`
      );
      return;
    }

    setReserveError('');
    try {
      await adminApi.reserveResource(
        selectedResource.id,
        reserveQty,
        Number(reserveTaskId) || undefined,
        reserveNotes
      );
      setShowReserveModal(false);
      setSelectedResource(null);
      setReserveQty(1);
      setReserveNotes('');
      await loadResources();
    } catch (err) {
      setReserveError(err instanceof Error ? err.message : 'Reservation failed');
    }
  };

  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      searchQuery === '' ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.storage_location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = filterCategory === 'all' || r.category === filterCategory;
    const matchesStat = filterStatus === 'all' || r.status === filterStatus;

    return matchesSearch && matchesCat && matchesStat;
  });

  const lowStockCount = resources.filter((r) => r.status === 'low_stock' || r.status === 'out_of_stock').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
            Resources & Inventory Command
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Strict physical stock ledger: Available = On Hand − Reserved − Unavailable. Threshold monitoring & transactional locks.
          </p>
        </div>
      </div>

      {/* Critical Stock Alerts */}
      {lowStockCount > 0 && (
        <div style={{ padding: '14px 18px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} className="text-red-600" />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#991b1b' }}>
                Stock Threshold Alerts ({lowStockCount} items below safety minimum)
              </div>
              <div style={{ fontSize: '12px', color: '#b91c1c' }}>
                Handpump Heavy Repair Kits (0 available) and Tarpaulins (10 available vs 25 threshold) require immediate replenishment.
              </div>
            </div>
          </div>
          <button
            onClick={() => setFilterStatus('low_stock')}
            className="btn btn-danger btn-sm"
          >
            Filter Critical Items
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by resource name, warehouse bay, or SKU..."
            className="input-field"
            style={{ paddingLeft: '32px', height: '34px', fontSize: '12.5px' }}
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="input-field"
          style={{ width: '160px', height: '34px', fontSize: '12px' }}
        >
          <option value="all">All Categories</option>
          <option value="food_ration">Food Rations</option>
          <option value="medical_supplies">Medical Supplies</option>
          <option value="water_sanitation">Water & Sanitation</option>
          <option value="equipment_tools">Equipment & Tools</option>
          <option value="vehicles">Vehicles</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-field"
          style={{ width: '140px', height: '34px', fontSize: '12px' }}
        >
          <option value="all">All Statuses</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {/* Main Inventory Table */}
      <div className="socio-card" style={{ padding: '0' }}>
        {loading ? (
          <LoadingState message="Connecting to inventory ledger..." />
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Resource / Item</th>
                  <th>Category</th>
                  <th>Department Owner</th>
                  <th>On Hand</th>
                  <th>Reserved</th>
                  <th>Unavailable</th>
                  <th style={{ color: '#0284c7' }}>Available Stock</th>
                  <th>Safety Min</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map((res) => {
                  const isZero = res.available === 0;
                  const isBelowMin = res.available < res.minimum_threshold;

                  return (
                    <tr key={res.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{res.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>SKU: {res.id}</div>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{res.category.replace(/_/g, ' ')}</td>
                      <td>{res.department_name}</td>
                      <td>{res.on_hand} {res.unit}</td>
                      <td style={{ color: res.reserved > 0 ? '#f59e0b' : '#64748b', fontWeight: res.reserved > 0 ? 600 : 400 }}>
                        {res.reserved} {res.unit}
                      </td>
                      <td style={{ color: res.unavailable > 0 ? '#ef4444' : '#64748b' }}>
                        {res.unavailable} {res.unit}
                      </td>
                      <td style={{ fontWeight: 800, fontSize: '14px', color: isZero ? '#ef4444' : isBelowMin ? '#f59e0b' : '#0284c7' }}>
                        {res.available} {res.unit}
                      </td>
                      <td>{res.minimum_threshold} {res.unit}</td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>{res.storage_location}</td>
                      <td>
                        {res.status === 'out_of_stock' ? (
                          <span className="badge badge-high" style={{ fontSize: '10.5px' }}>Out of Stock</span>
                        ) : res.status === 'low_stock' ? (
                          <span className="badge badge-medium" style={{ fontSize: '10.5px' }}>Low Stock</span>
                        ) : (
                          <span className="badge badge-success" style={{ fontSize: '10.5px' }}>In Stock</span>
                        )}
                      </td>
                      <td>
                        <button
                          disabled={res.available === 0}
                          onClick={() => {
                            setSelectedResource(res);
                            setShowReserveModal(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11.5px' }}
                        >
                          <Plus size={12} /> Reserve
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Movements Ledger */}
      <div className="socio-card">
        <div className="socio-card-header">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Recent Stock Movements & Allocations</h3>
            <p style={{ fontSize: '12px', color: '#64748b' }}>Transactional ledger tracking stock reservations, dispatches, and handovers</p>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Resource Name</th>
                <th>Action Type</th>
                <th>Quantity</th>
                <th>Linked Task</th>
                <th>Authorized Actor</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((mov) => (
                <tr key={mov.id}>
                  <td style={{ fontSize: '12px', color: '#64748b' }}>
                    {new Date(mov.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(mov.timestamp).toLocaleDateString()}
                  </td>
                  <td style={{ fontWeight: 600 }}>{mov.resource_name}</td>
                  <td>
                    <span className="badge badge-low" style={{ fontSize: '10.5px', textTransform: 'capitalize' }}>
                      {mov.movement_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#0284c7' }}>{mov.quantity}</td>
                  <td>{mov.task_id ? `Task #${mov.task_id}` : 'General Allocation'}</td>
                  <td>{mov.actor_name}</td>
                  <td style={{ fontSize: '12px', color: '#475569' }}>{mov.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resource Reservation Modal */}
      {showReserveModal && selectedResource && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Reserve Inventory Stock</h3>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Transactional lock preventing double-allocation</p>
              </div>
              <button onClick={() => setShowReserveModal(false)} className="btn btn-secondary btn-sm">✕</button>
            </div>

            {reserveError && (
              <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '12px', marginBottom: '12px' }}>
                {reserveError}
              </div>
            )}

            <form onSubmit={handleReserveSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
                  <div>Item: <strong>{selectedResource.name}</strong></div>
                  <div>Warehouse: <strong>{selectedResource.storage_location}</strong></div>
                  <div style={{ color: '#0284c7', marginTop: '4px' }}>
                    Currently Available: <strong>{selectedResource.available} {selectedResource.unit}</strong>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Quantity to Reserve ({selectedResource.unit}) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedResource.available}
                    value={reserveQty}
                    onChange={(e) => setReserveQty(Number(e.target.value))}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Link to Operational Task ID
                  </label>
                  <input
                    type="number"
                    value={reserveTaskId}
                    onChange={(e) => setReserveTaskId(e.target.value)}
                    placeholder="e.g. 102"
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Reservation Purpose / Handover Notes
                  </label>
                  <textarea
                    value={reserveNotes}
                    onChange={(e) => setReserveNotes(e.target.value)}
                    placeholder="State courier driver name or handover purpose..."
                    rows={2}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowReserveModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Lock & Reserve Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
