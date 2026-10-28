/**
 * Audit.gs - Pencatatan Jejak Audit (Audit Trail)
 * Merekam setiap aksi mutasi saldo, perubahan data siswa, otentikasi, dll.
 */

function recordAuditLog(actor, action, entity, entityId, details) {
  try {
    const logEntry = {
      id: generateId('AUD'),
      timestamp: Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss"),
      actor: actor || 'SYSTEM',
      action: action, // CREATE, UPDATE, DELETE, SETORAN, PENARIKAN, LOGIN
      entity: entity, // STUDENT, TRANSACTION, WITHDRAWAL, USER, CLASS
      entityId: String(entityId || ''),
      details: typeof details === 'object' ? JSON.stringify(details) : String(details || '')
    };

    appendSheetRow(SHEET_NAMES.AUDIT_LOGS, logEntry);
    return logEntry;
  } catch (err) {
    Logger.log('Gagal mencatat audit log: ' + err.toString());
    return null;
  }
}

function getAuditLogs(limit) {
  const logs = readSheetRows(SHEET_NAMES.AUDIT_LOGS);
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (limit && Number(limit) > 0) {
    return logs.slice(0, Number(limit));
  }
  return logs;
}
