/**
 * Product Dashboard - JavaScript
 * Fetches products from API and renders them in a beautiful table
 */

// API Endpoint
const API_URL = 'https://api.escuelajs.co/api/v1/products';

// DOM Elements
const loadingSpinner = document.getElementById('loadingSpinner');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');
const productsContainer = document.getElementById('productsContainer');
const productsTableBody = document.getElementById('productsTableBody');
const productCount = document.getElementById('productCount');
const modalImage = document.getElementById('modalImage');
const imageModalLabel = document.getElementById('imageModalLabel');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const itemsPerPageSelect = document.getElementById('itemsPerPage');
const paginationList = document.getElementById('paginationList');
const paginationInfo = document.getElementById('paginationInfo');

// Detail Modal Elements
const productDetailModal = document.getElementById('productDetailModal');
const viewMode = document.getElementById('viewMode');
const editMode = document.getElementById('editMode');
const viewModeFooter = document.getElementById('viewModeFooter');
const editModeFooter = document.getElementById('editModeFooter');
const modalLoading = document.getElementById('modalLoading');

// Create Modal Elements
const createProductModal = document.getElementById('createProductModal');
const createModalLoading = document.getElementById('createModalLoading');

// Current product being viewed/edited
let currentProduct = null;

// Store all products for filtering
let allProducts = [];

// Current filtered/sorted products
let currentProducts = [];

// Current sort state
let currentSort = {
    field: null,
    direction: 'asc' // 'asc' or 'desc'
};

// Pagination state
let pagination = {
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1
};

/**
 * Show loading spinner
 */
function showLoading() {
    loadingSpinner.classList.remove('d-none');
    productsContainer.classList.add('d-none');
    errorAlert.classList.add('d-none');
}

/**
 * Hide loading spinner
 */
function hideLoading() {
    loadingSpinner.classList.add('d-none');
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    hideLoading();
    errorMessage.textContent = message;
    errorAlert.classList.remove('d-none');
    productsContainer.classList.add('d-none');
}

/**
 * Show products container
 */
function showProducts() {
    hideLoading();
    errorAlert.classList.add('d-none');
    productsContainer.classList.remove('d-none');
}

/**
 * Format price with currency symbol
 * @param {number} price - Price value
 * @returns {string} Formatted price
 */
function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(price);
}

/**
 * Get category class based on category name
 * @param {string} categoryName - Category name
 * @returns {string} CSS class for category
 */
function getCategoryClass(categoryName) {
    const name = categoryName.toLowerCase();
    if (name.includes('cloth') || name.includes('fashion')) return 'category-clothes';
    if (name.includes('electronic') || name.includes('tech')) return 'category-electronics';
    if (name.includes('furniture') || name.includes('home')) return 'category-furniture';
    if (name.includes('shoe') || name.includes('footwear')) return 'category-shoes';
    return 'category-miscellaneous';
}

/**
 * Get valid image URL with fallback
 * @param {Array} images - Array of image URLs
 * @returns {string} Valid image URL
 */
