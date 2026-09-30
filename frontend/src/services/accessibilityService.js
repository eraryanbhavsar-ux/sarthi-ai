import api from './api.js';

export const accessibilityService = {
  async analyzeContent({ file, text, title, language = 'en', guestId }) {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      if (title) formData.append('title', title);
      formData.append('language', language);
      if (guestId) formData.append('guestId', guestId);

      const res = await api.post('/accessibility/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } else {
      const res = await api.post('/accessibility/analyze', {
        text,
        title,
        language,
        guestId,
      });
      return res.data;
    }
  },

  async askQuestion({ sessionId, question, language = 'en' }) {
    const res = await api.post('/accessibility/question', {
      sessionId,
      question,
      language,
    });
    return res.data;
  },

  async translateContent({ sessionId, targetLanguage }) {
    const res = await api.post('/accessibility/translate', {
      sessionId,
      targetLanguage,
    });
    return res.data;
  },

  async simplifyContent({ sessionId, level = 'evenSimpler' }) {
    const res = await api.post('/accessibility/simplify', {
      sessionId,
      level,
    });
    return res.data;
  },

  async describeImage({ file }) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/accessibility/describe-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async getSampleData(guestId) {
    const res = await api.get('/accessibility/sample', {
      params: { guestId },
    });
    return res.data;
  },

  async processVoice({ transcript, sessionId, language = 'en' }) {
    const res = await api.post('/accessibility/voice', {
      transcript,
      sessionId,
      language,
    });
    return res.data;
  },

  async getSessions(guestId) {
    const res = await api.get('/sessions', {
      params: { guestId },
    });
    return res.data;
  },

  async getSessionById(id) {
    const res = await api.get(`/sessions/${id}`);
    return res.data;
  },

  async updateChecklist(sessionId, actionId, completed) {
    const res = await api.patch(`/sessions/${sessionId}/checklist`, {
      actionId,
      completed,
    });
    return res.data;
  },

  async deleteSession(sessionId) {
    const res = await api.delete(`/sessions/${sessionId}`);
    return res.data;
  },

  async getUserStats() {
    const res = await api.get('/sessions/stats');
    return res.data;
  },
};
