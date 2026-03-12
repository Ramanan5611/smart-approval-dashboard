import { User, RequestItem, RequestStage, RequestStatus, LogEntry } from '../types';

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.details 
          ? `${errorData.message}: ${errorData.details}` 
          : (errorData.message || `HTTP error! status: ${response.status}`);
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Authentication
  async login(username: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    this.setToken(data.token);
    return data.user;
  }

  async register(userData: {
    username: string;
    password: string;
    role: string;
    name: string;
  }) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    this.setToken(data.token);
    return data.user;
  }

  // Requests
  async getRequests(): Promise<RequestItem[]> {
    return this.request('/requests');
  }

  async getApprovers(): Promise<any[]> {
    return this.request('/approvers');
  }

  async createRequest(requestData: any): Promise<RequestItem> {
    return this.request('/requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async updateRequest(requestId: string, action: 'approve' | 'reject', comment?: string): Promise<RequestItem> {
    return this.request(`/requests/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify({ action, comment }),
    });
  }

  async getAllUsers(): Promise<any[]> {
    return this.request('/users');
  }

  async createUser(userData: { name: string; username: string; role: string; password: string }): Promise<any> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, userData: Partial<any>): Promise<any> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<any> {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<any> {
    return this.request(`/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  }

  async getAppointments(): Promise<any[]> {
    return this.request('/appointments');
  }

  async createAppointment(appointmentData: any): Promise<any> {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  // Database Introspection
  async getDatabaseCollections(): Promise<string[]> {
    return this.request('/database/collections');
  }

  async getCollectionData(collectionName: string): Promise<any[]> {
    return this.request(`/database/collections/${collectionName}`);
  }
}

export const apiService = new ApiService();