function getImageUrl(images) {
    if (!images || images.length === 0) {
        return 'https://placehold.co/60x60?text=No+Image';
    }
    
    let imageUrl = images[0];
    
    // Clean up the URL if it has extra brackets or quotes
    if (typeof imageUrl === 'string') {
        imageUrl = imageUrl.replace(/[\[\]"']/g, '');
    }
    
    // Check if URL is valid
    if (!imageUrl || imageUrl === '' || imageUrl === '[]') {
        return 'https://placehold.co/60x60?text=No+Image';
    }
    
    return imageUrl;
}

/**
 * Handle image error by replacing with placeholder
 * @param {HTMLImageElement} img - Image element
 */
function handleImageError(img) {
    img.onerror = null; // Prevent infinite loop
    img.src = 'https://placehold.co/60x60?text=Error';
}

/**
 * Open image in modal
 * @param {string} imageUrl - Image URL to display
 * @param {string} productTitle - Product title for modal header
 */
function openImageModal(imageUrl, productTitle) {
    modalImage.src = imageUrl;
    imageModalLabel.textContent = productTitle;
    const modal = new bootstrap.Modal(document.getElementById('imageModal'));
    modal.show();
}

/**
 * Truncate text to a maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 150) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Create table row for a product
 * @param {Object} product - Product object
 * @returns {string} HTML string for table row
 */
function createProductRow(product) {
    const imageUrl = getImageUrl(product.images);
    const categoryName = product.category?.name || 'Unknown';
    const categoryClass = getCategoryClass(categoryName);
    const description = escapeHtml(product.description || 'Không có mô tả');
    
    return `
        <tr data-bs-toggle="tooltip" 
            data-bs-placement="top" 
            data-bs-html="true"
            data-bs-title="${truncateText(description, 200)}"
            data-product-id="${product.id}"
            onclick="openProductDetail(${product.id})"
            class="clickable-row">
            <td class="text-center">
                <span class="product-id">${product.id}</span>
            </td>
            <td>
                <p class="product-title">${escapeHtml(product.title)}</p>
            </td>
            <td class="text-end">
                <span class="product-price">${formatPrice(product.price)}</span>
            </td>
            <td>
                <span class="category-badge ${categoryClass}">
                    ${escapeHtml(categoryName)}
                </span>
            </td>
            <td class="text-center">
                <img 
                    src="${imageUrl}" 
                    alt="${escapeHtml(product.title)}" 
                    class="product-image"
                    onerror="handleImageError(this)"
                    onclick="openImageModal('${imageUrl}', '${escapeHtml(product.title).replace(/'/g, "\\'")}'); event.stopPropagation();"
                    loading="lazy"
                >
            </td>
        </tr>
    `;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Initialize Bootstrap tooltips
 */
function initTooltips() {
    // Dispose existing tooltips first
    const existingTooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    existingTooltips.forEach(el => {
        const tooltip = bootstrap.Tooltip.getInstance(el);
        if (tooltip) {
            tooltip.dispose();
        }
    });
    
    // Initialize new tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach(tooltipTriggerEl => {
        new bootstrap.Tooltip(tooltipTriggerEl, {
            container: 'body',
            trigger: 'hover'
        });
    });
}

/**
 * Calculate pagination values
 * @param {number} totalItems - Total number of items
 */
function calculatePagination(totalItems) {
    pagination.totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
    if (pagination.currentPage > pagination.totalPages) {
        pagination.currentPage = pagination.totalPages || 1;
    }
}

/**
 * Get paginated products
 * @param {Array} products - Array of products
 * @returns {Array} Paginated products
 */
function getPaginatedProducts(products) {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return products.slice(startIndex, endIndex);
}

/**
 * Update pagination info text
 * @param {number} totalItems - Total number of items
 */
function updatePaginationInfo(totalItems) {
    const startItem = totalItems === 0 ? 0 : (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
    const endItem = Math.min(pagination.currentPage * pagination.itemsPerPage, totalItems);
    paginationInfo.textContent = `Hiển thị ${startItem}-${endItem} của ${totalItems} sản phẩm`;
}

/**
 * Render pagination controls
 */
function renderPagination() {
    if (!paginationList) return;
    
    const totalPages = pagination.totalPages;
    const currentPage = pagination.currentPage;
    
    let html = '';
    
    // Previous button
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${currentPage - 1}); return false;" aria-label="Previous">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page
    if (startPage > 1) {
        html += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="goToPage(1); return false;">1</a>
            </li>
        `;
        if (startPage > 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    // Middle pages
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        html += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="goToPage(${totalPages}); return false;">${totalPages}</a>
            </li>
        `;
    }
    
    // Next button
    html += `
        <li class="page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${currentPage + 1}); return false;" aria-label="Next">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;
    
    paginationList.innerHTML = html;
}

/**
 * Go to specific page
 * @param {number} page - Page number
 */
function goToPage(page) {
    if (page < 1 || page > pagination.totalPages) return;
    pagination.currentPage = page;
    displayCurrentProducts();
    
    // Scroll to top of table
    productsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Change items per page
 * @param {number} items - Number of items per page
 */
function changeItemsPerPage(items) {
    pagination.itemsPerPage = parseInt(items);
    pagination.currentPage = 1; // Reset to first page
    calculatePagination(currentProducts.length);
    displayCurrentProducts();
}

/**
 * Display current products with pagination
 */
function displayCurrentProducts() {
    calculatePagination(currentProducts.length);
    const paginatedProducts = getPaginatedProducts(currentProducts);
    
    // Generate table rows
    const rows = paginatedProducts.map(product => createProductRow(product)).join('');
    productsTableBody.innerHTML = rows;
    
    // Update pagination
    updatePaginationInfo(currentProducts.length);
    renderPagination();
    
    // Initialize tooltips
    initTooltips();
}

/**
 * Render products in the table
 * @param {Array} products - Array of product objects
 */
function renderProducts(products) {
    if (!products || products.length === 0) {
        showError('Không có sản phẩm nào được tìm thấy.');
        return;
    }
    
    // Store current products
    currentProducts = products;
    
    // Update product count
    productCount.textContent = products.length;
    
    // Show products container
    showProducts();
    
    // Display with pagination
    displayCurrentProducts();
}

/**
 * Filter products by search term
 * @param {string} searchTerm - Search term to filter by
 */
function filterProducts(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    let filteredProducts;
    
    if (!term) {
        // If search is empty, show all products
        filteredProducts = [...allProducts];
    } else {
        // Filter products by title
        filteredProducts = allProducts.filter(product => 
            product.title && product.title.toLowerCase().includes(term)
        );
    }
    
    // Apply current sort if any
    if (currentSort.field) {
        filteredProducts.sort((a, b) => {
            let valueA, valueB;
            
            if (currentSort.field === 'title') {
                valueA = (a.title || '').toLowerCase();
                valueB = (b.title || '').toLowerCase();
            } else if (currentSort.field === 'price') {
                valueA = a.price || 0;
                valueB = b.price || 0;
            }
            
            if (currentSort.direction === 'asc') {
                if (valueA < valueB) return -1;
                if (valueA > valueB) return 1;
                return 0;
            } else {
                if (valueA > valueB) return -1;
                if (valueA < valueB) return 1;
                return 0;
            }
        });
    }
    
    if (filteredProducts.length === 0) {
        currentProducts = [];
        productsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-5">
                    <div class="text-muted">
                        <i class="bi bi-search fs-1 d-block mb-3"></i>
                        <p class="mb-0">Không tìm thấy sản phẩm nào với từ khóa "<strong>${escapeHtml(searchTerm)}</strong>"</p>
                    </div>
                </td>
            </tr>
        `;
        productCount.textContent = 0;
        updatePaginationInfo(0);
        paginationList.innerHTML = '';
        showProducts();
    } else {
        // Reset to first page when filtering
        pagination.currentPage = 1;
        renderProducts(filteredProducts);
    }
}

