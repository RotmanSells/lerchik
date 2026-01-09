export const DateUtils = {
    formatDateTitle: (date) => {
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long'
        });
    },

    formatDayOfWeek: (date) => {
        return date.toLocaleDateString('ru-RU', { weekday: 'long' });
    },

    formatTime: (hour) => {
        return `${hour.toString().padStart(2, '0')}:00`;
    },

    toISODate: (date) => {
        return date.toISOString().split('T')[0];
    },

    addDays: (date, days) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    },

    isToday: (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    },

    getDaysInMonth: (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    },

    getFirstDayOfMonth: (year, month) => {
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    },

    getMonthName: (year, month) => {
        return new Date(year, month).toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
    }
};

export const ValidationUtils = {
    isValidPhoneLast4: (val) => {
        return /^\d{4}$/.test(val);
    }
};

export const DOMUtils = {
    createElement: (tag, classes = [], text = '') => {
        const el = document.createElement(tag);
        if (classes.length) el.classList.add(...classes);
        if (text) el.textContent = text;
        return el;
    }
};
