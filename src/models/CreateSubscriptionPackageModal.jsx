import { useEffect, useState } from "react";
import SubscriptionPackageService from "../services/SubscriptionPackageService";

const emptyForm = {
    packageId: "",
    packageName: "",
    //   packageImage: "",
    applicablePackageType: "",
    durationInDays: "",
    features: "",
};
const CreateSubscriptionPackageModal = ({ isOpen, onClose, onCreated, initialData }) => {
    const isEdit = !!initialData;
    const [formData, setFormData] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        if (isEdit) {
            // map initialData -> form
            setFormData({
                packageId: initialData.packageId || "",
                packageName: initialData.packageName || "",
                // packageImage: "", 
                applicablePackageType: initialData.applicablePackageType || "",
                durationInDays: String(initialData.durationInDays || ""),
                features: Array.isArray(initialData.features) ? initialData.features.join(", ") : "",
            });
            // setPreview(initialData.packageImage || ""); // URL cũ (nếu có)
        } else {
            setFormData(emptyForm);
            // setPreview("");
        }
        setErrors({});
    }, [isOpen, isEdit, initialData]);

    const setField = (field, value) => {
        setFormData({
            ...formData,
            [field]: value
        });
    };

    if (!isOpen) return null;

    const validate = () => {
        const newErrors = {};
        if (!formData.packageId) newErrors.packageId = "ID là bắt buộc";
        if (!formData.packageName) newErrors.packageName = "Tên gói là bắt buộc";
        if (!formData.applicablePackageType) newErrors.applicablePackageType = "Loại gói là bắt buộc";
        if (!formData.durationInDays || isNaN(formData.durationInDays)) newErrors.durationInDays = "Thời gian hợp lệ là bắt buộc";
        if (!formData.features) newErrors.features = "Đặc điểm là bắt buộc";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            setSubmitting(true);
            const payload = {
                packageId: formData.packageId,
                packageName: formData.packageName,
                // packageImage: formData.packageImage,
                applicablePackageType: formData.applicablePackageType,
                durationInDays: parseInt(formData.durationInDays, 10),
                features: formData.features.split(',').map(f => f.trim())
            };
            if (isEdit) {
                await SubscriptionPackageService.updatePackage(initialData.packageId, payload);
            } else {
                await SubscriptionPackageService.createPackage(payload);
            }
            onCreated();
            onClose();
        } catch (error) {
            setErrors({ _global: "Failed to create subscription package" });
            console.error("Failed to create subscription package:", error);
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
                                <h5 className="modal-title">{isEdit ? "Cập nhật gói đăng ký" : "Tạo gói đăng ký mới"}</h5>
                                <button type="button" className="btn-close" onClick={onClose} />
                            </div>

                            <div className="modal-body">
                                {errors._global && <div className="alert alert-danger">{errors._global}</div>}
                                {!isEdit &&
                                    <div className="mb-3">
                                        <label className="form-label">ID<span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className={`text-black form-control ${errors.packageId ? "is-invalid" : ""}`}
                                            value={formData.packageId}
                                            onChange={(e) => setField("packageId", e.target.value)}
                                            placeholder="Ví dụ: 12345"
                                        />
                                        {errors.packageId && <div className="invalid-feedback">{errors.packageId}</div>}
                                    </div>
                                }
                                <div className="mb-3">
                                    <label className="form-label">Tên gói đăng ký <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className={`text-black form-control ${errors.packageName ? "is-invalid" : ""}`}
                                        value={formData.packageName}
                                        onChange={(e) => setField("packageName", e.target.value)}
                                        placeholder="Ví dụ: Gói Premium"
                                    />
                                    {errors.packageName && <div className="invalid-feedback">{errors.packageName}</div>}
                                </div>
                                {/* <div className="mb-3">
                                    <label className="form-label">Hình ảnh <span className="text-danger">*</span></label>
                                    <input
                                        type="file"
                                        className={`text-black form-control ${errors.packageImage ? "is-invalid" : ""}`}
                                        onChange={(e) => setField("packageImage", e.target.files[0])}
                                    />
                                    {errors.packageImage && <div className="invalid-feedback">{errors.packageImage}</div>}
                                </div> */}
                                <div className="mb-3">
                                    <label className="form-label">Loại gói <span className="text-danger">*</span></label>
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
                                    {errors.applicablePackageType && <div className="invalid-feedback">{errors.applicablePackageType}</div>}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Thời gian <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className={`text-black form-control ${errors.durationInDays ? "is-invalid" : ""}`}
                                        value={formData.durationInDays}
                                        onChange={(e) => setField("durationInDays", e.target.value)}
                                        placeholder="Ví dụ: 30"
                                    />
                                    {errors.durationInDays && <div className="invalid-feedback">{errors.durationInDays}</div>}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Đặc điểm <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className={`text-black form-control ${errors.features ? "is-invalid" : ""}`}
                                        value={formData.features}
                                        onChange={(e) => setField("features", e.target.value)}
                                        placeholder="Ví dụ: Xem offline, Chất lượng HD"
                                    />
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