/**
 * Debounce function to limit search frequency
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Handle search input
 */
const handleSearch = debounce((event) => {
    const searchTerm = event.target.value;
    filterProducts(searchTerm);
}, 300);

/**
 * Clear search input
 */
function clearSearch() {
    searchInput.value = '';
    filterProducts('');
    searchInput.focus();
}

/**
 * Update sort icons based on current sort state
 */
function updateSortIcons() {
    // Reset all sort icons
    const sortIcons = document.querySelectorAll('.sort-icon');
    sortIcons.forEach(icon => {
        icon.className = 'bi bi-arrow-down-up sort-icon ms-1';
    });
    
    // Update active sort icon
    if (currentSort.field) {
        const activeIcon = document.getElementById(`sort-icon-${currentSort.field}`);
        if (activeIcon) {
            if (currentSort.direction === 'asc') {
                activeIcon.className = 'bi bi-sort-up sort-icon ms-1 active';
            } else {
                activeIcon.className = 'bi bi-sort-down sort-icon ms-1 active';
            }
        }
    }
}

/**
 * Sort products by field
 * @param {string} field - Field to sort by ('title' or 'price')
 */
function sortProducts(field) {
    // Toggle direction if same field, otherwise set to 'asc'
    if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.direction = 'asc';
    }
    
    // Update sort icons
    updateSortIcons();
    
    // Get current displayed products (filtered or all)
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let productsToSort = searchTerm 
        ? allProducts.filter(p => p.title && p.title.toLowerCase().includes(searchTerm))
        : [...allProducts];
    
    // Sort products
    productsToSort.sort((a, b) => {
        let valueA, valueB;
        
        if (field === 'title') {
            valueA = (a.title || '').toLowerCase();
            valueB = (b.title || '').toLowerCase();
        } else if (field === 'price') {
            valueA = a.price || 0;
            valueB = b.price || 0;
        }
        
        if (currentSort.direction === 'asc') {
            if (valueA < valueB) return -1;
            if (valueA > valueB) return 1;
            return 0;
        } else {
            if (valueA > valueB) return -1;
            if (valueA < valueB) return 1;
            return 0;
        }
    });
    
    // Render sorted products
    renderProducts(productsToSort);
}

