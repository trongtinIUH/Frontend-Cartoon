import { useEffect, useMemo, useState } from "react";
import SubscriptionPackageService from "../services/SubscriptionPackageService";
import PromotionService from "../services/PromotionService";
import { toast } from "react-toastify";
import Select from "react-select";

const PromotionDetailModal = ({ open, onClose, promotion, packages = [], onAdd, loading, error }) => {
  const [picking, setPicking] = useState(false);
  const [allPkgs, setAllPkgs] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [discount, setDiscount] = useState("");
  const [saving, setSaving] = useState(false);
  const isVoucher = promotion?.promotionType === "VOUCHER";
  const [savingVoucher, setSavingVoucher] = useState(false);

  const [voucherForm, setVoucherForm] = useState({
    voucherCode: "",
    discountType: "PERCENTAGE",     // "PERCENTAGE" | "FIXED_AMOUNT"
    discountValue: "",
    maxDiscountAmount: "",
    maxUsage: "",
    usedCount: 0,
    maxUsagePerUser: "",
    minOrderAmount: ""
  });

  const startCreateVoucher = () => {
    setPicking(true);
    setVoucherForm({
      voucherCode: "",
      discountType: "PERCENTAGE",
      discountValue: "",
      maxDiscountAmount: "",
      maxUsage: "",
      usedCount: 0,
      maxUsagePerUser: "",
      minOrderAmount: ""
    });
  };

  const handleSaveVoucher = async () => {
    // validate cơ bản
    if (!voucherForm.voucherCode.trim()) return toast.error("Vui lòng nhập mã voucher.");
    if (!voucherForm.discountType) return toast.error("Vui lòng chọn loại giảm.");
    const dv = voucherForm.discountValue;
    if (!dv || dv <= 0) return toast.error("Giá trị giảm phải > 0.");
    if (voucherForm.discountType === "PERCENTAGE" && (dv < 1 || dv > 100))
      return toast.error("Phần trăm giảm phải từ 1 đến 100.");

    setSavingVoucher(true);
    try {
      await PromotionService.createPromotionVoucher({
        promotionId: promotion.promotionId,
        voucherCode: voucherForm.voucherCode.trim().toUpperCase(),
        discountType: voucherForm.discountType,                 // "PERCENT" | "AMOUNT"
        discountValue: voucherForm.discountValue,
        maxDiscountAmount: voucherForm.maxDiscountAmount || 0,
        maxUsage: voucherForm.maxUsage || 0,
        maxUsagePerUser: voucherForm.maxUsagePerUser || 0,
        minOrderAmount: voucherForm.minOrderAmount || 0
      });
      toast.success("Tạo voucher thành công!");
      setPicking(false);
      setVoucherForm({
        voucherCode: "",
        discountType: "PERCENTAGE",
        discountValue: "",
        maxDiscountAmount: "",
        maxUsage: "",
        usedCount: 0,
        maxUsagePerUser: "",
        minOrderAmount: ""
      });
      onAdd();
    } catch (e) {
      toast.error(e?.response?.data || "Tạo voucher thất bại!");
    } finally {
      setSavingVoucher(false);
    }
  };

  const fmtVND = (num) => {
    if (!num) return "0 đ";
    return `${num.toLocaleString()} đ`;
  };

  const startPick = async () => {
    setPicking(true);
    setSelectedIds([]);
    setDiscount("");
    if (allPkgs.length === 0) {
      try {
        setLoadingAll(true);
        // Đổi tên hàm cho đúng service của bạn (getAll / getAllPackages)
        const data = await SubscriptionPackageService.getAllPackages();
        setAllPkgs(data);
      } catch (e) {
        console.error("Load packages failed:", e);
        setAllPkgs([]);
      } finally {
        setLoadingAll(false);
      }
    }
  };

  const appliedIds = useMemo(() => {
    const s = new Set();
    (packages || []).forEach(p => {
      if (Array.isArray(p.packageId)) {
        p.packageId.forEach(id => id && s.add(id));
      } else if (p.packageId) {
        s.add(p.packageId);
      }
    });
    return s;
  }, [packages]);

  const availableOptions = useMemo(() => {
    return (allPkgs || [])
      .filter(pkg => pkg?.packageId && !appliedIds.has(pkg.packageId))
      .map(pkg => ({ value: pkg.packageId, label: pkg.packageId }));
  }, [allPkgs, appliedIds]);

  // useEffect(() => {
  //   setSelectedIds(prev => prev.filter(id => !appliedIds.has(id)));
  // }, [appliedIds]);

  const handleSave = async () => {
    if (!selectedIds.length) {
      toast.error("Vui lòng chọn gói.");
      return;
    }

    if (!discount) {
      toast.error("Vui lòng nhập % giảm.");
      return;
    }

    if (discount < 1 || discount > 100) {
      toast.error("Giảm giá phải từ 1% đến 100%");
      return;
    }

    setSaving(true);
    try {
      await PromotionService.createPromotionPackage({
        promotionId: promotion.promotionId,
        packageId: selectedIds,
        discountPercent: discount,
      });
      setSelectedIds([]);
      setDiscount("");
      setPicking(false);
      onAdd();
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
    <div className="modal fade show" style={{ display: "block"}}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Chi tiết khuyến mãi</h5>
            <span className="btn-close" onClick={onClose}></span>
          </div>
          <div className="modal-body">
            {promotion ? (
              <div>
                {isVoucher ? "Danh sách voucher" : "Gói khuyến mãi được áp dụng"}
                <table className="table table-striped table-bordered table-hover">
                  <thead className="table-light">
                    {isVoucher ? (
                      <tr>
                        <th>Mã voucher</th>
                        <th>Loại</th>
                        <th>Giá trị giảm</th>
                        <th>Giảm tối đa</th>
                        <th>Lượt dùng</th>
                        {/* <th>Tối đa/user</th> */}
                        <th>Đơn tối thiểu</th>
                        {/* <th>Giá gói tối thiểu</th> */}
                        <th>Hành động</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>Gói</th>
                        <th>Giảm giá (%)</th>
                        <th>Hành động</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {Array.isArray(packages) && packages.length > 0 ? (
                      packages.map((item) => {
                        if (isVoucher) {
                          const type = (item.discountType || "").toUpperCase();
                          const isPercent = type === "PERCENTAGE";
                          const isFixed = type === "AMOUNT" || type === "FIXED_AMOUNT";
                          const key = item.voucherCode || item.sk || item.id;
                          return (
                            <tr key={key}>
                              <td className="fw-semibold">{item.voucherCode}</td>
                              <td><span className="badge bg-info">{item.discountType}</span></td>
                              <td>
                                {isPercent
                                  ? `${item.discountValue ?? 0}%`
                                  : `${fmtVND(item.discountValue)}`}
                              </td>
                              <td>{fmtVND(item.maxDiscountAmount)}</td>
                              <td>{(item.usedCount ?? 0)}{item.maxUsage != null ? ` / ${item.maxUsage}` : ""}</td>
                              <td>{fmtVND(item.minOrderAmount)}</td>
                              <td className="d-flex">
                                <button className="btn btn-sm btn-primary me-2" onClick={() => console.log("edit voucher", item)}>
                                  <i className="fa fa-pencil" /> Sửa
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => console.log("delete voucher", item)}>
                                  <i className="fa fa-trash" /> Xóa
                                </button>
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={item.id}>
                            <td>{Array.isArray(item.packageId) ? item.packageId.join(", ") : item.packageId}</td>
                            <td>{(item.discountPercent ?? 0).toLocaleString()} %</td>
                            <td className="d-flex">
                              <span className="btn btn-sm btn-primary me-2"><i className="fa fa-pencil"></i> Sửa</span>
                              <span className="btn btn-sm btn-danger me-2"><i className="fa fa-trash"></i> Xóa</span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={isVoucher ? 8 : 3} className="text-center text-muted">
                          {isVoucher ? "Không có voucher nào." : "Không có gói khuyến mãi nào áp dụng."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>Không có dữ liệu khuyến mãi để hiển thị.</p>
            )}
          </div>
          <div className="modal-footer">
            <div className="modal-footer">
              {isVoucher ? (
                !picking ? (
                  <button className="btn btn-secondary" onClick={startCreateVoucher}>
                    Tạo voucher
                  </button>
                ) : (
                  <span className="text-muted small">Điền thông tin voucher rồi nhấn “Tạo”.</span>
                )
              ) : (
                !picking ? (
                  <button className="btn btn-secondary" onClick={startPick}>
                    Chọn gói muốn áp dụng khuyến mãi
                  </button>
                ) : (
                  <span className="text-muted small">Chọn gói và nhập % giảm rồi nhấn “Thêm”.</span>
                )
              )}
            </div>
          </div>
          {picking && (
            <div className="modal-body">
              {isVoucher ? (
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Mã voucher *</label>
                    <input
                      className="form-control text-black"
                      value={voucherForm.voucherCode}
                      onChange={e => setVoucherForm(s => ({ ...s, voucherCode: e.target.value.toUpperCase() }))}
                      placeholder="VD: SUMMER50"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Loại giảm *</label>
                    <select
                      className="form-select text-black"
                      value={voucherForm.discountType}
                      onChange={e => setVoucherForm(s => ({ ...s, discountType: e.target.value }))}
                    >
                      <option value="PERCENTAGE">PERCENT (%)</option>
                      <option value="FIXED_AMOUNT">AMOUNT (VND)</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Giá trị giảm *</label>
                    <input
                      type="number"
                      className="form-control text-black"
                      value={voucherForm.discountValue}
                      onChange={e => setVoucherForm(s => ({ ...s, discountValue: e.target.value }))}
                      placeholder={voucherForm.discountType === "PERCENTAGE" ? "Ví dụ: 10" : "Ví dụ: 50000"}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Giảm tối đa</label>
                    <input
                      type="number"
                      className="form-control text-black"
                      value={voucherForm.maxDiscountAmount}
                      onChange={e => setVoucherForm(s => ({ ...s, maxDiscountAmount: e.target.value }))}
                      placeholder="VD: 100000"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Tổng lượt (maxUsage)</label>
                    <input
                      type="number"
                      className="form-control text-black"
                      value={voucherForm.maxUsage}
                      onChange={e => setVoucherForm(s => ({ ...s, maxUsage: e.target.value }))}
                      placeholder="VD: 1000"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Tối đa/user</label>
                    <input
                      type="number"
                      className="form-control text-black"
                      value={voucherForm.maxUsagePerUser}
                      onChange={e => setVoucherForm(s => ({ ...s, maxUsagePerUser: e.target.value }))}
                      placeholder="VD: 2"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Đơn tối thiểu</label>
                    <input
                      type="number"
                      className="form-control text-black"
                      value={voucherForm.minOrderAmount}
                      onChange={e => setVoucherForm(s => ({ ...s, minOrderAmount: e.target.value }))}
                      placeholder="VD: 100000"
                    />
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
              ) : (
                // ====== form chọn gói & % giảm như cũ ======
                <>
                  <div className="mb-3">
                    <label className="form-label">Gói <span className="text-danger">*</span></label>
                    <Select
                      isMulti
                      isDisabled={loadingAll || availableOptions.length === 0}
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
                      type="number" max={100} min={1}
                      className="text-black form-control"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="Nhập % giảm"
                    />
                  </div>
                  <div className="d-flex">
                    <button className="btn btn-primary" onClick={handleSave}>
                      Thêm
                    </button>
                    <button className="btn btn-secondary ms-2" onClick={() => setPicking(false)}>
                      Hủy chọn gói
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromotionDetailModal;
