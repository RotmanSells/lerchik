import { APP_CONFIG } from './config.js';
import { DateUtils } from './utils.js';
import { State } from './state.js';

export const CoreLogic = {
    getWorkingMaster(date) {
        const baseDate = new Date(2026, 0, 11);
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        baseDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));
        const cycleDay = ((diffDays % 4) + 4) % 4;
        
        return cycleDay < 2 ? 'lerchik' : 'ulya';
    },

    generateDaySlots(date) {
        const slots = [];
        const { timeSlots } = APP_CONFIG.schedule;
        const masters = Object.values(APP_CONFIG.masters);

        timeSlots.forEach((timeStart, index) => {
            const timeEnd = timeSlots[index + 1] || '22:30';

            masters.forEach(master => {
                slots.push({
                    masterId: master.id,
                    date: DateUtils.toISODate(date),
                    timeStart,
                    timeEnd,
                    status: 'free'
                });
            });
        });
        return slots;
    },

    enrichSlotsWithStatus(slots, bookings, breaks) {
        return slots.map(slot => {
            const isBooked = bookings.some(b => 
                b.master_id === slot.masterId && 
                b.date === slot.date && 
                b.time_start.slice(0, 5) === slot.timeStart
            );
            
            if (isBooked) {
                const booking = bookings.find(b => 
                    b.master_id === slot.masterId && 
                    b.date === slot.date && 
                    b.time_start.slice(0, 5) === slot.timeStart
                );
                return { ...slot, status: 'busy', bookingData: booking };
            }

            const isBreak = breaks.some(b => 
                b.master_id === slot.masterId && 
                b.date === slot.date && 
                b.time_start.slice(0, 5) === slot.timeStart
            );

            if (isBreak) {
                return { ...slot, status: 'break' };
            }

            return slot;
        });
    },

    filterSlots(slots) {
        const { procedure, master } = State.filters;

        return slots.filter(slot => {
            if (procedure === 'all') {
                const workingMaster = this.getWorkingMaster(new Date(slot.date));
                return slot.status === 'free' && slot.masterId === workingMaster;
            }
            
            if (slot.status !== 'busy') {
                return false;
            }
            
            if (slot.masterId !== master) {
                return false;
            }
            
            if (slot.bookingData && slot.bookingData.procedure_id !== procedure) {
                return false;
            }
            
            return true;
        });
    },

    getNextBatchOfDays(startIndex, count) {
        const days = [];
        const today = new Date();
        
        for (let i = 0; i < count; i++) {
            const date = DateUtils.addDays(today, startIndex + i);
            const isoDate = DateUtils.toISODate(date);
            
            let rawSlots = this.generateDaySlots(date);
            let enrichedSlots = this.enrichSlotsWithStatus(rawSlots, State.bookings, State.breaks);
            
            const customBookings = State.bookings.filter(b => {
                if (b.date !== isoDate) return false;
                const timeStart = b.time_start.slice(0, 5);
                return !APP_CONFIG.schedule.timeSlots.includes(timeStart);
            });
            
            customBookings.forEach(booking => {
                enrichedSlots.push({
                    masterId: booking.master_id,
                    date: isoDate,
                    timeStart: booking.time_start.slice(0, 5),
                    timeEnd: booking.time_end?.slice(0, 5) || booking.time_start.slice(0, 5),
                    status: 'busy',
                    bookingData: booking
                });
            });
            
            days.push({
                dateObj: date,
                isoDate: isoDate,
                slots: enrichedSlots
            });
        }
        return days;
    },

    getDayStatus(date) {
        const slots = this.generateDaySlots(date);
        const enrichedSlots = this.enrichSlotsWithStatus(slots, State.bookings, State.breaks);
        const workingMaster = this.getWorkingMaster(date);
        
        const masterSlots = enrichedSlots.filter(s => s.masterId === workingMaster);
        const hasFree = masterSlots.some(s => s.status === 'free');
        const hasBusy = masterSlots.some(s => s.status === 'busy');

        if (hasFree) return 'free';
        if (hasBusy) return 'busy';
        return 'empty';
    },

    calculateStats(bookings) {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);
        startOfWeek.setHours(0,0,0,0);
        
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const stats = {
            massage: { week: 0, month: 0 },
            laser: { week: 0, month: 0 }
        };
        
        bookings.forEach(booking => {
            const date = new Date(booking.date);
            const isMassage = booking.procedure_id === 'massage';
            const isLaser = booking.procedure_id === 'laser';
            
            if (date >= startOfWeek) {
                if (isMassage) stats.massage.week++;
                if (isLaser) stats.laser.week++;
            }
            
            if (date >= startOfMonth) {
                if (isMassage) stats.massage.month++;
                if (isLaser) stats.laser.month++;
            }
        });
        
        return stats;
    }
};
