/**
 * HƯỚNG DẪN CÀI ĐẶT GOOGLE APPS SCRIPT:
 * 1. Mở file Google Sheet của bạn (nhấn [sheet.new] để tạo mới nhanh).
 * 2. Chọn Extensions (Tiện ích mở rộng) -> Apps Script.
 * 3. Xóa mọi mã hiện có và dán toàn bộ đoạn code dưới đây vào.
 * 4. Điền các cấu hình của bạn ở phần CẤU HÌNH bên dưới (Token bí mật).
 * 5. Chọn Deploy (Triển khai) -> New deployment (Triển khai mới).
 * 6. Chọn type là "Web app" (Ứng dụng web) bằng cách click vào biểu tượng Bánh răng.
 * 7. Cấu hình:
 *    - Execute as: "Me" (Tôi)
 *    - Who has access: "Anyone" (Bất kỳ ai)
 * 8. Click Deploy. Bạn sẽ nhận được một "Web App URL" (URL ứng dụng web).
 * 9. Sao chép URL đó và dán vào Cấu hình trên Web Dashboard của bạn.
 */

// ==========================================
// CẤU HÌNH HỆ THỐNG (THAY ĐỔI TẠI ĐÂY)
// ==========================================
var API_TOKEN = "STE_PL_483be52_PRO"; // Token bí mật để xác thực kết nối giữa Web Dashboard và Google Sheet

// Cấu hình tên của các Sheet Tabs
var TAB_INCOME = "TAB_INCOME";
var TAB_FIXED_EXPENSES = "TAB_FIXED_EXPENSES";
var TAB_OTHER_EXPENSES = "TAB_OTHER_EXPENSES";
var TAB_BALANCE = "TAB_BALANCE";

// ==========================================
// MÃ NGUỒN XỬ LÝ (KHÔNG THAY ĐỔI DƯỚI ĐÂY)
// ==========================================

// Hàm kiểm tra và tạo các Tab nếu chưa có
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var sheets = [
    { name: TAB_INCOME, headers: ["Ngày", "Nguồn thu", "Số tiền", "Hình thức (Check/Cash)", "Ghi chú"] },
    { name: TAB_FIXED_EXPENSES, headers: ["Tháng (YYYY-MM)", "Hạng mục", "Số tiền", "Trạng thái (Paid/Unpaid)", "Ghi chú"] },
    { name: TAB_OTHER_EXPENSES, headers: ["Ngày", "Hạng mục", "Số tiền", "Nguồn chi (Bank/Cash)", "Ghi chú"] },
    { name: TAB_BALANCE, headers: ["Tham số", "Giá trị"] }
  ];
  
  sheets.forEach(function(s) {
    var sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
      sheet.appendRow(s.headers);
      sheet.getRange(1, 1, 1, s.headers.length).setFontWeight("bold").setBackground("#f3f3f3");
      
      // Nếu là TAB_BALANCE, nạp giá trị mặc định ban đầu
      if (s.name === TAB_BALANCE) {
        sheet.appendRow(["Initial Bank Balance", 0]);
        sheet.appendRow(["Initial Cash Balance", 0]);
      }
    }
  });
}

