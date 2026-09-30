import api from './api.js';

export const visionService = {
  /**
   * Analyze image (from camera snapshot base64 or file upload)
   */
  async analyzeVision({ file, imageBase64, language = 'en', guestId, capturedViaCamera = false, fileName }) {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);
      if (guestId) formData.append('guestId', guestId);
      formData.append('capturedViaCamera', String(capturedViaCamera));
      if (fileName) formData.append('fileName', fileName);

      const res = await api.post('/vision/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } else {
      const res = await api.post('/vision/analyze', {
        imageBase64,
        language,
        guestId,
        capturedViaCamera,
        fileName,
      });
      return res.data;
    }
  },

  /**
   * Ask contextual question about analyzed scene/document
   */
  async askVisionQuestion({ sessionId, question, visionContext, language = 'en', isVoiceCommand = false }) {
    const res = await api.post('/vision/question', {
      sessionId,
      question,
      visionContext,
      language,
      isVoiceCommand,
    });
    return res.data;
  },

  /**
   * Step-by-step smart guidance through detected form fields in plain language
   */
  async guideForm({ sessionId, fields, currentFieldIndex = 0, language = 'en' }) {
    const res = await api.post('/vision/form-guide', {
      sessionId,
      fields,
      currentFieldIndex,
      language,
    });
    return res.data;
  },

  /**
   * Get previous vision sessions
   */
  async getVisionSessions(guestId) {
    const res = await api.get('/vision/sessions', {
      params: { guestId },
    });
    return res.data;
  },

  /**
   * Get single vision session by ID
   */
  async getVisionSessionById(id) {
    const res = await api.get(`/vision/sessions/${id}`);
    return res.data;
  },

  /**
   * Delete a vision session
   */
  async deleteVisionSession(id) {
    const res = await api.delete(`/vision/sessions/${id}`);
    return res.data;
  },

  /**
   * Get instant sample document analysis for immediate testing
   */
  async getVisionSample(language = 'en') {
    const res = await api.get('/vision/sample', {
      params: { language },
    });
    return res.data;
  },
};

export default visionService;
