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
    const searchDateInput = document.getElementById('searchDate');
    const autocompleteDropdown = document.getElementById('autocompleteDropdown');
    const sheetDataTable = document.getElementById('sheetDataTable');
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    const toggleTableBtn = document.getElementById('toggleTableBtn');
    
    // Store all names for autocomplete
    let allNames = [];
    let tableVisible = false;

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
            const searchDate = searchDateInput ? searchDateInput.value.trim() : '';
            
            if (!searchName && !searchDate) {
                errorMessage.textContent = 'يرجى إدخال الاسم أو التاريخ للبحث';
                errorMessage.style.display = 'block';
                return;
            }
            
            console.log('Form submitted, searching for:', { name: searchName, date: searchDate });
            performSearch(searchName, searchDate, false);
        });
    }
    
    // Autocomplete functionality - show suggestions as user types
    if (searchNameInput) {
        let autocompleteTimeout;
        
        searchNameInput.addEventListener('input', function(e) {
            const value = e.target.value.trim();
            
            // Clear previous timeout
            clearTimeout(autocompleteTimeout);
            
            // Hide dropdown if input is empty
            if (!value || value.length < 1) {
                hideAutocomplete();
                return;
            }
            
            // Debounce autocomplete search
            autocompleteTimeout = setTimeout(function() {
                showAutocompleteSuggestions(value);
            }, 300);
        });
        
        // Handle keyboard navigation in autocomplete
        searchNameInput.addEventListener('keydown', function(e) {
            const items = autocompleteDropdown.querySelectorAll('.autocomplete-item');
            const activeItem = autocompleteDropdown.querySelector('.autocomplete-item.active');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (activeItem) {
                    activeItem.classList.remove('active');
                    const next = activeItem.nextElementSibling;
                    if (next) {
                        next.classList.add('active');
                    } else {
                        items[0]?.classList.add('active');
                    }
                } else {
                    items[0]?.classList.add('active');
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (activeItem) {
                    activeItem.classList.remove('active');
                    const prev = activeItem.previousElementSibling;
                    if (prev) {
                        prev.classList.add('active');
                    } else {
                        items[items.length - 1]?.classList.add('active');
                    }
                } else {
                    items[items.length - 1]?.classList.add('active');
                }
            } else if (e.key === 'Enter') {
                if (activeItem) {
                    e.preventDefault();
                    searchNameInput.value = activeItem.textContent.trim();
                    hideAutocomplete();
                    const searchName = searchNameInput.value.trim();
                    const searchDate = searchDateInput ? searchDateInput.value.trim() : '';
                    performSearch(searchName, searchDate, false);
                } else {
                    e.preventDefault();
                    const searchName = searchNameInput.value.trim();
                    const searchDate = searchDateInput ? searchDateInput.value.trim() : '';
                    if (searchName || searchDate) {
                        performSearch(searchName, searchDate, false);
                    }
                }
            } else if (e.key === 'Escape') {
                hideAutocomplete();
            }
        });
        
        // Hide autocomplete when clicking outside
        document.addEventListener('click', function(e) {
            if (autocompleteDropdown && autocompleteDropdown.style.display !== 'none') {
                if (!searchNameInput.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
                    hideAutocomplete();
                }
            }
        });
    }
    
    // Toggle sheet data table visibility
    if (toggleTableBtn) {
        toggleTableBtn.addEventListener('click', function() {
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
    
    // Function to show autocomplete suggestions
    function showAutocompleteSuggestions(searchTerm) {
        if (!sheetData || !allNames.length) {
            hideAutocomplete();
            return;
        }
        
        const normalizedSearch = searchTerm.toLowerCase().trim();
        const matches = allNames.filter(name => {
            const normalizedName = name.toLowerCase();
            return normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName);
        }).slice(0, 10); // Limit to 10 suggestions
        
        if (matches.length === 0) {
            hideAutocomplete();
            return;
        }
        
        let html = '';
        matches.forEach((name, index) => {
            html += `<div class="autocomplete-item" data-index="${index}">${escapeHtml(name)}</div>`;
        });
        
        autocompleteDropdown.innerHTML = html;
        autocompleteDropdown.style.display = 'block';
        
        // Add click handlers to autocomplete items
        autocompleteDropdown.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', function() {
                searchNameInput.value = this.textContent.trim();
                hideAutocomplete();
                const searchName = searchNameInput.value.trim();
                const searchDate = searchDateInput ? searchDateInput.value.trim() : '';
                performSearch(searchName, searchDate, false);
            });
            
            item.addEventListener('mouseenter', function() {
                autocompleteDropdown.querySelectorAll('.autocomplete-item').forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }
    
    // Function to hide autocomplete
    function hideAutocomplete() {
        if (autocompleteDropdown) {
            autocompleteDropdown.style.display = 'none';
            autocompleteDropdown.innerHTML = '';
        }
    }
    
    // Function to extract all names from sheet data for autocomplete
    function extractAllNames() {
        if (!sheetData || !sheetData.table || !sheetData.table.rows) {
            allNames = [];
            return;
        }
        
        const rows = sheetData.table.rows;
        const namesSet = new Set();
        
        // Find header row
        let dataStartIndex = 10; // Default start
        for (let i = 0; i < Math.min(20, rows.length); i++) {
            const row = rows[i];
            if (row && row.c && row.c.length > 0) {
                const firstCell = row.c[0];
                if (firstCell && firstCell.v !== null && firstCell.v !== undefined) {
                    const cellValue = String(firstCell.v).trim();
                    if (cellValue === 'الاسم' || cellValue.includes('الاسم')) {
                        dataStartIndex = i + 1;
                        break;
                    }
                }
            }
        }
        
        // Extract names from data rows
        for (let i = dataStartIndex; i < rows.length; i++) {
            const row = rows[i];
            if (row && row.c && row.c.length > 0) {
                const nameCell = row.c[0];
                if (nameCell && nameCell.v !== null && nameCell.v !== undefined) {
                    const name = String(nameCell.v).trim();
                    if (name && name.length >= 2) {
                        namesSet.add(name);
                    }
                }
            }
        }
        
        allNames = Array.from(namesSet).sort();
        console.log('Extracted names for autocomplete:', allNames.length);
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
                
                // Extract all names for autocomplete
                extractAllNames();
                
                // Display full sheet data table (but keep it hidden by default)
                displaySheetDataTable();
                // Hide table by default initially
                if (sheetDataTable) {
                    sheetDataTable.style.display = 'none';
                }
                if (toggleTableBtn) {
                    toggleTableBtn.textContent = 'عرض الجدول';
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
                if (searchNameInput && (searchNameInput.value.trim() || (searchDateInput && searchDateInput.value.trim()))) {
                    const searchName = searchNameInput.value.trim();
                    const searchDate = searchDateInput ? searchDateInput.value.trim() : '';
                    performSearch(searchName, searchDate, true);
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
    function performSearch(searchName, searchDate, silent = false) {
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

            console.log('Starting search for:', { name: searchName, date: searchDate });
            console.log('Total rows in sheet:', rows.length);

            // Normalize search name (remove extra spaces, convert to lowercase, handle Arabic text)
            const normalizedSearchName = searchName ? searchName.toLowerCase().trim().replace(/\s+/g, ' ') : '';
            
            // Normalize search date - convert to comparable format
            let normalizedSearchDate = '';
            if (searchDate) {
                // If searchDate is in YYYY-MM-DD format, normalize it
                normalizedSearchDate = searchDate.trim();
                // Also create alternative formats for comparison
            }

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
            
            // Helper function to normalize date for comparison
            function normalizeDate(dateStr) {
                if (!dateStr) return '';
                // Try to parse various date formats
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) {
                    // If not a valid date, try to extract date parts from string
                    return dateStr.trim();
                }
                // Return in YYYY-MM-DD format for comparison
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
            
            // Helper function to check if dates match
            function datesMatch(date1, date2) {
                if (!date1 || !date2) return false;
                const normalized1 = normalizeDate(date1);
                const normalized2 = normalizeDate(date2);
                // Check if one contains the other or they're equal
                return normalized1 === normalized2 || 
                       normalized1.includes(normalized2) || 
                       normalized2.includes(normalized1);
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
                let nameMatches = true;
                if (normalizedSearchName) {
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
                    } else {
                        nameMatches = false; // No name cell, can't match if name is required
                    }
                }
                
                // Check the date column for matches
                let dateMatches = true;
                if (normalizedSearchDate && dateColumnIndex >= 0) {
                    const dateCell = row.c[dateColumnIndex];
                    if (dateCell && dateCell.v !== null && dateCell.v !== undefined) {
                        const dateValue = String(dateCell.v).trim();
                        dateMatches = datesMatch(dateValue, normalizedSearchDate);
                    } else {
                        dateMatches = false; // No date cell, can't match if date is required
                    }
                }
                
                // If both name and date match (or at least one is provided and matches)
                if (nameMatches && dateMatches) {
                    // Get all data from this row, prioritizing name, date, and religion
                    const rowData = {};
                    
                    // Always include name
                    if (nameCell && nameCell.v !== null && nameCell.v !== undefined) {
                        rowData['الاسم'] = String(nameCell.v).trim();
                    }
                    
                    // Always include date if available
                    if (dateColumnIndex >= 0) {
                        const dateCell = row.c[dateColumnIndex];
                        if (dateCell && dateCell.v !== null && dateCell.v !== undefined) {
                            rowData['التاريخ'] = String(dateCell.v).trim();
                        }
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
                    
                    const matchedName = nameCell && nameCell.v ? String(nameCell.v).trim() : 'غير محدد';
                    console.log('Match found at row', rowIndex, ':', matchedName);
                }
            }
            
            console.log('Total matches found:', matches.length);

            // Display results
            if (matches.length > 0) {
                displaySearchResults(matches, searchName, searchDate);
            } else {
                showNoResults();
                console.log('No matches found for:', { name: searchName, date: searchDate });
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
    function displaySearchResults(matches, searchName, searchDate) {
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
        
        for (let i = 0; i < Math.min(20, rows.length); i++) {
            const row = rows[i];
            if (row && row.c && row.c.length > 0) {
                const firstCell = row.c[0];
                if (firstCell && firstCell.v !== null && firstCell.v !== undefined) {
                    const cellValue = String(firstCell.v).trim();
                    if (cellValue === 'الاسم' || cellValue.includes('الاسم')) {
                        headerRowIndex = i;
                        dataStartIndex = i + 1;
                        
                        // Extract headers
                        row.c.forEach((cell, idx) => {
                            if (cell && cell.v !== null && cell.v !== undefined) {
                                columnHeaders[idx] = String(cell.v).trim();
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
        }
        
        // Build table header
        let headerHtml = '<tr>';
        Object.keys(columnHeaders).forEach(key => {
            headerHtml += `<th>${escapeHtml(columnHeaders[key])}</th>`;
        });
        headerHtml += '</tr>';
        
        if (tableHeader) {
            tableHeader.innerHTML = headerHtml;
        }
        
        // Build table body (limit to first 100 rows for performance)
        let bodyHtml = '';
        const maxRows = Math.min(dataStartIndex + 100, rows.length);
        let rowCount = 0;
        
        for (let i = dataStartIndex; i < maxRows; i++) {
            const row = rows[i];
            if (!row || !row.c || row.c.length === 0) continue;
            
            // Skip if first cell (name) is empty
            const nameCell = row.c[0];
            if (!nameCell || nameCell.v === null || nameCell.v === undefined || String(nameCell.v).trim().length < 2) {
                continue;
            }
            
            bodyHtml += '<tr>';
            Object.keys(columnHeaders).forEach(key => {
                const cell = row.c[parseInt(key)];
                let cellValue = '';
                if (cell && cell.v !== null && cell.v !== undefined) {
                    cellValue = String(cell.v).trim();
                }
                bodyHtml += `<td>${escapeHtml(cellValue)}</td>`;
            });
            bodyHtml += '</tr>';
            rowCount++;
        }
        
        if (tableBody) {
            tableBody.innerHTML = bodyHtml;
        }
        
        // Show table if we have data (but respect toggle state)
        if (sheetDataTable && rowCount > 0) {
            // Only show if table was previously visible, otherwise keep it hidden
            if (tableVisible) {
                sheetDataTable.style.display = 'block';
            } else {
                sheetDataTable.style.display = 'none';
            }
            // Enable toggle button
            if (toggleTableBtn) {
                toggleTableBtn.disabled = false;
                toggleTableBtn.textContent = tableVisible ? 'إخفاء الجدول' : 'عرض الجدول';
            }
        } else {
            sheetDataTable.style.display = 'none';
            if (toggleTableBtn) {
                toggleTableBtn.disabled = true;
                toggleTableBtn.textContent = 'لا توجد بيانات';
            }
        }
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
        if (refreshIntervalId) {
            clearInterval(refreshIntervalId);
        }
    });
});
