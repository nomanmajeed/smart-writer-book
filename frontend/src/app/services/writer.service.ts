import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WriterService {
  private apiUrl = `${environment.apiUrl}/api/documents`;

  constructor(private http: HttpClient) {}

  async createDocument(title: string, content: string) {
    return this.http.post(this.apiUrl, { title, content }).toPromise();
  }

  async getAISuggestions(content: string) {
    const document = await this.createDocument('Untitled', content);
    return this.http.post(`${this.apiUrl}/${(document as any).id}/get_ai_suggestions`, {})
      .toPromise() as Promise<{ suggestion: string }>;
  }
}
