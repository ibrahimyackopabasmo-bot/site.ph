// Google Sheets Configuration
const REFRESH_INTERVAL = 80000; // 80 seconds in milliseconds
// Use server-side proxy to avoid CORS issues
const GOOGLE_SHEETS_API_URL = '/api/google-sheets';

// Table access is now controlled by admin status (no password needed for admins)

// Global variables
let sheetData = null;
let refreshIntervalId = null;
let isLoading = false;

document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('searchForm');
    const searchBtn = document.getElementById('searchBtn');
    const searchBtnText = document.getElementById('searchBtnText');
    const searchBtnLoader = document.getElementById('searchBtnLoader');
    const refreshBtn = document.getElementById('refreshBtn');
    const refreshStatus = document.getElementById('refreshStatus');
    const lastUpdate = document.getElementById('lastUpdate');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const searchResults = document.getElementById('searchResults');
    const resultsContent = document.getElementById('resultsContent');
    const noResults = document.getElementById('noResults');
    const searchNameInput = document.getElementById('searchName');
    const searchDayInput = document.getElementById('searchDay');
    const searchMonthInput = document.getElementById('searchMonth');
    const searchYearInput = document.getElementById('searchYear');
    const sheetDataTable = document.getElementById('sheetDataTable');
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    const toggleTableBtn = document.getElementById('toggleTableBtn');
    // Password modal removed - using admin authentication instead
    
    let tableVisible = false;
    
    // Check if user is admin (from auth.js)
    function isUserAdmin() {
        if (typeof isAdmin === 'function') {
            return isAdmin();
        }
        return false;
    }
    
    // Check admin status on load
    function checkAdminStatus() {
        const isAdminUser = isUserAdmin();
        if (!isAdminUser && toggleTableBtn) {
            // Hide table button for non-admin users
            toggleTableBtn.style.display = 'none';
        } else if (isAdminUser && toggleTableBtn) {
            toggleTableBtn.style.display = 'inline-block';
            toggleTableBtn.textContent = 'عرض/إخفاء الجدول';
        }
    }
    checkAdminStatus();

    // Load sheet data on page load
    // Show loading indicator initially
    loadingIndicator.style.display = 'block';
    refreshStatus.textContent = 'جاري تحميل البيانات...';
    loadSheetData(true); // true = initial load
    
    // Search form submission
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchName = searchNameInput ? searchNameInput.value.trim() : '';
            const searchDay = searchDayInput ? searchDayInput.value.trim() : '';
            const searchMonth = searchMonthInput ? searchMonthInput.value.trim() : '';
            const searchYear = searchYearInput ? searchYearInput.value.trim() : '';
            
            // Validate name is required
            if (!searchName) {
                errorMessage.textContent = 'يرجى إدخال الاسم الكامل';
                errorMessage.style.display = 'block';
                return;
            }
            
            // At least one date field should be filled
            if (!searchDay && !searchMonth && !searchYear) {
                errorMessage.textContent = 'يرجى إدخال على الأقل يوم أو شهر أو سنة';
                errorMessage.style.display = 'block';
                return;
            }
            
            const dateFilter = {
                day: searchDay,
                month: searchMonth,
                year: searchYear
            };
            
            console.log('Form submitted, searching for:', { name: searchName, dateFilter: dateFilter });
            performSearch(searchName, dateFilter, false);
        });
    }
    
    
    // Toggle sheet data table visibility (admin only)
    if (toggleTableBtn) {
        toggleTableBtn.addEventListener('click', function() {
            // Check admin status
            if (!isUserAdmin()) {
                alert('ليس لديك صلاحية لعرض الجدول. يجب أن تكون مسؤولاً.');
                return;
            }
            
            // Admin verified - toggle table
            if (sheetDataTable) {
                tableVisible = !tableVisible;
                if (tableVisible) {
                    sheetDataTable.style.display = 'block';
                    toggleTableBtn.textContent = 'إخفاء الجدول';
                } else {
                    sheetDataTable.style.display = 'none';
                    toggleTableBtn.textContent = 'عرض الجدول';
                }
            }
        });
    }

    // Manual refresh button
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadSheetData(false);
        });
    }

    // Auto-refresh every 80 seconds
    refreshIntervalId = setInterval(function() {
        if (!isLoading && sheetData) {
            loadSheetData(true); // true = silent refresh
        }
    }, REFRESH_INTERVAL);

    // Function to load data from Google Sheets
    function loadSheetData(silent = false) {
        if (isLoading) return;
        
        isLoading = true;
        errorMessage.style.display = 'none';
        
        if (!silent) {
            loadingIndicator.style.display = 'block';
            refreshStatus.textContent = 'جاري التحديث...';
        }

        // Fetch data from Google Sheets via server proxy
        fetch(GOOGLE_SHEETS_API_URL)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.details || err.error || 'فشل في تحميل البيانات من جدول جوجل');
                    });
                }
                return response.json();
            })
            .then(data => {
                // Validate data structure
                if (!data || !data.table) {
                    throw new Error('البيانات المستلمة غير صحيحة. يرجى التحقق من أن الجدول يحتوي على بيانات.');
                }
                
                const rows = data.table.rows;
                if (!rows || rows.length === 0) {
                    throw new Error('الجدول فارغ أو لا يحتوي على بيانات.');
                }
                
                console.log('Sheet data loaded successfully:', {
                    totalRows: rows.length,
                    columns: data.table.cols ? data.table.cols.length : 0
                });
                
                // Store the data globally
                sheetData = data;
                
                // Display full sheet data table (but keep it hidden by default)
                displaySheetDataTable();
                // Hide table by default initially (password required)
                if (sheetDataTable) {
                    sheetDataTable.style.display = 'none';
                }
                // Update button text based on password status
                if (toggleTableBtn) {
                    if (isPasswordVerified) {
                        toggleTableBtn.textContent = 'عرض الجدول';
                    } else {
                        toggleTableBtn.textContent = 'عرض الجدول (يتطلب كلمة مرور)';
                    }
                }
                
                // Update status
                const now = new Date();
                const timeString = now.toLocaleTimeString('ar-SA', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                });
                refreshStatus.textContent = 'جاهز للبحث';
                lastUpdate.textContent = `آخر تحديث: ${timeString}`;
                lastUpdate.style.display = 'inline';
                
                loadingIndicator.style.display = 'none';
                isLoading = false;

                // If there was a previous search, re-run it
                if (searchNameInput && searchNameInput.value.trim()) {
                    const searchName = searchNameInput.value.trim();
                    const dateFilter = {
                        day: searchDayInput ? searchDayInput.value.trim() : '',
                        month: searchMonthInput ? searchMonthInput.value.trim() : '',
                        year: searchYearInput ? searchYearInput.value.trim() : ''
                    };
                    performSearch(searchName, dateFilter, true);
                }
            })
            .catch(error => {
                console.error('Error loading sheet data:', error);
                let errorMsg = `خطأ في تحميل البيانات: ${error.message}`;
                errorMsg += '<br><br>يرجى التأكد من:';
                errorMsg += '<br>1. أن الجدول منشور للعامة (File → Share → Publish to web)';
                errorMsg += '<br>2. أن معرف الجدول صحيح';
                errorMsg += '<br>3. أن الجدول يحتوي على بيانات';
                errorMessage.innerHTML = errorMsg;
                errorMessage.style.display = 'block';
                loadingIndicator.style.display = 'none';
                refreshStatus.textContent = 'فشل التحديث';
                isLoading = false;
            });
    }

    // Function to manage cancelled debts - defined early so it can be used in performSearch
    const CANCELLED_DEBTS_STORAGE_KEY = 'cancelled_debts';
    
    function getCancelledDebts() {
        try {
            const stored = localStorage.getItem(CANCELLED_DEBTS_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading cancelled debts:', e);
            return [];
        }
    }
    
    function saveCancelledDebts(cancelledDebts) {
        try {
            localStorage.setItem(CANCELLED_DEBTS_STORAGE_KEY, JSON.stringify(cancelledDebts));
        } catch (e) {
            console.error('Error saving cancelled debts:', e);
        }
    }
    
    function addCancelledDebt(name, date) {
        const cancelledDebts = getCancelledDebts();
        // Normalize name and date for consistent matching
        const normalizedName = name.toLowerCase().trim().replace(/\s+/g, ' ');
        const normalizedDate = (date || '').trim();
        const key = `${normalizedName}|${normalizedDate}`;
        
        // Check if already cancelled
        if (!cancelledDebts.includes(key)) {
            cancelledDebts.push(key);
            saveCancelledDebts(cancelledDebts);
            console.log('Debt cancelled:', { name, date, key });
        }
    }
    
    function isDebtCancelled(name, date) {
        const cancelledDebts = getCancelledDebts();
        // Normalize name and date for consistent matching
        const normalizedName = name.toLowerCase().trim().replace(/\s+/g, ' ');
        const normalizedDate = (date || '').trim();
        const key = `${normalizedName}|${normalizedDate}`;
        return cancelledDebts.includes(key);
    }

    // Function to perform search
    function performSearch(searchName, dateFilter, silent = false) {
        // Always re-enable button at start (in case it was disabled)
        if (searchBtn) {
            searchBtn.disabled = false;
            if (searchBtnText) searchBtnText.style.display = 'inline';
            if (searchBtnLoader) searchBtnLoader.style.display = 'none';
        }

        if (!sheetData) {
            errorMessage.textContent = 'البيانات غير متاحة. يرجى تحديث البيانات أولاً. يرجى الانتظار حتى يتم تحميل البيانات.';
            errorMessage.style.display = 'block';
            return;
        }

        // Hide previous results
        if (searchResults) searchResults.style.display = 'none';
        if (noResults) noResults.style.display = 'none';
        errorMessage.style.display = 'none';

        if (!silent && searchBtn) {
            searchBtn.disabled = true;
            if (searchBtnText) searchBtnText.style.display = 'none';
            if (searchBtnLoader) searchBtnLoader.style.display = 'inline-block';
        }

        try {
            // Validate sheetData structure
            if (!sheetData || !sheetData.table) {
                throw new Error('البيانات غير متاحة. يرجى تحديث البيانات أولاً.');
            }

            const rows = sheetData.table.rows;
            const cols = sheetData.table.cols;

            if (!rows || rows.length === 0) {
                showNoResults();
                if (!silent) {
                    if (searchBtn) searchBtn.disabled = false;
                    if (searchBtnText) searchBtnText.style.display = 'inline';
                    if (searchBtnLoader) searchBtnLoader.style.display = 'none';
                }
                return;
            }

            console.log('Starting search for:', { name: searchName, dateFilter: dateFilter });
            console.log('Total rows in sheet:', rows.length);

            // Normalize search name (remove extra spaces, convert to lowercase, handle Arabic text)
            const normalizedSearchName = searchName ? searchName.toLowerCase().trim().replace(/\s+/g, ' ') : '';
            
            // Extract date filter values
            const searchDay = dateFilter ? dateFilter.day : '';
            const searchMonth = dateFilter ? dateFilter.month : '';
            const searchYear = dateFilter ? dateFilter.year : '';

            // Find the header row dynamically - look for row containing "الاسم" (Name)
            let headerRowIndex = -1;
            let dataStartIndex = 0;
            const columnHeaders = {};
            let nameColumnIndex = 0;
            let dateColumnIndex = -1;
            let religionColumnIndex = -1; // الدين column index
            
            // Search for the header row (contains "الاسم")
            for (let i = 0; i < Math.min(20, rows.length); i++) {
                const row = rows[i];
                if (row && row.c && row.c.length > 0) {
                    // Check if this row contains the header "الاسم"
                    const firstCell = row.c[0];
                    if (firstCell && firstCell.v !== null && firstCell.v !== undefined) {
                        const cellValue = String(firstCell.v).trim();
                        // Check for header row - look for "الاسم"
                        if (cellValue === 'الاسم' || cellValue.includes('الاسم')) {
                            headerRowIndex = i;
                            dataStartIndex = i + 1; // Data starts after header
                            
                            // Extract column headers and find important column indices
                            row.c.forEach((cell, idx) => {
                                if (cell && cell.v !== null && cell.v !== undefined) {
                                    const headerLabel = String(cell.v).trim();
                                    columnHeaders[idx] = headerLabel || `العمود ${idx + 1}`;
                                    
                                    // Find date column (التاريخ)
                                    if (headerLabel.includes('التاريخ') || headerLabel.includes('تاريخ')) {
                                        dateColumnIndex = idx;
                                    }
                                    // Find religion/debt column (الدين)
                                    if (headerLabel.includes('الدين') || headerLabel.includes('دين')) {
                                        religionColumnIndex = idx;
                                    }
                                } else {
                                    columnHeaders[idx] = `العمود ${idx + 1}`;
                                }
                            });
                            console.log('Found header row at index:', headerRowIndex);
                            console.log('Column headers:', columnHeaders);
                            console.log('Date column index:', dateColumnIndex);
                            console.log('Religion column index:', religionColumnIndex);
                            break;
                        }
                    }
                }
            }
            
            // If header not found, try to use cols array or assume structure
            if (headerRowIndex === -1) {
                console.log('Header row not found, using fallback');
                // Try to get headers from cols array if available
                if (cols && cols.length > 0) {
                    cols.forEach((col, idx) => {
                        columnHeaders[idx] = col.label || `العمود ${idx + 1}`;
                    });
                    // Assume data starts from row 10 (index 9 is header, index 10 is first data row)
                    headerRowIndex = 9;
                    dataStartIndex = 10;
                } else {
                    // Last resort: use generic column names and start from row 11
                    columnHeaders[0] = 'الاسم';
                    columnHeaders[1] = 'المرحلة';
                    columnHeaders[2] = 'الشعبة';
                    columnHeaders[3] = 'التاريخ';
                    columnHeaders[4] = 'نوع الورق';
                    columnHeaders[5] = 'السعر';
                    headerRowIndex = 9;
                    dataStartIndex = 10;
                    // Set default indices
                    dateColumnIndex = 3; // Assuming column 3 is date
                    nameColumnIndex = 0; // Column 0 is name
                    // Try to find religion column in common positions
                    if (!columnHeaders[5] || columnHeaders[5].includes('السعر') || columnHeaders[5].includes('الدين')) {
                        religionColumnIndex = 5;
                    }
                }
            }
            
            // Fallback: if date column not found, try common positions
            if (dateColumnIndex < 0) {
                // Try to find date column by checking common column indices
                for (let idx = 0; idx < Math.min(10, Object.keys(columnHeaders).length); idx++) {
                    const header = columnHeaders[idx];
                    if (header && (header.includes('التاريخ') || header.includes('تاريخ'))) {
                        dateColumnIndex = idx;
                        break;
                    }
                }
                // If still not found, assume column 3 might be date
                if (dateColumnIndex < 0 && columnHeaders[3]) {
                    dateColumnIndex = 3;
                }
            }
            
            // Find matching rows - avoid duplicates
            const matches = [];
            const seenRowIndices = new Set();
            
            console.log('Searching from row index:', dataStartIndex, 'to', rows.length);
            
            // Helper function to parse date from string and extract parts
            function parseDate(dateStr) {
                if (!dateStr) return null;
                
                // Try to parse as Date object
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    return {
                        year: date.getFullYear(),
                        month: date.getMonth() + 1, // 1-12
                        day: date.getDate()
                    };
                }
                
                // Try to extract date parts from string formats (DD/MM/YYYY, YYYY-MM-DD, etc.)
                const dateMatch = dateStr.match(/(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,4})/);
                if (dateMatch) {
                    let year, month, day;
                    // Try to determine format
                    if (dateMatch[1].length === 4) {
                        // YYYY-MM-DD or YYYY/MM/DD
                        year = parseInt(dateMatch[1]);
                        month = parseInt(dateMatch[2]);
                        day = parseInt(dateMatch[3]);
                    } else {
                        // DD/MM/YYYY or MM/DD/YYYY (assume DD/MM/YYYY for Arabic context)
                        day = parseInt(dateMatch[1]);
                        month = parseInt(dateMatch[2]);
                        year = parseInt(dateMatch[3]);
                        if (year < 100) year += 2000; // Convert 2-digit year
                    }
                    return { year, month, day };
                }
                
                return null;
            }
            
            // Helper function to check if date matches filter (day, month, year all checked)
            function dateMatchesFilter(dateStr, filterDay, filterMonth, filterYear) {
                if (!dateStr) return false; // No date in record, no match
                
                // If no date filters provided, don't filter by date
                if (!filterDay && !filterMonth && !filterYear) {
                    return true;
                }
                
                const dateParts = parseDate(dateStr);
                if (!dateParts) {
                    // If we can't parse the date, try simple string matching as fallback
                    const dateStrLower = String(dateStr).toLowerCase().trim();
                    if (filterYear && dateStrLower.includes(filterYear)) {
                        return true; // Year found in string
                    }
                    return false; // Can't parse date and no fallback match
                }
                
                // Check day (if provided)
                const dayMatch = !filterDay || dateParts.day === parseInt(filterDay);
                
                // Check month (if provided)
                const monthMatch = !filterMonth || dateParts.month === parseInt(filterMonth);
                
                // Check year (if provided)
                const yearMatch = !filterYear || dateParts.year === parseInt(filterYear);
                
                // All provided filters must match
                return dayMatch && monthMatch && yearMatch;
            }
            
            // Start searching from data rows (skip header and empty rows)
            for (let rowIndex = dataStartIndex; rowIndex < rows.length; rowIndex++) {
                if (seenRowIndices.has(rowIndex)) {
                    continue; // Skip if we've already added this row
                }
                
                const row = rows[rowIndex];
                if (!row || !row.c || row.c.length === 0) {
                    continue; // Skip empty rows
                }
                
                // Check the name column (الاسم - Name) for matches
                const nameCell = row.c[nameColumnIndex];
                let nameMatches = false;
                if (nameCell && nameCell.v !== null && nameCell.v !== undefined) {
                    const nameValue = String(nameCell.v).trim();
                    const nameValueLower = nameValue.toLowerCase().replace(/\s+/g, ' ');
                    
                    // Skip if this is an empty name or header-like value
                    if (!nameValue || nameValue.length < 2) {
                        continue;
                    }
                    
                    // Check if the search name matches (partial or full match)
                    nameMatches = nameValueLower.includes(normalizedSearchName) || 
                                 normalizedSearchName.includes(nameValueLower) ||
                                 nameValueLower.startsWith(normalizedSearchName) ||
                                 normalizedSearchName.startsWith(nameValueLower);
                }
                
                // Check the date column for matches
                let dateMatches = false;
                if (dateColumnIndex >= 0) {
                    const dateCell = row.c[dateColumnIndex];
                    if (dateCell && dateCell.v !== null && dateCell.v !== undefined) {
                        const dateValue = String(dateCell.v).trim();
                        dateMatches = dateMatchesFilter(dateValue, searchDay, searchMonth, searchYear);
                    }
                } else {
                    // If no date column, consider it a match if no date filters provided
                    dateMatches = !searchDay && !searchMonth && !searchYear;
                }
                
                // Name AND date must match
                if (nameMatches && dateMatches) {
                    // Get name and date values first to check if debt is cancelled
                    const nameValue = nameCell && nameCell.v ? String(nameCell.v).trim() : '';
                    let dateValue = '';
                    if (dateColumnIndex >= 0) {
                        const dateCell = row.c[dateColumnIndex];
                        if (dateCell && dateCell.v !== null && dateCell.v !== undefined) {
                            dateValue = String(dateCell.v).trim();
                        }
                    }
                    
                    // Check if this debt is cancelled - if so, skip it from search results
                    if (isDebtCancelled(nameValue, dateValue)) {
                        console.log('Skipping cancelled debt:', nameValue, dateValue);
                        continue; // Skip this row, don't add to search results
                    }
                    
                    // Get all data from this row, prioritizing name, date, and religion
                    const rowData = {};
                    
                    // Always include name
                    if (nameValue) {
                        rowData['الاسم'] = nameValue;
                    }
                    
                    // Always include date if available
                    if (dateValue) {
                        rowData['التاريخ'] = dateValue;
                    }
                    
                    // Always include religion/debt if available
                    if (religionColumnIndex >= 0) {
                        const religionCell = row.c[religionColumnIndex];
                        if (religionCell && religionCell.v !== null && religionCell.v !== undefined) {
                            rowData['الدين'] = String(religionCell.v).trim();
                        }
                    } else {
                        // If no religion column found, try to calculate from price columns
                        let totalDebt = 0;
                        let priceFound = false;
                        // Check columns that might contain prices (usually column 4 or 5)
                        for (let i = 3; i < Math.min(6, row.c.length); i++) {
                            const cell = row.c[i];
                            if (cell && cell.v !== null && cell.v !== undefined) {
                                const val = String(cell.v).trim();
                                // Check if it's a number (price)
                                const numVal = parseFloat(val.replace(/[^\d.]/g, ''));
                                if (!isNaN(numVal) && numVal > 0 && numVal < 1000000) {
                                    totalDebt += numVal;
                                    priceFound = true;
                                }
                            }
                        }
                        // If we found a price, add it as الدين
                        if (priceFound && totalDebt > 0) {
                            rowData['الدين'] = totalDebt.toLocaleString('ar-SA') + ' دينار';
                        }
                    }
                    
                    // Add other columns if needed
                    row.c.forEach((c, idx) => {
                        const colLabel = columnHeaders[idx] || `العمود ${idx + 1}`;
                        // Skip if we already added this column
                        if (rowData[colLabel]) return;
                        
                        let cellValue = '';
                        if (c && c.v !== null && c.v !== undefined) {
                            cellValue = String(c.v).trim();
                        }
                        // Add other non-empty columns
                        if (cellValue) {
                            rowData[colLabel] = cellValue;
                        }
                    });
                    
                    matches.push({
                        rowIndex: rowIndex,
                        data: rowData
                    });
                    seenRowIndices.add(rowIndex);
                    
                    console.log('Match found at row', rowIndex, ':', nameValue);
                }
            }
            
            console.log('Total matches found:', matches.length);

            // Display results
            if (matches.length > 0) {
                displaySearchResults(matches, searchName, dateFilter);
            } else {
                showNoResults();
                console.log('No matches found for:', { name: searchName, dateFilter: dateFilter });
            }

        } catch (error) {
            console.error('Error performing search:', error);
            console.error('Error stack:', error.stack);
            errorMessage.innerHTML = `خطأ في البحث: ${error.message}<br>يرجى المحاولة مرة أخرى أو تحديث البيانات.`;
            errorMessage.style.display = 'block';
        } finally {
            // Always re-enable the search button
            if (!silent) {
                if (searchBtn) {
                    searchBtn.disabled = false;
                }
                if (searchBtnText) {
                    searchBtnText.style.display = 'inline';
                }
                if (searchBtnLoader) {
                    searchBtnLoader.style.display = 'none';
                }
            }
        }
    }

    // Function to display search results
    function displaySearchResults(matches, searchName, dateFilter) {
        searchResults.style.display = 'block';
        noResults.style.display = 'none';
        errorMessage.style.display = 'none';

        let html = '';
        html += `<p class="results-count">تم العثور على ${matches.length} ${matches.length === 1 ? 'نتيجة' : 'نتائج'}</p>`;

        matches.forEach((match, index) => {
            html += `<div class="result-card">`;
            html += `<div class="result-header">`;
            html += `<h4>نتيجة ${index + 1}</h4>`;
            html += `</div>`;
            html += `<div class="result-body">`;
            
            // Prioritize displaying name, date, and religion
            const priorityFields = ['الاسم', 'التاريخ', 'الدين'];
            
            // Display priority fields first
            priorityFields.forEach(key => {
                if (match.data[key] !== undefined) {
                    const value = match.data[key];
                    html += `<div class="result-field">`;
                    html += `<strong class="field-label">${escapeHtml(key)}:</strong>`;
                    html += `<span class="field-value ${value ? '' : 'empty-value'}">${value ? escapeHtml(value) : '(فارغ)'}</span>`;
                    html += `</div>`;
                }
            });
            
            // Display other fields
            Object.keys(match.data).forEach(key => {
                if (!priorityFields.includes(key)) {
                    const value = match.data[key];
                    if (value) {
                        html += `<div class="result-field">`;
                        html += `<strong class="field-label">${escapeHtml(key)}:</strong>`;
                        html += `<span class="field-value">${escapeHtml(value)}</span>`;
                        html += `</div>`;
                    }
                }
            });
            
            // If no data at all
            const hasData = Object.keys(match.data).some(key => match.data[key]);
            if (!hasData) {
                html += `<p class="no-data-in-row">لا توجد بيانات في هذا الصف</p>`;
            }
            
            html += `</div>`;
            html += `</div>`;
        });

        resultsContent.innerHTML = html;
    }

    // Function to show no results message
    function showNoResults() {
        searchResults.style.display = 'none';
        noResults.style.display = 'block';
    }

    // Helper function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Function to display full sheet data in a table
    function displaySheetDataTable() {
        if (!sheetData || !sheetData.table || !sheetData.table.rows) {
            if (sheetDataTable) sheetDataTable.style.display = 'none';
            return;
        }
        
        const rows = sheetData.table.rows;
        
        // Find header row
        let headerRowIndex = -1;
        let dataStartIndex = 10;
        const columnHeaders = {};
        let nameColumnIndex = 0;
        let dateColumnIndex = -1;
        let religionColumnIndex = -1;
        
        for (let i = 0; i < Math.min(20, rows.length); i++) {
            const row = rows[i];
            if (row && row.c && row.c.length > 0) {
                const firstCell = row.c[0];
                if (firstCell && firstCell.v !== null && firstCell.v !== undefined) {
                    const cellValue = String(firstCell.v).trim();
                    if (cellValue === 'الاسم' || cellValue.includes('الاسم')) {
                        headerRowIndex = i;
                        dataStartIndex = i + 1;
                        
                        // Extract headers and find important columns
                        row.c.forEach((cell, idx) => {
                            if (cell && cell.v !== null && cell.v !== undefined) {
                                const headerLabel = String(cell.v).trim();
                                columnHeaders[idx] = headerLabel;
                                
                                // Find date column
                                if (headerLabel.includes('التاريخ') || headerLabel.includes('تاريخ')) {
                                    dateColumnIndex = idx;
                                }
                                // Find religion/debt column
                                if (headerLabel.includes('الدين') || headerLabel.includes('دين')) {
                                    religionColumnIndex = idx;
                                }
                            } else {
                                columnHeaders[idx] = `العمود ${idx + 1}`;
                            }
                        });
                        break;
                    }
                }
            }
        }
        
        // If no header found, use defaults
        if (headerRowIndex === -1) {
            columnHeaders[0] = 'الاسم';
            columnHeaders[1] = 'المرحلة';
            columnHeaders[2] = 'الشعبة';
            columnHeaders[3] = 'التاريخ';
            columnHeaders[4] = 'نوع الورق';
            columnHeaders[5] = 'السعر';
            dateColumnIndex = 3;
            // Try to find religion column
            if (columnHeaders[5] && (columnHeaders[5].includes('السعر') || columnHeaders[5].includes('الدين'))) {
                religionColumnIndex = 5;
            }
        }
        
        // Build table header - add cancel debt column
        let headerHtml = '<tr>';
        Object.keys(columnHeaders).forEach(key => {
            headerHtml += `<th>${escapeHtml(columnHeaders[key])}</th>`;
        });
        headerHtml += '<th>إلغاء الدين</th>'; // Add Cancel Debt column
        headerHtml += '</tr>';
        
        if (tableHeader) {
            tableHeader.innerHTML = headerHtml;
        }
        
        // Store row data for button clicks
        window.tableRowData = window.tableRowData || {};
        
        // Build table body (limit to first 100 rows for performance)
        let bodyHtml = '';
        const maxRows = Math.min(dataStartIndex + 100, rows.length);
        let rowCount = 0;
        
        for (let i = dataStartIndex; i < maxRows; i++) {
            const row = rows[i];
            if (!row || !row.c || row.c.length === 0) continue;
            
            // Skip if first cell (name) is empty
            const nameCell = row.c[nameColumnIndex];
            if (!nameCell || nameCell.v === null || nameCell.v === undefined || String(nameCell.v).trim().length < 2) {
                continue;
            }
            
            const rowId = `row-${i}`;
            const nameValue = String(nameCell.v).trim();
            
            // Get religion/debt value
            let religionValue = '';
            if (religionColumnIndex >= 0 && row.c[religionColumnIndex]) {
                const religionCell = row.c[religionColumnIndex];
                if (religionCell && religionCell.v !== null && religionCell.v !== undefined) {
                    religionValue = String(religionCell.v).trim();
                }
            }
            
            // If no religion column found, try to calculate from price columns
            if (!religionValue) {
                let totalDebt = 0;
                let priceFound = false;
                for (let j = 3; j < Math.min(6, row.c.length); j++) {
                    const cell = row.c[j];
                    if (cell && cell.v !== null && cell.v !== undefined) {
                        const val = String(cell.v).trim();
                        const numVal = parseFloat(val.replace(/[^\d.]/g, ''));
                        if (!isNaN(numVal) && numVal > 0 && numVal < 1000000) {
                            totalDebt += numVal;
                            priceFound = true;
                        }
                    }
                }
                if (priceFound && totalDebt > 0) {
                    religionValue = totalDebt.toLocaleString('ar-SA') + ' دينار';
                }
            }
            
            // Get date value
            const dateValue = dateColumnIndex >= 0 && row.c[dateColumnIndex] && row.c[dateColumnIndex].v ? String(row.c[dateColumnIndex].v).trim() : '';
            
            // Check if this debt is already cancelled
            const isCancelled = isDebtCancelled(nameValue, dateValue);
            const buttonText = isCancelled ? 'تم الإلغاء' : 'إلغاء الدين';
            const buttonDisabled = isCancelled ? 'disabled' : '';
            const buttonClass = isCancelled ? 'btn-cancel-debt cancelled-debt-btn' : 'btn-cancel-debt';
            const rowStyle = isCancelled ? 'style="opacity: 0.5; text-decoration: line-through;"' : '';
            
            // Store row data for button click
            window.tableRowData[rowId] = {
                name: nameValue,
                religion: religionValue,
                date: dateValue,
                rowIndex: i
            };
            
            // Build table row with button
            bodyHtml += `<tr id="${rowId}" ${rowStyle}>`;
            Object.keys(columnHeaders).forEach(key => {
                const cell = row.c[parseInt(key)];
                let cellValue = '';
                if (cell && cell.v !== null && cell.v !== undefined) {
                    cellValue = String(cell.v).trim();
                }
                bodyHtml += `<td>${escapeHtml(cellValue)}</td>`;
            });
            bodyHtml += `<td><button class="${buttonClass}" data-row-id="${rowId}" ${buttonDisabled}>${buttonText}</button></td>`;
            bodyHtml += '</tr>';
            rowCount++;
        }
        
        if (tableBody) {
            tableBody.innerHTML = bodyHtml;
            
            // Add click handlers for cancel debt buttons after table is rendered
            setTimeout(() => {
                const buttons = tableBody.querySelectorAll('.btn-cancel-debt:not(.cancelled-debt-btn)');
                buttons.forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const rowId = this.getAttribute('data-row-id');
                        if (rowId && window.tableRowData && window.tableRowData[rowId]) {
                            cancelDebt(rowId);
                        }
                    });
                });
            }, 100);
        }
        
        // Show table if we have data (admin only)
        if (sheetDataTable && rowCount > 0) {
            // Only show if user is admin AND table was previously visible
            if (isUserAdmin() && tableVisible) {
                sheetDataTable.style.display = 'block';
            } else {
                sheetDataTable.style.display = 'none';
            }
            // Enable toggle button (only for admins)
            if (toggleTableBtn) {
                if (isUserAdmin()) {
                    toggleTableBtn.disabled = false;
                    toggleTableBtn.textContent = tableVisible ? 'إخفاء الجدول' : 'عرض الجدول';
                    toggleTableBtn.style.display = 'inline-block';
                } else {
                    toggleTableBtn.style.display = 'none';
                }
            }
        } else {
            sheetDataTable.style.display = 'none';
            if (toggleTableBtn && isUserAdmin()) {
                toggleTableBtn.disabled = true;
                toggleTableBtn.textContent = 'لا توجد بيانات';
            }
        }
    }

    // Function to cancel debt when button is clicked
    function cancelDebt(rowId) {
        if (!window.tableRowData || !window.tableRowData[rowId]) {
            alert('لا توجد بيانات متاحة');
            return;
        }
        
        const rowData = window.tableRowData[rowId];
        const name = rowData.name || '';
        const date = rowData.date || '';
        
        if (!name) {
            alert('لا يمكن إلغاء الدين: الاسم غير محدد');
            return;
        }
        
        // Show confirmation dialog
        const confirmed = confirm(`هل أنت متأكد من إلغاء دين "${name}"${date ? ' بتاريخ ' + date : ''}؟\n\nبعد الإلغاء، لن يظهر هذا الدين في نتائج البحث.`);
        
        if (confirmed) {
            // Add to cancelled debts (normalize the values)
            addCancelledDebt(name, date);
            
            // Update button appearance
            const button = document.querySelector(`button[data-row-id="${rowId}"]`);
            if (button) {
                button.textContent = 'تم الإلغاء';
                button.disabled = true;
                button.classList.add('cancelled-debt-btn');
            }
            
            // Update the row appearance
            const row = document.getElementById(rowId);
            if (row) {
                row.style.opacity = '0.5';
                row.style.textDecoration = 'line-through';
            }
            
            alert('تم إلغاء الدين بنجاح. لن يظهر هذا الدين في نتائج البحث عند البحث بالاسم والتاريخ.');
        }
    }
    
    // Make function available globally
    window.cancelDebt = cancelDebt;

    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
        if (refreshIntervalId) {
            clearInterval(refreshIntervalId);
        }
    });
});
