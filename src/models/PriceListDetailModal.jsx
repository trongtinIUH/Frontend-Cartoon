import React, { useEffect, useState } from 'react';
import PricingService from '../services/PricingService';
import SubscriptionPackageService from '../services/SubscriptionPackageService';

const fmtVND = (n) =>
    (n ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const toLocalDate = (d) => (d ? String(d).slice(0, 10) : "");

const PriceListDetailModal = ({ isOpen, onClose, priceList }) => {
    const [items, setItems] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
    const [errors, setErrors] = useState({});
    const [form, setForm] = useState({ packageId: '', amount: '' });

    const priceListId =
        priceList?.id || priceList?.priceListId || priceList?.code || '';

    useEffect(() => {
        if (!isOpen || !priceListId) return;

        const fetchAll = async () => {
            try {
                setLoading(true);
                const [itemsRes, pkgsRes] = await Promise.all([
                    PricingService.getPriceListItems(priceListId),
                    SubscriptionPackageService.getAllPackages(),
                ]);
                pkgsRes.sort((a, b) => a.durationInDays - b.durationInDays);
                setItems(Array.isArray(itemsRes) ? itemsRes : []);
                setPackages(Array.isArray(pkgsRes) ? pkgsRes : []);
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
            setErrors((prev) => ({ ...prev, _global: 'Thêm thất bại. Gói đã tồn tại trong bảng giá khác.' }));
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
                                Chi tiết bảng giá: {priceList.priceListName ?? priceList.name ?? priceListId}
                            </h5>
                            <button type="button" className="btn-close" onClick={onClose} />
                        </div>

                        <div className="modal-body">
                            {errors._global && <div className="alert alert-danger">{errors._global}</div>}

                            {/* FORM THÊM ITEM */}
                            <form onSubmit={handleAdd} className="mb-3">
                                <div className="row g-3 align-items-end">
                                    <div className="col-md-6">
                                        <label className="form-label">Gói</label>
                                        <select
                                            className={`form-select ${errors.packageId ? 'is-invalid' : ''}`}
                                            value={form.packageId}
                                            onChange={(e) => onChangeField('packageId', e.target.value)}
                                            disabled={loading}
                                        >
                                            <option value="">-- Chọn gói --</option>
                                            {packages.map((p) => (
                                                <option key={p.packageId} value={p.packageId}>
                                                    {p.packageId ?? p.name ?? p.id}
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
                                        />
                                        {errors.amount && (
                                            <div className="invalid-feedback">{errors.amount}</div>
                                        )}
                                    </div>

                                    <div className="col-md-2 d-grid">
                                        <button type="submit" className="btn btn-primary" disabled={adding || loading || priceList?.status === 'EXPIRED'}>
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
                                                <td colSpan={5} className="text-center text-muted">
                                                    Đang tải...
                                                </td>
                                            </tr>
                                        ) : items.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center text-muted">
                                                    Chưa có mục giá
                                                </td>
                                            </tr>
                                        ) : (
                                            items.map((item) => {
                                                return (
                                                    <tr key={item.packageId}>
                                                        <td>{item.packageName ?? item.packageId}</td>
                                                        <td>{fmtVND(item.amount)}</td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
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
