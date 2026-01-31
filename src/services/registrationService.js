import { openDB } from 'idb';

const DB_NAME = 'SydenhamRegistrationDB';
const DB_VERSION = 1;
const STORE_NAME = 'submissions';

const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

export const saveSubmission = async (formData) => {
  try {
    const db = await initDB();
    const submission = {
      ...formData,
      timestamp: new Date().toISOString(),
    };
    await db.add(STORE_NAME, submission);
    return true;
  } catch (error) {
    console.error('Error saving submission:', error);
    return false;
  }
};

export const getAllSubmissions = async () => {
  try {
    const db = await initDB();
    return await db.getAll(STORE_NAME);
  } catch (error) {
    console.error('Error getting submissions:', error);
    return [];
  }
};

export const downloadSubmissionsAsCSV = async () => {
  const submissions = await getAllSubmissions();
  if (submissions.length === 0) {
    alert('No submissions found to export.');
    return;
  }

  const headers = [
    'ID',
    'Name',
    'Email',
    'Member Status',
    'Profession',
    'Work Description',
    'Tools Used',
    'Problems Faced',
    'Timestamp'
  ];

  const csvRows = [
    headers.join(','),
    ...submissions.map(sub => [
      sub.id,
      `"${sub.name.replace(/"/g, '""')}"`,
      `"${sub.email.replace(/"/g, '""')}"`,
      `"${sub.memberStatus.replace(/"/g, '""')}"`,
      `"${sub.profession.replace(/"/g, '""')}"`,
      `"${sub.workDescription.replace(/"/g, '""')}"`,
      `"${sub.toolsUsed.replace(/"/g, '""')}"`,
      `"${sub.problemsFaced.replace(/"/g, '""')}"`,
      sub.timestamp
    ].join(','))
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `sydenham_registrations_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
