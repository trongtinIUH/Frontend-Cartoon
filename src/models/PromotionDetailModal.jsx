// PromotionDetailModal.jsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Select from "react-select";
import PromotionDetailService from "../services/PromotionDetailService";
import SubscriptionPackageService from "../services/SubscriptionPackageService";

const PromotionDetailModal = ({ open, onClose, promotion, onChanged }) => {
  const [selectedTab, setSelectedTab] = useState("VOUCHER"); // "VOUCHER" | "PACKAGE"

  // data
  const [vouchers, setVouchers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);

  // package master for showing content
  const [allPkgs, setAllPkgs] = useState([]);
  const pkgMap = useMemo(() => {
    const m = new Map();
    (allPkgs || []).forEach(p => m.set(p.packageId, p));
    return m;
  }, [allPkgs]);

  // forms/states reused from bản của bạn
  const [picking, setPicking] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [discount, setDiscount] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingVoucher, setSavingVoucher] = useState(false);
  const [editingVoucherCode, setEditingVoucherCode] = useState(null);
  const [editForm, setEditForm] = useState({
    discountType: "PERCENTAGE",
    discountValue: "",
    maxDiscountAmount: "",
    maxUsage: "",
    maxUsagePerUser: "",
    minOrderAmount: ""
  });
  const [voucherForm, setVoucherForm] = useState({
    voucherCode: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    maxDiscountAmount: "",
    maxUsage: "",
    maxUsagePerUser: "",
    minOrderAmount: ""
  });
  const [editingRowId, setEditingRowId] = useState(null);
  const [tempPercentPackage, setTempPercentPackage] = useState('');

  const fmtVND = (num) => (!num ? "0 đ" : `${Number(num).toLocaleString()} đ`);

  // load theo tab
  const loadTabData = async () => {
    if (!promotion?.promotionId) return;
    setLoading(true);
    try {
      if (selectedTab === "VOUCHER") {
        const data = await PromotionDetailService.getPromotionVouchers(promotion.promotionId);
        setVouchers(Array.isArray(data) ? data : []);
      } else {
        const data = await PromotionDetailService.getPromotionPackages(promotion.promotionId);
        setPackages(Array.isArray(data) ? data : []);
        if (allPkgs.length === 0) {
          const master = await SubscriptionPackageService.getAllPackages();
          setAllPkgs(master || []);
        }
      }
    } catch (e) {
      console.error("Load details failed:", e);
      toast.error("Không tải được danh sách chi tiết.");
      if (selectedTab === "VOUCHER") setVouchers([]);
      else setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && promotion?.promotionId) {
      loadTabData();
    }
  }, [open, promotion?.promotionId, selectedTab]);

  // ====== VOUCHER: edit helpers ======
  const startEditVoucher = (v) => {
    setEditingVoucherCode(v.voucherCode);
    setEditForm({
      discountType: (v.discountType || "PERCENTAGE").toUpperCase(),
      discountValue: Number(v.discountValue ?? 0),
      maxDiscountAmount: Number(
        (v.discountType || "").toUpperCase() === "FIXED_AMOUNT" ? v.discountValue ?? 0 : v.maxDiscountAmount ?? 0
      ),
      maxUsage: Number(v.maxUsage ?? 0),
      maxUsagePerUser: Number(v.maxUsagePerUser ?? 0),
      minOrderAmount: Number(v.minOrderAmount ?? 0),
    });
  };
  const cancelEditVoucher = () => {
    setEditingVoucherCode(null);
    setEditForm({
      discountType: "PERCENTAGE",
      discountValue: "",
      maxDiscountAmount: "",
      maxUsage: "",
      maxUsagePerUser: "",
      minOrderAmount: ""
    });
  };
  const saveEditVoucher = async (v) => {
    const payload = {
      discountType: editForm.discountType,
      discountValue: Number(editForm.discountValue || 0),
      maxDiscountAmount: Number(editForm.discountType === "FIXED_AMOUNT" ? editForm.discountValue || 0 : editForm.maxDiscountAmount || 0),
      maxUsage: Number(editForm.maxUsage || 0),
      maxUsagePerUser: Number(editForm.maxUsagePerUser || 0),
      minOrderAmount: Number(editForm.minOrderAmount || 0),
    };
    // validate (giữ nguyên như bạn)
    if (!payload.discountValue || payload.discountValue <= 0) return toast.error("Giá trị giảm phải > 0.");
    if (payload.discountType === "PERCENTAGE" && (payload.discountValue < 1 || payload.discountValue > 100))
      return toast.error("Phần trăm giảm phải từ 1 đến 100.");
    if (payload.maxDiscountAmount < 0) return toast.error("Giảm tối đa phải ≥ 0.");
    if (payload.maxUsage <= 0) return toast.error("Tổng lượt sử dụng phải > 0.");
    if (payload.maxUsagePerUser < 0) return toast.error("Tối đa/user phải ≥ 0.");
    if (payload.maxUsagePerUser && payload.maxUsage && payload.maxUsagePerUser > payload.maxUsage)
      return toast.error("Tối đa/user phải ≤ Tổng lượt sử dụng.");
    if (payload.minOrderAmount < 0) return toast.error("Đơn tối thiểu phải ≥ 0.");
    if (payload.minOrderAmount <= payload.discountValue + 10000)
      return toast.error("Đơn tối thiểu phải lớn hơn giá trị giảm ít nhất 10,000đ.");
    if (payload.discountType === "PERCENTAGE" && (payload.minOrderAmount < payload.maxDiscountAmount + 10000))
      return toast.error("Đơn tối thiểu phải ≥ Giảm tối đa + 10,000đ.");

    try {
      setSavingVoucher(true);
      await PromotionDetailService.updatePromotionVoucher(promotion.promotionId, v.voucherCode, payload);
      toast.success("Cập nhật voucher thành công!");
      setEditingVoucherCode(null);
      await loadTabData(); // reload vouchers
      onChanged?.();
    } catch (e) {
      console.error("Update voucher failed:", e);
      toast.error(e?.response?.data || "Cập nhật voucher thất bại!");
    } finally {
      setSavingVoucher(false);
    }
  };
  const handleDeleteVoucher = async (voucherCode) => {
    try {
      if (!window.confirm("Bạn có chắc muốn xóa voucher này?")) return;
      await PromotionDetailService.deletePromotionVoucher(promotion.promotionId, voucherCode);
      toast.success("Xóa voucher thành công!");
      await loadTabData();
      onChanged?.();
    } catch (e) {
      console.error("Delete voucher failed:", e);
      toast.error("Xóa voucher thất bại!");
    }
  };
  const startCreateVoucher = () => {
    setPicking(true);
    setVoucherForm({
      voucherCode: "",
      discountType: "PERCENTAGE",
      discountValue: "",
      maxDiscountAmount: "",
      maxUsage: "",
      maxUsagePerUser: "",
      minOrderAmount: ""
    });
  };
  const handleSaveVoucher = async () => {
    const code = voucherForm.voucherCode.trim().toUpperCase();
    if (!code) return toast.error("Vui lòng nhập mã voucher.");
    if (vouchers.some(v => (v.voucherCode || "").toUpperCase() === code))
      return toast.error("Mã voucher đã tồn tại.");
    if (!voucherForm.discountType) return toast.error("Vui lòng chọn loại giảm.");
    if (!voucherForm.maxUsage || voucherForm.maxUsage <= 0) return toast.error("Tổng lượt sử dụng phải > 0.");
    if (!voucherForm.discountValue || voucherForm.discountValue <= 0) return toast.error("Giá trị giảm phải > 0.");
    if (!voucherForm.minOrderAmount || voucherForm.minOrderAmount < 0) return toast.error("Đơn tối thiểu phải >= 0.");
    if (voucherForm.maxDiscountAmount && voucherForm.maxDiscountAmount <= 0) return toast.error("Giảm tối đa phải >= 0.");
    if (voucherForm.discountType === "PERCENTAGE" && (voucherForm.discountValue < 1 || voucherForm.discountValue > 100))
      return toast.error("Phần trăm giảm phải từ 1 đến 100.");
    if (voucherForm.minOrderAmount <= Number(voucherForm.discountValue) + 10000)
      return toast.error("Đơn tối thiểu phải lớn hơn giá trị giảm ít nhất 10,000đ.");
    if (voucherForm.discountType === "PERCENTAGE" && (voucherForm.minOrderAmount < Number(voucherForm.maxDiscountAmount || 0) + 10000))
      return toast.error("Đơn tối thiểu phải ≥ Giảm tối đa + 10,000đ.");

    try {
      setSavingVoucher(true);
      await PromotionDetailService.createPromotionVoucher({
        promotionId: promotion.promotionId,
        voucherCode: code,
        discountType: voucherForm.discountType,
        discountValue: Number(voucherForm.discountValue),
        maxDiscountAmount: Number(voucherForm.maxDiscountAmount || 0),
        maxUsage: Number(voucherForm.maxUsage || 0),
        maxUsagePerUser: Number(voucherForm.maxUsagePerUser || 0),
        minOrderAmount: Number(voucherForm.minOrderAmount || 0)
      });
      toast.success("Tạo voucher thành công!");
      setPicking(false);
      await loadTabData();
      onChanged?.();
    } catch (e) {
      toast.error(e?.response?.data || "Tạo voucher thất bại!");
    } finally {
      setSavingVoucher(false);
    }
  };

  // ====== PACKAGE: edit helpers ======
  const rowKey = (x) => `${x.promotionId}__${Array.isArray(x.packageId) ? x.packageId.join('|') : x.packageId}`;
  const startEditPackage = (row) => {
    setEditingRowId(rowKey(row));
    setTempPercentPackage(row.discountPercent ?? 0);
  };
  const cancelEditPackage = () => {
    setEditingRowId(null);
    setTempPercentPackage('');
  };
  const onPercentKeyDown = (e, row) => {
    if (e.key === 'Enter') saveEditPackage(row);
    if (e.key === 'Escape') cancelEditPackage();
  };
  const saveEditPackage = async (row) => {
    const percentNum = Number(tempPercentPackage);
    if (!Number.isFinite(percentNum) || percentNum < 1 || percentNum > 90)
      return toast.error("Giảm giá phải từ 1% đến 90%");
    try {
      setSaving(true);
      const pkgs = Array.isArray(row.packageId) ? row.packageId : [row.packageId];
      await PromotionDetailService.updatePromotionPackage(row.promotionId, pkgs, percentNum);
      toast.success("Cập nhật gói khuyến mãi thành công!");
      setEditingRowId(null);
      setTempPercentPackage('');
      await loadTabData();
      onChanged?.();
    } catch (e) {
      console.error("Update promotion failed:", e);
      toast.error("Cập nhật gói khuyến mãi thất bại!");
    } finally {
      setSaving(false);
    }
  };
  const handleDeletePromotionPackage = async (pkgIds) => {
    try {
      if (!window.confirm("Bạn có chắc chắn muốn xóa gói khuyến mãi này?")) return;
      await PromotionDetailService.deletePromotionPackage(promotion.promotionId, pkgIds);
      toast.success("Xóa gói khuyến mãi thành công!");
      await loadTabData();
      onChanged?.();
    } catch (e) {
      console.error("Delete promotion failed:", e);
      toast.error("Xóa gói khuyến mãi thất bại!");
    }
  };

  // chọn gói + thêm khuyến mãi
  const availableOptions = useMemo(() => {
    const applied = new Set();
    (packages || []).forEach(p => {
      const ids = Array.isArray(p.packageId) ? p.packageId : [p.packageId];
      ids.forEach(id => id && applied.add(id));
    });
    return (allPkgs || [])
      .filter(pkg => pkg?.packageId && !applied.has(pkg.packageId))
      .map(pkg => ({ value: pkg.packageId, label: `${pkg.packageName ?? pkg.packageId} (${pkg.packageId})` }));
  }, [allPkgs, packages]);

  const startPick = () => {
    setPicking(true);
    setSelectedIds([]);
    setDiscount("");
  };
  const handleSavePackage = async () => {
    if (!selectedIds.length) return toast.error("Vui lòng chọn gói.");
    if (!discount) return toast.error("Vui lòng nhập % giảm.");
    if (discount < 1 || discount > 90) return toast.error("Giảm giá phải từ 1% đến 90%");
    try {
      setSaving(true);
      await PromotionDetailService.createPromotionPackage({
        promotionId: promotion.promotionId,
        packageId: selectedIds,
        discountPercent: Number(discount),
      });
      setSelectedIds([]);
      setDiscount("");
      setPicking(false);
      await loadTabData();
      onChanged?.();
      toast.success("Thêm gói khuyến mãi thành công!");
    } catch (e) {
      console.error("Save promotion failed:", e);
      toast.error("Thêm gói khuyến mãi thất bại!");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">

          <div className="modal-header">
            <h5 className="modal-title">Chi tiết khuyến mãi · {promotion?.promotionName}</h5>
            <span className="btn-close" onClick={onClose}></span>
          </div>

          {/* Tabs */}
          <div className="px-3 pt-3">
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${selectedTab === "VOUCHER" ? "action-item" : "text-black"}`}
                  onClick={() => setSelectedTab("VOUCHER")}
                >
                  Voucher
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${selectedTab === "PACKAGE" ? "action-item" : "text-black"}`}
                  onClick={() => setSelectedTab("PACKAGE")}
                >
                  Package
                </button>
              </li>
            </ul>
          </div>
          {/* Body */}
          <div className="modal-body">
            {selectedTab === "VOUCHER" ? (
              <>
                {/* Table vouchers (giữ nguyên render & edit như bạn) */}
                <table className="table table-striped table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Mã voucher</th>
                      <th>Loại</th>
                      <th>Giá trị giảm</th>
                      <th>Giảm tối đa</th>
                      <th>Lượt dùng</th>
                      <th>Đơn tối thiểu</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="text-center text-muted">Đang tải…</td></tr>
                    ) : vouchers.length ? vouchers.map((item) => {
                      const type = (item.discountType || "").toUpperCase();
                      const isPercent = type === "PERCENTAGE";
                      const key = item.voucherCode || item.sk || item.id;
                      const isEditing = editingVoucherCode === item.voucherCode;
                      return (
                        <tr key={key}>
                          <td className="fw-semibold">{item.voucherCode}</td>
                          <td>
                            {isEditing ? (
                              <select
                                className="form-select form-select-sm text-black"
                                value={editForm.discountType}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditForm(s => ({
                                    ...s,
                                    discountType: val,
                                    maxDiscountAmount: val === "FIXED_AMOUNT" ? Number(s.discountValue || 0) : s.maxDiscountAmount
                                  }));
                                }}
                              >
                                <option value="PERCENTAGE">PERCENT (%)</option>
                                <option value="FIXED_AMOUNT">AMOUNT (VND)</option>
                              </select>
                            ) : (
                              <span className="badge bg-info">{type}</span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="number"
                                className="form-control form-control-sm text-black"
                                value={editForm.discountValue}
                                onChange={(e) => {
                                  const val = Number(e.target.value || 0);
                                  setEditForm(s => ({
                                    ...s,
                                    discountValue: val,
                                    maxDiscountAmount: s.discountType === "FIXED_AMOUNT" ? val : s.maxDiscountAmount
                                  }));
                                }}
                                placeholder={editForm.discountType === "PERCENTAGE" ? "VD: 15" : "VD: 50000"}
                                min={0}
                              />
                            ) : (isPercent ? `${item.discountValue ?? 0}%` : fmtVND(Number(item.discountValue || 0)))}
                          </td>
                          <td>
                            {isEditing ? (
                              editForm.discountType === "PERCENTAGE" ? (
                                <input
                                  type="number"
                                  className="form-control form-control-sm text-black"
                                  value={editForm.maxDiscountAmount}
                                  onChange={(e) => setEditForm(s => ({ ...s, maxDiscountAmount: Number(e.target.value || 0) }))}
                                  placeholder="VD: 50000"
                                  min={0}
                                />
                              ) : (
                                <input
                                  type="number"
                                  className="form-control form-control-sm text-black"
                                  value={editForm.maxDiscountAmount}
                                  disabled
                                  title="Với AMOUNT, Giảm tối đa = Giá trị giảm"
                                />
                              )
                            ) : (fmtVND(Number(item.maxDiscountAmount || 0)))}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="number"
                                className="form-control form-control-sm text-black"
                                value={editForm.maxUsage}
                                onChange={(e) => setEditForm(s => ({ ...s, maxUsage: Number(e.target.value || 0) }))}
                                min={0}
                              />
                            ) : (Number(item.maxUsage || 0).toLocaleString())}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="number"
                                className="form-control form-control-sm text-black"
                                value={editForm.minOrderAmount}
                                onChange={(e) => setEditForm(s => ({ ...s, minOrderAmount: Number(e.target.value || 0) }))}
                                min={0}
                              />
                            ) : (fmtVND(Number(item.minOrderAmount || 0)))}
                          </td>
                          <td className="d-flex">
                            {isEditing ? (
                              <>
                                <button className="btn btn-primary me-2" onClick={() => saveEditVoucher(item)} disabled={savingVoucher}>
                                  {savingVoucher ? <i className="fa fa-spinner fa-spin" /> : <i className="fa fa-check" />}
                                </button>
                                <button className="btn btn-sm btn-secondary" onClick={cancelEditVoucher} disabled={savingVoucher}>
                                  <i className="fa fa-times" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button className="btn btn-sm btn-primary me-2" onClick={() => startEditVoucher(item)}>
                                  <i className="fa fa-pencil" />
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteVoucher(item.voucherCode)}>
                                  <i className="fa fa-trash" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={7} className="text-center text-muted">Không có voucher nào.</td></tr>
                    )}
                  </tbody>
                </table>

                <div className="d-flex justify-content-between align-items-center">
                  {!picking ? (
                    <button className="btn btn-secondary" onClick={startCreateVoucher}>Tạo voucher</button>
                  ) : (
                    <span className="text-muted small">Điền thông tin voucher rồi nhấn “Tạo”.</span>
                  )}
                </div>

                {picking && (
                  <div className="row g-3 mt-3">
                    {/* form tạo voucher: giữ nguyên như bạn đã có */}
                    {/* ... */}
                    <div className="col-md-4">
                      <label className="form-label">Mã voucher *</label>
                      <input className="form-control text-black"
                        value={voucherForm.voucherCode}
                        onChange={e => setVoucherForm(s => ({ ...s, voucherCode: e.target.value.toUpperCase() }))}
                        placeholder="VD: SUMMER50" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Loại giảm *</label>
                      <select className="form-select text-black"
                        value={voucherForm.discountType}
                        onChange={e => setVoucherForm(s => {
                          const type = e.target.value;
                          return {
                            ...s,
                            discountType: type,
                            maxDiscountAmount: type === "FIXED_AMOUNT" ? Number(s.discountValue || 0) : s.maxDiscountAmount
                          };
                        })}>
                        <option value="PERCENTAGE">PERCENT (%)</option>
                        <option value="FIXED_AMOUNT">AMOUNT (VND)</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Giá trị giảm *</label>
                      <input type="number" className="form-control text-black"
                        value={voucherForm.discountValue}
                        onChange={e => setVoucherForm(s => {
                          const val = Number(e.target.value || 0);
                          return {
                            ...s,
                            discountValue: val,
                            maxDiscountAmount: s.discountType === "FIXED_AMOUNT" ? val : s.maxDiscountAmount
                          };
                        })}
                        placeholder={voucherForm.discountType === "PERCENTAGE" ? "Ví dụ: 10" : "Ví dụ: 50000"} />
                    </div>
                    {voucherForm.discountType === "PERCENTAGE" && (
                      <div className="col-md-4">
                        <label className="form-label">Giảm tối đa</label>
                        <input type="number" className="form-control text-black"
                          value={voucherForm.maxDiscountAmount}
                          onChange={e => setVoucherForm(s => ({ ...s, maxDiscountAmount: Number(e.target.value || 0) }))}
                          placeholder="VD: 100000" />
                      </div>
                    )}
                    <div className="col-md-4">
                      <label className="form-label">Tổng lượt sử dụng</label>
                      <input type="number" className="form-control text-black"
                        value={voucherForm.maxUsage}
                        onChange={e => setVoucherForm(s => ({ ...s, maxUsage: e.target.value }))}
                        placeholder="VD: 1000" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Đơn tối thiểu</label>
                      <input type="number" className="form-control text-black"
                        value={voucherForm.minOrderAmount}
                        onChange={e => setVoucherForm(s => ({ ...s, minOrderAmount: e.target.value }))}
                        placeholder="VD: 100000" />
                    </div>
                    <div className="d-flex mt-2">
                      <button className="btn btn-primary" onClick={handleSaveVoucher} disabled={savingVoucher}>
                        {savingVoucher ? "Đang tạo..." : "Tạo"}
                      </button>
                      <button className="btn btn-secondary ms-2" onClick={() => setPicking(false)} disabled={savingVoucher}>
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Table packages + hiển thị nội dung gói */}
                <table className="table table-striped table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Gói</th>
                      <th>Giảm giá (%)</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} className="text-center text-muted">Đang tải…</td></tr>
                    ) : packages.length ? packages.map(item => {
                      const ids = Array.isArray(item.packageId) ? item.packageId : [item.packageId];
                      const detailTexts = ids.map(id => {
                        const p = pkgMap.get(id);
                        if (!p) return `• ${id}`;
                        // ví dụ hiển thị tên + thời lượng + giá
                        return `• ${p.packageName ?? id} — ${p.durationInDays ?? '-'} ngày — ${fmtVND(p.price ?? p.originalPrice ?? 0)}`;
                      });
                      const key = rowKey(item);
                      const editing = editingRowId === key;

                      return (
                        <tr key={key}>
                          <td>{ids.join(", ")}</td>
                          <td>
                            {editing ? (
                              <div className="d-flex align-items-center gap-2">
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  min={1} max={90}
                                  value={tempPercentPackage}
                                  onChange={(e) => setTempPercentPackage(e.target.value === '' ? '' : Number(e.target.value))}
                                  onKeyDown={(e) => onPercentKeyDown(e, item)}
                                  style={{ width: 100 }}
                                  autoFocus
                                />
                                <span>%</span>
                              </div>
                            ) : (
                              <span>{(item.discountPercent ?? 0).toLocaleString()} %</span>
                            )}
                          </td>
                          <td className="d-flex">
                            {editing ? (
                              <>
                                <button className="btn btn-primary me-2" onClick={() => saveEditPackage(item)} disabled={saving}>
                                  {saving ? <i className="fa fa-spinner fa-spin" /> : <i className="fa fa-check" />}
                                </button>
                                <button className="btn btn-sm btn-secondary" onClick={cancelEditPackage} disabled={saving}>
                                  <i className="fa fa-times" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button className="btn btn-sm btn-primary me-2" onClick={() => startEditPackage(item)}>
                                  <i className="fa fa-pencil"></i>
                                </button>
                                <button className="btn btn-sm btn-danger me-2" onClick={() => handleDeletePromotionPackage(ids)}>
                                  <i className="fa fa-trash"></i>
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={4} className="text-center text-muted">Không có gói khuyến mãi nào áp dụng.</td></tr>
                    )}
                  </tbody>
                </table>

                <div className="d-flex justify-content-between align-items-center">
                  {!picking ? (
                    <button className="btn btn-secondary" onClick={startPick}>Chọn gói muốn áp dụng khuyến mãi</button>
                  ) : (
                    <span className="text-muted small">Chọn gói và nhập % giảm rồi nhấn “Thêm”.</span>
                  )}
                </div>

                {picking && (
                  <div className="mt-3">
                    <div className="mb-3">
                      <label className="form-label">Gói <span className="text-danger">*</span></label>
                      <Select
                        isMulti
                        isDisabled={availableOptions.length === 0}
                        options={availableOptions}
                        value={availableOptions.filter(opt => selectedIds.includes(opt.value))}
                        onChange={(selected) => setSelectedIds((selected || []).map(opt => opt.value))}
                        placeholder={availableOptions.length ? "Chọn gói..." : "Tất cả gói đã được áp dụng"}
                        noOptionsMessage={() => availableOptions.length ? "Không còn gói phù hợp" : "Không còn gói để chọn"}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Giảm giá (%) <span className="text-danger">*</span></label>
                      <input
                        type="number" max={90} min={1}
                        className="text-black form-control"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder="Nhập % giảm"
                      />
                    </div>
                    <div className="d-flex">
                      <button className="btn btn-primary" onClick={handleSavePackage}>Thêm</button>
                      <button className="btn btn-secondary ms-2" onClick={() => setPicking(false)}>Hủy</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PromotionDetailModal;
