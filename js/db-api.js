// Database API client for Neon via Netlify Functions

class DatabaseAPI {
    constructor() {
        this.baseURL = '/api';
        this.cache = null;
        this.cacheTime = null;
        this.cacheDuration = 5000; // 5 seconds
    }

    // Initialize database (run once)
    async initDatabase() {
        try {
            const response = await fetch(`${this.baseURL}/init-db`);
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Failed to initialize database:', error);
            return { success: false, error: error.message };
        }
    }

    // Get all participants and tables
    async getParticipants(useCache = true) {
        try {
            // Check cache
            if (useCache && this.cache && this.cacheTime && 
                (Date.now() - this.cacheTime < this.cacheDuration)) {
                console.log('📦 Using cached data');
                return this.cache;
            }

            console.log('⬇️ Fetching from database...');
            const response = await fetch(`${this.baseURL}/get-participants`);
            const result = await response.json();
            
            if (result.success) {
                this.cache = result;
                this.cacheTime = Date.now();
                console.log('✅ Data loaded from database');
            }
            
            return result;
        } catch (error) {
            console.error('Failed to fetch participants:', error);
            return { success: false, error: error.message };
        }
    }

    // Save participants and tables (admin only)
    async saveParticipants(participants, tables) {
        try {
            console.log('⬆️ Saving to database...');
            const response = await fetch(`${this.baseURL}/save-participants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ participants, tables })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Data saved to database');
                this.cache = null; // Invalidate cache
            }
            
            return result;
        } catch (error) {
            console.error('Failed to save participants:', error);
            return { success: false, error: error.message };
        }
    }

    // Check in a participant
    async checkinParticipant(participantId) {
        try {
            const response = await fetch(`${this.baseURL}/checkin-participant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ participantId })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.cache = null; // Invalidate cache
            }
            
            return result;
        } catch (error) {
            console.error('Failed to check in participant:', error);
            return { success: false, error: error.message };
        }
    }

    // Migrate initial data to database
    async migrateData(participants) {
        try {
            console.log('🔄 Migrating data to database...');
            const response = await fetch(`${this.baseURL}/migrate-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ participants })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log(`✅ Migration complete: ${result.migrated} migrated, ${result.skipped} skipped`);
                this.cache = null;
            }
            
            return result;
        } catch (error) {
            console.error('Failed to migrate data:', error);
            return { success: false, error: error.message };
        }
    }

    // Update a participant
    async updateParticipant(id, name, company, vip, table) {
        try {
            const response = await fetch(`${this.baseURL}/update-participant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id, name, company, vip, table })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.cache = null;
            }
            
            return result;
        } catch (error) {
            console.error('Failed to update participant:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete a participant
    async deleteParticipant(id) {
        try {
            const response = await fetch(`${this.baseURL}/delete-participant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.cache = null;
            }
            
            return result;
        } catch (error) {
            console.error('Failed to delete participant:', error);
            return { success: false, error: error.message };
        }
    }

    // Clear cache
    clearCache() {
        this.cache = null;
        this.cacheTime = null;
    }
}

// Create global instance
window.dbAPI = new DatabaseAPI();

