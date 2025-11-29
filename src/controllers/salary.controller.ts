import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';

const CONFIG = {
  SALARY_PER_DAY: 500000,
  MINUTE_WAGE: 500000 / 8 / 60,

  MAX_ATTENDANCE_BONUS: 2000000,
  DEDUCT_BONUS_PER_DAY: 200000,

  FINE_LATE: 0,
  FINE_EARLY: 0,
  FINE_ABSENT: 0,
  INSURANCE_RATE: 0.105,

  MORNING: { start: '07:45', deadline: '08:10', end: '09:00' },
  AFTERNOON: { start: '13:15', deadline: '13:40', end: '14:30' },
};

const getMinutes = (dateStr: Date) => dateStr.getHours() * 60 + dateStr.getMinutes();
const parseTime = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};
const formatDateString = (year: number, month: number, day: number) => {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};
const getVnTimeMinutes = (date: Date) => {
  const vnTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  return vnTime.getHours() * 60 + vnTime.getMinutes();
};
const getVietnamDateString = (date: Date) => {
  const vnTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const y = vnTime.getFullYear();
  const m = String(vnTime.getMonth() + 1).padStart(2, '0');
  const d = String(vnTime.getDate()).padStart(2, '0');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

export function createSalaryController(db: Pool) {
  return {
    getSalaryStats: async (req: Request, res: Response) => {
      try {
        const { month, year } = req.query;
        const m = Number(month);
        const y = Number(year);

        const startStr = formatDateString(y, m, 5);
        let nextM = m + 1;
        let nextY = y;
        if (nextM > 12) {
          nextM = 1;
          nextY = y + 1;
        }
        const endStr = formatDateString(nextY, nextM, 5);

        const [users]: any = await db.query(
          "SELECT zalo_id, name, avatar_url, role, created_at FROM users WHERE role IS NOT NULL AND role != 'user'"
        );
        const [attendance]: any = await db.query(
          'SELECT * FROM attendance_records WHERE date >= ? AND date < ?',
          [startStr, endStr]
        );

        const [leaves]: any = await db.query(
          "SELECT * FROM leave_requests WHERE status = 'approved' AND start_date <= ? AND end_date >= ?",
          [endStr, startStr]
        );

        const [adjustments]: any = await db.query(
          'SELECT * FROM salary_adjustments WHERE month = ? AND year = ?',
          [m, y]
        );

        const todayString = getVietnamDateString(new Date());

        const salaryList = users.map((user: any) => {
          let totalWorkPoints = 0.0;
          let lateCount = 0;
          let earlyCount = 0;
          let absentSessions = 0;
          let totalLateMinutes = 0;
          let totalEarlyMinutes = 0;
          let otherBonus = 0;
          let otherFine = 0;

          const startDate = new Date(startStr);
          const endDate = new Date(endStr);

          for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
            const currentDateString = d.toISOString().split('T')[0];

            if (currentDateString >= todayString) break;

            if (d.getDay() === 0) continue;

            const record = attendance.find((r: any) => {
              const rDate = new Date(r.date);
              const recDateStr = new Date(rDate.getTime() - rDate.getTimezoneOffset() * 60000)
                .toISOString()
                .split('T')[0];
              return r.zalo_id === user.zalo_id && recDateStr === currentDateString;
            });

            if (record) {
              if (record.check_in_morning && record.check_out_morning) {
                totalWorkPoints += 0.5;
                const inTime = getVnTimeMinutes(new Date(record.check_in_morning));
                if (inTime > parseTime(CONFIG.MORNING.deadline)) {
                  lateCount++;
                  totalLateMinutes += inTime - parseTime(CONFIG.MORNING.deadline);
                }
                const outTime = getVnTimeMinutes(new Date(record.check_out_morning));
                if (outTime < parseTime(CONFIG.MORNING.end)) {
                  earlyCount++;
                  totalEarlyMinutes += parseTime(CONFIG.MORNING.end) - outTime;
                }
              } else {
                absentSessions += 1;
              }

              if (record.check_in_afternoon && record.check_out_afternoon) {
                totalWorkPoints += 0.5;
                const inTime = getVnTimeMinutes(new Date(record.check_in_afternoon));
                if (inTime > parseTime(CONFIG.AFTERNOON.deadline)) {
                  lateCount++;
                  totalLateMinutes += inTime - parseTime(CONFIG.AFTERNOON.deadline);
                }
                const outTime = getVnTimeMinutes(new Date(record.check_out_afternoon));
                if (outTime < parseTime(CONFIG.AFTERNOON.end)) {
                  earlyCount++;
                  totalEarlyMinutes += parseTime(CONFIG.AFTERNOON.end) - outTime;
                }
              } else {
                absentSessions += 1;
              }
            } else {
              const hasApprovedLeave = leaves.find((l: any) => {
                const s = new Date(l.start_date);
                const e = new Date(l.end_date);
                const current = new Date(d);

                s.setHours(0, 0, 0, 0);
                e.setHours(0, 0, 0, 0);
                current.setHours(0, 0, 0, 0);

                return (
                  l.zalo_id === user.zalo_id &&
                  current.getTime() >= s.getTime() &&
                  current.getTime() <= e.getTime()
                );
              });

              if (hasApprovedLeave) {
              } else {
                absentSessions += 2;
              }
            }
          }

          const baseSalary = totalWorkPoints * CONFIG.SALARY_PER_DAY;

          const fineForMinutes = Math.round(
            (totalLateMinutes + totalEarlyMinutes) * CONFIG.MINUTE_WAGE
          );

          const absentDays = absentSessions / 2;
          const fineForAbsence = absentDays * CONFIG.DEDUCT_BONUS_PER_DAY;

          const totalPenaltyRaw = fineForMinutes + fineForAbsence;

          let bonus = 0;
          let fineAbsentToShow = 0;

          if (users.length > 0) {
            bonus = CONFIG.MAX_ATTENDANCE_BONUS;
            fineAbsentToShow = Math.min(totalPenaltyRaw, CONFIG.MAX_ATTENDANCE_BONUS);
          }

          const userAdjustments = adjustments.filter((a: any) => a.zalo_id === user.zalo_id);
          otherBonus = userAdjustments
            .filter((a: any) => a.amount > 0)
            .reduce((sum: number, a: any) => sum + a.amount, 0);
          otherFine = userAdjustments
            .filter((a: any) => a.amount < 0)
            .reduce((sum: number, a: any) => sum + Math.abs(a.amount), 0);

          const insurance = baseSalary * CONFIG.INSURANCE_RATE;
          const totalIncome = baseSalary + bonus + otherBonus;

          const totalDeduction = fineAbsentToShow + insurance + otherFine;

          const finalSalary = totalIncome - totalDeduction;

          return {
            user,
            stats: {
              actualWorkDays: totalWorkPoints,
              lateCount,
              earlyCount,
              absentDays,
              totalLateMinutes,
              totalEarlyMinutes,
            },
            financials: {
              base: baseSalary,
              bonus: bonus,
              fineLate: Math.round(totalLateMinutes * CONFIG.MINUTE_WAGE),
              fineEarly: Math.round(totalEarlyMinutes * CONFIG.MINUTE_WAGE),
              fineAbsentAmount: fineForAbsence,
              fineAbsent: fineAbsentToShow,
              insurance,
              otherBonus,
              otherFine,
              totalIncome,
              totalDeduction,
              finalSalary: finalSalary > 0 ? finalSalary : 0,
            },
            adjustments: userAdjustments,
          };
        });

        res.json({ success: true, data: salaryList });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    },

    addAdjustment: async (req: Request, res: Response) => {
      try {
        const { zalo_id, month, year, amount, note } = req.body;
        if (!zalo_id || !amount) return res.status(400).json({ error: 'Thiếu thông tin' });
        await db.query(
          'INSERT INTO salary_adjustments (zalo_id, month, year, amount, note) VALUES (?, ?, ?, ?, ?)',
          [zalo_id, month, year, amount, note || '']
        );
        res.json({ success: true });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    },
    deleteAdjustment: async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ error: 'Thiếu ID' });

        await db.query('DELETE FROM salary_adjustments WHERE id = ?', [id]);

        res.json({ success: true });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    },
  };
}
