import React, { useEffect, useState } from 'react';
import PricingService from '../services/PricingService';
import SubscriptionPackageService from '../services/SubscriptionPackageService';

const fmtVND = (n) =>
  (n ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const statusBadge = (status) => {
  const s = (status || '').toUpperCase();
  const cls =
    s === 'ACTIVE' ? 'bg-success' : s === 'EXPIRED' ? 'bg-danger' : 'bg-secondary';
  const label =
    s === 'ACTIVE' ? 'Hoạt động' : s === 'EXPIRED' ? 'Hết hạn' : 'Không hoạt động';
  return <span className={`badge ${cls}`}>{label}</span>;
};

const PriceListDetailModal = ({ isOpen, onClose, priceList }) => {
  const [items, setItems] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ packageId: '', amount: '' });

  const priceListId =
    priceList?.priceListId || priceList?.id || priceList?.code || '';

  useEffect(() => {
    if (!isOpen || !priceListId) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        const [itemsRes, pkgsRes] = await Promise.all([
          PricingService.getPriceListItems(priceListId),
          SubscriptionPackageService.getAllPackages(),
        ]);
        const pkgs = Array.isArray(pkgsRes) ? [...pkgsRes] : [];
        // sắp xếp gói nếu có durationInDays
        pkgs.sort((a, b) => (a.durationInDays || 0) - (b.durationInDays || 0));

        setItems(Array.isArray(itemsRes) ? itemsRes : []);
        setPackages(pkgs);
      } catch (e) {
        console.error('Load data error:', e);
        setItems([]);
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };

    // reset form + lỗi khi mở
    setForm({ packageId: '', amount: '' });
    setErrors({});
    fetchAll();
  }, [isOpen, priceListId]);

  if (!isOpen || !priceList) return null;

  const onChangeField = (field, value) => {
    setForm((s) => ({ ...s, [field]: value }));
  };

  const validateAdd = () => {
    const e = {};
    if (!form.packageId) e.packageId = 'Chọn gói';
    const amountNum = Number(String(form.amount).replace(/[^\d.-]/g, ''));
    if (!Number.isFinite(amountNum) || amountNum <= 0) e.amount = 'Số tiền phải > 0';

    const exist = items.some((it) => it.packageId === form.packageId);
    if (exist) e.packageId = 'Gói này đã có trong bảng giá';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validateAdd()) return;

    const amountNum = Number(String(form.amount).replace(/[^\d.-]/g, ''));

    try {
      setAdding(true);
      await PricingService.addPriceItem({
        priceListId,
        packageId: form.packageId,
        amount: amountNum,
      });

      const data = await PricingService.getPriceListItems(priceListId);
      setItems(Array.isArray(data) ? data : []);

      setForm({ packageId: '', amount: '' });
      setErrors({});
    } catch (err) {
      console.error('Add item error:', err);
      setErrors((prev) => ({
        ...prev,
        _global: 'Thêm thất bại. Gói đã tồn tại trong bảng giá khác.',
      }));
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} />
      <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">

            <div className="modal-header">
              <h5 className="modal-title">
                Chi tiết bảng giá: {priceList.name ?? priceList.priceListName ?? priceListId}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">
              {priceList?.status === 'EXPIRED' && (
                <div className="alert alert-warning py-2">
                  Bảng giá đã hết hạn — không thể thêm/chỉnh sửa mục giá.
                </div>
              )}
              {errors._global && <div className="alert alert-danger">{errors._global}</div>}

              {/* THÔNG TIN CHUNG (đẩy từ list vào detail) */}
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="p-3 border rounded h-100">
                    <div className="fw-semibold text-muted mb-1">ID</div>
                    <div className="fs-6" title={priceListId}>{priceListId || '—'}</div>

                    <div className="fw-semibold text-muted mt-3 mb-1">Tên bảng giá</div>
                    <div className="fs-6">{priceList.name ?? priceList.priceListName ?? '—'}</div>

                    <div className="fw-semibold text-muted mt-3 mb-1">Trạng thái</div>
                    <div className="fs-6">{statusBadge(priceList.status)}</div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 border rounded h-100">
                    <div className="fw-semibold text-muted mb-1">Ngày tạo</div>
                    <div className="fs-6" title={priceList.createdAt || ''}>
                      {priceList.createdAt || '—'}
                    </div>

                    <div className="fw-semibold text-muted mt-3 mb-1">Ngày bắt đầu</div>
                    <div className="fs-6" title={priceList.startDate || ''}>
                      {priceList.startDate || '—'}
                    </div>

                    <div className="fw-semibold text-muted mt-3 mb-1">Ngày kết thúc</div>
                    <div className="fs-6" title={priceList.endDate || ''}>
                      {priceList.endDate || '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* FORM THÊM ITEM */}
              <form onSubmit={handleAdd} className="mb-3">
                <div className="row g-3 align-items-end">
                  <div className="col-md-6">
                    <label className="form-label">Gói</label>
                    <select
                      className={`form-select ${errors.packageId ? 'is-invalid' : ''}`}
                      value={form.packageId}
                      onChange={(e) => onChangeField('packageId', e.target.value)}
                      disabled={loading || priceList?.status === 'EXPIRED'}
                    >
                      <option value="">-- Chọn gói --</option>
                      {packages.map((p) => (
                        <option key={p.packageId} value={p.packageId}>
                          {p.packageName ?? p.name ?? p.packageId ?? p.id}
                        </option>
                      ))}
                    </select>
                    {errors.packageId && (
                      <div className="invalid-feedback">{errors.packageId}</div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Số tiền (VND)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={`form-control ${errors.amount ? 'is-invalid' : ''}`}
                      placeholder="VD: 119000"
                      value={form.amount}
                      onChange={(e) => onChangeField('amount', e.target.value)}
                      disabled={priceList?.status === 'EXPIRED'}
                    />
                    {errors.amount && (
                      <div className="invalid-feedback">{errors.amount}</div>
                    )}
                  </div>

                  <div className="col-md-2 d-grid">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={adding || loading || priceList?.status === 'EXPIRED'}
                    >
                      {adding ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Thêm
                        </>
                      ) : (
                        'Thêm'
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* BẢNG ITEMS */}
              <div className="table-responsive">
                <table className="table table-striped table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Tên gói</th>
                      <th style={{ width: 180 }}>Số tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted">Đang tải...</td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted">Chưa có mục giá</td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.packageId}>
                          <td>{item.packageName ?? item.packageId}</td>
                          <td>{fmtVND(item.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {!loading && (
                    <tfoot>
                      <tr>
                        <td className="fw-semibold">Tổng số mục giá</td>
                        <td className="fw-semibold">{items.length}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default PriceListDetailModal;
