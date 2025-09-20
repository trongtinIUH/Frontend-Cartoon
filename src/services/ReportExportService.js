import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Import font để hỗ trợ tiếng Việt
import 'jspdf/dist/polyfills.es.js';

class ReportExportService {
  
  // Xuất báo cáo PDF
  static async exportToPDF(movieSummary, chartData, topMovies, chartRefs) {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let yPosition = margin;

    try {
      // Header
      pdf.setFontSize(20);
      pdf.setFont('times', 'bold');
      pdf.text('BAO CAO THONG KE PHIM', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString('vi-VN');
      pdf.text(`Ngay xuat bao cao: ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Tổng quan thống kê
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TONG QUAN THONG KE', margin, yPosition);
      yPosition += 10;

      const summaryData = [
        ['Tong so phim', (movieSummary.totalMovies || 0).toLocaleString('vi-VN')],
        ['Phim le', (movieSummary.totalSingle || 0).toLocaleString('vi-VN')],
        ['Phim bo', (movieSummary.totalSeries || 0).toLocaleString('vi-VN')],
        ['Tong so season', (movieSummary.totalSeasons || 0).toLocaleString('vi-VN')],
        ['Tong so tap', (movieSummary.totalEpisodes || 0).toLocaleString('vi-VN')],
        ['Danh gia trung binh', `${(movieSummary.avgRatingAll || 0).toFixed(1)}/5`],
        ['Tong luot danh gia', (movieSummary.totalRatings || 0).toLocaleString('vi-VN')],
        ['The loai pho bien', movieSummary.topGenre || 'N/A'],
        ['Quoc gia hang dau', movieSummary.topCountry || 'N/A'],
      ];

      autoTable(pdf, {
        startY: yPosition,
        head: [['Chi so', 'Gia tri']],
        body: summaryData,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 60 } },
      });

      yPosition = pdf.lastAutoTable.finalY + 15;

      // Phim mới thêm
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PHIM MOI THEM', margin, yPosition);
      yPosition += 10;

      const addedData = [
        ['Hom nay', (movieSummary.addedToday || 0).toLocaleString('vi-VN')],
        ['Tuan nay', (movieSummary.addedThisWeek || 0).toLocaleString('vi-VN')],
        ['Thang nay', (movieSummary.addedThisMonth || 0).toLocaleString('vi-VN')],
      ];

      autoTable(pdf, {
        startY: yPosition,
        head: [['Thoi gian', 'So luong']],
        body: addedData,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [39, 174, 96], textColor: 255 },
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 60 } },
      });

      yPosition = pdf.lastAutoTable.finalY + 15;

      // Top phim theo lượt xem
      if (yPosition > 200) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOP PHIM THEO LUOT XEM', margin, yPosition);
      yPosition += 10;

      if (topMovies.views && topMovies.views.length > 0) {
        const topViewsData = topMovies.views.slice(0, 10).map((movie, index) => [
          index + 1,
          movie.title || '',
          movie.country || '',
          movie.releaseYear || '',
          (movie.viewCount || 0).toLocaleString('vi-VN'),
          (movie.avgRating || 0).toFixed(1)
        ]);

        autoTable(pdf, {
          startY: yPosition,
          head: [['#', 'Ten phim', 'Quoc gia', 'Nam', 'Luot xem', 'Rating']],
          body: topViewsData,
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: [231, 76, 60], textColor: 255 },
          columnStyles: { 
            0: { cellWidth: 10 }, 
            1: { cellWidth: 60 }, 
            2: { cellWidth: 25 },
            3: { cellWidth: 20 },
            4: { cellWidth: 30 },
            5: { cellWidth: 20 }
          },
        });

        yPosition = pdf.lastAutoTable.finalY + 15;
      }

      // Top phim theo rating
      if (yPosition > 200) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOP PHIM THEO DANH GIA', margin, yPosition);
      yPosition += 10;

      if (topMovies.rating && topMovies.rating.length > 0) {
        const topRatingData = topMovies.rating.slice(0, 10).map((movie, index) => [
          index + 1,
          movie.title || '',
          movie.country || '',
          movie.releaseYear || '',
          (movie.avgRating || 0).toFixed(1),
          (movie.ratingCount || 0).toLocaleString('vi-VN')
        ]);

        autoTable(pdf, {
          startY: yPosition,
          head: [['#', 'Ten phim', 'Quoc gia', 'Nam', 'Rating', 'Luot danh gia']],
          body: topRatingData,
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: [155, 89, 182], textColor: 255 },
          columnStyles: { 
            0: { cellWidth: 10 }, 
            1: { cellWidth: 60 }, 
            2: { cellWidth: 25 },
            3: { cellWidth: 20 },
            4: { cellWidth: 20 },
            5: { cellWidth: 30 }
          },
        });
      }

      // Footer
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(`Trang ${i}/${totalPages}`, pageWidth - margin, pdf.internal.pageSize.getHeight() - 10, { align: 'right' });
        pdf.text('CartoonToo - Bao cao thong ke phim', margin, pdf.internal.pageSize.getHeight() - 10);
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

  // Phương thức chuyển đổi text tiếng Việt cho PDF
  static convertToLatin(text) {
    const vietnameseMap = {
      'á': 'a', 'à': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
      'ă': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
      'â': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
      'é': 'e', 'è': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
      'ê': 'e', 'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
      'í': 'i', 'ì': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
      'ó': 'o', 'ò': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
      'ô': 'o', 'ố': 'o', 'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
      'ơ': 'o', 'ớ': 'o', 'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
      'ú': 'u', 'ù': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
      'ư': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
      'ý': 'y', 'ỳ': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
      'đ': 'd',
      'Á': 'A', 'À': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
      'Ă': 'A', 'Ắ': 'A', 'Ằ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
      'Â': 'A', 'Ấ': 'A', 'Ầ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
      'É': 'E', 'È': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
      'Ê': 'E', 'Ế': 'E', 'Ề': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
      'Í': 'I', 'Ì': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
      'Ó': 'O', 'Ò': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
      'Ô': 'O', 'Ố': 'O', 'Ồ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
      'Ơ': 'O', 'Ớ': 'O', 'Ờ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
      'Ú': 'U', 'Ù': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
      'Ư': 'U', 'Ứ': 'U', 'Ừ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
      'Ý': 'Y', 'Ỳ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
      'Đ': 'D'
    };
    
    return text.replace(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸ]/g, function(match) {
      return vietnameseMap[match] || match;
    });
  }
}

export default ReportExportService;