import { APP_CONFIG, UI_CONSTANTS } from './config.js';
import { DateUtils, DOMUtils } from './utils.js';
import { State } from './state.js';
import { CoreLogic } from './core.js';

export const UI = {
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderCurrentDate();
        this.dom.filterMaster.classList.add('filter-master-disabled');
        this.renderInitialDays();
    },

    cacheDOM() {
        this.dom = {
            container: document.querySelector(UI_CONSTANTS.SELECTORS.slotsContainer),
            modalBooking: document.querySelector(UI_CONSTANTS.SELECTORS.modalBooking),
            modalDetails: document.querySelector(UI_CONSTANTS.SELECTORS.modalDetails),
            filterProcedure: document.querySelector(UI_CONSTANTS.SELECTORS.filterProcedure),
            filterMaster: document.querySelector(UI_CONSTANTS.SELECTORS.filterMaster),
            currentDate: document.querySelector(UI_CONSTANTS.SELECTORS.currentDate),
            scrollTopBtn: document.querySelector(UI_CONSTANTS.SELECTORS.scrollTopBtn),
            
            bookingForm: document.getElementById('booking-form'),
            bookingSummary: document.getElementById('booking-summary'),
            phoneDisplay: document.getElementById('phone-display'),
            bookingComment: document.getElementById('booking-comment'),
            
            detailsContent: document.getElementById('details-content'),
            btnDetailsCall: document.getElementById('btn-details-call'),
            btnDetailsDelete: document.getElementById('btn-details-delete'),
            btnDetailsEdit: document.getElementById('btn-details-edit'),
            
            modalEdit: document.getElementById('modal-edit'),
            editForm: document.getElementById('edit-form'),
            editSummary: document.getElementById('edit-summary'),
            editPhoneDisplay: document.getElementById('edit-phone-display'),
            editChoiceProcedure: document.getElementById('edit-choice-procedure'),
            editChoiceMaster: document.getElementById('edit-choice-master'),
            editNumpad: document.getElementById('edit-numpad'),
            
            btnCalendar: document.getElementById('btn-calendar'),
            modalCalendar: document.getElementById('modal-calendar'),
            calTitle: document.getElementById('cal-title'),
            calThead: document.getElementById('calendar-thead'),
            calTbody: document.getElementById('calendar-tbody'),
            
            btnAdmin: document.getElementById('btn-admin'),
            modalAdmin: document.getElementById('modal-admin'),
            adminTabs: document.getElementById('admin-tabs'),
            adminContentStats: document.getElementById('admin-content-stats'),
            adminContentClients: document.getElementById('admin-content-clients'),
            clientsImportInput: document.getElementById('clients-import-input'),
            btnImportClients: document.getElementById('btn-import-clients'),
            statClientsCount: document.getElementById('stat-clients-count'),
            
            choiceProcedure: document.getElementById('choice-procedure'),
            choiceMaster: document.getElementById('choice-master')
        };
    },

    bindEvents() {
        this.dom.filterProcedure.addEventListener('click', (e) => this.handleFilterClick(e, 'procedure'));
        this.dom.filterMaster.addEventListener('click', (e) => this.handleFilterClick(e, 'master'));

        [this.dom.modalBooking, this.dom.modalDetails, this.dom.modalCalendar, this.dom.modalAdmin, this.dom.modalEdit].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(modal);
            });
        });

        const numpadBtns = document.querySelectorAll('#booking-form .numpad-btn');
        numpadBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleNumpad(e.target.dataset.key, 'booking'));
        });
        
        const editNumpadBtns = document.querySelectorAll('#edit-numpad .numpad-btn');
        editNumpadBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleNumpad(e.target.dataset.key, 'edit'));
        });

        this.dom.bookingForm.addEventListener('submit', (e) => this.handleBookingSubmit(e));
        
        this.dom.scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        window.addEventListener('scroll', () => this.handleScroll());
        
        this.dom.btnCalendar.addEventListener('click', () => this.openCalendar());
        
        this.dom.btnAdmin.addEventListener('click', () => this.openAdmin());
        this.dom.adminTabs.addEventListener('click', (e) => this.handleAdminTabClick(e));
        
        this.dom.choiceProcedure.addEventListener('click', (e) => this.handleChoiceClick(e, 'procedure'));
        this.dom.choiceMaster.addEventListener('click', (e) => this.handleChoiceClick(e, 'master'));
        
        this.dom.editChoiceProcedure.addEventListener('click', (e) => this.handleEditChoiceClick(e, 'procedure'));
        this.dom.editChoiceMaster.addEventListener('click', (e) => this.handleEditChoiceClick(e, 'master'));
        
        this.dom.btnDetailsEdit.addEventListener('click', () => this.openEditModal());
        this.dom.btnDetailsDelete.addEventListener('click', () => this.handleDeleteBooking());
        this.dom.btnDetailsCall.addEventListener('click', () => this.handleCallClient());
        this.dom.editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
        this.dom.btnImportClients.addEventListener('click', () => this.handleImportClients());
        
        this.initSwipeToClose();
    },

    initSwipeToClose() {
        const modals = [
            this.dom.modalBooking,
            this.dom.modalDetails,
            this.dom.modalCalendar,
            this.dom.modalAdmin,
            this.dom.modalEdit
        ];

        modals.forEach(modal => {
            const sheet = modal.querySelector('.modal-sheet');
            const handle = modal.querySelector('.sheet-handle');
            if (!sheet || !handle) return;

            let startY = 0;
            let currentY = 0;
            let isDragging = false;

            const onTouchStart = (e) => {
                startY = e.touches[0].clientY;
                isDragging = true;
                sheet.style.transition = 'none';
            };

            const onTouchMove = (e) => {
                if (!isDragging) return;
                currentY = e.touches[0].clientY - startY;
                if (currentY > 0) {
                    sheet.style.transform = `translateY(${currentY}px)`;
                }
            };

            const onTouchEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                sheet.style.transition = '';
                
                if (currentY > 100) {
                    this.closeModal(modal);
                } else {
                    sheet.style.transform = '';
                }
                currentY = 0;
            };

            handle.addEventListener('touchstart', onTouchStart, { passive: true });
            handle.addEventListener('touchmove', onTouchMove, { passive: true });
            handle.addEventListener('touchend', onTouchEnd);
        });
    },

    openCalendar() {
        this.renderCalendar();
        this.dom.modalCalendar.classList.add('open');
    },

    renderCalendar() {
        const { timeSlots, daysToGenerate } = APP_CONFIG.schedule;
        
        this.dom.calTitle.textContent = 'Расписание';
        this.dom.calThead.innerHTML = '';
        this.dom.calTbody.innerHTML = '';
        
        const headerRow = document.createElement('tr');
        const dayTh = document.createElement('th');
        dayTh.textContent = 'Дата';
        headerRow.appendChild(dayTh);
        
        timeSlots.forEach(time => {
            const th = document.createElement('th');
            th.textContent = time.slice(0, 5);
            headerRow.appendChild(th);
        });
        this.dom.calThead.appendChild(headerRow);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < daysToGenerate; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            const isToday = i === 0;
            const workingMaster = CoreLogic.getWorkingMaster(date);
            const masterName = APP_CONFIG.masters[workingMaster].name;
            
            const rawSlots = CoreLogic.generateDaySlots(date);
            const enrichedSlots = CoreLogic.enrichSlotsWithStatus(rawSlots, State.bookings, State.breaks);
            const masterSlots = enrichedSlots.filter(s => s.masterId === workingMaster);
            
            const tr = document.createElement('tr');
            if (isToday) tr.classList.add('today');
            
            const dayTd = document.createElement('td');
            const day = date.getDate();
            const dayOfWeek = date.toLocaleDateString('ru-RU', { weekday: 'short' });
            dayTd.innerHTML = `
                <div class="day-label">
                    <span class="day-label-date">${day} ${dayOfWeek}</span>
                    <span class="day-label-master ${workingMaster}">${masterName}</span>
                </div>
            `;
            tr.appendChild(dayTd);
            
            timeSlots.forEach(timeStart => {
                const td = document.createElement('td');
                const slot = masterSlots.find(s => s.timeStart === timeStart);
                
                const btn = document.createElement('button');
                btn.className = 'cal-slot';
                
                if (slot) {
                    btn.classList.add(slot.status);
                    if (slot.status === 'free' || (slot.status === 'busy' && slot.bookingData)) {
                        btn.addEventListener('click', () => this.handleCalendarSlotClick(slot));
                    }
                }
                
                td.appendChild(btn);
                tr.appendChild(td);
            });
            
            this.dom.calTbody.appendChild(tr);
        }
    },

    handleCalendarSlotClick(slot) {
        this.closeModal(this.dom.modalCalendar);
        
        if (slot.status === 'free') {
            this.openBookingModal(slot);
        } else if (slot.status === 'busy' && slot.bookingData) {
            this.openDetailsModal(slot.bookingData);
        }
    },

    openAdmin() {
        const stats = CoreLogic.calculateStats(State.bookings);
        document.getElementById('stat-massage-week').textContent = stats.massage.week;
        document.getElementById('stat-massage-month').textContent = stats.massage.month;
        document.getElementById('stat-laser-week').textContent = stats.laser.week;
        document.getElementById('stat-laser-month').textContent = stats.laser.month;
        
        this.dom.statClientsCount.textContent = State.getClientsCount();
        
        this.dom.modalAdmin.classList.add('open');
    },

    handleImportClients() {
        const input = this.dom.clientsImportInput.value.trim();
        if (!input) {
            this.showToast('Введите номера телефонов');
            return;
        }
        
        const phones = input.split(/[\s,\n]+/).filter(p => p.length > 0);
        State.importClients(phones);
        
        this.dom.clientsImportInput.value = '';
        this.dom.statClientsCount.textContent = State.getClientsCount();
        this.showToast(`Импортировано ${phones.length} номеров`);
    },

    handleAdminTabClick(e) {
        if (!e.target.classList.contains('segment-btn')) return;
        
        const tab = e.target.dataset.tab;
        
        this.dom.adminTabs.querySelectorAll('.segment-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        const bg = this.dom.adminTabs.querySelector('.segment-bg');
        const index = Array.from(this.dom.adminTabs.querySelectorAll('.segment-btn')).indexOf(e.target);
        bg.style.transform = `translateX(${index * 100}%)`;

        this.dom.adminContentStats.classList.add('hidden');
        this.dom.adminContentClients.classList.add('hidden');
        
        if (tab === 'stats') this.dom.adminContentStats.classList.remove('hidden');
        if (tab === 'clients') this.dom.adminContentClients.classList.remove('hidden');
    },

    handleChoiceClick(e, type) {
        if (!e.target.classList.contains('choice-btn')) return;
        
        const container = type === 'procedure' ? this.dom.choiceProcedure : this.dom.choiceMaster;
        container.querySelectorAll('.choice-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        State.setModalSelection(type, e.target.dataset.value);
    },

    handleFilterClick(e, type) {
        if (!e.target.classList.contains('segment-btn')) return;
        
        const value = e.target.dataset.value;
        const container = type === 'procedure' ? this.dom.filterProcedure : this.dom.filterMaster;
        
        container.querySelectorAll('.segment-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        const bg = container.querySelector('.segment-bg');
        const index = Array.from(container.querySelectorAll('.segment-btn')).indexOf(e.target);
        bg.style.transform = `translateX(${index * 100}%)`;

        State.updateFilter(type, value);
        
        if (type === 'procedure') {
            if (value === 'all') {
                this.dom.filterMaster.classList.add('filter-master-disabled');
            } else {
                this.dom.filterMaster.classList.remove('filter-master-disabled');
            }
        }
        
        this.rerenderSlots();
    },

    handleNumpad(key, mode = 'booking') {
        const input = mode === 'edit' ? this.dom.editPhoneDisplay : this.dom.phoneDisplay;
        let val = input.value;
        
        if (key === 'clear') {
            val = '';
        } else if (key === 'back') {
            val = val.slice(0, -1);
        } else if (val.length < 4) {
            val += key;
        }
        
        input.value = val;
    },

    renderCurrentDate() {
        this.dom.currentDate.textContent = DateUtils.formatDateTitle(new Date());
    },

    renderInitialDays() {
        this.dom.container.innerHTML = '';
        const days = CoreLogic.getNextBatchOfDays(0, APP_CONFIG.schedule.daysToGenerate);
        State.loadedDaysCount = days.length;
        this.renderDays(days);
    },

    renderDays(days) {
        days.forEach(day => {
            const section = this.createDaySection(day);
            if (section) this.dom.container.appendChild(section);
        });
    },

    createDaySection(dayData) {
        const filteredSlots = CoreLogic.filterSlots(dayData.slots);
        const isAllFilter = State.filters.procedure === 'all';
        
        if (filteredSlots.length === 0 && !isAllFilter) return null;

        const section = DOMUtils.createElement('div', ['day-section']);
        
        const header = DOMUtils.createElement('div', ['day-header']);
        const title = DOMUtils.createElement('h3', ['day-title'], DateUtils.formatDateTitle(dayData.dateObj));
        const subtitle = DOMUtils.createElement('span', ['day-subtitle'], DateUtils.formatDayOfWeek(dayData.dateObj));
        
        if (DateUtils.isToday(dayData.dateObj)) {
            title.innerHTML += ' <span style="color:var(--color-mint); font-size: 0.8em;">(Сегодня)</span>';
        }

        header.append(title, subtitle);
        
        const grid = DOMUtils.createElement('div', ['slots-grid']);
        
        filteredSlots.forEach(slot => {
            const card = this.createSlotCard(slot);
            grid.appendChild(card);
        });

        if (isAllFilter) {
            const customCard = this.createCustomSlotCard(dayData.dateObj);
            grid.appendChild(customCard);
        }

        section.append(header, grid);
        return section;
    },

    createCustomSlotCard(dateObj) {
        const card = DOMUtils.createElement('div', ['slot-card', 'custom']);
        const plus = DOMUtils.createElement('div', ['slot-time'], '+');
        card.appendChild(plus);
        
        card.addEventListener('click', () => this.openCustomTimeModal(dateObj));
        return card;
    },

    openCustomTimeModal(dateObj) {
        const timeInput = prompt('Введите время (например, 15:30):');
        if (!timeInput) return;
        
        const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
        if (!timeRegex.test(timeInput)) {
            this.showToast('Неверный формат времени');
            return;
        }
        
        const workingMaster = CoreLogic.getWorkingMaster(dateObj);
        const customSlot = {
            masterId: workingMaster,
            date: DateUtils.toISODate(dateObj),
            timeStart: timeInput,
            timeEnd: timeInput,
            status: 'free'
        };
        
        this.openBookingModal(customSlot);
    },

    createSlotCard(slot) {
        const classes = ['slot-card', slot.status];
        const card = DOMUtils.createElement('div', classes);
        
        const time = DOMUtils.createElement('div', ['slot-time'], slot.timeStart);
        card.appendChild(time);

        if (slot.status === 'free') {
            card.addEventListener('click', () => this.openBookingModal(slot));
        } else if (slot.status === 'busy') {
            const info = DOMUtils.createElement('div', ['slot-info']);
            const procTitle = APP_CONFIG.procedures[slot.bookingData.procedure_id]?.title || 'Процедура';
            info.innerHTML = `${procTitle}<br>•••• ${slot.bookingData.client_phone}`;
            card.appendChild(info);
            card.addEventListener('click', () => this.openDetailsModal(slot.bookingData));
        } else if (slot.status === 'break') {
            const info = DOMUtils.createElement('div', ['slot-info'], 'Перерыв');
            card.appendChild(info);
        }
        
        const workingMaster = CoreLogic.getWorkingMaster(new Date(slot.date));
        const badge = DOMUtils.createElement('div', ['slot-badge', `badge-${workingMaster}`]);
        card.appendChild(badge);
        card.appendChild(badge);

        return card;
    },

    rerenderSlots() {
        this.dom.container.innerHTML = '';
        const days = CoreLogic.getNextBatchOfDays(0, State.loadedDaysCount);
        this.renderDays(days);
    },

    handleScroll() {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        
        if (scrollTop > 300) {
            this.dom.scrollTopBtn.style.display = 'flex';
        } else {
            this.dom.scrollTopBtn.style.display = 'none';
        }

        if (scrollTop + clientHeight >= scrollHeight - 200) {
            this.loadMoreDays();
        }
    },

    loadMoreDays() {
        const nextBatch = CoreLogic.getNextBatchOfDays(State.loadedDaysCount, APP_CONFIG.schedule.daysToLoadMore);
        if (nextBatch.length > 0) {
            State.loadedDaysCount += nextBatch.length;
            this.renderDays(nextBatch);
        }
    },

    openBookingModal(slot) {
        State.activeBooking = slot;
        State.resetModalSelection();
        
        this.dom.bookingSummary.innerHTML = `
            <p style="font-size: 18px; color: white;">${DateUtils.formatDateTitle(new Date(slot.date))} в ${slot.timeStart}</p>
        `;
        
        this.dom.choiceProcedure.querySelectorAll('.choice-btn').forEach(btn => btn.classList.remove('active'));
        this.dom.choiceMaster.querySelectorAll('.choice-btn').forEach(btn => btn.classList.remove('active'));
        
        this.dom.phoneDisplay.value = '';
        this.dom.bookingComment.value = '';
        
        this.dom.modalBooking.classList.add('open');
    },

    openDetailsModal(bookingData) {
        State.editingBooking = bookingData;
        
        const masterName = APP_CONFIG.masters[bookingData.master_id].name;
        const procTitle = APP_CONFIG.procedures[bookingData.procedure_id].title;
        
        this.dom.detailsContent.innerHTML = `
            <div style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">${bookingData.time_start.slice(0,5)}</div>
            <div style="color: var(--color-text-muted); margin-bottom: 16px;">${DateUtils.formatDateTitle(new Date(bookingData.date))}</div>
            <div style="background: #333; padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                <p style="margin-bottom: 4px;">Клиент: <strong>•••• ${bookingData.client_phone}</strong></p>
                <p style="margin-bottom: 4px;">Мастер: <strong>${masterName}</strong></p>
                <p>Процедура: <strong>${procTitle}</strong></p>
                ${bookingData.comment ? `<p style="margin-top: 8px; color: #aaa; font-style: italic;">"${bookingData.comment}"</p>` : ''}
            </div>
        `;
        
        this.dom.modalDetails.classList.add('open');
    },

    closeModal(modal) {
        modal.classList.remove('open');
        State.activeBooking = null;
    },

    handleBookingSubmit(e) {
        e.preventDefault();
        
        const { procedure, master } = State.modalSelection;
        const phone = this.dom.phoneDisplay.value;
        
        if (!procedure) {
            this.showToast('Выберите процедуру');
            return;
        }
        if (!master) {
            this.showToast('Выберите мастера');
            return;
        }
        if (phone.length !== 4) {
            this.showToast('Введите 4 цифры номера');
            return;
        }

        const slot = State.activeBooking;
        
        const newBooking = {
            id: crypto.randomUUID(),
            master_id: master,
            procedure_id: procedure,
            client_phone: phone,
            date: slot.date,
            time_start: slot.timeStart + ':00',
            time_end: slot.timeEnd + ':00',
            comment: this.dom.bookingComment.value,
            created_at: new Date().toISOString()
        };

        State.addBooking(newBooking);
        this.rerenderSlots();
        this.closeModal(this.dom.modalBooking);
        
        this.showToast('Запись успешно создана!');
    },
    
    showToast(message) {
        const toast = DOMUtils.createElement('div', ['toast-msg'], message);
        toast.style.background = 'var(--color-mint)';
        toast.style.color = 'black';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '50px';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        toast.style.fontWeight = '600';
        toast.style.textAlign = 'center';
        toast.style.marginBottom = '10px';
        toast.style.animation = 'fadeInDay 0.3s ease';
        
        const container = document.getElementById('toast-container');
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    editSelection: {
        procedure: null,
        master: null
    },

    openEditModal() {
        const booking = State.editingBooking;
        if (!booking) return;
        
        this.closeModal(this.dom.modalDetails);
        
        this.editSelection = {
            procedure: booking.procedure_id,
            master: booking.master_id
        };
        
        this.dom.editSummary.innerHTML = `
            <p style="font-size: 18px; color: white;">${DateUtils.formatDateTitle(new Date(booking.date))} в ${booking.time_start.slice(0,5)}</p>
        `;
        
        this.dom.editChoiceProcedure.querySelectorAll('.choice-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === booking.procedure_id);
        });
        this.dom.editChoiceMaster.querySelectorAll('.choice-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === booking.master_id);
        });
        
        this.dom.editPhoneDisplay.value = booking.client_phone;
        
        this.dom.modalEdit.classList.add('open');
    },

    handleEditChoiceClick(e, type) {
        if (!e.target.classList.contains('choice-btn')) return;
        
        const container = type === 'procedure' ? this.dom.editChoiceProcedure : this.dom.editChoiceMaster;
        container.querySelectorAll('.choice-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        this.editSelection[type] = e.target.dataset.value;
    },

    handleEditSubmit(e) {
        e.preventDefault();
        
        const { procedure, master } = this.editSelection;
        const phone = this.dom.editPhoneDisplay.value;
        
        if (!procedure) {
            this.showToast('Выберите процедуру');
            return;
        }
        if (!master) {
            this.showToast('Выберите мастера');
            return;
        }
        if (phone.length !== 4) {
            this.showToast('Введите 4 цифры номера');
            return;
        }

        const booking = State.editingBooking;
        
        State.updateBooking(booking.id, {
            procedure_id: procedure,
            master_id: master,
            client_phone: phone
        });
        
        this.rerenderSlots();
        this.closeModal(this.dom.modalEdit);
        State.editingBooking = null;
        
        this.showToast('Запись обновлена!');
    },

    handleDeleteBooking() {
        const booking = State.editingBooking;
        if (!booking) return;
        
        State.removeBooking(booking.id);
        this.rerenderSlots();
        this.closeModal(this.dom.modalDetails);
        State.editingBooking = null;
        this.showToast('Запись отменена');
    },

    handleCallClient() {
        const booking = State.editingBooking;
        if (!booking) return;
        
        const lastFour = booking.client_phone;
        const clients = State.clients || {};
        
        let fullNumber = null;
        for (const [phone, data] of Object.entries(clients)) {
            if (phone.endsWith(lastFour)) {
                fullNumber = phone;
                break;
            }
        }
        
        if (fullNumber) {
            window.location.href = `tel:${fullNumber}`;
        } else {
            this.showToast(`Номер с окончанием ${lastFour} не найден в базе`);
        }
    }
};
