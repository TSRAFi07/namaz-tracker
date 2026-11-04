
"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register fonts
Font.register({
  family: "NotoSansBengali",
  src: "/fonts/NotoSansBengali-Regular.ttf",
});

Font.register({
  family: "NotoNaskhArabic",
  src: "/fonts/NotoNaskhArabic-Regular.ttf",
});

// Report data types
export type DailyReportData = {
  fullName: string;
  englishDate: string;
  banglaDate: string;
  hijriDate: string;

  weekdayEnglish: string;
  weekdayBangla: string;
  weekdayArabic: string;

  prayers: {
    name: string;
    status: string;
  }[];

  prayerTimes: {
  name: string;
  start: string;
  end: string;
}[];

  amals: {
    name: string;
    completed: boolean;
  }[];

  ayahBn: string;
  ayahRef: string;

  hadithBn: string;
  hadithRef: string;

  quranLogs: {
    activityType: string;
    surahName: string;
    startAyah: number;
    endAyah: number;
    pages: number;
  }[];

  progress: number;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 35,
    paddingHorizontal: 35,
    fontFamily: "NotoSansBengali",
    fontSize: 10,
    color: "#26352d",
    backgroundColor: "#ffffff",
  },

  header: {
    backgroundColor: "#075b46",
    padding: 22,
    borderRadius: 8,
    marginBottom: 18,
  },

  title: {
    fontSize: 19,
    color: "#ffffff",
    marginBottom: 7,
  },

  subtitle: {
    fontSize: 9,
    color: "#d1fae5",
  },

  section: {
    marginBottom: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5eee8",
    borderRadius: 6,
  },

  sectionTitle: {
    fontSize: 12,
    color: "#087653",
    marginBottom: 9,
  },

  text: {
    fontSize: 9,
    lineHeight: 1.8,
    marginBottom: 4,
  },

  dateText: {
    fontSize: 9,
    lineHeight: 1.8,
    color: "#ffffff",
  },

  prayerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5eee8",
  },

  amalRow: {
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5eee8",
  },

  progressBox: {
    backgroundColor: "#e9f6ef",
    padding: 13,
    borderRadius: 6,
    marginBottom: 14,
  },

  progressTitle: {
    fontSize: 11,
    color: "#075b46",
    marginBottom: 5,
  },

  progressValue: {
    fontSize: 21,
    color: "#075b46",
  },

  footer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5eee8",
    textAlign: "center",
    fontSize: 8,
    color: "#84928a",
  },

  arabic: {
    fontFamily: "NotoNaskhArabic",
    fontSize: 12,
  },
});

export default function DailyReportPDF({
  report,
}: {
  report: DailyReportData;
}) {
  return (
    <Document
      title={`Daily Islamic Activity ${report.englishDate} Report`}
      author="My Salah Tracker"
    >
      <Page size="A4" style={styles.page} wrap>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Daily Islamic Activity Report
          </Text>

          <Text style={styles.subtitle}>
            My Salah Tracker
          </Text>

          <View style={{ marginTop: 12 }}>
            <Text style={styles.dateText}>
              Name: {report.fullName}
            </Text>

            <Text style={styles.dateText}>
              Date: {report.englishDate}
            </Text>

            <Text style={styles.dateText}>
              বাংলা তারিখ: {report.banglaDate}
            </Text>

            <Text style={styles.dateText}>
              হিজরি তারিখ: {report.hijriDate}
            </Text>

            <Text style={styles.dateText}>
              Weekday: {report.weekdayEnglish} | {report.weekdayBangla}
            </Text>

            <Text style={styles.arabic}>
              {report.weekdayArabic}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressBox}>
          <Text style={styles.progressTitle}>
            Daily Overall Progress
          </Text>

          <Text style={styles.progressValue}>
            {report.progress}%
          </Text>

          <Text style={styles.text}>
            Based on five daily prayers and six daily amals.
          </Text>
        </View>

        {/* Prayer Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            1. Five Daily Prayers
          </Text>

          {report.prayers.map((prayer, index) => (
            <View style={styles.prayerRow} key={index}>
              <Text style={styles.text}>
                {prayer.name}
              </Text>

              <Text style={styles.text}>
                {prayer.status}
              </Text>
            </View>
          ))}
        </View>

        {/* Daily Amals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            2. Daily Amals
          </Text>

          {report.amals.map((amal, index) => (
            <View style={styles.amalRow} key={index}>
              <Text style={styles.text}>
                {amal.completed ? "[Completed]" : "[Not Completed]"}{" "}
                {amal.name}
              </Text>
            </View>
          ))}
        </View>

        {/* Ayah */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            3. Ayah of the Day
          </Text>

          <Text style={styles.text}>
            {report.ayahBn}
          </Text>

          <Text style={styles.text}>
            Reference: {report.ayahRef}
          </Text>
        </View>

        {/* Hadith */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            4. Hadith of the Day
          </Text>

          <Text style={styles.text}>
            {report.hadithBn}
          </Text>

          <Text style={styles.text}>
            Reference: {report.hadithRef}
          </Text>
        </View>

        {/* Quran Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            5. Quran Reading & Memorization
          </Text>

          {report.quranLogs.length === 0 ? (
            <Text style={styles.text}>
              No Quran activity recorded for this day.
            </Text>
          ) : (
            report.quranLogs.map((log, index) => (
              <View key={index} style={{ marginBottom: 7 }}>
                <Text style={styles.text}>
                  Activity: {log.activityType}
                </Text>

                <Text style={styles.text}>
                  Surah: {log.surahName}
                </Text>

                <Text style={styles.text}>
                  Ayah: {log.startAyah} - {log.endAyah}
                </Text>

                {log.activityType === "Reading" && (
                  <Text style={styles.text}>
                    Pages Read: {log.pages}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          My Salah Tracker | Daily Islamic Activity Report
        </Text>

      </Page>
    </Document>
  );
}
