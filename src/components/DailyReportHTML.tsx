
"use client";

import type { DailyReportData } from "@/components/DailyReportPDF";

export default function DailyReportHTML({
  report,
}: {
  report: DailyReportData;
}) {
  const completedPrayers = report.prayers.filter(
    (p) => p.status === "Jamaat" || p.status === "Alone"
  ).length;

  const completedAmals = report.amals.filter(
    (a) => a.completed
  ).length;

  function statusStyle(status: string) {
    if (status === "Jamaat") return "status-jamaat";
    if (status === "Alone") return "status-alone";
    if (status === "Missed") return "status-missed";
    return "status-pending";
  }

  return (
    <div className="print-report">
      <style jsx global>{`
        @font-face {
          font-family: "NotoBangla";
          src: url("/fonts/NotoSansBengali-Regular.ttf");
        }

        @font-face {
          font-family: "NotoArabic";
          src: url("/fonts/NotoNaskhArabic-Regular.ttf");
        }

        .print-report {
          font-family: "NotoBangla", sans-serif;
          color: #26352d;
          background: #f5faf6;
          padding: 28px;
          max-width: 850px;
          margin: 30px auto;
          border-radius: 18px;
        }

        .print-report * {
          box-sizing: border-box;
        }

        .print-report .report-header {
          background: linear-gradient(135deg, #064e3b, #087653, #0f766e);
          color: white;
          padding: 30px;
          border-radius: 16px;
          margin-bottom: 22px;
          position: relative;
          overflow: hidden;
        }

        .print-report .header-label {
          color: #a7f3d0;
          font-size: 11px;
          letter-spacing: 2px;
          margin-bottom: 8px;
        }

        .print-report .report-header h1 {
          font-size: 26px;
          font-weight: bold;
          margin-bottom: 7px;
        }

        .print-report .header-info {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #ffffff35;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .print-report .header-info p {
          color: #ecfdf5;
          font-size: 12px;
          line-height: 1.9;
          margin: 0;
        }

        .print-report .arabic {
          font-family: "NotoArabic", serif;
          font-size: 19px;
          direction: rtl;
        }

        .print-report .progress-card {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          padding: 22px;
          border-radius: 14px;
          margin-bottom: 22px;
        }

        .print-report .progress-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .print-report .progress-number {
          color: #047857;
          font-size: 32px;
          font-weight: bold;
        }

        .print-report .progress-track {
          width: 100%;
          height: 11px;
          background: #d1fae5;
          border-radius: 20px;
          overflow: hidden;
          margin-top: 13px;
        }

        .print-report .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #059669, #10b981);
          border-radius: 20px;
        }

        .print-report .progress-note {
          font-size: 11px;
          color: #047857;
          margin-top: 9px;
        }

        .print-report .section {
          background: white;
          border: 1px solid #e2eee7;
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 18px;
          box-shadow: 0 3px 12px #064e3b0a;
        }

        .print-report .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #065f46;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5eee8;
        }

        .print-report .section-number {
          background: #d1fae5;
          color: #047857;
          width: 30px;
          height: 30px;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .print-report .prayer-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .print-report .prayer-card {
          border: 1px solid #e5eee8;
          border-radius: 11px;
          padding: 13px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .print-report .prayer-name {
          font-size: 13px;
          font-weight: bold;
          color: #334155;
        }

        .print-report .prayer-times-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .print-report .prayer-time-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 15px;
          background: #f0fdf4;
          border: 1px solid #d1fae5;
          border-radius: 11px;
        }

        .print-report .prayer-time-name {
          font-size: 13px;
          font-weight: bold;
          color: #065f46;
          min-width: 75px;
        }

        .print-report .prayer-time-values {
          display: flex;
          gap: 24px;
        }

        .print-report .time-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .print-report .time-label {
          font-size: 9px;
          color: #64748b;
        }

        .print-report .time-value {
          font-size: 12px;
          font-weight: bold;
          color: #047857;
        }

        .print-report .status {
          display: inline-block;
          padding: 6px 10px;
          border-radius: 30px;
          font-size: 10px;
          font-weight: bold;
          white-space: nowrap;
        }

        .print-report .status-jamaat {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        }

        .print-report .status-alone {
          background: #dbeafe;
          color: #1d4ed8;
          border: 1px solid #93c5fd;
        }

        .print-report .status-missed {
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
        }

        .print-report .status-pending {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
        }

        .print-report .amal-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .print-report .amal-card {
          padding: 13px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          line-height: 1.8;
        }

        .print-report .amal-done {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
        }

        .print-report .amal-pending {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          color: #9a3412;
        }

        .print-report .amal-icon {
          font-size: 18px;
          font-weight: bold;
        }

        .print-report .quote-card {
          background: #f0fdf4;
          border-left: 4px solid #059669;
          padding: 17px;
          border-radius: 8px;
        }

        .print-report .quote-card p {
          font-size: 13px;
          line-height: 2.1;
          color: #334155;
        }

        .print-report .reference {
          color: #047857;
          font-size: 11px;
          font-weight: bold;
          margin-top: 10px;
        }

        .print-report .hadith-card {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 17px;
          border-radius: 8px;
        }

        .print-report .hadith-card .reference {
          color: #1d4ed8;
        }

        .print-report .quran-card {
          background: #faf5ff;
          border: 1px solid #e9d5ff;
          border-radius: 11px;
          padding: 15px;
          margin-bottom: 10px;
        }

        .print-report .quran-card p {
          font-size: 12px;
          line-height: 1.9;
        }

        .print-report .empty-message {
          background: #f8fafc;
          color: #64748b;
          padding: 15px;
          border-radius: 10px;
          font-size: 12px;
        }

        .print-report .summary-strip {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 18px;
        }

        .print-report .summary-item {
          background: white;
          border: 1px solid #e2eee7;
          padding: 15px;
          border-radius: 12px;
          text-align: center;
        }

        .print-report .summary-item strong {
          display: block;
          color: #047857;
          font-size: 22px;
        }

        .print-report .summary-item span {
          color: #64748b;
          font-size: 11px;
        }

        .print-report .report-footer {
          text-align: center;
          color: #64748b;
          font-size: 10px;
          border-top: 1px solid #dce9e1;
          padding-top: 18px;
          margin-top: 25px;
        }

        .print-report .print-button {
          background: #075b46;
          color: white;
          padding: 13px 22px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-weight: bold;
          cursor: pointer;
        }

        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          html, body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }

          .print-report,
          .print-report * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: none;
            margin: 0;
            padding: 0;
            background: white;
            border-radius: 0;
          }

          .print-report .no-print {
            display: none !important;
          }

          .print-report .section,
          .print-report .progress-card,
          .print-report .summary-item,
          .print-report .prayer-card,
          .print-report .prayer-time-row,
          .print-report .amal-card,
          .print-report .quran-card,
          .print-report .quote-card,
          .print-report .hadith-card {
            break-inside: avoid;
          }

          .print-report .report-header,
          .print-report .progress-card,
          .print-report .quote-card,
          .print-report .hadith-card,
          .print-report .status,
          .print-report .amal-card,
          .print-report .quran-card,
          .print-report .prayer-time-row {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
        }

        @media screen and (max-width: 600px) {
          .print-report {
            padding: 14px;
          }

          .print-report .prayer-list,
          .print-report .amal-list {
            grid-template-columns: 1fr;
          }

          .print-report .header-info {
            grid-template-columns: 1fr;
          }

          .print-report .prayer-time-values {
            gap: 14px;
          }
        }
      `}</style>

      <div className="no-print">
        <button
          className="print-button"
          onClick={() => {
            document.title = `Daily Islamic Activity ${report.englishDate} Report`;
            window.print();
          }}
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="report-header">
        <div className="header-label">MY SALAH TRACKER</div>

        <h1>Daily Islamic Activity Report</h1>

        <p style={{ color: "#d1fae5", fontSize: 12 }}>
          A record of your daily spiritual journey
        </p>

        <div className="header-info">
          <p>Name: {report.fullName}</p>
          <p>Date: {report.englishDate}</p>
          <p>বাংলা তারিখ: {report.banglaDate}</p>
          <p>হিজরি তারিখ: {report.hijriDate}</p>
          <p>Weekday: {report.weekdayEnglish}</p>
          <p>বার: {report.weekdayBangla}</p>
          <p className="arabic">{report.weekdayArabic}</p>
        </div>
      </div>

      <div className="progress-card">
        <div className="progress-top">
          <div>
            <h2 style={{ color: "#065f46", fontSize: 16 }}>
              Daily Overall Progress
            </h2>
            <p style={{ color: "#047857", fontSize: 11 }}>
              Your daily consistency
            </p>
          </div>

          <div className="progress-number">{report.progress}%</div>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(100, Math.max(0, report.progress))}%`,
            }}
          />
        </div>

        <p className="progress-note">
          Based on five daily prayers and six daily amals.
        </p>
      </div>

      <div className="summary-strip">
        <div className="summary-item">
          <strong>{completedPrayers}/5</strong>
          <span>Prayers Completed</span>
        </div>

        <div className="summary-item">
          <strong>{completedAmals}/6</strong>
          <span>Daily Amals Completed</span>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">
          <span className="section-number">01</span>
          Five Daily Prayers
        </h2>

        <div className="prayer-list">
          {report.prayers.map((prayer, index) => (
            <div className="prayer-card" key={index}>
              <span className="prayer-name">{prayer.name}</span>
              <span className={`status ${statusStyle(prayer.status)}`}>
                {prayer.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">
          <span className="section-number">02</span>
          Prayer Times
        </h2>

        <div className="prayer-times-list">
          {(report.prayerTimes ?? []).map((prayer, index) => (
            <div className="prayer-time-row" key={index}>
              <span className="prayer-time-name">{prayer.name}</span>

              <div className="prayer-time-values">
                <div className="time-item">
                  <span className="time-label">শুরু</span>
                  <span className="time-value">
                    {prayer.start || "--:--"}
                  </span>
                </div>

                <div className="time-item">
                  <span className="time-label">শেষ</span>
                  <span className="time-value">
                    {prayer.end || "--:--"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">
          <span className="section-number">03</span>
          Daily Amals
        </h2>

        <div className="amal-list">
          {report.amals.map((amal, index) => (
            <div
              className={`amal-card ${
                amal.completed ? "amal-done" : "amal-pending"
              }`}
              key={index}
            >
              <span className="amal-icon">
                {amal.completed ? "✓" : "○"}
              </span>

              <span>
                {amal.name}
                <br />
                <strong>
                  {amal.completed ? "Completed" : "Not Completed"}
                </strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">
          <span className="section-number">04</span>
          Ayah of the Day
        </h2>

        <div className="quote-card">
          <p>{report.ayahBn}</p>
          <div className="reference">
            Reference: {report.ayahRef}
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">
          <span className="section-number">05</span>
          Hadith of the Day
        </h2>

        <div className="hadith-card">
          <p>{report.hadithBn}</p>
          <div className="reference">
            Reference: {report.hadithRef}
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">
          <span className="section-number">06</span>
          Quran Reading & Memorization
        </h2>

        {report.quranLogs.length === 0 ? (
          <div className="empty-message">
            No Quran activity recorded for this day.
          </div>
        ) : (
          report.quranLogs.map((log, index) => (
            <div className="quran-card" key={index}>
              <p>
                <strong>Activity:</strong> {log.activityType}
              </p>

              <p>
                <strong>Surah:</strong> {log.surahName}
              </p>

              <p>
                <strong>Ayah:</strong> {log.startAyah} - {log.endAyah}
              </p>

              {log.activityType === "Reading" && (
                <p>
                  <strong>Pages Read:</strong> {log.pages}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <div className="report-footer">
        My Salah Tracker
        <br />
        Make every prayer a step towards consistency.
      </div>
    </div>
  );
}
