/**
 * Code.gs - Entry Point & Router Web App Google Apps Script
 * SI-TABUNGAN (Sistem Informasi Tabungan Siswa)
 *
 * Menerima request HTTP GET & POST dari frontend React dan merespons dalam format JSON
 */

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || 'ping';

    let result;

    switch (action) {
      case 'ping':
        result = {
          success: true,
          message: 'SI-TABUNGAN API Backend Google Apps Script aktif!',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        };
        break;

      case 'getSummary':
        result = { success: true, data: getDashboardSummary() };
        break;

      case 'getStudents':
        result = {
          success: true,
          data: getStudentsList({
            classId: params.classId,
            status: params.status,
            search: params.search
          })
        };
        break;

      case 'getStudentById':
        result = { success: true, data: getStudentById(params.id) };
        break;

      case 'getClasses':
        result = { success: true, data: getClassesList() };
        break;

      case 'getTransactions':
        result = {
          success: true,
          data: getTransactionsList({
            studentId: params.studentId,
            classId: params.classId,
            startDate: params.startDate,
            endDate: params.endDate
          })
        };
        break;

      case 'getWithdrawals':
        result = {
          success: true,
          data: getWithdrawalsList({
            studentId: params.studentId,
            classId: params.classId,
            startDate: params.startDate,
            endDate: params.endDate
          })
        };
        break;

      case 'getAuditLogs':
        result = { success: true, data: getAuditLogs(params.limit || 100) };
        break;

      case 'getStudentMutation':
        result = {
          success: true,
          data: getStudentMutationReport(params.studentId, params.startDate, params.endDate)
        };
        break;

      default:
        result = { success: false, error: 'Action GET tidak dikenali: ' + action };
    }

    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.message || error.toString()
    });
  }
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;
    const actor = payload.actor || 'SYSTEM';
    let result;

    switch (action) {
      case 'setupDatabase':
        result = setupDatabase();
        break;

      case 'login':
        result = authenticateUser(payload.username, payload.password);
        break;

      case 'createStudent':
        result = { success: true, data: createStudent(payload.data, actor) };
        break;

      case 'updateStudent':
        result = updateStudent(payload.id, payload.data, actor);
        break;

      case 'createClass':
        result = { success: true, data: createClass(payload.data, actor) };
        break;

      case 'updateClass':
        result = updateClass(payload.id, payload.data, actor);
        break;

      case 'recordDeposit':
        result = recordDeposit(payload.data, actor);
        break;

      case 'recordWithdrawal':
        result = recordWithdrawal(payload.data, actor);
        break;

      case 'importStudents':
        result = batchImportStudents(payload.data, actor);
        break;

      default:
        result = { success: false, error: 'Action POST tidak dikenali: ' + action };
    }

    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.message || error.toString()
    });
  }
}

/**
 * Membungkus output response ke JSON dengan MIME type application/json
 */
function createJsonResponse(data) {
  const output = JSON.stringify(data);
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}
