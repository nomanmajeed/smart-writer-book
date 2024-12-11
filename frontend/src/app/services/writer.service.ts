import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, from, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Delta } from 'quill';

export interface Document {
  id: string;
  title: string;
  content: Delta;
  updatedAt: Date;
}

export interface AISuggestion {
  suggestion: string;
  type?: string;
  confidence?: number;
}

@Injectable({
  providedIn: 'root'
})
export class WriterService {
  private apiUrl = `${environment.apiUrl}/api/documents/`;
  public documentUpdates = new Subject<void>();

  documentUpdates$ = this.documentUpdates.asObservable();
  private documents: Document[] = [];

  constructor(private http: HttpClient) {}

  // Document CRUD Operations
  getDocuments(): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.apiUrl}`).pipe(
      tap(docs => {
        this.documents = docs;
      })
    );
  }

  getDocument(id: string): Observable<Document> {
    return this.http.get<Document>(`${this.apiUrl}${id}/`);
  }

  async createDocument(title: string = 'Untitled', content: Delta) {
    try {
      // Convert Delta to plain object and ensure it's properly formatted
      const formattedContent = {
        ops: content.ops.map(op => ({
          insert: op.insert,
          ...(op.attributes && { attributes: op.attributes })
        }))
      };

      const result = await this.http.post<Document>(`${this.apiUrl}`, {
        title,
        content: formattedContent
      }).toPromise();

      if (result) {
        this.documents = [result, ...this.documents];
        this.documentUpdates.next();
      }
      
      return result;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  updateDocument(id: string, data: Partial<Document>): Observable<Document> {
    return this.http.patch<Document>(`${this.apiUrl}${id}/`, data)
      .pipe(
        tap(updatedDoc => {
          const index = this.documents.findIndex(d => d.id === id);
          if (index !== -1) {
            this.documents[index] = { ...this.documents[index], ...updatedDoc };
            this.documentUpdates.next();
          }
        })
      );
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`)
      .pipe(
        tap(() => {
          this.documents = this.documents.filter(d => d.id !== id);
          this.documentUpdates.next();
        })
      );
  }

  // AI Suggestions
  async getAISuggestions(content: Delta): Promise<{ suggestion: string }> {
    const document = await this.createDocument('Untitled', content);
    return this.http.post(`${this.apiUrl}${(document as any).id}/get_ai_suggestions/`, {})
      .toPromise() as Promise<{ suggestion: string }>;
  }

  // Optional: Add methods for specific suggestion types if needed
  getGrammarCheck(text: string): Observable<AISuggestion[]> {
    return this.http.post<AISuggestion[]>(`${environment.apiUrl}/api/ai/grammar/`, { text });
  }

  getContentSuggestions(text: string): Observable<AISuggestion[]> {
    return this.http.post<AISuggestion[]>(`${environment.apiUrl}/api/ai/suggestions/`, { text });
  }

  getWordAnalysis(word: string): Observable<AISuggestion[]> {
    return this.http.get<AISuggestion[]>(`${environment.apiUrl}/api/ai/word-analysis/${word}/`);
  }

  // Helper method to convert Promise to Observable if needed
  private toObservable<T>(promise: Promise<T>): Observable<T> {
    return from(promise);
  }
}