/**
 * Reset sort state
 */
function resetSort() {
    currentSort = { field: null, direction: 'asc' };
    updateSortIcons();
}

/**
 * Export data to CSV file
 * @param {string} scope - 'current' (current page), 'filtered' (all filtered), 'all' (all products)
 */
function exportToCSV(scope = 'filtered') {
    let dataToExport = [];
    let filename = 'products';
    
    switch (scope) {
        case 'current':
            // Export only current page
            dataToExport = getPaginatedProducts(currentProducts);
            filename = `products_page${pagination.currentPage}`;
            break;
        case 'filtered':
            // Export all filtered/sorted products
            dataToExport = currentProducts;
            filename = 'products_filtered';
            break;
        case 'all':
            // Export all products
            dataToExport = allProducts;
            filename = 'products_all';
            break;
        default:
            dataToExport = currentProducts;
    }
    
    if (dataToExport.length === 0) {
        showExportNotification('Không có dữ liệu để xuất!', 'warning');
        return;
    }
    
    // CSV Headers
    const headers = ['ID', 'Title', 'Price (USD)', 'Category', 'Description', 'Image URL', 'Created At'];
    
    // Convert data to CSV format
    const csvRows = [];
    
    // Add BOM for UTF-8 encoding (important for Vietnamese characters in Excel)
    csvRows.push('\uFEFF');
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    dataToExport.forEach(product => {
        const row = [
            product.id,
            `"${escapeCSV(product.title || '')}"`,
            product.price || 0,
            `"${escapeCSV(product.category?.name || 'Unknown')}"`,
            `"${escapeCSV(product.description || '')}"`,
            `"${escapeCSV(getImageUrl(product.images))}"`,
            `"${formatDate(product.creationAt)}"`
        ];
        csvRows.push(row.join(','));
    });
    
    // Create CSV content
    const csvContent = csvRows.join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${getFormattedDateTime()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up URL
    URL.revokeObjectURL(url);
    
    // Show success notification
    showExportNotification(`Đã xuất ${dataToExport.length} sản phẩm thành công!`, 'success');
}

/**
 * Escape special characters for CSV
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeCSV(text) {
    if (!text) return '';
    // Replace double quotes with two double quotes (CSV standard)
    return text.toString().replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '');
}

/**
 * Format date for CSV
 * @param {string} dateString - Date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateString;
    }
}

/**
 * Get formatted date time for filename
 * @returns {string} Formatted datetime
 */
function getFormattedDateTime() {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
}

/**
 * Show export notification
 * @param {string} message - Notification message
 * @param {string} type - 'success', 'warning', or 'error'
 */
function showExportNotification(message, type = 'success') {
    // Remove existing notification
    const existingNotification = document.querySelector('.export-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `export-notification export-notification-${type}`;
    
    let icon = 'bi-check-circle-fill';
    if (type === 'warning') icon = 'bi-exclamation-triangle-fill';
    if (type === 'error') icon = 'bi-x-circle-fill';
    
    notification.innerHTML = `
        <div class="export-notification-content">
            <i class="bi ${icon} me-2"></i>
            <span>${message}</span>
        </div>
        <button class="export-notification-close" onclick="this.parentElement.remove()">
            <i class="bi bi-x-lg"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

/**
 * Fetch products from API
 */
async function fetchProducts() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const products = await response.json();
        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
}

/**
 * Load and display products
 */
async function loadProducts() {
    showLoading();
    
    try {
        const products = await fetchProducts();
        // Store all products for filtering
        allProducts = products;
        // Clear search input when reloading
        if (searchInput) {
            searchInput.value = '';
        }
        // Reset sort state
        resetSort();
        renderProducts(products);
    } catch (error) {
        showError(`Không thể tải dữ liệu: ${error.message}`);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    
    // Add search event listener
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        
        // Allow pressing Enter to search immediately
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                filterProducts(searchInput.value);
            }
        });
    }
    
    // Add clear search button event listener
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }
    
    // Add items per page event listener
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', (e) => {
            changeItemsPerPage(e.target.value);
        });
    }
    
    // Add image preview listener for edit mode
    const editImageUrl = document.getElementById('editImageUrl');
    if (editImageUrl) {
        editImageUrl.addEventListener('input', debounce((e) => {
            updateImagePreview(e.target.value);
        }, 500));
    }
    
    // Reset modal when closed
    if (productDetailModal) {
        productDetailModal.addEventListener('hidden.bs.modal', () => {
            resetDetailModal();
        });
    }
});

// ==========================================
// PRODUCT DETAIL MODAL FUNCTIONS
// ==========================================

/**
 * Open product detail modal
 * @param {number} productId - Product ID
 */
function openProductDetail(productId) {
    // Find product in allProducts
    const product = allProducts.find(p => p.id === productId);
    
    if (!product) {
        showExportNotification('Không tìm thấy sản phẩm!', 'error');
        return;
    }
    
    currentProduct = product;
    
    // Populate view mode
    populateDetailView(product);
    
    // Show modal
    const modal = new bootstrap.Modal(productDetailModal);
    modal.show();
}

/**
 * Populate detail view with product data
 * @param {Object} product - Product object
 */
function populateDetailView(product) {
    document.getElementById('detailProductId').textContent = `ID: ${product.id}`;
    document.getElementById('detailTitle').textContent = product.title || 'N/A';
    document.getElementById('detailPrice').textContent = formatPrice(product.price);
    document.getElementById('detailCategory').textContent = product.category?.name || 'Unknown';
    document.getElementById('detailCategory').className = `detail-category ${getCategoryClass(product.category?.name || '')}`;
    document.getElementById('detailDescription').textContent = product.description || 'Không có mô tả';
    document.getElementById('detailCreatedAt').textContent = formatDate(product.creationAt);
    document.getElementById('detailUpdatedAt').textContent = formatDate(product.updatedAt);
    
    // Image
    const imageUrl = getImageUrl(product.images);
    const detailImage = document.getElementById('detailImage');
    detailImage.src = imageUrl;
    detailImage.onerror = function() { this.src = 'https://placehold.co/400x400?text=No+Image'; };
}

/**
 * Open image from detail modal
 */
function openImageFromDetail() {
    if (currentProduct) {
        const imageUrl = getImageUrl(currentProduct.images);
        openImageModal(imageUrl, currentProduct.title);
    }
}

/**
 * Enable edit mode
 */
function enableEditMode() {
    if (!currentProduct) return;
    
    // Populate edit form
    document.getElementById('editProductId').value = currentProduct.id;
    document.getElementById('editTitle').value = currentProduct.title || '';
    document.getElementById('editPrice').value = currentProduct.price || 0;
    document.getElementById('editDescription').value = currentProduct.description || '';
    document.getElementById('editImageUrl').value = getImageUrl(currentProduct.images);
    
    // Update image preview
    updateImagePreview(getImageUrl(currentProduct.images));
    
    // Toggle modes
    viewMode.classList.add('d-none');
    editMode.classList.remove('d-none');
    viewModeFooter.classList.add('d-none');
    editModeFooter.classList.remove('d-none');
}

/**
 * Cancel edit mode
 */
function cancelEdit() {
    // Toggle modes back
    editMode.classList.add('d-none');
    viewMode.classList.remove('d-none');
    editModeFooter.classList.add('d-none');
    viewModeFooter.classList.remove('d-none');
}

/**
 * Update image preview
 * @param {string} url - Image URL
 */
function updateImagePreview(url) {
    const preview = document.getElementById('editImagePreview');
    if (preview) {
        if (url && url.trim()) {
            preview.src = url;
            preview.onerror = function() { this.src = 'https://placehold.co/200x200?text=Invalid+URL'; };
        } else {
            preview.src = 'https://placehold.co/200x200?text=No+Image';
        }
    }
}

/**
 * Reset detail modal to initial state
 */
function resetDetailModal() {
    currentProduct = null;
    cancelEdit();
    
    // Reset form
    const form = document.getElementById('editProductForm');
    if (form) form.reset();
}

/**
 * Show modal loading overlay
 * @param {boolean} show - Show or hide
 */
function showModalLoading(show) {
    if (modalLoading) {
        if (show) {
            modalLoading.classList.remove('d-none');
        } else {
            modalLoading.classList.add('d-none');
        }
    }
}

/**
 * Save product changes via API
 */
async function saveProduct() {
    const productId = document.getElementById('editProductId').value;
    const title = document.getElementById('editTitle').value.trim();
    const price = parseFloat(document.getElementById('editPrice').value);
    const description = document.getElementById('editDescription').value.trim();
    const imageUrl = document.getElementById('editImageUrl').value.trim();
    
    // Validation
    if (!title) {
        showExportNotification('Vui lòng nhập tên sản phẩm!', 'warning');
        return;
    }
    
    if (isNaN(price) || price < 0) {
        showExportNotification('Giá sản phẩm không hợp lệ!', 'warning');
        return;
    }
    
    // Prepare data
    const updateData = {
        title: title,
        price: price,
        description: description,
        images: [imageUrl || 'https://placehold.co/600x400']
    };
    
    // Show loading
    showModalLoading(true);
    
    try {
        const response = await fetch(`${API_URL}/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const updatedProduct = await response.json();
        
        // Update local data
        const index = allProducts.findIndex(p => p.id === parseInt(productId));
        if (index !== -1) {
            allProducts[index] = { ...allProducts[index], ...updatedProduct };
            currentProduct = allProducts[index];
        }
        
        // Refresh view
        populateDetailView(currentProduct);
        cancelEdit();
        
        // Refresh table
        const searchTerm = searchInput ? searchInput.value : '';
        if (searchTerm) {
            filterProducts(searchTerm);
        } else {
            // Re-apply current sort if any
            if (currentSort.field) {
                sortProducts(currentSort.field);
                // Toggle back because sortProducts toggles direction
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                sortProducts(currentSort.field);
            } else {
                renderProducts(allProducts);
            }
        }
        
        showExportNotification('Cập nhật sản phẩm thành công!', 'success');
        
    } catch (error) {
        console.error('Error updating product:', error);
        showExportNotification(`Lỗi cập nhật: ${error.message}`, 'error');
    } finally {
        showModalLoading(false);
    }
}

// ==========================================
// CREATE PRODUCT MODAL FUNCTIONS
// ==========================================

/**
 * Open create product modal
 */
function openCreateModal() {
    // Reset form
    resetCreateForm();
    
    // Show modal
    const modal = new bootstrap.Modal(createProductModal);
    modal.show();
}

/**
 * Reset create form to initial state
 */
function resetCreateForm() {
    const form = document.getElementById('createProductForm');
    if (form) form.reset();
    
    // Reset preview
    document.getElementById('createImagePreview').src = 'https://placehold.co/300x300?text=Preview';
    document.getElementById('previewTitle').textContent = 'Tên sản phẩm';
    document.getElementById('previewPrice').textContent = '$0.00';
    document.getElementById('previewCategory').textContent = 'Danh mục';
    
    // Show placeholder
    const placeholder = document.getElementById('createImagePlaceholder');
    if (placeholder) placeholder.style.display = 'flex';
}

/**
 * Update create preview in real-time
 */
function updateCreatePreview() {
    const title = document.getElementById('createTitle').value || 'Tên sản phẩm';
    const price = parseFloat(document.getElementById('createPrice').value) || 0;
    const categorySelect = document.getElementById('createCategory');
    const categoryText = categorySelect.options[categorySelect.selectedIndex]?.text || 'Danh mục';
    
    document.getElementById('previewTitle').textContent = title;
    document.getElementById('previewPrice').textContent = formatPrice(price);
    document.getElementById('previewCategory').textContent = categoryText !== '-- Chọn danh mục --' ? categoryText : 'Danh mục';
}

/**
 * Update create image preview
 * @param {string} url - Image URL
 */
function updateCreateImagePreview(url) {
    const preview = document.getElementById('createImagePreview');
    const placeholder = document.getElementById('createImagePlaceholder');
    
    if (url && url.trim()) {
        preview.src = url;
        preview.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
        
        preview.onerror = function() {
            this.src = 'https://placehold.co/300x300?text=Invalid+URL';
        };
    } else {
        preview.src = 'https://placehold.co/300x300?text=Preview';
        if (placeholder) placeholder.style.display = 'flex';
    }
}

/**
 * Show create modal loading overlay
 * @param {boolean} show - Show or hide
 */
function showCreateModalLoading(show) {
    if (createModalLoading) {
        if (show) {
            createModalLoading.classList.remove('d-none');
        } else {
            createModalLoading.classList.add('d-none');
        }
    }
}

/**
 * Create new product via API POST
 */
async function createProduct() {
    const title = document.getElementById('createTitle').value.trim();
    const price = parseFloat(document.getElementById('createPrice').value);
    const categoryId = parseInt(document.getElementById('createCategory').value);
    const description = document.getElementById('createDescription').value.trim();
    const imageUrl = document.getElementById('createImageUrl').value.trim();
    
    // Validation
    if (!title) {
        showExportNotification('Vui lòng nhập tên sản phẩm!', 'warning');
        document.getElementById('createTitle').focus();
        return;
    }
    
    if (isNaN(price) || price < 0) {
        showExportNotification('Giá sản phẩm không hợp lệ!', 'warning');
        document.getElementById('createPrice').focus();
        return;
    }
    
    if (!categoryId) {
        showExportNotification('Vui lòng chọn danh mục!', 'warning');
        document.getElementById('createCategory').focus();
        return;
    }
    
    // Prepare data
    const productData = {
        title: title,
        price: price,
        description: description || 'No description',
        categoryId: categoryId,
        images: [imageUrl || 'https://placehold.co/600x400']
    };
    
    // Show loading
    showCreateModalLoading(true);
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const newProduct = await response.json();
        
        // Add to local data at the beginning
        allProducts.unshift(newProduct);
        
        // Reset to first page and refresh
        pagination.currentPage = 1;
        resetSort();
        
        // Clear search and show all products
        if (searchInput) searchInput.value = '';
        renderProducts(allProducts);
        
        // Close modal
        const modalInstance = bootstrap.Modal.getInstance(createProductModal);
        if (modalInstance) modalInstance.hide();
        
        // Show success notification
        showExportNotification(`Đã tạo sản phẩm "${newProduct.title}" thành công!`, 'success');
        
    } catch (error) {
        console.error('Error creating product:', error);
        showExportNotification(`Lỗi tạo sản phẩm: ${error.message}`, 'error');
    } finally {
        showCreateModalLoading(false);
    }
}

// Add event listeners for create form preview
document.addEventListener('DOMContentLoaded', () => {
    // Real-time preview updates
    const createTitle = document.getElementById('createTitle');
    const createPrice = document.getElementById('createPrice');
    const createCategory = document.getElementById('createCategory');
    const createImageUrl = document.getElementById('createImageUrl');
    
    if (createTitle) {
        createTitle.addEventListener('input', updateCreatePreview);
    }
    
    if (createPrice) {
        createPrice.addEventListener('input', updateCreatePreview);
    }
    
    if (createCategory) {
        createCategory.addEventListener('change', updateCreatePreview);
    }
    
    if (createImageUrl) {
        createImageUrl.addEventListener('input', debounce((e) => {
            updateCreateImagePreview(e.target.value);
        }, 500));
    }
    
    // Reset form when modal closes
    if (createProductModal) {
        createProductModal.addEventListener('hidden.bs.modal', resetCreateForm);
    }
});
