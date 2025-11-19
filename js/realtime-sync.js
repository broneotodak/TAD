// Real-time Cloud Sync using JSONBin.io (free tier)
// This provides a shared cloud storage that all devices can access

class RealtimeSync {
    constructor() {
        // JSONBin.io free public bin (no auth required for read)
        // For production, you should create your own bin and use API key
        this.binId = 'TAD_EVENT_2025'; // Will be created on first save
        this.apiEndpoint = 'https://api.jsonbin.io/v3/b';
        this.publicEndpoint = null; // Will be set after bin creation
        
        this.isOnline = navigator.onLine;
        this.lastSync = null;
        this.syncInProgress = false;
        this.autoSyncEnabled = false;
        
        // Monitor connection
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🟢 Online');
            if (this.autoSyncEnabled) {
                this.pullFromCloud();
            }
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('🔴 Offline');
        });
    }

    // Initialize - load bin ID from localStorage or use default
    init() {
        const storedBinId = localStorage.getItem('cloudBinId');
        if (storedBinId) {
            this.binId = storedBinId;
            this.publicEndpoint = `${this.apiEndpoint}/${this.binId}/latest`;
        }
    }

    // Pull data from cloud
    async pullFromCloud() {
        if (!this.isOnline) {
            console.log('📴 Offline - cannot sync');
            return { success: false, offline: true };
        }

        try {
            console.log('⬇️ Pulling data from cloud...');
            
            if (!this.publicEndpoint) {
                console.log('⚠️ No cloud storage configured yet');
                return { success: false, notConfigured: true };
            }

            const response = await fetch(this.publicEndpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            const data = result.record || result; // Handle different API response formats

            if (data.participants) {
                // Save to localStorage
                localStorage.setItem('participants', JSON.stringify(data.participants));
                if (data.tables) {
                    localStorage.setItem('tables', JSON.stringify(data.tables));
                }
                localStorage.setItem('lastCloudSync', new Date().toISOString());
                
                this.lastSync = new Date();
                console.log('✅ Data synced from cloud');
                
                return {
                    success: true,
                    data: data,
                    syncedAt: this.lastSync
                };
            }

            return { success: false, noData: true };

        } catch (error) {
            console.error('❌ Cloud sync failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Push data to cloud
    async pushToCloud(participants, tables = []) {
        if (!this.isOnline) {
            console.log('📴 Offline - saved locally only');
            this.saveLocally(participants, tables);
            return { success: false, offline: true, savedLocally: true };
        }

        try {
            console.log('⬆️ Pushing data to cloud...');

            const data = {
                participants: participants,
                tables: tables,
                lastUpdated: new Date().toISOString(),
                version: Date.now()
            };

            // Save locally first
            this.saveLocally(participants, tables);

            // For JSONBin.io, we'll use the public API
            // Note: This is a simplified version. For production, use proper API key
            
            if (!this.publicEndpoint) {
                // Create new bin
                const createResponse = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Bin-Name': 'TAD_Event_2025',
                        'X-Bin-Private': 'false'
                    },
                    body: JSON.stringify(data)
                });

                if (createResponse.ok) {
                    const result = await createResponse.json();
                    const newBinId = result.metadata.id;
                    this.binId = newBinId;
                    this.publicEndpoint = `${this.apiEndpoint}/${newBinId}/latest`;
                    localStorage.setItem('cloudBinId', newBinId);
                    console.log('✅ Cloud storage created:', newBinId);
                }
            } else {
                // Update existing bin
                const updateResponse = await fetch(`${this.apiEndpoint}/${this.binId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (updateResponse.ok) {
                    console.log('✅ Cloud data updated');
                }
            }

            this.lastSync = new Date();
            localStorage.setItem('lastCloudSync', this.lastSync.toISOString());

            return {
                success: true,
                syncedAt: this.lastSync,
                binId: this.binId
            };

        } catch (error) {
            console.error('❌ Cloud push failed:', error);
            return { success: false, error: error.message, savedLocally: true };
        }
    }

    // Save to localStorage
    saveLocally(participants, tables) {
        localStorage.setItem('participants', JSON.stringify(participants));
        localStorage.setItem('tables', JSON.stringify(tables));
        localStorage.setItem('lastLocalSave', new Date().toISOString());
    }

    // Enable auto-sync for check-in stations
    enableAutoSync(intervalSeconds = 30) {
        this.autoSyncEnabled = true;
        
        // Initial pull
        this.pullFromCloud();
        
        // Set up interval
        this.syncInterval = setInterval(() => {
            if (this.isOnline && !this.syncInProgress) {
                this.pullFromCloud();
            }
        }, intervalSeconds * 1000);
        
        console.log(`🔄 Auto-sync enabled (every ${intervalSeconds}s)`);
    }

    // Disable auto-sync
    disableAutoSync() {
        this.autoSyncEnabled = false;
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        console.log('⏸️ Auto-sync disabled');
    }

    // Get sync status
    getSyncStatus() {
        const lastCloudSync = localStorage.getItem('lastCloudSync');
        const lastLocalSave = localStorage.getItem('lastLocalSave');
        const binId = localStorage.getItem('cloudBinId');

        return {
            isOnline: this.isOnline,
            autoSyncEnabled: this.autoSyncEnabled,
            lastCloudSync: lastCloudSync ? new Date(lastCloudSync).toLocaleString() : 'Never',
            lastLocalSave: lastLocalSave ? new Date(lastLocalSave).toLocaleString() : 'Never',
            cloudConfigured: !!binId,
            binId: binId
        };
    }
}

// Create global instance
window.realtimeSync = new RealtimeSync();
window.realtimeSync.init();