// Xử lý yêu cầu GET từ Web Dashboard (Đọc dữ liệu)
function doGet(e) {
  setupSheets();
  
  // Xác thực token bảo mật
  var token = e.parameter.token;
  if (token !== API_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Unauthorized access" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var action = e.parameter.action;
  if (action === "getData") {
    var data = fetchAllData();
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: "Invalid action" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Xử lý yêu cầu POST từ Web Dashboard (Ghi dữ liệu)
function doPost(e) {
  setupSheets();
  
  try {
    var postData = JSON.parse(e.postData.contents);
    
    // Yêu cầu POST từ React Web Dashboard
    var token = postData.token;
    if (token !== API_TOKEN) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Unauthorized access" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (postData.action === "addTransaction") {
      var result = addTransaction(postData.data);
      return ContentService.createTextOutput(JSON.stringify({ success: true, result: result }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (postData.action === "addTransactions") {
      var txList = postData.data;
      var results = [];
      if (Array.isArray(txList)) {
        for (var i = 0; i < txList.length; i++) {
          results.push(addTransaction(txList[i]));
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, results: results }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: "Invalid request" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Hàm lấy dữ liệu và tính toán số dư
function fetchAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Đọc số dư đầu kỳ
  var balanceSheet = ss.getSheetByName(TAB_BALANCE);
  var balanceRows = balanceSheet.getDataRange().getValues();
  var initialBank = 0;
  var initialCash = 0;
  for (var i = 1; i < balanceRows.length; i++) {
    if (balanceRows[i][0] === "Initial Bank Balance") initialBank = Number(balanceRows[i][1]) || 0;
    if (balanceRows[i][0] === "Initial Cash Balance") initialCash = Number(balanceRows[i][1]) || 0;
  }
  
  // Lấy danh sách Thu nhập
  var incomeSheet = ss.getSheetByName(TAB_INCOME);
  var incomeRows = incomeSheet.getDataRange().getValues();
  var incomes = [];
  var totalCheckIncome = 0;
  var totalCashIncome = 0;
  for (var i = 1; i < incomeRows.length; i++) {
    var date = formatDate(incomeRows[i][0]);
    var source = incomeRows[i][1];
    var amount = Number(incomeRows[i][2]) || 0;
    var type = incomeRows[i][3]; // Check / Cash
    var notes = incomeRows[i][4];
    
    incomes.push({ date: date, source: source, amount: amount, type: type, notes: notes });
    
    if (type === "Check") {
      totalCheckIncome += amount;
    } else {
      totalCashIncome += amount;
    }
  }
  
  // Lấy danh sách Chi phí cố định
  var fixedSheet = ss.getSheetByName(TAB_FIXED_EXPENSES);
  var fixedRows = fixedSheet.getDataRange().getValues();
  var fixedExpenses = [];
  var totalPaidFixed = 0;
  for (var i = 1; i < fixedRows.length; i++) {
    var month = fixedRows[i][0];
    var cat = fixedRows[i][1];
    var amount = Number(fixedRows[i][2]) || 0;
    var status = fixedRows[i][3]; // Paid / Unpaid
    var notes = fixedRows[i][4];
    
    fixedExpenses.push({ month: month, category: cat, amount: amount, status: status, notes: notes });
    
    if (status === "Paid") {
      totalPaidFixed += amount;
    }
  }
  
  // Lấy danh sách Chi phí khác (biến động)
  var otherSheet = ss.getSheetByName(TAB_OTHER_EXPENSES);
  var otherRows = otherSheet.getDataRange().getValues();
  var otherExpenses = [];
  var totalOtherBank = 0;
  var totalOtherCash = 0;
  for (var i = 1; i < otherRows.length; i++) {
    var date = formatDate(otherRows[i][0]);
    var cat = otherRows[i][1];
    var amount = Number(otherRows[i][2]) || 0;
    var source = otherRows[i][3]; // Bank / Cash
    var notes = otherRows[i][4];
    
    otherExpenses.push({ date: date, category: cat, amount: amount, source: source, notes: notes });
    
    if (source === "Bank") {
      totalOtherBank += amount;
    } else {
      totalOtherCash += amount;
    }
  }
  
  // Tính toán số dư hiện tại theo công thức
  var currentBank = initialBank + totalCheckIncome - totalPaidFixed - totalOtherBank;
  var currentCash = initialCash + totalCashIncome - totalOtherCash;
  
  return {
    initialBank: initialBank,
    initialCash: initialCash,
    currentBank: currentBank,
    currentCash: currentCash,
    totalCheckIncome: totalCheckIncome,
    totalCashIncome: totalCashIncome,
    totalPaidFixed: totalPaidFixed,
    totalOtherBank: totalOtherBank,
    totalOtherCash: totalOtherCash,
    incomes: incomes,
    fixedExpenses: fixedExpenses,
    otherExpenses: otherExpenses
  };
}

// Thêm một giao dịch mới từ Web API
function addTransaction(tx) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dateStr = tx.date || Utilities.formatDate(new Date(), "GMT-5", "yyyy-MM-dd");
  
  if (tx.type === "income") {
    var sheet = ss.getSheetByName(TAB_INCOME);
    sheet.appendRow([dateStr, tx.category, Number(tx.amount), tx.method, tx.notes || ""]);
    return "Đã ghi nhận thu nhập: " + tx.category + " $" + tx.amount + " (" + tx.method + ")";
  } else {
    var sheet = ss.getSheetByName(TAB_OTHER_EXPENSES);
    sheet.appendRow([dateStr, tx.category, Number(tx.amount), tx.method, tx.notes || ""]);
    return "Đã ghi nhận chi phí: " + tx.category + " $" + tx.amount + " (" + tx.method + ")";
  }
}

// Helper định dạng ngày
function formatDate(dateVal) {
  if (!dateVal) return "";
  if (dateVal instanceof Date) {
    return Utilities.formatDate(dateVal, "GMT-5", "yyyy-MM-dd");
  }
  return dateVal.toString().substring(0, 10);
}
