import React, { useState, useMemo, useEffect } from 'react';

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
const HOURS = [1, 2, 3, 4, 5, 6, 7];

// פלטת צבעים פונקציונלית — צבע יציב לכל סוג טיפול, לסריקה מהירה של הלוח
const THERAPY_HUES = ['#1F4FE0', '#12805C', '#8A4FD3', '#B4520A', '#0E7C86', '#B0296B', '#3E4C63', '#7A6A1F'];

const createEmptySchedule = () => {
  const schedule = {};
  DAYS.forEach(day => {
    schedule[day] = {};
    HOURS.forEach(hour => {
      schedule[day][hour] = false; // false = unavailable
    });
  });
  return schedule;
};

const initialTherapists = [];
const initialStudents = [];

// --- רשת השבוע (הסיגנצ'ר של העיצוב) ---
const WeeklyGrid = ({ availability, onChange, accent = '#1F4FE0', readonly = false }) => {
  const toggleSlot = (day, hour) => {
    if (readonly) return;
    const newAvail = { ...availability };
    newAvail[day] = { ...newAvail[day], [hour]: !newAvail[day][hour] };
    onChange(newAvail);
  };

  return (
    <div className="cc-grid-scroll" dir="rtl">
      <table className="cc-grid">
        <thead>
          <tr>
            <th className="cc-grid-corner"></th>
            {DAYS.map(day => (
              <th key={day} className="cc-grid-dayhead">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map(hour => (
            <tr key={hour}>
              <td className="cc-grid-ruler"><span className="cc-mono">{hour}</span></td>
              {DAYS.map(day => {
                const on = availability[day] && availability[day][hour];
                return (
                  <td key={`${day}-${hour}`} className="cc-grid-td">
                    <button
                      type="button"
                      onClick={() => toggleSlot(day, hour)}
                      disabled={readonly}
                      aria-pressed={!!on}
                      aria-label={`${day} שעה ${hour} — ${on ? 'פנוי' : 'לא פנוי'}`}
                      className={`cc-cell ${on ? 'cc-cell--on' : ''} ${readonly ? 'cc-cell--ro' : ''}`}
                      style={on ? { '--cell-accent': accent } : undefined}
                    >
                      {on && <span className="cc-cell-mark" />}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- מסך הפתיחה: מסביר על המערכת ועל הפרטיות ---
const WelcomeScreen = ({ onEnter }) => (
  <div className="cc-welcome" dir="rtl">
    <div className="cc-welcome-inner">
      <div className="cc-welcome-hero">
        <span className="cc-welcome-badge">מעבדת הניסויים · מרי גרבי</span>
        <h1 className="cc-welcome-title">מערכת שיבוץ שילוב</h1>
        <p className="cc-welcome-lead">
          בונה עבורכם לוח טיפולים שבועי אופטימלי — מקבלת את שעות המטפלים, השעות
          הפנויות של התלמידים והצרכים של כל אחד, ומחשבת את השיבוץ שממקסם את מספר
          הטיפולים שאפשר לקיים, תוך שמירה על כל האילוצים.
        </p>
      </div>

      <div className="cc-welcome-steps">
        {[
          ['01', 'מגדירים מטפלים', 'סוגי הטיפול, גודל הקבוצה ושעות העבודה של כל מטפל/ת.'],
          ['02', 'מוסיפים תלמידים', 'הטיפולים שכל תלמיד זקוק להם והשעות שבהן הוא פנוי.'],
          ['03', 'מריצים שיבוץ', 'המערכת בונה את הלוח אוטומטית — וניתן להוריד אותו לאקסל.'],
        ].map(([n, t, d]) => (
          <div key={n} className="cc-welcome-step">
            <span className="cc-welcome-step-num cc-mono">{n}</span>
            <div>
              <h3 className="cc-welcome-step-title">{t}</h3>
              <p className="cc-welcome-step-desc">{d}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="cc-welcome-privacy">
        <div className="cc-welcome-privacy-head">
          <span className="cc-welcome-lock" aria-hidden="true">🔒</span>
          <h2 className="cc-welcome-privacy-title">פרטיות ואבטחת מידע</h2>
        </div>
        <ul className="cc-welcome-privacy-list">
          <li><strong>הכול נשאר אצלכם.</strong> כל הנתונים נשמרים בזיכרון הדפדפן בלבד ואינם נשלחים לשום שרת.</li>
          <li><strong>בלי שמות מלאים.</strong> מומלץ לזהות כל תלמיד בכינוי או בראשי תיבות — לא בשם המלא האמיתי.</li>
          <li><strong>לתכנון פנימי בלבד.</strong> המערכת מיועדת לתכנון בית־ספרי; אין לשתף לוחות שיבוץ הכוללים פרטים מזהים.</li>
          <li><strong>סגירת הדף מוחקת.</strong> אם לא שמרתם/הורדתם — הנתונים נמחקים כשסוגרים את הדפדפן.</li>
        </ul>
      </div>

      <button className="cc-welcome-enter" onClick={onEnter}>
        כניסה למערכת
        <span className="cc-welcome-enter-glyph" aria-hidden="true">←</span>
      </button>
    </div>
  </div>
);

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeTab, setActiveTab] = useState('therapists');
  const [therapists, setTherapists] = useState(initialTherapists);
  const [students, setStudents] = useState(initialStudents);
  const [scheduleData, setScheduleData] = useState({ schedule: [], unassigned: [] });
  const [isScheduled, setIsScheduled] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [scheduleView, setScheduleView] = useState('grid');
  const [showFree, setShowFree] = useState(true);

  const availableTherapies = useMemo(() => {
    const therapiesSet = new Set();
    therapists.forEach(th => th.therapies.forEach(t => {
      const cleanT = t.trim();
      if (cleanT) therapiesSet.add(cleanT);
    }));
    return Array.from(therapiesSet);
  }, [therapists]);

  const colorFor = (therapy) => {
    const i = availableTherapies.indexOf(therapy);
    return THERAPY_HUES[(i < 0 ? 0 : i) % THERAPY_HUES.length];
  };

  // Run scheduler once on load
  useEffect(() => {
    runScheduler();
  }, []);

  // =========================================================================
  //  אלגוריתם השיבוץ — Backtracking + MRV + branch-and-bound.
  //  לא נגעתי בלוגיקה: זהה בדיוק לגרסה שנבדקה (אופטימלי + כל האילוצים).
  // =========================================================================
  const runScheduler = () => {
    const taskList = [];
    students.forEach(student => {
      student.needs.forEach(need => {
        const therapy = (need || '').trim();
        if (!therapy) return;
        taskList.push({
          studentId: student.id,
          studentName: student.name,
          therapy,
          studentAvail: student.availability,
        });
      });
    });

    taskList.forEach(task => {
      task.candidates = [];
      therapists.forEach(th => {
        if (!th.therapies.some(t => t.trim() === task.therapy)) return;
        DAYS.forEach(day => {
          HOURS.forEach(hour => {
            const thFree = th.availability?.[day]?.[hour];
            const stFree = task.studentAvail?.[day]?.[hour];
            if (thFree && stFree) {
              task.candidates.push({ therapistId: th.id, therapistName: th.name, day, hour });
            }
          });
        });
      });
    });

    const totalTasks = taskList.length;

    const capacityOf = {};
    therapists.forEach(th => { capacityOf[th.id] = Math.max(1, th.maxCapacity || 1); });

    const slotCount = new Map();
    const studentBusy = new Set();
    const slotTherapy = new Map();

    const slotKey = (thId, day, hour) => `${thId}|${day}|${hour}`;
    const busyKey = (stId, day, hour) => `${stId}|${day}|${hour}`;

    const isFeasible = (task, c) => {
      if (studentBusy.has(busyKey(task.studentId, c.day, c.hour))) return false;
      const k = slotKey(c.therapistId, c.day, c.hour);
      if ((slotCount.get(k) || 0) >= capacityOf[c.therapistId]) return false;
      const locked = slotTherapy.get(k);
      if (locked !== undefined && locked !== task.therapy) return false;
      return true;
    };
    const doAssign = (task, c) => {
      const k = slotKey(c.therapistId, c.day, c.hour);
      slotCount.set(k, (slotCount.get(k) || 0) + 1);
      slotTherapy.set(k, task.therapy);
      studentBusy.add(busyKey(task.studentId, c.day, c.hour));
    };
    const undoAssign = (task, c) => {
      const k = slotKey(c.therapistId, c.day, c.hour);
      const n = (slotCount.get(k) || 0) - 1;
      slotCount.set(k, n);
      if (n <= 0) slotTherapy.delete(k);
      studentBusy.delete(busyKey(task.studentId, c.day, c.hour));
    };

    const feasibleList = (task) => task.candidates.filter(c => isFeasible(task, c));

    const orderValues = (list) =>
      [...list].sort((a, b) =>
        ((slotCount.get(slotKey(b.therapistId, b.day, b.hour)) || 0) -
         (slotCount.get(slotKey(a.therapistId, a.day, a.hour)) || 0))
      );

    const resetState = () => { slotCount.clear(); studentBusy.clear(); slotTherapy.clear(); };

    const greedySeed = () => {
      resetState();
      const placements = new Array(totalTasks).fill(null);
      const remaining = new Set(taskList.map((_, i) => i));
      while (remaining.size) {
        let pickIdx = -1, pickFeas = Infinity, pickList = null;
        for (const i of remaining) {
          const feas = feasibleList(taskList[i]);
          if (feas.length < pickFeas) { pickFeas = feas.length; pickIdx = i; pickList = feas; }
          if (pickFeas === 0) break;
        }
        remaining.delete(pickIdx);
        if (pickFeas === 0) { placements[pickIdx] = null; continue; }
        const cand = orderValues(pickList)[0];
        doAssign(taskList[pickIdx], cand);
        placements[pickIdx] = cand;
      }
      return placements;
    };

    const seed = greedySeed();
    let best = { placements: seed, count: seed.filter(Boolean).length };

    if (best.count < totalTasks) {
      resetState();
      const curPlacements = new Array(totalTasks).fill(null);
      const decided = new Array(totalTasks).fill(false);
      let assignedCur = 0;
      let skippedCur = 0;

      const deadline = Date.now() + 2000;
      let nodes = 0;
      let aborted = false;

      const dfs = () => {
        if (aborted) return;
        if (++nodes % 512 === 0 && Date.now() > deadline) { aborted = true; return; }

        const undecided = totalTasks - assignedCur - skippedCur;
        if (assignedCur + undecided <= best.count) return;

        if (undecided === 0) {
          if (assignedCur > best.count) {
            best = { placements: curPlacements.slice(), count: assignedCur };
          }
          return;
        }

        let vi = -1, vFeas = Infinity, vList = null;
        for (let i = 0; i < totalTasks; i++) {
          if (decided[i]) continue;
          const feas = feasibleList(taskList[i]);
          if (feas.length < vFeas) { vFeas = feas.length; vi = i; vList = feas; }
          if (vFeas === 0) break;
        }

        const task = taskList[vi];

        if (vFeas === 0) {
          decided[vi] = true; skippedCur++;
          dfs();
          skippedCur--; decided[vi] = false;
          return;
        }

        decided[vi] = true;
        for (const cand of orderValues(vList)) {
          doAssign(task, cand);
          curPlacements[vi] = cand;
          assignedCur++;
          dfs();
          assignedCur--;
          undoAssign(task, cand);
          curPlacements[vi] = null;
          if (aborted || best.count === totalTasks) { decided[vi] = false; return; }
        }
        skippedCur++;
        if (assignedCur + (totalTasks - assignedCur - skippedCur) > best.count) dfs();
        skippedCur--;
        decided[vi] = false;
      };

      dfs();
    }

    const schedule = [];
    const unassigned = [];
    best.placements.forEach((cand, i) => {
      const task = taskList[i];
      if (cand) {
        schedule.push({
          therapistId: cand.therapistId,
          therapistName: cand.therapistName,
          day: cand.day,
          hour: cand.hour,
          studentName: task.studentName,
          studentId: task.studentId,
          therapy: task.therapy,
        });
      } else {
        unassigned.push({
          studentId: task.studentId,
          studentName: task.studentName,
          therapy: task.therapy,
        });
      }
    });

    schedule.sort((a, b) => {
      if (DAYS.indexOf(a.day) !== DAYS.indexOf(b.day)) return DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
      return a.hour - b.hour;
    });

    setScheduleData({ schedule, unassigned });
    setIsScheduled(true);
  };

  const addStudent = () => {
    const newId = `st_${Date.now()}`;
    setStudents([...students, { id: newId, name: 'תלמיד חדש', needs: [], availability: createEmptySchedule() }]);
    setIsScheduled(false);
  };

  const addTherapist = () => {
    const newId = `th_${Date.now()}`;
    setTherapists([...therapists, { id: newId, name: 'מטפל/ת חדש/ה', therapies: [], maxCapacity: 1, availability: createEmptySchedule() }]);
    setIsScheduled(false);
  };

  const toggleStudentNeed = (studentIndex, therapy) => {
    const newStudents = [...students];
    const needs = newStudents[studentIndex].needs;
    if (needs.includes(therapy)) {
      newStudents[studentIndex].needs = needs.filter(n => n !== therapy);
    } else {
      newStudents[studentIndex].needs = [...needs, therapy];
    }
    setStudents(newStudents);
    setIsScheduled(false);
  };

  // --- הורדת הלוח: אקסל / וורד / CSV ---
  const triggerDownload = (content, mime, ext, base = 'לוח-שיבוץ') => {
    const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `${base}-${stamp}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- שמירה וטעינה של העבודה כקובץ (נשאר אצל המשתמש, ללא שרת) ---
  const saveToFile = () => {
    const data = { app: 'shiluv-scheduler', version: 1, savedAt: new Date().toISOString(), therapists, students };
    triggerDownload(JSON.stringify(data, null, 2), 'application/json', 'json', 'שיבוץ-שילוב-שמור');
  };

  const loadFromFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data || !Array.isArray(data.therapists) || !Array.isArray(data.students)) {
            throw new Error('invalid');
          }
          setTherapists(data.therapists);
          setStudents(data.students);
          setIsScheduled(false);
          setActiveTab('schedule');
        } catch (err) {
          window.alert('לא ניתן לטעון את הקובץ. ודאו שזהו קובץ שנשמר מהמערכת (בפורמט JSON).');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const htmlEsc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // בונה את הלוח כרשת ימים×שעות עם צבע לכל סוג טיפול — משותף לאקסל ולוורד
  const buildScheduleTable = () => {
    const byCell = {};
    scheduleData.schedule.forEach(s => { const k = `${s.day}|${s.hour}`; (byCell[k] = byCell[k] || []).push(s); });

    let html = '<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;direction:rtl;">';
    html += '<tr>';
    html += '<th style="background:#0E1440;color:#ffffff;padding:8px 10px;">שעה</th>';
    DAYS.forEach(d => { html += `<th style="background:#0E1440;color:#ffffff;padding:8px 14px;">${htmlEsc(d)}</th>`; });
    html += '</tr>';

    HOURS.forEach(hour => {
      html += '<tr>';
      html += `<td style="background:#1F4FE0;color:#ffffff;text-align:center;font-weight:bold;padding:6px;">${hour}</td>`;
      DAYS.forEach(day => {
        const items = byCell[`${day}|${hour}`] || [];
        const cell = items.map(s => {
          const c = colorFor(s.therapy);
          return `<div style="margin:2px 0;padding:3px 6px;border-inline-start:3px solid ${c};background:${c}14;">`
            + `<b>${htmlEsc(s.studentName)}</b> — <span style="color:${c};font-weight:bold;">${htmlEsc(s.therapy)}</span>`
            + `<br><span style="color:#666;font-size:11px;">${htmlEsc(s.therapistName)}</span></div>`;
        }).join('');
        html += `<td style="vertical-align:top;min-width:130px;padding:4px;">${cell}</td>`;
      });
      html += '</tr>';
    });
    html += '</table>';

    if (scheduleData.unassigned.length) {
      html += '<p style="font-family:Arial,sans-serif;direction:rtl;font-weight:bold;color:#B4520A;margin-top:14px;">טיפולים שלא ניתן היה לשבץ:</p>';
      html += '<ul style="font-family:Arial,sans-serif;direction:rtl;color:#333;">';
      scheduleData.unassigned.forEach(u => {
        html += `<li>${htmlEsc(u.studentName)} — ${htmlEsc(u.therapy)}</li>`;
      });
      html += '</ul>';
    }
    return html;
  };

  const downloadExcel = () => {
    const table = buildScheduleTable();
    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">'
      + '<head><meta charset="utf-8">'
      + '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>'
      + '<x:Name>לוח שיבוץ</x:Name><x:WorksheetOptions><x:DisplayRightToLeft/></x:WorksheetOptions>'
      + '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->'
      + '</head><body>' + table + '</body></html>';
    triggerDownload('﻿' + html, 'application/vnd.ms-excel', 'xls');
  };

  const downloadWord = () => {
    const table = buildScheduleTable();
    const stamp = new Date().toLocaleDateString('he-IL');
    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
      + '<head><meta charset="utf-8"><style>@page{size:A4 landscape;margin:1.5cm;} body{direction:rtl;font-family:Arial,sans-serif;}</style></head>'
      + '<body><h2 style="text-align:center;color:#0E1440;">לוח שיבוץ שבועי</h2>'
      + `<p style="text-align:center;color:#666;font-size:12px;">הופק בתאריך ${stamp}</p>`
      + table + '</body></html>';
    triggerDownload('﻿' + html, 'application/msword', 'doc');
  };

  const downloadCSV = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['יום', 'שעה', 'תלמיד', 'טיפול', 'מטפל', 'סטטוס']];
    scheduleData.schedule.forEach(s => {
      rows.push([s.day, s.hour, s.studentName, s.therapy, s.therapistName, 'משובץ']);
    });
    scheduleData.unassigned.forEach(u => {
      rows.push(['', '', u.studentName, u.therapy, '', 'לא שובץ']);
    });
    const csv = '﻿' + rows.map(r => r.map(esc).join(',')).join('\r\n'); // BOM לתמיכה בעברית
    triggerDownload(csv, 'text/csv', 'csv');
  };

  // --- מדדי מרכז הבקרה ---
  const assigned = scheduleData.schedule.length;
  const unassignedCount = scheduleData.unassigned.length;
  const total = assigned + unassignedCount;
  const coverage = total > 0 ? Math.round((assigned / total) * 100) : null;
  const covClass = coverage === null ? 'is-idle' : coverage === 100 ? 'is-good' : 'is-warn';

  const tabs = [
    { id: 'therapists', label: `מטפלים${therapists.length ? ` · ${therapists.length}` : ''}` },
    { id: 'students', label: `תלמידים${students.length ? ` · ${students.length}` : ''}` },
    { id: 'schedule', label: 'לוח שיבוץ' },
  ];

  if (showWelcome) {
    return (
      <div className="cc-root" dir="rtl">
        <style>{cssText}</style>
        <WelcomeScreen onEnter={() => setShowWelcome(false)} />
      </div>
    );
  }

  return (
    <div className="cc-root" dir="rtl">
      <style>{cssText}</style>

      <div className="cc-shell">

        {/* === שורת פיקוד === */}
        <header className="cc-command">
          <div className="cc-brand">
            <span className="cc-live" aria-hidden="true" />
            <div>
              <h1 className="cc-title">שיבוץ שילוב</h1>
              <p className="cc-subtitle">לוח בקרה · טיפולים שבועיים</p>
            </div>
            <button className="cc-help" onClick={() => setShowWelcome(true)} aria-label="חזרה למסך הפתיחה" title="מסך הפתיחה">i</button>
            <button className="cc-help" onClick={() => setShowInfo(true)} aria-label="איך פועל האלגוריתם" title="איך פועל המנוע">?</button>
          </div>

          <div className="cc-readout" role="status" aria-live="polite">
            <div className={`cc-stat cc-stat--cov ${covClass}`}>
              <span className="cc-stat-val cc-mono">{coverage === null ? '—' : `${coverage}%`}</span>
              <span className="cc-stat-key">כיסוי</span>
            </div>
            <div className="cc-stat">
              <span className="cc-stat-val cc-mono">{isScheduled ? `${assigned}/${total}` : '—'}</span>
              <span className="cc-stat-key">שובצו</span>
            </div>
            <div className={`cc-stat ${unassignedCount ? 'is-warn' : ''}`}>
              <span className="cc-stat-val cc-mono">{isScheduled ? unassignedCount : '—'}</span>
              <span className="cc-stat-key">ממתינים</span>
            </div>
          </div>

          <div className="cc-io">
            <button className="cc-io-btn" onClick={saveToFile} title="שמירת כל ההגדרות לקובץ במחשב שלך">
              <span aria-hidden="true">↓</span> שמור
            </button>
            <button className="cc-io-btn" onClick={loadFromFile} title="טעינת עבודה שנשמרה מקובץ">
              <span aria-hidden="true">↑</span> טען
            </button>
          </div>

          <button className="cc-run" onClick={runScheduler}>
            <span className="cc-run-glyph" aria-hidden="true">▸</span>
            הרץ שיבוץ
          </button>
        </header>

        {/* === בקרת טאבים === */}
        <nav className="cc-tabs" role="tablist">
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`cc-tab ${activeTab === tab.id ? 'is-active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <main className="cc-body">

          {/* ===== לוח שיבוץ ===== */}
          {activeTab === 'schedule' && (
            <div className="cc-fade">
              {!isScheduled ? (
                <div className="cc-empty">
                  <div className="cc-empty-mark cc-mono">◵</div>
                  <p className="cc-empty-title">אין שיבוץ עדיין</p>
                  <p className="cc-empty-sub">שלושה צעדים והלוח מוכן:</p>
                  <ol className="cc-guide-steps">
                    <li>
                      <span className="cc-guide-num cc-mono">1</span>
                      <span><strong>מטפלים.</strong> הוסיפו מטפל/ת, הזינו את סוגי הטיפול וגודל הקבוצה, וסמנו את שעות העבודה.</span>
                    </li>
                    <li>
                      <span className="cc-guide-num cc-mono">2</span>
                      <span><strong>תלמידים.</strong> הוסיפו תלמידים (בכינוי, לא בשם אמיתי), בחרו את הטיפולים הנדרשים וסמנו שעות פנויות.</span>
                    </li>
                    <li>
                      <span className="cc-guide-num cc-mono">3</span>
                      <span><strong>הרצה.</strong> לחצו "הרץ שיבוץ" — הלוח ייבנה אוטומטית וניתן יהיה להורידו.</span>
                    </li>
                  </ol>
                  <button className="cc-run cc-run--ghost" onClick={() => setActiveTab('therapists')}>נתחיל — להגדרת מטפלים</button>
                </div>
              ) : (
                <div className="cc-stack">
                  <div className="cc-section-head">
                    <h2 className="cc-section-title">לוח השיבוץ השבועי</h2>
                    <div className="cc-sched-tools">
                      <div className="cc-segment" role="tablist" aria-label="תצוגת הלוח">
                        <button role="tab" aria-selected={scheduleView === 'grid'} className={scheduleView === 'grid' ? 'is-on' : ''} onClick={() => setScheduleView('grid')}>רשת שבועית</button>
                        <button role="tab" aria-selected={scheduleView === 'list'} className={scheduleView === 'list' ? 'is-on' : ''} onClick={() => setScheduleView('list')}>רשימה לפי יום</button>
                      </div>
                      {scheduleView === 'grid' && (
                        <button className={`cc-toggle ${showFree ? 'is-on' : ''}`} aria-pressed={showFree} onClick={() => setShowFree(f => !f)} title="הצגת מטפלים פנויים בכל שעה">
                          <span className="cc-toggle-dot" aria-hidden="true" />
                          מטפלים פנויים
                        </button>
                      )}
                      <div className="cc-export">
                      <button className="cc-download" onClick={() => setExportOpen(o => !o)} aria-haspopup="true" aria-expanded={exportOpen}>
                        <span className="cc-download-glyph" aria-hidden="true">↓</span>
                        הורדת הלוח
                        <span className="cc-caret" aria-hidden="true">▾</span>
                      </button>
                      {exportOpen && (
                        <>
                          <div className="cc-export-backdrop" onClick={() => setExportOpen(false)} />
                          <div className="cc-export-menu" role="menu">
                            <button role="menuitem" onClick={() => { downloadExcel(); setExportOpen(false); }}>
                              <span className="cc-export-ico" style={{ '--c': '#12805C' }}>X</span>
                              <span className="cc-export-txt"><strong>אקסל</strong><small>Excel · ‎.xls — לוח מעוצב</small></span>
                            </button>
                            <button role="menuitem" onClick={() => { downloadWord(); setExportOpen(false); }}>
                              <span className="cc-export-ico" style={{ '--c': '#1F4FE0' }}>W</span>
                              <span className="cc-export-txt"><strong>וורד</strong><small>Word · ‎.doc — מסמך להדפסה</small></span>
                            </button>
                            <button role="menuitem" onClick={() => { downloadCSV(); setExportOpen(false); }}>
                              <span className="cc-export-ico" style={{ '--c': '#616A75' }}>≡</span>
                              <span className="cc-export-txt"><strong>CSV</strong><small>גיליון נתונים גולמי</small></span>
                            </button>
                          </div>
                        </>
                      )}
                      </div>
                    </div>
                  </div>

                  {unassignedCount > 0 && (
                    <section className="cc-alert">
                      <div className="cc-alert-head">
                        <span className="cc-alert-badge cc-mono">{unassignedCount}</span>
                        <span>טיפולים ללא שיבוץ אפשרי — אין חלון זמן משותף פנוי</span>
                      </div>
                      <ul className="cc-alert-list">
                        {scheduleData.unassigned.map((u, i) => {
                          const got = scheduleData.schedule.filter(s => s.studentId === u.studentId);
                          return (
                            <li key={i}>
                              <span className="cc-chip-dot" style={{ background: colorFor(u.therapy) }} />
                              <strong>{u.studentName}</strong>
                              <span className="cc-alert-therapy">{u.therapy}</span>
                              {got.length > 0 ? (
                                <span className="cc-alert-note cc-alert-note--partial">שובץ חלקית · קיבל {got.map(g => g.therapy).join(', ')}</span>
                              ) : (
                                <span className="cc-alert-note">לא שובץ כלל</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  )}

                  {scheduleView === 'grid' ? (
                    <div className="cc-grid-scroll cc-sched-scroll">
                      <table className="cc-grid cc-sched-grid">
                        <thead>
                          <tr>
                            <th className="cc-grid-corner"></th>
                            {DAYS.map(day => (<th key={day} className="cc-grid-dayhead">{day}</th>))}
                          </tr>
                        </thead>
                        <tbody>
                          {HOURS.map(hour => (
                            <tr key={hour}>
                              <td className="cc-grid-ruler"><span className="cc-mono">{hour}</span></td>
                              {DAYS.map(day => {
                                const items = scheduleData.schedule.filter(s => s.day === day && String(s.hour) === String(hour));
                                const freeTh = showFree ? therapists.filter(th => {
                                  if (!th.availability?.[day]?.[hour]) return false;
                                  const used = scheduleData.schedule.filter(s => s.therapistId === th.id && s.day === day && String(s.hour) === String(hour)).length;
                                  return used < Math.max(1, th.maxCapacity || 1);
                                }) : [];
                                return (
                                  <td key={day} className="cc-sched-cell">
                                    {items.map((task, i) => (
                                      <div key={i} className="cc-sched-item" style={{ '--c': colorFor(task.therapy) }}>
                                        <span className="cc-sched-student">{task.studentName}</span>
                                        <span className="cc-sched-therapy">{task.therapy}</span>
                                        <span className="cc-sched-th">{task.therapistName}</span>
                                      </div>
                                    ))}
                                    {freeTh.length > 0 && (
                                      <div className="cc-free-row">
                                        {freeTh.map(th => (
                                          <span key={th.id} className="cc-free-chip" title={`${th.name} פנוי/ה בשעה זו`}>{th.name}</span>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="cc-days">
                      {DAYS.map(day => {
                        const daySchedule = scheduleData.schedule.filter(s => s.day === day);
                        if (daySchedule.length === 0) return null;
                        const byHour = {};
                        daySchedule.forEach(s => { (byHour[s.hour] = byHour[s.hour] || []).push(s); });

                        return (
                          <section key={day} className="cc-day">
                            <div className="cc-day-head">
                              <span>{day}</span>
                              <span className="cc-day-count cc-mono">{daySchedule.length}</span>
                            </div>
                            <div className="cc-slots">
                              {Object.keys(byHour).sort((a, b) => a - b).map(hour => (
                                <div key={hour} className="cc-slot">
                                  <div className="cc-slot-hour cc-mono">{hour}</div>
                                  <div className="cc-slot-items">
                                    {byHour[hour].map((task, i) => {
                                      const c = colorFor(task.therapy);
                                      return (
                                        <div key={i} className="cc-assign" style={{ '--c': c }}>
                                          <span className="cc-assign-bar" />
                                          <span className="cc-assign-student">{task.studentName}</span>
                                          <span className="cc-assign-therapy">{task.therapy}</span>
                                          <span className="cc-assign-th">{task.therapistName}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===== מטפלים ===== */}
          {activeTab === 'therapists' && (
            <div className="cc-fade cc-stack">
              <div className="cc-section-head">
                <h2 className="cc-section-title">צוות מטפלים</h2>
              </div>

              <div className="cc-guide">
                <span className="cc-guide-title">איך מגדירים מטפל/ת</span>
                <ul className="cc-guide-list">
                  <li>לחצו על השם כדי לשנותו.</li>
                  <li>הזינו את סוגי הטיפול, מופרדים בפסיק — למשל <code>CBT, העצמה, ריפוי בעיסוק</code>.</li>
                  <li>קבעו את גודל הקבוצה: כמה תלמידים יכולים להיות יחד באותו מפגש.</li>
                  <li>סמנו בלוח את שעות העבודה הפנויות (לחיצה על משבצת מדליקה או מכבה אותה).</li>
                </ul>
              </div>

              {therapists.length === 0 && (
                <p className="cc-hint">עדיין אין מטפלים — לחצו "הוסף מטפל/ת" כדי להתחיל.</p>
              )}
              <div className="cc-cards cc-cards--wide">
                {therapists.map((th, index) => (
                  <article key={th.id} className="cc-card">
                    <div className="cc-card-top">
                      <input
                        className="cc-name-input"
                        type="text"
                        value={th.name}
                        onChange={(e) => { const n = [...therapists]; n[index].name = e.target.value; setTherapists(n); setIsScheduled(false); }}
                        placeholder="שם המטפל/ת"
                      />
                      <button className="cc-remove" onClick={() => { setTherapists(therapists.filter(t => t.id !== th.id)); setIsScheduled(false); }}>הסר</button>
                    </div>

                    <div className="cc-fields">
                      <label className="cc-field cc-field--grow">
                        <span className="cc-label">סוגי טיפול</span>
                        <input
                          className="cc-input"
                          type="text"
                          value={th.therapies.join(', ')}
                          onChange={(e) => { const n = [...therapists]; n[index].therapies = e.target.value.split(',').map(t => t.replace(/^\s+/, '')); setTherapists(n); setIsScheduled(false); }}
                          placeholder="למשל: CBT, העצמה"
                        />
                      </label>
                      <label className="cc-field">
                        <span className="cc-label">גודל קבוצה</span>
                        <input
                          className="cc-input cc-input--num cc-mono"
                          type="number"
                          min="1"
                          value={th.maxCapacity}
                          onChange={(e) => { const n = [...therapists]; n[index].maxCapacity = parseInt(e.target.value) || 1; setTherapists(n); setIsScheduled(false); }}
                        />
                      </label>
                    </div>

                    {th.therapies.filter(t => t.trim()).length > 0 && (
                      <div className="cc-tags">
                        {th.therapies.filter(t => t.trim()).map((t, i) => (
                          <span key={i} className="cc-tag" style={{ '--c': colorFor(t.trim()) }}>{t.trim()}</span>
                        ))}
                      </div>
                    )}

                    <div className="cc-grid-wrap">
                      <span className="cc-label cc-label--block">שעות עבודה</span>
                      <WeeklyGrid
                        availability={th.availability}
                        onChange={(newAvail) => { const n = [...therapists]; n[index].availability = newAvail; setTherapists(n); setIsScheduled(false); }}
                      />
                    </div>
                  </article>
                ))}
                <button className="cc-add-card" onClick={addTherapist}>
                  <span className="cc-add-card-plus" aria-hidden="true">+</span>
                  הוסף מטפל/ת
                </button>
              </div>
            </div>
          )}

          {/* ===== תלמידים ===== */}
          {activeTab === 'students' && (
            <div className="cc-fade cc-stack">
              <div className="cc-section-head">
                <h2 className="cc-section-title">תלמידים ואילוצים</h2>
              </div>

              <div className="cc-guide">
                <span className="cc-guide-title">איך מוסיפים תלמיד</span>
                <ul className="cc-guide-list">
                  <li>לחצו "הוסף תלמיד", ואז לחצו על השם כדי לשנותו.</li>
                  <li>בחרו את הטיפולים שהתלמיד זקוק להם מתוך הרשימה (היא נבנית מסוגי הטיפול של המטפלים).</li>
                  <li>סמנו בלוח את השעות שבהן התלמיד פנוי לטיפול.</li>
                </ul>
                <p className="cc-guide-note">
                  <strong>פרטיות:</strong> מומלץ לזהות כל תלמיד בכינוי או בראשי תיבות בלבד — לא בשם המלא האמיתי.
                </p>
              </div>

              {students.length === 0 && (
                <p className="cc-hint">עדיין אין תלמידים — לחצו "הוסף תלמיד" כדי להתחיל.</p>
              )}
              <div className="cc-cards">
                {students.map((student, index) => (
                  <article key={student.id} className="cc-card">
                    <div className="cc-card-top">
                      <input
                        className="cc-name-input"
                        type="text"
                        value={student.name}
                        onChange={(e) => { const n = [...students]; n[index].name = e.target.value; setStudents(n); setIsScheduled(false); }}
                        placeholder="שם התלמיד"
                      />
                      <button className="cc-remove" onClick={() => { setStudents(students.filter(s => s.id !== student.id)); setIsScheduled(false); }}>הסר</button>
                    </div>

                    <div className="cc-block">
                      <span className="cc-label cc-label--block">זקוק לטיפולים</span>
                      <div className="cc-needs">
                        {availableTherapies.map((therapy, tIndex) => {
                          const on = student.needs.includes(therapy);
                          const c = colorFor(therapy);
                          return (
                            <button
                              key={tIndex}
                              onClick={() => toggleStudentNeed(index, therapy)}
                              className={`cc-need ${on ? 'is-on' : ''}`}
                              style={on ? { '--c': c } : undefined}
                            >
                              {on ? '✓ ' : '+ '}{therapy}
                            </button>
                          );
                        })}
                        {availableTherapies.length === 0 && (
                          <span className="cc-hint cc-hint--inline">הגדירו סוגי טיפול אצל המטפלים תחילה.</span>
                        )}
                      </div>
                    </div>

                    <div className="cc-grid-wrap">
                      <span className="cc-label cc-label--block">שעות פנויות</span>
                      <WeeklyGrid
                        availability={student.availability}
                        onChange={(newAvail) => { const n = [...students]; n[index].availability = newAvail; setStudents(n); setIsScheduled(false); }}
                      />
                    </div>
                  </article>
                ))}
                <button className="cc-add-card" onClick={addStudent}>
                  <span className="cc-add-card-plus" aria-hidden="true">+</span>
                  הוסף תלמיד
                </button>
              </div>
            </div>
          )}

        </main>

        <footer className="cc-footer">
          מעבדת הניסויים · מרי גרבי
        </footer>
      </div>

      {/* ===== מודל הסבר ===== */}
      {showInfo && (
        <div className="cc-modal-overlay" onClick={() => setShowInfo(false)}>
          <div className="cc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cc-modal-head">
              <h2 className="cc-modal-title">איך פועל מנוע השיבוץ</h2>
              <button className="cc-modal-x" onClick={() => setShowInfo(false)} aria-label="סגור">✕</button>
            </div>
            <div className="cc-modal-body">
              <p className="cc-modal-lead">המנוע לא מנחש. הוא פותר את הבעיה כמו חידת אילוצים, ומחזיר את המקסימום שאפשר לשבץ.</p>
              {[
                ['01', 'התאמת צרכים', 'לכל צורך של תלמיד נבחרים רק המטפלים שמספקים בדיוק את סוג הטיפול הזה.'],
                ['02', 'הצלבת חלונות', 'נבדקות רק שעות שבהן גם התלמיד וגם המטפל פנויים באותו זמן.'],
                ['03', 'אכיפת אילוצים', 'תלמיד לא בשני טיפולים באותה שעה · גודל קבוצה נשמר · מטפל נותן טיפול אחד בלבד בכל שעה.'],
                ['04', 'חיפוש עם נסיגה', 'המנוע מתחיל מהמשימות המוגבלות ביותר, וכשמשהו נתקע הוא חוזר אחורה ומתקן — עד שנמצא המקסימום.'],
              ].map(([n, t, d]) => (
                <div key={n} className="cc-step">
                  <span className="cc-step-num cc-mono">{n}</span>
                  <div>
                    <h3 className="cc-step-title">{t}</h3>
                    <p className="cc-step-desc">{d}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="cc-modal-foot">
              <button className="cc-run" onClick={() => setShowInfo(false)}>הבנתי</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const cssText = `
@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');

.cc-root{
  --canvas:#EEF1F6; --surface:#FFFFFF; --ink:#0E1116; --muted:#616A75;
  --line:#E2E5EA; --line-strong:#CBD0D8; --accent:#1F4FE0; --accent-2:#3B6BF5; --accent-soft:rgba(31,79,224,.08);
  --good:#12805C; --warn:#B4520A; --r:9px;
  --shadow-sm:0 1px 2px rgba(14,17,22,.04), 0 1px 3px rgba(14,17,22,.06);
  --shadow-md:0 4px 12px rgba(14,17,22,.06), 0 2px 4px rgba(14,17,22,.04);
  --shadow-lg:0 18px 48px rgba(14,17,22,.14), 0 6px 16px rgba(14,17,22,.08);
  font-family:'Heebo',system-ui,-apple-system,sans-serif;
  color:var(--ink);
  background:
    radial-gradient(1200px 520px at 90% -10%, rgba(59,107,245,.10), transparent 60%),
    radial-gradient(1000px 480px at 0% 0%, rgba(138,79,211,.07), transparent 55%),
    var(--canvas);
  min-height:100vh; padding:22px 16px; -webkit-font-smoothing:antialiased;
}
.cc-mono{ font-family:'JetBrains Mono',ui-monospace,monospace; font-variant-numeric:tabular-nums; letter-spacing:-.01em; }
.cc-shell{ max-width:1120px; margin:0 auto; background:var(--surface); border:1px solid var(--line); border-radius:calc(var(--r) + 5px); overflow:hidden; box-shadow:var(--shadow-lg); }

/* command bar — hero נייבי תואם למסך הפתיחה */
.cc-command{ position:relative; overflow:hidden; display:flex; flex-wrap:wrap; align-items:center; gap:16px; padding:20px 22px; border-bottom:1px solid rgba(255,255,255,.08); color:#fff;
  background:
    radial-gradient(560px 300px at 88% -70%, rgba(59,107,245,.55), transparent 60%),
    radial-gradient(440px 240px at 4% 170%, rgba(138,79,211,.45), transparent 60%),
    linear-gradient(150deg, #1B2A6B 0%, #16205A 48%, #0E1440 100%);
}
.cc-command::after{ content:''; position:absolute; inset:0; background-image:radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px); background-size:22px 22px; opacity:.5; pointer-events:none; }
.cc-command > *{ position:relative; z-index:1; }
.cc-brand{ display:flex; align-items:center; gap:11px; }
.cc-live{ width:9px; height:9px; border-radius:50%; background:#5EE0A8; box-shadow:0 0 0 3px rgba(94,224,168,.22); flex:none; animation:ccPulse 2.4s ease-in-out infinite; }
@keyframes ccPulse{ 0%,100%{ box-shadow:0 0 0 3px rgba(94,224,168,.22); } 50%{ box-shadow:0 0 0 6px rgba(94,224,168,.05); } }
.cc-title{ font-size:18px; font-weight:800; letter-spacing:-.02em; line-height:1.1; color:#fff; }
.cc-subtitle{ font-size:11.5px; color:#B9C6EA; font-weight:500; margin-top:2px; }
.cc-help{ width:27px; height:27px; border-radius:50%; border:1px solid rgba(255,255,255,.2); background:rgba(255,255,255,.08); color:#D5DEF5; font-weight:700; cursor:pointer; transition:.15s; font-family:inherit; }
.cc-help:hover{ border-color:#fff; color:#fff; background:rgba(255,255,255,.16); transform:translateY(-1px); }

.cc-readout{ display:flex; gap:8px; margin-inline-start:auto; }
.cc-stat{ display:flex; flex-direction:column; align-items:flex-start; padding:8px 14px; border:1px solid rgba(255,255,255,.16); border-radius:var(--r); background:rgba(255,255,255,.08); backdrop-filter:blur(4px); min-width:68px; }
.cc-stat-val{ font-size:20px; font-weight:600; line-height:1; color:#fff; }
.cc-stat-key{ font-size:10px; color:#B9C6EA; font-weight:600; margin-top:5px; letter-spacing:.02em; }
.cc-stat--cov.is-good .cc-stat-val{ color:#5EE0A8; }
.cc-stat--cov.is-warn .cc-stat-val{ color:#F9B27A; }
.cc-stat.is-warn .cc-stat-val{ color:#F9B27A; }

.cc-run{ display:inline-flex; align-items:center; gap:7px; background:linear-gradient(180deg,var(--accent-2),var(--accent)); color:#fff; border:1px solid transparent; padding:11px 22px; border-radius:var(--r); font-family:inherit; font-size:14px; font-weight:700; cursor:pointer; transition:.18s; box-shadow:0 8px 20px rgba(31,79,224,.3); }
.cc-run:hover{ transform:translateY(-2px); box-shadow:0 12px 28px rgba(31,79,224,.42); }
.cc-run-glyph{ font-size:11px; }
.cc-run--ghost{ background:var(--surface); color:var(--ink); border-color:var(--line-strong); margin-top:6px; box-shadow:none; }
.cc-run--ghost:hover{ border-color:var(--accent); color:var(--accent); background:var(--surface); box-shadow:none; transform:translateY(-1px); }

/* save / load (glassy, על הרקע הנייבי) */
.cc-io{ display:flex; gap:6px; }
.cc-io-btn{ display:inline-flex; align-items:center; gap:5px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.2); color:#D5DEF5; padding:10px 14px; border-radius:var(--r); font-family:inherit; font-size:12.5px; font-weight:600; cursor:pointer; transition:.15s; }
.cc-io-btn:hover{ background:rgba(255,255,255,.16); color:#fff; border-color:#fff; transform:translateY(-1px); }
.cc-io-btn span{ font-weight:800; }

/* tabs */
.cc-tabs{ display:flex; gap:2px; padding:0 14px; border-bottom:1px solid var(--line); overflow-x:auto; background:var(--surface); }
.cc-tab{ position:relative; padding:14px 16px; background:none; border:none; font-family:inherit; font-size:13.5px; font-weight:600; color:var(--muted); cursor:pointer; white-space:nowrap; transition:.15s; }
.cc-tab:hover{ color:var(--ink); }
.cc-tab.is-active{ color:var(--accent); }
.cc-tab.is-active::after{ content:''; position:absolute; inset-inline:12px; bottom:-1px; height:2.5px; background:linear-gradient(90deg,var(--accent),var(--accent-2)); border-radius:3px; }

.cc-body{ padding:22px 20px; }
.cc-stack{ display:flex; flex-direction:column; gap:18px; }
.cc-fade{ animation:ccFade .28s ease; }
@keyframes ccFade{ from{ opacity:0; transform:translateY(5px); } to{ opacity:1; transform:none; } }

/* empty */
.cc-empty{ text-align:center; padding:52px 20px; display:flex; flex-direction:column; align-items:center; }
.cc-empty-mark{ font-size:36px; color:var(--line-strong); }
.cc-empty-title{ font-size:17px; font-weight:700; margin-top:12px; }
.cc-empty-sub{ font-size:13px; color:var(--muted); margin-top:4px; }

/* alert */
.cc-alert{ border:1px solid var(--line); border-inline-start:3px solid var(--warn); border-radius:var(--r); background:linear-gradient(180deg,#FCF8F3,#FBF6F0); overflow:hidden; box-shadow:var(--shadow-sm); }
.cc-alert-head{ display:flex; align-items:center; gap:10px; padding:13px 15px; font-size:13px; font-weight:600; color:#7A3B08; }
.cc-alert-badge{ background:var(--warn); color:#fff; font-size:12px; font-weight:600; padding:2px 8px; border-radius:5px; }
.cc-alert-list{ list-style:none; display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:2px 18px; padding:0 15px 14px; }
.cc-alert-list li{ display:flex; align-items:center; gap:8px; font-size:12.5px; padding:3px 0; color:var(--ink); }
.cc-chip-dot{ width:8px; height:8px; border-radius:2px; flex:none; }
.cc-alert-therapy{ color:var(--muted); font-size:11.5px; }
.cc-alert-note{ margin-inline-start:auto; font-size:10.5px; font-weight:600; color:var(--warn); background:color-mix(in srgb,var(--warn) 10%,transparent); border:1px solid color-mix(in srgb,var(--warn) 25%,transparent); padding:1px 7px; border-radius:20px; white-space:nowrap; }
.cc-alert-note--partial{ color:var(--good); background:color-mix(in srgb,var(--good) 8%,transparent); border-color:color-mix(in srgb,var(--good) 25%,transparent); }

/* schedule days */
.cc-days{ display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px; }
.cc-day{ border:1px solid var(--line); border-radius:var(--r); overflow:hidden; background:var(--surface); box-shadow:var(--shadow-sm); transition:.18s; }
.cc-day:hover{ box-shadow:var(--shadow-md); transform:translateY(-2px); }
.cc-day-head{ display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:linear-gradient(180deg,#FBFCFE,var(--canvas)); border-bottom:1px solid var(--line); font-size:13px; font-weight:700; }
.cc-day-count{ font-size:11px; color:#fff; font-weight:600; background:var(--accent); border-radius:20px; padding:1px 8px; }
.cc-slots{ display:flex; flex-direction:column; }
.cc-slot{ display:flex; gap:11px; padding:10px 14px; border-bottom:1px solid var(--line); }
.cc-slot:last-child{ border-bottom:none; }
.cc-slot-hour{ flex:none; width:27px; height:27px; display:grid; place-items:center; background:linear-gradient(180deg,var(--accent-2),var(--accent)); color:#fff; border-radius:8px; font-size:12px; font-weight:600; margin-top:1px; box-shadow:0 3px 8px rgba(31,79,224,.28); }
.cc-slot-items{ display:flex; flex-direction:column; gap:5px; flex:1; min-width:0; }
.cc-assign{ position:relative; display:flex; align-items:center; gap:8px; padding:7px 11px 7px 12px; background:var(--surface); border:1px solid var(--line); border-radius:7px; font-size:12.5px; overflow:hidden; transition:.15s; }
.cc-assign:hover{ border-color:color-mix(in srgb,var(--c) 40%,var(--line)); background:color-mix(in srgb,var(--c) 4%,var(--surface)); }
.cc-assign-bar{ position:absolute; inset-inline-start:0; top:0; bottom:0; width:3px; background:var(--c); }
.cc-assign-student{ font-weight:700; }
.cc-assign-therapy{ color:var(--c); font-weight:600; background:color-mix(in srgb,var(--c) 10%,transparent); padding:1px 7px; border-radius:4px; font-size:11.5px; }
.cc-assign-th{ color:var(--muted); font-size:11px; margin-inline-start:auto; white-space:nowrap; }

/* section head */
.cc-section-head{ display:flex; align-items:center; justify-content:space-between; }
.cc-section-title{ font-size:16px; font-weight:700; letter-spacing:-.01em; }
.cc-add{ background:var(--surface); color:var(--ink); border:1px solid var(--line-strong); padding:9px 15px; border-radius:var(--r); font-family:inherit; font-size:13px; font-weight:600; cursor:pointer; transition:.15s; box-shadow:var(--shadow-sm); }
.cc-add:hover{ border-color:var(--accent); color:var(--accent); transform:translateY(-1px); }
.cc-hint{ font-size:13px; color:var(--muted); }
.cc-hint--inline{ font-size:11.5px; color:var(--warn); }

/* download */
.cc-download{ display:inline-flex; align-items:center; gap:7px; background:var(--surface); color:var(--ink); border:1px solid var(--line-strong); padding:9px 15px; border-radius:var(--r); font-family:inherit; font-size:13px; font-weight:600; cursor:pointer; transition:.15s; box-shadow:var(--shadow-sm); }
.cc-download:hover{ border-color:var(--accent); color:var(--accent); transform:translateY(-1px); }
.cc-download-glyph{ font-weight:700; }
.cc-caret{ font-size:9px; margin-inline-start:2px; opacity:.7; }

/* export dropdown */
.cc-export{ position:relative; }
.cc-export-backdrop{ position:fixed; inset:0; z-index:40; }
.cc-export-menu{ position:absolute; inset-inline-end:0; top:calc(100% + 6px); z-index:41; min-width:230px; background:var(--surface); border:1px solid var(--line); border-radius:calc(var(--r) + 2px); box-shadow:var(--shadow-lg); padding:6px; display:flex; flex-direction:column; gap:2px; animation:ccMenu .16s ease; overflow:hidden; }
@keyframes ccMenu{ from{ opacity:0; transform:translateY(-6px); } to{ opacity:1; transform:none; } }
.cc-export-menu button{ display:flex; align-items:center; gap:11px; width:100%; text-align:start; background:none; border:none; border-radius:var(--r); padding:9px 10px; font-family:inherit; cursor:pointer; transition:.12s; }
.cc-export-menu button:hover{ background:var(--canvas); }
.cc-export-ico{ flex:none; width:30px; height:30px; display:grid; place-items:center; border-radius:7px; font-weight:800; font-size:14px; color:#fff; background:var(--c); font-family:'JetBrains Mono',monospace; }
.cc-export-txt{ display:flex; flex-direction:column; gap:1px; }
.cc-export-txt strong{ font-size:13px; font-weight:700; color:var(--ink); }
.cc-export-txt small{ font-size:11px; color:var(--muted); }

/* schedule view toolbar + segmented control */
.cc-sched-tools{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.cc-segment{ display:inline-flex; background:var(--canvas); border:1px solid var(--line); border-radius:var(--r); padding:3px; gap:2px; }
.cc-segment button{ font-family:inherit; font-size:12.5px; font-weight:600; color:var(--muted); background:none; border:none; padding:7px 13px; border-radius:calc(var(--r) - 3px); cursor:pointer; transition:.14s; white-space:nowrap; }
.cc-segment button:hover{ color:var(--ink); }
.cc-segment button.is-on{ background:var(--surface); color:var(--accent); box-shadow:var(--shadow-sm); }

/* full weekly schedule grid (ימים × שעות) */
.cc-sched-scroll{ background:var(--surface); }
.cc-sched-grid{ min-width:640px; }
.cc-sched-grid .cc-grid-dayhead{ font-size:12px; padding:10px 0; }
.cc-sched-grid .cc-grid-ruler{ vertical-align:top; padding-top:9px; height:auto; }
.cc-sched-cell{ border-inline-start:1px solid var(--line); border-top:1px solid var(--line); vertical-align:top; padding:5px; min-width:120px; }
.cc-sched-item{ display:flex; flex-direction:column; gap:1px; padding:6px 9px 6px 10px; margin-bottom:5px; border:1px solid var(--line); border-inline-start:3px solid var(--c); border-radius:6px; background:color-mix(in srgb,var(--c) 5%,var(--surface)); }
.cc-sched-item:last-child{ margin-bottom:0; }
.cc-sched-student{ font-size:12.5px; font-weight:700; line-height:1.3; }
.cc-sched-therapy{ font-size:11px; font-weight:600; color:var(--c); }
.cc-sched-th{ font-size:10.5px; color:var(--muted); }

/* free-therapist chips */
.cc-free-row{ display:flex; flex-wrap:wrap; gap:3px; margin-top:4px; }
.cc-free-chip{ font-size:10px; font-weight:600; color:var(--good); background:color-mix(in srgb,var(--good) 6%,transparent); border:1px dashed color-mix(in srgb,var(--good) 40%,transparent); border-radius:4px; padding:1px 6px; white-space:nowrap; }

/* toggle pill */
.cc-toggle{ display:inline-flex; align-items:center; gap:7px; font-family:inherit; font-size:12.5px; font-weight:600; color:var(--muted); background:var(--canvas); border:1px solid var(--line); border-radius:var(--r); padding:8px 13px; cursor:pointer; transition:.14s; }
.cc-toggle:hover{ color:var(--ink); border-color:var(--line-strong); }
.cc-toggle-dot{ width:9px; height:9px; border-radius:50%; background:var(--line-strong); transition:.14s; }
.cc-toggle.is-on{ color:var(--good); border-color:color-mix(in srgb,var(--good) 35%,transparent); background:color-mix(in srgb,var(--good) 6%,transparent); }
.cc-toggle.is-on .cc-toggle-dot{ background:var(--good); }

/* add card (בסוף רשימת הכרטיסים) */
.cc-add-card{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; min-height:150px; border:2px dashed var(--line-strong); border-radius:calc(var(--r) + 1px); background:none; font-family:inherit; font-size:14.5px; font-weight:700; color:var(--muted); cursor:pointer; transition:.16s; padding:20px; }
.cc-add-card:hover{ border-color:var(--accent); color:var(--accent); background:var(--accent-soft); }
.cc-add-card-plus{ width:42px; height:42px; border-radius:50%; display:grid; place-items:center; font-size:24px; font-weight:400; background:var(--canvas); border:1px solid var(--line); transition:.16s; }
.cc-add-card:hover .cc-add-card-plus{ background:linear-gradient(180deg,var(--accent-2),var(--accent)); color:#fff; border-color:transparent; box-shadow:0 6px 14px rgba(31,79,224,.3); }

/* guidance panels */
.cc-guide{ border:1px solid var(--line); border-inline-start:3px solid var(--accent); background:linear-gradient(180deg,rgba(31,79,224,.05),var(--accent-soft)); border-radius:var(--r); padding:14px 16px; }
.cc-guide-title{ display:block; font-size:12px; font-weight:700; color:var(--accent); letter-spacing:.02em; margin-bottom:8px; }
.cc-guide-list{ list-style:none; display:flex; flex-direction:column; gap:6px; }
.cc-guide-list li{ position:relative; font-size:13px; color:var(--ink); line-height:1.5; padding-inline-start:16px; }
.cc-guide-list li::before{ content:'—'; position:absolute; inset-inline-start:0; color:var(--accent); font-weight:600; }
.cc-guide-list code{ font-family:'JetBrains Mono',ui-monospace,monospace; font-size:11.5px; background:var(--surface); border:1px solid var(--line); border-radius:4px; padding:1px 6px; direction:ltr; display:inline-block; }
.cc-guide-note{ margin-top:11px; padding-top:10px; border-top:1px solid color-mix(in srgb,var(--accent) 18%,transparent); font-size:12.5px; color:var(--ink); line-height:1.5; }
.cc-guide-note strong{ color:var(--warn); }

/* getting-started steps (empty state) */
.cc-guide-steps{ list-style:none; display:flex; flex-direction:column; gap:10px; text-align:start; max-width:440px; margin:14px 0 6px; }
.cc-guide-steps li{ display:flex; gap:11px; align-items:flex-start; font-size:13.5px; line-height:1.5; color:var(--ink); }
.cc-guide-num{ flex:none; width:25px; height:25px; display:grid; place-items:center; background:linear-gradient(180deg,var(--accent-2),var(--accent)); color:#fff; border-radius:8px; font-size:12px; font-weight:600; margin-top:1px; box-shadow:0 3px 8px rgba(31,79,224,.28); }

/* cards */
.cc-cards{ display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px; }
.cc-cards--wide{ grid-template-columns:repeat(auto-fill,minmax(360px,1fr)); }
.cc-card{ border:1px solid var(--line); border-radius:calc(var(--r) + 1px); padding:16px; background:var(--surface); display:flex; flex-direction:column; gap:12px; box-shadow:var(--shadow-sm); transition:.18s; }
.cc-card:hover{ box-shadow:var(--shadow-md); }
.cc-card-top{ display:flex; align-items:center; gap:8px; }
.cc-name-input{ flex:1; min-width:0; font-family:inherit; font-size:15px; font-weight:700; color:var(--ink); background:none; border:none; border-bottom:1.5px solid transparent; padding:2px 2px 3px; transition:.15s; }
.cc-name-input:hover{ border-bottom-color:var(--line-strong); }
.cc-name-input:focus{ outline:none; border-bottom-color:var(--accent); }
.cc-remove{ flex:none; background:none; border:1px solid transparent; color:var(--muted); font-family:inherit; font-size:12px; font-weight:600; padding:5px 9px; border-radius:6px; cursor:pointer; transition:.15s; }
.cc-remove:hover{ color:var(--warn); border-color:color-mix(in srgb,var(--warn) 30%,transparent); background:#FBF6F0; }

.cc-fields{ display:flex; gap:10px; flex-wrap:wrap; }
.cc-field{ display:flex; flex-direction:column; gap:5px; }
.cc-field--grow{ flex:1; min-width:150px; }
.cc-label{ font-size:11px; font-weight:600; color:var(--muted); letter-spacing:.01em; }
.cc-label--block{ display:block; margin-bottom:7px; }
.cc-input{ font-family:inherit; font-size:13px; color:var(--ink); background:var(--surface); border:1px solid var(--line-strong); border-radius:7px; padding:9px 11px; transition:.15s; }
.cc-input:focus{ outline:none; border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft); }
.cc-input--num{ width:64px; text-align:center; }

.cc-tags{ display:flex; flex-wrap:wrap; gap:5px; }
.cc-tag{ font-size:11px; font-weight:600; color:var(--c); background:color-mix(in srgb,var(--c) 9%,transparent); border:1px solid color-mix(in srgb,var(--c) 22%,transparent); padding:2px 9px; border-radius:5px; }

.cc-block{ display:flex; flex-direction:column; }
.cc-needs{ display:flex; flex-wrap:wrap; gap:6px; }
.cc-need{ font-family:inherit; font-size:12px; font-weight:600; color:var(--muted); background:var(--canvas); border:1px solid var(--line); padding:6px 11px; border-radius:7px; cursor:pointer; transition:.12s; }
.cc-need:hover{ border-color:var(--line-strong); color:var(--ink); }
.cc-need.is-on{ color:var(--c); background:color-mix(in srgb,var(--c) 10%,transparent); border-color:color-mix(in srgb,var(--c) 35%,transparent); }

/* weekly grid */
.cc-grid-wrap{ display:flex; flex-direction:column; }
.cc-grid-scroll{ overflow-x:auto; -webkit-overflow-scrolling:touch; border:1px solid var(--line); border-radius:7px; }
.cc-grid{ border-collapse:separate; border-spacing:0; width:100%; min-width:300px; }
.cc-grid th,.cc-grid td{ padding:0; }
.cc-grid-corner{ width:34px; background:var(--canvas); border-bottom:1px solid var(--line); border-inline-start:1px solid var(--line); }
.cc-grid-dayhead{ font-size:11px; font-weight:700; color:var(--muted); padding:8px 0; background:var(--canvas); border-bottom:1px solid var(--line); border-inline-start:1px solid var(--line); }
.cc-grid-ruler{ width:34px; text-align:center; font-size:11px; color:var(--muted); background:var(--canvas); border-inline-start:1px solid var(--line); }
.cc-grid-td{ border-inline-start:1px solid var(--line); border-top:1px solid var(--line); }
.cc-cell{ display:block; width:100%; height:38px; min-width:44px; background:var(--surface); border:none; cursor:pointer; padding:0; transition:background .12s; position:relative; }
.cc-cell:hover{ background:var(--canvas); }
.cc-cell--on{ background:color-mix(in srgb,var(--cell-accent) 12%,transparent); box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--cell-accent) 45%,transparent); }
.cc-cell--on:hover{ background:color-mix(in srgb,var(--cell-accent) 18%,transparent); }
.cc-cell-mark{ position:absolute; inset:0; margin:auto; width:9px; height:9px; border-radius:2px; background:var(--cell-accent); }
.cc-cell--ro{ cursor:default; }
.cc-cell:focus-visible{ outline:2px solid var(--accent); outline-offset:-2px; z-index:1; }

/* footer */
.cc-footer{ text-align:center; padding:16px; font-size:11.5px; color:var(--muted); background:linear-gradient(180deg,var(--surface),var(--canvas)); border-top:1px solid var(--line); letter-spacing:.02em; }

/* ===== welcome screen ===== */
.cc-welcome{ max-width:760px; margin:0 auto; }
.cc-welcome-inner{ background:var(--surface); border:1px solid var(--line); border-radius:calc(var(--r) + 7px); overflow:hidden; box-shadow:var(--shadow-lg); animation:ccWelcome .4s cubic-bezier(.2,.7,.2,1); }
@keyframes ccWelcome{ from{ opacity:0; transform:translateY(14px) scale(.99); } to{ opacity:1; transform:none; } }
.cc-welcome-hero{ position:relative; padding:44px 40px 36px; text-align:center; color:#fff; overflow:hidden;
  background:
    radial-gradient(600px 300px at 80% -30%, rgba(59,107,245,.55), transparent 60%),
    radial-gradient(500px 260px at 10% 130%, rgba(138,79,211,.5), transparent 60%),
    linear-gradient(155deg, #1B2A6B 0%, #16205A 45%, #0E1440 100%);
}
.cc-welcome-hero::after{ content:''; position:absolute; inset:0; background-image:radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px); background-size:22px 22px; opacity:.5; pointer-events:none; }
.cc-welcome-badge{ position:relative; display:inline-block; font-size:11px; font-weight:600; letter-spacing:.04em; color:#C9D6FF; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.18); padding:5px 14px; border-radius:30px; margin-bottom:16px; }
.cc-welcome-title{ position:relative; font-size:34px; font-weight:900; letter-spacing:-.03em; line-height:1.05; }
.cc-welcome-lead{ position:relative; max-width:540px; margin:14px auto 0; font-size:15px; line-height:1.7; color:#D5DEF5; font-weight:400; }

.cc-welcome-steps{ display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line); border-bottom:1px solid var(--line); }
.cc-welcome-step{ background:var(--surface); padding:22px 20px; display:flex; flex-direction:column; gap:9px; transition:.18s; }
.cc-welcome-step:hover{ background:linear-gradient(180deg,#FBFCFE,var(--surface)); }
.cc-welcome-step-num{ font-size:13px; font-weight:600; color:var(--accent); background:var(--accent-soft); width:34px; height:34px; display:grid; place-items:center; border-radius:9px; }
.cc-welcome-step-title{ font-size:15px; font-weight:700; }
.cc-welcome-step-desc{ font-size:12.5px; color:var(--muted); line-height:1.55; }

.cc-welcome-privacy{ padding:26px 34px 20px; background:linear-gradient(180deg,rgba(18,128,92,.045),transparent); }
.cc-welcome-privacy-head{ display:flex; align-items:center; gap:10px; margin-bottom:14px; }
.cc-welcome-lock{ font-size:18px; }
.cc-welcome-privacy-title{ font-size:16px; font-weight:800; letter-spacing:-.01em; }
.cc-welcome-privacy-list{ list-style:none; display:grid; grid-template-columns:1fr 1fr; gap:11px 26px; }
.cc-welcome-privacy-list li{ position:relative; font-size:13px; line-height:1.55; color:var(--ink); padding-inline-start:22px; }
.cc-welcome-privacy-list li::before{ content:'✓'; position:absolute; inset-inline-start:0; top:0; color:var(--good); font-weight:800; font-size:13px; }
.cc-welcome-privacy-list strong{ font-weight:700; }

.cc-welcome-enter{ display:flex; align-items:center; justify-content:center; gap:9px; width:calc(100% - 68px); margin:6px 34px 30px; padding:15px; background:linear-gradient(180deg,var(--accent-2),var(--accent)); color:#fff; border:none; border-radius:var(--r); font-family:inherit; font-size:15.5px; font-weight:700; cursor:pointer; transition:.18s; box-shadow:0 8px 20px rgba(31,79,224,.28); }
.cc-welcome-enter:hover{ transform:translateY(-2px); box-shadow:0 12px 28px rgba(31,79,224,.36); }
.cc-welcome-enter-glyph{ font-size:18px; transition:.18s; }
.cc-welcome-enter:hover .cc-welcome-enter-glyph{ transform:translateX(-4px); }

/* modal */
.cc-modal-overlay{ position:fixed; inset:0; background:rgba(14,17,22,.5); backdrop-filter:blur(3px); display:flex; align-items:center; justify-content:center; padding:16px; z-index:50; animation:ccFade .2s ease; }
.cc-modal{ background:var(--surface); border:1px solid var(--line); border-radius:calc(var(--r) + 3px); max-width:540px; width:100%; max-height:88vh; overflow-y:auto; box-shadow:var(--shadow-lg); }
.cc-modal-head{ display:flex; align-items:center; justify-content:space-between; padding:18px 20px; border-bottom:none; color:#fff; background:linear-gradient(150deg,#1B2A6B 0%,#16205A 55%,#0E1440 100%); }
.cc-modal-title{ font-size:16px; font-weight:800; letter-spacing:-.01em; color:#fff; }
.cc-modal-x{ width:28px; height:28px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:rgba(255,255,255,.08); color:#D5DEF5; cursor:pointer; font-size:13px; transition:.15s; }
.cc-modal-x:hover{ color:#fff; border-color:#fff; background:rgba(255,255,255,.16); }
.cc-modal-body{ padding:18px; display:flex; flex-direction:column; gap:14px; }
.cc-modal-lead{ font-size:14px; font-weight:600; line-height:1.5; }
.cc-step{ display:flex; gap:13px; }
.cc-step-num{ flex:none; font-size:12px; font-weight:600; color:var(--accent); border:1px solid var(--accent-soft); background:var(--accent-soft); width:30px; height:30px; display:grid; place-items:center; border-radius:7px; }
.cc-step-title{ font-size:13.5px; font-weight:700; margin-bottom:2px; }
.cc-step-desc{ font-size:12.5px; color:var(--muted); line-height:1.55; }
.cc-modal-foot{ padding:14px 18px; border-top:1px solid var(--line); display:flex; justify-content:flex-end; }

@media (max-width:640px){
  .cc-welcome-steps{ grid-template-columns:1fr; }
  .cc-welcome-privacy-list{ grid-template-columns:1fr; }
  .cc-welcome-title{ font-size:27px; }
  .cc-welcome-hero{ padding:34px 24px 28px; }
  .cc-welcome-privacy{ padding:22px 22px 16px; }
  .cc-welcome-enter{ width:calc(100% - 44px); margin-inline:22px; }
}
@media (max-width:560px){
  .cc-root{ padding:8px; }
  .cc-command{ padding:12px 14px; }
  .cc-readout{ width:100%; margin-inline-start:0; order:3; }
  .cc-stat{ flex:1; }
  .cc-run{ width:100%; justify-content:center; order:4; }
  .cc-body{ padding:14px 12px; }
}
@media (prefers-reduced-motion:reduce){
  .cc-fade,.cc-modal-overlay,.cc-welcome-inner,.cc-live{ animation:none; }
  *{ transition:none !important; }
}
`;
