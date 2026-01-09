import { APP_CONFIG } from './config.js';

export const State = {
    filters: {
        procedure: 'all',
        master: 'ulya'
    },
    
    modalSelection: {
        procedure: null,
        master: null
    },
    
    scheduleCache: {
    },
    
    loadedDaysCount: 0,
    
    bookings: [],
    breaks: [],
    clients: {},
    
    activeBooking: null,
    
    editingBooking: null,
    
    init() {
        const saved = localStorage.getItem('lerchik_clients');
        if (saved) {
            try {
                this.clients = JSON.parse(saved);
            } catch (e) {
                this.clients = {};
            }
        }
    },
    
    updateFilter(type, value) {
        if (this.filters[type] !== undefined) {
            this.filters[type] = value;
            return true;
        }
        return false;
    },

    resetModalSelection() {
        this.modalSelection = { procedure: null, master: null };
    },

    setModalSelection(type, value) {
        this.modalSelection[type] = value;
    },

    setBookings(bookings) {
        this.bookings = bookings;
    },

    addBooking(booking) {
        this.bookings.push(booking);
    },

    updateBooking(bookingId, updates) {
        const index = this.bookings.findIndex(b => b.id === bookingId);
        if (index !== -1) {
            this.bookings[index] = { ...this.bookings[index], ...updates };
            return true;
        }
        return false;
    },

    removeBooking(bookingId) {
        this.bookings = this.bookings.filter(b => b.id !== bookingId);
    },

    importClients(phoneNumbers) {
        phoneNumbers.forEach(phone => {
            const cleaned = phone.replace(/\D/g, '');
            if (cleaned.length >= 10) {
                this.clients[cleaned] = { addedAt: new Date().toISOString() };
            }
        });
        localStorage.setItem('lerchik_clients', JSON.stringify(this.clients));
    },

    getClientsCount() {
        return Object.keys(this.clients).length;
    }
};
