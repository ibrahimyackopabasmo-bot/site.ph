// Google Sheets Configuration
const REFRESH_INTERVAL = 80000; // 80 seconds in milliseconds
// Use server-side proxy to avoid CORS issues
const GOOGLE_SHEETS_API_URL = '/api/google-sheets';

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
            if (searchName) {
                console.log('Form submitted, searching for:', searchName);
                performSearch(searchName, false);
            } else {
                errorMessage.textContent = 'يرجى إدخال اسم للبحث';
                errorMessage.style.display = 'block';
            }
        });
    }
    
    // Also allow search on Enter key in the input field
    if (searchNameInput) {
        searchNameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const searchName = searchNameInput.value.trim();
                if (searchName) {
                    performSearch(searchName, false);
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
                    performSearch(searchNameInput.value.trim(), true);
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

    // Function to perform search
    function performSearch(searchName, silent = false) {
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

            console.log('Starting search for:', searchName);
            console.log('Total rows in sheet:', rows.length);

            // Normalize search name (remove extra spaces, convert to lowercase, handle Arabic text)
            const normalizedSearchName = searchName.toLowerCase().trim().replace(/\s+/g, ' ');

            // Find the header row dynamically - look for row containing "الاسم" (Name)
            let headerRowIndex = -1;
            let dataStartIndex = 0;
            const columnHeaders = {};
            
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
                            
                            // Extract column headers
                            row.c.forEach((cell, idx) => {
                                if (cell && cell.v !== null && cell.v !== undefined) {
                                    const headerLabel = String(cell.v).trim();
                                    columnHeaders[idx] = headerLabel || `العمود ${idx + 1}`;
                                } else {
                                    columnHeaders[idx] = `العمود ${idx + 1}`;
                                }
                            });
                            console.log('Found header row at index:', headerRowIndex);
                            console.log('Column headers:', columnHeaders);
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
                }
            }
            
            // Find matching rows - avoid duplicates
            const matches = [];
            const seenRowIndices = new Set();
            
            console.log('Searching from row index:', dataStartIndex, 'to', rows.length);
            
            // Start searching from data rows (skip header and empty rows)
            for (let rowIndex = dataStartIndex; rowIndex < rows.length; rowIndex++) {
                if (seenRowIndices.has(rowIndex)) {
                    continue; // Skip if we've already added this row
                }
                
                const row = rows[rowIndex];
                if (!row || !row.c || row.c.length === 0) {
                    continue; // Skip empty rows
                }
                
                // Check the first column (الاسم - Name) for matches
                // Column A is index 0
                const nameCell = row.c[0];
                if (nameCell && nameCell.v !== null && nameCell.v !== undefined) {
                    const nameValue = String(nameCell.v).trim();
                    const nameValueLower = nameValue.toLowerCase().replace(/\s+/g, ' ');
                    
                    // Skip if this is an empty name or header-like value
                    if (!nameValue || nameValue.length < 2) {
                        continue;
                    }
                    
                    // Check if the search name matches (partial or full match)
                    // More flexible matching
                    const searchMatches = nameValueLower.includes(normalizedSearchName) || 
                                         normalizedSearchName.includes(nameValueLower) ||
                                         nameValueLower.startsWith(normalizedSearchName) ||
                                         normalizedSearchName.startsWith(nameValueLower);
                    
                    if (searchMatches) {
                        // Get all data from this row
                        const rowData = {};
                        
                        // Map columns with proper headers
                        row.c.forEach((c, idx) => {
                            const colLabel = columnHeaders[idx] || `العمود ${idx + 1}`;
                            let cellValue = '';
                            if (c && c.v !== null && c.v !== undefined) {
                                cellValue = String(c.v).trim();
                            }
                            // Show all columns (even if empty for important ones)
                            if (cellValue || idx < 6) {
                                rowData[colLabel] = cellValue;
                            }
                        });
                        
                        // Calculate total debt from price columns
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
                        
                        // If we found a price, add it to the display
                        if (priceFound && totalDebt > 0) {
                            rowData['إجمالي الدين'] = totalDebt.toLocaleString('ar-SA') + ' دينار';
                        }
                        
                        matches.push({
                            rowIndex: rowIndex,
                            data: rowData
                        });
                        seenRowIndices.add(rowIndex);
                        
                        console.log('Match found at row', rowIndex, ':', nameValue);
                    }
                }
            }
            
            console.log('Total matches found:', matches.length);

            // Display results
            if (matches.length > 0) {
                displaySearchResults(matches, searchName);
            } else {
                showNoResults();
                console.log('No matches found for:', searchName);
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
    function displaySearchResults(matches, searchName) {
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
            
            // Display all fields from the row
            const hasData = Object.keys(match.data).some(key => match.data[key]);
            if (hasData) {
                Object.keys(match.data).forEach(key => {
                    const value = match.data[key];
                    // Show field even if empty, but highlight non-empty values
                    html += `<div class="result-field">`;
                    html += `<strong class="field-label">${escapeHtml(key)}:</strong>`;
                    html += `<span class="field-value ${value ? '' : 'empty-value'}">${value ? escapeHtml(value) : '(فارغ)'}</span>`;
                    html += `</div>`;
                });
            } else {
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

    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
        if (refreshIntervalId) {
            clearInterval(refreshIntervalId);
        }
    });
});
