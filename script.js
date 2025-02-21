// Initialize the map with performance optimizations
const map = L.map('map', {
    minZoom: 2,
    maxZoom: 8,
    maxBounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
    maxBoundsViscosity: 1.0,
    wheelDebounceTime: 150,
    wheelPxPerZoomLevel: 120,
    scrollWheelZoom: false, // Disable scroll wheel zoom
    zoomControl: false // Disable default zoom control
}).setView([20, 0], 2);

// Add custom zoom slider
const zoomSlider = document.querySelector('.zoom-slider input');
zoomSlider.value = map.getZoom();

zoomSlider.addEventListener('input', (e) => {
    map.setZoom(parseFloat(e.target.value));
});

map.on('zoomend', () => {
    zoomSlider.value = map.getZoom();
});

// Add OpenStreetMap tiles WITHOUT labels
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors, © CARTO',
    keepBuffer: 2,
    updateWhenIdle: true,
    updateWhenZooming: false
}).addTo(map);

// Style for countries
function getCountryStyle(risk) {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const baseStyle = {
        weight: 0.5, // Reduced from 1
        opacity: 0.8, // Slightly reduced opacity
        color: isDarkMode ? '#888' : '#666',
        dashArray: '',
        fillOpacity: isDarkMode ? 0.5 : 0.7
    };

    // Color schemes for light and dark modes
    const colors = {
        light: {
            high: '#ff4444',
            medium: '#ffbb33',
            low: '#00C851',
            default: '#cccccc'
        },
        dark: {
            high: '#cc0000',
            medium: '#cc9900',
            low: '#006400',
            default: '#4d4d4d'
        }
    };

    const colorScheme = isDarkMode ? colors.dark : colors.light;

    switch(risk) {
        case 'high':
            return { ...baseStyle, fillColor: colorScheme.high };
        case 'medium':
            return { ...baseStyle, fillColor: colorScheme.medium };
        case 'low':
            return { ...baseStyle, fillColor: colorScheme.low };
        default:
            return { ...baseStyle, fillColor: colorScheme.default };
    }
}

// Load GeoJSON data
fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
    .then(response => response.json())
    .then(data => {
        // Example risk levels - in real app, this would come from your disease data
        const riskLevels = {
            'United States': 'high',
            'France': 'medium',
            'Japan': 'low'
            // Add more countries and their risk levels as needed
        };

        // Store countryLayer globally
        window.countryLayer = L.geoJSON(data, {
            style: (feature) => {
                const countryName = feature.properties.ADMIN;
                const risk = riskLevels[countryName] || 'default';
                return getCountryStyle(risk);
            },
            onEachFeature: (feature, layer) => {
                const countryName = feature.properties.ADMIN;
                const risk = riskLevels[countryName] || 'Unknown';
                
                // Add hover and click events
                layer.on({
                    mouseover: (e) => {
                        const layer = e.target;
                        layer.setStyle({
                            weight: 1, // Reduced from 2
                            color: '#666',
                            dashArray: '',
                            fillOpacity: 0.9
                        });
                        layer.bringToFront();
                    },
                    mouseout: (e) => {
                        const layer = e.target;
                        layer.setStyle(getCountryStyle(risk));
                    },
                    click: (e) => {
                        // Example data - in real app, this would come from your disease database
                        const mockData = {
                            location: countryName,
                            disease: 'COVID-19',
                            cases: Math.floor(Math.random() * 10000)
                        };
                        
                        updateInfoPanel(`
                            <div class="popup-content">
                                <div class="popup-location">${mockData.location}</div>
                                <div class="popup-disease">${mockData.disease}</div>
                                <div class="popup-cases">${mockData.cases}</div>
                            </div>
                        `);
                    }
                });
            }
        }).addTo(map);
    })
    .catch(error => {
        console.error('Error loading GeoJSON:', error);
        loadingIndicator.classList.remove('active');
    });

// Loading indicator handlers
map.on('loading', function() {
    loadingIndicator.classList.add('active');
});

map.on('load', function() {
    loadingIndicator.classList.remove('active');
});

// Event Listeners for UI Elements
document.getElementById('search').addEventListener('input', function(e) {
  // Add search functionality here
  console.log('Searching for:', e.target.value);
});

// Risk button functionality
const riskButtons = document.querySelectorAll('.risk-btn');
riskButtons.forEach(button => {
  button.addEventListener('click', function() {
    riskButtons.forEach(btn => btn.classList.remove('active'));
    this.classList.add('active');
    const riskLevel = this.getAttribute('data-risk');
    console.log('Selected risk level:', riskLevel);
  });
});

// Dark mode functionality
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

// Check for saved dark mode preference
const darkMode = localStorage.getItem('darkMode');
if (darkMode === 'enabled') {
    body.classList.add('dark-mode');
    darkModeToggle.querySelector('.mode-icon').textContent = '🌙';
}

darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    
    // Update icon
    darkModeToggle.querySelector('.mode-icon').textContent = isDarkMode ? '🌙' : '☀️';
    
    // Save preference
    localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');

    // Store current state
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    
    // Force map container cleanup
    map.remove();
    
    // Recreate map instance
    const newMap = L.map('map', {
        minZoom: 2,
        maxZoom: 8,
        maxBounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
        maxBoundsViscosity: 1.0,
        wheelDebounceTime: 150,
        wheelPxPerZoomLevel: 120,
        scrollWheelZoom: false,
        zoomControl: false
    }).setView(currentCenter, currentZoom);

    // Reassign the new map instance to the global map variable
    window.map = newMap;

    // Add base tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors, © CARTO',
        keepBuffer: 2,
        updateWhenIdle: true,
        updateWhenZooming: false
    }).addTo(newMap);

    // Re-add GeoJSON layer with updated styles
    if (window.countryLayer) {
        window.countryLayer.removeFrom(map);
        window.countryLayer.addTo(newMap);
        window.countryLayer.setStyle((feature) => {
            const countryName = feature.properties.ADMIN;
            const risk = riskLevels[countryName] || 'default';
            return getCountryStyle(risk);
        });
    }

    // Update zoom slider for new map instance
    zoomSlider.value = currentZoom;
    newMap.on('zoomend', () => {
        zoomSlider.value = newMap.getZoom();
    });

    // Reattach zoom slider control
    zoomSlider.addEventListener('input', (e) => {
        newMap.setZoom(parseFloat(e.target.value));
    });
});

// Update info panel when clicking on markers
function updateInfoPanel(content) {
    try {
        console.log('Raw popup content:', content); // Debug log

        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        
        const location = doc.querySelector('.popup-location')?.textContent || 'Unknown';
        const disease = doc.querySelector('.popup-disease')?.textContent || 'Unknown';
        const cases = doc.querySelector('.popup-cases')?.textContent || '0';
        
        console.log('Parsed data:', { location, disease, cases }); // Debug log

        document.querySelector('.info-value.location').textContent = location;
        document.querySelector('.info-value.disease').textContent = disease;
        document.querySelector('.info-value.cases').textContent = cases;
    } catch (error) {
        console.error('Error updating info panel:', error);
        // Set default values if parsing fails
        document.querySelector('.info-value.location').textContent = 'Error loading';
        document.querySelector('.info-value.disease').textContent = 'Error loading';
        document.querySelector('.info-value.cases').textContent = 'Error loading';
    }
}

map.on('popupopen', function(e) {
  updateInfoPanel(e.popup._content);
});

// Search functionality
function searchCountry(searchText) {
    if (!window.countryLayer) return;
    
    const searchLower = searchText.toLowerCase();
    let found = false;

    window.countryLayer.eachLayer((layer) => {
        const countryName = layer.feature.properties.ADMIN;
        if (countryName.toLowerCase().includes(searchLower)) {
            // Get bounds of the country
            const bounds = layer.getBounds();
            
            // Highlight the country
            layer.setStyle({
                weight: 1.5, // Reduced from 3
                color: '#2ecc71',
                dashArray: '',
                fillOpacity: 0.7
            });
            
            // Center and zoom to the country
            map.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 6,
                animate: true,
                duration: 1
            });
            
            // Trigger click event to show country info
            layer.fireEvent('click');
            
            found = true;
        } else {
            // Reset style for non-matching countries
            const risk = riskLevels[countryName] || 'default';
            layer.setStyle(getCountryStyle(risk));
        }
    });

    return found;
}

let countryNames = []; // Will store all country names

function initializeSearch() {
    if (window.countryLayer) {
        countryNames = [];
        window.countryLayer.eachLayer((layer) => {
            countryNames.push(layer.feature.properties.ADMIN);
        });
    }
}

function createSearchResults(results) {
    const searchBox = document.querySelector('.search-box');
    let resultsContainer = searchBox.querySelector('.search-results');
    
    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results';
        searchBox.appendChild(resultsContainer);
    }

    resultsContainer.innerHTML = '';
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No matching countries found</div>';
    } else {
        results.forEach(country => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.textContent = country;
            item.addEventListener('click', () => {
                document.getElementById('search').value = country;
                searchCountry(country);
                resultsContainer.classList.remove('active');
            });
            resultsContainer.appendChild(item);
        });
    }
    
    resultsContainer.classList.add('active');
}

// Replace the existing search event listener with this enhanced version
let searchTimeout;
document.getElementById('search').addEventListener('input', function(e) {
    const searchText = e.target.value.trim();
    
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    if (!countryNames.length) {
        initializeSearch();
    }
    
    if (searchText.length >= 2) {
        searchTimeout = setTimeout(() => {
            const results = countryNames.filter(country => 
                country.toLowerCase().includes(searchText.toLowerCase())
            ).slice(0, 5); // Limit to 5 results
            
            createSearchResults(results);
        }, 300);
    } else {
        const resultsContainer = document.querySelector('.search-results');
        if (resultsContainer) {
            resultsContainer.classList.remove('active');
        }
    }
});

// Close search results when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) {
        const resultsContainer = document.querySelector('.search-results');
        if (resultsContainer) {
            resultsContainer.classList.remove('active');
        }
    }
});
