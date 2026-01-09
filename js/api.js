import { APP_CONFIG } from './config.js';
import { State } from './state.js';

export const ApiService = {
    
    async fetchBookings(startDate, endDate) {
        console.log('Fetching bookings...', startDate, endDate);
        return [];
    },
    
    async createBooking(bookingData) {
        console.log('Creating booking...', bookingData);
        return { data: bookingData, error: null };
    }
};
