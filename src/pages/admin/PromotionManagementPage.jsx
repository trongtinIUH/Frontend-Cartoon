// PromotionManagementPage.jsx
import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import PromotionService from "../../services/PromotionService";
import PromotionLineService from "../../services/PromotionLineService"; // <-- thêm
import PromotionCreateModal from "../../models/PromotionCreateModal";
import PromotionLineCreateModal from "../../models/PromotionLineCreateModal";
import PromotionDetailModal from "../../models/PromotionDetailModal";

const PromotionManagementPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [createPromotionOpen, setCreatePromotionOpen] = useState(false);
  const [createPromotionLineOpen, setCreatePromotionLineOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [createLineForPromotion, setCreateLineForPromotion] = useState(null);
  const [editingPromotionLine, setEditingPromotionLine] = useState(null);

  const [expandedPromoIds, setExpandedPromoIds] = useState(new Set());
  const [linesByPromotion, setLinesByPromotion] = useState({});
  const [loadingLines, setLoadingLines] = useState({});

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPromotion, setDetailPromotion] = useState(null);
  const [detailLine, setDetailLine] = useState(null);
  const [detailMode, setDetailMode] = useState(null);
  const [detailTitleSuffix, setDetailTitleSuffix] = useState("");

  const fetchPromotions = useCallback(async () => {
    try {
      const data = await PromotionService.getAllPromotions();
      setPromotions(data || []);
    } catch (error) {
      console.error("Failed to fetch promotions:", error);
    }
  }, []);

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  const toggleExpand = async (p) => {
    const id = p.promotionId;
    const next = new Set(expandedPromoIds);
    if (next.has(id)) {
      next.delete(id);
      setExpandedPromoIds(next);
      return;
    }
    next.add(id);
    setExpandedPromoIds(next);

    if (!linesByPromotion[id]) {
      setLoadingLines(s => ({ ...s, [id]: true }));
      try {
        const lines = await PromotionLineService.getAllPromotionLinesByPromotionId(id);
        setLinesByPromotion(s => ({ ...s, [id]: Array.isArray(lines) ? lines : [] }));
      } catch (e) {
        console.error("Load lines failed:", e);
        setLinesByPromotion(s => ({ ...s, [id]: [] }));
      } finally {
        setLoadingLines(s => ({ ...s, [id]: false }));
      }
    }
  };

  const fmtDate = (d) => {
    if (!d) return "-";
    try { return new Date(d).toLocaleDateString(); } catch { return d; }
  };

  const handleOpenCreateModal = () => {
    setEditingPromotion(null);
    setCreatePromotionOpen(true);
  };

  const handleEditModalOpen = (promotion) => {
    setEditingPromotion(promotion);
    setCreatePromotionOpen(true);
  };

  const handleCreateLineModalOpen = (promotion) => {
    setCreateLineForPromotion(promotion);
    setEditingPromotionLine(null);
    setCreatePromotionLineOpen(true);
  };

  const handleEditLineModalOpen = (promotion, line) => {
    setCreateLineForPromotion(promotion);
    setEditingPromotionLine(line);
    setCreatePromotionLineOpen(true);
  };

  const openDetailModal = (promotion, line) => {
    const type = (line?.promotionLineType || "").toUpperCase();
    const mode = type === "PACKAGE" ? "PACKAGE" : "VOUCHER";
    setDetailPromotion(promotion);
    setDetailLine(line);
    setDetailMode(mode);
    setDetailTitleSuffix(line?.name || line?.promotionLineName || line?.promotionLineId || "");
    setDetailOpen(true);
  };

  return (
    <div className="d-flex bg-white min-vh-100">
      <Sidebar />
      <div className="flex-grow-1 ms-250 p-4" style={{ marginLeft: '250px' }}>
        <h2 className="mb-4 fw-bold">QUẢN LÝ KHUYẾN MÃI</h2>

        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center" style={{ flexWrap: "wrap" }}>
            <div style={{ maxWidth: 400, width: "100%" }}>
              <div className="input-group">
                <input type="search" className="form-control rounded-start" placeholder="Tìm kiếm khuyến mãi" />
                <span className="btn btn-outline-secondary rounded-end">
                  <i className="fa fa-search" />
                </span>
              </div>
            </div>
            <div className="mt-2 mt-md-0">
              <button className="btn btn-primary px-5" onClick={handleOpenCreateModal}>
                <i className="fa fa-plus me-2" /> Tạo khuyến mãi
              </button>
            </div>
          </div>

          <div className="card-body">
            <table className="table table-striped table-bordered table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>ID</th>
                  <th>Tên khuyến mãi</th>
                  <th>Mô tả</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                  <th>Trạng thái</th>
                  <th style={{ width: 180 }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map(p => {
                  const expanded = expandedPromoIds.has(p.promotionId);
                  const lines = linesByPromotion[p.promotionId] || [];
                  const isLoading = !!loadingLines[p.promotionId];

                  return (
                    <React.Fragment key={p.promotionId}>
                      <tr>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => toggleExpand(p)}
                            aria-expanded={expanded}
                            aria-label={expanded ? "Thu gọn" : "Mở rộng"}
                            title={expanded ? "Thu gọn" : "Xem Lines"}
                          >
                            <i className={`fa ${expanded ? "fa-chevron-up" : "fa-chevron-down"}`} />
                          </button>
                        </td>
                        <td>{p.promotionId}</td>
                        <td>{p.promotionName}</td>
                        <td>{p.description}</td>
                        <td>{fmtDate(p.startDate)}</td>
                        <td>{fmtDate(p.endDate)}</td>
                        <td>
                          <span
                            className={`badge ${p.status === 'ACTIVE'
                              ? 'bg-success'
                              : "bg-secondary"
                              }`}
                          >
                            {p.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`btn btn-sm ${p.status === "EXPIRED"
                                ? "btn-outline-secondary"
                                : "btn-outline-primary"
                              }`}
                            style={{
                              borderRadius: 10,
                              padding: "5px 10px",
                              fontSize: "14px",
                              cursor:
                                p.status === "EXPIRED"
                                  ? "not-allowed"
                                  : "pointer",
                              pointerEvents:
                                p.status === "EXPIRED" ? "none" : "auto",
                              opacity: p.status === "EXPIRED" ? 0.6 : 1,
                            }}
                            title={
                              p.status === "EXPIRED"
                                ? "Bảng giá đã hết hạn, không thể chỉnh sửa"
                                : ""
                            }
                            onClick={() =>
                              p.status !== "EXPIRED" &&
                              handleEditModalOpen(p)
                            }
                          >
                            <i className="fa-solid fa-pen-to-square"></i> Chỉnh sửa
                          </span>
                        </td>
                      </tr>

                      {expanded && (
                        <tr>
                          <td colSpan={8} className="bg-light">
                            <div className="p-3">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="m-0">Promotion Lines</h6>
                                {/* nếu muốn: thêm nút “Tạo line” mở modal riêng */}
                                <div className="mt-2 mt-md-0">
                                  <button
                                    className="btn btn-primary btn-sm px-4"
                                    onClick={() => handleCreateLineModalOpen(p)}
                                    disabled={p.status === "EXPIRED"}
                                    title={p.status === "EXPIRED" ? "Khuyến mãi đã hết hạn, không thể thêm line mới" : ""}
                                  >
                                    <i className="fa fa-plus me-2" /> Tạo Line
                                  </button>
                                </div>
                              </div>

                              <div className="table-responsive">
                                <table className="table table-sm table-bordered">
                                  <thead>
                                    <tr className="table-secondary">
                                      <th>ID</th>
                                      <th>Tên Line</th>
                                      <th>Loại</th>
                                      <th>Bắt đầu</th>
                                      <th>Kết thúc</th>
                                      <th>Trạng thái</th>
                                      <th>Hành động</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {isLoading ? (
                                      <tr>
                                        <td colSpan={7} className="text-center text-muted">Đang tải lines…</td>
                                      </tr>
                                    ) : lines.length ? (
                                      lines.map(line => (
                                        <tr key={line.promotionLineId}>
                                          <td className="fw-semibold">{line.promotionLineId}</td>
                                          <td className="fw-semibold">{line.promotionLineName}</td>
                                          <td><span className="badge bg-dark">{(line.promotionLineType).toUpperCase()}</span></td>
                                          <td>{fmtDate(line.startDate)}</td>
                                          <td>{fmtDate(line.endDate)}</td>
                                          <td>
                                            <span
                                              className={`badge ${line.status === 'ACTIVE'
                                                ? 'bg-success'
                                                : line.status === 'EXPIRED'
                                                  ? 'bg-danger'
                                                  : "bg-secondary"
                                                }`}
                                            >
                                              {line.status === 'ACTIVE'
                                                ? 'Hoạt động'
                                                : line.status === 'EXPIRED'
                                                  ? 'Hết hạn'
                                                  : 'Không hoạt động'}
                                            </span>
                                          </td>
                                          <td>
                                            <span
                                              className="btn btn-sm btn-warning me-2"
                                              onClick={() => openDetailModal(p, line)}
                                            >
                                              <i className="fa fa-eye"></i> Xem chi tiết
                                            </span>
                                            <span
                                              className={`btn btn-sm ${line.status === "EXPIRED"
                                                ? "btn-outline-secondary"
                                                : "btn-outline-primary"
                                                }`}
                                              style={{
                                                borderRadius: 10,
                                                padding: "5px 10px",
                                                fontSize: "14px",
                                                cursor:
                                                  line.status === "EXPIRED"
                                                    ? "not-allowed"
                                                    : "pointer",
                                                pointerEvents:
                                                  line.status === "EXPIRED" ? "none" : "auto",
                                                opacity: line.status === "EXPIRED" ? 0.6 : 1,
                                              }}
                                              title={
                                                line.status === "EXPIRED"
                                                  ? "Bảng giá đã hết hạn, không thể chỉnh sửa"
                                                  : ""
                                              }
                                              onClick={() =>
                                                line.status !== "EXPIRED" &&
                                                handleEditLineModalOpen(p, line)
                                              }
                                            >
                                              <i className="fa-solid fa-pen-to-square"></i> Chỉnh sửa
                                            </span>
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan={7} className="text-center text-muted">Chưa có line nào cho khuyến mãi này.</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {promotions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted">Không có khuyến mãi nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <PromotionCreateModal
          open={createPromotionOpen}
          onClose={() => setCreatePromotionOpen(false)}
          onCreated={fetchPromotions}
          existingIds={promotions.map(p => p.promotionId)}
          initialData={editingPromotion}
        />

        <PromotionLineCreateModal
          open={createPromotionLineOpen}
          promotion={createLineForPromotion}
          onClose={() => setCreatePromotionLineOpen(false)}
          existingIds={Object.values(linesByPromotion).flat().map(l => l?.promotionLineId)}
          initialData={editingPromotionLine}
          onCreated={() => {
            if (expandedPromoIds.size === 1) {
              const id = Array.from(expandedPromoIds)[0];
              setLinesByPromotion(s => ({ ...s, [id]: undefined }));
              toggleExpand({ promotionId: id });
            }
          }}
        />

        <PromotionDetailModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          promotion={detailPromotion}
          line={detailLine}
          mode={detailMode}
          titleSuffix={detailTitleSuffix}
          onChanged={() => {
            if (detailPromotion?.promotionId) {
              setLinesByPromotion(s => ({ ...s, [detailPromotion.promotionId]: undefined }));
              toggleExpand({ promotionId: detailPromotion.promotionId });
            }
          }}
        />
      </div>
    </div>
  );
};

export default PromotionManagementPage;
