import { useEffect, useState } from "react";
import SubscriptionPackageService from "../services/SubscriptionPackageService";

const emptyForm = {
  packageId: "",
  packageName: "",
  applicablePackageType: "",
  durationInDays: "",
  features: "",
};

const CreateSubscriptionPackageModal = ({
  isOpen,
  onClose,
  onCreated,
  initialData,
  existingIds = [],
}) => {
  const isEdit = !!initialData;
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // NEW: ảnh
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit) {
      setFormData({
        packageId: initialData.packageId || "",
        packageName: initialData.packageName || "",
        applicablePackageType: initialData.applicablePackageType || "",
        durationInDays: String(initialData.durationInDays || ""),
        features: Array.isArray(initialData.features)
          ? initialData.features.join(", ")
          : "",
      });
      setPreview(initialData.imageUrl || ""); // hiện ảnh cũ nếu có
      setImageFile(null); // mặc định không thay ảnh
    } else {
      setFormData(emptyForm);
      setImageFile(null);
      setPreview("");
    }
    setErrors({});
  }, [isOpen, isEdit, initialData]);

  const setField = (field, value) => {
    setFormData((s) => ({ ...s, [field]: value }));
  };

  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      return;
    }
    // Validate nhẹ
    if (!file.type.startsWith("image/")) {
      setErrors((e) => ({ ...e, packageImage: "File phải là ảnh" }));
      return;
    }
    // (tuỳ chọn) giới hạn kích thước 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrors((e) => ({ ...e, packageImage: "Ảnh tối đa 5MB" }));
      return;
    }
    setErrors((e) => ({ ...e, packageImage: undefined }));
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!isEdit) {
      if (!formData.packageId?.trim()) newErrors.packageId = "ID là bắt buộc";
      // so sánh không phân biệt hoa thường
      const idLower = formData.packageId.trim().toLowerCase();
      if (idLower && existingIds.map((x) => (x || "").toLowerCase()).includes(idLower)) {
        newErrors.packageId = "ID đã tồn tại. Vui lòng chọn ID khác.";
      }
    }
    if (!formData.packageName?.trim())
      newErrors.packageName = "Tên gói là bắt buộc";
    if (!formData.applicablePackageType)
      newErrors.applicablePackageType = "Loại gói là bắt buộc";
    if (
      !formData.durationInDays ||
      isNaN(formData.durationInDays) ||
      parseInt(formData.durationInDays, 10) <= 0
    )
      newErrors.durationInDays = "Thời gian hợp lệ là bắt buộc";
    if (!formData.features?.trim())
      newErrors.features = "Đặc điểm là bắt buộc";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);

      const payload = {
        packageId: formData.packageId.trim(),
        packageName: formData.packageName.trim(),
        applicablePackageType: formData.applicablePackageType,
        durationInDays: parseInt(formData.durationInDays, 10),
        // FE nhập chuỗi -> convert thành mảng string
        features: formData.features
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),
        // imageUrl KHÔNG gửi ở đây — backend sẽ set sau khi upload ảnh
      };

      if (isEdit) {
        await SubscriptionPackageService.updatePackage(
          initialData.packageId,
          payload,
          imageFile 
        );
      } else {
        await SubscriptionPackageService.createPackage(payload, imageFile);
      }

      onCreated?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      const msg =
        (err && err.message) ||
        (typeof err === "string" ? err : "Failed to create subscription package");
      setErrors({ _global: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} />
      <div className="modal fade show" style={{ display: "block", zIndex: 1050 }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">
                  {isEdit ? "Cập nhật gói đăng ký" : "Tạo gói đăng ký mới"}
                </h5>
                <button type="button" className="btn-close" onClick={onClose} />
              </div>

              <div className="modal-body">
                {errors._global && <div className="alert alert-danger">{errors._global}</div>}

                {!isEdit && (
                  <div className="mb-3">
                    <label className="form-label">
                      ID<span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`text-black form-control ${errors.packageId ? "is-invalid" : ""}`}
                      value={formData.packageId}
                      onChange={(e) => setField("packageId", e.target.value)}
                      placeholder="Ví dụ: mega_180"
                    />
                    {errors.packageId && <div className="invalid-feedback">{errors.packageId}</div>}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">
                    Tên gói đăng ký <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`text-black form-control ${errors.packageName ? "is-invalid" : ""}`}
                    value={formData.packageName}
                    onChange={(e) => setField("packageName", e.target.value)}
                    placeholder="Ví dụ: Gói Premium"
                  />
                  {errors.packageName && <div className="invalid-feedback">{errors.packageName}</div>}
                </div>

                {/* ẢNH: tuỳ chọn */}
                <div className="mb-3">
                  <label className="form-label">Hình ảnh (tuỳ chọn)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className={`text-black form-control ${errors.packageImage ? "is-invalid" : ""}`}
                    onChange={onPickImage}
                  />
                  {errors.packageImage && (
                    <div className="invalid-feedback">{errors.packageImage}</div>
                  )}
                  {preview && (
                    <div className="mt-2">
                      <img
                        src={preview}
                        alt="preview"
                        style={{ maxWidth: 240, maxHeight: 160, objectFit: "cover", borderRadius: 8 }}
                      />
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Loại gói <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`text-black form-select ${errors.applicablePackageType ? "is-invalid" : ""}`}
                    value={formData.applicablePackageType}
                    onChange={(e) => setField("applicablePackageType", e.target.value)}
                  >
                    <option value="">Chọn loại gói</option>
                    <option value="NO_ADS">NO ADS</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="MEGA_PLUS">MEGA+</option>
                    <option value="COMBO_PREMIUM_MEGA_PLUS">COMBO</option>
                  </select>
                  {errors.applicablePackageType && (
                    <div className="invalid-feedback">{errors.applicablePackageType}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Thời gian (ngày) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    className={`text-black form-control ${errors.durationInDays ? "is-invalid" : ""}`}
                    value={formData.durationInDays}
                    onChange={(e) => setField("durationInDays", e.target.value)}
                    placeholder="Ví dụ: 30"
                  />
                  {errors.durationInDays && (
                    <div className="invalid-feedback">{errors.durationInDays}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Đặc điểm <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`text-black form-control ${errors.features ? "is-invalid" : ""}`}
                    value={formData.features}
                    onChange={(e) => setField("features", e.target.value)}
                    placeholder="Ví dụ: Xem offline, Chất lượng HD"
                  />
                  <div className="form-text">
                    Nhập nhiều mục, phân tách bởi dấu phẩy. Ví dụ: <code>Xem offline, HD, 2 thiết bị</code>
                  </div>
                  {errors.features && <div className="invalid-feedback">{errors.features}</div>}
                </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      {isEdit ? "Đang cập nhật..." : "Đang tạo..."}
                    </>
                  ) : (
                    isEdit ? "Cập nhật gói" : "Tạo gói đăng ký"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateSubscriptionPackageModal;
