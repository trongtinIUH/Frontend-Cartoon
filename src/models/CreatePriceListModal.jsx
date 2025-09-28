import { useState } from "react";
import PricingService from "../services/PricingService";

const CreatePriceListModal = ({ isOpen, onClose, onCreated }) => {
    const [formData, setFormData] = useState({
        name: "",
        startDate: "",
        endDate: ""
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const today = new Date().toISOString().split("T")[0];
    const setField = (field, value) => {
        setFormData({
            ...formData,
            [field]: value
        });
    };

    if (!isOpen) return null;

    const validate = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = "Tên bảng giá là bắt buộc";
        if (!formData.startDate) newErrors.startDate = "Ngày bắt đầu là bắt buộc";
        if (!formData.endDate) newErrors.endDate = "Ngày kết thúc là bắt buộc";
        if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
            newErrors.endDate = "Ngày kết thúc phải lớn hơn ngày bắt đầu";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            setSubmitting(true);
            const payload = {
                name: formData.name.trim(),
                startDate: formData.startDate,
                endDate: formData.endDate,
            };
            await PricingService.createPriceList(payload);
            onCreated();
            onClose();
        } catch (error) {
            setErrors({ _global: "Failed to create price list" });
            console.error("Failed to create price list:", error);
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
                                <h5 className="modal-title">Tạo bảng giá mới</h5>
                                <button type="button" className="btn-close" onClick={onClose} />
                            </div>

                            <div className="modal-body">
                                {errors._global && <div className="alert alert-danger">{errors._global}</div>}

                                <div className="mb-3">
                                    <label className="form-label">Tên bảng giá <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className={`text-black form-control ${errors.name ? "is-invalid" : ""}`}
                                        value={formData.name}
                                        onChange={(e) => setField("name", e.target.value)}
                                        placeholder="Ví dụ: Bảng giá tháng 9"
                                    />
                                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                </div>

                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Ngày bắt đầu <span className="text-danger">*</span></label>
                                        <input
                                            type="date"
                                            className={`text-black form-control ${errors.startDate ? "is-invalid" : ""}`}
                                            value={formData.startDate}
                                            min={today}
                                            onChange={(e) => setField("startDate", e.target.value)}
                                        />
                                        {errors.startDate && <div className="invalid-feedback">{errors.startDate}</div>}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Ngày kết thúc <span className="text-danger">*</span></label>
                                        <input
                                            type="date"
                                            className={`text-black form-control ${errors.endDate ? "is-invalid" : ""}`}
                                            value={formData.endDate}
                                            min={formData.startDate || today}
                                            onChange={(e) => setField("endDate", e.target.value)}
                                        />
                                        {errors.endDate && <div className="invalid-feedback">{errors.endDate}</div>}
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" />
                                            Đang tạo...
                                        </>
                                    ) : (
                                        "Tạo bảng giá"
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

export default CreatePriceListModal;