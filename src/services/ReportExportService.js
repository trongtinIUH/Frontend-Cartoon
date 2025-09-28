import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { registerTNR } from "../utils/pdfFont"; 

// Import font để hỗ trợ tiếng Việt
import 'jspdf/dist/polyfills.es.js';

class ReportExportService {
  
  // Xuất báo cáo PDF
  static async exportToPDF(movieSummary, chartData, topMovies, chartRefs) {
    const pdf = new jsPDF('p', 'mm', 'a4');
    await registerTNR(pdf);  
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let yPosition = margin;

    try {
      // Header
      pdf.setFont("TNR", "bold");       // <-- dùng Times New Roman embed
      pdf.setFontSize(14);              // tiêu đề 14 đậm
  pdf.text("BÁO CÁO THỐNG KÊ PHIM", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

      pdf.setFont("TNR", "normal");
      pdf.setFontSize(13);              // nội dung 13 thường
      const currentDate = new Date().toLocaleDateString("vi-VN");
  pdf.text(`Ngày xuất báo cáo: ${currentDate}`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 12;

      // Tổng quan thống kê
      pdf.setFont("TNR", "bold");
      pdf.setFontSize(14);
  pdf.text("TỔNG QUAN THỐNG KÊ", margin, yPosition);
  yPosition += 6;

      const summaryData = [
      ["Tổng số phim", (movieSummary.totalMovies || 0).toLocaleString("vi-VN")],
      ["Phim lẻ", (movieSummary.totalSingle || 0).toLocaleString("vi-VN")],
      ["Phim bộ", (movieSummary.totalSeries || 0).toLocaleString("vi-VN")],
      ["Tổng số season", (movieSummary.totalSeasons || 0).toLocaleString("vi-VN")],
      ["Tổng số tập", (movieSummary.totalEpisodes || 0).toLocaleString("vi-VN")],
      ["Đánh giá trung bình", `${(movieSummary.avgRatingAll || 0).toFixed(1)}/5`],
      ["Tổng lượt đánh giá", (movieSummary.totalRatings || 0).toLocaleString("vi-VN")],
      ["Thể loại phổ biến", movieSummary.topGenre || "N/A"],
      ["Quốc gia hàng đầu", movieSummary.topCountry || "N/A"],
    ];

    autoTable(pdf, {
      startY: yPosition + 2,
      head: [["Chỉ số", "Giá trị"]],
      body: summaryData,
      styles: { font: "TNR", fontStyle: "normal", fontSize: 13 }, // bắt AutoTable dùng TNR
      headStyles: { font: "TNR", fontStyle: "bold", fontSize: 13, fillColor: [41,128,185], textColor: 255 },
      columnStyles: { 0: { cellWidth: 80 } },
      theme: "grid",
      margin: { left: margin, right: margin },
    });

      yPosition = pdf.lastAutoTable.finalY + 10;

      // Phim mới thêm
          if (yPosition > 260) { pdf.addPage(); yPosition = margin; }
          pdf.setFont("TNR", "bold"); pdf.setFontSize(14);
          pdf.text("PHIM MỚI THÊM", margin, yPosition);
          yPosition += 6;


    const addedData = [
      ["Hôm nay", (movieSummary.addedToday || 0).toLocaleString("vi-VN")],
      ["Tuần này", (movieSummary.addedThisWeek || 0).toLocaleString("vi-VN")],
      ["Tháng này", (movieSummary.addedThisMonth || 0).toLocaleString("vi-VN")],
    ];

    autoTable(pdf, {
      startY: yPosition + 2,
      head: [["Thời gian", "Số lượng"]],
      body: addedData,
      styles: { font: "TNR", fontStyle: "normal", fontSize: 13 },
      headStyles: { font: "TNR", fontStyle: "bold", fontSize: 13, fillColor: [39,174,96], textColor: 255 },
      margin: { left: margin, right: margin },
      theme: "grid",
    });

  yPosition = pdf.lastAutoTable.finalY + 10;

      // Top phim theo lượt xem
      if (yPosition > 220) { pdf.addPage(); yPosition = margin; }
    pdf.setFont("TNR", "bold"); pdf.setFontSize(14);
    pdf.text("TOP PHIM THEO LƯỢT XEM", margin, yPosition);
    yPosition += 6;

    if (topMovies.views?.length) {
      const topViewsData = topMovies.views.slice(0, 10).map((m, i) => [
        i + 1, m.title || "", m.country || "", m.releaseYear || "",
        (m.viewCount || 0).toLocaleString("vi-VN"), (m.avgRating || 0).toFixed(1),
      ]);

      autoTable(pdf, {
        startY: yPosition + 2,
        head: [["#", "Tên phim", "Quốc gia", "Năm", "Lượt xem", "Rating"]],
        body: topViewsData,
        styles: { font: "TNR", fontStyle: "normal", fontSize: 13 },
        headStyles: { font: "TNR", fontStyle: "bold", fontSize: 13, fillColor: [231,76,60], textColor: 255 },
        margin: { left: margin, right: margin },
        theme: "striped",
      });

  yPosition = pdf.lastAutoTable.finalY + 10;
    }
      // Top phim theo rating
     if (yPosition > 220) { pdf.addPage(); yPosition = margin; }
   pdf.setFont("TNR", "bold"); pdf.setFontSize(14);
   pdf.text("TOP PHIM THEO ĐÁNH GIÁ", margin, yPosition);
   yPosition += 6;

    if (topMovies.rating?.length) {
      const topRatingData = topMovies.rating.slice(0, 10).map((m, i) => [
        i + 1, m.title || "", m.country || "", m.releaseYear || "",
        (m.avgRating || 0).toFixed(1), (m.ratingCount || 0).toLocaleString("vi-VN"),
      ]);

      autoTable(pdf, {
        startY: yPosition + 2,
        head: [["#", "Tên phim", "Quốc gia", "Năm", "Rating", "Lượt đánh giá"]],
        body: topRatingData,
        styles: { font: "TNR", fontStyle: "normal", fontSize: 13 },
        headStyles: { font: "TNR", fontStyle: "bold", fontSize: 13, fillColor: [155,89,182], textColor: 255 },
        margin: { left: margin, right: margin },
        theme: "striped",
      });
    }

      // Footer
    const total = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        pdf.setPage(i);
        pdf.setFont("TNR", "normal"); pdf.setFontSize(10);
        pdf.text(`Trang ${i}/${total}`, pageWidth - margin, pdf.internal.pageSize.getHeight() - 8, { align: "right" });
        pdf.text("CartoonToo - Báo cáo thống kê phim", margin, pdf.internal.pageSize.getHeight() - 8);
      }


      // Lưu file
      const fileName = `thong-ke-phim-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      return { success: true, fileName };

    } catch (error) {
      console.error('Lỗi xuất PDF:', error);
      return { success: false, error: error.message };
    }
  }

  // Xuất báo cáo Excel
  static exportToExcel(movieSummary, genreStats, countryStats, topMovies) {
    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Tổng quan
      const summaryData = [
        ['Chỉ số', 'Giá trị'],
        ['Tổng số phim', movieSummary.totalMovies || 0],
        ['Phim lẻ', movieSummary.totalSingle || 0],
        ['Phim bộ', movieSummary.totalSeries || 0],
        ['Phim hoàn thành', movieSummary.completedCount || 0],
        ['Phim sắp ra mắt', movieSummary.upcomingCount || 0],
        ['Tổng số season', movieSummary.totalSeasons || 0],
        ['Tổng số tập', movieSummary.totalEpisodes || 0],
        ['Thêm hôm nay', movieSummary.addedToday || 0],
        ['Thêm tuần này', movieSummary.addedThisWeek || 0],
        ['Thêm tháng này', movieSummary.addedThisMonth || 0],
        ['Đánh giá trung bình', parseFloat((movieSummary.avgRatingAll || 0).toFixed(1))],
        ['Tổng lượt đánh giá', movieSummary.totalRatings || 0],
        ['Thể loại phổ biến', movieSummary.topGenre || 'N/A'],
        ['Quốc gia hàng đầu', movieSummary.topCountry || 'N/A'],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng quan');

      // Sheet 2: Thể loại
      if (genreStats && genreStats.length > 0) {
        const genreData = [['Thể loại', 'Số lượng phim']];
        genreStats.forEach(item => {
          genreData.push([item.key || '', item.count || 0]);
        });
        
        const genreSheet = XLSX.utils.aoa_to_sheet(genreData);
        XLSX.utils.book_append_sheet(workbook, genreSheet, 'Thống kê thể loại');
      }

      // Sheet 3: Quốc gia
      if (countryStats && countryStats.length > 0) {
        const countryData = [['Quốc gia', 'Số lượng phim']];
        countryStats.forEach(item => {
          countryData.push([item.key || '', item.count || 0]);
        });
        
        const countrySheet = XLSX.utils.aoa_to_sheet(countryData);
        XLSX.utils.book_append_sheet(workbook, countrySheet, 'Thống kê quốc gia');
      }

      // Sheet 4: Top phim theo lượt xem
      if (topMovies.views && topMovies.views.length > 0) {
        const topViewsData = [['STT', 'Tên phim', 'Quốc gia', 'Năm phát hành', 'Lượt xem', 'Đánh giá', 'Lượt đánh giá', 'Thể loại']];
        topMovies.views.forEach((movie, index) => {
          topViewsData.push([
            index + 1,
            movie.title || '',
            movie.country || '',
            movie.releaseYear || '',
            movie.viewCount || 0,
            parseFloat((movie.avgRating || 0).toFixed(1)),
            movie.ratingCount || 0,
            Array.isArray(movie.genres) ? movie.genres.join(', ') : ''
          ]);
        });
        
        const topViewsSheet = XLSX.utils.aoa_to_sheet(topViewsData);
        XLSX.utils.book_append_sheet(workbook, topViewsSheet, 'Top lượt xem');
      }

      // Sheet 5: Top phim theo rating
      if (topMovies.rating && topMovies.rating.length > 0) {
        const topRatingData = [['STT', 'Tên phim', 'Quốc gia', 'Năm phát hành', 'Đánh giá', 'Lượt đánh giá', 'Lượt xem', 'Thể loại']];
        topMovies.rating.forEach((movie, index) => {
          topRatingData.push([
            index + 1,
            movie.title || '',
            movie.country || '',
            movie.releaseYear || '',
            parseFloat((movie.avgRating || 0).toFixed(1)),
            movie.ratingCount || 0,
            movie.viewCount || 0,
            Array.isArray(movie.genres) ? movie.genres.join(', ') : ''
          ]);
        });
        
        const topRatingSheet = XLSX.utils.aoa_to_sheet(topRatingData);
        XLSX.utils.book_append_sheet(workbook, topRatingSheet, 'Top đánh giá');
      }

      // Lưu file
      const fileName = `thong-ke-phim-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      return { success: true, fileName };

    } catch (error) {
      console.error('Lỗi xuất Excel:', error);
      return { success: false, error: error.message };
    }
  }

  // Xuất nhanh dữ liệu cơ bản (CSV)
  static exportToCSV(topMovies) {
    try {
      // Chỉ xuất top phim theo lượt xem
      if (!topMovies.views || topMovies.views.length === 0) {
        return { success: false, error: 'Không có dữ liệu để xuất' };
      }

      const csvData = [];
      // Header
      csvData.push(['STT', 'Tên phim', 'Quốc gia', 'Năm phát hành', 'Lượt xem', 'Đánh giá', 'Lượt đánh giá']);
      
      // Data rows
      topMovies.views.forEach((movie, index) => {
        csvData.push([
          index + 1,
          `"${(movie.title || '').replace(/"/g, '""')}"`, // Escape quotes
          `"${(movie.country || '').replace(/"/g, '""')}"`,
          movie.releaseYear || '',
          movie.viewCount || 0,
          (movie.avgRating || 0).toFixed(1),
          movie.ratingCount || 0
        ]);
      });

      // Convert to CSV string
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      
      // Add BOM for UTF-8 encoding (để hiển thị tiếng Việt đúng)
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Create download link
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const fileName = `top-phim-luot-xem-${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up
        
        return { success: true, fileName };
      } else {
        return { success: false, error: 'Browser không hỗ trợ download' };
      }

    } catch (error) {
      console.error('Lỗi xuất CSV:', error);
      return { success: false, error: error.message };
    }
  }

 
}

export default ReportExportService;