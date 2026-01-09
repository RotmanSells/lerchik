export const APP_CONFIG = {
    schedule: {
        timeSlots: [
            '10:00', '11:00', '12:20', '13:30', '14:40',
            '16:00', '17:00', '18:20', '19:30', '20:30', '21:30'
        ],
        daysToGenerate: 30,
        daysToLoadMore: 14
    },
    
    masters: {
        ulya: { 
            id: 'ulya', 
            name: 'Уля', 
            color: 'mint',
            label: 'Уля'
        },
        lerchik: { 
            id: 'lerchik', 
            name: 'Лерчик', 
            color: 'purple',
            label: 'Лерчик'
        }
    },
    
    procedures: {
        massage: { id: 'massage', title: 'Массаж', duration: 60 },
        laser: { id: 'laser', title: 'Лазер', duration: 60 }
    },
    
    supabase: {
        url: 'https://YOUR_SUPABASE_PROJECT_URL.supabase.co',
        anonKey: 'YOUR_SUPABASE_ANON_KEY'
    }
};

export const UI_CONSTANTS = {
    SELECTORS: {
        slotsContainer: '#slots-container',
        modalBooking: '#modal-booking',
        modalDetails: '#modal-details',
        filterProcedure: '#filter-procedure',
        filterMaster: '#filter-master',
        currentDate: '#current-date',
        scrollTopBtn: '#btn-scroll-top'
    },
    CLASSES: {
        slotFree: 'free',
        slotBusy: 'busy',
        slotBreak: 'break',
        hidden: 'hidden',
        modalOpen: 'open'
    }
};
