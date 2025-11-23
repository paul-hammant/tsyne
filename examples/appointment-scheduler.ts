// Appointment Scheduler - demonstrates the Calendar widget
// A simple date selection UI for scheduling appointments

import { app, DateSelectedEvent } from '../src';

interface Appointment {
  id: number;
  title: string;
  date: Date;
}

app({ title: 'Appointment Scheduler' }, (a) => {
  a.window({ title: 'Appointment Scheduler', width: 500, height: 600 }, (win) => {
    let selectedDate: Date | null = null;
    let appointments: Appointment[] = [];
    let nextId = 1;

    let dateLabel: any;
    let titleEntry: any;
    let appointmentsList: any;

    const formatDate = (date: Date): string => {
      const months = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };

    const updateAppointmentsList = async () => {
      const items = appointments.map(apt =>
        `${formatDate(apt.date)}: ${apt.title}`
      );
      await appointmentsList.updateItems(items.length > 0 ? items : ['No appointments scheduled']);
    };

    win.setContent(() => {
      a.vbox(() => {
        a.label('Appointment Scheduler', undefined, 'center', undefined, { bold: true });
        a.separator();

        a.hbox(() => {
          // Left side: Calendar
          a.vbox(() => {
            a.label('Select a Date:', undefined, 'leading', undefined, { bold: true });
            a.calendar(new Date(), async (event: DateSelectedEvent) => {
              selectedDate = new Date(event.year, event.month - 1, event.day);
              await dateLabel.setText(`Selected: ${formatDate(selectedDate)}`);
            });
            dateLabel = a.label('Selected: (none)');
          });

          a.separator();

          // Right side: Appointment details
          a.vbox(() => {
            a.label('New Appointment:', undefined, 'leading', undefined, { bold: true });
            titleEntry = a.entry('Enter appointment title...', async (text: string) => {
              if (selectedDate && text.trim()) {
                appointments.push({
                  id: nextId++,
                  title: text.trim(),
                  date: new Date(selectedDate)
                });
                // Sort by date
                appointments.sort((a, b) => a.date.getTime() - b.date.getTime());
                await titleEntry.setText('');
                await updateAppointmentsList();
              }
            });

            a.button('Add Appointment', async () => {
              const text = await titleEntry.getText();
              if (selectedDate && text.trim()) {
                appointments.push({
                  id: nextId++,
                  title: text.trim(),
                  date: new Date(selectedDate)
                });
                // Sort by date
                appointments.sort((a, b) => a.date.getTime() - b.date.getTime());
                await titleEntry.setText('');
                await updateAppointmentsList();
              }
            });
          });
        });

        a.separator();

        // Bottom: Appointments list
        a.label('Scheduled Appointments:', undefined, 'leading', undefined, { bold: true });
        appointmentsList = a.list(['No appointments scheduled'], async (index: number, item: string) => {
          // Click on an appointment could show details or allow deletion
          if (appointments.length > 0 && index < appointments.length) {
            // Remove the selected appointment
            appointments.splice(index, 1);
            await updateAppointmentsList();
          }
        });

        a.label('(Click an appointment to remove it)', undefined, 'center');

        a.separator();

        a.hbox(() => {
          a.button('Clear All', async () => {
            appointments = [];
            await updateAppointmentsList();
          });
        });
      });
    });
    win.show();
  });
});
