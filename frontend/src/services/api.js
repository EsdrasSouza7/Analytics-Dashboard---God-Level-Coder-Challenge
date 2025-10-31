const API_URL = 'http://localhost:3001/api';

export const api = {
  async getMetrics(filters) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_URL}/metrics?${params}`);
    return res.json();
  },

  async getRevenueTimeline(filters) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_URL}/revenue-timeline?${params}`);
    return res.json();
  },

  async getTopProducts(filters) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_URL}/top-products?${params}`);
    return res.json();
  },

  async getChannelDistribution(filters) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_URL}/channel-distribution?${params}`);
    return res.json();
  }
};