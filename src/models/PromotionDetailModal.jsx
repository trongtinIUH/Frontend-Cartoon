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
  const [editingRowId, setEditingRowId] = useState(null);
  const [tempPercentPackage, setTempPercentPackage] = useState('');

  const [voucherForm, setVoucherForm] = useState({
    voucherCode: "",
    discountType: "PERCENTAGE",     // "PERCENTAGE" | "FIXED_AMOUNT"
    discountValue: "",
    maxDiscountAmount: "",
    maxUsage: "",
    maxUsagePerUser: "",
    minOrderAmount: ""
  });

  // ---- EDIT VOUCHER ----
  const [editingVoucherCode, setEditingVoucherCode] = useState(null);
  const [editForm, setEditForm] = useState({
    discountType: "PERCENTAGE",      // "PERCENTAGE" | "FIXED_AMOUNT"
    discountValue: "",
    maxDiscountAmount: "",
    maxUsage: "",
    maxUsagePerUser: "",
    minOrderAmount: ""
  });

  // bắt đầu sửa 1 voucher
  const startEditVoucher = (v) => {
    setEditingVoucherCode(v.voucherCode);
    setEditForm({
      discountType: (v.discountType || "PERCENTAGE").toUpperCase(),
      discountValue: Number(v.discountValue ?? 0),
      // FIXED_AMOUNT => maxDiscountAmount phải = discountValue (disable input)
      maxDiscountAmount: Number(
        (v.discountType || "").toUpperCase() === "FIXED_AMOUNT"
          ? v.discountValue ?? 0
          : v.maxDiscountAmount ?? 0
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

  // lưu cập nhật voucher
  const saveEditVoucher = async (v) => {
    // v là row hiện tại (voucher)
    const payload = {
      discountType: editForm.discountType,
      discountValue: Number(editForm.discountValue || 0),
      maxDiscountAmount: Number(
        editForm.discountType === "FIXED_AMOUNT"
          ? editForm.discountValue || 0
          : editForm.maxDiscountAmount || 0
      ),
      maxUsage: Number(editForm.maxUsage || 0),
      maxUsagePerUser: Number(editForm.maxUsagePerUser || 0),
      minOrderAmount: Number(editForm.minOrderAmount || 0),
    };

    console.log("Saving voucher edit:", v.voucherCode, payload);

    // validate
    if (!payload.discountValue || payload.discountValue <= 0) {
      toast.error("Giá trị giảm phải > 0.");
      return;
    }
    if (payload.discountType === "PERCENTAGE" && (payload.discountValue < 1 || payload.discountValue > 100)) {
      toast.error("Phần trăm giảm phải từ 1 đến 100.");
      return;
    }
    if (payload.maxDiscountAmount < 0) {
      toast.error("Giảm tối đa phải ≥ 0.");
      return;
    }
    if (payload.maxUsage <= 0) {
      toast.error("Tổng lượt sử dụng phải > 0.");
      return;
    }
    if (payload.maxUsagePerUser < 0) {
      toast.error("Tối đa/user phải ≥ 0.");
      return;
    }
    if (payload.maxUsagePerUser && payload.maxUsage && payload.maxUsagePerUser > payload.maxUsage) {
      toast.error("Tối đa/user phải ≤ Tổng lượt sử dụng.");
      return;
    }
    if (payload.minOrderAmount < 0) {
      toast.error("Đơn tối thiểu phải ≥ 0.");
      return;
    }

    if (payload.minOrderAmount <= payload.discountValue + 10000) {
      toast.error("Đơn tối thiểu phải lớn hơn giá trị giảm ít nhất 10,000đ.");
      return;
    }

    if (payload.discountType === "PERCENTAGE" && (payload.minOrderAmount < payload.maxDiscountAmount + 10000)) {
      toast.error("Đơn tối thiểu phải lớn hơn hoặc bằng Giảm tối đa + 10,000đ.");
      return;
    }

    try {
      setSavingVoucher(true);
      await PromotionService.updatePromotionVoucher(
        promotion.promotionId,
        v.voucherCode,
        payload
      );
      toast.success("Cập nhật voucher thành công!");
      setEditingVoucherCode(null);
      onAdd(); // reload danh sách
    } catch (e) {
      console.error("Update voucher failed:", e);
      toast.error(e?.response?.data || "Cập nhật voucher thất bại!");
    } finally {
      setSavingVoucher(false);
    }
  };


  // bat dau tao voucher
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

  // tao voucher 
  const handleSaveVoucher = async () => {
    // validate cơ bản
    const code = voucherForm.voucherCode.trim().toUpperCase();

    // Validate cơ bản
    if (!code) return toast.error("Vui lòng nhập mã voucher.");

    // Check trùng với danh sách vouchers hiện tại
    if ((packages || []).some(v => v.voucherCode?.toUpperCase() === code)) {
      return toast.error("Mã voucher đã tồn tại.");
    }
    // if (!voucherForm.voucherCode.trim()) return toast.error("Vui lòng nhập mã voucher.");
    if (!voucherForm.discountType) return toast.error("Vui lòng chọn loại giảm.");
    if (!voucherForm.maxUsage || voucherForm.maxUsage <= 0) return toast.error("Tổng lượt sử dụng phải > 0.");
    if (!voucherForm.discountValue || voucherForm.discountValue <= 0) return toast.error("Giá trị giảm phải > 0.");
    if (!voucherForm.minOrderAmount || voucherForm.minOrderAmount < 0) return toast.error("Đơn tối thiểu phải >= 0.");
    // if(!voucherForm.maxUsagePerUser || voucherForm.maxUsagePerUser <= 0) return toast.error("Tối đa/user phải > 0.");
    // if(voucherForm.maxUsage && voucherForm.maxUsagePerUser && Number(voucherForm.maxUsagePerUser) > Number(voucherForm.maxUsage))
    //   return toast.error("Tối đa/user phải nhỏ hơn hoặc bằng Tổng lượt sử dụng.");
    if (voucherForm.maxDiscountAmount && voucherForm.maxDiscountAmount <= 0) return toast.error("Giảm tối đa phải >= 0.");
    if (voucherForm.discountType === "PERCENTAGE" && (voucherForm.discountValue < 1 || voucherForm.discountValue > 100))
      return toast.error("Phần trăm giảm phải từ 1 đến 100.");
    if (voucherForm.minOrderAmount <= voucherForm.discountValue + 10000) {
      return toast.error("Đơn tối thiểu phải lớn hơn giá trị giảm ít nhất 10,000đ.");
    }
    if (voucherForm.discountType === "PERCENTAGE" && (voucherForm.minOrderAmount < voucherForm.maxDiscountAmount + 10000)) {
      return toast.error("Đơn tối thiểu phải lớn hơn hoặc bằng Giảm tối đa + 10,000đ.");
    }

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

  // xoa voucher
  const handleDeleteVoucher = async (promotionId, voucherCode) => {
    try {
      if (!window.confirm("Bạn có chắc chắn muốn xóa voucher này?")) return;
      await PromotionService.deletePromotionVoucher(promotionId, voucherCode);
      toast.success("Xóa voucher thành công!");
      onAdd();
    } catch (e) {
      console.error("Delete voucher failed:", e);
      toast.error("Xóa voucher thất bại!");
    }
  };

  // bat dau chon goi ap dung khuyen mai
  const startPick = async () => {
    setPicking(true);
    setSelectedIds([]);
    setDiscount("");
    if (allPkgs.length === 0) {
      try {
        setLoadingAll(true);
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

  // luu gói khuyến mãi
  const handleSave = async () => {
    if (!selectedIds.length) {
      toast.error("Vui lòng chọn gói.");
      return;
    }

    if (!discount) {
      toast.error("Vui lòng nhập % giảm.");
      return;
    }

    if (discount < 1 || discount > 99) {
      toast.error("Giảm giá phải từ 1% đến 90%");
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

  // xoa promotion package
  const handleDeletePromotionPackage = async (id, packageId) => {
    try {
      if (!window.confirm("Bạn có chắc chắn muốn xóa gói khuyến mãi này?")) return;
      await PromotionService.deletePromotionPackage(id, packageId);
      toast.success("Xóa gói khuyến mãi thành công!");
      onAdd();
    } catch (e) {
      console.error("Delete promotion failed:", e);
      toast.error("Xóa gói khuyến mãi thất bại!");
    }
  };

  const rowKey = (x) =>
    `${x.promotionId}__${Array.isArray(x.packageId) ? x.packageId.join('|') : x.packageId}`;

  const startEditPackage = (row) => {
    setEditingRowId(rowKey(row));
    setTempPercentPackage(row.discountPercent ?? 0);
  };

  const cancelEditPackage = () => {
    setEditingRowId(null);
    setTempPercentPackage('');
  };

  // cap nhat gói khuyến mãi gói
  const saveEdit = async (row) => {
    try {
      const percentNum = Number(tempPercentPackage);
      if (!Number.isFinite(percentNum) || percentNum < 1 || percentNum > 90) {
        toast.error("Giảm giá phải từ 1% đến 90%");
        return;
      }
      setSaving(true);

      const pkgs = Array.isArray(row.packageId) ? row.packageId : [row.packageId];

      await PromotionService.updatePromotionPackage(row.promotionId, pkgs, percentNum);

      toast.success("Cập nhật gói khuyến mãi thành công!");
      setEditingRowId(null);
      setTempPercentPackage('');
      onAdd();
    } catch (e) {
      console.error("Update promotion failed:", e);
      toast.error("Cập nhật gói khuyến mãi thất bại!");
    } finally {
      setSaving(false);
    }
  };

  const onPercentKeyDown = (e, row) => {
    if (e.key === 'Enter') saveEdit(row);
    if (e.key === 'Escape') cancelEditPackage();
  };

  const fmtVND = (num) => {
    if (!num) return "0 đ";
    return `${num.toLocaleString()} đ`;
  };

  if (!open) return null;
  return (
    <div className="modal fade show" style={{ display: "block" }}>
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
                          const key = item.voucherCode || item.sk || item.id;
                          const isEditing = editingVoucherCode === item.voucherCode;

                          return (
                            <tr key={key}>
                              {/* Mã voucher */}
                              <td className="fw-semibold">{item.voucherCode}</td>

                              {/* Loại giảm */}
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

                              {/* Giá trị giảm */}
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
                                ) : (
                                  isPercent ? `${item.discountValue ?? 0}%` : fmtVND(Number(item.discountValue || 0))
                                )}
                              </td>

                              {/* Giảm tối đa */}
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
                                ) : (
                                  fmtVND(Number(item.maxDiscountAmount || 0))
                                )}
                              </td>

                              {/* Tổng lượt dùng */}
                              <td>
                                {isEditing ? (
                                  <input
                                    type="number"
                                    className="form-control form-control-sm text-black"
                                    value={editForm.maxUsage}
                                    onChange={(e) => setEditForm(s => ({ ...s, maxUsage: Number(e.target.value || 0) }))}
                                    min={0}
                                  />
                                ) : (
                                  Number(item.maxUsage || 0).toLocaleString()
                                )}
                              </td>

                              {/* Tối đa/user */}
                              {/* <td>
                                {isEditing ? (
                                  <input
                                    type="number"
                                    className="form-control form-control-sm text-black"
                                    value={editForm.maxUsagePerUser}
                                    onChange={(e) => setEditForm(s => ({ ...s, maxUsagePerUser: Number(e.target.value || 0) }))}
                                    min={0}
                                  />
                                ) : (
                                  Number(item.maxUsagePerUser || 0).toLocaleString()
                                )}
                              </td> */}

                              {/* Đơn tối thiểu */}
                              <td>
                                {isEditing ? (
                                  <input
                                    type="number"
                                    className="form-control form-control-sm text-black"
                                    value={editForm.minOrderAmount}
                                    onChange={(e) => setEditForm(s => ({ ...s, minOrderAmount: Number(e.target.value || 0) }))}
                                    min={0}
                                  />
                                ) : (
                                  fmtVND(Number(item.minOrderAmount || 0))
                                )}
                              </td>

                              {/* Hành động */}
                              <td className="d-flex">
                                {isEditing ? (
                                  <>
                                    <button
                                      className="btn btn-primary me-2"
                                      onClick={() => saveEditVoucher(item)}
                                      disabled={savingVoucher}
                                    >
                                      {savingVoucher ? <i className="fa fa-spinner fa-spin" /> : <i className="fa fa-check" />}
                                    </button>
                                    <button
                                      className="btn btn-sm btn-secondary"
                                      onClick={cancelEditVoucher}
                                      disabled={savingVoucher}
                                    >
                                      <i className="fa fa-times" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      className="btn btn-sm btn-primary me-2"
                                      onClick={() => startEditVoucher(item)}
                                    >
                                      <i className="fa fa-pencil" />
                                    </button>
                                    <button
                                      className="btn btn-sm btn-danger"
                                      onClick={() => handleDeleteVoucher(promotion.promotionId, item.voucherCode)}
                                    >
                                      <i className="fa fa-trash" />
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={rowKey(item)}>
                            <td>{Array.isArray(item.packageId) ? item.packageId.join(", ") : item.packageId}</td>
                            <td>
                              {editingRowId === rowKey(item) ? (
                                <div className="d-flex align-items-center gap-2">
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    min={1}
                                    max={100}
                                    value={tempPercentPackage}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setTempPercentPackage(v === '' ? '' : Number(v));
                                    }}
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
                              {editingRowId === rowKey(item) ? (
                                <>
                                  <button
                                    className="btn btn-primary me-2"
                                    onClick={() => saveEdit(item)}
                                    disabled={saving}
                                  >
                                    {saving ? <i className="fa fa-spinner fa-spin" /> : <i className="fa fa-check" />}
                                  </button>
                                  <button className="btn btn-sm btn-secondary" onClick={cancelEditPackage} disabled={saving}>
                                    <i className="fa fa-times" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span
                                    className="btn btn-sm btn-primary me-2"
                                    onClick={() => startEditPackage(item)}
                                  >
                                    <i className="fa fa-pencil"></i>
                                  </span>

                                  <span
                                    className="btn btn-sm btn-danger me-2"
                                    onClick={() => handleDeletePromotionPackage(item.promotionId, item.packageId)}
                                  >
                                    <i className="fa fa-trash"></i>
                                  </span>
                                </>
                              )}
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
                      onChange={e =>
                        setVoucherForm(s => {
                          const type = e.target.value;
                          return {
                            ...s,
                            discountType: type,
                            // nếu là FIXED_AMOUNT => max = discountValue hiện tại (ép số)
                            maxDiscountAmount:
                              type === "FIXED_AMOUNT" ? Number(s.discountValue || 0) : s.maxDiscountAmount,
                          };
                        })
                      }
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
                      onChange={e =>
                        setVoucherForm(s => {
                          const val = Number(e.target.value || 0);
                          return {
                            ...s,
                            discountValue: val,
                            // nếu FIXED_AMOUNT thì maxDiscountAmount bám theo discountValue
                            maxDiscountAmount: s.discountType === "FIXED_AMOUNT" ? val : s.maxDiscountAmount,
                          };
                        })
                      }
                      placeholder={voucherForm.discountType === "PERCENTAGE" ? "Ví dụ: 10" : "Ví dụ: 50000"}
                    />
                  </div>

                  {voucherForm.discountType === "PERCENTAGE" && (
                    <div className="col-md-4">
                      <label className="form-label">Giảm tối đa</label>
                      <input
                        type="number"
                        className="form-control text-black"
                        value={voucherForm.maxDiscountAmount}
                        onChange={e =>
                          setVoucherForm(s => ({ ...s, maxDiscountAmount: Number(e.target.value || 0) }))
                        }
                        placeholder="VD: 100000"
                      />
                    </div>
                  )}

                  <div className="col-md-4">
                    <label className="form-label">Tổng lượt sử dụng</label>
                    <input
                      type="number"
                      className="form-control text-black"
                      value={voucherForm.maxUsage}
                      onChange={e => setVoucherForm(s => ({ ...s, maxUsage: e.target.value }))}
                      placeholder="VD: 1000"
                    />
                  </div>

                  {/* <div className="col-md-4">
                    <label className="form-label">Tối đa/user</label>
                    <input
                      type="number"
                      className="form-control text-black"
                      value={voucherForm.maxUsagePerUser}
                      onChange={e => setVoucherForm(s => ({ ...s, maxUsagePerUser: e.target.value }))}
                      placeholder="VD: 2"
                    />
                  </div> */}

                  <div className="col-md-4 mb-3">
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
