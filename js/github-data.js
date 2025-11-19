// GitHub-hosted data loader
// All devices read from the same GitHub raw file

const GITHUB_DATA_URL = 'https://raw.githubusercontent.com/broneotodak/TAD/main/data/event-data.json';

class GitHubDataLoader {
    constructor() {
        this.cache = null;
        this.lastFetch = null;
        this.cacheDuration = 10000; // 10 seconds
    }

    // Load data from GitHub
    async loadData() {
        try {
            // Check cache first
            if (this.cache && this.lastFetch && (Date.now() - this.lastFetch < this.cacheDuration)) {
                console.log('📦 Using cached data');
                return this.cache;
            }

            console.log('⬇️ Fetching data from GitHub...');
            
            const response = await fetch(GITHUB_DATA_URL + '?t=' + Date.now(), {
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            // Update cache
            this.cache = data;
            this.lastFetch = Date.now();
            
            // Save to localStorage as backup
            localStorage.setItem('githubDataCache', JSON.stringify(data));
            localStorage.setItem('githubDataTimestamp', this.lastFetch.toString());
            
            console.log('✅ Data loaded from GitHub', {
                participants: data.participants?.length || 0,
                tables: data.tables?.length || 0
            });
            
            return data;

        } catch (error) {
            console.error('❌ Failed to load from GitHub:', error);
            
            // Try localStorage backup
            const cached = localStorage.getItem('githubDataCache');
            if (cached) {
                console.log('📦 Using localStorage backup');
                return JSON.parse(cached);
            }
            
            // Final fallback to hardcoded data
            console.log('⚠️ Using default data');
            return {
                participants: window.attendanceData || [],
                tables: [],
                lastUpdated: null
            };
        }
    }

    // Clear cache to force refresh
    clearCache() {
        this.cache = null;
        this.lastFetch = null;
        console.log('🗑️ Cache cleared');
    }
}

// Create global instance
window.githubData = new GitHubDataLoader();

